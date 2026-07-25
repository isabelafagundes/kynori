import { useMemo } from "react";
import type { Ficha, Programa, RegistroTreino } from "@/domain/tipos";
import { exerciciosPadrao } from "@/infrastructure/repo/mock/exercicio-mock.repo";
import {
  calcularRecordeStreak,
  calcularStreakAtual,
  calcularTreinosNoMes,
  construirDadosFrequencia,
} from "@/interface/page/area-logada/estatisticas/utils";
import {
  obterFichasDoPrograma,
  obterFichasTreinadasNaSemana,
  obterProximaFichaId,
  obterUltimoTreinoDaFicha,
} from "@/interface/page/area-logada/programa/utils";
import { BannerPrograma } from "@/interface/widget/programa/BannerPrograma";
import { LinhaFicha } from "@/interface/widget/ficha/LinhaFicha";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";
import { StripSemanal } from "@/interface/widget/calendario/StripSemanal";
import { useAlvoTutorial } from "@/interface/widget/tutorial/TutorialProvider";
import { CardMetricaResumo } from "@/interface/page/area-logada/estatisticas/CardMetricaResumo";
import { GraficoMaiorEvolucao } from "@/interface/widget/grafico/GraficoMaiorEvolucao";
import { GraficoVolumeSemanal } from "@/interface/widget/grafico/GraficoVolumeSemanal";

interface PropriedadesHomePage {
  programas: Programa[];
  fichas: Ficha[];
  historico: RegistroTreino[];
  /** Meta de treinos por semana do perfil; sem ela o strip usa 7. */
  metaSemanal?: number;
  aoNavegar: (destino: string, params?: Record<string, string>) => void;
}

export function HomePage({
  programas,
  fichas,
  historico,
  metaSemanal,
  aoNavegar,
}: PropriedadesHomePage) {
  const programaAtivo = programas.find((p) => p.ativo) ?? null;
  const alvoCriarPrograma = useAlvoTutorial("home-criar-programa");
  const alvoIniciarTreino = useAlvoTutorial("home-iniciar-treino");

  // Frequência derivada do histórico real (mesma fonte da tela de Estatísticas),
  // para que o streak da home fique consistente com as estatísticas.
  const dadosFrequencia = useMemo(
    () => construirDadosFrequencia(historico),
    [historico],
  );

  // Métricas do painel "Sua evolução" (só desktop) — mesma fonte das Estatísticas.
  const hoje = useMemo(() => new Date(), []);
  const streakAtual = useMemo(() => calcularStreakAtual(historico, hoje), [historico, hoje]);
  const recordeStreak = useMemo(() => calcularRecordeStreak(historico), [historico]);
  const treinosNoMes = useMemo(() => calcularTreinosNoMes(historico, hoje), [historico, hoje]);
  const mesNome = useMemo(() => {
    const nome = hoje.toLocaleDateString("pt-BR", { month: "long" });
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }, [hoje]);

  const fichasDoPrograma = programaAtivo
    ? obterFichasDoPrograma(programaAtivo, fichas)
    : [];

  const fichasTreinadasSemana = obterFichasTreinadasNaSemana(fichasDoPrograma, historico);
  const proximaFichaId = obterProximaFichaId(fichasDoPrograma, historico);

  // Ação acima de informação: a próxima ficha sobe para o topo como
  // sugestão de "próximo treino". O card do programa lista TODAS as fichas
  // — o usuário pode optar por treinar outra ficha hoje.
  const proximaFicha =
    fichasDoPrograma.find((ficha) => ficha.id === proximaFichaId) ?? null;

  if (!programaAtivo) {
    return (
      <div className="px-4 py-4">
        <section className="reveal-up">
          <EstadoVazio
            icone="halter"
            titulo="Comece sua jornada 💪"
            descricao="Organize seus treinos, acompanhe seu progresso e mantenha a constância."
            acao={
              <Botao
                ref={alvoCriarPrograma}
                variante="primario"
                icone={<Icone nome="mais" tamanho={16} />}
                onClick={() => aoNavegar("criarPrograma")}
              >
                Criar primeiro programa
              </Botao>
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* No desktop (lg) a home vira dashboard de 2 colunas: ação à esquerda,
          painel "Sua evolução" à direita. Abaixo de lg segue coluna única. */}
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-6 lg:items-start">
        {/* ══ Coluna de ação ══ */}
        <div className="space-y-5">
          {/* ── Próximo treino (ação primeiro) ── */}
          {proximaFicha && (
            <section className="reveal-up space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-texto-sutil font-display">
                Seu próximo treino
              </h2>
              <div
                ref={alvoIniciarTreino}
                className="rounded-2xl overflow-hidden bg-superficie border border-borda"
              >
                <LinhaFicha
                  ficha={proximaFicha}
                  exerciciosCatalogo={exerciciosPadrao}
                  ultimoTreino={obterUltimoTreinoDaFicha(proximaFicha.id, historico)}
                  proximoTreino
                  aoIniciarTreino={(fichaId) => aoNavegar("execucao", { fichaId })}
                />
              </div>
            </section>
          )}

          {/* ── Resumo semanal (sutil) — só abaixo de lg; no desktop a sequência
              vira um card no painel de evolução ── */}
          <section className="reveal-up lg:hidden" style={{ animationDelay: "90ms" }}>
            <StripSemanal
              dados={dadosFrequencia}
              metaSemanal={metaSemanal}
              aoAbrirDetalhe={() => aoNavegar("detalheSequencia")}
            />
          </section>

          {/* ── Programa: banner + demais fichas ── */}
          <section
            className="rounded-2xl overflow-hidden bg-superficie border border-borda reveal-up"
            style={{ animationDelay: "150ms" }}
          >
            {/* Banner header — abre o resumo do programa em tela cheia */}
            <button
              type="button"
              onClick={() => aoNavegar("resumoPrograma", { id: programaAtivo.id })}
              aria-label={`Ver resumo de ${programaAtivo.nome}`}
              className="w-full flex items-center gap-3 px-4 py-5 text-left border-b border-borda-suave transition-colors duration-200 hover:bg-superficie-suave active:bg-superficie-suave/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento"
            >
              <BannerPrograma
                nome={programaAtivo.nome}
                descricao={programaAtivo.descricao}
                totalFichas={fichasDoPrograma.length}
                fichasConcluidas={fichasTreinadasSemana.size}
              />
              <span className="flex-shrink-0 self-center text-texto-sutil" aria-hidden="true">
                <Icone nome="setaDireita" tamanho={18} />
              </span>
            </button>

            {fichasDoPrograma.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-texto-sutil">
                  Nenhuma ficha adicionada ao programa ainda.
                </p>
              </div>
            ) : (
              fichasDoPrograma.map((ficha, i) => (
                <div
                  key={ficha.id}
                  className={`reveal-up ${
                    i < fichasDoPrograma.length - 1
                      ? "border-b border-borda-suave"
                      : ""
                  }`}
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <LinhaFicha
                    ficha={ficha}
                    exerciciosCatalogo={exerciciosPadrao}
                    ultimoTreino={obterUltimoTreinoDaFicha(ficha.id, historico)}
                    proximoTreino={false}
                    aoIniciarTreino={(fichaId) => aoNavegar("execucao", { fichaId })}
                  />
                </div>
              ))
            )}
          </section>
        </div>

        {/* ══ Painel "Sua evolução" — só desktop ══ */}
        <aside
          className="hidden lg:flex lg:flex-col lg:gap-3 reveal-up"
          style={{ animationDelay: "120ms" }}
          aria-label="Sua evolução"
        >
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-texto-sutil font-display">
              Sua evolução
            </h2>
            <button
              type="button"
              onClick={() => aoNavegar("estatisticas")}
              className="inline-flex items-center gap-1 text-xs font-medium text-texto-sutil transition-colors hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento rounded"
            >
              Ver tudo
              <Icone nome="setaDireita" tamanho={13} />
            </button>
          </div>

          <GraficoMaiorEvolucao
            historico={historico}
            exercicios={exerciciosPadrao}
            aoVerExercicio={(exercicioId) => aoNavegar("graficoProgressao", { exercicioId })}
            altura={140}
          />

          <div className="grid grid-cols-2 gap-3">
            <CardMetricaResumo
              rotulo="Sequência"
              valor={streakAtual}
              sufixo={streakAtual === 1 ? "dia" : "dias"}
              icone={<Icone nome="fogo" tamanho={14} />}
              destaque={
                recordeStreak > 0
                  ? `recorde: ${recordeStreak} ${recordeStreak === 1 ? "dia" : "dias"}`
                  : undefined
              }
            />
            <CardMetricaResumo
              rotulo={`Treinos em ${mesNome}`}
              valor={treinosNoMes}
              sufixo={treinosNoMes === 1 ? "treino" : "treinos"}
              icone={<Icone nome="halter" tamanho={14} />}
            />
          </div>

          <GraficoVolumeSemanal historico={historico} altura={140} />
        </aside>
      </div>
    </div>
  );
}
