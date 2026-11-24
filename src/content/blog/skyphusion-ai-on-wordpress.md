---
title: "How Skyphusion AI plugs into a WordPress site"
seoTitle: "How Skyphusion AI integrates with WordPress"
description: "Where the free Skyphusion AI plugin hooks into WordPress and WooCommerce: search, the AI Client provider, shortcodes, editor tools, and what stays off until you turn it on."
seoDescription: "How Skyphusion AI hooks into WordPress: visitor search, AI Client provider, WooCommerce stock text, shortcodes, editor tools, and opt-in jobs."
pubDate: 2026-11-24T06:00:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "ai"]
draft: false
---

The [overview post](/blog/skyphusion-ai/) covers why the plugin exists and what Cloudflare bills. This post is about the WordPress side. It shows where [Skyphusion AI](https://wordpress.org/plugins/skyphusion-ai/) hooks in. It shows what visitors see. It shows what editors and other plugins can call.

Current release: [v0.7.0](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0). License: GPL-2.0-or-later. Needs WordPress 6.4 and PHP 8.0.

## The shape of the integration

The plugin does not replace your theme. It does not take over the cart. It registers pieces WordPress already understands.

1. Settings under **Settings, then Skyphusion AI**.
2. A public AI Search snippet for visitors.
3. A provider on the [WordPress AI Client](https://make.wordpress.org/ai/).
4. Shortcodes and optional admin jobs.
5. Four read-only abilities for agents.

Almost every tool stays off until an admin turns it on. The public search box needs only an AI Search endpoint.

## Connect the site once

Do this before you expect search or model calls.

1. In Cloudflare, create an AI Search instance that crawls the site. Turn on its public endpoint.
2. In WordPress, open Settings, then Skyphusion AI.
3. Paste the endpoint (`https://something.search.ai.cloudflare.com/`).
4. Choose the search box, keyboard search, and whether chat is on.
5. Press Check connection.
6. Open Settings, then Connectors. Save the Workers AI API token.

The page never holds that token. Workers AI reads `CLOUDFLARE_API_KEY` from the environment first. It then tries a PHP constant of the same name. It then uses the Connectors token through the AI Client registry. The settings screen says which source is in use. It does not show the token.

Leave the gateway id blank to call `api.cloudflare.com`. Set a gateway id to send Workers AI through `gateway.ai.cloudflare.com`. AI Search chat does not use that gateway id.

## What visitors see

### Search box and keyboard search

Visitors get a search box when you paste the endpoint. Ctrl+K or Command+K opens the same search. The shortcode is `[cloudflare_ai_search]`. You can place it only where that shortcode sits.

The box is Cloudflare's own snippet. The page does not contain an API token. The card can show a product image, title, and description after AI Search crawls again.

### Optional chat button

The chat button is off by default. When on, it answers in a sentence from the indexed site. It is not a help desk. It does not add a product to the cart.

### Search results page

WordPress and WooCommerce results stay as they are by default. One switch can print an AI Search answer above those results. That switch is off until you turn it on. A failed request never shows to the visitor. Cart and checkout can stay quiet when that option is on.

## What the theme and other plugins get

### WordPress AI Client provider

On WordPress 7.0 and later, the plugin registers provider id `skyphusion-ai`. It covers text, vision, JSON, tools, images, and speech. Search and embeddings still run without those interfaces. This plugin does not take over another provider that already exists.

```php
wp_ai_client_prompt( 'Write a product summary.' )
  ->using_provider( 'skyphusion-ai' );
```

Other code can also call helpers:

```php
$vectors = cloudflare_ai_provider_embeddings( array( 'linen shirt' ) );
$answer  = skyphusion_ai_query( 'shipping times' );
```

`skyphusion_ai_query()` posts to the public AI Search chat path. It sends no token. A theme can translate one string with `skyphusion_ai_translate()`.

### Shortcodes for site features

| Shortcode | Role |
| --- | --- |
| `[cloudflare_ai_search]` | Visitor search box |
| `[skyphusion_ai_related]` | Related pages from stored vectors |
| `[skyphusion_ai_member_search]` | Page list for a signed-in role |
| `[skyphusion_ai_assistant]` | Site assistant that answers from stored pages |

Related pages use vectors already stored in your Vectorize index. A page view does not call the embeddings model. Member search returns a list of pages. It does not generate a sentence. A logged-out visitor keeps normal search and spends no neurons on that shortcode.

### Read-only abilities

The plugin registers `skyphusion-ai/search`, `skyphusion-ai/related`, `skyphusion-ai/member-search`, and `skyphusion-ai/status`. Install the WordPress MCP Adapter when a client should call them. This plugin does not open an MCP server. Related pages return an empty list for a private post, a password post, or a post the caller cannot read.

`wp skyphusion-ai smoke` checks that the AI Client provider is present. It does not call Cloudflare.

## What WooCommerce gets

On a single product page the plugin prints stock as plain text inside `main`. Each variation names attributes, SKU, price, and stock. Out-of-stock and hidden rows stay in that list. A crawler that does not run JavaScript can index them.

The same page adds SKU, stock status, and the managed stock count to the meta description. Rank Math and Yoast both receive that sentence. After the next AI Search crawl, the dropdown can quote it.

Search results can print `N available.` under a product that manages stock. Checkout stays a person. The assistant and the chat button do not add items to the cart.

## What editors get in wp-admin

### Embeddings into your Vectorize index

Press Count the posts before the first run. The count runs in small steps. Two embed steps never run at once. A published post can land in your Cloudflare Vectorize index. The plugin skips a password post. An editor can leave one post out. Deleting the plugin leaves the index in the Cloudflare account.

### Site assistant

Off until you turn it on. It answers from stored pages and lists them. You can stream from PHP, or deploy an assistant Worker from the screen. A product answer shows image, SKU, stock status, and managed count. It links to the product. It does not add the product to the cart.

### Empty alt text and SEO backfill

An hourly job can fill empty alt text and an empty SEO description. It does not replace text you wrote. It writes the field Yoast, Rank Math, All in One SEO, or SEOPress already uses.

### Internal link suggestions

The post editor can suggest an internal link when the phrase is already in the post. It can also suggest a return link when this title already appears as a whole word elsewhere. The editor does not change either page. The same screen lists published posts that nothing links to.

### Optional `/llms.txt`

Turn on Publish /llms.txt for AI crawlers when you want it. Unticking the box turns it off. The plugin serves that file only at the home path.

## Neuron budget on the site

The plugin stops Workers AI at a daily neuron budget. The default is 10,000 neurons. That matches the Cloudflare free allocation. Settings, then Skyphusion AI, can raise it. Embeddings, the site assistant, backfill, translation, vision, images, and speech share that budget unless you set a tool limit. The public search box is not a PHP neuron call in this plugin. Free-plan numbers live in the [overview post](/blog/skyphusion-ai/#cloudflare-free-plans-and-their-limits).

## What this plugin does not do

It does not edit posts by default. It does not install the MCP Adapter. It is not a help desk. It does not add items to a cart. It does not send the site to Skyphusion. Embeddings stay in your Cloudflare Vectorize index.

## Where to start

1. Install from [WordPress.org](https://wordpress.org/plugins/skyphusion-ai/) or the [v0.7.0 zip](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0).
2. Connect AI Search and the Workers AI token as above.
3. Turn on only the tools you want.

Code: [github.com/skyphusion-labs/skyphusion-ai](https://github.com/skyphusion-labs/skyphusion-ai). Overview: [Skyphusion AI on the blog](/blog/skyphusion-ai/).
