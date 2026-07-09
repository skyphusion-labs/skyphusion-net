---
title: "The Hollow Grid, in Go: Rust Choir ships"
description: "hollow-grid-go is a from-scratch Go port of the Hollow Grid world server. It passes the upstream smoke.mjs conformance suite, runs in production as Rust Choir (the third federated world on the Grid), and proves the wire protocol is language-agnostic. Notes on the phase-by-phase scoreboard, the login cascade that started broken, federation bugs that echoed the TypeScript service-binding lesson, and what still has rough edges."
pubDate: 2026-07-09
tags: ["go", "mud", "federation", "websockets", "side-project"]
draft: false
---

When I wrote up [The Hollow Grid](/blog/the-hollow-grid/) in early June, the reference implementation was TypeScript on Cloudflare Workers and Durable Objects: one Durable Object per world, WebSocket hibernation, a single alarm driving time. That stack is exactly right for a serverless MUD that costs about $0 when nobody is playing.

It is not the only stack someone might want.

**[hollow-grid-go](https://github.com/skyphusion-labs/hollow-grid-go)** is a from-scratch Go port of the *world half*: a single autonomous game world that speaks the language-agnostic wire protocol in [`the-hollow-grid/docs/protocol.md`](https://github.com/skyphusion-labs/the-hollow-grid/blob/main/docs/protocol.md) and joins the federation as a node when `GRID_HUB_URL` is set. Existing clients work unchanged: `wscat`, [`mud-bots`](/blog/mud-bots/)'s `bot.mjs`, and the upstream `smoke.mjs` suite all connect to `/ws` the same way they connect to hollow.skyphusion.org.

The port's definition of done was never "feature parity by eye." It was **green on `smoke.mjs`**, phase by phase, asserting on `@event` lines and never on English prose. As of **July 9, 2026**, production **Rust Choir** (`wss://rustchoir.skyphusion.org/ws`) scores **158 ok / 0 fail / 1 skip** against live hub and Dustfall. The lone skip is a holding-pit warden grace wall-clock wait that slow CI boxes time out on; the game behavior is implemented.

You can play it now:

```sh
wscat -c wss://rustchoir.skyphusion.org/ws
curl -sf https://rustchoir.skyphusion.org/health/deep
```

Or pull the GHCR image and run your own node: `ghcr.io/skyphusion-labs/hollow-grid-go:latest`.

## Why port at all

Three honest reasons:

1. **Prove the protocol.** If `@event` framing and the Grid Hub RPC contract are language-agnostic, a Go world should be a first-class citizen, not a second-class fork. The upstream repo always said that in docs; this repo is the proof.

2. **Run outside Workers.** Operators who want a self-hosted MUD on a VPS or a fleet container should not have to learn Durable Objects to stand up a world. Rust Choir runs on Hetzner (biafra, `:8790`, distroless image, cloudflared tunnel), alongside the TypeScript worlds on Cloudflare.

3. **Exercise the federation.** A third world with its own geography and voice stress-tests travel, tide, gridcast, and canonical character sync harder than two deployments of the same engine badge.

Rust Choir is the **memory node** on the Grid (see [`docs/WORLD.md`](https://github.com/skyphusion-labs/hollow-grid-go/blob/main/docs/WORLD.md) in the repo). Where hollow and Dustfall ask *what will you do*, Rust Choir asks *what will the network remember you for?* Its signature tract is the **Grid Gate**, grafted east from the service tunnels: dead terminals, Ash Road, Memorial Static, a Cinder Checkpoint where the Front's coin sits beside refugees in line. Mechanically the races, moral arc, holding-pit rescue, and event vocabulary match the reference; differentiation is place and voice, not protocol.

## The scoreboard method

The build plan in [`docs/PLAN.md`](https://github.com/skyphusion-labs/hollow-grid-go/blob/main/docs/PLAN.md) is a checklist against upstream smoke phases. Early June looked like this:

| Phase | What landed | Smoke checks (approx.) |
|-------|-------------|------------------------|
| 0 | `/ws`, login banner, `@event` framing | foundation |
| 1a | seven races, moral affordances | early |
| 1b | `CharSheet` persistence, resume, `whoami` | early |
| 1c | canonical opening map | 4 → 17 |
| 1d through 1m | items, combat, heartbeat, Cinder Front arc, wastes, economy, holding-pit rescue, dreams | 17 → 56 |

Phase 1c's commit message said the quiet part out loud: **"login cascade broken, smoke 4 → 17."** The world foundation was re-ported from the reference TypeScript rooms and races; until that landed, smoke could not run in earnest. There is no shortcut past a broken login when your test harness logs in like a player.

After Phase 1m the port had a playable standalone world. Phase 2 added multiplayer (`tell`/`reply`/`yell`/`emote`, session registry), federation (`internal/grid` HTTP client to the Grid Hub), the endgame map, redemption arc, Rust Choir identity, Docker, and CI that pushes to GHCR and dispatches a fleet roll on green `main` builds.

## Architecture choices (and one deliberate difference)

The TypeScript world uses one Durable Object, hibernation, and a platform alarm. The Go port cannot copy that literally, so it copied the *properties*:

```
player → WebSocket /ws → session goroutine (single select-loop)
                              ↓
                    world (read-mostly) + hub (presence) + CharStore
```

Each connection runs **one goroutine** with a `select` between player commands, a 2s heartbeat tick, and disconnect (`internal/transport/conn.go`). Combat rounds, regen, and the day/night clock all resolve on that tick. Because every mutation of session state happens inside the loop, there are no mutexes on the player object. Shared presence (who is in which room, tell routing) lives in `internal/transport/hub.go` behind its own lock.

The `@event` channel rule from the original game is unchanged: prose for humans, JSON events for machines, and the two must not drift. Moral choices arrive as `room.actions` with `valence` (`virtuous`, `corrupt`, `grave`). An agent reads ethics as data; it does not infer them from room description text.

`CharStore` is the federation seam: `FileStore` for standalone JSON-on-disk, `RemoteHub` for canonical sheet fields through the Grid when `GRID_HUB_URL` is set. Inventory, HP, and room stay world-local, same as upstream.

## Setbacks that rhymed with the TypeScript post

The [original Hollow Grid write-up](/blog/the-hollow-grid/) told the story of extracting the Grid Hub into its own Worker and discovering that **fire-and-forget RPC across a service binding gets cancelled** when the calling handler returns. The Go port hit a cousin bug in July during federation hardening:

**Hub push drops under load.** Cross-player `tell`/`reply` and gridcasts were lost when a session's 64-slot push buffer filled during federation traffic (`fix(transport): block on hub push instead of dropping`). The fix was to block delivery until the session reads the message, not to drop silently when the buffer is full. Same lesson, different runtime: async boundaries punish assumptions that worked in-process.

The **smoke parity week** (July 8) was a chain of these: listen preferring local node memory for echoes when the hub is remote, kapo join morality and dais redemption arc, mob respawn on the world tick, reliable tell without blocking broadcasts, tide-gated medic behavior matching upstream, warden grace window and antidote affordance for the holding-pit rescue. Each fix was driven by pointing `smoke.mjs` at `wss://rustchoir.skyphusion.org/ws` with `DUSTFALL_URL` set, not by guessing.

CI had its own archaeology, and a lesson I keep relearning. The repo started with a Jenkins pipeline on mindcrime. Jenkins is free software and I ran it for years, but I got sick of spending my time troubleshooting Jenkins instead of building. Agents offline, plugin rot, queue stalls, "why did this job not fire" at 2am: that is not CI, that is a second job. When mindcrime was decommissioned, I did not mourn it. The Jenkinsfile dropped ([#8](https://github.com/skyphusion-labs/hollow-grid-go/pull/8)), release image builds moved to GitHub Actions with GHCR push and auto-dispatch of `rust-choir-roll` to the fleet ([#30](https://github.com/skyphusion-labs/hollow-grid-go/pull/30)), and the scoreboard stayed the same. Only the plumbing moved.

The same week I started a **GitHub Enterprise trial** for [Skyphusion Labs](https://github.com/skyphusion-labs) for features Jenkins will never have: org-wide branch protection and rulesets that actually stick, PR-gated merges with required checks, fork-safe hosted runners, code scanning wired into the same place the code lives, and dispatch workflows that talk to the fleet without me babysitting a controller box. By the day the trial ended, the subscription was already worth it. A pipeline that works so I can just build is worth more than saving money on pure OSS products you become the maintainer of. GitHub Actions costs something; so does my attention. I know which budget I would rather spend.

It will be a cold day in hell before I trade these workflows back for the hellscape known as Jenkins.

## Federation in production

Three worlds now share one Grid Hub:

| World | URL | Engine |
|-------|-----|--------|
| The Hollow Grid | [hollow.skyphusion.org](https://hollow.skyphusion.org) | TypeScript / Workers |
| Dustfall | [dustfall.skyphusion.org](https://dustfall.skyphusion.org) | TypeScript / Workers |
| **Rust Choir** | [rustchoir.skyphusion.org](https://rustchoir.skyphusion.org) | **Go / fleet container** |

Make a character in one, `travel` to another, and name, level, and standing follow through the hub registry. [`mud-bots`](/blog/mud-bots/) load-tests all three; fleet layout lives in the org's runbooks.

Production env (never commit tokens): `WORLD_URL=wss://rustchoir.skyphusion.org/ws`, `GRID_HUB_URL=https://grid-hub.skyphusion.org/rpc`, plus `GRID_HUB_TOKEN` from secrets escrow.

## What is still rough

Honesty belongs in a release post too. [`docs/PLAN.md`](https://github.com/skyphusion-labs/hollow-grid-go/blob/main/docs/PLAN.md) lists known gaps:

- **Session-local resolved moral state** can re-offer `join`/`defend` in `room.actions` after reconnect even when faction is already set; the server enforces one-time outcomes, but bots may spam until they learn.
- **Stolen-kill vitals sync** (another player kills your mob mid-fight) still lacks TS v0.29.9 parity.
- **Hub-side trust hardening** (per-world keys, bounded progression deltas) remains upstream work documented in `the-hollow-grid/docs/federation.md`; fine for a single-operator fleet, not for open federation yet.

None of those blocked shipping Rust Choir. They blocked pretending the port was finished when smoke still had red on the board.

## Score your own build

From a clone of [the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid) (for `smoke.mjs`):

```sh
# standalone
MUD_URL=ws://localhost:8790/ws node smoke.mjs

# federation phase (needs a second live world)
MUD_URL=ws://localhost:8790/ws DUSTFALL_URL=wss://dustfall.skyphusion.org/ws node smoke.mjs
```

Assert on `@event`, not prose. A green run is the definition of done.

Local dev:

```sh
go run ./cmd/world --addr :8790 --world-name "Rust Choir" --data ./data
```

## What this is

The Hollow Grid was always meant to be forked, ported, and extended. The TypeScript repo remains the reference for the Grid Hub and the Workers deployment model. **hollow-grid-go** is the working proof that the world half of the contract survives a language change, a runtime change, and a move from Durable Objects to a select-loop on bare metal.

The moral spine, the no-silent-lies movement rule, the federation treated as canon: all of it ported intact. The network that outlived its makers now has a node written in Go, asking what the Grid will remember.

Code: [github.com/skyphusion-labs/hollow-grid-go](https://github.com/skyphusion-labs/hollow-grid-go). Wire spec: [github.com/skyphusion-labs/the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid). Play: [rustchoir.skyphusion.org](https://rustchoir.skyphusion.org).
