import { test as base, type Locator, type Page } from "@playwright/test";
import { STORAGE_KEYS } from "../../src/constants";
import { dados, usuario, type DadosSemeados } from "./dados";
import type { Usuario } from "../../src/domain/usuario";

/* Semeadura de estado.

   Na web o app guarda tudo em localStorage (ArmazenamentoWeb), com as chaves
   de src/constants.ts. Escrever nelas ANTES do primeiro script rodar
   (addInitScript) deixa o app subir já no cenário desejado — sem isso, todo
   teste teria que refazer onboarding e cadastro a cada execução. */

export interface EstadoInicial {
  /** null = usuário inexistente, ou seja, onboarding aparece. */
  usuario?: Usuario | null;
  dados?: Partial<DadosSemeados>;
  /** false deixa o tutorial guiado rodar; o padrão é já concluído. */
  tutorialConcluido?: boolean;
  /** Snapshot de sessão de treino em andamento (trainify_sessao_ativa). */
  sessaoAtiva?: unknown;
}

export async function semear(page: Page, estado: EstadoInicial = {}): Promise<void> {
  const perfil = estado.usuario === undefined ? usuario() : estado.usuario;
  const conteudo = {
    [STORAGE_KEYS.USUARIO]: perfil ? JSON.stringify(perfil) : null,
    [STORAGE_KEYS.DADOS_TREINO]: JSON.stringify(dados(estado.dados)),
    [STORAGE_KEYS.TUTORIAL]: JSON.stringify({
      passo: 0,
      concluido: estado.tutorialConcluido ?? true,
    }),
    [STORAGE_KEYS.SESSAO_ATIVA]: estado.sessaoAtiva
      ? JSON.stringify(estado.sessaoAtiva)
      : null,
  };

  // O init script roda a cada navegação e a cada reload. Semear mais de uma vez
  // desfaria o que o próprio teste acabou de fazer (um reload voltaria o app ao
  // estado inicial), então a marca no sessionStorage limita ao primeiro load.
  await page.addInitScript((registros: Record<string, string | null>) => {
    const MARCA = "__e2e_semeado__";
    if (sessionStorage.getItem(MARCA)) return;
    sessionStorage.setItem(MARCA, "1");
    for (const [chave, valor] of Object.entries(registros)) {
      if (valor === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, valor);
    }
  }, conteudo);
}

/** O app renderiza mobile e desktop no mesmo DOM e esconde um por CSS, então
    quase todo papel aparece duplicado. Isto resolve para o que está na tela. */
export function visivel(locator: Locator): Locator {
  return locator.locator("visible=true");
}

/** Lê uma chave do armazenamento do app — para conferir o que foi persistido. */
export async function lerArmazenado<T>(page: Page, chave: string): Promise<T | null> {
  const bruto = await page.evaluate((k) => localStorage.getItem(k), chave);
  return bruto ? (JSON.parse(bruto) as T) : null;
}

export const test = base.extend<{ semearEstado: EstadoInicial }>({
  // Cada spec declara seu cenário com test.use({ semearEstado: {...} }).
  semearEstado: [{}, { option: true }],

  page: async ({ page, semearEstado }, use) => {
    const erros: string[] = [];
    page.on("pageerror", (erro) => erros.push(erro.message));

    await semear(page, semearEstado);
    await use(page);

    // Erro de JS não derruba o teste por si só, mas costuma ser a causa real de
    // uma tela "vazia" — falhar aqui aponta a origem em vez do sintoma.
    if (erros.length > 0) {
      throw new Error(`Erros de JavaScript na página:\n- ${erros.join("\n- ")}`);
    }
  },
});

export { expect } from "@playwright/test";
export { STORAGE_KEYS };
