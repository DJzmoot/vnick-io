// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Custom domain (GitHub Pages + CNAME), so no `base` path.
  site: 'https://vnick.io',
  integrations: [mdx(), sitemap()],
  vite: {
    build: {
      // The home-page rack chunk bundles three.js (~556 kB min, ~140 kB over
      // the wire) and is loaded only there; the default 500 kB warning is not
      // actionable for it.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        onwarn(warning, warn) {
          // Astro's MDX integration emits a "use astro:head-inject" directive
          // that rolldown flags as maybe-not-preserved. Known upstream noise
          // with no effect on output.
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          warn(warning);
        },
      },
    },
  },
});
