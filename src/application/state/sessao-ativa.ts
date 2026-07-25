/* ═══════════════════════════════════════════
   Persistência da sessão de treino em execução
   ───────────────────────────────────────────
   Mantém o treino em andamento recuperável caso
   o app vá para segundo plano, seja recarregado
   ou encerrado pelo sistema.
   ═══════════════════════════════════════════ */

import type { RegistroCardio, RegistroSerie } from "@/domain/tipos";
import { STORAGE_KEYS } from "@/constants";
import { appModule } from "@/interface/configuration/module/app.module";

/** Versão do esquema salvo. Snapshots de versões anteriores (formato de
    "modos" musculação/cardio, sem campo `versao`) são descartados — a sessão
    ativa é transitória e não justifica migração. */
export const VERSAO_SESSAO_SALVA = 4;

export interface ConfiguracaoExercicioSessao {
  series: number;
  repeticoes: number;
  usaCarga: boolean;
  descansoSegundos: number;
}

/** Item da sessão em formato serializável (Set → array). Espelha a posição
    de `ficha.itens` — a identidade do item é o índice. */
export type SessaoItemSalvo =
  | {
      sessaoItemId?: string;
      tipo: "exercicio";
      exercicioId: string;
      /** Ausente em item adicionado e em snapshots legados v2. */
      exercicioPlanejadoId?: string;
      origem?: "planejado" | "adicionado";
      configuracao?: ConfiguracaoExercicioSessao;
      series: RegistroSerie[];
      nota: string;
      concluidas: number[];
      visitado: boolean;
    }
  | {
      sessaoItemId?: string;
      tipo: "cardio";
      registro: RegistroCardio;
      concluido: boolean;
      visitado: boolean;
    };

/** Snapshot completo do treino em execução. */
export interface SessaoTreinoSalva {
  versao: 2 | 3 | typeof VERSAO_SESSAO_SALVA;
  fichaId: string;
  iniciadoEm: string;
  indiceAtual: number;
  itens: SessaoItemSalvo[];
  atualizadoEm: string;
}

export async function carregarSessaoAtiva(): Promise<SessaoTreinoSalva | null> {
  try {
    const salvo = await appModule.armazenamento.obter(STORAGE_KEYS.SESSAO_ATIVA);
    if (!salvo) return null;
    const dados = JSON.parse(salvo) as { versao?: number; itens?: unknown };
    if (
      (dados.versao !== 2 && dados.versao !== 3 && dados.versao !== VERSAO_SESSAO_SALVA) ||
      !Array.isArray(dados.itens)
    ) {
      await limparSessaoAtiva();
      return null;
    }
    return dados as SessaoTreinoSalva;
  } catch (erro) {
    console.error("Erro ao carregar sessão ativa:", erro);
    return null;
  }
}

export async function salvarSessaoAtiva(sessao: SessaoTreinoSalva): Promise<void> {
  try {
    await appModule.armazenamento.definir(
      STORAGE_KEYS.SESSAO_ATIVA,
      JSON.stringify(sessao)
    );
  } catch (erro) {
    console.error("Erro ao salvar sessão ativa:", erro);
  }
}

export async function limparSessaoAtiva(): Promise<void> {
  try {
    await appModule.armazenamento.remover(STORAGE_KEYS.SESSAO_ATIVA);
  } catch (erro) {
    console.error("Erro ao limpar sessão ativa:", erro);
  }
}
