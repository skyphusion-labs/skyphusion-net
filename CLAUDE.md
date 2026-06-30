# CLAUDE.md

Guidance for Claude Code (and the crew) working in this repo.

## What this is

Personal blog at **skyphusion.net** -- an Astro 6 site, markdown-authored, prerendered to static HTML
and served from a Cloudflare Worker (the `@astrojs/cloudflare` adapter). Content is a single `blog`
content collection; everything renders from markdown. Currently **v0.1.0**. Live: skyphusion.net /
www.skyphusion.net.

## Commands

```bash
npm install
npm run dev          # astro dev -> http://localhost:4321 (live reload)
npm run typecheck    # astro check -- the CI gate; run before pushing
npm run build        # astro build -> dist/
npm run preview      # build + wrangler dev (serves the built worker locally, closest to prod)
npm run deploy       # build + wrangler deploy (account from CLOUDFLARE_ACCOUNT_ID)
npm run generate-types   # wrangler types (regenerates the gitignored worker-configuration.d.ts)
```

### Verifying changes

`npm run typecheck` (`astro check`) is the gate. There is a small smoke suite (`blog.test.ts`,
Vitest) that asserts the homepage and a recent post render 200; it fetches `http://localhost:4321`,
so it needs a server already running (`npm run dev`, or the `astro preview` the coverage workflow
starts). CI is **GitHub Actions** on GitHub-hosted `ubuntu-latest` (public repo, fork-safe): push/PR
typecheck (`typecheck.yml`), build + `wrangler deploy` on `main` (`ci.yml`), and the Vitest coverage
run against a live preview server (`code-coverage-ts.yml`). GitHub Actions is the entire CI/CD
pipeline (`ci.yml` builds and runs `wrangler deploy` on `main`); there is no other build system.

## Architecture

- **Content collection** (`src/content.config.ts`): a `blog` collection via a glob loader over
  `src/content/blog/**/*.md`. The Zod `schema` is the source of truth for frontmatter -- `title`,
  `description`, `pubDate` (required), plus optional `updatedDate`, `tags[]`, and `draft`. Changing
  allowed frontmatter means editing this schema.
- **Routing**: `src/pages/blog/[...slug].astro` generates one page per post (`params.slug = post.id`,
  the filename). `getCollection('blog', ({data}) => !data.draft)` is the standard query -- every
  consumer (post pages, blog index, tag pages, RSS) filters out `draft: true` the same way. There
  are also `src/pages/index.astro`, `projects.astro` (driven by `src/lib/projects.ts`), `about.md`,
  and `blog/tags/`.
- **Layout**: `src/layouts/BaseLayout.astro` holds the header, footer, global styles, and the
  `:root` CSS variables (`--bg`, `--fg`, `--accent`, `--border`, `--muted`, `--code-bg`) that all
  pages theme from; `AboutLayout.astro` is the about page shell.
- **Feeds + SEO**: `src/pages/rss.xml.js` builds RSS from the same collection; `@astrojs/sitemap`
  auto-generates the sitemap at build, with per-post `lastmod` injected from frontmatter via
  `scripts/post-lastmod.mjs` (the content collection is not available at config time, so lastmod is
  parsed from the markdown directly). `src/lib/seo.ts` centralizes SEO helpers.
- **Deploy is Workers, not Pages.** `astro.config.mjs` uses the `@astrojs/cloudflare` SSR adapter;
  `wrangler.jsonc` defines a Worker (`main: @astrojs/cloudflare/entrypoints/server`) serving `dist/`
  via the `ASSETS` binding on custom domains `skyphusion.net` / `www.skyphusion.net`. Every route
  uses `getStaticPaths`, so the build prerenders all content; the Worker adapter serves the
  prerendered assets and is what would enable server routes later.
- **Code highlighting**: Shiki, `github-dark-dimmed` theme with line wrap (`astro.config.mjs`).

## Writing a post

Create `src/content/blog/<slug>.md` with frontmatter matching the schema above; the filename becomes
the URL slug (`/blog/<slug>/`). Set `draft: true` to exclude a post from the build entirely (no page,
not in listings or RSS).

## Conventions

- **No em-dashes (U+2014) or en-dashes (U+2013) anywhere** (markdown, source, comments). Use commas,
  semicolons, parentheses, or `--`.
- **Handle / username is `skyphusion`** across all services.
- **Minimal runtime deps**; Astro + the two official integrations (rss, sitemap) is the whole stack.
  Justify any new one. `tsconfig.json` extends `astro/tsconfigs/strict`.
- **Mirror every `wrangler.jsonc` binding in a hand-authored `Env`** if Worker code ever reads
  bindings; runtime types come from `wrangler types` (the generated `worker-configuration.d.ts` is
  gitignored, regenerate with `npm run generate-types`).
- **`account_id` is never hardcoded** -- injected from `CLOUDFLARE_ACCOUNT_ID` (env / CI secret).

## Crew + identity

- Crew members work as their own Unix + gh identity. The FIRST command in any op is the member's own
  login shell: `sudo -u <member> bash -lc '<ops>'` (loads their `$HOME`, their `~/dev/skyphusion-net`
  clone, their gh/CF creds).
- Crew commits land under the member's own `skyphusion-<member>` identity, never Conrad's. (Conrad
  devs ONLY on his laptop, where his commits author as `Conrad Rockenhaus <conrad@skyphusion.org>`
  -- his real name kept, the in-house `@skyphusion.org` email; his name is never scrubbed and his
  history never rewritten. On the crew host the `conrad` user is the god process and commits as
  `Mackaye <mackaye@skyphusion.org>`.)
- Cross-project operating context lives in the main auto-memory
  (`~/.claude/projects/-home-conrad/memory/`); load it before acting.

## Commits & versioning

Conventional Commits (`feat(scope):` / `fix(scope):` / `docs:` / `ci:`); the body explains the why.
SemVer-style `0.MINOR.PATCH` while pre-1.0; bump `package.json` `version` in a release commit. A new
post is content, not a release; reserve version bumps for engine/layout changes.
