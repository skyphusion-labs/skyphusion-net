---
title: "The Vivijure constellation: every engine in my open source AI film studio"
description: "A full tour of the Vivijure constellation by Conrad Rockenhaus of Skyphusion Labs: the vivijure Studio control plane, CPU media containers on your own iron, the Slate Discord screenwriter, the vivijure-backend RunPod GPU engine, the vivijure-local-12gb and vivijure-local-16gb consumer GPU doors, cloud i2v modules, and the vivijure-musetalk, vivijure-upscale, and vivijure-audio-upscale finish engines. All AGPL-3.0, all on GitHub, and after a two-week hardening sprint the studio is almost ready for full public release."
pubDate: 2026-07-05
tags: ["vivijure", "ai", "gpu", "cloudflare", "runpod", "diffusion", "lip-sync", "side-project"]
draft: false
---

I have written about [Vivijure](https://github.com/skyphusion-labs/vivijure) here twice, both times through the lens of a single render: the [first full run](/blog/vivijure-first-run/) and the [talking character](/blog/vivijure-talking-character/). What I have never done is introduce the whole thing properly, and the whole thing is bigger than one repo. Vivijure is a small group of programs that work together; we call it the constellation. The Studio is the control plane at the center, and around it sit a Discord screenwriter, three GPU render engines, and three finish engines, each in its own repository under [Skyphusion Labs](https://skyphusion.org) at [github.com/skyphusion-labs](https://github.com/skyphusion-labs).

This post is the missing map. It matters now because the last two weeks were a deliberate release-hardening sprint across every repo in the constellation, and the studio is almost ready for its full public release: the version where a stranger with a domain, a couple of keys, and optionally a consumer GPU can stand up the entire thing from a fresh clone.

Everything below is AGPL-3.0 open source, written by me, Conrad Rockenhaus, with the Skyphusion Labs crew.

## The map

```
you (Discord or the Studio web page)
        |
      slate  ------------------>  vivijure Studio (control plane)
   (Discord screenwriter)          projects, storyboard, cast,
                                   render orchestration + module registry
                                        |
        +-------------------------------+--------------------------------+
        |                               |                                |
  GPU render engines             cloud video modules              finish engines (GPU)
  vivijure-backend (RunPod)      Seedance, Kling, Veo, Wan       vivijure-musetalk (lip-sync)
  vivijure-local-12gb (LTX)                                       vivijure-upscale (Real-ESRGAN)
  vivijure-local-16gb (CogVideoX)                                 vivijure-audio-upscale (speech)
                                        |
                                        v
                         CPU media stack (containers/ on your iron)
                         video-finish, image-prep, audio-beat-sync,
                         audio-master (+ audio-mix, wiring pending)
```

One rule holds everywhere: the Studio is the single source of truth, and every engine is a swappable module behind a JSON contract. You can route motion through a rented datacenter GPU, a cloud API, or the graphics card in your own computer, per render, without the control plane changing at all. The same contract also keeps work that does not need a GPU off the GPU bill: assembly, mux, captions, portrait prep, beat analysis, and loudness normalization run on cheap always-on CPU containers you host yourself.

## vivijure: the Studio, sprinting to release

**[vivijure](https://github.com/skyphusion-labs/vivijure)** is the Cloudflare Worker at the center: planner UI, cast management, render history, orchestration, and the module registry. It runs on the Workers free tier (proven, not hoped: the free-plan verdict is now documented rather than hedged), and the last two weeks took it from v0.11.0 to v0.16.0. The highlights, in the order they landed:

- **v0.11.0, the structural-debt sprint.** The 7,224-line `planner.js` split into 16 coherent modules, named tokens, and a tightened finish contract. Boring, and the reason everything after it went fast.
- **v0.12.x, the security migration.** Every module and the core worker moved their credentials into the Cloudflare Secrets Store, the old `vivijure-module/1` protocol window closed, and token-mode edge auth became the documented production posture.
- **v0.13.0, strict hardening.** Opaque public ids on cast, projects, and renders; the spend limiter now fails closed by default; unauthenticated mode signals loudly instead of silently.
- **v0.14.0, the local-consumer door goes live.** The studio can now hand motion rendering to a GPU you own (more on the two local doors below), with a submit-time preflight so a render can never launch with an unresolved motion backend.
- **v0.15.0, the media stack becomes standard.** The self-hosted media store (tunnel plus VPC) is part of the standard install and automated by the deploy script, and a film degrades gracefully to completed-with-clips when a finish module is unavailable instead of stalling.
- **v0.16.0, output validation at both layers.** Structural validation at motion-clip intake and a pixel-content gate at the film finish boundary, so a black or truncated clip fails loud instead of being assembled into your film.

Alongside all of that, the guided installer learned to mint tokens, seed door secrets, provision the finish satellites with correct storage credentials, and pin backend image tags by default (a bare `:latest` is now rejected). The docs got a truth pass reconciling them with post-v0.16 reality. The test suite is past 1,200 tests. This is what "almost ready for full public release" means concretely: the remaining work is polish, not architecture.

## slate: the Discord front door

**[Slate](https://github.com/skyphusion-labs/slate)** has [its own write-up](/blog/slate/), so here I will just place it on the map: it is the collaborative screenwriter that lives in a Discord channel with your crew, keeps a structured storyboard brief, and submits the finished bundle to the Studio's JSON API. It shipped v0.2.1 during the sprint; the details are in the updated Slate post.

## vivijure-backend: the datacenter GPU engine

**[vivijure-backend](https://github.com/skyphusion-labs/vivijure-backend)** rents a GPU by the second on RunPod and does the heavy lifting: LoRA training per character, SDXL keyframes, Wan image-to-video, and cleanup. You do not build anything to run it; the published image ships with every model baked in, loaded offline, with the weights pinned by digest.

The last two weeks were about making releases trustworthy. The bake pipeline split into a seed-to-runtime image chain (weights staged once, releases become `FROM runtime + COPY src`), and the release gate now actually renders: it boots a real RunPod pod, runs a verify render against a shared golden clip conformance guard, and only promotes the image if the output passes. Promotion flushes the warm worker pool so production serves the new image immediately. The finish stage moved to NVENC encoding with streamed interpolation so wall-clock and RAM stay bounded. Four backend releases (v0.4.1 through v0.4.4) came out of hardening that gate against reality: cold image pulls measured at 37 minutes, offline model loads that only failed on a genuinely fresh box, callbacks whose rejections are now mirrored into an observable channel.

## vivijure-local-12gb and vivijure-local-16gb: your own silicon

These two are the answer to the obvious objection to any AI film pipeline: "I do not want to rent a GPU." The Studio's `motion.backend` hook makes the clips engine pluggable, so these repos are honest doors to hardware you already own, reached over a Cloudflare tunnel that terminates at your box.

**[vivijure-local-12gb](https://github.com/skyphusion-labs/vivijure-local-12gb)** runs LTX-Video on a single consumer card with a proven 12GB floor (an RTX 3060 12GB qualifies). It is the lean, fast door.

**[vivijure-local-16gb](https://github.com/skyphusion-labs/vivijure-local-16gb)** runs CogVideoX-5B-I2V with a proven 16GB floor, measured on real silicon by cap-sweeping an RTX 4090 down until it OOMed at 14GB. It is the fidelity door.

Both hit v0.1.3 in the sprint and both got the same treatment: prebuilt images published to GHCR on release tags so `docker compose up` pulls instead of builds, a native cloudflared quick-tunnel so first run needs no tunnel setup, a shared byte-identical core extracted into `vivijure_local.core` so the two doors cannot drift, pipeline caching per process with VRAM eviction on failure, timing-safe token compares on the door, and homelabber docs written for someone starting from a bare OS. The 16GB door also learned to detect a vGPU or GRID slice at boot and warn that it is unsupported, because that failure mode was too confusing to leave silent.

## The finish engines: musetalk, upscale, audio-upscale

Three small GPU satellites, each doing exactly one job on RunPod, each opt-in:

**[vivijure-musetalk](https://github.com/skyphusion-labs/vivijure-musetalk)** is the lip-sync engine: give it a face clip and an audio track, get back a clip whose mouth matches the words, via MuseTalk. The big win this sprint was warm-loading: the roughly 5GB of models now load once per worker process instead of once per job, which turns a cold-start tax into a one-time cost. Its Docker build also split into a digest-pinned base image plus a thin consumer, so rebuilds are fast and reproducible.

**[vivijure-upscale](https://github.com/skyphusion-labs/vivijure-upscale)** makes the finished video sharper: 2x or 4x Real-ESRGAN on PyTorch/CUDA through spandrel. Earlier work made the loop genuinely GPU-bound (streamed frames, batching, fp16, NVENC encode); this sprint unified its build workflow with the other satellites.

**[vivijure-audio-upscale](https://github.com/skyphusion-labs/vivijure-audio-upscale)** cleans spoken dialogue with resemble-enhance (denoise, restore, stretch to 44.1 kHz). It runs on a shot's dialogue before lip-sync, so the mouth follows the cleaned audio and thin auto-generated voices come out natural. Speech only; music takes the cheaper CPU path, because the point is to spend GPU time only where there is a voice to clean.

All three landed the same security fix this sprint: job-supplied R2 keys are now pinned to the render's key map before any bucket I/O, so a malformed or malicious job cannot point a satellite at storage it should not touch.

## The CPU media stack: GPU money for GPU work only

Owning Vivijure is not just about custody of your films and your keys. It is also about **where the meter runs**. Diffusion, image-to-video, LoRA training, lip-sync, and video upscale belong on a GPU, and Vivijure gives you three honest ways to buy that time: rent high-end silicon **by the second** on RunPod serverless ([vivijure-backend](https://github.com/skyphusion-labs/vivijure-backend)), run motion on **your own card** over a Cloudflare tunnel ([vivijure-local-12gb](https://github.com/skyphusion-labs/vivijure-local-12gb) and [vivijure-local-16gb](https://github.com/skyphusion-labs/vivijure-local-16gb)), or call a **cloud i2v endpoint** through the Studio's swappable motion modules (Seedance, Kling, Veo, Wan, and friends). Pick one per shot; the contract does not move.

Everything that is not diffusion should not be billed like diffusion. That is why the Studio ships a **CPU container architecture** under [`vivijure/containers`](https://github.com/skyphusion-labs/vivijure/tree/main/containers): five always-on HTTP services you run on your own container host (a homelab box, a dedicated CPU server, anywhere Docker runs). They join a private `vivijure` Docker network and are reached from the Cloudflare Worker over **Workers VPC** through a **cloudflared** tunnel connector. The Worker presigns short-lived R2 GET/PUT URLs and passes them in the request body, so the containers stay stateless and credential-free: no R2 bindings, no secrets mounted, no media bytes flowing through the Worker.

The five services, each doing one job on CPU:

- **video-finish** (ffmpeg): the off-GPU tail of the pipeline. Concatenates per-shot clips, muxes the audio bed, burns captions, prepends title cards, appends credits. This is the work the old single-pod layout used to charge GPU seconds for.
- **image-prep** (rembg/u2net on onnxruntime): strips backgrounds from cast reference portraits before they condition keyframe generation. Sharper cutouts, cleaner LoRA conditioning, zero GPU.
- **audio-beat-sync** (librosa): when a film carries a music bed, beat-aware cutting trims shot boundaries onto musical beats instead of arbitrary scene seconds.
- **audio-master** (ffmpeg): film-level mastering of the assembled audio bed, optional music upscale plus two-pass LUFS loudnorm, before mux.
- **audio-mix** (ffmpeg): multi-track mix with sidechain duck and loudnorm. Built and documented; wiring into the assemble path is the tracked follow-up.

Together they keep a render bill honest: **GPU money goes to GPU work only**. Concat, mux, captions, portrait prep, beat analysis, and loudness normalization run on the cheap always-on CPU fleet you already have. Deploy is one compose file (`docker compose -p vivijure-media -f containers/compose.yaml up -d --build`); v0.15.0 promoted the tunnel plus VPC Services to the standard install path so the guided deploy script provisions them alongside the rest of the stack.

## Why it is shaped this way

The constellation looks like a lot of repos, and it is, on purpose. Each engine has its own license file, its own NOTICE, its own CI, its own one-script deploy, and its own docs written for an outsider. That is the shape that makes the public release honest: you can run the Studio alone on the Workers free tier, add the cloud backend when you want datacenter quality, add a local door when you want zero rent, wire the CPU media stack on iron you already own so assembly never touches a GPU, and add finish engines one at a time. Nothing is bundled that you did not ask for, and nothing you skip can break what you kept.

Every piece of it is AGPL-3.0: if you run a modified version as a network service, you owe your users the corresponding source. For a studio whose whole pitch is "no subscription, no account wall, no lock-in," that is the right license.

The live studio my crew and I run has its front door at [vivijure.skyphusion.org/welcome](https://vivijure.skyphusion.org/welcome). The code, all of it, is under [github.com/skyphusion-labs](https://github.com/skyphusion-labs) (landing page: [github.skyphusion.org](https://github.skyphusion.org)), built by me, Conrad Rockenhaus, and the [Skyphusion Labs](https://skyphusion.org) team. The full public release is close; when it lands, the announcement will be here.
