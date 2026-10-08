import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Configuration Vite.
 *
 * `FRONDE_BASE` permet de construire le jeu pour un sous-chemin, par exemple
 * `/GPT/` sur GitHub Pages. En local la base reste `/`.
 */
export default defineConfig({
  base: process.env['FRONDE_BASE'] ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    host: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FRONDE',
        short_name: 'FRONDE',
        description: 'Jeu tactique mobile où le héros est le projectile.',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1b1d22',
        theme_color: '#1b1d22',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,json,ttf,mp3}'],
        globIgnores: ['**/music/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/music\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'fronde-music', expiration: { maxEntries: 6 }, rangeRequests: true },
          },
        ],
      },
    }),
  ],
});
