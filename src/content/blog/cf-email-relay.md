---
title: "cf-email-relay: transactional email on Cloudflare, plus an SMTP bridge"
description: "A small two-part utility for sending transactional email through Cloudflare Email Sending: a Worker with a service-binding RPC and a token-gated HTTP endpoint, and a tiny Go SMTP relay that bridges the services that can only speak SMTP. Notes on the one-validation-path design, why the SMTP bridge is the genuinely useful part, the container wrinkle that made the relay multi-listen, and wiring Jenkins and Uptime Kuma to send through it."
pubDate: 2026-06-05
tags: ["cloudflare", "email", "smtp", "go", "side-project"]
draft: false
---

Every project eventually needs to send a boring email: a render finished, a build failed, a monitor went down. The [skyphusion stack](/blog/vivijure-first-run/) was no different, so I finally sat down with [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/) — which lets a Worker send transactional mail directly, no third-party ESP — and built a small thing around it. It turned out generic enough to spin out as its own MIT repo: [github.com/SkyPhusion/cf-email-relay](https://github.com/SkyPhusion/cf-email-relay).

It's two pieces:

- **`worker/`** — sends mail via Cloudflare's `send_email` binding. Two front doors, one validation path.
- **`relay/`** — a tiny Go SMTP daemon that bridges the services that can only speak SMTP.

```
your Worker  ──(service binding: env.EMAIL.send)──┐
                                                  ├──► worker ──► CF Email Sending ──► inbox
SMTP-only services ──SMTP──► relay ──(HTTPS)──────┘
```

## One sender, two front doors

A central send service has two kinds of caller, and they want different things.

Another Cloudflare Worker on the same account wants a **service binding**: `await env.EMAIL.send({ to, subject, html, text })`. No token, no public network hop, and it's typed — the call goes Worker-to-Worker over Cloudflare's RPC. That's the front door for everything in-platform (in my case, the planner Worker emailing "your render is ready").

Everything else — a shell script, a cron job, the SMTP relay below — wants a plain HTTP endpoint. So there's also a token-gated `POST /send`: same JSON body, guarded by a `RELAY_TOKEN` bearer secret with a constant-time compare.

The thing I cared about is that both doors lead to the *same* `sendEmail()` function. The RPC entrypoint and the HTTP handler are both thin shims over one validation-and-send path, so the two surfaces can't drift — a rule that holds for the From-domain restriction, the recipient cap, the error codes, all of it. Adding a second way to call something is where behavior usually forks; funneling both into one function is the cheap way to make sure it doesn't.

## The SMTP bridge is the actually-useful part

The worker is nice but unremarkable — it's the relay I'd actually reach for again.

Cloudflare Email Sending has no SMTP interface. And the world is *full* of things that only know how to send mail the 1995 way: cron's `MAILTO`, `mdadm` and backup tools that email on failure, monitoring daemons, the occasional appliance or printer. None of those can POST JSON with a bearer token, and you don't want to teach them to.

So the relay is a small Go SMTP server (a few hundred lines) that listens on `127.0.0.1:2525`, accepts a normal SMTP conversation, parses the MIME, and relays it to the worker's `/send` over HTTPS. Point anything's SMTP config at localhost and it's now sending through Cloudflare, no code changes. The envelope recipients come from `RCPT TO` (the real destination, not whatever's in the headers), and if a message's `From` is off your sending domain — `root@somehost`, say — the relay rewrites it to a default address and keeps the original as `Reply-To`, because the worker can pin the sender domain and would otherwise reject it.

## It earns its keep

The proof that the bridge is worth anything: I wired two real things to it in an afternoon.

**Jenkins** now emails build failures through it — its mailer config is just `SMTP host 127.0.0.1, port 2525`, no auth, no TLS. **Uptime Kuma** sends down/up alerts through it too. Both went from "no email" to "email" without either of them learning a single thing about Cloudflare.

Uptime Kuma did expose one wrinkle worth keeping. It runs in a container, and a container's `localhost` is the container, not the host — so it couldn't reach a relay bound to the host's loopback. The fix was to make the relay's listen address a comma-separated list and bind two interfaces: loopback for host processes like Jenkins, and the docker bridge gateway for the container. It's just one stateless backend behind two `go-smtp` listeners.

The security rule I wrote into the README while doing it, because it's the one easy way to shoot yourself: **bind specific private IPs, never `0.0.0.0`.** The relay sends as your domain with no per-message auth — that's the whole point on a trusted box — so an internet-reachable SMTP port is an open invitation to send mail as you. Loopback and a private bridge IP are reachable by the things that should reach it and nothing else. (A host firewall scoped to the bridge interface is the belt to that suspenders.)

## A couple of smaller things

**No secrets in the image.** The worker keeps nothing sensitive in code — `RELAY_TOKEN` is a `wrangler secret`, and the From defaults and optional domain restriction are plain vars. The relay's token and worker URL live in a `0600` env file read by its systemd unit.

**Deliverability is a cold-start problem, not an auth one.** The first message from a brand-new sending domain has a real shot at the spam folder even when SPF, DKIM, and DMARC all pass — it's reputation and thin "test" content, not a misconfiguration. If your first send lands in spam, check that the auth actually passed (it almost certainly did), then send real mail and let the domain warm up rather than chasing a config bug that isn't there.

## What it is

A small MIT utility — the email plumbing for my own stack — made public because the shape is generic: one central Workers send-service, plus an SMTP shim for everything that can't speak HTTP. If you're on Cloudflare and you've been reaching for an external SMTP provider just to get a "your thing is done" email out the door, this might save you the dependency.

Code is at [github.com/SkyPhusion/cf-email-relay](https://github.com/SkyPhusion/cf-email-relay), MIT licensed. It's the third piece of the stack I've written up here, after the [LLM playground](/blog/llm/) and the [GPU render backend](/blog/vivijure-first-run/) — the unglamorous one that emails you when the other two finish.
