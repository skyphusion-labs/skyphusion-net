import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import { buildPostLastmodMap } from './scripts/post-lastmod.mjs';

const postLastmod = buildPostLastmodMap();

export default defineConfig({
  site: 'https://skyphusion.net',
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = postLastmod.get(pathname);

        if (lastmod) {
          return { ...item, lastmod: lastmod.toISOString() };
        }

        return item;
      },
    }),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },

  adapter: cloudflare(),
});
