---
layout: ../layouts/AboutLayout.astro
title: "About, skyphusion.net"
description: "About Conrad Rockenhaus and skyphusion.net"
---

# About

I'm Conrad Rockenhaus: independent developer, solo infrastructure operator, and Navy combat veteran. This site is where I keep notes, occasional findings, and the front doors to the things I build and run.

## What I build

Most of my time goes to **[Prism](https://github.com/skyphusion-labs/prism)**, an open-source multimodal AI playground built on Cloudflare Workers. Text, image, video, and music generation, with long-running jobs handled through Cloudflare Workflows rather than fragile fire-and-forget patterns. It's BYOK-friendly and meant to be self-hostable by anyone who wants their own corner of the model ecosystem instead of renting someone else's.

Around that sits **[Vivijure](https://github.com/skyphusion-labs/vivijure)**, a self-hosted AI film studio (planner UI, cast, render orchestration on Cloudflare Workers), which I run for myself and a few people I trust at [vivijure.skyphusion.org](https://vivijure.skyphusion.org).

## What I run

I operate my own infrastructure end to end, because owning the whole stack is the point:

- **Monitoring** at [status.skyphusion.org](https://status.skyphusion.org), with push notifications so I find out before anyone else does.
- A small fleet of Linux VPS instances, GPU inference, Cloudflare Tunnels for secure inbound, and nftables doing the gatekeeping.

The split is simple: `skyphusion.net` is the personal and infrastructure entry point; `skyphusion.org` is where the AI-facing services live.

## Tools of choice

Fedora Linux as a daily driver. Cloudflare Workers as a deployment platform. Self-hosting over SaaS wherever it makes sense. Node managed through nvm, configs kept honest, and a strong preference for understanding a system rather than trusting it.

## Service

Before any of this, I served in the Navy. Combat veteran, with deployments to Kosovo and Afghanistan attached to fire-support and signals-intelligence units. It shaped how I work: direct, prepared, and allergic to hand-waving.

## Off the keyboard

When I'm not in a terminal, I'm usually deep in a home automation rabbit hole (HomeKit and Thread, mostly) or playing with home audio stuff.

## Contact

Reach me at conrad@skyphusion.org.
