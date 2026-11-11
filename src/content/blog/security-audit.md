---
title: "security-audit: an adversarial LLM gate you can run on every PR"
seoTitle: "security-audit: an adversarial LLM gate for every PR"
description: "Skyphusion Labs published @skyphusion/security-audit: adversarial LLM reviews of GitHub PRs and full repos through Cloudflare Workers AI and AI Gateway. Conrad Rockenhaus covers pr vs repo mode, the public/private data boundary, redact hygiene that must not eat real code, and why a gate must be able to go red."
seoDescription: "Skyphusion Labs published @skyphusion/security-audit: adversarial LLM reviews of GitHub PRs and full repos through Cloudflare Workers AI and AI Gateway."
pubDate: 2026-08-04
tags: ["cloudflare", "ai", "side-project"]
draft: false
---

Static analysis finds patterns. It does not read a pull request the way a hostile reviewer does.

We wanted a second layer: send the diff (or a repo snapshot) to a strong code model, get severity-tagged findings, and post them on the PR. That tooling is now public as **[`security-audit`](https://github.com/skyphusion-labs/security-audit)** under MIT. Package name: `@skyphusion/security-audit` (currently **0.2.1**).

It is **advisory by default**. It does not replace CodeQL or Semgrep. You opt into hard fail with `--fail-on high` or `--fail-on critical`.

## Two modes

| Mode | What it sees | Typical model path | When to run |
|------|--------------|--------------------|-------------|
| **`pr`** | Merge-base diff + changed files | Workers AI `@cf/moonshotai/kimi-k2.7-code` | Every PR to `main` |
| **`repo`** | Tracked source tree (~250k char budget) | Public repo: AI Gateway → `moonshotai/kimi-k3`. Private/internal: K2.7 on Workers AI | Scheduled deep audit or `workflow_dispatch` |

`pr` mode is the daily door. `repo` mode is the deep sweep.

## The data boundary that matters

Repo mode ships a large tree. That tree must not leave your Cloudflare account by accident.

**Repo mode uses the off-account K3 path only when the repository is PUBLIC.** For private or internal repos it runs the same repo-mode prompt on Workers AI (K2.7), prints a `DATA BOUNDARY --` line, and continues on-shore.

Visibility resolution order:

1. Explicit `--visibility public|private|internal`
2. GitHub Actions event payload
3. Default **`private`**

The fail-safe direction is deliberate. An unknown answer routes on-shore. There is no override flag that forces private code through the public-model path.

## Redaction is hygiene, not a promise

Before any payload leaves CI, `redact.mjs` strips likely secrets (PEM blocks, age keys, GitHub PATs, JWTs, common env assignments, and similar shapes).

Two hard rules came out of real failures (0.2.1):

1. **Match tokens, not whole lines.** In `pr` mode every line has a `+`, `-`, or leading space. A line-anchored rule never fires on a unified diff.
2. **Do not eat real source.** Over-redaction feeds the model `[REDACTED]` and returns a clean report that is a lie. Identifier rules must not match names that merely *contain* a keyword (`tokenizer` is not a secret assignment). Quoted values must stay whole. A secret-free diff must come back **byte-identical**.

Redaction never makes it safe to audit a repo full of live production secrets. Treat it as hygiene. Keep real secrets out of the tree.

## What you run

Local:

```bash
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_API_TOKEN=...   # pr mode (Workers AI)
export CF_AIG_TOKEN=...           # repo mode (gateway)
export AI_GATEWAY_ID=...

node adversarial-audit.mjs --mode pr --output markdown
node adversarial-audit.mjs --mode repo --output json --out-file audit.json
```

GitHub Actions: copy an example from `examples/` in the repo. Public repos can checkout and run inline. Private repos can call the reusable workflow. Both examples **skip fork PRs** so untrusted code never receives your Cloudflare tokens.

For Actions, prefer a dedicated secret name such as `ADVERSARIAL_AUDIT_CF_API_TOKEN` when the repo already uses `CLOUDFLARE_API_TOKEN` for wrangler deploy. Map it into `CLOUDFLARE_API_TOKEN` in the workflow env.

On PRs, `post-pr-comment.sh` upserts one advisory comment. Needs `pull-requests: write` and `github.token`.

## Why we open-sourced it

We already run this class of gate across Skyphusion Labs repos. A green CI line that cannot go red is decoration. An adversarial pass that is allowed to fail (or at least to post findings you must read) is a real control.

Shipping the scripts, the redactor tests, and the workflow examples under MIT means anyone with a Cloudflare account can wire the same layer without re-deriving the data boundary or the diff-shaped redaction bugs.

## What it is not

- Not a substitute for human review.
- Not a guarantee against secret leakage.
- Not a merge block unless you turn `--fail-on` on.
- Not magic: model findings include false positives. Disposition is still operator work.

## Links

- Repo: [github.com/skyphusion-labs/security-audit](https://github.com/skyphusion-labs/security-audit)
- License: MIT
- Core scripts: `adversarial-audit.mjs`, `redact.mjs`, `post-pr-comment.sh`

If you already run Workers AI or AI Gateway, the install cost is a workflow file and two secrets. That is the whole point.
