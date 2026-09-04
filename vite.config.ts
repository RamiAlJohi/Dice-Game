import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * GitHub Pages serves a project site under /<repo>/, so assets need that prefix.
 * Overridable via BASE_PATH for a custom domain or a user/org page (where it is '/').
 */
const base = process.env.BASE_PATH ?? '/Dice-Game/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Dice Roguelite',
        short_name: 'Dice',
        description: 'A dice-based roguelite — roll, combo, and fight through ten stages.',
        // Must match `base` so the installed app opens at the right path.
        start_url: base,
        scope: base,
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#0b0d14',
        theme_color: '#0b0d14',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The whole game is static and offline-capable; precache all of it.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  server: { host: '127.0.0.1', port: 5173 },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
