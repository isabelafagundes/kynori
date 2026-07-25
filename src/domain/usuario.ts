/* ═══════════════════════════════════════════
   Modelo de Usuário — Pezzo
   ═══════════════════════════════════════════ */

export interface Usuario {
  nome: string;
  avatarEmoji: string;
  criadoEm: string;
  /** Meta de treinos por semana. Opcional: perfis criados antes da meta
      existir (e quem pula a etapa no onboarding) seguem sem ela. */
  metaSemanal?: number;
}

/** Opções de meta semanal oferecidas no onboarding */
export const OPCOES_META_SEMANAL = [2, 3, 4, 5, 6] as const;

/** Emoji padrão de avatar ao criar o perfil */
export const AVATAR_EMOJI_PADRAO = "🙂";

/** Emojis disponíveis para o avatar do usuário */
export const emojisAvatar = [
  "🙂", "😎", "🤩", "🥳", "😺", "🦊",
  "🐯", "🐼", "🐵", "🐶", "🦁", "🐸",
  "💪", "🏋️", "🏃", "🚴", "🔥", "⚡",
  "⭐", "🏆", "🎯", "🌱", "🚀", "💎",
];
