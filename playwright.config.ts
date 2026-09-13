import { defineConfig, devices } from "@playwright/test";

/* - Configuração central do Playwright. Sobe o Vite dev server com os mocks do MSW habilitados (VITE_ENABLE_MOCKS=true é o padrão do próprio app, mas fixamos aqui para deixar explícito), roda os três recortes de viewport exigidos pelo enunciado (desktop, tablet e mobile) e grava trace + vídeo apenas na primeira retentativa de um teste que falhou, para não pesar o disco em execuções verdes. - */

const isRunningOnCi = Boolean(process.env.CI);
const developmentServerPort = 5173;
const developmentServerBaseUrl = `http://127.0.0.1:${developmentServerPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isRunningOnCi,
  retries: isRunningOnCi ? 1 : 0,
  workers: isRunningOnCi ? 2 : undefined,
  timeout: 30000,
  expect: {
    timeout: 8000,
  },

  reporter: [["html", { open: "never", outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: developmentServerBaseUrl,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 8000,
  },

  /* - Cada projeto isola seu próprio storageState (nenhum é compartilhado entre arquivos de teste) porque cada spec começa resetando o cenário do zero via endpoint de dev; manter storageState fora daqui evita que sessão de um teste vaze para outro por engano. - */

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: "chromium-tablet",
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },

    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 393, height: 851 },
      },
    },
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: developmentServerBaseUrl,
    reuseExistingServer: !isRunningOnCi,
    timeout: 60000,
    env: {
      VITE_ENABLE_MOCKS: "true",
    },
  },
});
