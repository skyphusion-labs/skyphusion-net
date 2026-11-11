---
title: "Prism is open: sign up, bring your own Cloudflare AI Gateway"
seoTitle: "Prism public signup: bring your own Cloudflare AI Gateway"
description: "play.skyphusion.org is a public Prism deploy now: first-party accounts, no Cloudflare Access wall, and mandatory per-user BYOK. Conrad Rockenhaus explains AUTH_MODE=public, fail-closed billing, what self-host still looks like, and how the model catalog grew after the cutover."
seoDescription: "play.skyphusion.org is a public Prism deploy now: first-party accounts, no Cloudflare Access wall, and mandatory per-user BYOK."
pubDate: 2026-08-04
updatedDate: 2026-08-07
tags: ["cloudflare", "ai", "llm", "rag", "workflows", "side-project"]
draft: false
---

[Prism](/blog/llm/) used to live behind Cloudflare Access. That was honest for a private playground. It was the wrong door for a public product.

As of the **v0.169.1** cutover, the live service at [play.skyphusion.org](https://play.skyphusion.org) runs **`AUTH_MODE=public`**. You create a username and password. You sign in with an opaque session cookie. You never need a Zero Trust seat on my account.

Inference does not bill me. It bills you.

## What public mode means

Prism has two auth modes. One Worker codebase. One identity seam for history and R2 ownership.

| Mode | Who it is for | How identity works | Who pays for models |
|------|---------------|--------------------|---------------------|
| **`public`** | Hosted product (play.skyphusion.org) | First-party signup; session cookie; opaque account id | Each user brings an AI Gateway slug + Unified Billing token |
| **`access`** (default for self-host) | Private install | Cloudflare Access email header | Deployer gateway secrets, or per-user prefs if you configure them |

In public mode the worker **ignores** deployer `GATEWAY_ID` and `CF_AIG_TOKEN`. Those secrets must not sit on the public Worker. Gateway resolution is fail-closed: without your Account settings, chat and generation refuse instead of falling through to my credits.

That is the product rule. Workers, D1, R2, and Vectorize are hosted. Model spend is yours.

## Why BYOK this way

I want people to try Prism without asking me for an invite. I do not want an open chat box that burns a shared credit pool.

Cloudflare Unified Billing is the fit. You create an AI Gateway. You enable the providers you use. You paste the gateway slug and token into Prism Account settings. Calls go out as `cf-aig-authorization` on your account. I never see a usable provider key for your spend.

Self-host still defaults to `AUTH_MODE=access` with Access in front. That path did not go away. Public mode is the extra product shape, not a replacement of private installs.

Scaffold a private box with:

```bash
npm create @skyphusion/prism my-prism
cd my-prism
npm install
npm run bootstrap
```

Follow the README for Access. Follow the "Running the public service" section if you want to operate your own first-party signup instance.

## What changed after the cutover

The public auth plane landed in **v0.167.0** (signup, login, logout, account delete, session tables). **v0.169.1** flipped play.skyphusion.org to public and retired Access on that hostname. Later tags kept the catalog moving:

- **Models:** catalog sprints through **v0.170** to **v0.173** (chat refresh, image-tier siblings, OpenAI Responses API path, newer GPT lines).
- **Images:** **v0.174.0** keeps Grok Imagine on Unified Billing with `b64_json` (URL format is blocked for Zero Data Retention teams). Optional direct OpenAI is only for transparent PNG on `gpt-image-*` when you set a deployer `OPENAI_API_KEY`; that is a narrow carve-out, not a return to full BYOK keys.

The old [architecture post](/blog/llm/) still holds for the Worker shape: one Worker, vanilla frontend, D1 + R2 + Vectorize, Workflows for long video and music jobs, Durable Object for voice. Update only the auth story: Access is no longer the public front door.

## What you still own

Per-user scoping did not relax. History, projects, documents, and R2 artifacts stay behind your account id. Artifact download rechecks ownership before streaming. Cross-user access stays impossible even if someone guesses a UUID.

Delete account is real. It erases chats, projects, uploads, artifacts, and saved gateway settings. That is intentional for a public service that stores conversation state on the host.

## Limits I will say out loud

- Public Prism stores your **conversations and files** on the hosted Worker. Model keys stay yours; chat content does not leave the host the way a pure self-host would. If that line is wrong for you, run `AUTH_MODE=access` on your own account.
- You need a Cloudflare account with AI Gateway and Unified Billing for paid third-party models. Workers AI still has free-tier headroom; heavy use still needs plan and credits.
- Workflows for video and music need a real deploy. Local `wrangler dev --remote` is not enough to prove those paths.

## Go use it

- Live: [play.skyphusion.org](https://play.skyphusion.org)
- Source (AGPL-3.0): [github.com/skyphusion-labs/prism](https://github.com/skyphusion-labs/prism)
- Current release line: **v0.174.0**

Create an account. Connect your gateway. Pick a model. That is the whole onboarding path.

**Later:** the line hit **1.0** (playground, control plane, iOS, Android, MCP). Map and repos: [Prism 1.0](/blog/prism-v1/).
