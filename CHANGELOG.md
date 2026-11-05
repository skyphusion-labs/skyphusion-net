# Changelog

## Unreleased

- **docs(site):** X handle moved from `@skyphusion` to `@rockrockenhaus` (2026-11-05); `x.com/skyphusion` no longer resolves. Every X link and `twitter:` meta tag now points at `x.com/rockrockenhaus`.

- **fix(blog):** publish the retired `cf-email-relay` post at its original slug. The declared middleware 301 never ran: the live deploy is assets-only (`serve_directly`, no Worker script), so old inbound links 404ed. This changes published content (the write-up returns with its retirement banner) rather than adding `run_worker_first`.

- **fix(deps):** npm overrides for Dependabot: `undici@7.29.0`, `fast-uri@3.1.5`, plus `js-yaml@4.3.1` / `yaml@2.9.0` (dev/tooling via wrangler/miniflare and @astrojs/check).

- **docs(blog):** Prism 1.0 product-line post (`/blog/prism-v1/`); projects hub entries for control plane, iOS, Android, prism-mcp; llms.txt + prism-public forward link.

## v0.2.2

- **docs(projects):** list hollow-grid-go / py / c / asm on the projects hub with demos and the ports post.
- **docs(llms):** link the hollow-grid-ports write-up.

## v0.2.1

Release sync bump (2026-07-21). No functional changes in this tag.

