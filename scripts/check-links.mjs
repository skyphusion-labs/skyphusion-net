#!/usr/bin/env node
// CI gate over the BUILT site (dist/client), run after `astro build`. skyphusion-net#153.
// No network, so it cannot flap. Exit 1 on any problem, listed by page:
//   - an internal link to a page or file that the build did not produce;
//   - an internal page link without its trailing slash (each one cost a 307 on the live site);
//   - any mention, linked or not, of a host on RETIRED_HOSTS (it no longer resolves; Conrad
//     2026-11-11: delete the hostname and say the service is offline) or FORBIDDEN_HOSTS
//     (a third party the site must never load again, such as giscus.app);
//   - a page with an empty <title>, or no meta description, or one over 160 characters.
// Exit 2 when it cannot measure (no dist, or no HTML in it).
// Usage: node scripts/check-links.mjs [distDir]
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, resolve } from "node:path";

export const RETIRED_HOSTS = [
  "demo.vivijure.com",
  "analytics.skyphusion.org",
  "common-thread.skyphusion.org",
  "common-thread-backend.skyphusion.org",
  "rustchoir.skyphusion.org",
  "verdigris.skyphusion.org",
  "ferrite.skyphusion.org",
];
// Third parties the site must never reference again. Privacy is the primary goal (#153).
export const FORBIDDEN_HOSTS = ["giscus.app"];
const ORIGIN = "https://skyphusion.net";

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

const attr = (tag, name) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[2] ?? m[3]) : null;
};

/** Problems for one built page. `exists(p)` says whether a dist-relative path was built. */
export function checkPage(page, html, exists) {
  const problems = [];
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  if (!title) problems.push(`${page}: empty <title>`);
  const desc = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, "name") || "").toLowerCase() === "description");
  if (!desc || !(attr(desc, "content") || "").trim()) problems.push(`${page}: no meta description`);
  else if ((attr(desc, "content") || "").length > 160) problems.push(`${page}: meta description is ${(attr(desc, "content") || "").length} characters, over 160`);
  const lower = html.toLowerCase();
  for (const host of RETIRED_HOSTS) if (lower.includes(host)) problems.push(`${page}: names retired host ${host}`);
  for (const host of FORBIDDEN_HOSTS) if (lower.includes(host)) problems.push(`${page}: references forbidden host ${host}`);
  for (const m of html.matchAll(/<(a|link)\b[^>]*>/gi)) {
    const tag = m[0];
    if (m[1].toLowerCase() === "link" && !/rel=["'](alternate|stylesheet|icon|canonical)/i.test(tag)) continue;
    const href = attr(tag, "href");
    if (!href || /^(mailto:|tel:|#|javascript:|data:)/i.test(href)) continue;
    let url;
    try { url = new URL(href, `${ORIGIN}/`); } catch { problems.push(`${page}: unparsable link ${href}`); continue; }
    if (url.origin !== ORIGIN) continue;
    const path = decodeURIComponent(url.pathname);
    if (extname(path)) { if (!exists(path.slice(1))) problems.push(`${page}: links missing file ${path}`); continue; }
    if (!path.endsWith("/")) { problems.push(`${page}: internal link without trailing slash ${path} (a 307 on the live site)`); continue; }
    if (!exists(join(path.slice(1), "index.html"))) problems.push(`${page}: links missing page ${path}`);
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const dist = resolve(process.argv[2] ?? "dist/client");
  if (!existsSync(dist)) { console.log(`::error::UNMEASURED: ${dist} does not exist. Run the build first.`); process.exit(2); }
  const html = walk(dist).filter((f) => extname(f) === ".html");
  if (html.length === 0) { console.log(`::error::UNMEASURED: no HTML under ${dist}.`); process.exit(2); }
  const exists = (rel) => existsSync(join(dist, rel));
  const problems = html.flatMap((f) => checkPage("/" + relative(dist, f).replace(/index\.html$/, ""), readFileSync(f, "utf8"), exists));
  for (const p of problems) console.log(`::error::${p}`);
  console.log(`check-links: pages=${html.length} problems=${problems.length}`);
  process.exit(problems.length ? 1 : 0);
}
