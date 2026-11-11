---
title: "WordPress on Cloudflare: measure every approach, then provision the one that holds"
description: "I like the WordPress CMS and I do not want the LAMP box under it. wordpress-on-cloudflare is the attempt to put that CMS on Cloudflare: scale to zero when idle, edge performance when a page can be cached, measured before it is claimed."
seoDescription: "I like the WordPress CMS and I do not want the LAMP box under it. wordpress-on-cloudflare puts that CMS on Cloudflare: scale to zero, measured before claimed."
pubDate: 2026-11-08T20:00:00.000Z
updatedDate: 2026-11-08T23:30:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "php"]
draft: false
---

WordPress has always had a place with me. I like the CMS: the editor, the plugins, a store or a magazine a person can actually run. What I have never liked is the LAMP backend. A machine that stays on, Apache or nginx, MySQL, and a PHP process sitting there whether anyone is reading or not.

This project is the attempt to keep that CMS and drop that backend. Workers, Durable Objects, Containers, and Workers for Platforms are the first Cloudflare pieces that make the trade real. A content site should scale to zero while it is idle, and a page that can be cached should come from the edge. A WooCommerce store that takes an order still needs a container, because the isolate runs out of memory once a cart becomes a checkout. The CMS stays WordPress either way.

Almost nobody else is working on this. The people building the edge do not care about WordPress, and the people running WordPress are busy keeping the box alive. I care, which is the whole reason the repository exists. This blog is Astro, on purpose. The sites I want someone else to be able to run, with a CMS they already know, are the ones this work is for.

[wordpress-on-cloudflare](https://github.com/skyphusion-labs/wordpress-on-cloudflare) is two things in one GPL-2.0 repository. The first is a matrix of ways to run WordPress, and WooCommerce, on Cloudflare. The second is the framework that matrix produced: many sites on your own Workers for Platforms account, each one provisioned by a command or by a Worker. It is a framework you run. It is a research log. It has no signup and no hosted plan.

The method is the part worth copying even if you never deploy it. A cell is one of five marks:

| Mark | Meaning |
|------|---------|
| **measured** | We deployed it and ran the test in `tests/`. The result names the command and the date. |
| **docs** | Cloudflare's documentation says it is possible. We did not deploy it. |
| **claimed** | A third party says it works. We did not deploy it. |
| **no** | A documented limit blocks it. The limit is named. |
| **unbuilt** | No known implementation exists. |

A speed number with no command and no date is not in this repo. The same test on the same code moved between runs. Approach A served 18.7 requests per second at 100 users in one load matrix and 8.63 in another. Two containers on the same image, with the same published vCPU, did not serve the same rate. On the Durable Object variant, two runs of the same build differed by up to 15 percent on one page. Comparisons are bracketed: the same build with the change off, on, and off again. A single run is never the number for a variant.

## Four shapes

| Id | PHP runs in | Database |
|----|-------------|----------|
| **A** | A Worker, PHP compiled to WebAssembly | MySQL through Hyperdrive |
| **B** | A Worker, PHP compiled to WebAssembly | D1, or SQLite inside a Durable Object |
| **C** | A Cloudflare Container, stock WordPress | SQLite on the container disk, or MySQL through Hyperdrive |
| **D** | A Worker for visitors, WordPress for admin | Whatever the back office uses |

Headless stayed off the product. WordPress keeps rendering the storefront. D is documented. The framework does not provision it.

The plan column decides more than the diagram does. On Workers Free, our approach A stops at the CPU limit: the installer is refused, and the plugin suite is 0 of 18. PHP inside a Durable Object is what fits Free, because a Durable Object gets a longer CPU budget than a Free Worker request. On Workers Paid, approach A passes the end-to-end script and a WooCommerce checkout. The tax is per-query time. Give Hyperdrive the database host name and a query measured about 7 ms. The same path by IP address measured about 44 ms. A Tunnel with Access measured about 100 ms.

A2 is approach A with the database on PlanetScale, measured 6 November 2026 on Paid: install, end-to-end 17 of 17, WooCommerce 12 of 12, about 16 to 20 ms per query. PlanetScale is strict about SQL mode, and Hyperdrive's default query cache (60 seconds, not invalidated on writes) will serve a stale WordPress read. The deploy turns that cache off. Check the integration's auto-created config before you trust it.

## Transactions, or the lack of them

`ROLLBACK` does not mean the same thing on every row of the matrix.

| Variant | Database | A rollback undoes the writes |
|---------|----------|------------------------------|
| `b-do` | D1 | No. Each statement commits on its own. `BEGIN` and `COMMIT` are answered in PHP. |
| `b-dosql` | SQLite in the Durable Object | Yes. An undo log in the object. |
| `c1` | SQLite on the container disk | Yes. PHP's own driver. |
| `a`, `a2` | MySQL through Hyperdrive | Yes. |

WooCommerce, some plugins, and core upgrades rely on rollback. On plain `b-do` they do not get it. That is a measured property of D1, recorded so a green page render is not mistaken for a safe write.

## What you actually provision

The operator document is [docs/framework.md](https://github.com/skyphusion-labs/wordpress-on-cloudflare/blob/main/docs/framework.md). Two kinds of site share one dispatch namespace.

**`wp`** is `b-dosql`. PHP and its SQLite live in one Durable Object, deployed as a user Worker. Use it for a content site, or for a storefront whose shoppers browse and whose pages can come from the edge cache. The framework table says this kind is the wrong place for an order. The isolate has 128 MiB for everything. WooCommerce asks for more than that once a cart becomes a checkout.

**`shop`** is `c1`. Stock WordPress and WooCommerce in a Container, SQLite on disk, Litestream copying the database to R2. Use it when the store takes orders. Measured on Paid: 12 of 12 store tests, checkout about 1.3 to 1.7 seconds, pages about 0.6 to 1.0 seconds, a cold start about 11 seconds, plugin suite 18 of 18. One container means one region, one writer, and the first visitor after a sleep waits.

The research log and the framework do not tell the same checkout story. I am leaving the disagreement on the page. The README records a `b-dosql` checkout that fit, live, with the WebAssembly memory cap set to 99 (`x-wasm-mib`), under the 128 MiB isolate limit. `tests/woo.py` was 11 of 12 that day. The same log, updated 8 November 2026, records that uploading a product image on a Woo-warmed isolate does not fit. That write exceeds the same memory ceiling and needs the Container path ([issue #189](https://github.com/skyphusion-labs/wordpress-on-cloudflare/issues/189)). When you provision, follow the framework: orders go on `shop`. The Durable Object site is the content site.

Coming from a Linux box with Apache or nginx, PHP, and MySQL, start at [docs/from-lamp-to-wfp.md](https://github.com/skyphusion-labs/wordpress-on-cloudflare/blob/main/docs/from-lamp-to-wfp.md). It maps that stack onto this one, then sends you back to the framework for the commands.

## One function, two callers

`provisionSite` is Cloudflare API calls: `fetch` and Web Crypto. The CLI and a Worker call the same function. Nothing is built at provision time. You build the `b-dosql` bundle once. You push the container image once (`wrangler containers push` prints a digest). Every later store references that digest.

```sh
node deploy/provision/cli.mjs add --kind wp blog
node deploy/provision/cli.mjs add --kind shop store
```

`add` is idempotent and touches only that site. For `wp` it creates the media bucket, deploys the namespace script with that site's secrets in the same call, and writes the KV route. For `shop` it creates two buckets (the SQLite replica and the media), mints a scoped R2 token for Litestream, and deploys the container Worker from the digest. A shop's first request installs WordPress and WooCommerce and takes about a minute. Later cold starts are about 11 to 12 seconds.

A visitor domain is a CNAME to your zone. The dispatch Worker reads the Host from a KV site map and runs the user Worker or the container store. The plan that deployment needs is Workers for Platforms Paid. The account token needs edit on Workers Scripts, Workers KV, Workers for Platforms, R2, and Account Tokens (the last one mints each store's Litestream key).

## Two idle sites

The reference deployment's at-rest bill, priced from Cloudflare's pages on 6 November 2026, is about $25 a month. That figure is the Workers for Platforms Paid subscription. Requests, CPU, namespace scripts, Durable Object storage, R2, and KV for two idle sites sit inside the included or free allotments. Traffic is extra. The included tiers are per account, shared across every site.

One line is open on purpose. The per-site dispatcher and the shared outbound Worker are ordinary Workers, not namespace scripts. The pricing page does not say whether Workers for Platforms Paid covers them, or whether a separate Workers Paid plan ($5 a month) is also required. If it is, the idle total is about $30. That needs a billing check or a word from Cloudflare. The README leaves it open. This post does too.

## Where main is

On 8 November 2026, `main` picked up theme data held across requests, alt text for uploaded images through a Workers AI binding, the media-upload ceiling written down with a test that can be re-run, and WP-Cron plus outbound mail moved off the request path. Those commits do not promote a cell. A cell moves when `docs/results.md` names the command, the date, and the outcome.

Code: [github.com/skyphusion-labs/wordpress-on-cloudflare](https://github.com/skyphusion-labs/wordpress-on-cloudflare). License: GPL-2.0.
