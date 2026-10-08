import { defineConfig } from '@playwright/test';

/**
 * Test de fumée sur viewport mobile portrait. Le serveur de prévisualisation
 * Vite sert le build de production. `PW_CHROMIUM_PATH` permet d'utiliser un
 * Chromium déjà installé plutôt que celui téléchargé par Playwright.
 */
const PORT = 4173;
const chromiumPath = process.env['PW_CHROMIUM_PATH'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    launchOptions: {
      ...(chromiumPath ? { executablePath: chromiumPath } : {}),
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium' } }],
});
