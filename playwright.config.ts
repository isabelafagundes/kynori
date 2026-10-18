import { defineConfig, devices } from "@playwright/test";

/* Testes de ponta a ponta rodam contra o app web (o mesmo bundle que o
   Capacitor empacota na WebView). Cobrem a interface e a persistência em
   localStorage; plugins nativos — haptics, notificações, share, filesystem —
   ficam fora e continuam sendo verificados no aparelho. */

const PORTA = 5173;
const URL_BASE = `http://localhost:${PORTA}`;

export default defineConfig({
  testDir: "./e2e",
  // Sessão de treino tem timer e debounce de gravação: uma folga evita flaky.
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  // Um `.only` esquecido no CI esconde o resto da suíte.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // O dev server é um só; muitos workers em cima dele viram timeout, não sinal.
  workers: process.env.CI ? 1 : 3,
  globalSetup: "./e2e/apoio/aquecer.ts",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: URL_BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },

  projects: [
    {
      // Alvo principal: o app nasceu mobile-first e é isso que vai pra loja.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: /.*\.desktop\.spec\.ts/,
    },
    {
      // Só as specs que exercitam o layout largo (sidebar, duas colunas).
      // Atenção: na web, acima de 1024px com ponteiro fino, o app passou a
      // rodar dentro da moldura de celular (ver interface/rota/Raiz.tsx), e o
      // layout largo deixou de ser alcançável pelo navegador. Uma spec daqui
      // precisa abrir a rota com `?moldura=1` para pular a moldura.
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
      testMatch: /.*\.desktop\.spec\.ts/,
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORTA} --strictPort`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
