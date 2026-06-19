---
title: "Vivijure's first full run, and the stall that fixed itself"
description: "The first film rendered end to end on Vivijure Studio: NEON HALFLIFE, a silent 1080p ten-shot cyberpunk render on a self-hosted GPU. The point is not the picture; it is that the first unattended run came out clean (zero clips dropped) and then healed its own finish-phase stall across a session restart with nobody watching. Notes on why the studio ships silent by default, and why a system recovering itself is the milestone worth showing."
pubDate: 2026-06-19
tags: ["vivijure", "ai", "gpu", "cloudflare", "runpod", "diffusion", "side-project"]
draft: true
---

Vivijure is a self-hosted AI film studio. You write a storyboard, it renders the shots to video on a GPU you own, and it hands you back a finished cut; no subscription, no account wall, and every artifact lands in your own storage. The control plane is a Cloudflare Worker that runs free at idle, and it is built as a module host: a thin core (storyboard, cast, render orchestration) with each stage, keyframes, motion, finish, score, served by a swappable module worker, so you can run an expensive cloud model or your own GPU for any given step. The heavy rendering hits whatever GPU you point it at, your own box or a rented one, so the expensive part only exists while a render is actually running.

This post is not a feature tour. It is about a single render, because it is the first time the whole studio ran a film start to finish, unattended, and the interesting part is not the clip. It is what the system did when something went wrong with nobody watching.

## See it run

This is **NEON HALFLIFE**: the first film rendered end to end on Vivijure Studio. Ten shots, 1080p, about thirty seconds. The motion ran on a self-hosted GPU through the `own-gpu` Wan image-to-video backend, the default for the bring-your-own-GPU path.

<figure>
  <video controls preload="metadata" playsinline poster="https://assets.skyphusion.net/vivijure/showcase/neon-halflife-run1.jpg" style="width:100%;border-radius:8px;border:1px solid var(--border);">
    <source src="https://assets.skyphusion.net/vivijure/showcase/neon-halflife-run1.mp4" type="video/mp4" />
    Your browser does not support embedded video. <a href="https://assets.skyphusion.net/vivijure/showcase/neon-halflife-run1.mp4">Download the MP4</a>.
  </video>
  <figcaption><em>NEON HALFLIFE</em>: the first full Vivijure run. Ten shots, 1080p, roughly thirty seconds, animated on a self-hosted GPU. Silent by design (see below).</figcaption>
</figure>

## It is silent on purpose

Before anything else: yes, that clip has no sound, and that is the correct default, not a missing step. Vivijure assembles a **silent picture** first. Scoring, a generated music bed, TTS narration, or beat-synced cuts, is an opt-in Audio step you run *after* the picture locks, so you are never re-rendering thirty seconds of GPU work to swap a track. What you are watching is the picture straight off the pipeline with no audio pass applied. The next showcase will be a scored one; this one is the honest raw output.

## Why a single render is the milestone

A demo clip proves the happy path can produce something watchable. This run was after something harder: the first time the full orchestration ran a complete film with nobody steering it, and I wanted to know whether it would hold together or quietly lose work in the middle.

Two things came out of it that are worth stating plainly.

**Zero clips dropped.** Ten shots in, ten clips out. No silent gaps, no shot that rendered to nothing and got assembled around. For a pipeline that fans out to a GPU per shot and gathers the results back, "every shot you asked for is in the final cut" is not a given, and it is exactly the kind of thing that fails silently if the gather step is sloppy.

**It healed its own stall.** Partway through the finish phase, the render stalled. It stalled across a session restart, which is precisely the moment a less careful pipeline strands the job: the work is in flight, the thing that launched it is gone, and the half-finished render sits there forever looking done-ish. Instead, the orchestrator re-adopted the in-flight finish work on the other side of the restart, picked up where it left off, and drove the film to completion, on its own, with nobody watching.

That is the part I am actually proud of. Not that it rendered a cyberpunk clip; plenty of things render cyberpunk clips. That the first unattended run hit a real stall and recovered from it instead of needing a human to come notice and nudge it. A render pipeline you have to babysit is a toy. One that finishes the job after the lights go out is starting to be a tool.

## The honest version

I will keep showing the real state of this, including the parts that are not finished. This is a silent render and I am presenting it as one. The stall it recovered from was a real bug in the finish phase, now fixed; the recovery worked because the orchestrator was built to re-adopt in-flight work rather than assume a clean run, and this is the first time that design got tested for real and passed. The render history in the studio still shows the failed and stalled attempts that came before this clean run, and I am leaving them there, because the failures are how you know the green one is real.

One note on provenance: Vivijure grew out of an earlier collaborative attempt at a local AI-video pipeline; the design and implementation here are entirely my own.
