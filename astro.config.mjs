// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge',
      },
    },
    optimizeDeps: {
      exclude: [
        'lucide-react',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'zustand',
      ],
    },
    server: {
      watch: {
        ignored: [
          '**/.astro/**',
          '**/node_modules/**',
          '**/.wrangler/**',
          '**/dist/**',
        ],
      },
    },
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: { path: '.wrangler/state/v3' },
    },
  }),
});