# skyphusion-net

Engineering blog of [Conrad Rockenhaus](https://github.com/skyphusion) at **https://skyphusion.net**. Astro 7 site, markdown-authored, prerendered to static HTML, served from a Cloudflare Worker.

## What ships today vs wishlist

| Feature | Status | Where it lives |
| --- | --- | --- |
| Astro 7 static blog | **Installed** | `src/content/blog/`, `src/pages/blog/` |
| Tag index + per-tag pages | **Installed** | `/blog/tags/`, `/blog/tags/<tag>/` |
| Projects hub (curated list) | **Installed** | `/projects/`, `src/lib/projects.ts` |
| RSS | **Installed** | `/rss.xml` |
| XML sitemap + per-post `lastmod` | **Installed** | `/sitemap-index.xml`, `scripts/post-lastmod.mjs` |
| SEO (canonical, OG/Twitter, JSON-LD) | **Installed** | `src/lib/seo.ts`, `BaseLayout.astro` |
| Related posts (tag overlap) | **Installed** | `src/lib/posts.ts`, post template |
| Comments | **None** | Giscus was removed (no discussion was ever posted); `giscus.app` is on the link gate's forbidden list |
| Analytics | **None** | Umami was removed (its host no longer resolves); the site loads no analytics script |
| Site search | **None** | Hosted search is retired. The `/search/` page is gone. |
| `www` → apex redirect | **Installed** | Edge Dynamic Redirect; `src/middleware.ts` is a fallback for non-static paths only |
| Retired `cf-email-relay` post | **Installed** | `src/content/blog/cf-email-relay.md` (banner points at Postern). Not a 301: the live deploy is assets-only, so Worker middleware never runs. |
| Content Signals robots policy | **Installed** | `public/robots.txt` |
| CI: typecheck + Vitest + deploy on `main` | **Installed** | `.github/workflows/ci.yml` |
| Corpus notify | **Removed** | `.github/workflows/corpus-notify.yml` is gone. |
| Cloudflare Web Analytics (dashboard snippet) | **Not installed** | -- |
| Newsletter (Buttondown, Resend, etc.) | **Not installed** | -- |
| Pagefind / client-side static index | **Not used** | The site has no search page. |

Monthly infra cost for the site itself: **$0** on Cloudflare Workers free tier.

## How integrations map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  skyphusion.net (Cloudflare Worker, ASSETS binding, prerendered HTML)   │
├─────────────────────────────────────────────────────────────────────────┤
│  /blog/*          markdown → Astro content collection → static pages    │
└─────────────────────────────────────────────────────────────────────────┘
         merge to main
              │
              ▼
        ci.yml ──wrangler deploy──► Worker + dist/client assets
```

### Search

This site has no search page. Hosted search is retired. `search.vivijure.com` does not resolve. The link check lists that host as retired.

The ask widget and the drift check are gone.

### Comments

None. Giscus was removed in skyphusion-net#153: the repository never had a discussion, and the widget loaded a third party (giscus.app and GitHub) on every post. `scripts/check-links.mjs` lists `giscus.app` in `FORBIDDEN_HOSTS`, so CI fails if it comes back. GitHub Discussions stays enabled on the repository; that is a setting, not code.

### Analytics

None. The site loads no analytics script. The self-hosted Umami tag was removed in skyphusion-net#153, because its host no longer resolves. Privacy is the primary goal: do not add third-party analytics, trackers or tag managers.

### Link check

`scripts/check-links.mjs` runs in CI after the build, over `dist/client`. It fails on an internal link to a page or file the build did not produce, an internal page link without its trailing slash (each one cost a 307), a link to a host in `RETIRED_HOSTS`, and a page with an empty title or no description. `check-links.test.ts` holds its controls.

### SEO and feeds

- **Canonical host:** `skyphusion.net`. `www.skyphusion.net` 301s to apex via Cloudflare Dynamic Redirect. Middleware still mirrors the redirect for non-static paths.
- **JSON-LD:** `WebSite` on home, `BlogPosting` + `BreadcrumbList` on posts, blog index schema on `/blog/`.
- **Open Graph / Twitter:** per-page title, description, default OG image (`/og-default.png` in `seo.ts`; asset under `public/`).
- **RSS:** all non-draft posts via `@astrojs/rss`.
- **Sitemap:** `@astrojs/sitemap` with `lastmod` from frontmatter via `scripts/post-lastmod.mjs` (`/sitemap-index.xml`).
- **llms.txt:** `public/llms.txt` at `/llms.txt`.
- **Google Search Console (operator):** add property `https://skyphusion.net/`, verify by DNS TXT or HTML file under `public/`, then submit `https://skyphusion.net/sitemap-index.xml`. Repeat for `https://skyphusion.org/` (`/sitemap.xml`), `https://vivijure.dev/` (`/sitemap.xml`, the OSS site's home), and `https://vivijure.com/` as a separate property, if not already claimed. Domain properties prefer DNS verification once per zone.

## Stack

| Layer | Choice |
| --- | --- |
| Site generator | Astro 7 |
| Hosting | Cloudflare Workers, `@astrojs/cloudflare` v14 adapter |
| Build output | Prerendered static HTML in `dist/client/` (+ adapter server entry) |
| Authoring | Markdown + YAML frontmatter (`src/content.config.ts` schema) |
| Highlighting | Shiki, `github-dark-dimmed` |
| RSS | `@astrojs/rss` |
| Sitemap | `@astrojs/sitemap` |
| Domain | `skyphusion.net`, `www.skyphusion.net` (redirects to apex) |
| CI runners | GitHub-hosted `ubuntu-latest` (public repo, fork-safe) |

## Routes

| URL | Source | Notes |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Featured post + recent list |
| `/about/` | `src/pages/about.md` | About page |
| `/projects/` | `src/pages/projects.astro` | Curated project cards |
| `/blog/` | `src/pages/blog/index.astro` | All posts |
| `/blog/<slug>/` | `src/pages/blog/[...slug].astro` | Post + related posts |
| `/blog/tags/` | `src/pages/blog/tags/index.astro` | Tag index |
| `/blog/tags/<tag>/` | `src/pages/blog/tags/[tag].astro` | Posts per tag |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS feed |
| `/sitemap-index.xml` | Astro sitemap integration | Auto-generated at build |

## Local development

Prereqs: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Site runs at http://localhost:4321 with live reload.

```bash
npm run typecheck   # CI gate (astro check)
npm run build       # dist/client/ + dist/server/
npm run preview     # build + wrangler dev (closest to production Worker)
```

## Writing a post

1. Create `src/content/blog/<slug>.md` (filename becomes the URL slug).
2. Frontmatter must match the schema in `src/content.config.ts`:

```markdown
---
title: "My new post"
description: "Short summary for listings and SEO"
pubDate: 2026-07-13
updatedDate: 2026-07-14   # optional
tags: ["cloudflare", "side-project"]
draft: false
---

Body in markdown.
```

3. Open a PR (or push to a branch). CI runs `typecheck` and Vitest.
4. Merge to `main`. GitHub Actions deploys the Worker.

Set `draft: true` to exclude a post from build, listings, RSS, and sitemap.

## CI/CD

| Workflow | Trigger | Role |
| --- | --- | --- |
| `ci.yml` | PR / push | typecheck, build, Vitest smoke; **deploy on push to `main`** |
| `coverage.yml` | PR / push | the org ruleset's `coverage` check context |

Deploy secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` on the repo. `account_id` is never hardcoded in `wrangler.jsonc`.

## Project structure

```
skyphusion-net/
├── astro.config.mjs              # site URL, sitemap, Shiki, Cloudflare adapter
├── wrangler.jsonc                # Worker name, ASSETS binding, custom domains
├── scripts/post-lastmod.mjs      # sitemap lastmod from markdown frontmatter
├── public/
│   ├── favicon.svg, og-default.svg, robots.txt
├── src/
│   ├── content.config.ts         # blog collection Zod schema
│   ├── content/blog/*.md         # posts
│   ├── components/               # RelatedPosts
│   ├── layouts/                # BaseLayout, AboutLayout
│   ├── lib/                    # seo.ts, projects.ts, posts.ts
│   ├── middleware.ts             # www fallback only; does not run on prerendered HTML
│   └── pages/                    # routes (see table above)
└── .github/workflows/            # CI and coverage
```

## Cloudflare deployment

Every route uses `getStaticPaths`; the build prerenders all pages. The Worker serves `dist/client/` through the `ASSETS` binding. Adapter v14 also wires default `SESSION` (KV) and `IMAGES` bindings; this blog does not use them.

```bash
npm run deploy   # build + wrangler deploy
```

Custom domains are in `wrangler.jsonc` (`skyphusion.net`, `www.skyphusion.net`). After binding changes, run `npm run generate-types` for `worker-configuration.d.ts` (gitignored).

## Customization

| Goal | Edit |
| --- | --- |
| Branding / nav / footer | `src/layouts/BaseLayout.astro` |
| Homepage hero / featured post | `src/pages/index.astro` (`FEATURED_SLUG`) |
| Project cards | `src/lib/projects.ts` |
| Colors / typography | `:root` variables in `BaseLayout.astro` |
| Allowed frontmatter fields | `src/content.config.ts` |
| SEO defaults | `src/lib/seo.ts` |

## Wishlist (not built)

- **Newsletter signup** (Buttondown, Resend, or similar).
- **Cloudflare Web Analytics** dashboard snippet (Umami already covers aggregate traffic).

## Links

- **Live site:** https://skyphusion.net
- **Skyphusion Labs:** https://skyphusion.org · **Org:** https://github.com/skyphusion-labs

## License

- **Site code:** [MIT](LICENSE).
- **Blog content** (posts, prose, images): all rights reserved. MIT covers code only.
