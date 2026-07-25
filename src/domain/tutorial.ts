/* ═══════════════════════════════════════════
   Tutorial guiado — fase prática do onboarding

   O tutorial NÃO prescreve treino: cada passo
   só aponta onde fica uma coisa na interface.
   O conteúdo é sempre do usuário.
   ═══════════════════════════════════════════ */

/** Identificadores dos alvos marcados nas telas reais. */
export type AlvoTutorial =
  | "home-criar-programa"
  | "programa-nome"
  | "programa-nova-ficha"
  | "ficha-identidade"
  | "ficha-montar-treino"
  | "ficha-adicionar-item"
  | "picker-busca"
  | "item-series"
  | "ficha-salvar"
  | "home-iniciar-treino";

export interface PassoTutorial {
  id: string;
  alvo: AlvoTutorial;
  titulo: string;
  texto: string;
  /** Nota de segurança destacada dentro do balão. */
  aviso?: string;
  rotuloAcao: string;
  /** Passos numerados formam a barra de progresso; os de fechamento não. */
  numerado: boolean;
  /**
   * Avança sozinho assim que o alvo do passo seguinte aparecer na tela.
   *
   * Só vale quando concluir o passo leva a outra tela: aí o alvo seguinte
   * surgir é prova de que a pessoa agiu por conta própria, em vez de usar o
   * botão do balão. Fica `false` quando os dois alvos convivem na mesma tela
   * — senão o passo se autoavançaria no instante em que aparecesse.
   *
   * Não dá para simplesmente detectar que o alvo atual sumiu: os editores
   * entram como drawer sobre a tela anterior, que continua montada.
   */
  avancaComProximoAlvo: boolean;
}

/**
 * Oito passos numerados + dois de fechamento.
 *
 * Duas correções em relação ao rascunho do canvas:
 * - saiu o passo "salvar o programa": esse degrau foi removido do
 *   EditorProgramaPage, que agora persiste em silêncio;
 * - entrou "montar-treino": o EditorFichaPage real monta os itens numa tela
 *   dedicada, empilhada por cima. O canvas desenhava os exercícios direto no
 *   formulário da ficha, então faltava um passo para atravessar essa tela.
 */
export const PASSOS_TUTORIAL: PassoTutorial[] = [
  {
    id: "criar-programa",
    alvo: "home-criar-programa",
    titulo: "Tudo começa por um programa",
    texto:
      "É a pasta que guarda as fichas da sua rotina. Toque aqui pra criar o primeiro.",
    rotuloAcao: "Toquei",
    numerado: true,
    avancaComProximoAlvo: true,
  },
  {
    id: "nomear-programa",
    alvo: "programa-nome",
    titulo: "Dê um nome que faça sentido pra você",
    texto:
      "“Rotina de janeiro”, “Volta aos treinos”, “Academia do bairro”. Não existe nome errado, e dá pra renomear depois.",
    rotuloAcao: "Próximo",
    numerado: true,
    avancaComProximoAlvo: false,
  },
  {
    id: "nova-ficha",
    alvo: "programa-nova-ficha",
    titulo: "Agora a primeira ficha",
    texto:
      "Uma ficha é o treino de um dia. Se você treina 3x por semana, no fim vai ter 3 fichas aqui.",
    rotuloAcao: "Criar ficha",
    numerado: true,
    avancaComProximoAlvo: true,
  },
  {
    id: "nomear-ficha",
    alvo: "ficha-identidade",
    titulo: "Nome e um emoji pra reconhecer de longe",
    texto:
      "“Treino A”, “Segunda”, “Perna”, do jeito que você já chama. O emoji aparece na home e no histórico.",
    rotuloAcao: "Próximo",
    numerado: true,
    avancaComProximoAlvo: false,
  },
  {
    id: "montar-treino",
    alvo: "ficha-montar-treino",
    titulo: "Hora de colocar os exercícios",
    texto:
      "Os itens do treino são montados numa tela só deles, pra você organizar a sequência com calma.",
    rotuloAcao: "Montar",
    numerado: true,
    avancaComProximoAlvo: true,
  },
  {
    id: "adicionar-itens",
    alvo: "ficha-adicionar-item",
    titulo: "Exercício de força ou cardio",
    texto:
      "Os dois entram na mesma lista. A ordem que você montar aqui é a ordem em que o treino roda.",
    rotuloAcao: "Adicionar",
    numerado: true,
    avancaComProximoAlvo: true,
  },
  {
    id: "biblioteca",
    alvo: "picker-busca",
    titulo: "Busque ou filtre por grupo muscular",
    texto:
      "Esta é a biblioteca do app: uma lista pra você escolher, não um treino pronto. Se faltar algum, dá pra criar o seu.",
    rotuloAcao: "Escolhi",
    numerado: true,
    avancaComProximoAlvo: true,
  },
  {
    id: "series",
    alvo: "item-series",
    titulo: "Séries, repetições e descanso",
    texto:
      "São os números do SEU treino: os que seu professor passou ou os que você já usa. O app só guarda e lembra na próxima vez.",
    aviso:
      "Não sabe que carga usar? Comece leve e suba aos poucos. Na dúvida, fale com um profissional antes.",
    rotuloAcao: "Concluir",
    numerado: true,
    avancaComProximoAlvo: false,
  },
  {
    id: "salvar-ficha",
    alvo: "ficha-salvar",
    titulo: "Pronto, essa ficha é sua",
    texto:
      "Você montou do zero, com os seus exercícios. Salve e ela já aparece na home.",
    rotuloAcao: "Salvar ficha",
    numerado: false,
    avancaComProximoAlvo: true,
  },
  {
    id: "primeiro-treino",
    alvo: "home-iniciar-treino",
    titulo: "É isso. O resto é treinar. 🎉",
    texto:
      "Toque em Iniciar quando estiver na academia. O Kynori registra série por série e lembra a carga da última vez.",
    rotuloAcao: "Fechar tutorial",
    numerado: false,
    avancaComProximoAlvo: false,
  },
];

export const TOTAL_PASSOS_NUMERADOS = PASSOS_TUTORIAL.filter(
  (passo) => passo.numerado,
).length;

/** Posição do passo na barra de progresso (base 1); 0 quando não numerado. */
export function numeroDoPasso(indice: number): number {
  const passo = PASSOS_TUTORIAL[indice];
  if (!passo?.numerado) return 0;
  return PASSOS_TUTORIAL.slice(0, indice + 1).filter((p) => p.numerado).length;
}

/** Estado persistido do tutorial. */
export interface EstadoTutorial {
  /** Índice do passo atual em PASSOS_TUTORIAL. */
  passo: number;
  /** Encerrado por conclusão ou por "sair" — não reabre sozinho. */
  concluido: boolean;
}

export const ESTADO_TUTORIAL_INICIAL: EstadoTutorial = {
  passo: 0,
  concluido: false,
};
