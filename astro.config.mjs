// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Custom domain (GitHub Pages + CNAME), so no `base` path.
  site: 'https://vnick.io',
  integrations: [sitemap()],
});
