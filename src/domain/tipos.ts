/* ============================================================================
   Modelo de Dados - Pezzo
   Baseado na especificação funcional
   ============================================================================ */

/** Exercício catalogado (biblioteca padrão + customizados) */
export interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: string;
}

/** Configuração de exercício dentro de uma ficha */
export interface ExercicioFicha {
  exercicioId: string;
  series: number;
  repeticoes: number;
  usaCarga: boolean;
  descansoSegundos: number;
}

/** Tipos de cardio pré-definidos */
export type TipoCardioBuiltin =
  | "Esteira"
  | "Bike"
  | "Elíptico"
  | "Remo"
  | "Escada"
  | "Pular Corda";

export type TipoCardio = TipoCardioBuiltin | (string & {});

export type ChaveMetricaCardio =
  | "duracaoMinutos"
  | "distanciaKm"
  | "passos"
  | "niveis"
  | "pulos"
  | "inclinacaoPct"
  | "resistencia"
  | "rpm"
  | "ritmo500m"
  | "spm";

export interface TipoCardioDef {
  id: string;
  nome: string;
  emoji?: string;
  metricas: ChaveMetricaCardio[];
  builtin: boolean;
}

export const CAMPOS_CARDIO: Record<
  TipoCardioBuiltin,
  { principais: ChaveMetricaCardio[]; secundarios: ChaveMetricaCardio[] }
> = {
  Esteira: { principais: ["duracaoMinutos", "distanciaKm"], secundarios: ["passos", "inclinacaoPct"] },
  Bike: { principais: ["duracaoMinutos", "distanciaKm"], secundarios: ["resistencia", "rpm"] },
  "Elíptico": { principais: ["duracaoMinutos", "distanciaKm"], secundarios: ["resistencia", "rpm"] },
  Remo: { principais: ["duracaoMinutos", "distanciaKm"], secundarios: ["ritmo500m", "spm"] },
  Escada: { principais: ["duracaoMinutos", "niveis"], secundarios: ["passos"] },
  "Pular Corda": { principais: ["duracaoMinutos", "pulos"], secundarios: [] },
};

export const META_METRICA_CARDIO: Record<
  ChaveMetricaCardio,
  { rotulo: string; unidade: string; passo: number; derivada?: boolean }
> = {
  duracaoMinutos: { rotulo: "Duração", unidade: "min", passo: 1 },
  distanciaKm: { rotulo: "Distância", unidade: "km", passo: 0.1 },
  passos: { rotulo: "Passos", unidade: "", passo: 100 },
  niveis: { rotulo: "Andares", unidade: "", passo: 1 },
  pulos: { rotulo: "Pulos", unidade: "", passo: 10 },
  inclinacaoPct: { rotulo: "Inclinação", unidade: "%", passo: 0.5 },
  resistencia: { rotulo: "Resistência", unidade: "nível", passo: 1 },
  rpm: { rotulo: "RPM", unidade: "rpm", passo: 1 },
  ritmo500m: { rotulo: "Ritmo /500m", unidade: "/500m", passo: 1 },
  spm: { rotulo: "Remadas", unidade: "spm", passo: 1 },
};

const EMOJI_CARDIO_BUILTIN: Record<TipoCardioBuiltin, string> = {
  Esteira: "🏃",
  Bike: "🚴",
  "Elíptico": "🌀",
  Remo: "🚣",
  Escada: "🪜",
  "Pular Corda": "🤸",
};

export const CATALOGO_CARDIO_BUILTIN: TipoCardioDef[] = (
  Object.entries(CAMPOS_CARDIO) as Array<
    [TipoCardioBuiltin, { principais: ChaveMetricaCardio[]; secundarios: ChaveMetricaCardio[] }]
  >
).map(([id, campos]) => ({
  id,
  nome: id,
  emoji: EMOJI_CARDIO_BUILTIN[id],
  metricas: [...campos.principais, ...campos.secundarios],
  builtin: true,
}));

export function resolverTipoCardio(
  id: string,
  custom: TipoCardioDef[] = []
): TipoCardioDef {
  const tipo =
    custom.find((item) => item.id === id) ??
    CATALOGO_CARDIO_BUILTIN.find((item) => item.id === id);

  return tipo ?? {
    id,
    nome: id,
    metricas: ["duracaoMinutos"],
    builtin: false,
  };
}

/** Entrada de cardio configurada na ficha */
export interface EntradaCardio {
  id: string;
  tipo: TipoCardio;
  duracaoMinutos: number;
  nota: string;
  distanciaKm?: number;
  passos?: number;
  niveis?: number;
  pulos?: number;
  inclinacaoPct?: number;
  resistencia?: number;
  rpm?: number;
  ritmo500m?: number;
  spm?: number;
}

/** Item da ficha: um exercício de força ou uma atividade de cardio.
    O envelope aninhado evita colisão com o campo `tipo` de EntradaCardio. */
export type ItemFicha =
  | { tipo: "exercicio"; exercicio: ExercicioFicha }
  | { tipo: "cardio"; cardio: EntradaCardio };

/** Ficha de treino: sequência única e ordenada de itens */
export interface Ficha {
  id: string;
  nome: string;
  descricao: string;
  icone: NomeIcone;
  emoji?: string; /** Emoji opcional para substituir o ícone SVG */
  itens: ItemFicha[];
}

/** Programa de treino */
export interface Programa {
  id: string;
  nome: string;
  descricao: string;
  fichaIds: string[];
  ativo: boolean;
}

/** Registro de série durante execução */
export interface RegistroSerie {
  serie: number;
  repeticoes: number;
  carga: number;
}

/** Registro de exercício no log */
export interface RegistroExercicio {
  /** Exercício realmente executado; histórico e progressão usam este ID. */
  exercicioId: string;
  /** Prescrição original da ficha, presente somente quando houve substituição. */
  exercicioPlanejadoId?: string;
  series: RegistroSerie[];
  nota: string;
}

/** Registro de cardio no log */
export interface RegistroCardio {
  cardioId: string;
  tipo: TipoCardio;
  duracaoMinutos: number;
  nota: string;
  distanciaKm?: number;
  passos?: number;
  niveis?: number;
  pulos?: number;
  inclinacaoPct?: number;
  resistencia?: number;
  rpm?: number;
  ritmo500m?: number;
  spm?: number;
}

/** Log completo de uma sessão de treino */
export interface RegistroTreino {
  id: string;
  fichaId: string;
  data: string;
  iniciadoEm: string;
  finalizadoEm: string;
  exercicios: RegistroExercicio[];
  cardio: RegistroCardio[];
}

/** Nomes de ícones disponíveis no sistema */
export type NomeIcone =
  | "halter"
  | "braco"
  | "raio"
  | "fogo"
  | "coracao"
  | "estrela"
  | "trofeu"
  | "alvo"
  | "montanha"
  | "corrida"
  | "emoji"; /** Novo tipo para emojis customizados */

/** Registro de atividade para um dia específico */
export interface RegistroAtividadeDiaria {
  data: string; /** ISO date (YYYY-MM-DD) */
  completou: boolean;
  fichasCompletas?: string[]; /** IDs das fichas completadas */
}

/** Dados de frequência de treino */
export interface DadosFrequencia {
  registros: RegistroAtividadeDiaria[];
  dataInicio: string;
  dataFim: string;
}
