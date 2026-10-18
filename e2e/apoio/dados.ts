import type {
  Ficha,
  ItemFicha,
  Programa,
  RegistroTreino,
} from "../../src/domain/tipos";
import type { Usuario } from "../../src/domain/usuario";

/* Construtores do estado que o app persiste. Semear é o que permite um teste
   começar já no cenário de interesse em vez de repetir o cadastro inteiro —
   e cada campo aqui espelha o que o PezzoStateManager grava. */

/** Formato exato de `trainify_dados_treino`. */
export interface DadosSemeados {
  programas: Programa[];
  fichas: Ficha[];
  historico: RegistroTreino[];
  exerciciosCustom: unknown[];
  cardioCustom: unknown[];
  atualizadoEm: string;
}

/** IDs da biblioteca padrão usados nas specs (exercicio-mock.repo.ts). */
export const EXERCICIOS = {
  supinoReto: "ex-01",
  supinoInclinado: "ex-02",
  remadaBaixa: "ex-08",
  roscaDireta: "ex-16",
} as const;

export function itemExercicio(
  exercicioId: string,
  parcial: Partial<Omit<ItemFicha & { tipo: "exercicio" }, "tipo">> = {}
): ItemFicha {
  return {
    tipo: "exercicio",
    exercicio: {
      exercicioId,
      series: 3,
      repeticoes: 10,
      usaCarga: true,
      descansoSegundos: 60,
      ...(parcial as object),
    },
  };
}

export function itemCardio(id: string, tipo = "Esteira", duracaoMinutos = 20): ItemFicha {
  return {
    tipo: "cardio",
    cardio: { id, tipo, duracaoMinutos, nota: "" },
  };
}

export function ficha(parcial: Partial<Ficha> = {}): Ficha {
  return {
    id: "ficha-a",
    nome: "Treino A",
    descricao: "Peito e costas",
    icone: "halter",
    emoji: "💪",
    itens: [itemExercicio(EXERCICIOS.supinoReto), itemExercicio(EXERCICIOS.remadaBaixa)],
    ...parcial,
  };
}

export function programa(parcial: Partial<Programa> = {}): Programa {
  return {
    id: "programa-1",
    nome: "Full Body",
    descricao: "Programa de teste",
    fichaIds: ["ficha-a"],
    ativo: true,
    ...parcial,
  };
}

export function usuario(parcial: Partial<Usuario> = {}): Usuario {
  return {
    nome: "Isa",
    avatarEmoji: "🦖",
    criadoEm: "2026-01-05T10:00:00.000Z",
    metaSemanal: 3,
    ...parcial,
  };
}

/** Treino já registrado, para telas de histórico/estatísticas. */
export function registroTreino(parcial: Partial<RegistroTreino> = {}): RegistroTreino {
  return {
    id: "treino-1",
    fichaId: "ficha-a",
    data: "2026-09-01",
    iniciadoEm: "2026-09-01T09:00:00.000Z",
    finalizadoEm: "2026-09-01T10:02:00.000Z",
    exercicios: [
      {
        exercicioId: EXERCICIOS.supinoReto,
        series: [
          { serie: 1, repeticoes: 10, carga: 40 },
          { serie: 2, repeticoes: 10, carga: 40 },
          { serie: 3, repeticoes: 8, carga: 42.5 },
        ],
        nota: "",
      },
    ],
    cardio: [],
    ...parcial,
  };
}

export function dados(parcial: Partial<DadosSemeados> = {}): DadosSemeados {
  return {
    programas: [programa()],
    fichas: [ficha()],
    historico: [],
    exerciciosCustom: [],
    cardioCustom: [],
    atualizadoEm: "2026-09-01T10:02:00.000Z",
    ...parcial,
  };
}
