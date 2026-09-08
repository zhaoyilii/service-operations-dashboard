import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } }
  ],
  webServer: [
    { command: 'pnpm --filter @service-ops/api dev', url: 'http://127.0.0.1:3001/health', reuseExistingServer: !process.env.CI },
    // 启动API 等待 /health 可以访问；
    { command: 'pnpm --filter @service-ops/web dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }
    // 启动前端 等待5173端口可以访问；
    //启动浏览器测试 
  ]
});
