/* ═══════════════════════════════════════════
   Definição central das rotas do app
   ───────────────────────────────────────────
   - Padrões de caminho usados em <Routes>.
   - construirCaminho(): tradutor dos "destinos"
     legados (aoNavegar("execucao", { fichaId }))
     para caminhos reais — mantém as páginas sem
     mudança.
   - Helpers derivados do pathname para o shell
     (título, aba ativa, esconder nav, tab raiz).
   ═══════════════════════════════════════════ */

import { matchPath } from "react-router-dom";
import type { AbaNavegacao } from "@/interface/widget/menu-lateral/NavegacaoInferior";

export type ParamsRota = Record<string, string>;

/** Padrões de caminho para a definição de <Route path=...>. */
export const ROTAS = {
  treinos: "/treinos",
  historico: "/historico",
  estatisticas: "/estatisticas",
  gerenciar: "/gerenciar",
  gerenciarFichas: "/gerenciar/fichas",
  gerenciarExercicios: "/gerenciar/exercicios",
  execucao: "/execucao/:fichaId",
  execucaoLivre: "/execucao-livre",
  sequencia: "/sequencia",
  resumoPrograma: "/programa/:programaId",
  detalheHistorico: "/historico/:registroId",
  grafico: "/grafico/:exercicioId",
  criarPrograma: "/programa/novo",
  editarPrograma: "/programa/:programaId/editar",
  criarFicha: "/ficha/nova",
  editarFicha: "/ficha/:fichaId/editar",
} as const;

/**
 * Converte um "destino" legado (+ params) num caminho de URL.
 * Espelha exatamente os destinos que as páginas já usam em
 * aoNavegar(...), para que nenhuma página precise mudar.
 */
export function construirCaminho(destino: string, params: ParamsRota = {}): string {
  switch (destino) {
    case "treinos":
      return "/treinos";
    case "historico":
      return "/historico";
    case "estatisticas":
      return "/estatisticas";
    case "gerenciar":
      return "/gerenciar";
    case "gerenciarFichas":
      return "/gerenciar/fichas";
    case "gerenciarExercicios":
      return "/gerenciar/exercicios";
    case "execucao":
      return `/execucao/${params.fichaId}`;
    case "execucaoLivre":
      return "/execucao-livre";
    case "detalheSequencia":
      return "/sequencia";
    case "resumoPrograma":
      return `/programa/${params.id}`;
    case "detalheHistorico":
      return `/historico/${params.registroId}`;
    case "graficoProgressao":
      return `/grafico/${params.exercicioId}`;
    case "criarPrograma":
      return "/programa/novo";
    case "editarPrograma":
      return `/programa/${params.id}/editar`;
    case "criarFicha":
      return params.programaId
        ? `/ficha/nova?programaId=${params.programaId}`
        : "/ficha/nova";
    case "editarFicha":
      return params.programaId
        ? `/ficha/${params.id}/editar?programaId=${params.programaId}`
        : `/ficha/${params.id}/editar`;
    default:
      return "/treinos";
  }
}

/* ─── Helpers de shell derivados do pathname ─── */

// Título do cabeçalho. Ordem importa: padrões estáticos
// (ex.: /programa/novo) antes dos dinâmicos (/programa/:id).
const TITULOS: { padrao: string; titulo: string }[] = [
  { padrao: ROTAS.criarPrograma, titulo: "Novo Programa" },
  { padrao: ROTAS.editarPrograma, titulo: "Editar Programa" },
  { padrao: ROTAS.resumoPrograma, titulo: "Programa" },
  { padrao: ROTAS.criarFicha, titulo: "Nova Ficha" },
  { padrao: ROTAS.editarFicha, titulo: "Editar Ficha" },
  { padrao: ROTAS.detalheHistorico, titulo: "Detalhe do Treino" },
  { padrao: ROTAS.grafico, titulo: "Progressão" },
  { padrao: ROTAS.sequencia, titulo: "Sequência" },
  { padrao: ROTAS.historico, titulo: "Histórico" },
  { padrao: ROTAS.estatisticas, titulo: "Estatísticas" },
  { padrao: ROTAS.gerenciarFichas, titulo: "Fichas" },
  { padrao: ROTAS.gerenciarExercicios, titulo: "Exercícios" },
  { padrao: ROTAS.gerenciar, titulo: "Programas" },
  { padrao: ROTAS.treinos, titulo: "Meus Treinos" },
];

export function tituloDoCaminho(pathname: string): string {
  for (const { padrao, titulo } of TITULOS) {
    if (matchPath(padrao, pathname)) return titulo;
  }
  return "Meus Treinos";
}

/** Rotas de editor/gráfico: escondem a navegação inferior. */
const ROTAS_SEM_NAV = [
  ROTAS.criarPrograma,
  ROTAS.editarPrograma,
  ROTAS.criarFicha,
  ROTAS.editarFicha,
  ROTAS.grafico,
];

export function ehRotaSemNav(pathname: string): boolean {
  return ROTAS_SEM_NAV.some((padrao) => matchPath(padrao, pathname) !== null);
}

/**
 * Rotas que, no desktop (lg+), usam uma coluna de conteúdo mais larga que a de
 * leitura padrão (768px) — hoje só o resumo do programa, que ganha 2 colunas.
 */
const ROTAS_LARGAS = [ROTAS.treinos, ROTAS.resumoPrograma];

export function ehRotaLarga(pathname: string): boolean {
  return ROTAS_LARGAS.some((padrao) => matchPath(padrao, pathname) !== null);
}

/** Tabs raiz não mostram botão de voltar no cabeçalho. */
export function ehTabRaiz(pathname: string): boolean {
  return (
    pathname === ROTAS.treinos ||
    pathname === ROTAS.historico ||
    pathname === ROTAS.estatisticas ||
    pathname === ROTAS.gerenciar
  );
}

/** Aba destacada na navegação inferior conforme o caminho. */
export function abaDoCaminho(pathname: string): AbaNavegacao {
  if (pathname.startsWith("/historico")) return "historico";
  if (pathname.startsWith("/estatisticas")) return "estatisticas";
  if (
    pathname.startsWith("/gerenciar") ||
    pathname.startsWith("/ficha") ||
    pathname === ROTAS.criarPrograma ||
    matchPath(ROTAS.editarPrograma, pathname)
  ) {
    return "gerenciar";
  }
  return "treinos";
}
