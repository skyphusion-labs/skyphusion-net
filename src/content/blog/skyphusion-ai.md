---
title: "Skyphusion AI: Workers AI and AI Search on your WordPress site, fee zero"
description: "Skyphusion AI for Cloudflare is a GPL WordPress plugin. Visitors get AI Search on the merchant's own Cloudflare account. WordPress gets an AI Client provider. The plugin fee is zero, the token stays off the page, and v0.6.3 is the current release."
pubDate: 2026-11-08T19:00:00.000Z
tags: ["cloudflare", "wordpress", "woocommerce", "ai"]
draft: false
---

[Skyphusion AI](https://github.com/skyphusion-labs/skyphusion-ai) is a WordPress plugin for [Workers AI](https://developers.cloudflare.com/workers-ai/), [AI Gateway](https://developers.cloudflare.com/ai-gateway/), and [AI Search](https://developers.cloudflare.com/ai-search/). Current release: [v0.6.3](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.6.3), 3 November 2026. License: GPL-2.0-or-later. It needs WordPress 6.4 and PHP 8.0.

The reason it exists is short. Other plugins did not meet the need, and the harness should not be a paid product of its own. A site owner who already has a Cloudflare account should be able to put AI Search and agent calls on a WordPress or WooCommerce site without paying a second vendor for the privilege. The plugin is free. It talks to Cloudflare services only. Past the allowances on a Cloudflare plan, the site pays Cloudflare. Nothing in the plugin sends content to Skyphusion.

## Three jobs

Visitors get a search box. Ctrl+K or Command+K opens the same search from the keyboard. A chat button is optional and off until you turn it on.

WordPress and WooCommerce get a provider on the [WordPress AI Client](https://make.wordpress.org/ai/). The provider id is `skyphusion-ai`. It covers text, vision, JSON, tools, images, and speech, and it registers on WordPress 7.0 and later, when those interfaces exist. Search and the embeddings helper still run without them. The plugin does not take over a provider some other plugin already registered. A caller that wants Cloudflare asks for this one:

```php
wp_ai_client_prompt( 'Write a product summary.' )
  ->using_provider( 'skyphusion-ai' );
```

The third job is the set of calls around that provider: embeddings into the merchant's Vectorize index, a site assistant, an hourly fill for empty alt text and empty SEO descriptions, translation, and internal-link suggestions. Each of those is off until an admin turns it on, except the public search box, which needs only an AI Search endpoint.

## The token stays off the page

The search box is Cloudflare's own snippet. The page does not contain an API token. Workers AI reads `CLOUDFLARE_API_KEY` from the environment, then a PHP constant of the same name, then the token saved under Settings, then Connectors. v0.6.3 reads that token from the WordPress AI Client registry. It does not read a `connectors_ai_*` option. The settings screen says which source is in use. It does not show the token.

If you had saved a token when the provider id was still `cloudflare`, save it again. Another plugin uses the id `cloudflare`. Ours is `skyphusion-ai` as of v0.6.3.

Leave the gateway id blank and model calls go to `api.cloudflare.com`. Set one and they go through `gateway.ai.cloudflare.com`. If that host refuses a call, the plugin uses `api.cloudflare.com` for one hour and the screen says so. Prompt logging happens only on the gateway host. Embedding calls do not log prompts.

## Search, then the catalog a crawler can read

Connect a site in this order. Create an AI Search instance that crawls the site and turn on its public endpoint. In WordPress, open Settings, then Skyphusion AI. Paste the endpoint (`https://something.search.ai.cloudflare.com/`). Choose the search box, the keyboard search, and whether the chat button is on. Press Check connection.

The shortcode is `[cloudflare_ai_search]`. Placement can be the top of the page, or only where that shortcode sits. Search results stay as WordPress or WooCommerce left them until you turn on the switch that shows an AI Search answer above them. That switch is off by default. A failed request is not shown to the visitor. Cart and checkout stay quiet when the option to hide the box there is on.

On a product page the plugin prints stock as text inside `main`: status, SKU, and the managed count when the product manages stock. A variable product lists each variation's attributes, SKU, price, and stock, including out-of-stock and hidden rows, because an index that drops those rows is lying about the catalog. The cap is 100 variations per page. A filter raises it. The same facts land in the meta description that Rank Math and Yoast already expose, so the search card can quote them after the next crawl. A browser refresh does not start that crawl.

A numeric `stock_quantity` field is optional and lives on the AI Search instance, not in the plugin. The plugin has no token for that account. The dashboard path is AI, then AI Search, then the instance, then Parser options, then Custom metadata. An instance allows five custom fields. Adding this object as the only field removes the ones you already have.

## What stays on your account

A published post can be stored in the merchant's Vectorize index. The embeddings model is `@cf/baai/bge-large-en-v1.5`. The settings screen estimates passages, neurons, days, and stored dimensions before the first run. A post that did not change is not sent again. A password-protected post is left out. An editor can leave one post out. Deleting the plugin removes the saved choice and leaves the index in the Cloudflare account.

Related pages (`[skyphusion_ai_related]`) read those stored vectors. A page view does not call the embeddings model. Member search (`[skyphusion_ai_member_search]`) returns a list of pages for a signed-in member in a chosen role. It does not generate a sentence. A logged-out visitor is refused before any request.

The site assistant answers from the stored pages and lists them. It is off until you turn it on. You can deploy its Worker from the settings screen or with `wp skyphusion-ai worker deploy`. A blank Worker URL keeps the call in PHP. The page still does not show the token. A product answer shows the image, the SKU, the stock status, and the managed count, and it links to the product. It does not add the product to the cart.

An hourly job can fill empty alt text and an empty SEO description. It does not replace text an admin wrote. It writes the field Yoast, Rank Math, All in One SEO, or SEOPress already uses. The SEO job skips a page with fewer than 40 characters of text. The alt-text job reads the image. A decorative image is marked and the alt field stays empty.

The plugin registers one read-only ability, `skyphusion-ai/search`. The call sends no token. v0.6.3 dropped the sentence that said an MCP server was planned. This release does not open one.

## The bill

There is no plugin price and no subscription. Workers AI is priced by Cloudflare at $0.011 per 1,000 neurons, with 10,000 neurons a day included on the Free plan and on the Paid plan. Those figures were read 25 October 2026. Confirm them before you budget. The plugin uses 10,000 as the default daily cap. Past that, the site pays Cloudflare. Search answers are counted. The public search snippet is not a PHP neuron call.

The default writing model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. A light model is optional and, when set, handles titles, excerpts, meta descriptions, moderation, and alt wording. The default image model is `@cf/black-forest-labs/flux-1-schnell`. Speech is `@cf/deepgram/aura-1`. The settings screen lists the models the account actually has and keeps that list for 12 hours. An id that is neither built in nor on that list is refused.

`wp skyphusion-ai status` prints the same options the dashboard saves. Reset clears settings, prompts, usage, and search logs. Text already stored on posts stays. The Vectorize index is not deleted.

v0.6.3 also answers the 1 November 2026 plugin-directory review: the assistant scripts load through `wp_enqueue_script`, the stream uses the WordPress HTTP API, and `readme.txt` has an External services section that names each Cloudflare service, the data sent, and when it is sent. The plugin check on the shipped zip reports no errors and no warnings. The zip is on the [v0.6.3 release](https://github.com/skyphusion-labs/skyphusion-ai/releases/tag/v0.6.3).

Code: [github.com/skyphusion-labs/skyphusion-ai](https://github.com/skyphusion-labs/skyphusion-ai).
