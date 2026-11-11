---
title: "Prism 1.0: playground, control plane, phones, and MCP"
description: "Prism is a product line at 1.0: AGPL playground and metered control plane, iOS and Android clients, MIT MCP for agents, ~93 models, and honest gaps. Conrad Rockenhaus maps the doors, hosts, and repos."
seoDescription: "Prism is a product line at 1.0: AGPL playground and metered control plane, iOS and Android clients, MIT MCP for agents, ~93 models, and honest gaps."
pubDate: 2026-08-07
tags: ["cloudflare", "ai", "llm", "rag", "workflows", "mcp", "side-project"]
draft: false
---

I tagged **Prism 1.0** as a line of software, not a single binary.

Earlier posts covered the [Worker architecture](/blog/llm/) and the [public signup / BYOK cutover](/blog/prism-public/). This post is the 1.0 map: what shipped, which door to use, and where the source lives.

## What Prism is now

Prism is a multimodal AI system on Cloudflare.

- **Chat, image, video, music, TTS, STT, and live voice**
- Catalog breadth about **93** models (live list from `GET /api/models` on the playground, or `GET /v1/models` on the plane)
- **RAG, projects, conversation compact**, long jobs, and artifacts on the playground Worker
- **Commercial metering** on a separate control plane (identity, balance, rate limits; no prompt storage)
- **Native clients** on iOS and Android against that plane
- **Agent MCP** against the playground HTTP API

One catalog. Several doors. You pick the door that matches how you work.

## The line (1.0)

| Piece | Role | License | Source |
|-------|------|---------|--------|
| **prism** | Playground Worker + web UI. Public signup. Per-user AI Gateway BYOK. History, RAG, compact, Workflows. | AGPL-3.0 | [github.com/skyphusion-labs/prism](https://github.com/skyphusion-labs/prism) |
| **prism-control-plane** | Meter and policy plane. Enroll, balance, rate limit, metered doors, long-run jobs, store redeem. Does not store prompts. | AGPL-3.0 | [github.com/skyphusion-labs/prism-control-plane](https://github.com/skyphusion-labs/prism-control-plane) |
| **prism-ios** | Native iOS client. Bearer `pcp_` against the plane. StoreKit credit packs. | AGPL-3.0 | [github.com/skyphusion-labs/prism-ios](https://github.com/skyphusion-labs/prism-ios) |
| **prism-android** | Native Android client. Same contract as iOS. | AGPL-3.0 | [github.com/skyphusion-labs/prism-android](https://github.com/skyphusion-labs/prism-android) |
| **prism-mcp** | MIT MCP Worker. Agents call curated tools over Streamable HTTP. Proxies to playground with a seeded session cookie. | MIT | [github.com/skyphusion-labs/prism-mcp](https://github.com/skyphusion-labs/prism-mcp) |

## Live hosts

| Host | What it is |
|------|------------|
| [play.skyphusion.org](https://play.skyphusion.org) | Public playground (`AUTH_MODE=public`) |
| [play-proxy.skyphusion.org](https://play-proxy.skyphusion.org) | Control plane (Bearer `pcp_`) |
| [prism-mcp.skyphusion.org](https://prism-mcp.skyphusion.org) | Hosted MCP door (Bearer `MCP_TOKEN`) |

Self-host stays first-class for the AGPL Workers. Scaffold playground with `npm create @skyphusion/prism`. Pin `@skyphusion/prism-mcp` for your own agent door.

## How the pieces fit

**Humans (browser):** sign up on play, paste your AI Gateway slug and token, pick a model. Conversations and files stay on the playground Worker. Model spend is yours.

**Humans (phone):** enroll on the control plane, hold a device key, buy credit packs when needed. The plane meters inference and ledger rows. It does **not** keep your prompt text.

**Agents:** connect MCP to `prism-mcp` with a Bearer token. The Worker holds `PRISM_SESSION` (the playground cookie). The agent never sees that cookie. Compromise of the agent means rotate `MCP_TOKEN` only.

**Hybrid:** a playground account can store a `pcp_` in prefs so some paths spend through the plane. Native apps still talk to the plane directly. History and compact stay on the playground by design.

## Catalog at a glance

Rough split of the shared ~93-model catalog (counts move; the live endpoints win):

| Modality | Order of magnitude |
|----------|--------------------|
| Chat | ~44 |
| Image | ~21 |
| Video | ~19 |
| TTS | ~3 |
| STT | ~4 |
| Music | ~1 |
| Live voice (Flux stream) | ~1 |

Inference rides **Cloudflare AI Gateway** and **Unified Billing** (plus Workers AI). Long video and music jobs use Workflows on the playground; the plane has its own long-run job path for commercial doors.

## Agent parity (MCP 1.0)

`prism-mcp` 1.0 claims **full HTTP agent parity** for the playground `/api/*` surface: chat and multimodal generate, history, conversations, **compact**, RAG, projects, Discord import, job poll, artifacts, prefs. Escape hatch: `prism_request` for any path.

What is **not** a first-class MCP tool yet:

- **Live duplex voice** (WebSocket `/api/stt/stream`, Deepgram Flux). MCP is request/response. Agents approximate with batch STT via `chat`, then chat, then `tts`.
- **Direct control-plane doors.** This MCP talks to **prism**, not play-proxy. Phone-shaped commercial surface stays on native clients (or a future plane MCP).

Docs and diagrams: [prism-mcp README](https://github.com/skyphusion-labs/prism-mcp#readme) and [docs/PARITY.md](https://github.com/skyphusion-labs/prism-mcp/blob/main/docs/PARITY.md).

## Privacy split (state it plainly)

| Surface | Stores conversation text? | Stores usage money rows? |
|---------|---------------------------|---------------------------|
| Playground (prism) | Yes (history, RAG chunks, projects) | Your gateway bills you |
| Control plane | **No** (ledger is counts and micro-USD) | Yes |
| prism-mcp | No (stateless proxy) | N/A |

If host-held chat is wrong for you, run the playground on your own account with `AUTH_MODE=access` and keep data off my public instance.

## What I will say out loud

- 1.0 is a **line cut**, not "done forever." Catalog and clients keep moving.
- Live mic on agents is the honest residual gap.
- App Store / Play store listing and credit redeem are product surfaces on the native apps; they are not required for self-host playground or MCP against your own session.
- Aviation-grade `main` on the public repos: PR + CI, no drive-by direct push.

## Start here

1. Browser: [play.skyphusion.org](https://play.skyphusion.org)  
2. Architecture story: [Building Prism](/blog/llm/)  
3. Public auth story: [Prism is open](/blog/prism-public/)  
4. Repos: table above  

Create an account, or clone the door you need. File issues where the map is wrong.
