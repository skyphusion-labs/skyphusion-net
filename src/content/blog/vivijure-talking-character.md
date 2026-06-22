---
title: "The film that learned to talk, and the three bugs it hit first"
description: "The fourth Vivijure showcase, Vivijure Speaks: a talking character lip-synced to its own dialogue and upscaled, rendered start to finish on a self-hosted GPU with nobody steering it. Two shots, about two and a half seconds, and voiced. The honest part is that it came out silent once, and then a from-scratch re-fire found two more orchestration bugs before any user could. Notes on the three control-plane and backend fixes that gave it a voice."
pubDate: 2026-06-22
tags: ["vivijure", "ai", "gpu", "cloudflare", "runpod", "diffusion", "lip-sync", "side-project"]
draft: false
---

The first three films I showed off Vivijure were a silent picture, a scored one, and a narrated one. This is the fourth, and it is the first one where a character actually opens its mouth: a talking character, lip-synced to its own dialogue, rendered start to finish on a GPU I own with nobody steering it.

Like the [first-run post](/blog/vivijure-first-run/), this is not a feature tour. It is a small clip, two shots and about two and a half seconds. The interesting part is not the length. It is that it came out wrong twice before it came out right, and a from-scratch re-fire found both of those bugs before a user ever could.

## See it run

<figure>
  <video controls preload="metadata" playsinline poster="https://assets.skyphusion.net/vivijure/showcase/vivijure-speaks.jpg" style="width:100%;border-radius:8px;border:1px solid var(--border);">
    <source src="https://assets.skyphusion.net/vivijure/showcase/vivijure-speaks.mp4" type="video/mp4" />
    Your browser does not support embedded video. <a href="https://assets.skyphusion.net/vivijure/showcase/vivijure-speaks.mp4">Download the MP4</a>.
  </video>
  <figcaption><em>Vivijure Speaks</em>: two shots, about two and a half seconds. A talking character lip-synced to its own dialogue and upscaled (per-shot dialogue TTS, then MuseTalk lip-sync and a CUDA Real-ESRGAN pass over an interpolated clip). Motion on a self-hosted GPU through the <code>own-gpu</code> Wan backend. Rendered unattended on the hardened scatter orchestrator.</figcaption>
</figure>

The character speaks a generated line per shot. The dialogue is generated, the audio is muxed into each clip, MuseTalk drives the mouth to match it, and a CUDA Real-ESRGAN pass upscales the result before assembly, all on top of the same bring-your-own-GPU motion path the first film used. It is a short clip on purpose: I wanted the smallest render that exercises the whole talking pipeline end to end, because the smallest one is the one I can re-fire over and over while chasing a bug.

And there were bugs. The first time I ran it, the character said nothing at all.

## Layer one: the film that came out silent

The talking pipeline produced a silent film. It did not crash and it did not error; it produced a clean-looking render with no voice in it, which is worse, because a green checkmark on a broken artifact is a lie you do not catch until you press play.

Three control-plane bugs were stacked underneath it, and I fixed all three (studio v0.2.2):

- **The gather step was stripping audio.** When a render had dialogue, the step that stitched the lip-synced clips together threw away each clip's baked-in audio track and produced a silent film. Now the concat preserves every clip's audio, and silent-pads an audio-less clip to a uniform track so the mux stays aligned.
- **A failed lip-sync could masquerade as finished.** A finish shot whose module died mid-chain was being adopted from its intermediate clip as though it were done, so a broken lip-sync looked complete. Now only the chain's final artifact is adoptable. A failed lip-sync fails loud instead of passing silently.
- **A cold MuseTalk start was silencing shots.** A transient finish-module blip, a 5xx, a timeout, a lost poll token, was enough to drop a shot's audio. Now a transient finish step re-dispatches up to three times, while a deterministic reject (a 4xx, no face detected) still fails loud. A momentary cold start no longer costs you a voice.

I also added `voiced-verify`, a checker that gates a render on actual per-shot lip-sync and non-silent audio: it measures the volume, it does not just confirm a stream exists. The studio's render history was already showing failed attempts next to completed ones; this is the same instinct pushed down into the gate.

That should have been the end of it. It was not. I re-fired the whole showcase from scratch, under real conditions, and the re-fire found two more.

## Layer two: a keyframe that was not there

The first re-fire came out with a shot quietly missing, and the bug was in the GPU backend this time, not the control plane: a phantom keyframe.

The backend snapshots each project's state so the next render can reuse everything that did not change. But a stale or partial snapshot can name a keyframe whose underlying object has since been cleared from storage; clear the render outputs before a re-render without also clearing the project state, and the two disagree. The planner trusted the snapshot, marked that shot "reuse," skipped its keyframe render, and reported a key pointing at an object that was not there. The shard then hung to its deadline waiting for an artifact that would never appear.

The fix (backend #108) is to trust storage, not the snapshot. Before honoring a state-claimed keyframe, the backend now verifies the object is actually present with a head check, and if it is missing the keyframe drops out of the reuse set so the planner regenerates it. The pipeline self-heals instead of emitting a phantom. Absent-on-any-failure is the safe default: a wasteful re-render beats a silent hole in the film, and a regression test pins it. A deeper follow-up, isolating per-render and per-shard state so the snapshots cannot disagree in the first place, is tracked separately.

## Layer three: the finish step that wedged with its work already done

The next re-fire got further and then stalled, and this one is my favorite, because the work was already finished and the pipeline could not see it.

The finish chain runs per shot as a sequence of steps: interpolate the clip, lip-sync it, then upscale it. The orchestrator advances the chain by polling each step's GPU job. But when a mid-chain step's job is garbage-collected right after it completes (the poll comes back 404, job-not-found) or its status envelope freezes in-progress forever, that step pended with no way forward. The guard that recovers a stalled finish from storage only trusted the chain's *final* artifact, so a completed-but-forgotten interpolation step sitting at the front of the chain never advanced. Both shots' interpolated clips were already in storage. Lip-sync was never dispatched. The warm MuseTalk endpoint sat there idle while the shots stalled to the deadline.

The fix (#239) extends the same trust-storage instinct from the final step to *any* step. When a step's poll comes back gone or frozen, the orchestrator checks storage for that specific step's expected output; if it is there, it folds it in, advances the chain, and dispatches the next module. A 404 with nothing in storage still fails loud; a frozen step with no output yet still waits. Because it only advances one step on its own output, it cannot reintroduce the mid-chain phantom-adopt that layer one was built to prevent. The remaining modules still run.

## The honest version

Three bugs, three layers: a gather that dropped your audio, a backend that trusted a snapshot over storage, and a finish chain that could not adopt its own completed work mid-stream. Two of the three were surfaced not by a unit test but by re-firing the real thing from scratch and watching where it stuck. That is the credible version of the story, and the reason I am telling it: a real render under real conditions found three orchestration gaps before a user would, and I fixed all three the same night.

I said in the first-run post that I would keep showing the real state of this, including the parts that are not finished, and I meant it. A showcase that only shows the take that worked is marketing. The take that talks is up top. It is worth knowing how many times it had to go silent first.

The next showcase pushes further: the same talking character on a cloud motion backend, with proper titles. Different render, different proof. This one was about the voice.
