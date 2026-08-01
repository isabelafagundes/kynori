import type {
  Exercicio,
  ExercicioFicha,
  Ficha,
  Programa,
  RegistroTreino,
} from "@/domain/tipos";
import { cardioDaFicha, exerciciosDaFicha } from "@/domain/ficha";

/**
 * Estimativa de duração da ficha em minutos, arredondada para múltiplos de 5:
 * cada série ocupa ~45s de execução mais o descanso configurado; cardio entra
 * com a duração declarada. Retorna 0 para ficha vazia (o card omite o tempo).
 */
export function estimarDuracaoMinutos(ficha: Ficha): number {
  const segundosMusculacao = exerciciosDaFicha(ficha).reduce(
    (total, exercicio) =>
      total + exercicio.series * (45 + (exercicio.descansoSegundos || 60)),
    0,
  );
  const segundosCardio = cardioDaFicha(ficha).reduce(
    (total, cardio) => total + (cardio.duracaoMinutos || 0) * 60,
    0,
  );
  const totalSegundos = segundosMusculacao + segundosCardio;
  if (totalSegundos <= 0) return 0;
  return Math.max(5, Math.round(totalSegundos / 60 / 5) * 5);
}

export function obterUltimoTreinoDaFicha(
  fichaId: string,
  historico: RegistroTreino[],
): string | null {
  const registrosDaFicha = historico
    .filter((registro) => registro.fichaId === fichaId)
    .sort((a, b) => b.iniciadoEm.localeCompare(a.iniciadoEm));

  return registrosDaFicha[0]?.iniciadoEm ?? null;
}

export function formatarDataRelativa(dataISO: string): string {
  const agora = new Date();
  const data = new Date(dataISO);
  const diffMs = agora.getTime() - data.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";
  if (diffDias < 7) return `há ${diffDias} ${diffDias === 1 ? "dia" : "dias"}`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function obterFichasDoPrograma(programa: Programa, fichas: Ficha[]): Ficha[] {
  const fichaIds = Array.isArray(programa.fichaIds) ? programa.fichaIds : [];
  return fichaIds
    .map((fichaId) => fichas.find((ficha) => ficha.id === fichaId))
    .filter((ficha): ficha is Ficha => Boolean(ficha));
}

export function obterFichasTreinadasNaSemana(
  fichasDoPrograma: Ficha[],
  historico: RegistroTreino[],
): Set<string> {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - diaSemana);
  inicioSemana.setHours(0, 0, 0, 0);

  const idsFichasPrograma = new Set(fichasDoPrograma.map((ficha) => ficha.id));
  const idsTreinados = new Set<string>();

  for (const registro of historico) {
    const data = new Date(registro.iniciadoEm);
    if (data >= inicioSemana && idsFichasPrograma.has(registro.fichaId)) {
      idsTreinados.add(registro.fichaId);
    }
  }

  return idsTreinados;
}

export function obterProximaFichaId(
  fichasDoPrograma: Ficha[],
  historico: RegistroTreino[],
): string | null {
  return fichasDoPrograma.reduce<string | null>((melhorId, ficha) => {
    const ultimo = obterUltimoTreinoDaFicha(ficha.id, historico);
    if (!ultimo) return ficha.id;
    if (!melhorId) return ficha.id;

    const melhorUltimo = obterUltimoTreinoDaFicha(melhorId, historico);
    if (!melhorUltimo) return melhorId;

    return ultimo < melhorUltimo ? ficha.id : melhorId;
  }, null);
}

export function ordenarFichasComProximaPrimeiro(
  fichasDoPrograma: Ficha[],
  proximaFichaId: string | null,
): Ficha[] {
  if (!proximaFichaId) return [...fichasDoPrograma];

  return [...fichasDoPrograma].sort((a, b) => {
    if (a.id === proximaFichaId) return -1;
    if (b.id === proximaFichaId) return 1;
    return 0;
  });
}

/** Grupos musculares distintos dos exercícios de uma ficha, na ordem de aparição */
export function extrairGruposMusculares(
  exerciciosFicha: ExercicioFicha[],
  catalogo: Exercicio[],
): string[] {
  const grupos = new Set<string>();
  for (const ef of Array.isArray(exerciciosFicha) ? exerciciosFicha : []) {
    const exercicio = catalogo.find((e) => e.id === ef.exercicioId);
    if (exercicio) grupos.add(exercicio.grupoMuscular);
  }
  return Array.from(grupos);
}

/** Total de treinos já registrados para qualquer ficha do programa */
export function contarTreinosDoPrograma(
  fichasDoPrograma: Ficha[],
  historico: RegistroTreino[],
): number {
  const ids = new Set(fichasDoPrograma.map((ficha) => ficha.id));
  return historico.filter((registro) => ids.has(registro.fichaId)).length;
}

/** Data ISO do treino mais recente entre as fichas do programa (ou null) */
export function obterUltimoTreinoDoPrograma(
  fichasDoPrograma: Ficha[],
  historico: RegistroTreino[],
): string | null {
  const ids = new Set(fichasDoPrograma.map((ficha) => ficha.id));
  return historico
    .filter((registro) => ids.has(registro.fichaId))
    .reduce<string | null>((maisRecente, registro) => {
      if (!maisRecente) return registro.iniciadoEm;
      return registro.iniciadoEm > maisRecente ? registro.iniciadoEm : maisRecente;
    }, null);
}
