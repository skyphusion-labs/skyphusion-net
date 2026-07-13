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
| Giscus comments | **Installed** | `src/components/Giscus.astro`, `src/config/giscus.ts` |
| Umami analytics (self-hosted, cookieless) | **Installed** | `BaseLayout.astro` → `analytics.skyphusion.org` |
| AI Search ask widget | **Installed** | `/search/`, `public/ask-widget.{js,css}` |
| `www` → apex redirect | **Installed** | `src/middleware.ts` |
| Legacy slug redirect (`cf-email-relay` → `postern`) | **Installed** | `src/middleware.ts` |
| Content Signals robots policy | **Installed** | `public/robots.txt` |
| CI: typecheck + Vitest + deploy on `main` | **Installed** | `.github/workflows/ci.yml` |
| Corpus notify → AI Search reindex | **Installed** | `.github/workflows/corpus-notify.yml` |
| Cloudflare Web Analytics (dashboard snippet) | **Not installed** | — |
| Newsletter (Buttondown, Resend, etc.) | **Not installed** | — |
| Pagefind / client-side static index | **Not used** | Search is AI Search via search-mcp |

Monthly infra cost for the site itself: **$0** on Cloudflare Workers free tier. Search and analytics run on separate Skyphusion services (also $0 at current scale).

## How integrations map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  skyphusion.net (Cloudflare Worker, ASSETS binding, prerendered HTML)   │
├─────────────────────────────────────────────────────────────────────────┤
│  /blog/*          markdown → Astro content collection → static pages    │
│  /search/         ask-widget.js ──POST──► search.vivijure.com/ask     │
│  post pages       Giscus ──► GitHub Discussions (skyphusion-labs repo)  │
│  all pages        Umami script ──► analytics.skyphusion.org             │
└─────────────────────────────────────────────────────────────────────────┘
         merge to main
              │
              ▼
   corpus-notify.yml ──repository_dispatch──► search-mcp corpus-sync
              │                                      │
              │                                      ├─► R2 public corpus bucket
              │                                      ├─► R2 internal corpus bucket
              │                                      ├─► AI Search: skyphusion-public
              │                                      └─► AI Search: skyphusion-internal
              │
              ▼
        ci.yml ──wrangler deploy──► Worker + dist/client assets
```

### Search (search-mcp + Cloudflare AI Search)

The blog does **not** embed a search index. `/search/` loads the shared [ask-widget](https://github.com/skyphusion-labs/search-mcp/tree/main/public) from `public/` and streams answers from the **search-mcp query Worker**:

| Piece | Value |
| --- | --- |
| Browser page | `https://skyphusion.net/search/` |
| Query API | `POST https://search.vivijure.com/ask` |
| Bot gate | Cloudflare Turnstile (shared widget with vivijure.com) |
| CORS allowlist | `skyphusion.net`, `www.skyphusion.net` on the query Worker |
| Retrieval corpus | `skyphusion-public` AI Search instance |
| Blog-specific prompt | Query Worker uses a blog-tuned system prompt when `Origin` is the blog |
| Source repo in corpus | `skyphusion-labs/skyphusion-net` (markdown posts + site source) |
| Reindex trigger | `corpus-notify.yml` fires `corpus-sync` on **every merge to `main`** |
| Backstop | search-mcp daily `corpus-sync` schedule if a notify is dropped |

Internal agents use the separate MCP Worker (`search-internal.vivijure.com`) and `skyphusion-internal` instance; the same corpus-sync job refreshes **both** indexes.

Operator detail: [search-mcp/docs/skyphusion/OPERATOR.md](https://github.com/skyphusion-labs/search-mcp/blob/main/docs/skyphusion/OPERATOR.md).

### Comments (Giscus)

Post pages include `<Giscus />`. Configuration is in `src/config/giscus.ts` (repo, category IDs, `pathname` mapping, `noborder_dark` theme). Requires GitHub Discussions on `skyphusion-labs/skyphusion-net` and the [Giscus GitHub App](https://github.com/apps/giscus) installed on that repo.

### Analytics (Umami)

One deferred script in `BaseLayout.astro` points at self-hosted Umami (`analytics.skyphusion.org`). Aggregate traffic only; no ad-tech cookies. Website id is catalogued in `fleet-chezmoi/system/umami/websites.json`.

### SEO and feeds

- **Canonical host:** `skyphusion.net` (`www` 301s in middleware).
- **JSON-LD:** `WebSite` on home, `BlogPosting` + `BreadcrumbList` on posts, blog index schema on `/blog/`.
- **Open Graph / Twitter:** per-page title, description, default OG image (`/og-default.png` in `seo.ts`; asset under `public/`).
- **RSS:** all non-draft posts via `@astrojs/rss`.
- **Sitemap:** `@astrojs/sitemap` with `lastmod` from frontmatter via `scripts/post-lastmod.mjs`.

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
| `/blog/<slug>/` | `src/pages/blog/[...slug].astro` | Post + related + Giscus |
| `/blog/tags/` | `src/pages/blog/tags/index.astro` | Tag index |
| `/blog/tags/<tag>/` | `src/pages/blog/tags/[tag].astro` | Posts per tag |
| `/search/` | `src/pages/search.astro` | AI Search ask widget |
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

**Search in dev:** the ask widget calls the live `search.vivijure.com` API. Turnstile and CORS are production-configured; use `npm run preview` on a built site or test on the deployed `/search/` page.

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
4. Merge to `main`: GitHub Actions deploys the Worker and `corpus-notify` reindexes AI Search.

Set `draft: true` to exclude a post from build, listings, RSS, and sitemap.

## CI/CD

| Workflow | Trigger | Role |
| --- | --- | --- |
| `typecheck.yml` | PR / push | `astro check` (required gate, fork-safe) |
| `ci.yml` | PR / push | typecheck, build, Vitest smoke; **deploy on push to `main`** |
| `code-coverage-ts.yml` | PR / push | Vitest coverage against preview server |
| `corpus-notify.yml` | push to `main` | Dispatches `corpus-sync` on search-mcp (not a merge gate) |

Deploy secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` on the repo. `account_id` is never hardcoded in `wrangler.jsonc`.

## Project structure

```
skyphusion-net/
├── astro.config.mjs              # site URL, sitemap, Shiki, Cloudflare adapter
├── wrangler.jsonc                # Worker name, ASSETS binding, custom domains
├── scripts/post-lastmod.mjs      # sitemap lastmod from markdown frontmatter
├── public/
│   ├── ask-widget.{js,css}       # search-mcp embed (vanilla, no build step)
│   ├── favicon.svg, og-default.svg, robots.txt
├── src/
│   ├── content.config.ts         # blog collection Zod schema
│   ├── content/blog/*.md         # posts
│   ├── config/giscus.ts          # Giscus widget IDs
│   ├── components/               # Giscus, RelatedPosts
│   ├── layouts/                # BaseLayout, AboutLayout
│   ├── lib/                    # seo.ts, projects.ts, posts.ts
│   ├── middleware.ts             # www redirect, legacy slug redirect
│   └── pages/                    # routes (see table above)
└── .github/workflows/            # CI, deploy, corpus-notify, coverage
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
| Giscus mapping | `src/config/giscus.ts` |
| Search endpoint / Turnstile key | `src/pages/search.astro` |
| Allowed frontmatter fields | `src/content.config.ts` |
| SEO defaults | `src/lib/seo.ts` |

## Wishlist (not built)

- **Newsletter signup** (Buttondown, Resend, or similar).
- **Cloudflare Web Analytics** dashboard snippet (Umami already covers aggregate traffic).
- **Dedicated blog-only AI Search instance** (today the blog shares `skyphusion-public` with the org corpus; a split instance would isolate retrieval if the corpus grows noisy).

## Links

- **Live site:** https://skyphusion.net
- **Search backend:** https://github.com/skyphusion-labs/search-mcp
- **Skyphusion Labs:** https://skyphusion.org · **Org:** https://github.com/skyphusion-labs

## License

- **Site code:** [MIT](LICENSE).
- **Blog content** (posts, prose, images): all rights reserved. MIT covers code only.
