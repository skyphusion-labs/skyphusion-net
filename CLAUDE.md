# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal blog at skyphusion.net — an Astro 6 site, markdown-authored, deployed to Cloudflare. Content is a single `blog` content collection; everything renders from markdown.

## Commands

```bash
npm run dev        # Dev server with live reload at http://localhost:4321
npm run build      # Build to dist/
npm run preview    # build + wrangler dev — serves the built worker locally (closest to prod)
npm run deploy     # build + wrangler deploy — push to Cloudflare
npm run generate-types   # wrangler types — regenerate worker-configuration.d.ts
```

There is no test suite or linter configured. `tsconfig.json` extends `astro/tsconfigs/strict`; type-check via the build or `astro check`.

## Deployment (important — README is out of date)

The README describes a static site on Cloudflare **Pages**. The repo is actually configured for Cloudflare **Workers**:
- `astro.config.mjs` uses the `@astrojs/cloudflare` SSR adapter.
- `wrangler.jsonc` defines a Worker (`main: @astrojs/cloudflare/entrypoints/server`) with `dist/` served via the `ASSETS` binding, on custom domains `skyphusion.net` / `www.skyphusion.net`.
- Deploy with `npm run deploy` (`wrangler deploy`), not a Pages git integration.

Pages are still effectively static: every route uses `getStaticPaths`, so the build prerenders all content. The Worker adapter serves prerendered assets and is what enables future server routes if added.

## Architecture

- **Content collection** (`src/content.config.ts`): defines the `blog` collection via a glob loader over `src/content/blog/**/*.md`. The Zod `schema` is the source of truth for frontmatter — `title`, `description`, `pubDate` (required), plus optional `updatedDate`, `tags[]`, and `draft`. Changing allowed frontmatter means editing this schema.
- **Routing**: `src/pages/blog/[...slug].astro` generates one page per post (`params.slug = post.id`, the filename). `getCollection('blog', ({data}) => !data.draft)` is the standard query — every consumer (post pages, blog index, RSS) filters out `draft: true` posts the same way.
- **Layout**: `src/layouts/BaseLayout.astro` holds the header, footer, global styles, and the `:root` CSS variables (`--bg`, `--fg`, `--accent`, `--border`, `--muted`, `--code-bg`) that all pages theme from.
- **Feeds**: `src/pages/rss.xml.js` builds the RSS feed from the same collection; `@astrojs/sitemap` auto-generates the sitemap at build (configured in `astro.config.mjs`, keyed off `site:`).
- **Code highlighting**: Shiki, `github-dark-dimmed` theme with line wrap, set in `astro.config.mjs` markdown config.

## Writing a post

Create `src/content/blog/<slug>.md` with frontmatter matching the schema above; the filename becomes the URL slug (`/blog/<slug>/`). Set `draft: true` to exclude a post from the build entirely (no page, not in listings or RSS).
