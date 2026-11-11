---
title: "Zaraz Consent: one button, Cloudflare's modal, and a hard limit"
description: "zaraz-consent v0.1.0 is a GPL must-use WordPress drop-in. It reopens the Cloudflare Zaraz consent modal and reads the cf_consent cookie. It does not gate scripts. Zaraz can gate only Zaraz tools, and a modal over unassigned tools gates nothing."
seoDescription: "zaraz-consent v0.1.0 is a GPL must-use WordPress drop-in. It reopens the Cloudflare Zaraz consent modal and reads the cf_consent cookie."
pubDate: 2026-11-08T18:00:00.000Z
tags: ["cloudflare", "wordpress"]
draft: false
---

[zaraz-consent](https://github.com/skyphusion-labs/zaraz-consent) v0.1.0 is one PHP file. Copy it to `wp-content/mu-plugins/zaraz-consent.php`. WordPress loads must-use plugins on its own. There is no activation step, no settings screen, no banner library, no stylesheet, and no script request of ours. The file adds a footer button. The button stays hidden until `zarazConsentAPIReady`, then sets `zaraz.consent.modal = true`. That reopens the modal [Zaraz](https://developers.cloudflare.com/zaraz/consent-management/) already drew. PHP can read the visitor's choice back with `zaraz_consent_choice('analytics')`, which returns true, false, or null. Null means the visitor has not chosen.

**This plugin does not gate anything. Installing it does not give a site consent.**

Cloudflare does the gating, in the Zaraz configuration. The plugin does none of it. Zaraz can gate only Zaraz tools. WordPress, the theme, and other plugins also load scripts. Those scripts are not Zaraz tools. No purpose reaches them. A correct Zaraz configuration does not stop them.

That limit is the reason the repository exists as a warning as much as a drop-in. If you need the modal, use this. If you need every tracker on the page to wait for a choice, read the next section before you copy the file.

## The quiet failure

Zaraz's own default is the trap. When you add a tool, Zaraz assigns it no purpose. A tool with no purpose skips consent. Turn consent on over a zone full of unassigned tools and you get a modal, a recorded choice, and a `cf_consent` cookie. Every tool keeps firing.

`iac/sync_consent.py` refuses that state. It will not enable consent while `iac/tool-purposes.json` is empty. The empty map ships on purpose, so a sync cannot attach analytics or advertising tools you did not name. The script also refuses a tool id the live configuration does not already hold, and a purpose id that `iac/consent.json` does not hold. It does not create tools. Pass `--allow-empty-tool-map` only when you are staging purposes and you know Zaraz will list none of them until a tool is assigned.

The order is the product:

1. Zaraz is enabled on the zone.
2. Purposes exist (a purpose is a category, such as analytics, not a vendor).
3. Tools are assigned to purposes. This is the only step that gates anything.
4. Consent is enabled.
5. The plugin is installed.

Start at step 5 and you get a hidden button. Stop after step 4 and you get a modal that records a choice and enforces nothing. A purpose with no tool assigned is invisible. Zaraz does not list it.

Check Zaraz from the edge before you touch the dashboard. No credential is required:

```
curl -o /dev/null -w "%{http_code}\n" https://<your-zone>/cdn-cgi/zaraz/i.js
curl -o /dev/null -w "%{http_code}\n" https://<your-zone>/cdn-cgi/trace
```

`i.js` returns 200 when Zaraz is on and 404 when it is off. `/cdn-cgi/trace` returns 200 on any proxied zone, so 200 there plus 404 on `i.js` means Zaraz itself is off. Measured 23 October 2026, `ggc.sh`, `skyphusion.org`, and `vivijure.com` all returned 404 and 200 in that pattern. A zone can hold a Zaraz configuration, with auto-inject on and zero tools, and still not serve the script. Reading the configuration does not replace the request.

## What the measurement on a real storefront showed

Zaraz gates Zaraz tools. It reaches nothing else.

On 23 October 2026 the GGC storefront was loading WooCommerce order attribution and its bundled sourcebuster library on every page, with tracking allowed and no consent check. That code writes its own first-party cookies and captures referrer, UTM parameters, session entry, and user agent. Checkout then posts that into the order. Every part of it is WordPress on the origin. Zaraz never sees it.

Configure Zaraz consent on that store and you get a modal, a recorded choice, and a `cf_consent` cookie. The first-party tracking continues. A consent record that does not cover the tracking it implies is worse than no banner. List every tracker you must gate. Each one has to be a Zaraz tool, or you turn it off, move it into Zaraz, or gate it some other way. The write-up of that measurement is in the [repository README](https://github.com/skyphusion-labs/zaraz-consent/blob/main/README.md).

The cart cookie and Cloudflare's security cookies are not Zaraz tools either. This plugin does not gate them.

## Applying the configuration

```
python3 iac/sync_consent.py iac/consent.json iac/tool-purposes.json
```

The script reads the live Zaraz configuration, replaces the `consent` object, sets `defaultPurpose` on the tools named in the map, and writes the whole configuration back. `CLOUDFLARE_API_TOKEN` and `ZONE_ID` come from the environment. The script does not print the token.

The permission group is its own trap. A token that can read the zone can still be refused here. Without Zaraz Read, `GET /zones/<zone-id>/settings/zaraz/config` returns 403 with error code 10000, "Authentication error". A wrong path under the same prefix also returns 403. A successful `GET /zones/<zone-id>` proves nothing about Zaraz access. Test the Zaraz endpoint. A sync needs Zaraz Edit. Zaraz Admin is wider than the task. Scope the token to the zones you intend to change.

`consent.cookieName` must match what the plugin reads. The default on both sides is `cf_consent`. If the zone uses another name, set `ZARAZ_CONSENT_COOKIE` in `wp-config.php` to the same string.

The footer button is an inline script built with `wp_get_inline_script_tag()`, so a nonce-based content security policy can attach its nonce through `wp_inline_script_attributes`. On WordPress older than 5.7 that helper does not exist and the tag needs `unsafe-inline` in `script-src`. Without it the button stays hidden and nothing reports an error.

## What we did not measure

The `cf_consent` cookie's lifetime and flags are not documented by Cloudflare in a way we could confirm, and no zone in reach had consent configured on 23 October 2026, so there was no live cookie to read. Measure expiry, `Secure`, `SameSite`, `HttpOnly`, path, and domain on your own zone before you write a cookie policy.

The structural claim is checked: `tests/contract.sh` asserts the plugin adds no enqueue and no remote URL. The footer markup is about 500 bytes, inline. There is no before-and-after performance number. Neither Zaraz nor this plugin was running on a zone where that measurement could be taken. Silence there is not a finding.

`companyStreetAddress` in the example config is empty. Add an address only when you have one. The intro HTML is not a privacy policy. Replace it with your own wording and point it at your privacy page.

Code: [github.com/skyphusion-labs/zaraz-consent](https://github.com/skyphusion-labs/zaraz-consent). Release: [v0.1.0](https://github.com/skyphusion-labs/zaraz-consent/releases/tag/v0.1.0). License: GPL-2.0-or-later.
