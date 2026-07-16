---
layout: ../layouts/AboutLayout.astro
title: "Privacy, skyphusion.net"
description: "How skyphusion.net handles data: cookieless self-hosted analytics, GitHub-backed comments, and a search box that does not keep your questions. We do not want your data."
---

# Privacy

**Scope.** This notice covers the blog that Skyphusion Labs operates at **skyphusion.net** (and
www.skyphusion.net, which redirects to it). It does not cover the projects this blog links to or
writes about; each of those has its own notice. The site source is public and MIT-licensed: if you
reuse it, you are the operator of your copy and this notice does not bind you. This is a
plain-language description of how the site handles data. It is not legal advice.

## We do not want your data

There is no account here, no sign-up, no newsletter, and no form that asks who you are. Reading this
blog is anonymous: we set no cookies of our own, and there is no advertising, ad-tech, profiling, or
third-party tracker on the page.

Three things on this site do touch data, and all three are described below in full: aggregate
analytics, the comment box, and the search box. Nothing else does.

## 1. Analytics (self-hosted, cookieless)

Every page loads a script from **analytics.skyphusion.org**. That is **Umami**, an open-source
analytics tool we run ourselves, on our own infrastructure, for aggregate traffic counts (which posts
get read) and nothing else.

- **Cookieless**: no cookie, no persistent identifier following you between visits.
- It records the page you viewed, the page that referred you, and the coarse technical details your
  browser volunteers (browser, operating system, device type, and a country derived from your IP
  address at request time).
- **Self-hosted**, so no analytics vendor receives any of it. There is no third party in this path to
  sell it to, and we do not sell or share it.
- It is not used to profile or identify individual readers.
- **How long we keep it: indefinitely, for now.** Umami has no built-in expiry for collected
  data, and we run no job that prunes it, so these aggregate records sit in our database until
  we delete them by hand. We would rather tell you that than quote you a tidy retention window
  we do not actually enforce. If we start pruning, this notice changes with it.

Any content blocker will stop the script from loading. The site works fine without it.

## 2. Comments (GitHub, and this one leaves our hands)

Blog posts carry a comment box powered by **giscus**. This is the one place where a genuine third
party is in the path, so be clear-eyed about it:

- The comment box loads a script from **giscus.app** and is backed by **GitHub Discussions** on the
  public `skyphusion-labs/skyphusion-net` repository.
- **Commenting requires you to sign in and authorize giscus with your GitHub account.** If you never
  comment, you never sign in, and no GitHub account is associated with your reading.
- **Comments you post are public**, permanently, on GitHub. They are a GitHub Discussion, not a
  private message to us. Your GitHub username and avatar appear next to them.
- Loading the comment box means **giscus.app and GitHub receive the request** (including your IP
  address and which post you are reading). That processing is theirs, under **GitHub's** privacy
  policy, not ours. We receive no comment data separately: your comment lives in GitHub, and we read
  it there like anyone else.
- You edit or delete your comments on GitHub, where they live. We cannot delete them for you, and we
  do not hold a copy to delete.

If you would rather not load giscus at all, block `giscus.app`; the post itself reads normally.

## 3. Search (your question is not kept)

The [search page](/search) sends your question to **search.vivijure.com**, a Cloudflare Worker we run
([search-mcp](https://github.com/skyphusion-labs/search-mcp), source public). What happens to it:

- Your question is checked by **Cloudflare Turnstile** (an anti-bot challenge) before it is answered.
  That check sends your IP address to Cloudflare.
- Your IP address is used as an in-memory **rate-limit key** so one visitor cannot flood the service.
  It is not stored in a database and not written to a record about you.
- Your question is answered by **Cloudflare AI Search** over an index of this blog's own posts, with
  a Cloudflare Workers AI model writing the answer. Your question and the answer stay inside
  Cloudflare; we add no other AI vendor to this path.
- **We do not keep your questions.** The service has no database, no key-value store, and no object
  storage attached: the question is processed in flight to produce your answer and is then gone. We
  do not log question text, and there is no search history under your name because there is no name.

If you never use the search box, none of this happens.

## Cloudflare serves this site

The blog runs as a Cloudflare Worker, so Cloudflare necessarily processes your request (including your
IP address) to route it, serve the page, and protect the site from abuse. That processing is
Cloudflare's, under Cloudflare's terms, as our infrastructure provider. We keep Workers request logs
in our own Cloudflare account for operational purposes: knowing the site is up, and debugging it when
it is not. We do not mine them.

## What we never do

No selling. No sharing with data brokers. No ad-tech. No profiling. No cross-site tracking. No
tracking pixels in the RSS feed.

## Contact

The blog is operated by Skyphusion Labs. Privacy questions: **privacy@skyphusion.org**.

Not legal advice.
