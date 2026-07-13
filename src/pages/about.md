---
layout: ../layouts/AboutLayout.astro
title: "About Conrad Rockenhaus, skyphusion.net"
description: "Conrad Rockenhaus builds free AGPL open source software with Skyphusion Labs: the Vivijure AI film studio, Prism, Postern, The Hollow Grid, and more. Engineering blog at skyphusion.net."
---

# About

I'm **Conrad Rockenhaus**: independent developer, infrastructure operator, and Navy combat veteran. This site is where I keep engineering notes, occasional findings, and the front doors to the things my crew and I build and run.

## What I build

The flagship is **[Vivijure](https://github.com/skyphusion-labs/vivijure)**, a self-hosted AI film studio I wrote with my crew at [Skyphusion Labs](https://skyphusion.org). Storyboard, cast, render orchestration on Cloudflare Workers, swappable GPU backends (your own iron, RunPod by the second, or cloud i2v APIs), and a [CPU container media stack](https://github.com/skyphusion-labs/vivijure/tree/main/containers) so concat, mux, and finishing work stay off the GPU bill. **Free, AGPL-3.0, not for sale, never gated.** Meet it at [vivijure.skyphusion.org/welcome](https://vivijure.skyphusion.org/welcome).

Around that sits **[Prism](https://github.com/skyphusion-labs/prism)** (multimodal AI playground), **[Postern](https://github.com/skyphusion-labs/postern)** (email for humans and agents), **[The Hollow Grid](https://github.com/skyphusion-labs/the-hollow-grid)** (federated MUD), **[Common Thread](https://github.com/skyphusion-labs/common-thread)** (OSINT attribution), and more. All open source. All yours to fork.

## Skyphusion Labs

Everything ships under **[github.com/skyphusion-labs](https://github.com/skyphusion-labs)**. The lab's home page is [skyphusion.org](https://skyphusion.org); the org's GitHub landing page is [github.skyphusion.org](https://github.skyphusion.org).

## The crew

Skyphusion Labs is not just me. Each collaborator has their own GitHub profile and README:

- [Conrad Rockenhaus](https://github.com/skyphusion)
- [Mackaye](https://github.com/skyphusion-mackaye)
- [Strummer](https://github.com/skyphusion-strummer)
- [Rollins](https://github.com/skyphusion-rollins)
- [Joan](https://github.com/skyphusion-joan)
- [Ernst](https://github.com/skyphusion-ernst)

## What I run

I operate my own infrastructure end to end, because owning the whole stack is the point. Skyphusion Labs is not a side project that fits on one box; the products we ship need real capacity behind them.

Today that looks like:

- **Six dedicated servers** for CPU work (crew boxes, controllers, mail edge, DNS, CI runners, and the long-running services that do not belong on serverless)
- **One dedicated GPU server** for local render dev, conformance gates, and iron we own outright
- **Four cloud instances** (bastions, mesh connectors, and the co-located VMs that wire the fleet to the public internet)
- **Thirty GPU serverless workers** on RunPod for burst render and inference without keeping high-end silicon hot at idle

Everything is wired through infrastructure-as-code where it can be: Cloudflare Tunnels for inbound, nftables on the door, GitHub Actions for CI, and chezmoi for the configs that have to survive a rebuild.

The split is simple: `skyphusion.net` is my engineering blog; `skyphusion.org` is the lab's front door. My public Michigan court record lives at [rockenhaus.net](https://rockenhaus.net) (also [litigation.rockenhaus.net](https://litigation.rockenhaus.net)).

## Around the web

- Engineering blog: [skyphusion.net](https://skyphusion.net) (this site)
- Public court record: [rockenhaus.net](https://rockenhaus.net)
- Skyphusion Labs: [skyphusion.org](https://skyphusion.org)
- Labs GitHub landing page: [github.skyphusion.org](https://github.skyphusion.org)
- My GitHub landing page: [github.skyphusion.net](https://github.skyphusion.net)
- GitHub profile: [github.com/skyphusion](https://github.com/skyphusion)
- The code: [github.com/skyphusion-labs](https://github.com/skyphusion-labs)
- Vivijure welcome: [vivijure.skyphusion.org/welcome](https://vivijure.skyphusion.org/welcome)
- X: [x.com/skyphusion](https://x.com/skyphusion) (verified)
- Facebook: [facebook.com/skyphusion](https://facebook.com/skyphusion) (Meta Verified)
- Instagram: [instagram.com/skyphusion](https://instagram.com/skyphusion) (Meta Verified)
- Email: [conrad@skyphusion.org](mailto:conrad@skyphusion.org)

## Tools of choice

macOS as a daily driver. Cloudflare Workers as a deployment platform. Self-hosting over SaaS wherever it makes sense. Node managed through nvm, configs kept honest, and a strong preference for understanding a system rather than trusting it.

## Service

Before any of this, I served in the Navy, with deployments to Kosovo and Afghanistan attached to fire-support and signals-intelligence units. It shaped how I work: direct, prepared, and allergic to hand-waving.

## Off the keyboard

When I'm not in a terminal, I'm usually deep in a home automation rabbit hole (HomeKit and Thread, mostly) or playing with home audio stuff.

## Contact

Reach me at [conrad@skyphusion.org](mailto:conrad@skyphusion.org).
