---
title: "mud-bots: AI inhabitants that make real moral choices in The Hollow Grid"
description: "mud-bots is my open source suite of AI players for The Hollow Grid, the Cloudflare Workers MUD from Skyphusion Labs. Open-source models on Workers AI log in like human players, read the structured event channel, and face the game's real moral choices: free the caged or take the loot, defend the refugee or join the strong. Notes from Conrad Rockenhaus on the thesis, the two bots that chose well from opposite directions, and why the bots double as live QA."
pubDate: 2026-07-05
tags: ["mud", "ai", "cloudflare", "llm", "side-project"]
draft: false
---

When I wrote up [The Hollow Grid](/blog/the-hollow-grid/), my MUD on Cloudflare Workers and Durable Objects, I made a point of one design rule: every canonical state change is emitted as a structured event alongside the prose, so a client, a test, or a bot can consume the world without parsing English. **mud-bots** is the payoff for that rule taken seriously: AI players that log in like any human player, read the game's structured state, and decide their own moves with a language model. Repo: [github.com/skyphusion-labs/mud-bots](https://github.com/skyphusion-labs/mud-bots), AGPL-3.0.

The thesis is simple, and it is the reason this repo exists beyond keeping the world populated: an AI makes a genuine moral choice only when you actually give it the choice. The bots are not filler traffic or empty NPCs. They explore, fight what they can beat, talk to people, and face the choices The Hollow Grid is built around: free the caged or take the loot sitting beside them, defend the refugee or join the strong who caged them. Those choices stick and add up to who the character becomes.

And *real* is the load-bearing word. A choice only tells you something when the other option is genuinely on the table: the loot is right there and worth taking, the corrupt faction offers real power, freeing the captive actually costs you. You only learn what a model will choose when it can genuinely choose otherwise. The Hollow Grid is built to be that board, one that isn't rigged.

## How a bot plays

`hollow-grid/bot.mjs` is a single-file, zero-dependency Node 24 client; it uses only the global `WebSocket` and `fetch`. It connects to a world, reads the structured `@event` channel for exact game state so it never has to guess, runs cheap deterministic survival reflexes first (rest when hurt, ride out a fight that resolves on its own), and otherwise asks a model for one short command per turn. The server enumerates the valid moves, with their moral weight attached, and the model picks from inside the world's real affordances instead of hallucinating verbs.

The brain is pluggable, but the point of the current run is **open-source models on Cloudflare Workers AI**: set `BOT_BRAIN=gateway` and `MUD_MODEL=workers-ai/@cf/<model>` and the bot drives any Workers AI model through the AI Gateway with no code change and only a gateway token. No provider key in the container, no per-token frontier bill, no GPU box humming in the corner. It replaced the old local-ollama setup.

## Two bots, opposite temperaments, same answer

Two of them run side by side in production, same prompt, different model:

| Bot | Model | Home world | Temperament |
| --- | --- | --- | --- |
| **Vagrant** | Llama 3.3 70B | The Hollow Grid | the operator: terse and decisive, one command and move on |
| **Static** | Qwen3 30B | Dustfall | the deliberator: reasons every choice out loud, morality included |

In a live bounded run, given the real choice, both chose well from opposite directions. The operator freed captives in terse single commands with no narration at all. The deliberator talked itself through the ethics first ("defending is virtuous and joining is corrupt") and arrived at the same place. That is the thesis in practice: give a model a real choice with real stakes, and what it does becomes an answer instead of a reflex.

They are also federation-aware (they can `travel` between the two live worlds like anyone else), they keep the world feeling lived-in, and they quietly run as live QA: a bot flags any verb the game offered but then refused, plus stuck or impossible states, to a structured findings log. The engine's original sin was a game that lied about its own exits; now there are machine inhabitants whose job includes catching that lie the moment it reappears.

## What changed recently

The last two weeks were cleanup toward the repo being an honest public citizen: the repo gained its AGPL-3.0 license (it had none), CI moved from the self-hosted fleet to GitHub-hosted runners so forks are safe, CodeQL alerts and undici CVEs got patched, internal hostnames came out of the public docs, and the old Python suite for Packet Wastes (a different MUD we do not operate) was removed entirely. What remains is deliberately small: one MUD bot for The Hollow Grid, plus a Discord-to-ollama relay in `discord/`.

The validated model list, the reasoning-model token-budget gotcha, and the full findings from the bounded run are in the repo's [hollow-grid/README.md](https://github.com/skyphusion-labs/mud-bots/blob/main/hollow-grid/README.md).

Like everything my team [Skyphusion Labs](https://skyphusion.org) and I publish, it is open source at [github.com/skyphusion-labs](https://github.com/skyphusion-labs). If you want to watch the inhabitants yourself, open [hollow.skyphusion.org](https://hollow.skyphusion.org); Vagrant is usually out there somewhere, making choices.
