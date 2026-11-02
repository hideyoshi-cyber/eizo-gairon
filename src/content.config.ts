import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const loose = z.object({ title: z.string().optional(), visibility: z.enum(['public', 'internal']).default('public') }).passthrough();

export const collections = {
  lessons: defineCollection({
    loader: glob({ pattern: '*/blog.md', base: './lessons', generateId: ({ entry }) => entry.split('/')[0] }),
    schema: loose,
  }),
  gaiden: defineCollection({ loader: glob({ pattern: '*.md', base: './gaiden' }), schema: loose }),
  essays: defineCollection({ loader: glob({ pattern: '*.md', base: './essays' }), schema: loose }),
  pages: defineCollection({ loader: glob({ pattern: '*.md', base: './pages' }), schema: loose }),
};
