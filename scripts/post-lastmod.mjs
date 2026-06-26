import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Build a pathname → lastmod map from blog markdown frontmatter.
 * Used by astro.config.mjs for sitemap lastmod (content collection isn't available at config time).
 */
export function buildPostLastmodMap(contentDir = './src/content/blog') {
  /** @type {Map<string, Date>} */
  const map = new Map();

  for (const file of readdirSync(contentDir)) {
    if (!file.endsWith('.md')) continue;

    const content = readFileSync(join(contentDir, file), 'utf8');
    const slug = file.replace(/\.md$/, '');
    const pubMatch = content.match(/^pubDate:\s*(\S+)/m);
    const updMatch = content.match(/^updatedDate:\s*(\S+)/m);
    const draftMatch = content.match(/^draft:\s*true/m);

    if (draftMatch) continue;

    const pubDate = pubMatch ? new Date(pubMatch[1]) : new Date();
    const lastmod = updMatch ? new Date(updMatch[1]) : pubDate;
    map.set(`/blog/${slug}/`, lastmod);
  }

  return map;
}
