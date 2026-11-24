---
title: "Skyphusion AI: Workers AI and AI Search on your WordPress site, fee zero"
seoTitle: "Skyphusion AI: Workers AI and AI Search for WordPress"
description: "Skyphusion AI for Cloudflare is a free GPL WordPress plugin. Put AI Search and Workers AI on your own Cloudflare account. Current release is v0.7.0."
seoDescription: "Free GPL WordPress plugin for Cloudflare AI Search, Workers AI, and AI Gateway. Plugin fee is zero. Current release is v0.7.0."
pubDate: 2026-11-08T19:00:00.000Z
updatedDate: 2026-11-24T05:00:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "ai"]
draft: false
---

[Skyphusion AI](https://wordpress.org/plugins/skyphusion-ai/) is a WordPress plugin for [Workers AI](https://developers.cloudflare.com/workers-ai/), [AI Gateway](https://developers.cloudflare.com/ai-gateway/), and [AI Search](https://developers.cloudflare.com/ai-search/). Current release: [v0.7.0](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0), 20 November 2026. License: GPL-2.0-or-later. It needs WordPress 6.4 and PHP 8.0.

Install it from WordPress.org, or from the [GitHub release zip](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0).

## Why it exists

Other plugins did not meet the need. The harness should not be a paid product of its own. You already have a Cloudflare account. You should put AI Search and agent calls on WordPress or WooCommerce without a second vendor fee.

The plugin is free. It talks to Cloudflare services only. Past the allowances on a Cloudflare plan, the site pays Cloudflare. Nothing in the plugin sends content to Skyphusion.

## What you get

Visitors get a search box. Ctrl+K or Command+K opens the same search. A chat button is optional and off until you turn it on.

WordPress and WooCommerce get a provider on the [WordPress AI Client](https://make.wordpress.org/ai/). The provider id is `skyphusion-ai`. It covers text, vision, JSON, tools, images, and speech. It registers on WordPress 7.0 and later. Search and embeddings still run without those interfaces.

```php
wp_ai_client_prompt( 'Write a product summary.' )
  ->using_provider( 'skyphusion-ai' );
```

Optional tools sit next to that provider. Embeddings go into your Vectorize index. A site assistant can answer from stored pages. An hourly job can fill empty alt text and empty SEO descriptions. Translation and internal-link suggestions are available. Each of those stays off until an admin turns it on. The public search box needs only an AI Search endpoint.

## For a WooCommerce shop

The search card can show the product image, title, and description. On a product page the plugin adds SKU, stock status, and the managed stock count to that description. Rank Math and Yoast both receive the sentence. After the next crawl, the dropdown can quote it.

The product page also prints stock as plain text inside the page. A crawler that does not run JavaScript can index it. Checkout stays a person. The assistant and the chat button do not add a product to the cart.

## For WordPress 7 and agents

The plugin registers four read-only abilities: `skyphusion-ai/search`, `skyphusion-ai/related`, `skyphusion-ai/member-search`, and `skyphusion-ai/status`. Install the WordPress MCP Adapter when a client should call them. This plugin does not open an MCP server. Related pages return an empty list for a private post, a password post, or a post the caller cannot read.

`wp skyphusion-ai smoke` checks that the AI Client provider is present. It does not call Cloudflare.

## The token stays off the page

The search box is Cloudflare's own snippet. The page does not contain an API token. Workers AI reads `CLOUDFLARE_API_KEY` from the environment first. It then tries a PHP constant of the same name. It then uses the token saved under Settings, then Connectors. The plugin asks the WordPress AI Client registry for that token. The settings screen says which source is in use. It does not show the token.

Leave the gateway id blank and model calls go to `api.cloudflare.com`. Set one and they go through `gateway.ai.cloudflare.com`. If that host refuses a call, the plugin uses `api.cloudflare.com` for one hour. The settings screen shows the gateway status and keeps the saved gateway id during that hour.

## Connect a site

1. Create an AI Search instance that crawls the site. Turn on its public endpoint.
2. In WordPress, open Settings, then Skyphusion AI.
3. Paste the endpoint (`https://something.search.ai.cloudflare.com/`).
4. Choose the search box, keyboard search, and whether the chat button is on.
5. Press Check connection.
6. Open Settings, then Connectors. Save the Workers AI API token.

The shortcode is `[cloudflare_ai_search]`. Placement can be the top of the page, or only where that shortcode sits.

## What stays on your account

You can store a published post in your Vectorize index. Press Count the posts before the first run. The count runs in small steps. Two embed steps never run at once. A block editor save uses the new categories and tags.

Related pages use `[skyphusion_ai_related]`. Member search uses `[skyphusion_ai_member_search]`. Both need embeddings on. A logged-out visitor does not spend neurons on member search.

You can turn on an optional `/llms.txt` for AI crawlers. Unticking the box turns it off. The plugin serves that file only at the home path.

## Cloudflare free plans and their limits

The plugin fee is $0. You still need a Cloudflare account. Free plans work. The limits below are Cloudflare's. Confirm them on Cloudflare's pricing pages before you budget. These figures come from those pages for the 0.7.0 release notes.

### Workers AI

Both Workers Free and Workers Paid include 10,000 neurons a day. The count resets at 00:00 UTC.

On Workers Free, past 10,000 neurons the next Workers AI call fails until the next day. There is no overage price on Free. Upgrade to Workers Paid if you need more.

On Workers Paid, past 10,000 neurons you pay $0.011 per 1,000 neurons.

The plugin default daily budget is 10,000 neurons, matching that free allocation. You can raise it in Settings, then Skyphusion AI. At the budget, this plugin stops Workers AI calls until 00:00 UTC. Embeddings, the site assistant, backfill, translation, vision, images, and speech share that budget unless you set a tool limit.

Some models need a paid billing method even when neurons remain. Check the Workers AI pricing page for that list.

### AI Search

AI Search has its own meters. Each month an account includes 5 million ingestion tokens, 10 GB-month of storage, 1,000 semantic queries, and 1,000 full-text queries. Past those caps, Cloudflare bills the rates on the AI Search pricing page.

A small catalog that stays inside those four caps adds $0 of AI Search usage for crawl and search. The chat button and the search-results answer are generation. Generation spends Workers AI neurons. The public search box that only lists pages is not a PHP neuron call in this plugin.

### What this plugin does not bill

The plugin sends nothing to Skyphusion. There is no plugin subscription. The Vectorize index stays in your Cloudflare account when you delete the plugin.

## Limits, stated plainly

This plugin does not edit posts by default. It does not install the MCP Adapter. It is not a help desk. It does not add items to a cart. Embeddings stay in Cloudflare Vectorize. The plugin does not send the site to another company.

Code: [github.com/skyphusion-labs/skyphusion-ai](https://github.com/skyphusion-labs/skyphusion-ai). Directory: [wordpress.org/plugins/skyphusion-ai](https://wordpress.org/plugins/skyphusion-ai/).
