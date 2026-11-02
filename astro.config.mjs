import { defineConfig } from 'astro/config';
import { remarkEizo } from './src/lib/remark-eizo.mjs';

// 公開URLが決まったら site と base をここだけ書き換える（独自ドメインなら base は '/'）
const site = process.env.SITE_URL || 'https://lesson.liquid-block.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [[remarkEizo, { base }]],
  },
});
