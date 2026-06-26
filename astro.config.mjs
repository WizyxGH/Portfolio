// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://wizyx.me',
  vite: {
    plugins: [tailwindcss()]
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },

  integrations: [partytown(), sitemap()]
});