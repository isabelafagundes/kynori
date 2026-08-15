import { useMemo, useState } from "react";
import type { Exercicio, RegistroTreino } from "@/domain/tipos";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Icone } from "@/interface/widget/svg/Icone";
import { formatarNumeroBR } from "@/interface/util/numero";
import { GraficoMaiorEvolucao } from "@/interface/widget/grafico/GraficoMaiorEvolucao";
import { GraficoVolumeSemanal } from "@/interface/widget/grafico/GraficoVolumeSemanal";
import { Input } from "@/interface/widget/formulario/Input";
import { Chip } from "@/interface/widget/chip/Chip";
import { BigSwitcher } from "@/interface/widget/formulario/BigSwitcher";
import { ListaMetricas, type ItemMetrica } from "./ListaMetricas";
import { ItemProgressaoExercicio } from "./ItemProgressaoExercicio";
import {
  agregarProgressaoPorCardio,
  calcularResumoCardio,
  type ProgressaoCardio,
} from "./cardioUtils";
import {
  agregarProgressaoPorExercicio,
  calcularMaiorEvolucaoCarga,
  calcularRecordeStreak,
  calcularStreakAtual,
  calcularTreinosNoMes,
  filtrarProgressaoExercicios,
} from "./utils";

interface PropriedadesEstatisticasPage {
  historico: RegistroTreino[];
  exercicios: Exercicio[];
  aoNavegar: (destino: string, params?: Record<string, string>) => void;
}

type AbaEstatisticas = "resumo" | "exercicios" | "cardio";

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Normaliza texto para busca acento-insensível. */
function normalizarBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function EstatisticasPage({
  historico,
  exercicios,
  aoNavegar,
}: PropriedadesEstatisticasPage) {
  const hoje = useMemo(() => new Date(), []);
  const [abaAtiva, setAbaAtiva] = useState<AbaEstatisticas>("resumo");
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState<string | null>(null);
  const [buscaCardio, setBuscaCardio] = useState("");

  const treinosNoMes = useMemo(
    () => calcularTreinosNoMes(historico, hoje),
    [historico, hoje],
  );
  const streakAtual = useMemo(
    () => calcularStreakAtual(historico, hoje),
    [historico, hoje],
  );
  const recordeStreak = useMemo(
    () => calcularRecordeStreak(historico),
    [historico],
  );
  const maiorEvolucao = useMemo(
    () => calcularMaiorEvolucaoCarga(historico, exercicios),
    [historico, exercicios],
  );
  const progressao = useMemo(
    () => agregarProgressaoPorExercicio(historico, exercicios),
    [historico, exercicios],
  );
  const gruposMusculares = useMemo(
    () =>
      Array.from(new Set(progressao.map((item) => item.grupoMuscular))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [progressao],
  );
  const progressaoFiltrada = useMemo(
    () => filtrarProgressaoExercicios(progressao, buscaExercicio, grupoMuscular),
    [progressao, buscaExercicio, grupoMuscular],
  );
  const filtrosAtivos = buscaExercicio.trim().length > 0 || grupoMuscular !== null;
  const resumoCardio = useMemo(
    () => calcularResumoCardio(historico),
    [historico],
  );
  const progressaoCardio = useMemo(
    () => agregarProgressaoPorCardio(historico),
    [historico],
  );
  const progressaoCardioFiltrada = useMemo(() => {
    const termo = normalizarBusca(buscaCardio);
    if (!termo) return progressaoCardio;
    return progressaoCardio.filter((item) =>
      normalizarBusca(item.nome).includes(termo),
    );
  }, [progressaoCardio, buscaCardio]);

  const totalTreinos = historico.length;

  if (totalTreinos === 0) {
    return (
      <div className="px-5 py-4 reveal-up">
        <EstadoVazio
          emoji="📈"
          titulo="Sem dados ainda"
          descricao="Conclua seu primeiro treino para começar a acompanhar sua progressão."
          dica="📊 Volume, frequência e recordes por exercício"
          acao={
            <button
              onClick={() => aoNavegar("treinos")}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[10px] bg-acento text-texto-invertido text-sm font-medium hover:bg-acento-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento transition-all duration-150"
            >
              <Icone nome="reproduzir" tamanho={16} />
              Começar a Treinar
            </button>
          }
        />
      </div>
    );
  }

  const nomeMesAtual = nomesMeses[hoje.getMonth()];
  const temCardio = resumoCardio.totalSessoes > 0 || progressaoCardio.length > 0;
  const abaAtivaEfetiva: AbaEstatisticas =
    abaAtiva === "cardio" && !temCardio ? "resumo" : abaAtiva;

  const opcoesAbas = [
    { id: "resumo", label: "Resumo", icone: "grafico" },
    { id: "exercicios", label: "Exercícios", icone: "halter" },
    ...(temCardio ? [{ id: "cardio", label: "Cardio", icone: "coracao" }] : []),
  ];

  // Totalizadores do Resumo como lista de propriedades (Notion-like).
  const itensResumo: ItemMetrica[] = [
    { icone: "halter", rotulo: `Treinos em ${nomeMesAtual}`, valor: treinosNoMes },
    {
      icone: "fogo",
      rotulo: "Streak atual",
      valor: `${streakAtual} ${streakAtual === 1 ? "dia" : "dias"}`,
      extra: recordeStreak > 0 ? `recorde: ${recordeStreak}` : undefined,
    },
  ];
  if (resumoCardio.totalSessoes > 0) {
    itensResumo.push({
      icone: "coracao",
      rotulo: "Cardio total",
      valor: `${Math.round(resumoCardio.totalMinutos)} min`,
      extra: `${resumoCardio.totalSessoes} ${
        resumoCardio.totalSessoes === 1 ? "registro" : "registros"
      }`,
    });
    itensResumo.push({
      icone: "corrida",
      rotulo: "Distância",
      valor: `${formatarNumeroBR(resumoCardio.totalKm, 1)} km`,
    });
  }

  const filtrosExercicioChips = (
    <div
      className="flex flex-nowrap gap-2 overflow-x-auto pb-0.5 md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Filtrar por grupo muscular"
    >
      <button
        type="button"
        aria-pressed={grupoMuscular === null}
        onClick={() => setGrupoMuscular(null)}
        className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      >
        <Chip
          rotulo="Todos"
          tamanho="pequeno"
          ativo={grupoMuscular === null}
          className="min-h-[36px] px-3.5 text-[13px]"
        />
      </button>
      {gruposMusculares.map((grupo) => (
        <button
          key={grupo}
          type="button"
          aria-pressed={grupoMuscular === grupo}
          onClick={() => setGrupoMuscular(grupo)}
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        >
          <Chip
            rotulo={grupo}
            tamanho="pequeno"
            ativo={grupoMuscular === grupo}
            className="min-h-[36px] px-3.5 text-[13px]"
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="reveal-up">
        <BigSwitcher
          opcoes={opcoesAbas}
          valorSelecionado={abaAtivaEfetiva}
          aoAlterar={(valor) => setAbaAtiva(valor as AbaEstatisticas)}
          ariaLabel="Seções de estatísticas"
        />
      </div>

      {/* ── Resumo: totalizadores + volume + evolução ──
          Largo (md+): coluna estreita empilha totalizador + evolução ao lado do
          gráfico de volume, que ocupa as duas linhas — sem sobra de espaço. */}
      {abaAtivaEfetiva === "resumo" && (
        <section
          className="grid gap-3 reveal-up md:grid-cols-[minmax(0,340px)_1fr] md:items-start"
          key="resumo"
        >
          <div className="md:col-start-1 md:row-start-1">
            <ListaMetricas itens={itensResumo} />
          </div>
          <div className="md:col-start-2 md:row-start-1 md:row-span-2">
            <GraficoVolumeSemanal historico={historico} />
          </div>
          <div className="md:col-start-1 md:row-start-2">
            {maiorEvolucao ? (
              <GraficoMaiorEvolucao
                historico={historico}
                exercicios={exercicios}
                aoVerExercicio={(exercicioId) =>
                  aoNavegar("graficoProgressao", { exercicioId })
                }
              />
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-borda px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-acento-suave text-texto-secundario">
                  <Icone nome="tendencia" tamanho={16} />
                </span>
                <p className="text-[13px] leading-snug text-texto-sutil">
                  <b className="font-semibold text-texto-secundario">
                    Maior evolução de carga
                  </b>{" "}
                  aparece aqui após 2 sessões com carga num mesmo exercício.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Exercícios: busca + filtros + progressão ── */}
      {abaAtivaEfetiva === "exercicios" && (
        <section className="space-y-3 reveal-up" key="exercicios">
          {progressao.length > 0 ? (
            <>
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xs text-texto-sutil tabular-nums">
                  {filtrosAtivos ? `${progressaoFiltrada.length} de ` : ""}
                  {progressao.length}{" "}
                  {progressao.length === 1 ? "exercício" : "exercícios"}
                </span>
              </div>

              <Input
                tipo="busca"
                value={buscaExercicio}
                onChange={(evento) => setBuscaExercicio(evento.target.value)}
                placeholder="Buscar exercício..."
                ariaLabel="Buscar exercício nas estatísticas"
                aoLimpar={() => setBuscaExercicio("")}
              />

              {filtrosExercicioChips}

              <span className="sr-only" aria-live="polite">
                {progressaoFiltrada.length}{" "}
                {progressaoFiltrada.length === 1
                  ? "exercício encontrado"
                  : "exercícios encontrados"}
              </span>

              {progressaoFiltrada.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {progressaoFiltrada.map((item) => (
                    <ItemProgressaoExercicio
                      key={item.exercicioId}
                      progressao={item}
                      aoClicar={(exercicioId) =>
                        aoNavegar("graficoProgressao", { exercicioId })
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-borda px-4 py-7 text-center">
                  <p className="text-sm text-texto-secundario">
                    Nenhum exercício encontrado.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBuscaExercicio("");
                      setGrupoMuscular(null);
                    }}
                    className="mt-2 min-h-[36px] text-sm font-medium text-acento hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="py-6 text-center text-sm text-texto-sutil">
              Nenhum exercício registrado ainda.
            </p>
          )}
        </section>
      )}

      {/* ── Cardio: totalizadores + busca + progressão ── */}
      {abaAtivaEfetiva === "cardio" && temCardio && (
        <section className="space-y-3 reveal-up" key="cardio">
          {progressaoCardio.length > 0 && (
            <>
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xs text-texto-sutil tabular-nums">
                  {buscaCardio.trim().length > 0
                    ? `${progressaoCardioFiltrada.length} de `
                    : ""}
                  {progressaoCardio.length}{" "}
                  {progressaoCardio.length === 1 ? "modalidade" : "modalidades"}
                </span>
              </div>

              <Input
                tipo="busca"
                value={buscaCardio}
                onChange={(evento) => setBuscaCardio(evento.target.value)}
                placeholder="Buscar modalidade..."
                ariaLabel="Buscar modalidade de cardio"
                aoLimpar={() => setBuscaCardio("")}
              />

              {progressaoCardioFiltrada.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {progressaoCardioFiltrada.map((item) => (
                    <button
                      key={item.idGrafico}
                      type="button"
                      onClick={() =>
                        aoNavegar("graficoProgressao", { exercicioId: item.idGrafico })
                      }
                      className="flex min-h-[72px] items-center gap-3 rounded-[12px] border border-borda bg-superficie px-4 py-3 text-left transition-colors hover:bg-superficie-hover"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-lg">
                        {item.emoji || <Icone nome="coracao" tamanho={16} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-texto-primario">
                          {item.nome}
                        </span>
                        <span className="mt-1 block truncate text-xs text-texto-sutil">
                          {item.rotuloMetrica} · {item.totalSessoes}{" "}
                          {item.totalSessoes === 1 ? "sessão" : "sessões"}
                        </span>
                      </span>
                      <span className="text-right text-xs text-texto-sutil">
                        <span className="block font-semibold text-texto-secundario">
                          {formatarValorCardio(item)}
                        </span>
                        <span className="block">último</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-borda px-4 py-7 text-center">
                  <p className="text-sm text-texto-secundario">
                    Nenhuma modalidade encontrada.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBuscaCardio("")}
                    className="mt-2 min-h-[36px] text-sm font-medium text-acento hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function formatarRitmo(segundos: number) {
  const total = Math.max(0, Math.round(segundos));
  const minutos = Math.floor(total / 60);
  const restoSegundos = String(total % 60).padStart(2, "0");
  return `${minutos}:${restoSegundos}`;
}

function formatarValorCardio(item: ProgressaoCardio) {
  if (item.metrica === "ritmo500m") return `${formatarRitmo(item.ultimoValor)}/500m`;
  if (item.metrica === "distanciaKm") return `${formatarNumeroBR(item.ultimoValor, 2)} km`;
  return formatarNumeroBR(item.ultimoValor);
}
