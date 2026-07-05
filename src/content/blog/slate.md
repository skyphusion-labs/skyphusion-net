---
title: "Slate: co-writing films in Discord, shipping them to Vivijure"
description: "Slate is the Discord front door to Vivijure: a collaborative screenwriter assistant that keeps a structured storyboard brief in channel, generates portraits and thumbnails, searches the web and a knowledge base, and submits finished bundles to the Vivijure studio API when the crew is ready."
pubDate: 2026-06-25
updatedDate: 2026-07-05
tags: ["vivijure", "discord", "ai", "cloudflare", "film", "side-project"]
draft: false
---

Every film in the Vivijure stack starts as a conversation. **Slate** is the Discord side of that: a collaborative screenwriter assistant that lives in channel with your crew, keeps a machine-readable storyboard brief in the background, and hands the finished bundle to [Vivijure](https://github.com/skyphusion-labs/vivijure) when you say ship it.

Slate does not render anything. It does not own GPU logic. The [Vivijure studio](https://vivijure.skyphusion.org/welcome) is the single source of truth from bundle assembly through finished film delivery back to the channel.

## What it does in channel

Friends talk naturally. Slate maintains the brief (`!brief`), undoes bad edits (`!undo`), reads mood boards and reference stills (up to three images per message), and runs tools when asked:

- **Web search and research** via a Cloudflare search Worker (Brave, Tavily, page fetch, optional Browser Rendering)
- **Knowledge base** indexing (`!learn`) into Vectorize
- **Character portraits** synced to Vivijure Cast (`!portrait`)
- **Scene thumbnails** (`!thumbnail`)
- **Render submission** (`!render` or "ship it") with a pre-submit huddle, quality tier, backend choice, subtitles, and title cards

Slash commands mirror the `!` commands (`/brief`, `/portrait`, `/render`, and the rest). Render backends (`!backend`) are projected live from Vivijure's module registry: own GPU, Seedance cloud, Kling, and whatever else the studio exposes.

Chat runs on Claude Sonnet 4.6 through the Cloudflare AI Gateway, with optional Ollama fallback for local dev. Session state persists in D1 so a restart does not wipe the room.

## How it fits the ecosystem

```
friends + Slate (Discord)
         |
         v
     slate  -->  vivijure (studio UI + JSON API)
                     |
                     v
               vivijure-backend + finish modules
```

Slate assembles the storyboard bundle and talks to Vivijure only through its JSON API: cast sync, portrait upload, `POST /api/storyboard/bundle`, `POST /api/render/film`, status polling until the MP4 lands in channel. Documented end-to-end films (ECHO, EMBER, RUST) went from Discord conversation to rendered output on this path.

## Stack

- Node 24+ bot (`discord.js`, Anthropic SDK)
- Cloudflare D1 for sessions
- Cloudflare Workers for search (`vivijure-search`) and log storage (`slate-logs`)
- Image generation through Workers AI and AI Gateway model aliases (FLUX, SDXL, GPT Image, Recraft, and others)
- Docker Compose on our internal fleet for production; GitHub Actions for tests and Worker deploy

## Update, July 2026: v0.2.1 and the release sprint

Slate is part of the [Vivijure constellation](/blog/vivijure-constellation/), which spent the last two weeks in a release-hardening sprint, and Slate's share of it landed as v0.2.1:

- **No more ambiguous renders.** Slate now always sends an explicit serving `motion_backend` on full render submissions, matching the studio's new submit-time preflight. A render can no longer launch against whatever backend happened to be the default.
- **The ship-it trap is closed.** A casual "ship it" in conversation no longer risks an accidental submission, and studio error bodies are no longer leaked raw into the channel.
- **Correctness under load.** A per-channel write queue serializes brief updates so concurrent messages cannot clobber render settings, and every studio call now carries its `Authorization: Bearer` header (one path was missing it).
- **Real unit tests.** The bot's pure logic was extracted into a `lib.mjs` so it can be tested without a Discord connection.
- **Operational maturity.** The search worker was renamed `vivijure-search` to `slate-search` to reflect its true owner, the bot image is built and pushed to GHCR on version tags, and production deploys are now an IaC tag-driven flow. Hardcoded database ids and internal fleet topology came out of the public repo.

AGPL-3.0. No public invite: Slate is a Discord bot you deploy for your own server.

Code: [github.com/skyphusion-labs/slate](https://github.com/skyphusion-labs/slate).
