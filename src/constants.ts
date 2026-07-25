/* ═══════════════════════════════════════════
   Constantes Globais — Pezzo
   ═══════════════════════════════════════════ */

/** Nome da aplicação */
export const APP_NAME = "Kynori";

/** Versão da aplicação */
export const APP_VERSION = "1.0.0";

/** Versao do formato de snapshot exportado/importado.
    v2: ficha passou a ser lista unica ordenada de itens (exercicio | cardio). */
export const VERSAO_SCHEMA = 2;

/** Timeout padrão para requisições (ms) */
export const DEFAULT_TIMEOUT = 30000;

/** Chaves de armazenamento local */
export const STORAGE_KEYS = {
  TEMA: "trainify_tema",
  FONTE_GRANDE: "trainify_fonte_grande",
  USUARIO: "trainify_usuario",
  TOKEN: "trainify_token",
  // Dados de treino
  DADOS_TREINO: "trainify_dados_treino",
  // Treino em execução (recuperável após segundo plano / fechamento)
  SESSAO_ATIVA: "trainify_sessao_ativa",
  // Progresso do tutorial guiado (fase prática do onboarding)
  TUTORIAL: "trainify_tutorial",
  // Identificador estavel desta instalacao
  INSTALACAO_ID: "trainify_instalacao_id",
  // Barra lateral do desktop recolhida (só ícones)
  SIDEBAR_RECOLHIDA: "trainify_sidebar_recolhida",
} as const;
