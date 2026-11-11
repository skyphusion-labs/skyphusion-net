---
title: "Postern v1.7.0: a read-scoped agent sees the mailbox it was hired to read"
seoTitle: "Postern v1.7.0: a read-scoped agent sees only its mailbox"
description: "Postern moved from v1.4.1 to v1.7.0 in October 2026. v1.5.0 made organize its own token scope. v1.6.0 paged thread reads and added GET /api/whoami. v1.7.0 lets a read-scoped agent credential read mail addressed to the humans on the deployment, on by default."
seoDescription: "Postern moved from v1.4.1 to v1.7.0 in October 2026. v1.5.0 made organize its own token scope. v1.6.0 paged thread reads and added GET /api/whoami."
pubDate: 2026-11-08T17:00:00.000Z
tags: ["cloudflare", "email", "smtp", "mcp"]
draft: false
---

The [August post](/blog/postern-identity-bound/) left Postern at v1.4.1: each agent and each human holds a credential bound to one identity, and that credential reads and sends as that identity. The line since then is [v1.5.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.5.0), [v1.6.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.6.0), and [v1.7.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.7.0) (8, 9, and 14 October 2026). One of those changes widens a default. Read that one before you upgrade.

## v1.7.0: read follows the credential

If `POSTERN_SEND_IDENTITIES` has an entry whose `scopes` include `read`, that credential can read mail addressed to every address on the deployment, not only its own. This is on by default. There is no key that turns it off. A self-hoster inherits it on first run. You add nothing for it to take effect, and nothing prompts you.

That is deliberate. Postern is email for agents and for humans. An agent asked to find last month's invoice has to be able to find it in the mailbox it was delivered to. An agent that can read only mail addressed to itself cannot do that job. The capability is documented in the [README](https://github.com/skyphusion-labs/postern/blob/main/README.md) and in [DEPLOY.md](https://github.com/skyphusion-labs/postern/blob/main/DEPLOY.md).

Two boundaries did not move with it.

The widening follows the credential, not the person in front of the browser. It keys on a registry Bearer token. Cookie sessions exist only when `WEBMAIL_AUTH_BACKEND` is `native`, and unset is the default. Default webmail is bring-your-own token and sends `Authorization: Bearer`. A person who pastes a read-capable registry token into webmail reads the whole deployment. The worker sees a registry Bearer. It cannot tell there is a browser on the other end. To keep someone on their own mail, give them a cookie session, or a token whose `scopes` omit `read`.

The widening is read only. Marking read, flagging, filing, and what a reply or a forward may quote stay bound to the agent's own address. An agent can read a message it cannot act on. Delegated write, with an audit trail, is a separate change and is not in this tag.

**Upgrading from 1.6.0:** check `POSTERN_SEND_IDENTITIES` before you deploy. Any existing entry whose `scopes` already include `read` widens the moment 1.7.0 goes live. An entry that omits `read` is refused on every read route. That is the supported way to run an agent that can send and cannot read.

Every read-scoped route now states the scope it was answered under, including the misses. `identityScope` was already on `GET /api/messages` and `GET /api/search` since v1.5.0. It is now also on `GET /api/messages/{id}` and its 404, both attachment 404s, `GET /api/threads/{id}`, `GET /api/folders`, and `GET /api/recipients/recent`. A scoped read used to return an empty list or a 404 and say nothing about having been narrowed, so "not your mail" and "no such mail" looked the same.

The 404 stays one answer. The body is the same whether the id is absent or withheld. Nothing says the message exists and is not yours, because that would leak existence. The field is on hits and on misses for the same reason: present only on a miss, its presence would be the leak.

`curl -sH "authorization: Bearer <token>" "$BASE/api/whoami"` tells you what a credential actually reaches. `postern-client` grew `get_message_envelope()` and `get_folders_envelope()` for callers that need the scope next to the payload. `get_message()` and `get_folders()` still return what they returned in 1.6.0. A `None` from `get_message()` still does not prove the message is absent under a scoped read. That is what the envelope is for. `postern get --envelope` prints it. Without the flag, stdout matches 1.6.0.

The published npm MCP package `@skyphusion/postern-mcp` was still at 1.4.1 when 1.7.0 tagged, and that build does not relay `identityScope`. The in-tree client that does rides its own `postern-mcp-v*` tag.

## v1.6.0: a thread is a page

`GET /api/threads/{id}` still returns `messages` as an array and adds `cursor`. The default page is 20 messages. The route used to return the entire thread. An HTTP caller that ignores `cursor` therefore gets a truncated conversation on any thread longer than 20, with no deserialization error to announce it. Follow the cursor, or pass an explicit `limit`. Webmail had to learn the same thing in this release. It prints "first page" beside the count so the page length is not mistaken for the thread length.

The service-binding break is narrower and louder. `MailboxService.thread()` now returns `Page<StoredMessage>` (`{ items, cursor }`) where it returned an array. A Workers caller that iterated the result reads `.items`. `MailboxService.search()` returns `Page<SearchHit>`, and the dead `snippet` field is gone from the wire type. Nothing ever set it. A TypeScript caller that named `hit.snippet` stops compiling. The field was always `undefined`.

`GET /api/whoami` lets a Bearer caller ask what its scope is. `countOnly` on `GET /api/messages` returns the match count under the same predicate as the rows, so a count and a page agree by construction. `POSTERN_API_TOKEN_ORGANIZE` is an optional secret. Set it only if you want a bearer that can mark seen, set flags, and move messages without holding `imap`. Unset, nothing changes: an `imap` token still satisfies `organize`, and a `read` token is still refused on those three routes.

The Python client's `get_thread()` still returns a list. `get_thread_page()` sits beside it.

## v1.5.0: organize is its own scope

`POST /api/messages/seen`, `/flags`, and `/move` change stored state: read state, flags, and which folder a message sits in. They were declared `read`-scoped, on the argument that managing your own read state is a side effect of reading. That argument does not cover flags or placement. The three routes now demand `organize`.

`organize` is held by `both`, by an `imap` token, by a webmail session, and by a registry entry that lists `organize` in its `scopes`. A `read` token does not hold it. A token issued to read a mailbox cannot change what the mailbox looks like. `send` and `delete` were not reused for this. One scope name should mean one power.

Whose mail a caller reaches did not change in 1.5.0. The viewer predicate is independent of the scope wall. A registry entry granted `organize` still touches only its own mail. A static token with no bound identity stays estate-wide, as before.

Two upgrades fail closed and say so:

1. An IMAP door whose primary token is `read`-scoped loses `\Seen` persistence and soft-move into Trash, Junk, or Archive. Set `POSTERN_API_TOKEN_IMAP` to an `imap`-scoped worker token. Without it the worker answers `403 requires organize scope`.
2. Webmail sessions minted before this change lack `organize`, because capabilities are snapshotted into the session row at mint. Those sessions get 403 on mark-read, flag, and move until the user logs in again.

A read token issued for sharing, including the public demo token, refuses all three routes.

## What I would check on an upgrade

From 1.4.1 the order is 1.5.0, then 1.6.0, then 1.7.0. The operator actions are the ones above: an `imap`-scoped token if the door was on a read token, a fresh webmail login for old sessions, `.items` if you call `MailboxService.thread()` over a service binding, and a look at every registry entry whose scopes include `read` before 1.7.0 deploys.

`GET /api/whoami` is the check after, not a guess from a 403.

Live read-only demo: [demo.posternonline.com](https://demo.posternonline.com). Own install: [DEPLOY.md](https://github.com/skyphusion-labs/postern/blob/main/DEPLOY.md).

Code: [github.com/skyphusion-labs/postern](https://github.com/skyphusion-labs/postern). Releases: [v1.5.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.5.0), [v1.6.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.6.0), [v1.7.0](https://github.com/skyphusion-labs/postern/releases/tag/v1.7.0).

Earlier posts: [introduction](/blog/postern/), [v1.0.0](/blog/postern-v1/), [v1.4.1 identity-bound credentials](/blog/postern-identity-bound/).
