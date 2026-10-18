import { test, expect, visivel, lerArmazenado, STORAGE_KEYS } from "./apoio/teste";

/* Treino é uso de meia hora com o celular indo e voltando do bolso. Perder o
   que já foi registrado é o pior defeito possível deste app, e o navegador
   descarta a WebView sem avisar — por isso a sessão vive em disco. */

test("retoma o treino no mesmo ponto depois de recarregar", async ({ page }) => {
  await page.goto("/#/execucao/ficha-a");
  await expect(page.getByRole("heading", { name: "Supino Reto" })).toBeVisible();

  await page.getByRole("textbox", { name: "Carga" }).nth(0).fill("40");
  await page.getByRole("textbox", { name: "Repeticoes" }).nth(0).fill("10");
  await page.getByRole("button", { name: "Concluir série" }).first().click();

  await expect(page.getByRole("button", { name: "Desmarcar série" })).toHaveCount(1);
  // O snapshot é gravado com debounce; sem esperar por ele o reload é injusto.
  await expect
    .poll(async () => {
      const salva = await lerArmazenado<{ itens: unknown[] }>(page, STORAGE_KEYS.SESSAO_ATIVA);
      return salva?.itens?.length ?? 0;
    })
    .toBeGreaterThan(0);

  await page.reload();

  await expect(page.getByRole("heading", { name: "Supino Reto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desmarcar série" })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Carga" }).nth(0)).toHaveValue("40");
});

test("volta direto para o treino em andamento ao abrir o app na home", async ({ page }) => {
  await page.goto("/#/execucao/ficha-a");
  await page.getByRole("textbox", { name: "Carga" }).nth(0).fill("35");
  await page.getByRole("button", { name: "Concluir série" }).first().click();
  await expect
    .poll(async () => (await lerArmazenado(page, STORAGE_KEYS.SESSAO_ATIVA)) !== null)
    .toBe(true);

  // Abrir pela home é o que acontece quando o Android mata o app e ele reabre.
  await page.goto("/#/treinos");

  await expect(page.getByRole("heading", { name: "Supino Reto" })).toBeVisible();
  await expect(page).toHaveURL(/#\/execucao\/ficha-a/);
});

test("o progresso sobrevive a uma gravação no estado global", async ({ page }) => {
  // Gravar no estado global durante o treino reemite fichas e re-renderiza a
  // execução. Hoje listarFichas() devolve um array novo com os MESMOS objetos,
  // então a identidade da ficha não muda e a restauração não re-roda; se isso
  // deixar de valer, é aqui que aparece. Quem prende a regressão de verdade é
  // useSessaoTreino.test.ts ("reemissão da ficha"), que força a troca de
  // identidade — este teste é a rede no nível do app, não a reprodução.
  await page.goto("/#/execucao/ficha-a");
  await page.getByRole("textbox", { name: "Carga" }).nth(0).fill("40");
  await page.getByRole("button", { name: "Concluir série" }).first().click();

  // Primeira série já gravada: é ela que um snapshot defasado traria de volta.
  await expect
    .poll(async () => {
      const salva = await lerArmazenado<{ itens: Array<{ concluidas?: number[] }> }>(
        page,
        STORAGE_KEYS.SESSAO_ATIVA
      );
      return salva?.itens?.[0]?.concluidas?.length ?? 0;
    })
    .toBe(1);

  // Segunda série + emissão do estado global dentro da janela do debounce.
  await page.getByRole("textbox", { name: "Carga" }).nth(1).fill("40");
  await page.getByRole("button", { name: "Concluir série" }).first().click();
  // Import por variável: o caminho é resolvido pelo Vite dentro do navegador,
  // não pelo TypeScript daqui (por isso este teste só roda contra o dev server).
  await page.evaluate(async (caminho) => {
    const modulo = (await import(/* @vite-ignore */ caminho)) as {
      pezzoState: { adicionarFicha: (ficha: Record<string, unknown>) => unknown };
    };
    modulo.pezzoState.adicionarFicha({
      nome: "Ficha nova",
      descricao: "",
      icone: "halter",
      itens: [],
    });
  }, "/src/application/state/pezzo.state.ts");

  await expect(page.getByRole("button", { name: "Desmarcar série" })).toHaveCount(2);
});

test.describe("sessão semeada", () => {
  test.use({
    semearEstado: {
      sessaoAtiva: {
        versao: 4,
        fichaId: "ficha-a",
        iniciadoEm: "2026-09-06T09:00:00.000Z",
        indiceAtual: 1,
        itens: [
          {
            sessaoItemId: "item-1",
            tipo: "exercicio",
            exercicioId: "ex-01",
            exercicioPlanejadoId: "ex-01",
            origem: "planejado",
            configuracao: { series: 3, repeticoes: 10, usaCarga: true, descansoSegundos: 60 },
            series: [
              { serie: 1, repeticoes: 10, carga: 50 },
              { serie: 2, repeticoes: 10, carga: 50 },
              { serie: 3, repeticoes: 10, carga: 50 },
            ],
            nota: "",
            concluidas: [0, 1],
            visitado: true,
          },
          {
            sessaoItemId: "item-2",
            tipo: "exercicio",
            exercicioId: "ex-08",
            exercicioPlanejadoId: "ex-08",
            origem: "planejado",
            configuracao: { series: 3, repeticoes: 10, usaCarga: true, descansoSegundos: 60 },
            series: [
              { serie: 1, repeticoes: 10, carga: 30 },
              { serie: 2, repeticoes: 10, carga: 30 },
              { serie: 3, repeticoes: 10, carga: 30 },
            ],
            nota: "",
            concluidas: [],
            visitado: false,
          },
        ],
        atualizadoEm: "2026-09-06T09:20:00.000Z",
      },
    },
  });

  test("abre um treino já pela metade com as séries que faltam", async ({ page }) => {
    await page.goto("/#/treinos");

    await expect(page.getByRole("heading", { name: "Remada Baixa" })).toBeVisible();
    await expect(visivel(page.getByText("2/6 séries"))).toBeVisible();
  });
});
