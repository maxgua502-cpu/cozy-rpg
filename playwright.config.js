import { defineConfig, devices } from '@playwright/test';

// Smoke-тесты сцен: запуск, скриншот, консоль без ошибок (см. CLAUDE.md).
// Playwright сам поднимает dev-сервер Vite перед прогоном.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.js',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] }, // портрет 393×851 — мобайл-первый
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
