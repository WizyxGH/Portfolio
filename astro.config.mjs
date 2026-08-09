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
    // Polices utilisées uniquement par /candidature-briveo (page isolée qui
    // reprend le design system de briveo.fr). Elles ne sont injectées que sur
    // les pages qui appellent <Font cssVariable="..." /> : zéro impact ailleurs.
    {
      provider: fontProviders.google(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-jakarta-family',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-family',
      weights: [400, 500, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    // Manuscrite de la lettre de motivation. Caveat est la plus lisible des
    // cursives de Google Fonts : lettres non liées, contreformes ouvertes,
    // chiffres distincts. Elle ne sert que sur /candidature-briveo.
    {
      provider: fontProviders.google(),
      name: 'Caveat',
      cssVariable: '--font-caveat-family',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  integrations: [
    partytown(),
    // La candidature Briveo est une page privée, non reliée au site : on la
    // garde hors du sitemap (elle porte aussi un <meta name="robots" noindex>).
    sitemap({ filter: (page) => !page.includes('/candidature-briveo') })
  ]
});