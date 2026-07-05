---
title: "SidVicious_exe: a punk rock Discord roadie on Cloudflare"
description: "SidVicious_exe is a self-hosted Discord roadie forked from Slate with the film stack removed: Claude via AI Gateway, web search, a Vectorize knowledge base, and image generation across Workers AI and gateway models, with a deliberately irreverent personality."
pubDate: 2026-06-25
updatedDate: 2026-07-05
tags: ["discord", "ai", "cloudflare", "side-project"]
draft: false
---

**SidVicious_exe** is what happens when you strip the film studio out of Slate and keep the roadie.

It is a Discord collaborator for web search and image generation. Talk naturally, ask it to look something up, paste reference images, or crank out visuals. Everything runs on the unified Cloudflare API. The personality is intentional: direct, useful, and free of corporate sycophancy. We call it a roadie, not a bot. A bot is a vending machine; this is someone with attitude who actually delivers.

Forked from [Slate](/blog/slate/). Same Cloudflare bones, none of the Vivijure render pipeline.

## Features

- **Claude Sonnet 4.6** via Cloudflare AI Gateway (native Anthropic path); Ollama fallback when no CF token is set
- **Tool loop:** Brave Search, Tavily deep research, page fetch (optional search Worker with Browser Rendering), Vectorize knowledge search, image generation
- **Vision:** up to three images per message (4 MB each)
- **Knowledge base:** `!learn` / `/learn` indexes text or URLs into Vectorize
- **Images:** eleven model aliases (`flux-schnell`, `phoenix`, `gpt-image`, `recraft`, and more) via `!image` / `/image` and `!model` / `/model`
- **D1 session state** so conversation history survives restarts (optional)
- **Slash + legacy commands:** `/image`, `/model`, `/learn`, `/reset`
- **Listening modes:** whole channel or DM/@mention only

## Architecture

```
Discord channel
      |
   bot.mjs
      |
      +-- AI Gateway /anthropic  --> Claude
      +-- Workers AI + Gateway   --> image models
      +-- sidvicious-search Worker (optional) --> Brave, Tavily, fetch
      +-- D1 (optional)          --> session history
```

Deploy with `npm run roadie`, a standalone Dockerfile, or Compose on your own box. AGPL-3.0. No public invite in the repo: you host it for your server.

## Update, July 2026

The roadie now ships as a versioned container image: tagging a release builds and pushes the image to GHCR, so self-hosters can pin a version instead of building from source. The Workers config got a defense-in-depth pass too, disabling the unused `workers.dev` route on the main worker while explicitly pinning it open on the search worker that the bot actually consumes. Internal fleet topology came out of the public docs, and contributions now go through DCO sign-off.

Code: [github.com/skyphusion-labs/SidVicious_exe](https://github.com/skyphusion-labs/SidVicious_exe).
