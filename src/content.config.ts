import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // The <title> (and og/twitter title) when `title`, the on-page h1, runs long. 60 characters
    // at most; the post page appends ", skyphusion.net" outside this count (skyphusion-net#153).
    seoTitle: z.string().max(60).optional(),
    description: z.string(),
    // The meta and og description when `description` (the on-page dek) runs past what a search
    // snippet shows. 160 characters at most (skyphusion-net#153).
    seoDescription: z.string().max(160).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
