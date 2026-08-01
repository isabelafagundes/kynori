/* ═══════════════════════════════════════════
   Repositório do State Manager — Pezzo
   Abstração para acesso ao gerenciador de estado global
   ═══════════════════════════════════════════ */

import type {
  Programa,
  Ficha,
  RegistroTreino,
  Exercicio,
  TipoCardioDef,
} from "@/domain/tipos";
import { pezzoState } from "@/application/state/pezzo.state";

/** Interface do repositório de state manager */
export interface StateManagerRepository {
  inicializar(): Promise<void>;
  estaInicializado(): boolean;

  // Programas
  listarProgramas(): Programa[];
  obterProgramaPorId(id: string): Programa | null;
  obterProgramaAtivo(): Programa | null;
  adicionarPrograma(
    programa: Omit<Programa, "id">
  ): Programa;
  atualizarPrograma(
    id: string,
    atualizacoes: Partial<Omit<Programa, "id">>
  ): Programa | null;
  removerPrograma(id: string): boolean;
  copiarPrograma(id: string): Programa | null;

  // Fichas
  listarFichas(): Ficha[];
  obterFichaPorId(id: string): Ficha | null;
  obterFichasDoPrograma(programaId: string): Ficha[];
  obterProgramasDaFicha(fichaId: string): Programa[];
  obterFichasOrfas(): Ficha[];
  adicionarFicha(
    ficha: Omit<Ficha, "id">,
    programaId?: string
  ): Ficha;
  atualizarFicha(
    id: string,
    atualizacoes: Partial<Omit<Ficha, "id">>
  ): Ficha | null;
  removerFicha(id: string): boolean;
  copiarFicha(id: string): Ficha | null;
  vincularFichaAoPrograma(fichaId: string, programaId: string): boolean;
  desvincularFichaDoPrograma(fichaId: string, programaId: string): boolean;

  // Exercícios
  listarTodosExercicios(): Exercicio[];
  listarExerciciosCustom(): Exercicio[];
  obterExercicioPorId(id: string): Exercicio | null;
  adicionarExercicioCustom(
    exercicio: Omit<Exercicio, "id">
  ): Exercicio;
  removerExercicioCustom(id: string): boolean;
  obterGruposMusculares(): string[];

  // Cardio
  listarTiposCardio(): TipoCardioDef[];
  listarCardioCustom(): TipoCardioDef[];
  adicionarCardioCustom(
    tipo: Omit<TipoCardioDef, "id" | "builtin">
  ): TipoCardioDef;
  atualizarCardioCustom(
    id: string,
    atualizacoes: Partial<Omit<TipoCardioDef, "id">>
  ): TipoCardioDef | null;
  removerCardioCustom(id: string): boolean;

  // Histórico
  listarTreinos(): RegistroTreino[];
  obterHistoricoDaFicha(fichaId: string): RegistroTreino[];
  adicionarTreino(registro: Omit<RegistroTreino, "id">): RegistroTreino;

  // Utilitários
  gerarNomePrograma(): string;
  gerarNomeFicha(): string;
  inscrever(callback: () => void): () => void;
}

/** Implementação do repositório usando o state manager */
export const stateManagerRepository: StateManagerRepository = {
  inicializar: () => pezzoState.inicializar(),
  estaInicializado: () => pezzoState.estaInicializado(),

  // Programas
  listarProgramas: () => pezzoState.getProgramas(),
  obterProgramaPorId: (id) => pezzoState.getProgramaPorId(id),
  obterProgramaAtivo: () => pezzoState.getProgramaAtivo(),
  adicionarPrograma: (programa) => pezzoState.adicionarPrograma(programa),
  atualizarPrograma: (id, atualizacoes) =>
    pezzoState.atualizarPrograma(id, atualizacoes),
  removerPrograma: (id) => pezzoState.removerPrograma(id),
  copiarPrograma: (id) => pezzoState.copiarPrograma(id),

  // Fichas
  listarFichas: () => pezzoState.getFichas(),
  obterFichaPorId: (id) => pezzoState.getFichaPorId(id),
  obterFichasDoPrograma: (programaId) =>
    pezzoState.getFichasDoPrograma(programaId),
  obterProgramasDaFicha: (fichaId) =>
    pezzoState.getProgramasDaFicha(fichaId),
  obterFichasOrfas: () => pezzoState.getFichasOrfas(),
  adicionarFicha: (ficha, programaId) =>
    pezzoState.adicionarFicha(ficha, programaId),
  atualizarFicha: (id, atualizacoes) =>
    pezzoState.atualizarFicha(id, atualizacoes),
  removerFicha: (id) => pezzoState.removerFicha(id),
  copiarFicha: (id) => pezzoState.copiarFicha(id),
  vincularFichaAoPrograma: (fichaId, programaId) =>
    pezzoState.vincularFichaAoPrograma(fichaId, programaId),
  desvincularFichaDoPrograma: (fichaId, programaId) =>
    pezzoState.desvincularFichaDoPrograma(fichaId, programaId),

  // Exercícios
  listarTodosExercicios: () => pezzoState.getTodosExercicios(),
  listarExerciciosCustom: () => pezzoState.getExerciciosCustom(),
  obterExercicioPorId: (id) => pezzoState.getExercicioPorId(id),
  adicionarExercicioCustom: (exercicio) =>
    pezzoState.adicionarExercicioCustom(exercicio),
  removerExercicioCustom: (id) => pezzoState.removerExercicioCustom(id),
  obterGruposMusculares: () => pezzoState.getGruposMusculares(),

  // Cardio
  listarTiposCardio: () => pezzoState.getTiposCardio(),
  listarCardioCustom: () => pezzoState.getCardioCustom(),
  adicionarCardioCustom: (tipo) => pezzoState.adicionarCardioCustom(tipo),
  atualizarCardioCustom: (id, atualizacoes) =>
    pezzoState.atualizarCardioCustom(id, atualizacoes),
  removerCardioCustom: (id) => pezzoState.removerCardioCustom(id),

  // Histórico
  listarTreinos: () => pezzoState.getHistorico(),
  obterHistoricoDaFicha: (fichaId) =>
    pezzoState.getHistoricoDaFicha(fichaId),
  adicionarTreino: (registro) => pezzoState.adicionarTreino(registro),

  // Utilitários
  gerarNomePrograma: () => pezzoState.gerarNomePrograma(),
  gerarNomeFicha: () => pezzoState.gerarNomeFicha(),
  inscrever: (callback) => pezzoState.inscrever(callback),
};
