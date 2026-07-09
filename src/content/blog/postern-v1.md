---
title: "Postern v1.0.0: the mailbox is real"
description: "Postern tagged v1.0.0 on July 9, 2026: the first production-ready release of the self-hostable Cloudflare mailbox for humans and agents. Notes on what the tag means, the five-week path from send-only cf-email-relay to a full store with webmail and IMAP, the acceptance smoke that gates the release, and the honest cost of making real mail clients happy."
pubDate: 2026-07-09
tags: ["cloudflare", "email", "smtp", "go", "side-project"]
draft: false
---

On July 9, 2026, Postern tagged **v1.0.0**. That is not a marketing number. It is the first release where a stranger can clone [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern), follow [DEPLOY.md](https://github.com/skyphusion-labs/postern/blob/main/DEPLOY.md), run the acceptance script, and end up with a mailbox that sends, receives, stores, searches, threads, and opens in both a browser and a real IMAP client.

If you read the [Postern introduction](/blog/postern/) from late June, treat this as the milestone post for that story. If you only know the retired [cf-email-relay](/blog/cf-email-relay/) send-only Worker, this is what grew out of it.

## What v1.0.0 means

The contract for Core v1.0 was tracked as [issue #25](https://github.com/skyphusion-labs/postern/issues/25) and encoded in [`inbound/smoke.mjs`](https://github.com/skyphusion-labs/postern/blob/main/inbound/smoke.mjs). A green smoke run deploys (or targets staging), sends mail, stores the sent copy, replies with threading, receives inbound, and searches the result. Nightly staging smoke now runs that script in CI ([`.github/workflows/smoke-staging.yml`](https://github.com/skyphusion-labs/postern/blob/main/.github/workflows/smoke-staging.yml)). The tag ships when the docs, the architecture map, and the release automation catch up to behavior that already worked in production.

One store, one API, six surfaces in one repo:

| Path | Role |
|------|------|
| **`inbound/`** | Core Worker: ingest, D1 + FTS5 + R2, optional Vectorize hybrid search, mailbox API, send |
| **`relay/`** | Go SMTP daemon: loopback ingest, submission 587/465, BYO outbound dispatch |
| **`mcp/`** | MCP server for agents |
| **`webmail/`** | Read-only browser UI at `/webmail` |
| **`imap/`** | Read-only IMAP proxy for Thunderbird, mutt, iOS Mail |
| **`clients/python/`** | Stdlib HTTP client + CLI |

The design rule from [`docs/CONTRACT.md`](https://github.com/skyphusion-labs/postern/blob/main/docs/CONTRACT.md) has not changed: inbound transports land in one store, and every human or agent door reads the same API. Sending stays on the structured path so nothing drifts.

## Five weeks from send-only to tagged

The repo's first commit landed on **June 5, 2026**, the same week as cf-email-relay: a send Worker plus a Go SMTP bridge. Within days the inbound Worker appeared (`feat(inbound): add CF Email Worker for inbound mail ingestion`), and the project stopped being "notify me when the render finishes" and started being "keep the mail."

What followed was not a straight line:

**The store had to become trustworthy.** Attachments moved to R2, FTS5 search landed, chunked embeddings and Vectorize followed, DMARC verdicts got recorded, and envelope fidelity v2 (#189) taught the store how to merge multi-recipient duplicates on the same Message-ID so IMAP ENVELOPE and seen state could be honest. That last part matters more than it sounds. A mailbox that lies about who received a message is worse than no mailbox.

**The legacy send Worker folded into inbound (#190).** Maintaining two Workers that both sent mail was a footgun waiting to happen. v1.0 ships one inbound Worker with same-account `MailboxService` RPC (and a legacy `EmailService` alias for callers that have not migrated yet).

**IMAP ate a fortnight.** I said as much in the [July update on the original Postern post](/blog/postern/). Thunderbird, iOS Mail, and Apple Notes do not care about your architecture diagram. They care whether SEARCH pushdown works, whether ENVELOPE matches what you serve, whether IDLE is RFC 2177-correct, and whether a FETCH with non-ASCII subjects crashes the server. Several rounds of pointing real clients at the door and fixing what they choked on turned "read-only IMAP proxy" from a demo into something I would actually live behind. Server-side SEARCH pushdown for SUBJECT/BODY/TEXT, multipart/alternative HTML projection, attachment bytes as MIME parts, and a durable UID tied to the store insertion key were all part of that grind.

**Vectorize had ghosts.** The v2 index rebuild and orphan-vector reconcile runbook (`docs/reconcile-orphan-vectors.md`) exist because semantic search without a ledger of what was indexed is how you wake up to embeddings pointing at deleted mail. Boring ops work, but v1.0 is supposed to be operable, not just deployable.

PR [#276](https://github.com/skyphusion-labs/postern/pull/276) (`chore: v1.0 polish -- docs, hybrid webmail, staging smoke, release`) closed the hygiene gap on **July 9**: architecture mermaid map, hybrid search as the webmail and MCP default, CHANGELOG, version bump, release-on-tag automation. GitHub Actions published the [v1.0.0 release notes](https://github.com/skyphusion-labs/postern/releases/tag/v1.0.0) minutes later.

## What shipped in the tag

Condensed from [CHANGELOG.md](https://github.com/skyphusion-labs/postern/blob/main/CHANGELOG.md):

**Store and API (`inbound/`).** One Worker handles CF Email Routing ingest and `POST /ingest`, D1 + FTS5 + R2 attachments, optional Vectorize hybrid search, the full mailbox REST surface (`/api/messages`, `/api/search`, `/api/send`, `/api/reply`, `/api/threads`), and same-account RPC. Per-identity send registry (#85), scoped read/send tokens, MTA-STS testing and enforce modes, and a per-user `.mobileconfig` generator for iOS/macOS setup.

**Transport (`relay/`).** Loopback ingest SMTP, submission on 587/465 with pluggable auth (native, LDAP, system), outbound `/dispatch` as a BYO-SMTP bridge with attachments (#92), PROXY protocol support behind a load balancer.

**Client doors.** Webmail and MCP default to hybrid search. IMAP is read-only with SEARCH pushdown and wire-level e2e tests. The Python client ships in-tree (PyPI publishing landed right after the tag as `postern-client`).

**Ops and docs.** [`docs/architecture.md`](https://github.com/skyphusion-labs/postern/blob/main/docs/architecture.md) is the visual map. Nightly staging smoke guards regressions. The reconcile runbook documents how to audit Vectorize orphans without guessing.

## What I would still call unfinished

v1.0.0 is "you can run this yourself and trust the core loop," not "every mail client quirk on earth is solved forever." A few things were already moving on `main` when the tag landed (message delete via IMAP EXPUNGE, npm scope cleanup for `@skyphusion/postern-mcp`). Those are the next layer: mutating the store from human clients without forking the agent API.

The reference deployment on my own domains still runs CI auto-deploy for the Worker and a manual relay binary on the fleet host. That asymmetry is intentional. The Worker is the product; the relay is the seam for anything that only speaks SMTP: Gatus alerting, the servers themselves (cron, package managers, daemon notices), and the other local applications on the box that still talk the same wire protocol RFC 821 defined in 1982.

## Why bother tagging at all

Email is unglamorous infrastructure. Vivijure, Prism, Gatus, the fleet boxes, and the agents all need a place to send "your job finished" and a place to read what arrived overnight. cf-email-relay solved half of that and taught us the SMTP bridge pattern. Postern v1.0.0 is the other half, packaged so you do not have to take my word for it.

Clone it, deploy it, run the smoke. If it goes green, you have what I have: one searchable mailbox that humans and agents share, on Cloudflare, with BYO SMTP on the seams that need it.

Code: [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern). Release: [v1.0.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.0.0).
