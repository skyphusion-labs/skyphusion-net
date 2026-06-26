import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { AUTHOR_EMAIL, AUTHOR_NAME } from '../lib/seo';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return rss({
    title: 'skyphusion.net',
    description: 'Engineering notes from Conrad Rockenhaus on Cloudflare, AI, and open source infrastructure.',
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData: `<atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml" />`,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/blog/${post.id}/`,
        author: `${AUTHOR_EMAIL} (${AUTHOR_NAME})`,
        categories: post.data.tags,
        customData: post.data.updatedDate
          ? `<atom:updated>${post.data.updatedDate.toUTCString()}</atom:updated>`
          : undefined,
      })),
  });
}
