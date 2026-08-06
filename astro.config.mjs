// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

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

  // Polices auto-hébergées : supprime la CSS bloquante de fonts.googleapis.com
  // du chemin critique et génère des métriques de fallback (moins de CLS).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter-family',
      weights: [400, 500, 700, 900],
      styles: ['normal'],
      // 'latin' couvre tout le français (accents + œ) ; 'latin-ext' pèse 85 Ko pour rien.
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Sora',
      cssVariable: '--font-sora-family',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      // 'latin' couvre tout le français (accents + œ) ; 'latin-ext' pèse 85 Ko pour rien.
      subsets: ['latin'],
    },
  ],

  integrations: [partytown(), sitemap()]
});