# Changelog

## Unreleased

- **feat(blog): search snippets fit, every page has a lastmod, an Atom feed, and posts link their projects (#153).**
  - Every post whose description ran past 160 characters (all 23) gets an `seoDescription` for the meta, og and twitter description and the BlogPosting JSON-LD. It is taken from the post's own description: whole sentences where they fit, otherwise its own clauses cut down. The on-page dek is unchanged. The schema caps it at 160, and the build fails over that.
  - Titles are unchanged: shortening them meant dropping the words that make them findable, and long titles are only truncated in results.
  - The home, /blog/, /about/, /projects/ and tag-page descriptions now run 70 to 160 characters. `scripts/check-links.mjs` fails a description over 160.
  - The sitemap carries `lastmod` for all 59 URLs (`scripts/site-lastmod.mjs`): listing pages by their newest post, tag pages by their newest tagged post, and static pages by their last commit, only in a full clone (ci.yml checks out with full history).
  - `/atom.xml`: an Atom 1.0 feed beside RSS, advertised in the page head.
  - Each post links the projects it covers, from `src/lib/projects.ts` (`ProjectLinks.astro`).

- **fix(site): audit fixes (#153).**
  - The analytics tag is removed: its host, analytics.skyphusion.org, no longer resolves. The privacy notice and the footer now say the site loads no analytics.
  - /about/ and /privacy/ get their titles and descriptions. Their layout read top-level props, and a markdown page passes its frontmatter as `Astro.props.frontmatter`.
  - Links to hosts that no longer resolve are removed. The text stays, so posts read the same. The hosts are demo.vivijure.com, common-thread, rustchoir, verdigris and ferrite.
  - The Vivijure links in the layout, home, about and projects pages point at https://vivijure.dev. The CPU container links point at vivijure-cf/containers.
  - Internal links carry their trailing slash, so no internal link pays a 307.
  - The projects page links a tag only when a post carries it.
  - `scripts/check-links.mjs` gates the built site in CI.

- **docs(blog):** posts for WordPress on Cloudflare, Skyphusion AI v0.6.3, Zaraz Consent v0.1.0, and Postern v1.7.0. Homepage featured slot is the WordPress post. The WordPress post opens with why that project is the one: keep the CMS, leave the LAMP box, scale to zero and serve from the edge.

- **deps:** `astro` 7.4.7 and `@astrojs/cloudflare` 14.4.6. The open Dependabot PR stopped at 7.4.4 and 14.4.3.

- **fix(deps):** npm overrides moved to the patched releases Dependabot was flagging: `undici@7.30.2`, `fast-uri@3.1.9`, `sharp@0.35.5`, `yaml@2.9.1`. `js-yaml` stays at 4.3.2, the last 4.x. `wrangler` stays on the existing pin.

- **docs(site):** X handle moved from `@skyphusion` to `@rockrockenhaus` (2026-11-05); `x.com/skyphusion` no longer resolves. Every X link and `twitter:` meta tag now points at `x.com/rockrockenhaus`.

- **fix(blog):** publish the retired `cf-email-relay` post at its original slug. The declared middleware 301 never ran: the live deploy is assets-only (`serve_directly`, no Worker script), so old inbound links 404ed. This changes published content (the write-up returns with its retirement banner) rather than adding `run_worker_first`.

- **fix(deps):** npm overrides for Dependabot: `undici@7.29.0`, `fast-uri@3.1.5`, plus `js-yaml@4.3.1` / `yaml@2.9.0` (dev/tooling via wrangler/miniflare and @astrojs/check).

- **docs(blog):** Prism 1.0 product-line post (`/blog/prism-v1/`); projects hub entries for control plane, iOS, Android, prism-mcp; llms.txt + prism-public forward link.

## v0.2.2

- **docs(projects):** list hollow-grid-go / py / c / asm on the projects hub with demos and the ports post.
- **docs(llms):** link the hollow-grid-ports write-up.

## v0.2.1

Release sync bump (2026-07-21). No functional changes in this tag.

