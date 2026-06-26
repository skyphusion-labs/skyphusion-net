---
title: "Slate: co-writing films in Discord, shipping them to Vivijure"
description: "Slate is the Discord front door to Vivijure: a collaborative screenwriter assistant that keeps a structured storyboard brief in channel, generates portraits and thumbnails, searches the web and a knowledge base, and submits finished bundles to the Vivijure studio API when the crew is ready."
pubDate: 2026-06-25
tags: ["vivijure", "discord", "ai", "cloudflare", "film", "side-project"]
draft: false
---

Every film in the Vivijure stack starts as a conversation. **Slate** is the Discord side of that: a collaborative screenwriter assistant that lives in channel with your crew, keeps a machine-readable storyboard brief in the background, and hands the finished bundle to [Vivijure](https://github.com/skyphusion-labs/vivijure) when you say ship it.

Slate does not render anything. It does not own GPU logic. The [Vivijure studio](https://vivijure.skyphusion.org) is the single source of truth from bundle assembly through finished film delivery back to the channel.

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

AGPL-3.0. No public invite: Slate is a Discord bot you deploy for your own server.

Code: [github.com/skyphusion-labs/slate](https://github.com/skyphusion-labs/slate).
