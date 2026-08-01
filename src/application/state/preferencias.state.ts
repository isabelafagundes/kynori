/* ═══════════════════════════════════════════
   Preferências de Execução — Pezzo
   Toggles de comportamento da tela de execução de treino.
   ═══════════════════════════════════════════ */

import { STORAGE_KEYS } from "@/constants";
import { appModule } from "@/interface/configuration/module/app.module";

export interface PreferenciasExecucao {
  /** Exibe a tela de celebração (💪 + confetti) ao finalizar o treino. */
  animacaoFinalizar: boolean;
  /** Vibração / feedback tátil a cada série concluída e ações. */
  vibracao: boolean;
  /** Inicia o timer de descanso automaticamente ao concluir uma série. */
  descansoAutomatico: boolean;
  /** Mostra o aviso "Série X concluída · desfazer" ao concluir uma série. */
  avisoDesfazer: boolean;
  /** Avança para o próximo exercício ao concluir todas as séries do atual. */
  avancoAutomatico: boolean;
}

export type ChavePreferenciaExecucao = keyof PreferenciasExecucao;

export const PREFERENCIAS_EXECUCAO_PADRAO: PreferenciasExecucao = {
  animacaoFinalizar: true,
  vibracao: true,
  descansoAutomatico: true,
  avisoDesfazer: true,
  avancoAutomatico: false,
};

/** Gerenciador das preferências de execução (singleton, persistido). */
export class PreferenciasManager {
  private static instancia: PreferenciasManager;
  private preferencias: PreferenciasExecucao;
  private listeners: Set<() => void>;
  private inicializado: boolean;

  private constructor() {
    this.preferencias = PREFERENCIAS_EXECUCAO_PADRAO;
    this.listeners = new Set();
    this.inicializado = false;
  }

  static obterInstancia(): PreferenciasManager {
    if (!PreferenciasManager.instancia) {
      PreferenciasManager.instancia = new PreferenciasManager();
    }
    return PreferenciasManager.instancia;
  }

  inscrever(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async inicializar(): Promise<void> {
    if (this.inicializado) return;
    this.preferencias = await this.carregar();
    this.inicializado = true;
  }

  /** Snapshot imutável — a referência só muda quando algum valor muda. */
  obter(): PreferenciasExecucao {
    return this.preferencias;
  }

  definir(chave: ChavePreferenciaExecucao, valor: boolean): void {
    if (this.preferencias[chave] === valor) return;
    this.preferencias = { ...this.preferencias, [chave]: valor };
    void this.salvar();
    this.notificar();
  }

  alternar(chave: ChavePreferenciaExecucao): void {
    this.definir(chave, !this.preferencias[chave]);
  }

  private notificar(): void {
    this.listeners.forEach((listener) => listener());
  }

  private async carregar(): Promise<PreferenciasExecucao> {
    try {
      const salvo = await appModule.armazenamento.obter(
        STORAGE_KEYS.PREFERENCIAS_EXECUCAO
      );
      if (!salvo) return PREFERENCIAS_EXECUCAO_PADRAO;
      const dados = JSON.parse(salvo) as Partial<PreferenciasExecucao>;
      // Lê chave a chave para tolerar versões antigas / campos ausentes.
      return {
        animacaoFinalizar: ler(dados.animacaoFinalizar, "animacaoFinalizar"),
        vibracao: ler(dados.vibracao, "vibracao"),
        descansoAutomatico: ler(dados.descansoAutomatico, "descansoAutomatico"),
        avisoDesfazer: ler(dados.avisoDesfazer, "avisoDesfazer"),
        avancoAutomatico: ler(dados.avancoAutomatico, "avancoAutomatico"),
      };
    } catch {
      return PREFERENCIAS_EXECUCAO_PADRAO;
    }
  }

  private async salvar(): Promise<void> {
    try {
      await appModule.armazenamento.definir(
        STORAGE_KEYS.PREFERENCIAS_EXECUCAO,
        JSON.stringify(this.preferencias)
      );
    } catch {
      // Falha no armazenamento não deve quebrar o app.
    }
  }
}

function ler(valor: unknown, chave: ChavePreferenciaExecucao): boolean {
  return typeof valor === "boolean" ? valor : PREFERENCIAS_EXECUCAO_PADRAO[chave];
}

export const preferenciasManager = PreferenciasManager.obterInstancia();
