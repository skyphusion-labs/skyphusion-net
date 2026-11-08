import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Build a pathname → lastmod map from blog markdown frontmatter.
 * Used by astro.config.mjs for sitemap lastmod (content collection isn't available at config time).
 */
export function buildPostLastmodMap(contentDir = './src/content/blog') {
  /** @type {Map<string, Date>} */
  const map = new Map();

  // The collection glob is **/*.md, so walk subdirectories too; the entry id is the
  // path under the content dir without the extension.
  const files = readdirSync(contentDir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(join(contentDir, file), 'utf8');
    const slug = relative('.', file).split(sep).join('/').replace(/\.md$/, '');
    // Match inside the frontmatter block only, never the post body.
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const pubMatch = fm.match(/^pubDate:\s*(\S+)/m);
    const updMatch = fm.match(/^updatedDate:\s*(\S+)/m);
    const draftMatch = fm.match(/^draft:\s*true/m);

    if (draftMatch) continue;

    const pubDate = pubMatch ? new Date(pubMatch[1]) : new Date();
    const lastmod = updMatch ? new Date(updMatch[1]) : pubDate;
    map.set(`/blog/${slug}/`, lastmod);
  }

  return map;
}
