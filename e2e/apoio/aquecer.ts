import { chromium, type FullConfig } from "@playwright/test";

/* O Vite compila módulo sob demanda no primeiro acesso. Sem isto, os workers
   sobem juntos contra um servidor frio, cada um espera a mesma compilação e os
   testes estouram o timeout de forma intermitente — flaky que não tem nada a
   ver com o app. Uma visita antes da suíte deixa o cache pronto. */

export default async function aquecer(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) return;

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  try {
    // Passa pelas telas mais pesadas para que elas já estejam transformadas.
    for (const rota of ["/#/treinos", "/#/historico", "/#/estatisticas", "/#/gerenciar"]) {
      await pagina.goto(`${baseURL}${rota}`, { waitUntil: "networkidle" });
    }
  } finally {
    await navegador.close();
  }
}
