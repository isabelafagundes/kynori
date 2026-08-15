import type { Ficha } from "@/domain/tipos";

/* ═══════════════════════════════════════════
   Treino livre — sessão sem ficha de origem
   ───────────────────────────────────────────
   Um treino livre é uma sessão "órfã": não nasce de nenhuma ficha dos
   mestres e nunca vira uma. Para reusar todo o motor de execução (que é
   escrito em cima de uma `Ficha`), ele roda sobre uma ficha SINTÉTICA e
   vazia, identificada por um id sentinela. O registro gerado no histórico
   carrega esse mesmo id — as telas de histórico o reconhecem e rotulam
   como "Treino livre" em vez de tratá-lo como ficha removida.
   ═══════════════════════════════════════════ */

/** Id sentinela do treino livre. Não colide com ids reais (uuid). */
export const FICHA_LIVRE_ID = "__livre__";

export const NOME_TREINO_LIVRE = "Treino livre";

/** Um registro/sessão é de treino livre quando aponta para a ficha sentinela. */
export function ehTreinoLivre(fichaId: string): boolean {
  return fichaId === FICHA_LIVRE_ID;
}

/** Ficha sintética e vazia usada para iniciar e para rotular um treino livre.
    Nunca é salva nos mestres. */
export function criarFichaLivre(): Ficha {
  return {
    id: FICHA_LIVRE_ID,
    nome: NOME_TREINO_LIVRE,
    descricao: "",
    icone: "raio",
    emoji: "⚡",
    itens: [],
  };
}
