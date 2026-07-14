---
title: "Vivijure runs anywhere now: Cloudflare, your home box, or any cloud server"
description: "The Vivijure control panel is no longer Cloudflare-only. Conrad Rockenhaus walks the constellation after the host split: vivijure-cf on Workers, vivijure-local on Docker (home PC or any cloud VM), vivijure-core unifying both, vivijure-mcp for agents, plus Slate, RunPod, own-GPU doors, and the finish engines. Same studio API either way."
pubDate: 2026-07-13
tags: ["vivijure", "ai", "gpu", "cloudflare", "docker", "self-hosted", "homelab", "mcp", "side-project"]
draft: false
---

I have already introduced the [Vivijure constellation](/blog/vivijure-constellation/), the [first full film](/blog/vivijure-first-run/), and the [talking character](/blog/vivijure-talking-character/). Those posts still stand. This one is the update that changes where you can stand the studio up.

For most of Vivijure's life the control panel lived on Cloudflare Workers, and that was an honest choice: free tier, edge deploy, almost no ops. It was also a single door. If you did not want a Cloudflare account, or you wanted the planner, cast, and JSON API on iron you already paid for, the answer was incomplete.

That is no longer true. The control panel runs on Cloudflare, on a home computer, or on any cloud server that can run Docker. Same studio UI. Same module contract. Same agents. You pick the host.

## What changed

The studio is no longer one monorepo that is also the deploy target. It is a small family of host and library repos, all AGPL-3.0 under [Skyphusion Labs](https://skyphusion.org):

| Piece | Role |
|---|---|
| **[vivijure](https://github.com/skyphusion-labs/vivijure)** | Constellation map. Start here. |
| **[vivijure-cf](https://github.com/skyphusion-labs/vivijure-cf)** | Cloudflare Workers control panel (currently v0.21.3). |
| **[vivijure-local](https://github.com/skyphusion-labs/vivijure-local)** | Self-hosted control panel: Node, SQLite, MinIO/S3, Docker Compose. |
| **[vivijure-core](https://github.com/skyphusion-labs/vivijure-core)** | Shared orchestration on npm (`@skyphusion-labs/vivijure-core`, currently 0.9.5). |
| **[vivijure-mcp](https://github.com/skyphusion-labs/vivijure-mcp)** | Agent MCP that talks to either host over `STUDIO_URL`. |

I cut the pieces in mid-July 2026: `vivijure-local` on the 11th, `vivijure-core` on the 12th, `vivijure-cf` and `vivijure-mcp` on the 13th. The boring part of the work was the extract. Both hosts now import orchestration from the same published package instead of carrying a private copy of the film pipeline. The interesting part is the Platform ICD: a frozen adapter surface so the orchestrator never touches Worker bindings or `process.env` directly. D1 maps to SQLite. R2 maps to MinIO or any S3-compatible store. Module service bindings map to HTTP sidecars. Same `CONTRACT.md` wire shapes either way.

If you remember the old story as "fork `vivijure` and deploy a Worker," update that map. The deployed hosts are `vivijure-cf` and `vivijure-local`. The `vivijure` repo is the front door and constellation guide.

## Run it on Docker in three commands

This is the path I want people to try first if they already have a machine:

```bash
git clone https://github.com/skyphusion-labs/vivijure-local
cd vivijure-local
npm run install:studio      # mint token, seed secrets, write .studio-token
npm run compose:up          # pull GHCR :latest and docker compose up -d
curl -fsS http://127.0.0.1:8790/health
```

Open `http://127.0.0.1:8790`, paste the token from `.studio-token`, and you are in the same planner UI the Cloudflare host serves. You need Docker Compose v2 and roughly 4 GB of disk for images and MinIO. You do not need a Cloudflare account. You do not need a GPU in Docker for the demo path; compose ships mock keyframe and local-gpu sidecars so the pipeline can prove itself before you point at real silicon.

Prove the render path:

```bash
npm run smoke:exit          # bundle -> render -> poll -> artifact
```

That smoke is not a unit-test green check. It is an end-to-end homelab run: bundle, submit, poll, and collect an artifact. There is also Playwright coverage on the control panel itself. We treated "it works on my box" as a product claim, not a hope.

This is still a single-operator trust model. Keep it on a network you control. The studio fails closed: every `/api/*` call needs a bearer token.

## Or stay on Cloudflare

If you want the edge path, that is [vivijure-cf](https://github.com/skyphusion-labs/vivijure-cf). It is the Workers host: D1, R2, service-bound module workers, the studio UI under `public/`, and the guided deploy script. It also consumes `@skyphusion-labs/vivijure-core` at `^0.9.5`, same as the local host. Recent work there includes direct core imports (no shim layer), MCP consumed from the extracted package, and a `CORE_ONLY_DEPLOY` switch so you can redeploy the control plane without touching an independently managed module fleet.

My live demo still sits at [vivijure.skyphusion.org/welcome](https://vivijure.skyphusion.org/welcome). Cloudflare remains a great door. It is just no longer the only door.

## The rest of the constellation did not move

The host split changed where the control panel lives. It did not rewrite the studio's shape. Everything around it still plugs into the same typed module contract (`vivijure-module/2`):

- **[slate](https://github.com/skyphusion-labs/slate)** writes with you in Discord and hands a finished storyboard to either host through the JSON API. Control-panel parity from chat was always the bar; the destination is now "whichever studio URL you run."
- **[vivijure-backend](https://github.com/skyphusion-labs/vivijure-backend)** is still the RunPod datacenter GPU engine: LoRA training, SDXL keyframes, Wan image-to-video, release-gated images that have to render a real film before they promote.
- **[vivijure-local-12gb](https://github.com/skyphusion-labs/vivijure-local-12gb)** and **[vivijure-local-16gb](https://github.com/skyphusion-labs/vivijure-local-16gb)** are still the own-card motion doors (LTX at a proven 12GB floor, CogVideoX-5B at a proven 16GB floor). They pair with either control panel.
- **[vivijure-musetalk](https://github.com/skyphusion-labs/vivijure-musetalk)**, **[vivijure-upscale](https://github.com/skyphusion-labs/vivijure-upscale)**, and **[vivijure-audio-upscale](https://github.com/skyphusion-labs/vivijure-audio-upscale)** are still the opt-in finish satellites.
- The **CPU media stack** (video-finish, image-prep, audio-beat-sync, audio-master, audio-mix) still keeps concat, mux, captions, and loudness off the GPU bill. On the Cloudflare host it lives under `vivijure-cf/containers`. On the local host, compose brings the CPU services up with the studio.

```
you (web UI, Slate in Discord, or an MCP client)
        |
        +-- vivijure-cf (Workers) ----+
        |                             |
        +-- vivijure-local (Docker) --+--> vivijure-core
                                      |
                       modules / GPU engines / finish / CPU media
```

One rule still holds: the Studio is the source of truth, and every expensive capability is an opt-in module. Swap a motion backend per shot. Skip finish engines you do not want. Host the control panel where the ops story fits your life.

## Agents get the same API on both hosts

**[vivijure-mcp](https://github.com/skyphusion-labs/vivijure-mcp)** is a small, stateless MCP server that proxies curated tools to the studio HTTP API. Point `STUDIO_URL` at your Cloudflare deployment or at `http://127.0.0.1:8790`. Claude Code, Cursor, and anything else that speaks MCP can plan, cast, submit a render, and poll to done without caring which runtime is underneath. Both hosts consume it from npm; the Studio MCP used to live closer to the monolith, then moved into core, then extracted to its own package so the surface can version independently of either host.

That is the real point of the Platform ICD. When the control plane is portable, the agent door is portable too.

## Why I did the split

I like Cloudflare. A lot of Skyphusion Labs still runs there. I do not like a product pitch that says "you own it" and then quietly requires one vendor for the control plane. Owning the artifacts in your own bucket is half the story. Owning the process that orchestrates the film is the other half.

Docker-on-your-box is not idealism. It is the deployment shape people already know: a VPS, a homelab mini, a spare tower under the desk. `compose up` is a lower permission ask than "create a Cloudflare account, learn wrangler, bind D1 and R2." Both paths are real. Neither path is the second-class citizen.

There is still rough edge. Vivijure is not a polished public release yet. Standing up production modules and a real GPU still takes operator care. The promise I am making in this post is narrower and already proven on the wire: the control panel contract runs outside Cloudflare, the shared core is on npm at 0.9.5 for both hosts, and a fresh Docker clone can open the studio UI and pass the smoke path without asking anyone for a Workers account.

## Where to go

- Product site: [vivijure.com](https://vivijure.com)
- Constellation map: [github.com/skyphusion-labs/vivijure](https://github.com/skyphusion-labs/vivijure)
- Cloudflare host: [vivijure-cf](https://github.com/skyphusion-labs/vivijure-cf)
- Self-hosted host: [vivijure-local](https://github.com/skyphusion-labs/vivijure-local) ([quickstart](https://github.com/skyphusion-labs/vivijure-local/blob/main/docs/quickstart.md))
- Shared core: [vivijure-core](https://github.com/skyphusion-labs/vivijure-core)
- Agent MCP: [vivijure-mcp](https://github.com/skyphusion-labs/vivijure-mcp)
- Live demo: [vivijure.skyphusion.org/welcome](https://vivijure.skyphusion.org/welcome)

Everything above is free software under AGPL-3.0, built by me, Conrad Rockenhaus, with the [Skyphusion Labs](https://skyphusion.org) crew. The studio was always meant to be yours. The control panel finally got the same memo.
