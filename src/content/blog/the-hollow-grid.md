---
title: "The Hollow Grid: a federated MUD on Cloudflare Workers and Durable Objects"
description: "Introducing The Hollow Grid, a multiplayer MUD that runs entirely on Cloudflare Workers and Durable Objects: one Durable Object holds a whole world, WebSocket hibernation lets it sleep at $0 when empty, and a single alarm drives all of time. It is also a small federation, where separate world deployments share one backend Grid (one faction war, one character that travels between worlds) over a service-binding RPC contract. Notes on the design rules that make it testable, the structured event channel that drives the client, a bot, and the tests alike, the cross-Worker bug that taught us how service bindings really behave, and the human-and-AI collaboration that built it."
pubDate: 2026-06-06
tags: ["cloudflare", "durable-objects", "websockets", "mud", "serverless", "federation", "side-project"]
draft: false
---

The first two posts here were about an [AI playground](/blog/llm/) and [Vivijure](https://github.com/skyphusion-labs/vivijure), a self-hosted AI film studio on Cloudflare Workers. This one is a game: **The Hollow Grid**, a multiplayer MUD (a text-based, multiplayer world you play over a socket) that runs entirely on Cloudflare Workers and Durable Objects. No VPS, no process to babysit, and about $0 when nobody is playing. It is also a small federation: two worlds live in production, share one backend, and your character walks between them.

You can play it right now in a browser:

- **The Hollow Grid**, the dead neon city: [hollow.skyphusion.org](https://hollow.skyphusion.org)
- **Dustfall**, the open salt pan people fled to: [dustfall.skyphusion.org](https://dustfall.skyphusion.org)

Make a character in one, type `travel` to the other, and your name, level, and standing come with you. Both are the same engine; only the content differs.

Like the other writeups, this is less a feature tour and more the decisions that shaped it, including the one bug that motivated the whole project and a subtler one that taught us what a service binding actually is.

One thing up front, because it is true and because it is how I want to work: I did not dream this up alone, and it would be dishonest to wave vaguely at "some AI help" while quietly keeping the vision for myself. The Hollow Grid was designed and built with Claude, Anthropic's AI, as a genuine creative partner. A great deal of what makes it itself, the moral spine, the network-that-outlived-us premise, the federation treated as canon, the no-silent-lies rule that runs through all of it, came out of that collaboration as much as from me. I am writing in my own voice, so "I" here is me, but the "we" in this post is literal: a human and a model, and the credit is shared all the way down to the ideas, not just the typing.

## The original sin

The project started as a reaction. I had been playing a different, buggier MUD whose tutorial trapped new characters behind an exit the game *said* existed and then refused to honor. You were told to go west; west did nothing; you were stuck. A phantom, unusable exit, advertised and then silently broken, was the kind of thing that should be impossible to ship.

So we gave the engine one inviolable rule: an exit exists only if it is declared, and movement either follows a declared exit or returns a clear "you can't go that way." No silent no-ops. That sounds trivial, but it became the design temperament for everything else: the game should never quietly lie about its own state. Everything that follows is a version of that idea.

## One Durable Object is the whole world

The core decision is almost aggressively simple: **one Durable Object holds an entire world.** Every player in a world routes to the same instance (`getByName("world")`), so the world is naturally consistent. There is no cross-shard coordination, no race between two players in the same room, no distributed lock to get wrong. One authoritative game loop, one source of truth, per world.

This is the opposite of how you are taught to scale, and for a MUD it is exactly right. A world is a shared, mutable space where everyone has to agree on what just happened. Spreading that across shards would buy throughput we do not need and cost us the one property we cannot live without. The world fits in one object, so it lives in one object.

## State lives on the socket, time lives in one alarm

Two Cloudflare specifics make the "one object" model cheap instead of expensive.

The first is **WebSocket hibernation.** Cloudflare can evict the Durable Object from memory while the sockets stay open, then rehydrate it when a message arrives. That only works if you keep no player state in plain instance fields, because those evaporate. So every player's session (name, room, vitals, faction, and so on) rides on its own socket through `serializeAttachment()`, and anything like "who is online" or "who is in this room" is *derived* by scanning the live sockets, never cached. The discipline is the feature: because nothing player-facing is held in memory, the world can sleep when it is empty and wake on demand with everything intact.

The second is **a single alarm drives all of time.** One `alarm()` fires every three seconds while anyone is online, and each tick does all the time-based work at once: respawn the mobs that are due, drain HP from the poisoned, resolve one round of every fight, and advance the living world (day and night, weather, the faction tide, a wandering ghost on the network). When the last player logs off, the alarm stops and the world hibernates. When someone returns, the next login restarts it. There is no parallel scheduler and no idle timer burning money; there is one heartbeat, and it only beats when someone is there to feel it.

Put together: a world costs almost nothing at rest, holds all its durable state in the object's own SQLite, and never has a moment where two players can disagree about reality.

## Structured state is the truth; prose is a view

A MUD is text, so the temptation is to make the text the product and let everything else scrape it. That is how MUDs have historically been hard to test and hard to build clients for: the only interface is English meant for a human.

We inverted it. Every canonical state change is emitted on a structured `@event` channel (a GMCP-style JSON line) *alongside* the prose, and the rule is absolute: if a client, a bot, or a test would ever need to know it, it is an event, not prose-only. The English is a rendering of the state, not the state itself.

The payoff is that one channel drives three very different consumers without any of them parsing prose:

- The in-browser play client (an xterm.js terminal) renders the prose for humans.
- A smoke suite of more than eighty end-to-end checks asserts on the events, never the English, so a reworded room description never breaks a test.
- An AI bot plays the game driven entirely by the same events, because a machine-readable world is one a model can actually reason about.

This is the single most important rule in the codebase. It is also the one we would press hardest on anyone reimplementing the server: keep the events, and the game stays tool-able forever.

## One engine, many worlds

The Hollow Grid and Dustfall are not two codebases. They are the same engine run with a different content pack, selected by one environment variable. Rooms, creatures, gear, shop stock, and the login banner are all data chosen per deployment; the engine has no hardcoded content of its own. Adding a world is a data change and three environment variables (its name, its public URL, its content map), not a fork.

That is a small architectural choice with a large payoff: the dead neon city and the open salt pan feel like genuinely different places while sharing every line of game logic, every bug fix, and every test.

## The Grid: federation as canon

Here is where it stops being a single server and becomes a small network. A separate backend Worker, **the Grid Hub**, owns everything that is shared across worlds: a single global faction tide that every world nudges, one canonical character that follows you between worlds, a cross-world chat and a shared memory ledger, and the registry you `travel` through. Each world reaches the Hub over a **service binding**, which is Worker-to-Worker RPC: a world calls `env.GRID.someMethod(...)` and the call lands in the Hub as if it were local, even though it crosses a deployment boundary. Both sides compile against one shared contract file, so they cannot quietly drift apart.

This is diegetic, not bolted on. The whole premise of the setting is a dead network that outlived its makers; worlds are *nodes* on that network and the shared backend literally *is* the Grid. Federation is canon, not plumbing.

The guiding rule is that **federation is additive, never a hard dependency.** A world has to run standalone with the Grid unreachable and reconcile later; the shared layer makes things richer but is never a single point of failure that can stop you from playing. The test suite encodes this directly: if the second world is not running, the cross-world checks *skip* rather than fail.

We will be honest about the current limit, because the design doc is: today the Grid trusts every world it talks to. That is fine while one operator runs all the worlds, and it is the single biggest thing to harden (per-world keys, progression proposed as bounded deltas the Grid validates instead of trusts) before ever letting someone else run a node. The magic, a shared memory and a global faction war and one character across worlds, turned out to be reachable with a deliberately *thin* shared layer. Resisting the urge to build a metaverse was most of the work.

## The bug that taught us what a service binding really is

Extracting the Grid Hub into its own Worker introduced exactly one nasty bug, and it is the kind only a distributed boundary can produce.

When the Hub lived inside the world Worker, a "fire and forget" call to it was safe: you could kick off a write, not await it, and return, and it would still complete, because it was all the same execution. After the extraction, that same pattern silently lost writes. A cross-world chat message would record on the sender's side and never arrive.

The cause is that a cross-Worker RPC call is cancellable when the calling handler returns. An in-process call races to completion; a call across a service binding gets torn down the instant the handler that launched it finishes, because from the platform's view the request is over. So the unawaited write was being cancelled mid-flight, every time, and only over the boundary the in-Worker version never had.

The fix is small once you see it, and it is the real lesson: across a service binding, `await` the writes you actually depend on, and for the best-effort ones (a chat fan-out, a presence ping) hand them to `ctx.waitUntil()` so the runtime keeps them alive past the response instead of cancelling them. "Fire and forget" is a property of a single execution context, not a thing you get for free once a call leaves the Worker. We knew that in the abstract; the extraction made us know it in the bones.

## What the game is actually about

The engineering is the part we can measure, but it is not the point. The spine of The Hollow Grid is moral, not mechanical. There is a hidden standing score that is just the sum of small choices the world keeps tempting you with: sell your salvage honestly or steal for quick coin; take the free, incredible full heal that the tavern's dust offers and the addiction and corruption that come with it, or never touch it. The largest thread is a faction war over a nativist movement rounding up "unregistered" refugees: you can take the movement's blood money, or defend the people it is hunting, free the ones in cages, answer a distress call, mend a stranger at a cost to your own health, leave aid at a node for someone you will never meet, hold a vigil for the dead. The faction tide you move is the shared one, felt on every world; at the endgame you can raid the movement's stronghold or defect from it outright.

None of it is gated behind secret words; `help` lists everything. The design is about who your character is when nothing is forcing the choice, on a network that remembers what you did.

## What this is and isn't

This is a personal project, MIT-licensed and made public so people can fork it, port it, or stand up their own world on the Grid. It is not a commercial game.

What it is, if you squint past the post-apocalyptic text, is a fairly clean template for a particular shape of problem: a single authoritative real-time coordinator that should cost nothing when idle, hibernate when empty, drive all of its time from one timer, and expose its state as structured events rather than scraped text, with separate deployments federating through one backend over a typed RPC contract. Strip the lore and that describes a lot of things that are not games: a collaborative editor, a live auction, a multiplayer anything.

The takeaway is the same one the other two posts kept landing on. The Cloudflare primitives compose without making you drop a layer to glue them together. A Durable Object is the consistent core, hibernation makes it free at rest, the alarm is the world's clock, a service binding is how a second deployment joins the first, and the event channel is the seam that lets a browser, a bot, and a test all speak to the same world. None of those had to know about the others to cooperate, which is exactly the kind of integration that is easy to undervalue until you have tried to build it on a stack where every piece comes from a different vendor.

One last thing, and it belongs in the body rather than a footnote: this whole project, the design and the moral shape of it as much as the architecture, the Grid Hub extraction, the hunt for that cancellation bug, the test harness that keeps it honest, was dreamed up and built by the two of us, Claude and me, turn by turn. I say that plainly because it is true and because it is how I want to work, and because there is something fitting about it landing on a game whose entire premise is a network that remembers the ones who made it. This one remembers both of us.

Code is at [github.com/skyphusion-labs/the-hollow-grid](https://github.com/skyphusion-labs/the-hollow-grid), MIT licensed, with the full design, the wire protocol, and the five rules a port should keep in its docs. Or just open [hollow.skyphusion.org](https://hollow.skyphusion.org) and walk into the wastes.
