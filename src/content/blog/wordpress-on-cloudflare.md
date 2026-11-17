---
title: "Pagefeather: measure every approach, then provision the one that holds"
seoTitle: "Pagefeather: measure every approach first"
description: "I like the WordPress CMS. I do not want the LAMP box under it. Pagefeather puts that CMS on Cloudflare. Sites scale to zero when idle. Cached pages come from the edge. We measure before we claim."
seoDescription: "Pagefeather puts WordPress on Cloudflare. Sites scale to zero. Cached pages come from the edge. We measure before we claim."
pubDate: 2026-11-08T20:00:00.000Z
updatedDate: 2026-11-17T14:00:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "php"]
draft: false
---

WordPress has always had a place with me. I like the CMS. I like the editor, the plugins, and a store a person can run. I have never liked the LAMP backend. The machine stays on. Apache or nginx, MySQL, and PHP sit there even when nobody reads.

This project keeps that CMS and drops that backend. Workers, Durable Objects, and Workers for Platforms make the trade real. A content site scales to zero while it is idle. A cacheable page comes from the edge. A light-to-moderate WooCommerce store can take an order in the same Durable Object. The CMS stays WordPress either way.

Almost nobody else is working on this. Edge builders do not care about WordPress. WordPress operators are busy keeping the box alive. I care. That is why the repository exists. This blog is Astro on purpose. I want other people to run sites with a CMS they already know. That is what this work is for.

[Pagefeather](https://github.com/skyphusion-labs/pagefeather) is two things in one GPL-2.0 repository. The first is a matrix of ways to run WordPress and WooCommerce on Cloudflare. The second is the framework that matrix produced. You run many sites on your own Workers for Platforms account. A command or a Worker provisions each site. It is a framework you run. It is a research log. It has no signup and no hosted plan. Before 2026-11-13 the repository name was `wordpress-on-cloudflare`.

The method is worth copying even if you never deploy it. A cell is one of five marks:

| Mark | Meaning |
|------|---------|
| **measured** | We deployed it and ran the test in `tests/`. The result names the command and the date. |
| **docs** | Cloudflare's documentation says it is possible. We did not deploy it. |
| **claimed** | A third party says it works. We did not deploy it. |
| **no** | A documented limit blocks it. We name the limit. |
| **unbuilt** | No known implementation exists. |

A speed number with no command and no date is not in this repo. The same test on the same code moved between runs. Approach A served 18.7 requests per second at 100 users in one load matrix. It served 8.63 in another. On the Durable Object variant, two runs of the same build differed by up to 15 percent on one page. We bracket comparisons. We run the same build with the change off, on, and off again. A single run is never the number for a variant.

## Four shapes

| Id | PHP runs in | Database |
|----|-------------|----------|
| **A** | A Worker, PHP compiled to WebAssembly | MySQL through Hyperdrive |
| **B** | A Worker, PHP compiled to WebAssembly | D1, or SQLite inside a Durable Object |
| **C** | A Cloudflare Container, stock WordPress | SQLite on the container disk, or MySQL through Hyperdrive |
| **D** | A Worker for visitors, WordPress for admin | Whatever the back office uses |

Headless stayed off the product. WordPress keeps rendering the storefront. We document D. The framework does not provision it.

**C1** was stock WordPress in a Container with SQLite on disk and Litestream to R2. We retired it ([#214](https://github.com/skyphusion-labs/pagefeather/issues/214)). It measured well. b-dosql replaced it for stores. The CLI refuses `kind: shop`.

The plan column decides more than the diagram does. On Workers Free, approach A stops at the CPU limit. The installer fails there. PHP inside a Durable Object fits Free for plain WordPress. A Durable Object gets a longer CPU budget than a Free Worker request. A light WooCommerce storefront can run on Free. Editing that store needs Workers Paid ([#638](https://github.com/skyphusion-labs/pagefeather/issues/638)). On Workers Paid, approach A passes the end-to-end script and a WooCommerce checkout. The tax is per-query time. Give Hyperdrive the database host name. A query measured about 7 ms. The same path by IP address measured about 44 ms. A Tunnel with Access measured about 100 ms.

A2 is approach A with the database on PlanetScale. We measured it on 6 November 2026 on Paid. Install passed. End-to-end was 17 of 17. WooCommerce was 12 of 12. Queries took about 16 to 20 ms. PlanetScale is strict about SQL mode. Hyperdrive's default query cache lasts 60 seconds and does not invalidate on writes. That cache can serve a stale WordPress read. The deploy turns that cache off. Check the integration's auto-created config before you trust it.

## Transactions, or the lack of them

`ROLLBACK` does not mean the same thing on every row of the matrix.

| Variant | Database | A rollback undoes the writes |
|---------|----------|------------------------------|
| `b-do` | D1 | No. Each statement commits on its own. PHP answers `BEGIN` and `COMMIT`. |
| `b-dosql` | SQLite in the Durable Object | Yes. An undo log in the object. |
| `c1` (retired) | SQLite on the container disk | Yes. PHP's own driver. |
| `a`, `a2` | MySQL through Hyperdrive | Yes. |

WooCommerce, some plugins, and core upgrades rely on rollback. On plain `b-do` they do not get it. That is a measured property of D1. A green page render is not a safe write.

## What you actually provision

The operator document is [docs/framework.md](https://github.com/skyphusion-labs/pagefeather/blob/main/docs/framework.md). Two kinds of site share one dispatch namespace.

**`wp`** is `b-dosql`. PHP and its SQLite live in one Durable Object. The site deploys as a user Worker. Use it for a content site. Use it for a light-to-moderate WooCommerce store. Checkout is measured on Workers Paid under the 128 MiB isolate limit. `tests/woo.py` is green. Cached guest pages come from the edge. Cart, checkout, account, and logged-in pages always run PHP.

**`a`** is the scale-out path. PHP still runs in a Worker. The database sits outside Cloudflare. Hyperdrive reaches it. Use it when a store needs real concurrent traffic. See [docs/onboarding.md](https://github.com/skyphusion-labs/pagefeather/blob/main/docs/onboarding.md).

There is no container store on this framework. A store that outgrows b-dosql can move to approach A. It can also move back to a normal LAMP VPS.

[ggc.sh](https://ggc.sh) is the live WooCommerce example. It runs on Pagefeather b-dosql. Since 2026-11-15 its guest storefront pages cache at the edge. Product, shop, and category pages stay fresh for 30 s by default. Other guest pages stay fresh for 120 s. There is no store Container behind it.

Coming from a Linux box with Apache or nginx, PHP, and MySQL? Start at [docs/from-lamp-to-wfp.md](https://github.com/skyphusion-labs/pagefeather/blob/main/docs/from-lamp-to-wfp.md). It maps that stack onto this one. Then go back to the framework for the commands.

## One function, two callers

`provisionSite` is Cloudflare API calls: `fetch` and Web Crypto. The CLI and a Worker call the same function. Provision time builds nothing. You build the `b-dosql` bundle once. Every later site uses that bundle.

```sh
node deploy/provision/cli.mjs add --kind wp blog
node deploy/provision/cli.mjs add --kind a store
```

`add` is idempotent and touches only that site. For `wp` it creates the media bucket. It deploys the namespace script with that site's secrets in the same call. It writes the KV route.

A visitor domain is a CNAME to your zone. The dispatch Worker reads the Host from a KV site map. It runs the user Worker. The plan that deployment needs is Workers for Platforms Paid. The account token needs edit on Workers Scripts, Workers KV, Workers for Platforms, and R2. It does not need Containers scope.

## Limits that matter on a store

- One Durable Object per `wp` site: one writer, one region, about 5 uncached requests a second.
- Cached product pages can show a stock number that is a short window out of date. Checkout always reads real stock. See the Pagefeather README and [#628](https://github.com/skyphusion-labs/pagefeather/issues/628).
- Bundle size and the 128 MiB isolate still bound which plugins fit. The [support matrix](https://github.com/skyphusion-labs/pagefeather/blob/main/docs/support-matrix.md) lists each feature. It says supported, limited, or not measured yet.

## Two idle sites

The reference deployment's at-rest bill is about $25 a month. That figure comes from Cloudflare's pages on 6 November 2026. It is the Workers for Platforms Paid subscription. For two idle sites, requests and CPU sit inside the included allotments. Namespace scripts, Durable Object storage, R2, and KV do too. Traffic is extra. The included tiers are per account. Every site shares them.

One line stays open on purpose. The per-site dispatcher and the shared outbound Worker are ordinary Workers, not namespace scripts. The pricing page does not say whether Workers for Platforms Paid covers them. It may also need a separate Workers Paid plan ($5 a month). If it does, the idle total is about $30. That needs a billing check or a word from Cloudflare. The README leaves it open. This post does too.

## Where main is

On 17 November 2026, `main` still treats a cell as measured only when `docs/results.md` names the command and the date. It also names the outcome. The store path is b-dosql. The LEAN engine ships. Remote OPcache packs are on by default. Conformance work against upstream suites is underway ([#759](https://github.com/skyphusion-labs/pagefeather/issues/759)). Exact page-cache invalidation exists. It is off by default ([#296](https://github.com/skyphusion-labs/pagefeather/issues/296)). Those commits do not promote a cell by themselves.

Code: [github.com/skyphusion-labs/pagefeather](https://github.com/skyphusion-labs/pagefeather). License: GPL-2.0.
