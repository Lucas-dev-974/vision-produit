import { defineConfig, loadEnv } from 'vite';
import solid from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
  let apiRuntimePattern: RegExp | undefined;
  try {
    const origin = new URL(apiBase).origin;
    const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    apiRuntimePattern = new RegExp(`^${escaped}/v1/.*`);
  } catch {
    apiRuntimePattern = undefined;
  }

  return {
    plugins: [
      solid(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'MonAppli — Producteurs & commerçants 974',
          short_name: 'MonAppli',
          description:
            'Mise en relation producteurs et commerçants à La Réunion — catalogue, précommandes, messagerie.',
          lang: 'fr',
          dir: 'ltr',
          theme_color: '#2d3d2a',
          background_color: '#f4f1ea',
          display: 'standalone',
          display_override: ['standalone', 'browser'],
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['business', 'food'],
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: apiRuntimePattern
            ? [
                {
                  urlPattern: apiRuntimePattern,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'api',
                    networkTimeoutSeconds: 10,
                    expiration: { maxEntries: 64, maxAgeSeconds: 300 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ]
            : [],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      port: 5173,
    },
  };
});
