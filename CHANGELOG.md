# Changelog

## Unreleased

- **docs(blog):** posts for WordPress on Cloudflare, Skyphusion AI v0.6.3, Zaraz Consent v0.1.0, and Postern v1.7.0. Homepage featured slot is the WordPress post.

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

