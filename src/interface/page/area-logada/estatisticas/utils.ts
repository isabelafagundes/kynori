import type {
  ChaveMetricaCardio,
  DadosFrequencia,
  Exercicio,
  RegistroCardio,
  RegistroAtividadeDiaria,
  RegistroTreino,
} from "@/domain/tipos";
import { META_METRICA_CARDIO, resolverTipoCardio } from "@/domain/tipos";
import { criarIdGraficoCardio } from "@/interface/widget/grafico/cardioGraficoId";

/** Retorna a data ISO (YYYY-MM-DD) a partir de um Date local */
export function toISODate(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Início da semana (segunda-feira, 00:00 local) que contém a data dada.
    Definição única de "semana" do app — usada pelo volume semanal e pela
    contagem semanal da home. */
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  const diaSegundaBase = (d.getDay() + 6) % 7; // 0 = segunda, 6 = domingo
  d.setDate(d.getDate() - diaSegundaBase);
  return d;
}

/** Volume (kg movimentados = Σ repetições × carga) de uma sessão de treino. */
function volumeDaSessao(registro: RegistroTreino): number {
  return registro.exercicios.reduce(
    (totalExercicios, exercicio) =>
      totalExercicios +
      exercicio.series.reduce(
        (totalSeries, serie) => totalSeries + serie.repeticoes * (serie.carga || 0),
        0,
      ),
    0,
  );
}

/** Conta treinos realizados no mês de referência (mês corrente por padrão) */
export function calcularTreinosNoMes(
  historico: RegistroTreino[],
  referencia: Date = new Date(),
): number {
  const mes = referencia.getMonth();
  const ano = referencia.getFullYear();
  return historico.filter((r) => {
    const data = new Date(r.iniciadoEm);
    return data.getMonth() === mes && data.getFullYear() === ano;
  }).length;
}

/** Conta dias consecutivos com treino terminando em hoje (ou ontem, se ainda não treinou hoje) */
export function calcularStreakAtual(
  historico: RegistroTreino[],
  hoje: Date = new Date(),
): number {
  const diasComTreino = new Set<string>();
  for (const reg of historico) {
    diasComTreino.add(toISODate(new Date(reg.iniciadoEm)));
  }

  let streak = 0;
  const cursor = new Date(hoje);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const iso = toISODate(cursor);
    if (diasComTreino.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Maior streak já atingido no histórico */
export function calcularRecordeStreak(historico: RegistroTreino[]): number {
  const dias = Array.from(
    new Set(historico.map((r) => toISODate(new Date(r.iniciadoEm)))),
  ).sort();

  if (dias.length === 0) return 0;

  let max = 1;
  let atual = 1;
  for (let i = 1; i < dias.length; i++) {
    const anterior = new Date(dias[i - 1] + "T00:00:00");
    const corrente = new Date(dias[i] + "T00:00:00");
    const diffDias = Math.round(
      (corrente.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDias === 1) {
      atual++;
      max = Math.max(max, atual);
    } else {
      atual = 1;
    }
  }
  return max;
}

/** Constrói DadosFrequencia para uma janela de N dias terminando em hoje */
export function construirDadosFrequencia(
  historico: RegistroTreino[],
  diasJanela: number = 365,
  hoje: Date = new Date(),
): DadosFrequencia {
  const fichasPorDia = new Map<string, string[]>();
  for (const reg of historico) {
    const iso = toISODate(new Date(reg.iniciadoEm));
    const lista = fichasPorDia.get(iso) ?? [];
    lista.push(reg.fichaId);
    fichasPorDia.set(iso, lista);
  }

  const dataFim = new Date(hoje);
  dataFim.setHours(0, 0, 0, 0);
  const dataInicio = new Date(dataFim);
  dataInicio.setDate(dataFim.getDate() - (diasJanela - 1));

  const registros: RegistroAtividadeDiaria[] = [];
  const cursor = new Date(dataInicio);
  while (cursor <= dataFim) {
    const iso = toISODate(cursor);
    const fichas = fichasPorDia.get(iso);
    registros.push({
      data: iso,
      completou: !!fichas && fichas.length > 0,
      fichasCompletas: fichas,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    registros,
    dataInicio: toISODate(dataInicio),
    dataFim: toISODate(dataFim),
  };
}

/**
 * Dias distintos com treino na semana calendário (segunda a domingo) que
 * contém `hoje`.
 *
 * Antes a home contava os últimos 7 dias corridos e rotulava "esta semana" —
 * uma janela deslizante disfarçada de semana. Com a meta semanal explícita a
 * diferença fica visível (o número cairia sozinho na virada de semana sem que
 * nada tivesse mudado), então a contagem passou a ser a semana de verdade,
 * usando o mesmo `inicioDaSemana` do volume semanal.
 *
 * Conta DIAS, não sessões: dois treinos no mesmo dia valem 1, coerente com a
 * meta ser expressa em "dias por semana".
 */
export function contarDiasComTreinoNaSemana(
  dados: DadosFrequencia,
  hoje: Date = new Date(),
): number {
  const inicio = inicioDaSemana(hoje);
  const fim = new Date(hoje);
  fim.setHours(0, 0, 0, 0);

  let total = 0;
  for (const registro of dados.registros) {
    if (!registro.completou) continue;
    const data = new Date(`${registro.data}T00:00:00`);
    if (data >= inicio && data <= fim) total++;
  }
  return total;
}

export interface ProgressaoExercicio {
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  totalSessoes: number;
  ultimaData: string;
  cargaMaxima: number; /** maior carga já registrada */
  ultimaCarga: number; /** maior carga da sessão mais recente */
  usaCarga: boolean;
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/** Filtra a lista de progressão pelo nome do exercício e pelo grupo muscular. */
export function filtrarProgressaoExercicios(
  progressao: ProgressaoExercicio[],
  busca: string,
  grupoMuscular: string | null,
): ProgressaoExercicio[] {
  const termo = normalizarTexto(busca);

  return progressao.filter((item) => {
    const correspondeAoGrupo =
      grupoMuscular === null || item.grupoMuscular === grupoMuscular;
    const correspondeABusca =
      termo.length === 0 || normalizarTexto(item.nome).includes(termo);

    return correspondeAoGrupo && correspondeABusca;
  });
}

export interface ResumoCardio {
  totalSessoes: number;
  totalMinutos: number;
  totalKm: number;
}

export interface ProgressaoCardio {
  idGrafico: string;
  tipo: string;
  nome: string;
  emoji?: string;
  metrica: ChaveMetricaCardio;
  rotuloMetrica: string;
  totalSessoes: number;
  ultimaData: string;
  ultimoValor: number;
  melhorValor: number;
}

const PRIORIDADE_METRICAS_CARDIO: ChaveMetricaCardio[] = [
  "distanciaKm",
  "duracaoMinutos",
  "niveis",
  "pulos",
  "passos",
  "ritmo500m",
  "resistencia",
  "rpm",
  "spm",
  "inclinacaoPct",
];

function obterValorCardio(cardio: RegistroCardio, metrica: ChaveMetricaCardio): number | null {
  const valor = cardio[metrica];
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

function escolherMetricaCardio(cardio: RegistroCardio): ChaveMetricaCardio | null {
  return PRIORIDADE_METRICAS_CARDIO.find((metrica) => obterValorCardio(cardio, metrica) !== null) ?? null;
}

function melhorValorCardio(metrica: ChaveMetricaCardio, atual: number, proximo: number) {
  return metrica === "ritmo500m" ? Math.min(atual, proximo) : Math.max(atual, proximo);
}

export function calcularResumoCardio(historico: RegistroTreino[]): ResumoCardio {
  return historico.reduce<ResumoCardio>(
    (resumo, registro) => {
      for (const cardio of registro.cardio) {
        resumo.totalSessoes += 1;
        resumo.totalMinutos += cardio.duracaoMinutos || 0;
        resumo.totalKm += cardio.distanciaKm || 0;
      }
      return resumo;
    },
    { totalSessoes: 0, totalMinutos: 0, totalKm: 0 }
  );
}

export function agregarProgressaoPorCardio(historico: RegistroTreino[]): ProgressaoCardio[] {
  const mapa = new Map<string, ProgressaoCardio>();
  const ordenado = [...historico].sort(
    (a, b) => new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime()
  );

  for (const registro of ordenado) {
    for (const cardio of registro.cardio) {
      const metrica = escolherMetricaCardio(cardio);
      if (!metrica) continue;

      const valor = obterValorCardio(cardio, metrica);
      if (valor === null) continue;

      const tipo = resolverTipoCardio(cardio.tipo);
      const chave = `${cardio.tipo}__${metrica}`;
      const existente = mapa.get(chave);

      if (existente) {
        existente.totalSessoes += 1;
        existente.melhorValor = melhorValorCardio(metrica, existente.melhorValor, valor);
      } else {
        mapa.set(chave, {
          idGrafico: criarIdGraficoCardio(cardio.tipo, metrica),
          tipo: cardio.tipo,
          nome: tipo.nome,
          emoji: tipo.emoji,
          metrica,
          rotuloMetrica: META_METRICA_CARDIO[metrica].rotulo,
          totalSessoes: 1,
          ultimaData: registro.iniciadoEm,
          ultimoValor: valor,
          melhorValor: valor,
        });
      }
    }
  }

  return Array.from(mapa.values()).sort(
    (a, b) => new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime()
  );
}

/** Agrega progressão por exercício a partir do histórico — ordenado por mais recente */
export function agregarProgressaoPorExercicio(
  historico: RegistroTreino[],
  exercicios: Exercicio[],
): ProgressaoExercicio[] {
  const catalogo = new Map(exercicios.map((e) => [e.id, e]));
  const mapa = new Map<string, ProgressaoExercicio>();

  const ordenado = [...historico].sort(
    (a, b) =>
      new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime(),
  );

  for (const reg of ordenado) {
    for (const exReg of reg.exercicios) {
      const exercicio = catalogo.get(exReg.exercicioId);
      if (!exercicio) continue;

      const cargasNaSessao = exReg.series.map((s) => s.carga ?? 0);
      const cargaMaxSessao = cargasNaSessao.length
        ? Math.max(...cargasNaSessao)
        : 0;
      const usaCarga = cargasNaSessao.some((c) => c > 0);

      const existente = mapa.get(exReg.exercicioId);
      if (existente) {
        existente.totalSessoes += 1;
        existente.cargaMaxima = Math.max(existente.cargaMaxima, cargaMaxSessao);
        existente.usaCarga = existente.usaCarga || usaCarga;
      } else {
        mapa.set(exReg.exercicioId, {
          exercicioId: exReg.exercicioId,
          nome: exercicio.nome,
          grupoMuscular: exercicio.grupoMuscular,
          totalSessoes: 1,
          ultimaData: reg.iniciadoEm,
          cargaMaxima: cargaMaxSessao,
          ultimaCarga: cargaMaxSessao,
          usaCarga,
        });
      }
    }
  }

  return Array.from(mapa.values()).sort(
    (a, b) => new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime(),
  );
}

export interface SemanaVolume {
  inicioISO: string; /** segunda-feira que abre a semana (YYYY-MM-DD) */
  volume: number; /** kg movimentados na semana */
}

export interface ResumoVolumeSemanal {
  semanas: SemanaVolume[]; /** janela contígua terminando na semana atual */
  volumeAtual: number;
  volumeAnterior: number;
  /** variação % da semana atual sobre a anterior; null se não há base de comparação */
  deltaPct: number | null;
}

/**
 * Agrega o volume (Σ repetições × carga) por semana ISO (segunda a domingo),
 * numa janela contígua de `numSemanas` terminando na semana de `hoje`. Semanas
 * sem treino entram com volume 0 — a janela é sempre contígua para o gráfico.
 */
export function calcularVolumeSemanal(
  historico: RegistroTreino[],
  numSemanas: number = 8,
  hoje: Date = new Date(),
): ResumoVolumeSemanal {
  const volumePorSemana = new Map<string, number>();
  for (const registro of historico) {
    const chave = toISODate(inicioDaSemana(new Date(registro.iniciadoEm)));
    volumePorSemana.set(chave, (volumePorSemana.get(chave) ?? 0) + volumeDaSessao(registro));
  }

  const inicioAtual = inicioDaSemana(hoje);
  const semanas: SemanaVolume[] = [];
  for (let i = numSemanas - 1; i >= 0; i--) {
    const cursor = new Date(inicioAtual);
    cursor.setDate(cursor.getDate() - i * 7);
    const chave = toISODate(cursor);
    semanas.push({ inicioISO: chave, volume: volumePorSemana.get(chave) ?? 0 });
  }

  const volumeAtual = semanas[semanas.length - 1]?.volume ?? 0;
  const volumeAnterior = semanas[semanas.length - 2]?.volume ?? 0;
  const deltaPct =
    volumeAnterior > 0 ? ((volumeAtual - volumeAnterior) / volumeAnterior) * 100 : null;

  return { semanas, volumeAtual, volumeAnterior, deltaPct };
}

export interface PontoCarga {
  data: string; /** iniciadoEm da sessão */
  maiorCarga: number;
}

export interface EvolucaoCarga {
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  pontos: PontoCarga[]; /** maior carga por sessão, ordem cronológica, últimas `janela` */
  cargaInicial: number;
  cargaAtual: number;
  delta: number; /** cargaAtual − cargaInicial dentro da janela (sempre > 0) */
}

/**
 * Encontra o exercício com maior ganho de carga dentro das últimas `janela`
 * sessões em que foi registrado com carga. Base do card "maior evolução de
 * carga". Retorna null se nenhum exercício progrediu (delta ≤ 0) ou não tem
 * pelo menos 2 sessões com carga.
 */
export function calcularMaiorEvolucaoCarga(
  historico: RegistroTreino[],
  exercicios: Exercicio[],
  janela: number = 8,
): EvolucaoCarga | null {
  const catalogo = new Map(exercicios.map((e) => [e.id, e]));
  const pontosPorExercicio = new Map<string, PontoCarga[]>();

  const ordenado = [...historico].sort(
    (a, b) => new Date(a.iniciadoEm).getTime() - new Date(b.iniciadoEm).getTime(),
  );

  for (const registro of ordenado) {
    for (const exReg of registro.exercicios) {
      if (!catalogo.has(exReg.exercicioId)) continue;
      const maiorCarga = exReg.series.length
        ? Math.max(...exReg.series.map((s) => s.carga || 0))
        : 0;
      if (maiorCarga <= 0) continue; // só faz sentido para exercícios com carga
      const lista = pontosPorExercicio.get(exReg.exercicioId) ?? [];
      lista.push({ data: registro.iniciadoEm, maiorCarga });
      pontosPorExercicio.set(exReg.exercicioId, lista);
    }
  }

  let melhor: EvolucaoCarga | null = null;
  for (const [exercicioId, todos] of pontosPorExercicio) {
    const pontos = todos.slice(-janela);
    if (pontos.length < 2) continue;

    const cargaInicial = pontos[0].maiorCarga;
    const cargaAtual = pontos[pontos.length - 1].maiorCarga;
    const delta = cargaAtual - cargaInicial;
    if (delta <= 0) continue;

    const exercicio = catalogo.get(exercicioId)!;
    const candidato: EvolucaoCarga = {
      exercicioId,
      nome: exercicio.nome,
      grupoMuscular: exercicio.grupoMuscular,
      pontos,
      cargaInicial,
      cargaAtual,
      delta,
    };

    if (
      !melhor ||
      candidato.delta > melhor.delta ||
      (candidato.delta === melhor.delta && candidato.cargaAtual > melhor.cargaAtual)
    ) {
      melhor = candidato;
    }
  }

  return melhor;
}
