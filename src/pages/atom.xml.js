// Atom 1.0 feed beside /rss.xml (skyphusion-net#153). Same posts, same order; each entry carries
// its updatedDate when the post has one, so feed readers see edits. Escaped by hand: the content is
// titles and descriptions only, never post HTML.
import { getCollection } from 'astro:content';
import { AUTHOR_NAME } from '../lib/seo';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(context) {
  const site = String(context.site).replace(/\/+$/, '');
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const updatedOf = (p) => p.data.updatedDate ?? p.data.pubDate;
  const feedUpdated = posts.length
    ? new Date(Math.max(...posts.map((p) => updatedOf(p).valueOf()))).toISOString()
    : new Date(0).toISOString();
  const entries = posts
    .map((p) => {
      const url = `${site}/blog/${p.id}/`;
      const cats = (p.data.tags ?? []).map((t) => `    <category term="${esc(t)}"/>`).join('\n');
      return [
        '  <entry>',
        `    <title>${esc(p.data.title)}</title>`,
        `    <link href="${url}"/>`,
        `    <id>${url}</id>`,
        `    <published>${p.data.pubDate.toISOString()}</published>`,
        `    <updated>${updatedOf(p).toISOString()}</updated>`,
        `    <summary>${esc(p.data.seoDescription ?? p.data.description)}</summary>`,
        cats,
        '  </entry>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>skyphusion.net</title>
  <subtitle>Engineering notes from Conrad Rockenhaus on Cloudflare, AI, and open source infrastructure.</subtitle>
  <link href="${site}/atom.xml" rel="self" type="application/atom+xml"/>
  <link href="${site}/"/>
  <id>${site}/</id>
  <updated>${feedUpdated}</updated>
  <author><name>${esc(AUTHOR_NAME)}</name></author>
${entries}
</feed>
`;
  return new Response(body, { headers: { 'content-type': 'application/atom+xml; charset=utf-8' } });
}
