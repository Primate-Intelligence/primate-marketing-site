// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// PRI-492: real <lastmod> dates in the sitemap. The map is generated from git
// history by scripts/gen-lastmod.mjs (runs in `npm run build`) and committed,
// because Vercel build containers have no .git directory.
let lastmod = {};
try {
  lastmod = JSON.parse(new TextDecoder().decode(readFileSync(new URL('./src/generated/sitemap-lastmod.json', import.meta.url))));
} catch {
  // Map missing — sitemap simply omits <lastmod> (spec-valid).
}

// https://astro.build/config
export default defineConfig({
  site: 'https://primateintelligence.ai',
  integrations: [
    sitemap({
      // /docs/quickstart exists only for legacy deep links and canonicalizes
      // to /docs — a URL whose canonical points elsewhere must not be in the
      // sitemap (GSC: "Alternate page with proper canonical tag").
      filter: (page) => !new URL(page).pathname.startsWith('/docs/quickstart'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const date = lastmod[path];
        if (date) item.lastmod = date;
        return item;
      },
    }),
  ],
});
