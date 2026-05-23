---
title: "Building skyphusion-llm-public: multimodal AI on Cloudflare Workers"
description: "Architecture and lessons from building a 39-model multimodal AI playground as a single Cloudflare Worker. Notes on the env.AI binding, BYOK vs Unified Billing, the waitUntil cancellation story, RAG bugs, Cloudflare Workflows for durable execution, and what I'd do differently."
pubDate: 2026-05-23
tags: ["cloudflare", "ai", "rag", "workflows", "llm", "side-project"]
draft: false
---

I built a multimodal AI playground as a single Cloudflare Worker. Chat with 39 models across six providers, generate images, video, music, speech, transcribe audio, run RAG over your own PDFs, multi-turn conversations. Total infrastructure cost at idle: $0. Source under AGPL-3.0 at [github.com/SkyPhusion/skyphusion-llm-public](https://github.com/SkyPhusion/skyphusion-llm-public).

This post is less "feature catalog" (the README does that) and more "things I learned by deploying it." Topics:

- The unified `env.AI` binding and why it's a better surface than wrangling six provider SDKs
- Why I picked BYOK over Cloudflare Unified Billing for some providers and not others
- The `ctx.waitUntil` cancellation story (and why Cloudflare Workflows is the answer)
- RAG: per-page PDF and per-sheet XLSX boundaries, and the silent-failure bug I shipped
- Multi-turn conversations as a D1 schema rather than a stateful primitive
- Cost discipline and where the bills come from

## What it does

One Worker behind Cloudflare Access. Authenticated users hit a single-page web UI with a model picker, prompt boxes, attachment uploader, history sidebar, and document library. Pick a model, type a prompt, optionally attach images / audio / video / documents, hit run.

The 39 chat models span:

- Workers AI (free tier 10k neurons/day, otherwise $0.011 per 1k neurons): Llama 4 Scout, Llama 3.x, Qwen 3 / 2.5, DeepSeek R1, Mistral, Gemma 4, Granite 4, Nemotron 3, GLM 4.7, Hermes, GPT-OSS 120B/20B, Kimi K2.6
- Anthropic BYOK: Opus 4.7 / 4.6, Sonnet 4.6, Haiku 4.5
- xAI BYOK: Grok 4.3, 4.20 (multi-agent and reasoning), Build 0.1
- Google BYOK: Gemini 3.5 Flash, 3.1 Pro / Flash, 2.5 Pro
- OpenAI BYOK: GPT-5.5, GPT-5.4, GPT-5.4 mini
- Amazon Bedrock BYOK: Nova 2 Lite / Pro, Nova Lite / Pro, plus TwelveLabs Pegasus 1.2 (video understanding)

Plus image gen (FLUX 2 Klein 9B/4B, FLUX 2 Dev, FLUX-1 schnell, Lucid Origin, Phoenix, Dreamshaper, OpenAI GPT Image 2), video gen (Veo 3.1, Seedance, Hailuo, Gen-4.5, others), music gen (MiniMax Music 2.6), TTS (Aura-2, MeloTTS, GPT-4o mini TTS), and STT (Whisper variants, GPT-4o Transcribe).

Inputs aren't text-only. Vision-capable chat models accept images (downscaled client-side to 1280px max), audio (Whisper-transcribed before the chat call), and video (eight evenly-spaced keyframes extracted client-side via HTML5 video plus canvas). Pegasus 1.2 is the exception: it takes the raw video file directly because that's its whole point.

The whole worker is roughly 3,100 lines of TypeScript, plus 1,800 of vanilla JS, CSS, HTML, and SQL. No framework, no build step beyond `tsc --noEmit` for type checking. esbuild handles bundling at deploy.

## Why Cloudflare Workers specifically

Three reasons.

First, the `env.AI` binding. One call surface for chat, image gen, TTS, STT, video, music, and embeddings. The provider could be Workers AI directly, OpenAI via the AI Gateway proxy, Anthropic via the AI Gateway proxy, anything routed through the gateway. From the application code:

```typescript
const result = await env.AI.run(
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  { messages },
  { gateway: { id: env.GATEWAY_ID } }
);
```

That's it. Behind the scenes the AI Gateway handles caching, rate-limiting, logging, and optionally key injection (so the gateway dashboard holds the provider key and the worker doesn't need a secret). For models that need a different request shape (Anthropic's Messages API, Google's `contents` array, Bedrock's Converse API, Bedrock's InvokeModel for Pegasus), the worker dispatches to a per-provider helper that does the transform. Everything else goes through the binding directly.

Second, D1 and R2 cover the storage need without external dependencies. D1 holds chat history, multi-turn conversation indexes, and RAG chunk text. R2 holds binary artifacts (input images, generated images / audio / video, document originals). Both have generous free tiers and the worker can read/write them without auth juggling.

Third, Cloudflare Access in front of the worker URL provides per-user authentication for free up to 50 seats on Zero Trust. The worker reads `Cf-Access-Authenticated-User-Email` and scopes everything (history, R2 ownership, RAG corpus) by that email. R2 objects carry `customMetadata.user_email`, and `GET /api/artifact/*` checks ownership before streaming. Cross-user access is impossible even if someone guesses a UUID, which matters because UUIDs leak through URLs that get pasted around.

The combined cost at idle is genuinely zero. There's no "running" cost because Workers don't have idle instances. At low usage everything stays inside the free tier (D1 storage, R2 storage, Workers requests). Past v0.9.0 I had to upgrade to the Workers Paid plan at $5/month because the `unpdf` plus `xlsx` bundle pushed past the 1MB compressed worker size limit, but that's a fixed cost, not per-request.

## The BYOK vs Unified Billing decision

Workers AI ships dozens of first-party models. Third-party models on Cloudflare come through either Cloudflare's Unified Billing (you fund CF credits, CF bills you for usage) or BYOK (you bring your own provider API key, the provider bills you directly).

I support both, model-by-model, via a `byok_alias` field in the catalog:

```typescript
{
  id: "google/veo-3.1-fast",
  // ...
  provider: "google",
  byok_alias: "veo-3.1-fast-generate-001",
}
```

If `byok_alias` is set and the provider has a known BYOK path, the worker hits the per-provider endpoint with stored or inline keys. Otherwise it goes through `env.AI.run`, which requires Unified Billing credits.

Why both? BYOK is cheaper at scale because there's no Cloudflare markup. Unified Billing is simpler at small scale because there's only one bill, and it covers models that don't have a public direct API (most of the partner-only video gen models: Seedance, Hailuo, Gen-4.5, HappyHorse, PixVerse, Vidu). For models I have keys for (Anthropic, xAI, Google, OpenAI, AWS) BYOK wins. For the partner-only stuff I either pay Unified Billing or skip the model.

There's a subtle gotcha with the AI Gateway's xAI proxy: it only supports the OpenAI-compatible `/v1/chat/completions` schema. xAI's `/v1/videos/generations` endpoint returns 404 through the gateway. I had to make those calls hit `api.x.ai` directly, which means no gateway caching or analytics for video gen specifically. That's marginal for 1-3 minute generations, so it's fine.

## The `ctx.waitUntil` cancellation story

This is the most interesting failure mode I hit, and it took three releases (v0.10.2, v0.10.3, v0.12.0) to fully resolve.

Original architecture for long-running jobs (video and music generation, which take 30 seconds to 3 minutes):

1. `POST /api/chat` writes a `status='pending'` row to D1, schedules background work via `ctx.waitUntil(...)`, returns immediately.
2. Background work calls `env.AI.run` (blocks for the generation duration), downloads the result, uploads to R2, updates D1 to `status='done'`.
3. Frontend polls `GET /api/job/:id` every 5 seconds. That endpoint just reads D1.

This worked in dev. In production, video jobs got stuck in `pending` forever. The diagnostic was confusing because everything looked fine: the model started, then nothing. No error in the logs.

The root cause: `ctx.waitUntil` only gets approximately 30 seconds of CPU and wall-clock budget after the HTTP response is sent. Video generation takes 1-3 minutes. The background task was getting killed mid-call. By the time `env.AI.run` returned, there was no worker invocation alive to receive the result.

The v0.10.2 fix for BYOK video models was submit-and-poll: instead of doing the whole generation in one background task, submit synchronously (one fast HTTP call), persist the upstream `job_id` to D1, return immediately. Then each `GET /api/job/:id` from the frontend triggers ONE upstream poll in a fresh worker invocation. Each invocation has its own ~30s budget, plenty for one round-trip. When the upstream reports done, that same invocation downloads to R2 and finalizes D1.

This works perfectly for xAI Grok and Google Veo BYOK where the upstream has a submit-and-poll API. It doesn't help for Unified Billing models because `env.AI.run` is a single blocking call, not a submit-and-poll cycle.

The v0.12.0 fix for Unified Billing was Cloudflare Workflows. Workflows are a durable execution primitive: a multi-step async task that survives across worker invocations, with independent retry per step. The `LongRunWorkflow` class invokes the model, downloads the artifact, uploads to R2, and finalizes D1, across three steps that retry independently if they fail.

One implementation detail worth knowing: Workflows cap step return values at 1 MiB. Video files are 5-15MB and music files are 3-5MB, so I can't pass bytes between steps. The download and R2 upload have to be the same step. Trade-off: if R2 upload fails after a successful download, the retry re-downloads from the source URL. That source is Cloudflare's catalog R2, so the redownload is cheap and reliable. Acceptable.

Workflows are not supported in `wrangler dev --remote`, so the Unified Billing paths only work in a deployed environment. Local dev is fine for everything else.

This is the kind of bug that makes you appreciate the difference between "works on my machine" and "works in production." `ctx.waitUntil` was the obvious tool. It wasn't the right tool. Cloudflare Workflows is the right tool, and Cloudflare has written about it well, but you don't reach for it until you've felt the pain.

## RAG: ingestion, retrieval, and a silent-failure bug

The RAG pipeline ingests `.txt`, `.md`, `.pdf`, and `.xlsx` / `.xls` files. The design decisions, in order:

**Chunking.** Roughly 500 chars per chunk with 50-char overlap, breaks on natural boundaries (paragraph, then newline, then sentence) when possible. Boring but works. The interesting bit is the per-format extractor pipeline: PDFs get per-page extraction via `unpdf`, XLSX/XLS gets per-sheet CSV extraction via SheetJS, txt/md gets straight UTF-8 decode. Each extracted chunk carries optional `page` (PDFs) or `sheet` (XLSX) metadata. Chunks never cross page or sheet boundaries, so the source-location attribution stays meaningful.

**Embeddings.** `@cf/baai/bge-base-en-v1.5`, 768 dimensions, free Workers AI. Batched 16 at a time so any single request stays small.

**Storage.** Vectorize holds the vectors with metadata (`user_email`, `document_id`, `chunk_index`, plus `page` or `sheet` when applicable). D1's `chunks` table holds the original text keyed by `vector_id`. Per-user scoping happens at the D1 layer (`WHERE user_email = ?` in the JOIN), not at the Vectorize layer, so I don't need a Vectorize metadata index. Simpler for single-user-per-corpus deployments.

**Retrieval.** Embed the query, query Vectorize for top-K (default 5), JOIN against D1 to get source text and source-location metadata, return scored chunks. The chunks fold into the system prompt as numbered excerpts before the LLM call. The UI renders the chunks above the model's response with filename, chunk index, page or sheet, and score, so users can see exactly what context was used.

The silent-failure bug: before v0.9.3, `retrieveContext` had try/catches around every step (embed, Vectorize query, D1 lookup) that swallowed errors and returned an empty array. Users reported that "use my docs" wasn't finding anything. From my end it looked like a relevance problem. It was actually hard-failing on every query.

The cause turned out to be a separate bug in v0.9.4: I was passing `returnMetadata: false` to Vectorize V2's query API. Vectorize V2 expects `returnMetadata` as a string enum (`'none'`, `'indexed'`, `'all'`), not a boolean. Passing `false` caused every query to fail with `VECTOR_QUERY_ERROR (40026): Failed to parse the request body as JSON: returnMetadata: expected value at line 1 column 28`. The error was visible in `wrangler tail` but only after I added the logging, because the old code swallowed it.

Lessons:

1. Try/catches that return empty arrays are technical debt with interest accruing the moment you ship them.
2. New APIs have stricter type validation than old ones. Don't assume the old shape works.
3. Always log and propagate errors during development; suppress them only with intent and justification.

The v0.9.3 fix changed `retrieveContext` to return `{ chunks, error }` and surface the error in the API response as `retrieval_error`. The v0.9.4 fix dropped the bogus `returnMetadata` arg entirely (the default is `'none'`, which is what I wanted).

## Multi-turn as a D1 schema decision

v0.10.0 added multi-turn conversations. The architectural question was where to put the "conversation" abstraction.

Options I considered:

1. Separate `conversations` table with a `chats.conversation_id` foreign key and a join on read. Standard normalization. Adds a second table to maintain.
2. Conversation ID and turn index columns on `chats`. Denormalized. One table.
3. JSON blob per conversation, one row per conversation, append turns into the blob. One row, but updates rewrite the whole blob, and indexing is awkward.

I picked option 2. Each chat row gets a `conversation_id` (TEXT) and `turn_index` (INTEGER). For chat models that continue a conversation, the worker pulls prior turns from D1 ordered by `turn_index` and assembles a `[system, user1, assistant1, user2, assistant2, ..., userN]` message array. For non-chat model types (image gen, TTS, etc.) I use synthetic IDs like `single-<id>` so they still group as single-turn conversations in the sidebar UI.

Backward compat for existing rows: a migration assigns `conversation_id = 'legacy-<id>'` and `turn_index = 0` to anything where `conversation_id` was NULL. They render as single-turn conversations under those keys. No data loss, no orphans.

Mixed-model conversations are allowed. Start a thread with Llama 3.3 70B, continue with Claude Opus 4.7. Each turn picks its own model. The continuation logic passes prior turns as text-only; attachments from earlier turns aren't re-sent. This was a deliberate decision: re-sending images on every turn doubles the cost and most providers handle this poorly anyway. If the user wants to reference an earlier image they can re-attach it.

The `idx_chats_conversation` index on `(conversation_id, turn_index)` makes the lookup O(log n + k) where k is the turn count. Negligible at any realistic scale.

## Storage model: where everything lives

| Data | Location | Why |
|---|---|---|
| Chat metadata (model, timestamps, tokens) | D1 | Cheap, queryable, indexable |
| Conversation history (text) | D1 | Same row, no JOIN needed |
| Retrieved chunks (per turn) | D1 (JSON column) | Persisted so reloading a chat shows what context was used |
| Generated images / audio / video bytes | R2 | Cheap binary storage, no egress fees inside CF |
| Input image / audio / video bytes | R2 | Same |
| Document originals (PDF, XLSX) | R2 | For audit and potential re-processing |
| RAG chunk text | D1 | Lookups happen via the chunks table during retrieval |
| RAG embeddings | Vectorize | Purpose-built for this |
| User identity | Cloudflare Access header | Trusted by the worker, scoped per row |
| R2 ownership | Object `customMetadata.user_email` | Verified at fetch time |

The pattern worth stealing is the split: D1 holds structured metadata that points at R2 keys, R2 holds the binary bytes, neither touches the other. `DELETE /api/history/:id` cleans up R2 objects best-effort after D1 delete succeeds. Orphaned R2 objects are possible if R2 fails after D1 succeeds, but they're cheap and easy to garbage-collect offline.

R2 ownership via `customMetadata.user_email` is a cheap defense in depth. Even if a user somehow obtains another user's artifact UUID (URL leak, history scraping), `GET /api/artifact/*` rechecks ownership against the Access-asserted email before streaming. There's no "share by URL" feature; if I wanted one, I'd add a signed-URL endpoint that bakes in expiration and intended recipient.

## Multimodal input: native, downscaled, transcribed, sampled

Four input types, four handling strategies.

**Images.** Native `image_url` content blocks to vision-capable chat models. Downscaled client-side to 1280px max dimension to keep request bodies small. 4MB raw cap. The original isn't preserved; the downscaled version goes both to the model and to R2 for history rendering.

**Audio.** Transcribed via `@cf/openai/whisper-large-v3-turbo` before the chat call. The transcript text is prepended to the user message; the raw audio is dropped (not stored in R2). This is fine for the chat-with-audio use case but lossy if someone wanted to inspect the original audio later. The standalone STT model type is a separate code path that preserves the transcript and discards the bytes for the same reason.

**Video (frame extraction).** Client-side keyframe extraction via HTML5 `<video>` plus canvas. Eight evenly-spaced frames pulled at upload time, sent to vision-capable chat models as image content blocks. The original video file never leaves the browser. This is sampled-frames understanding, not true temporal video reasoning. For true video understanding, you want a model that's actually multimodal-temporal: Gemini 2.5 / 3 Pro, or TwelveLabs Pegasus 1.2.

**Video (full file, Pegasus only).** Pegasus 1.2 takes the raw video. The frontend uploads the full file as a `video_full` attachment type, the worker base64-encodes it into Bedrock's `InvokeModel` request body. Bedrock's request payload cap is 25MB, which works out to ~18MB binary after base64. Hard cap at the frontend so users get a clear error instead of a 413 from Bedrock. To support bigger videos I'd need to integrate S3 (Pegasus accepts an `s3Location` in `mediaSource`), which would mean an additional binding and an additional auth surface. Not worth it for a personal playground.

## Cost discipline

Where the bills come from, in rough descending order:

1. **Generated video.** Most expensive single operation. Veo, Seedance, Hailuo etc. via Unified Billing run $0.50-2.00 per clip depending on duration and model. xAI Grok Imagine Video BYOK is $0.05/sec ($0.40 per 8s clip).
2. **Generated audio (music).** $0.10-0.30 per song.
3. **BYOK chat with premium models.** Opus 4.7 BYOK can run $15 per million input tokens, $75 per million output. A long conversation can rack up $1+ if you're not careful.
4. **Image generation.** Workers AI burns ~1,600-6,400 neurons per image. Free tier covers ~3-6 images/day; paid plan at $0.011/1k neurons puts each image at ~$0.02-0.07.
5. **Cheap chat.** Workers AI Llama 3.2 1B, Gemini Flash BYOK, or GPT-5.4 mini are pennies per turn. Background tasks should target these by default.
6. **Storage.** Genuinely negligible. R2 at $0.015 per GB-month with no egress fees inside Cloudflare. D1 at $0.75 per GB-month.

The worker has no per-user rate limiting. For a single-user playground that's fine. If the URL is shared, you absolutely want AI Gateway rate limits (configurable per gateway) before the BYOK keys are getting hammered.

There's also a subtle cost trap with multi-turn conversations: every continuation sends all prior turns. Each Opus 4.7 message at 10 turns deep is sending ~10x the input tokens of the first turn. Anthropic's prompt caching helps, but the worker doesn't currently enable it (cache control headers would need to go in the system message and persist across turns; that's a v0.13 thing).

## What I'd do differently

A few choices I'm not sure about, in retrospect:

**Vanilla JS frontend.** This was deliberate (no framework, no build step) and I'd make the same call again, but `app.js` is roughly 700 lines now and the state management is implicit-mutation-everywhere. A small reactive library like Alpine.js or htmx would have kept the no-build feel while making the transcript rendering less manual. Lit-html might be the right answer.

**No streaming.** Every chat response is a single non-streaming HTTP response. For long Opus 4.7 generations that's a noticeable UX delay. SSE streaming from the worker through the AI Gateway is possible, but the message-array transform code paths assume a single response shape. Probably a v0.13 item.

**No prompt caching control.** Anthropic and OpenAI both support prompt caching that can cut costs 50-90% for long system prompts. The worker doesn't expose it. For RAG specifically, where the retrieved chunks are the longest part of the prompt, prompt caching would be a huge win.

**Single-user RAG corpus.** Each user has one corpus; there's no per-project or per-folder grouping. For a personal playground that's fine. For a team this would be a real limitation. The schema supports it (just add a `project_id` column), but the UI doesn't.

**Bedrock Pegasus single-shot.** Multi-turn Pegasus would need video re-attachment on every turn because the worker doesn't auto-fetch the prior turn's video from R2. Mostly a UX inconvenience, not a deal-breaker.

## What this is and isn't

This is a personal AI playground that I use daily and have made public so other people can fork it. It's not a SaaS, it's not a startup, it's not (yet) an attempt to compete with the actual chat UIs from OpenAI / Anthropic / Google. It's a deployment template demonstrating the Cloudflare AI stack: one Worker, the unified AI binding, D1, R2, Vectorize, Workflows, Access. If you want to build something similar, fork it. If you want to extend it, PRs welcome (see [CONTRIBUTING.md](https://github.com/SkyPhusion/skyphusion-llm-public/blob/main/CONTRIBUTING.md) for scope and style).

The most useful thing I can say about building it: the Cloudflare primitives compose well. The AI binding handles auth and model dispatch. D1 handles structured data. R2 handles binary data. Vectorize handles vectors. Workflows handles long-running jobs. Access handles auth. None of them require you to drop down a layer to make them work together, which is the kind of integration that's easy to undervalue until you've built the same thing on a stack where every primitive comes from a different vendor.

The code is at [github.com/SkyPhusion/skyphusion-llm-public](https://github.com/SkyPhusion/skyphusion-llm-public). AGPL-3.0; if you run it as a network service you owe your users source access, which seems fine for a project like this.
