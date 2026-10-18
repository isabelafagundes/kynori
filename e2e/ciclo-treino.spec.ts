import { test, expect, visivel, lerArmazenado, STORAGE_KEYS } from "./apoio/teste";
import type { DadosSemeados } from "./apoio/dados";

/* O ciclo que justifica o app existir: sair da home, registrar as séries,
   finalizar e encontrar o treino no histórico — com os números certos. */

test("registra um treino inteiro e encontra no histórico", async ({ page }) => {
  await page.goto("/#/treinos");

  await visivel(page.getByRole("button", { name: "Iniciar Treino A" })).click();
  await expect(page.getByRole("heading", { name: "Supino Reto" })).toBeVisible();

  // Supino: 3 séries. Vírgula decimal é o padrão do app (numero.ts).
  await preencherSeries(page, [
    { carga: "40", reps: "10" },
    { carga: "40", reps: "10" },
    { carga: "42,5", reps: "8" },
  ]);

  await page.getByRole("button", { name: "Próximo exercício: Remada Baixa" }).first().click();
  await expect(page.getByRole("heading", { name: "Remada Baixa" })).toBeVisible();

  await preencherSeries(page, [
    { carga: "30", reps: "12" },
    { carga: "30", reps: "12" },
    { carga: "30", reps: "10" },
  ]);

  // Tudo concluído: o item do menu vira "Finalizar" (sem "antes").
  await page.getByRole("button", { name: "Ações do treino" }).click();
  await page.getByRole("menuitem", { name: "Finalizar", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Treino finalizado!" })).toBeVisible();
  await visivel(page.getByRole("button", { name: "Concluir" })).click();

  // O histórico é a prova de que o treino virou registro persistido.
  await visivel(page.getByRole("tab", { name: "Histórico" })).click();
  await expect(visivel(page.getByText("Treino A").first())).toBeVisible();

  const dados = await lerArmazenado<DadosSemeados>(page, STORAGE_KEYS.DADOS_TREINO);
  expect(dados?.historico).toHaveLength(1);
  const registro = dados!.historico[0];
  expect(registro.fichaId).toBe("ficha-a");
  expect(registro.exercicios).toHaveLength(2);
  expect(registro.exercicios[0].series).toEqual([
    { serie: 1, repeticoes: 10, carga: 40 },
    { serie: 2, repeticoes: 10, carga: 40 },
    // A vírgula digitada precisa chegar ao registro como número.
    { serie: 3, repeticoes: 8, carga: 42.5 },
  ]);
});

test("abandonar o treino não deixa registro no histórico", async ({ page }) => {
  await page.goto("/#/execucao/ficha-a");
  await expect(page.getByRole("heading", { name: "Supino Reto" })).toBeVisible();

  await preencherSeries(page, [{ carga: "40", reps: "10" }]);

  await page.getByRole("button", { name: "Ações do treino" }).click();
  await page.getByRole("menuitem", { name: "Abandonar treino" }).click();
  await visivel(page.getByRole("button", { name: /Abandonar|Descartar/ })).click();

  await expect(visivel(page.getByRole("heading", { name: "Meus Treinos" }))).toBeVisible();

  const dados = await lerArmazenado<DadosSemeados>(page, STORAGE_KEYS.DADOS_TREINO);
  expect(dados?.historico ?? []).toHaveLength(0);
  // O snapshot da sessão também tem que sumir, senão o app oferece retomar algo
  // que a usuária jogou fora.
  expect(await lerArmazenado(page, STORAGE_KEYS.SESSAO_ATIVA)).toBeNull();
});

/** Preenche e conclui as séries do exercício aberto, na ordem. */
async function preencherSeries(
  page: import("@playwright/test").Page,
  series: Array<{ carga: string; reps: string }>
): Promise<void> {
  for (const [indice, { carga, reps }] of series.entries()) {
    await page.getByRole("textbox", { name: "Carga" }).nth(indice).fill(carga);
    await page.getByRole("textbox", { name: "Repeticoes" }).nth(indice).fill(reps);
    // Concluir sempre a primeira pendente: as concluídas viram "Desmarcar série".
    await page.getByRole("button", { name: "Concluir série" }).first().click();
  }
}
