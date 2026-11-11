---
title: "Postern v1.4.1: each agent reads and sends as itself"
seoTitle: "Postern v1.4.1: each agent reads and sends as itself"
description: "Postern is at v1.4.1. v1.4.0 bound read and send to a person, not a shared mailbox god-token; v1.4.1 fixes the webmail attachment-send race. Conrad Rockenhaus covers identity-bound registry credentials, MCP multi-person setup, the projection census that keeps IMAP honest, and what still stays estate-wide on purpose."
seoDescription: "Postern v1.4.1: v1.4.0 bound read and send to a person, not a shared mailbox god-token; v1.4.1 fixes the webmail attachment-send race."
pubDate: 2026-08-04
updatedDate: 2026-11-08
tags: ["cloudflare", "email", "smtp", "mcp", "side-project"]
draft: false
---

In July I tagged [Postern v1.0.0](/blog/postern-v1/). That release proved the core loop: clone, deploy, smoke green, and keep a mailbox that humans and agents both trust.

The line is now **v1.4.1**. The product change landed in **v1.4.0**: when more than one person (or more than one agent) uses the same store, **who** is reading and **who** is sending?

The answer is not one shared god-token. Each person gets a credential bound to one identity. That token may only act as that person.

## The problem a shared token creates

A mailbox with one `POSTERN_API_TOKEN` works for a solo operator. It fails as soon as two agents share it.

Either agent can list the whole estate. Either agent can send as any allowed From. A leak is total. An audit trail says "the token," not "who."

Postern already had a function split (`read` / `send` / `both`). That bounds **what** a credential may do. It does not bound **who** the credential is.

## What v1.4.0 adds

The per-identity registry (`POSTERN_SEND_IDENTITIES`) already forced outbound `From` for send. v1.4.0 extends that registry so each entry carries **scopes**:

| Scope set | Effect |
|-----------|--------|
| `["send"]` (default if omitted) | Send and reply as the bound address. Read doors refuse. |
| `["read"]` | List, search, and get only that identity (plus its role queues). Caller cannot widen with `to=`. |
| `["read", "send"]` | One dual-cap token for an MCP client that both reads and sends as one person. |

Registry tokens never grant delete or admin. Those stay on the static estate tokens by design.

Resolution order is fixed and documented in [`docs/SEND-IDENTITIES.md`](https://github.com/skyphusion-labs/postern/blob/main/docs/SEND-IDENTITIES.md):

1. Match a static estate secret first (estate-wide scope, no bound identity).
2. Else hash the Bearer token and look it up in the registry.
3. Miss means `401`. Hit means caps plus bound identity.

On send, the worker **overrides** caller-supplied `From`. A token cannot send as anyone else. On read with the `read` cap, the worker forces the viewer to the bound identity. Filters cannot open a wider store.

The registry holds **sha256 hashes**, not raw tokens. It lives as a Worker **var** (not a secret) so you can merge, recover, and redeploy without destroying the map. Domain policy still wins: a registry `from` outside `ALLOWED_FROM_DOMAIN` is dropped at resolve time.

## Why this matters for agents

Agents are first-class doors on Postern, not a side path. The MCP package is [`@skyphusion/postern-mcp`](https://www.npmjs.com/package/@skyphusion/postern-mcp).

For multi-person MCP:

1. Mint one registry token per person.
2. Set `scopes` to at least `["read"]`, or `["read","send"]` if that person may write.
3. Put **that** token in the client's `POSTERN_API_TOKEN`.
4. For dual-cap, set `POSTERN_MCP_SEND=1` (or the equivalent send-cap path in current docs).

Do **not** hand the estate `POSTERN_API_TOKEN` to every agent. That token remains estate-wide on purpose for operators. Sharing it undoes the whole point.

## Projection census (the boring half of honesty)

v1.4.0 also ships a projection-version census (`POST /api/admin/reproject` with `{ "countOnly": true }`). After every reproject sweep, the operator tool can FATAL if `notCurrent > 0`.

IMAP and webmail project the store into door-shaped views. A mailbox that lies about projected state is worse than a slow mailbox. The census is the gate that says "the doors match the store," not "we hope they do."

No `PROJECTION_VERSION` or `POSTERN_IMAP_UIDVALIDITY` bump was required for this cut. The wire format stayed stable. Door image rolls are refresh only.

## v1.4.1 (current)

PATCH on top of the identity work, not a rewrite of it. Webmail compose now waits for staged attachment uploads before send. A quick Send after picking a file could race the upload POST, so the server dispatched with zero parts. Send is disabled (label "Uploading...") while uploads are pending. Empty send field also falls back to a dual-cap read token when the same secret has send scope.

## What still stays unfinished (and intentional)

- Estate static tokens still exist. Solo operators and break-glass ops need them.
- Registry never becomes admin. Delete and admin stay separate so a leaked agent token cannot empty the box.

## Try it

Live read-only demo: [demo.posternonline.com](https://demo.posternonline.com). Mail any address at `@posternonline.com` and watch it land. The public demo token is read-scoped on purpose.

Own install: [DEPLOY.md](https://github.com/skyphusion-labs/postern/blob/main/DEPLOY.md) and the acceptance smoke in `inbound/smoke.mjs`.

Code: [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern). This post covers the identity line at [v1.4.1](https://github.com/skyphusion-labs/postern/releases/tag/v1.4.1) ([v1.4.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.4.0)).

*Update, November 2026:* the release is [v1.7.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.7.0). Organize became its own scope in v1.5.0, thread reads are paged in v1.6.0, and a read-scoped agent credential reads the deployment mailbox. That default is the subject of [Postern v1.7.0](/blog/postern-v1-7/).

Earlier posts: [Postern introduction](/blog/postern/), [v1.0.0 milestone](/blog/postern-v1/).
