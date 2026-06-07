---
title: "Vivijure, part two: a pluggable motion backend and a GPU+cloud hybrid render"
description: "A follow-up to the Vivijure render-backend post. How image-to-video became a pluggable backend (pod Wan on the GPU, or a cloud motion model), how a single keyframe turned out to be the universal interchange format between the two, and how one film can now render some shots on the GPU and some in the cloud, then merge them off-GPU into one MP4. The keyframe is the contract; R2 is the seam."
pubDate: 2026-06-07
tags: ["runpod", "serverless", "gpu", "cloudflare", "ai", "diffusion", "image-to-video", "side-project"]
draft: false
---

The [last Vivijure post](/blog/vivijure/) was about the GPU render backend: a scale-to-zero RunPod endpoint that trains character LoRAs, renders SDXL keyframes, turns them into motion with image-to-video, and hands back a silent MP4. That post ended with the backend doing one thing well: rendering a whole film on one GPU, Wan image-to-video and all.

This post is about loosening that "one GPU, one motion model" assumption. Motion is now a **pluggable backend**: any given shot can get its movement from the pod's Wan image-to-video on the GPU, or from a cloud motion model, and a single film can mix both. The interesting part wasn't the cloud integration itself; it was discovering that the system already had the right interchange format sitting in the middle of it, and most of the work was getting out of its way.

## Why make motion pluggable at all

The GPU Wan path is the workhorse, and for most renders it's the right answer: it's the cheapest per-second once a worker is warm, it honors the character LoRAs, and it keeps the whole job inside one trust boundary. But "always Wan, always on the GPU" leaves real things on the table.

Some cloud motion models are simply faster for a quick draft pass, where I want to see a shot move before committing GPU minutes to it. Some have a look I want for a specific shot and not the rest of the film. And some renders are mostly cheap, with one or two shots that want a different engine, where spinning the GPU for the whole thing is the wrong shape. None of that argues for replacing the GPU lane; it argues for letting motion be a choice, per shot, without rebuilding anything.

So image-to-video stopped being a hardcoded step and became a backend selector, the same way `render_overrides` already let the control plane retune a render without touching the image.

## The keyframe was already the contract

Here's the thing that made the whole arc cheap. The pipeline already split every shot into two stages: render an SDXL **keyframe** (a single still that carries the character identity, the composition, the lighting), then animate that keyframe into a clip. The keyframe is where all the expensive, identity-critical work lands; the motion stage just makes it move.

Which means the keyframe is a clean handoff point. A cloud motion model doesn't need the LoRAs, the regional engine, or any of the GPU machinery; it needs a still image and a prompt. The keyframe is exactly that still. So "send this shot to a cloud model instead" reduces to "render the keyframe as usual, then hand that PNG to the cloud model instead of to Wan." The contract between the two motion backends is one image. Nothing else has to agree.

That realization is the spine of everything below. The cloud lane and the GPU lane never have to understand each other; they only have to agree on a keyframe.

## The arc, in stages

I built this in stages, each one small because the keyframe-as-contract idea kept the surface area tiny:

**Cloud motion from a keyframe.** The first step was just letting a cloud image-to-video model accept one of our keyframes and return a clip. A dedicated workflow renders the keyframe, posts it to the cloud model, polls for the result, and lands the clip in R2 next to where a GPU clip would have gone. From the control plane's point of view a cloud clip and a GPU clip are interchangeable artifacts.

**A backend selector in the planner.** Once a single shot could go either way, the planner grew a motion-backend picker, so the choice between GPU Wan and a cloud model is part of planning the film, not a code change.

**Per-shot mixing.** Then the selector went per-shot, so different shots in the same film can name different motion backends (including different cloud models for different shots). A film is a list of shots, each with its own motion engine.

**The reverse bridge.** The bridge runs the other way too. Because the keyframe is the universal format, a keyframe authored *outside* the GPU lane (made by a cloud model, or hand-picked) can be fed back *into* the pod's Wan path: drop it at the key the renderer reads (`clips/<shot_id>_keyframe.png`), and the GPU animates the still it was handed instead of regenerating one. The keyframe is a two-way interchange format, not just an export.

## The finale: one film, two lanes, merged off the GPU

The last piece ties the per-shot routing together into a single deliverable. A hybrid render is one film where some shots animate on the pod's Wan image-to-video and some animate on a cloud model, and the two sets of clips merge into one MP4.

The architectural move that makes this clean is that the GPU stops assembling the final video. Historically the pod rendered every shot and stitched the whole MP4 on the GPU before handing it back. But in a hybrid film the GPU only owns *some* of the shots; the cloud owns the rest, and they don't finish at the same time or in the same place. So the pod's finalize step grew an **off-GPU finish** mode: instead of assembling, it renders its subset of shots and emits the per-shot clips to R2, scoped to exactly the shots it was told to handle. The control plane collects those GPU clips, collects the cloud clips, puts them in shot order, and does the final merge off the GPU.

This is the same lesson the first post kept landing on, one more time: keep the GPU focused on picture, and make the boundary between tiers boring. The GPU renders frames; it does not assemble films anymore, because assembly is the cheap stateless step that wants to live next to wherever the other clips are. R2 is the seam again, the same dumb durable thing in the middle that the bundle and the state already round-trip through. A GPU clip and a cloud clip are just two objects in a bucket that the merge step reads in order.

## The receipt

The proof is a four-shot piece, *Neon Rain Standoff*: two operatives, Vesper and Rhode, squaring off on a rooftop in the rain. It routes across both lanes in a single film. Vesper's approach and Rhode's turn (one character each) went to two different cloud motion models; the two shots that actually earn the GPU, the two-character face-off and a tight close-up, animated on the pod's Wan image-to-video. All four came back as separate clips and merged off-GPU into one 1280x720 MP4, about 21 seconds, then got a generated darksynth score muxed on, also off the GPU.

Two things I was watching. First, the first frame of each GPU shot is exactly the keyframe the planner previewed, so the hybrid didn't quietly re-roll the identity work on the way through; the picture you approved is the picture you got. Second, the two-character face-off held: Vesper and Rhode stay two distinct people, no bleeding one face into the other, which is the multi-character keyframe doing its job and the motion stage faithfully carrying it instead of smearing it. Two characters who share a frame is the genuinely hard case, and it survived the trip through the GPU lane intact.

<figure>
  <video controls preload="metadata" playsinline poster="https://assets.skyphusion.net/neon-rain-standoff.jpg" style="width:100%;border-radius:8px;border:1px solid var(--border);">
    <source src="https://assets.skyphusion.net/neon-rain-standoff.mp4" type="video/mp4" />
    Your browser does not support embedded video. <a href="https://assets.skyphusion.net/neon-rain-standoff.mp4">Download the MP4</a>.
  </video>
  <figcaption><em>Neon Rain Standoff</em>: a four-shot hybrid render. The two single-character shots animated on two different cloud motion models; the two-character face-off and the close-up on the pod's Wan image-to-video. Merged off-GPU into one 1280x720 MP4 and scored with a generated track. Each GPU shot's first frame is the keyframe the planner previewed.</figcaption>
</figure>

## The honest caveats

The cloud lane has its own gates, and they're worth knowing before you route a shot to it. Different cloud motion models have different rules about what keyframe they'll accept: some hard-block photoreal real-person stills outright with no override, some expose a threshold you can loosen, and anime keyframes generally pass everywhere. So "send this shot to the cloud" is a real choice with constraints, not a free swap; the GPU lane stays the path that takes any keyframe you give it.

The other honest note is about where the merge happens. The pod emits clips and the control plane assembles, which means there are two places a render can be "done," and only one of them produces the file you watch. That's a deliberate trade for the hybrid to work at all, but it's the kind of seam that wants a clear flag rather than a clever inference, so the off-GPU case is marked explicitly in the job output rather than guessed from the shape of the result.

## What this adds up to

The first post's takeaway was: let each tier be good at its own cost shape, and make the boundary between them boring. The motion backend is the same idea pushed one level deeper. Motion is no longer welded to the GPU; it's a per-shot choice between a GPU engine and a cloud engine, and the only thing the two engines have to agree on is a keyframe and a place to drop a clip. The keyframe was the contract the whole time; making motion pluggable was mostly a matter of noticing that and not adding a second contract on top of it.

That generalizes the way the rest of the system does. Any time you have a pipeline with a clean intermediate artifact (here, a still image that carries all the expensive work), that artifact is a candidate interchange format, and "swap the backend" can be a routing decision instead of a rewrite. The trick is to find the seam that already exists rather than carving a new one.

As with the first post: Vivijure grew out of an earlier collaborative attempt at a local AI-video pipeline; the design and implementation here are entirely my own.
