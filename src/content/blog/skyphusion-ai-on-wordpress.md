---
title: "How Skyphusion AI fits on a normal WordPress site"
seoTitle: "How Skyphusion AI fits on a WordPress site"
description: "A plain walkthrough for WordPress and WooCommerce folks: where the free Skyphusion AI plugin shows up, what visitors see, and which tools stay off until you flip a switch."
seoDescription: "Plain walkthrough of Skyphusion AI on WordPress: search box, shortcodes, WooCommerce stock text, editor helpers, and opt-in tools."
pubDate: 2026-11-24T06:00:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "ai"]
draft: false
---

If you run WordPress on a normal host, this plugin is for you. Same story if you run WooCommerce on that stack. You install it from [WordPress.org](https://wordpress.org/plugins/skyphusion-ai/) like any other plugin. You open Settings. You paste a couple of values. You turn things on only when you want them.

The [overview post](/blog/skyphusion-ai/) covers price and Cloudflare free-plan limits. This post is the WordPress tour. Current release: [v0.7.0](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0). Needs WordPress 6.4 and PHP 8.0. License: GPL-2.0-or-later.

## What changes on your site (and what does not)

Skyphusion AI does not replace your theme. It does not take over checkout. It does not force a new editor.

It adds a settings page. It can add a search box for visitors. It can offer helpers in wp-admin. Other plugins can ask it for AI help when WordPress supports that. Almost every extra tool starts **off**. You flip a switch when you are ready.

You do need a Cloudflare account for the AI pieces. The plugin fee is still $0. Your content stays on your Cloudflare account, not on ours.

## First-time setup (about ten minutes)

Think of this like connecting a CDN or a mail plugin. You create the service once. Then you paste the address into WordPress.

1. In the Cloudflare dashboard, create an AI Search instance that crawls your site. Turn on the public endpoint.
2. In WordPress, go to **Settings → Skyphusion AI**.
3. Paste the endpoint URL (it looks like `https://something.search.ai.cloudflare.com/`).
4. Turn on the search box. Decide about keyboard search (Ctrl+K / Command+K) and the chat button.
5. Click **Check connection**.
6. Go to **Settings → Connectors**. Save your Workers AI API token there.

That token never appears in the page HTML. The settings screen tells you which source is in use. It does not print the secret.

You can leave the optional “gateway” field blank. Blank is fine for most sites. Fill it in later only if you already use Cloudflare AI Gateway.

## What your visitors notice

### A familiar search box

After you paste the endpoint, visitors can search the site. You can drop the box with the shortcode `[cloudflare_ai_search]`, or let the plugin place it for you. Keyboard search is optional.

The search UI comes from Cloudflare. Your theme still owns the rest of the page. After Cloudflare crawls again, product cards can show image, title, and description.

### Chat is optional

The chat button starts off. When you turn it on, it answers from your indexed pages. It is not a ticket desk. It will not add a product to the cart for someone.

### Normal search results stay normal

Your usual WordPress or WooCommerce results stay as they are. One setting can put an AI answer above those results. That setting also starts off. Bad requests stay hidden from visitors. You can keep the box quiet on cart and checkout.

## Shortcodes you already know how to use

Same idea as any other plugin shortcode. Put them in a page, a block, or a template.

| Shortcode | What it does |
| --- | --- |
| `[cloudflare_ai_search]` | The visitor search box |
| `[skyphusion_ai_related]` | “Related” links from your stored pages |
| `[skyphusion_ai_member_search]` | A simple page list for signed-in members in a role you choose |
| `[skyphusion_ai_assistant]` | A site assistant that answers from your content |

Related links use pages you already stored. Opening a post does not burn a fresh AI call for that list. Member search returns links, not a generated essay. Logged-out visitors keep normal search.

## For theme and plugin developers

On WordPress 7.0 and later, the plugin registers a provider named `skyphusion-ai` on the [WordPress AI Client](https://make.wordpress.org/ai/). Other code can ask for text, images, and similar jobs without talking to Cloudflare by hand.

```php
wp_ai_client_prompt( 'Write a product summary.' )
  ->using_provider( 'skyphusion-ai' );
```

You can also call a couple of helpers from PHP:

```php
$vectors = cloudflare_ai_provider_embeddings( array( 'linen shirt' ) );
$answer  = skyphusion_ai_query( 'shipping times' );
```

`skyphusion_ai_query()` uses your public search endpoint. It does not put a token on the request. Themes can translate a string with `skyphusion_ai_translate()`.

If you use WP-CLI, `wp skyphusion-ai status` and `wp skyphusion-ai smoke` are there for checks. Smoke only looks at WordPress. It does not call Cloudflare.

## WooCommerce shops

On a product page, the plugin prints stock as plain text in the page. Variations list attributes, SKU, price, and stock. That helps search engines that do not run JavaScript.

It also adds SKU, stock status, and managed stock count to the meta description. Rank Math and Yoast both get that sentence. After the next crawl, the search dropdown can show it.

Search results can show “N available.” under products that manage stock. Checkout stays a person. Nothing in this plugin adds items to the cart for a shopper.

## Helpful bits inside wp-admin

These are for you and your editors. Each one is opt-in.

**Store posts for smarter related content.** Press **Count the posts** before the first run. The plugin walks the library in small batches. Published posts can go into your Cloudflare vector store. The plugin skips password posts. You can exclude a post. If you remove the plugin later, that store stays in your Cloudflare account.

**Site assistant.** Off until you turn it on. It answers from your stored pages and cites them. Product answers can show image, SKU, and stock, then link to the product. Still no add-to-cart.

**Empty alt text and empty SEO descriptions.** An hourly job can fill blanks only. It will not overwrite text you already wrote. It writes the same fields Yoast, Rank Math, All in One SEO, or SEOPress already use.

**Internal link ideas.** In the editor, the plugin can suggest a link when a phrase already matches another post. It does not change either post for you. It can also list published posts that nothing links to yet.

**Optional llms.txt.** One checkbox publishes a small file at the home URL for AI crawlers. Untick it and it goes away.

## A daily AI budget you control

Cloudflare measures some AI use in “neurons.” This plugin has a daily stop. That stop keeps a busy day from surprising you. The default is 10,000 neurons. That matches Cloudflare’s free daily allowance. You can raise it under Settings → Skyphusion AI.

The plugin does not count the public search box as a PHP neuron call. The chat button and the heavier admin tools are where spend shows up. Numbers and free-plan notes are in the [overview post](/blog/skyphusion-ai/#cloudflare-free-plans-and-their-limits).

## What it will not do

It will not rewrite your posts unless you turn on a backfill job. It will not act like a live chat help desk. It will not add products to carts. It will not send your site to Skyphusion. Your stored page data stays in your Cloudflare account.

## Try it

1. Install [Skyphusion AI](https://wordpress.org/plugins/skyphusion-ai/) from the Plugins screen (or the [v0.7.0 zip](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.7.0)).
2. Paste the AI Search endpoint and save the API token under Connectors.
3. Turn on one thing at a time. Start with the search box.

Source: [github.com/skyphusion-labs/skyphusion-ai](https://github.com/skyphusion-labs/skyphusion-ai). More on cost and Cloudflare plans: [the overview](/blog/skyphusion-ai/).
