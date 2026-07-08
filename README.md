# skyphusion-net

Personal blog at skyphusion.net. Astro 7 site, prerendered to static HTML and served from a Cloudflare Worker, markdown-authored.

## Stack

| Layer | Choice |
|---|---|
| Site generator | Astro 7 |
| Hosting | Cloudflare Workers (free tier), `@astrojs/cloudflare` adapter |
| Authoring | Markdown with YAML frontmatter |
| RSS | @astrojs/rss |
| Sitemap | @astrojs/sitemap |
| Domain | skyphusion.net |
| Total monthly cost | $0 |

## Local development

Prereqs: Node.js 20+ and npm. On Windows, install from nodejs.org or via winget (`winget install OpenJS.NodeJS.LTS`).

```bash
npm install
npm run dev
```

Site runs at http://localhost:4321. Live-reloads on file changes.

## Writing a post

1. Create a new file in `src/content/blog/` (any name, will become the slug). Example: `src/content/blog/my-new-post.md`
2. Add frontmatter at the top:

```markdown
---
title: "My new post"
description: "Short summary, shown on blog index"
pubDate: 2026-05-13
tags: ["tag1", "tag2"]
draft: false
---

Content in markdown.
```

3. Run `npm run deploy` (or push to main, if you've wired up a CI deploy).
4. Live at https://skyphusion.net/blog/my-new-post within ~30 seconds.

Set `draft: true` to keep a post out of the build (won't appear in lists, won't get a URL).

## Build and preview

```bash
npm run build    # Produces dist/ folder
npm run preview  # build + wrangler dev — runs the built Worker locally (closest to prod)
```

## Project structure

```
skyphusion-net/
├── astro.config.mjs          # Astro config (site URL, integrations, Cloudflare adapter)
├── wrangler.jsonc            # Cloudflare Worker config (assets binding, routes)
├── package.json
├── tsconfig.json
├── src/
│   ├── content.config.ts     # Blog post schema (title, description, etc.)
│   ├── content/
│   │   └── blog/
│   │       └── hello-world.md
│   ├── layouts/
│   │   └── BaseLayout.astro  # Header, footer, global styles
│   └── pages/
│       ├── index.astro       # Homepage (recent posts)
│       ├── about.md          # About page
│       ├── rss.xml.js        # RSS feed
│       └── blog/
│           ├── index.astro   # Blog listing (all posts)
│           └── [...slug].astro  # Individual post route
└── public/
    ├── favicon.svg
    └── robots.txt
```

## Cloudflare Workers deployment

The site builds to static HTML (every route uses `getStaticPaths`) and is served by a Cloudflare Worker. The `@astrojs/cloudflare` adapter (`astro.config.mjs`) and `wrangler.jsonc` define the Worker, which serves `dist/` through the `ASSETS` binding on the custom domains `skyphusion.net` and `www.skyphusion.net`.

Deploy from your machine:

```bash
npm run deploy   # build + wrangler deploy
```

One-time setup:

1. Authenticate Wrangler: `npx wrangler login`.
2. `npm run deploy`. The first deploy provisions the Worker.
3. Custom domains are declared in `wrangler.jsonc` (`routes`); Cloudflare wires DNS automatically if the domain is in your CF account.

Custom-domain or binding changes go in `wrangler.jsonc`. After editing bindings, run `npm run generate-types` to refresh `worker-configuration.d.ts`.

## Customization quick hits

- **Site title and branding**: edit `src/layouts/BaseLayout.astro` (header text), `src/pages/index.astro` (homepage hero), `astro.config.mjs` (site URL).
- **Colors**: edit `:root` CSS variables in `BaseLayout.astro` (`--bg`, `--fg`, `--accent`, etc.).
- **Add a new top-level page**: drop a `.md` or `.astro` file in `src/pages/`. Filename becomes URL.
- **About page content**: edit `src/pages/about.md`.

## Common adds (when you want them)

- **Search**: Cloudflare Workers + Pagefind, or use a simple JSON index built at build time.
- **Comments**: Giscus (GitHub Discussions backend) or self-hosted Cactus (Matrix).
- **Analytics**: Cloudflare Web Analytics (free, privacy-preserving, no JS cookies). Enable in CF dashboard, paste one script tag in BaseLayout.
- **Newsletter**: Buttondown or Resend, both have generous free tiers.

## License

- **Site code:** [MIT](LICENSE).
- **Blog content** (posts, prose, images, and other written or visual material): all rights reserved. No license is granted to reuse the content; the MIT license covers the code only.
