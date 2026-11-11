/**
 * Sitemap lastmod for EVERY page, not only posts (skyphusion-net#153: 36 of 59 URLs had none).
 *
 *   /blog/<slug>/                 the post's updatedDate, else its pubDate (buildPostLastmodMap)
 *   /, /blog/, /blog/tags/        the newest post
 *   /blog/tags/<tag>/             the newest post carrying that tag
 *   /about/ /privacy/ /projects/ /search/   the last commit that touched the page's sources
 *
 * The static pages use git history, and only when the clone is not shallow: a shallow clone
 * would date every file to HEAD, which is a false lastmod. In a shallow clone those pages get
 * no lastmod at all (ci.yml checks out with fetch-depth 0 so the live sitemap has them).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildPostLastmodMap } from './post-lastmod.mjs';

export const STATIC_PAGE_SOURCES = {
  '/about/': ['src/pages/about.md'],
  '/privacy/': ['src/pages/privacy.md'],
  '/projects/': ['src/pages/projects.astro', 'src/lib/projects.ts'],
  '/search/': ['src/pages/search.astro'],
};

/** Tags per post path, read from frontmatter (inline array or YAML list). Drafts are skipped. */
export function postTags(contentDir = './src/content/blog') {
  const out = new Map();
  for (const file of readdirSync(contentDir, { recursive: true }).map(String).filter((f) => f.endsWith('.md'))) {
    const fm = readFileSync(join(contentDir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (/^draft:\s*true/m.test(fm)) continue;
    const slug = relative('.', file).split(sep).join('/').replace(/\.md$/, '');
    let tags = [];
    const inline = fm.match(/^tags:\s*\[(.*)\]\s*$/m);
    if (inline) tags = inline[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else {
      const block = fm.match(/^tags:\s*\n((?:\s+-\s+.*\n?)+)/m);
      if (block) tags = block[1].split('\n').map((l) => l.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    out.set(`/blog/${slug}/`, tags);
  }
  return out;
}

/** Last commit date of any of `files`, or null when git cannot answer truthfully. */
export function gitLastmod(files, run = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim()) {
  try {
    if (run(['rev-parse', '--is-shallow-repository']) !== 'false') return null;
    const iso = run(['log', '-1', '--format=%cI', '--', ...files]);
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}

export function buildSiteLastmodMap({ contentDir = './src/content/blog', git = gitLastmod } = {}) {
  const map = buildPostLastmodMap(contentDir);
  const posts = [...map.entries()];
  const newest = (dates) => (dates.length ? new Date(Math.max(...dates.map((d) => d.valueOf()))) : null);
  const all = newest(posts.map(([, d]) => d));
  if (all) for (const p of ['/', '/blog/', '/blog/tags/']) map.set(p, all);
  const tags = postTags(contentDir);
  const byTag = new Map();
  for (const [path, d] of posts) for (const t of tags.get(path) ?? []) byTag.set(t, [...(byTag.get(t) ?? []), d]);
  for (const [t, ds] of byTag) map.set(`/blog/tags/${encodeURIComponent(t)}/`, newest(ds));
  for (const [path, files] of Object.entries(STATIC_PAGE_SOURCES)) {
    const d = git(files);
    if (d) map.set(path, d);
  }
  return map;
}
