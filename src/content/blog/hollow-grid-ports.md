---
title: "The Grid speaks Go and Python: Rust Choir and Verdigris Spool ship"
description: "hollow-grid-go and hollow-grid-py are complete world-server ports of The Hollow Grid. Both pass the upstream smoke.mjs conformance suite, run in production on the fleet as Rust Choir and Verdigris Spool, and prove the wire protocol survives a language change. Notes on the scoreboard method, what each node asks players, and how four worlds now share one Grid Hub."
pubDate: 2026-07-13
tags: ["go", "mud", "federation", "websockets", "side-project"]
draft: false
---

In June I wrote up [The Hollow Grid](/blog/the-hollow-grid/), a federated MUD on Cloudflare Workers and Durable Objects whose canonical state rides on structured `@event` lines, not scraped prose. A week later I shipped [hollow-grid-go](/blog/hollow-grid-go/) as **Rust Choir**, the first proof that the world half of the protocol survives a move from TypeScript to Go and from Durable Objects to a select-loop on bare metal.

That post landed on July 9. By that evening the Python port was also green, deployed, and registered on the same Grid Hub. This one is the completion line for both ports: **[hollow-grid-go](https://github.com/skyphusion-labs/hollow-grid-go)** (Rust Choir) and **[hollow-grid-py](https://github.com/skyphusion-labs/hollow-grid-py)** (Verdigris Spool), two autonomous world servers that speak the same language-agnostic wire spec as [the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid) and join the federation when `GRID_HUB_URL` is set.

## Four worlds, one Grid

The reference TypeScript worlds still live on Workers:

| World | URL | Engine |
| --- | --- | --- |
| The Hollow Grid | [hollow.skyphusion.org](https://hollow.skyphusion.org) | TypeScript / Durable Objects |
| Dustfall | [dustfall.skyphusion.org](https://dustfall.skyphusion.org) | TypeScript / Durable Objects |
| **Rust Choir** | [rustchoir.skyphusion.org](https://rustchoir.skyphusion.org) | **Go** (`hollow-grid-go`) |
| **Verdigris Spool** | [verdigris.skyphusion.org](https://verdigris.skyphusion.org) | **Python** (`hollow-grid-py`) |

Make a character in any of them, type `travel` to another, and name, level, and standing follow through the hub registry. [`mud-bots`](/blog/mud-bots/) load-tests all four; the shared backend is still `grid-hub.skyphusion.org`.

The ports were never meant to replace the reference implementation. They exist to prove the contract is real: `wscat`, `smoke.mjs`, and the bots connect to `/ws` the same way on every node.

## Definition of done: smoke, not eyeballing

Both repos inherited the same scoreboard from upstream: **`smoke.mjs`**, phase by phase, asserting on `@event` JSON and never on English room text. A green run is the definition of done; a reworded room description must not break a test.

**Rust Choir (Go)** reached production parity in July with **158 ok / 0 fail / 1 skip** against live hub and Dustfall (the lone skip is a holding-pit warden grace wall-clock wait that slow CI boxes time out on; the behavior is implemented). The port runs on biafra as a distroless GHCR image on `:8790`, rolled by GitHub Actions dispatch after green `main` builds.

**Verdigris Spool (Python)** closed Phase 3 the same week: standalone local smoke at **152 ok / 0 fail / 1 skip**, federation headline checks passing against live Dustfall, and `/health/deep` reporting `grid_hub: ok` on fleet. It listens on `:8791`, image `ghcr.io/skyphusion-labs/hollow-grid-py`, ingress at `verdigris.skyphusion.org`.

If you want to score your own build from a clone of [the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid):

```sh
# Go (local)
MUD_URL=ws://localhost:8790/ws node smoke.mjs

# Python (local)
MUD_URL=ws://127.0.0.1:8791/ws node smoke.mjs

# Federation phase (needs a second live world)
MUD_URL=ws://localhost:8790/ws DUSTFALL_URL=wss://dustfall.skyphusion.org/ws node smoke.mjs
```

## Same spine, different voice

Mechanically the races, Cinder Front arc, holding-pit rescue, combat ticks, and `@event` vocabulary are identical across all four worlds. Differentiation is **place and voice**, not protocol.

**Rust Choir** is the **memory node**. Where hollow and Dustfall ask what you will do, Rust Choir asks what the network will remember you for. Its signature tract is the **Grid Gate**, grafted east from the service tunnels: dead terminals, Ash Road, Memorial Static, a Cinder Checkpoint where the Front's coin sits beside refugees in line. Engine: one goroutine per connection, `select` between player commands and a 2s heartbeat tick (`internal/transport/conn.go`).

**Verdigris Spool** is the **suspension node**. Where Rust Choir archives memory, Verdigris Spool asks what you leave unfinished. Its signature tract is the **Spool Yard**, east from the tinker's workshop: copper racks humming with deferred work, a callback shaft still ringing, an oxide checkpoint where the Cinder Front taxes passage. Engine: asyncio-friendly session loop in Python, same CharStore seam (`FileStore` standalone, `RemoteHub` when the hub is bound).

Both graft from rooms the smoke suite does not pin, so creative geography stays conformance-first.

## Setbacks that rhymed

The [original Hollow Grid write-up](/blog/the-hollow-grid/) told the story of fire-and-forget RPC across a service binding getting cancelled when the calling handler returns. The Go port hit a cousin in July: hub push drops when a session's push buffer filled under federation load. The fix was to block delivery until the session reads, not to drop silently. Same lesson, different runtime.

The smoke parity week was a chain of these: listen preferring local node memory for echoes, kapo join morality, mob respawn on the world tick, reliable tell without blocking broadcasts, warden grace and antidote affordance for the holding-pit rescue. Each fix was driven by pointing `smoke.mjs` at production WSS URLs with `DUSTFALL_URL` set, not by guessing.

Python had its own fleet ops archaeology: cloudflared ingress must match on every swarm manager or tunnel connectors 404; the verdigris roll runbook now health-polls and syncs config after each fleet-chezmoi fetch. Boring ops, but "deployed" means operable.

## What is still rough

Honesty belongs in a completion post too:

- **Session-local resolved moral state** can re-offer `join`/`defend` in `room.actions` after reconnect even when faction is already set; the server enforces one-time outcomes, but bots may spam until they learn.
- **Stolen-kill vitals sync** still lacks full TS v0.29.9 parity on the Go port.
- **Hub-side trust hardening** (per-world keys, bounded progression deltas) remains upstream work; fine for a single-operator fleet, not for open federation yet.
- **Remote federation smoke** flakes on laptop-to-fleet WSS latency; contract runs prefer VLAN origin or on-box paths.

None of those blocked shipping either node. They blocked pretending the ports were finished while smoke still had red on the board.

## Why port at all

Three reasons, unchanged from the Go post but now answered twice:

1. **Prove the protocol.** If `@event` framing and the Grid Hub RPC contract are language-agnostic, Go and Python worlds should be first-class citizens. These repos are the proof.

2. **Run outside Workers.** Operators who want a self-hosted MUD on a VPS or a fleet container should not have to learn Durable Objects to stand up a world.

3. **Exercise the federation.** Four worlds with distinct geography and voice stress-test travel, tide, gridcast, and canonical character sync harder than two deployments of the same engine badge.

The Hollow Grid was always meant to be forked, ported, and extended. The TypeScript repo remains the reference for the Grid Hub and the Workers deployment model. **hollow-grid-go** and **hollow-grid-py** are the working proof that the world half of the contract survives language changes, runtime changes, and a move from Durable Objects to goroutines and asyncio on bare metal.

The moral spine, the no-silent-lies movement rule, the federation treated as canon: all of it ported intact. The network that outlived its makers now has a memory node in Go and a suspension node in Python, asking what you did and what you deferred.

Play: [rustchoir.skyphusion.org](https://rustchoir.skyphusion.org) · [verdigris.skyphusion.org](https://verdigris.skyphusion.org). Code: [hollow-grid-go](https://github.com/skyphusion-labs/hollow-grid-go) · [hollow-grid-py](https://github.com/skyphusion-labs/hollow-grid-py). Wire spec: [the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid).
