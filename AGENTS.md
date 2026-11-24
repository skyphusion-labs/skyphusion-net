# skyphusion-net

This file is the guide for any coding agent and any contributor. Follow it.

## What this project is

skyphusion-net is the engineering blog at skyphusion.net. Authors write Markdown. The Astro build prerenders static HTML. A Cloudflare Worker serves the site. Read [README.md](README.md).

The version is in `package.json`. See the latest `v*` tag.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
npm run test
npm run deploy
npm run generate-types
```

`npm run dev` serves http://localhost:4321. `npm run typecheck` is `astro check`. Run it before you push. `npm run preview` builds, then runs `wrangler dev`. `npm run deploy` builds, then publishes the Worker. Set `CLOUDFLARE_ACCOUNT_ID` for that publish. CI on `main` publishes too.

The pull request gate is [`.github/workflows/ci.yml`](.github/workflows/ci.yml). That workflow typechecks, builds, and runs Vitest. The smoke tests need a server on port 4321, or the static server CI starts. [`.github/workflows/coverage.yml`](.github/workflows/coverage.yml) is the coverage check. [`.github/workflows/corpus-notify.yml`](.github/workflows/corpus-notify.yml) refreshes the search corpus after a merge to `main`.

## Architecture

`src/content.config.ts` defines the `blog` collection. The Zod schema is the frontmatter contract. Required fields are `title`, `description`, and `pubDate`. Optional fields are `updatedDate`, `tags`, `image`, and `draft`. A change to allowed frontmatter is a schema edit.

`src/pages/blog/[...slug].astro` builds one page per post. The filename is the slug. Listings skip a post whose `draft` flag is true. The same filter covers the index, the tag pages, and the RSS feed.

`src/layouts/BaseLayout.astro` holds the header, the footer, and the theme variables. `AboutLayout.astro` wraps the markdown pages. The site loads no analytics script. `src/lib/posts.ts` scores related posts by tag overlap. `src/pages/rss.xml.js` builds the feed. `src/lib/seo.ts` builds the SEO tags. `scripts/post-lastmod.mjs` sets sitemap `lastmod` from frontmatter. `public/robots.txt` sets Content Signals. `scripts/check-links.mjs` checks the built site in CI.

Comments are absent. `giscus.app` is on the link check forbidden list.

`src/pages/search.astro` embeds `public/ask-widget.js` and `public/ask-widget.css`. Do not hand-edit those files. `scripts/ask-widget.canonical.json` names the pinned package version. The `ask-widget-drift` job enforces that pin. The README has the bump steps. The browser posts to the ask URL in that page. A Turnstile check gates the ask call.

`src/middleware.ts` redirects `www.skyphusion.net` to the apex. A fully static asset response does not run that file. `astro.config.mjs` uses the `@astrojs/cloudflare` adapter. `wrangler.jsonc` defines the Worker. Custom domains are `skyphusion.net` and `www.skyphusion.net`. Routes use `getStaticPaths`, so the build prerenders the pages. Code highlighting uses Shiki. The theme is `github-dark-dimmed`.

Do not hardcode `account_id`. If Worker code reads a binding, mirror it in a hand-authored `Env`. `npm run generate-types` refreshes `worker-configuration.d.ts`. That generated file stays gitignored.

## Write a post

Create `src/content/blog/<slug>.md` with the schema fields. The filename is the URL slug. Set `draft` to true to omit the post from the build.

## Docs

Write Simplified Technical English. Use short sentences. Use one idea per sentence. Use the active present tense. Use plain words. Use the same word every time.

Do not use an em dash (U+2014). Do not use an en dash (U+2013). Use a comma, a semicolon, parentheses, or two hyphens (`--`).

State the limit next to the capability. Do not turn a measured result into a promise.

## Safety

Do not put a secret in a tracked file, a log, or an issue. Use `npm run preview` to try a local build. A change to custom domains needs a change request. Direct dependencies are listed in `package.json`. Justify a new one.

## Commits and versions

Use Conventional Commits. The body says why. A version moves only in a release pull request. A new post does not bump the version. Tags use the `v*` form.

The public handle is `skyphusion`. X links on this site use https://x.com/rockrockenhaus.
