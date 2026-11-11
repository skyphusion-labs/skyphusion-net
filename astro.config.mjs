import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import { buildSiteLastmodMap } from './scripts/site-lastmod.mjs';

// lastmod for every page, not only posts (skyphusion-net#153).
const siteLastmod = buildSiteLastmodMap();

export default defineConfig({
  site: 'https://skyphusion.net',
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = siteLastmod.get(pathname);

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
