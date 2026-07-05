---
title: "Postern: a mailbox on Cloudflare for humans and agents"
description: "Postern replaces our retired send-only cf-email-relay with a full mailbox: inbound via Email Routing, outbound via Email Sending, D1 and R2 storage, FTS and optional semantic search, webmail and read-only IMAP, a Go SMTP relay for legacy callers, and one structured API that agents and humans both use."
pubDate: 2026-06-25
updatedDate: 2026-07-05
tags: ["cloudflare", "email", "smtp", "go", "side-project"]
draft: false
---

Every stack eventually needs email. Renders finish, builds fail, monitors go down, agents need to read what arrived overnight. We started with **cf-email-relay**, a send-only Worker plus a Go SMTP bridge for things that only speak SMTP. That worked for "your job is done" notifications. It did not work for a mailbox.

**Postern** is the replacement: send and receive, store everything, search it, thread it, and expose one API that both agents and human clients use. Cloudflare Email Sending and Email Routing are the default transports on each seam, not a hard lock-in. Repo: [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern).

If you read the old [cf-email-relay write-up](/blog/cf-email-relay/), treat this as the sequel. The send path from that project still exists inside Postern (`worker/` for back-compat; planned merge into `inbound/`). The new part is everything around it.

## One store, many doors

The design rule is in `docs/CONTRACT.md`:

```
Inbound transports → ingest() → STORE (D1 + R2 + Vectorize)
                                      ↑
                              MAILBOX API (list / get / search / send / reply)
                                      ↑
                         agents · webmail · IMAP · same-account RPC
```

**Agents** call structured HTTP (`/api/send`, `/api/reply`, `/api/messages`, `/api/search`, `/api/threads/{id}`) or a same-account `MailboxService` RPC entrypoint on the inbound Worker. No token hop between Workers on the same account.

**Humans** get read-only doors onto the same store, not a second database:

- **Webmail** at `/webmail`: vanilla HTML/CSS/JS, no build step. Paste origin and API token, browse inbox, threads, search.
- **IMAP proxy** (`imap/`): Twisted server, read-only INBOX/Sent/All for Thunderbird or iOS Mail.

Sending stays on the structured API (or SMTP submission through the relay). Webmail and IMAP do not get a separate send path that could drift from what agents see.

## What changed from cf-email-relay

| cf-email-relay | Postern |
|---|---|
| Send only | Send, receive, store, search, thread |
| Stateless Worker | Inbound Worker + D1 + R2 (+ optional Vectorize) |
| `POST /send` and RPC `EmailService.send()` | `MailboxService` + full REST mailbox API |
| Relay: SMTP → HTTPS → `/send` | Relay: inbound ingest, outbound dispatch, SMTP submission |
| MIT template repo | Operational mailbox under `skyphusion-labs` |

The Go relay still listens on loopback (reference deploy: `127.0.0.1:2525`). Jenkins and Uptime Kuma still email through SMTP locally. The relay now also posts inbound mail to `/ingest` with a transport token, and can dispatch outbound via BYO SMTP when `OUTBOUND_TRANSPORT=relay`.

Legacy fallback: if `POSTERN_INGEST_URL` is unset, the relay still posts to `/send` like the old project.

## Inbound and trust

Email Routing delivers to the inbound Worker's `email()` handler. MIME is parsed (`postal-mime`), SPF/DKIM/DMARC are recorded, messages land in D1 with FTS5 full-text search. Attachments go to R2. Optional Vectorize + Workers AI embeddings enable semantic or hybrid search.

Separate tokens for API access (`POSTERN_API_TOKEN`) vs transport (`POSTERN_TRANSPORT_TOKEN`). Bearer compare is constant-time. Webmail keeps the token in `sessionStorage` only; message bodies render in a sandboxed iframe, not via `innerHTML` on raw HTML.

## Outbound

Default path: Cloudflare Email Sending via the `send_email` binding (`CfEmailTransport` → `env.EMAIL.send()`). Domain vars pin `DEFAULT_FROM` and `ALLOWED_FROM_DOMAIN`.

Off-domain `From` on SMTP ingest gets rewritten to the default with the original kept as `Reply-To`, same idea as cf-email-relay.

## Deploy and smoke

From a fresh clone with your own domain: `DEPLOY.md` walks through Email Sending onboarding, Routing, D1 migrations, and secrets. `inbound/smoke.mjs` is the v1.0 acceptance script: deploy, send, store sent copy, reply with threading, receive inbound, search.

CI on `main` auto-deploys the Workers. The relay is manual: `go build` plus systemd on the host (our reference box still runs the binary as `skyphusion-email-relay`).

## Update, July 2026: the IMAP door grew up

The two weeks since this post went up were almost entirely about turning "read-only IMAP proxy" from a demo into a door a real mail client will actually live behind. Postern had the busiest fortnight of anything I maintain, so here is the shape of it rather than the full changelog.

**IMAP became a real protocol citizen.** Server-side SEARCH pushdown for SUBJECT/BODY/TEXT (the store does the searching, not the client), ENVELOPE and RFC822.SIZE served from a new envelope-fidelity model (the relay now keeps every MIME part, and the contract states plainly that RFC822.SIZE is the size of what we serve), HEADER.FIELDS fetches answered correctly, non-ASCII envelope fields RFC 2047-encoded so a FETCH can never crash, RFC 2177-correct IDLE advertising, RFC 2971 ID, and a durable UID that equals the store insertion key so UIDs survive restarts. Several rounds of this were driven by pointing real clients (Thunderbird, iOS Mail, even Apple Notes' folder dance) at the door and fixing what they choked on.

**The doors got production security.** The 993 IMAPS door and the 587 submission door both now support LDAP authentication (direct-bind with self-read on 587, group-gated with TLS pinning on 993), trust-gated PROXY protocol v1 and v2 behind a load balancer, TLS 1.2 floors everywhere including BYO-SMTP StartTLS, per-account brute-force throttles, and a full Let's Encrypt chain presented on 993. Both the Go relay and the Python IMAP door are now containerized and published to GHCR.

**The mailbox learned identities and standards.** A per-identity send registry rides on the scope resolver, so an agent can be granted sending as one address and not another, with `ALLOWED_FROM_DOMAIN` enforced at resolve time; the MCP server gained scope-gated, default-off send tools on top of it. An env-gated MTA-STS policy route (RFC 8461) and a per-user `.mobileconfig` generator for iOS Mail round out the standards work, and `POST /ingest` from the contract is now implemented rather than promised.

**And the boring hard ones.** The 30 MiB body cap is enforced while reading the stream, not after buffering it, and CI only auto-applies D1 migrations whose shape is additive.

The direction should be obvious from the list: Postern is heading toward being the mailbox my whole stack, humans included, actually lives on, not just the thing that receives robot notifications.

## What it is

Email for humans and agents on Cloudflare, self-hostable, with BYO SMTP on the seams that need it. The unglamorous infrastructure that lets Vivijure, Prism, and the monitors actually tell you when something happened, and lets an agent read the thread afterward.

Code: [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern).
