---
title: "Building Prism: multimodal AI on Cloudflare Workers"
description: "Architecture and lessons from Prism, a multimodal AI playground as a single Cloudflare Worker: 35 chat models across five providers, voice chat, RAG, projects, Discord ingestion, web search, SSE streaming, Workflows for durable video and music jobs, and a public demo mode where each user brings their own AI Gateway credentials."
pubDate: 2026-05-23
updatedDate: 2026-06-25
tags: ["cloudflare", "ai", "rag", "workflows", "llm", "side-project"]
draft: false
---

I built **Prism**, a multimodal AI playground shipped as a single Cloudflare Worker with a vanilla JS frontend. Chat with 35 models across five providers, generate images, video, music, speech, and transcription, run RAG over your own files, talk to any chat model by voice and hear it answer back, organize work in projects, import Discord exports, and optionally fold in web search. Total infrastructure cost at idle: $0. Source under AGPL-3.0 at [github.com/skyphusion-labs/prism](https://github.com/skyphusion-labs/prism).

The repo used to be called `skyphusion-llm-public`. It was extracted from the Vivijure video studio in v0.163 so the playground could stand on its own. The name is **Prism** now. The URL slug here is still `/blog/llm/` for anyone who bookmarked the old post.

This write-up is less a feature catalog (the README covers that) and more what I learned deploying and running it.

## What it does today

One Worker behind Cloudflare Access. Authenticated users hit a single-page web UI: model picker, composer, attachment uploader, history sidebar, document library, and project scoping.

The catalog has roughly 71 entries across seven modalities:

- **Chat (35 models, 5 providers):** Workers AI (Llama, Qwen, DeepSeek R1, Mistral, Gemma, and others), Anthropic Claude, xAI Grok, OpenAI GPT-5.x, Google Gemini. All bill through **Cloudflare Unified Billing** on your AI Gateway except Workers AI's own models. No per-provider API keys for chat anymore. The one BYOK escape hatch left is **OpenAI image only**: an optional `OPENAI_API_KEY` for transparent PNG on `gpt-image-1.5`, because the Unified Billing proxy rejects `background` / `output_format`.
- **Image (11 models):** FLUX family on Workers AI, plus Nano Banana Pro, GPT Image 1.5, Recraft V4 via Unified Billing.
- **Video (16 models):** Veo, Seedance, Hailuo, Grok Imagine Video, Runway, HappyHorse, PixVerse, Vidu. All Unified Billing, all durable via Workflows.
- **Music, TTS, STT:** MiniMax Music 2.6; Aura-2 and MeloTTS; Whisper variants and Deepgram Nova-3 for one-shot transcription.
- **Voice chat:** Deepgram Flux over a WebSocket Durable Object, then the normal chat path, then Aura-2 TTS spoken back. Any of the 35 chat models, hands-free.

**RAG** ingests text-decodable files (PDF per-page via `unpdf`, spreadsheets per-sheet via SheetJS, everything else UTF-8). Binary garbage (`.docx`, images) is rejected. Chunks embed with BGE-base into Vectorize; text lives in D1. Toggle "use my docs" per turn for top-5 retrieval. ZIP import runs as a Workflow, one step per inner file.

**Projects** scope retrieval and default system prompts. **Discord ingestion** parses DiscordChatExporter JSON into conversation-aware chunks inside a project. **Web search** (opt-in per turn) hits Tavily, Brave, and Wikipedia in parallel and folds snippets into the prompt like RAG chunks.

**Streaming:** `POST /api/chat/stream` returns SSE on 34 of 35 chat models (LLaVA 1.5 is the lone non-streaming vision model). Client disconnect aborts the upstream call.

The worker is roughly 4,150 lines in `index.ts` plus extracted modules, with about 12k lines of vanilla frontend. No React, no Astro, no app bundler beyond TypeScript and Wrangler.

## Why one Worker on Cloudflare

Three reasons, same as when I started, still true.

**The `env.AI` binding.** One call surface for chat, image, TTS, STT, video, music, and embeddings. Paid third-party models route through the AI Gateway with `cf-aig-authorization`; you fund Cloudflare credits instead of juggling six SDKs.

```typescript
const result = await env.AI.run(
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  { messages },
  { gateway: { id: gatewayId } }
);
```

Anthropic, xAI, and Gemini need native request shapes, so per-provider helpers transform our internal `messages` array. Everything else rides the binding.

**D1 + R2 + Vectorize** without leaving the platform. D1 holds chat rows, conversation indexes, RAG chunk text, projects, Discord messages, and user prefs. R2 holds every binary artifact. Vectorize holds embeddings. D1 never stores bytes.

**Cloudflare Access** for auth. The worker reads `Cf-Access-Authenticated-User-Email` and scopes history, R2 ownership, documents, and prefs by that email. R2 objects carry `customMetadata.user_email`; `GET /api/artifact/*` rechecks before streaming.

Idle cost is genuinely zero. Workers Paid ($5/month) is required because `unpdf` plus `xlsx` pushed the bundle past the free 1MB compressed limit. That is fixed overhead, not per-request.

## Public demo mode

v0.164 added a deployment pattern where the worker ships **without** deployer-level `GATEWAY_ID` / `CF_AIG_TOKEN`. Each Access user stores their own AI Gateway slug and token in D1 `user_prefs` via an Account menu. Cloudflare Access can be set to Allow + Everyone on a separate worker URL. Forkers get a public demo without the operator funding everyone's inference. Private installs still use email allowlists and deployer secrets.

## The `waitUntil` trap and why Workflows won

Long jobs (Unified Billing video and music, 30 seconds to three minutes) originally used `ctx.waitUntil` after returning `pending` from `POST /api/chat`. Worked in dev. In production, jobs stuck forever.

`waitUntil` gets roughly 30 seconds after the response is sent. Video generation takes longer. The background task died mid-call.

BYOK video models with submit-and-poll APIs got a per-poll fix first: each `GET /api/job/:id` runs one upstream poll in a fresh invocation. Unified Billing models use a single blocking `env.AI.run`, so that does not help.

**Cloudflare Workflows** (`LongRunWorkflow`) own video, music, and ZIP import now. Steps retry independently across invocations. Workflow return values cap at 1 MiB, so download and R2 upload stay in the same step (retry re-downloads from Cloudflare's catalog R2 if upload fails).

Workflows do not run in `wrangler dev --remote`. Deploy to test video, music, or ZIP import.

## Voice needs a Durable Object

Flux conversational STT is a WebSocket session with turn detection. A plain Worker cannot reliably hold transcript state across WebSocket close and the follow-up chat call. `SttSession` is a Durable Object with hibernation API support. Voice chat is entirely Cloudflare stack (Flux + Aura-2), no third-party STT/TTS billing.

## RAG bugs I shipped

Before v0.9.3, `retrieveContext` swallowed errors and returned `[]`. Users thought relevance was bad; every query was hard-failing.

v0.9.4 fixed a separate bug: Vectorize V2 expects `returnMetadata` as the string `'none'`, `'indexed'`, or `'all'`, not a boolean `false`. Every query returned `VECTOR_QUERY_ERROR (40026)` until I dropped the bogus arg.

Lesson: empty-array catch blocks are debt. Log and surface `retrieval_error` in the API response.

## Storage split worth copying

| Data | Location |
|---|---|
| Chat metadata, conversation text, chunk text | D1 |
| Generated and input binaries | R2 |
| Embeddings | Vectorize |
| User identity | Access header + R2 `customMetadata` |

`DELETE /api/history/:id` cleans R2 best-effort after D1 delete. Orphans are cheap to garbage-collect offline.

## Multimodal input (honest limits)

- **Images:** downscaled client-side to 1280px max before upload.
- **Audio (chat):** transcribed via Whisper before the chat call; raw audio not kept in R2 on that path.
- **Video (chat):** eight client-extracted keyframes, not full temporal understanding. Good enough for "what is happening in this clip" questions, not for native video models.
- **Proxied OpenAI and Gemini chat:** text-only in the catalog today (`capabilities: []` for multimodal on those entries).

## What Prism is and is not

A reference template for the Cloudflare AI stack, not a SaaS competitor to ChatGPT. Patterns over model count: one binding, gateway observability, D1/R2/Vectorize split, Workflows for durability, Access for auth, optional public demo with per-user gateway creds.

Fork it if you want your own corner of the model ecosystem. PRs welcome; see [CONTRIBUTING.md](https://github.com/skyphusion-labs/prism/blob/main/CONTRIBUTING.md).

AGPL-3.0: if you run it as a network service, you owe your users source access. Seems right for a project like this.

Code: [github.com/skyphusion-labs/prism](https://github.com/skyphusion-labs/prism).
