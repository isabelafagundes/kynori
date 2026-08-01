import { useMemo, type ReactNode } from "react";
import type { Ficha, Programa, RegistroTreino } from "@/domain/tipos";
import { exerciciosPadrao } from "@/infrastructure/repo/mock/exercicio-mock.repo";
import {
  calcularRecordeStreak,
  calcularStreakAtual,
  calcularTempoTotalMinutos,
  calcularTreinosNoMes,
  calcularVolumeTotalKg,
  construirDadosFrequencia,
} from "@/interface/page/area-logada/estatisticas/utils";
import {
  obterFichasDoPrograma,
  obterFichasTreinadasNaSemana,
  obterProximaFichaId,
  obterUltimoTreinoDaFicha,
} from "@/interface/page/area-logada/programa/utils";
import { BarraProgressoSemanal } from "@/interface/widget/programa/BarraProgressoSemanal";
import { LinhaFicha } from "@/interface/widget/ficha/LinhaFicha";
import { CardProximoTreino } from "@/interface/widget/ficha/CardProximoTreino";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";
import { CardSequencia } from "@/interface/widget/calendario/CardSequencia";
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
  /** Nome do perfil para a saudação; sem ele a saudação fica genérica. */
  nomeUsuario?: string;
  aoNavegar: (destino: string, params?: Record<string, string>) => void;
}

function saudacaoPorHora(agora: Date): string {
  const hora = agora.getHours();
  if (hora < 5) return "Boa noite";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** "2h10" para uma hora ou mais, "45min" abaixo disso. */
function formatarTempoTotal(minutos: number): string {
  const total = Math.round(minutos);
  const horas = Math.floor(total / 60);
  if (horas === 0) return `${total}min`;
  return `${horas}h${String(total % 60).padStart(2, "0")}`;
}

/** "3,2t" a partir de uma tonelada, "480kg" abaixo disso. */
function formatarVolumeTotal(kg: number): string {
  if (kg >= 1000) {
    const toneladas = (kg / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    });
    return `${toneladas}t`;
  }
  return `${Math.round(kg)}kg`;
}

function TileMetrica({
  icone,
  valor,
  rotulo,
}: {
  icone: ReactNode;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-borda bg-superficie px-2 py-4 text-center">
      <span className="text-texto-sutil" aria-hidden="true">
        {icone}
      </span>
      <span className="font-display text-xl font-bold leading-none tabular-nums text-texto-primario">
        {valor}
      </span>
      <span className="text-[11px] leading-tight text-texto-sutil">{rotulo}</span>
    </div>
  );
}

export function HomePage({
  programas,
  fichas,
  historico,
  metaSemanal,
  nomeUsuario,
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

  const hoje = useMemo(() => new Date(), []);
  const primeiroNome = nomeUsuario?.trim().split(/\s+/)[0];
  const saudacao = saudacaoPorHora(hoje);

  // Métricas da faixa de tiles (mobile) e do painel "Sua evolução" (desktop) —
  // mesma fonte das Estatísticas.
  const streakAtual = useMemo(() => calcularStreakAtual(historico, hoje), [historico, hoje]);
  const recordeStreak = useMemo(() => calcularRecordeStreak(historico), [historico]);
  const treinosNoMes = useMemo(() => calcularTreinosNoMes(historico, hoje), [historico, hoje]);
  const tempoTotalMinutos = useMemo(() => calcularTempoTotalMinutos(historico), [historico]);
  const volumeTotalKg = useMemo(() => calcularVolumeTotalKg(historico), [historico]);
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
  // sugestão de "próximo treino". Ela também aparece na lista do programa —
  // lá a lista é o inventário completo, com o progresso semanal por cima.
  const proximaFicha =
    fichasDoPrograma.find((ficha) => ficha.id === proximaFichaId) ?? null;

  const programaConcluido =
    fichasDoPrograma.length > 0 &&
    fichasTreinadasSemana.size >= fichasDoPrograma.length;
  const porcentagemSemana =
    fichasDoPrograma.length > 0
      ? Math.round((fichasTreinadasSemana.size / fichasDoPrograma.length) * 100)
      : 0;

  const cabecalhoSaudacao = (
    <header className="reveal-up">
      <h1 className="font-display text-2xl font-bold leading-tight text-texto-primario">
        {saudacao}
        {primeiroNome ? `, ${primeiroNome}` : ""}
      </h1>
      <p className="mt-1 text-sm text-texto-sutil">Que tal mais um treino hoje?</p>
    </header>
  );

  if (!programaAtivo) {
    return (
      <div className="space-y-5 px-4 py-4">
        {cabecalhoSaudacao}
        <section className="reveal-up" style={{ animationDelay: "90ms" }}>
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
    <div className="space-y-5 px-4 py-4">
      {cabecalhoSaudacao}

      {/* No desktop (lg) a home vira dashboard de 2 colunas: ação à esquerda,
          painel "Sua evolução" à direita. Abaixo de lg segue coluna única. */}
      <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-6 lg:items-start">
        {/* ══ Coluna de ação ══ */}
        <div className="space-y-5">
          {/* ── Próximo treino (ação primeiro) ──
              Elemento dominante da coluna: hierarquia por tamanho, não por
              container. */}
          {proximaFicha && (
            <section
              className="reveal-up space-y-2"
              style={{ animationDelay: "60ms" }}
            >
              <h2 className="px-1 font-display text-xs font-semibold uppercase tracking-wide text-texto-sutil">
                Seu próximo treino
              </h2>
              <CardProximoTreino
                ref={alvoIniciarTreino}
                ficha={proximaFicha}
                exerciciosCatalogo={exerciciosPadrao}
                aoIniciarTreino={(fichaId) => aoNavegar("execucao", { fichaId })}
              />
            </section>
          )}

          {/* ── Sequência da semana — só abaixo de lg; no desktop a sequência
              vira um card no painel de evolução. ── */}
          <section className="reveal-up lg:hidden" style={{ animationDelay: "90ms" }}>
            <CardSequencia
              dados={dadosFrequencia}
              metaSemanal={metaSemanal}
              aoAbrirDetalhe={() => aoNavegar("detalheSequencia")}
            />
          </section>

          {/* ── Faixa de totalizadores — só abaixo de lg; no desktop essas
              leituras vivem no painel "Sua evolução". ── */}
          <section
            className="reveal-up grid grid-cols-3 gap-3 lg:hidden"
            style={{ animationDelay: "120ms" }}
            aria-label="Resumo do seu progresso"
          >
            <TileMetrica
              icone={<Icone nome="halter" tamanho={16} />}
              valor={String(treinosNoMes)}
              rotulo="treinos no mês"
            />
            <TileMetrica
              icone={<Icone nome="relogio" tamanho={16} />}
              valor={formatarTempoTotal(tempoTotalMinutos)}
              rotulo="tempo total"
            />
            <TileMetrica
              icone={<Icone nome="raio" tamanho={16} />}
              valor={formatarVolumeTotal(volumeTotalKg)}
              rotulo="volume levantado"
            />
          </section>

          {/* ── Card do programa: cabeçalho com progresso + inventário de
              fichas + link para o resumo completo ── */}
          <section
            className="reveal-up overflow-hidden rounded-2xl border border-borda bg-superficie"
            style={{ animationDelay: "150ms" }}
          >
            {/* Cabeçalho — abre o resumo do programa em tela cheia */}
            <button
              type="button"
              onClick={() => aoNavegar("resumoPrograma", { id: programaAtivo.id })}
              aria-label={`Ver resumo de ${programaAtivo.nome}`}
              className="block w-full px-4 py-4 text-left transition-colors duration-200 hover:bg-superficie-suave active:bg-superficie-suave/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="min-w-0 truncate font-display text-lg font-bold leading-tight text-texto-primario">
                  {programaAtivo.nome}
                </h2>
                {programaConcluido && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-acento-suave px-2 py-1 text-[11px] font-semibold leading-none text-texto-secundario">
                    <Icone nome="check" tamanho={11} />
                    Concluído
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-texto-sutil">
                {fichasDoPrograma.length}{" "}
                {fichasDoPrograma.length === 1 ? "ficha" : "fichas"}
              </p>

              {fichasDoPrograma.length > 0 && (
                <div className="mt-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-xs tabular-nums text-texto-sutil">
                      {fichasTreinadasSemana.size}/{fichasDoPrograma.length} esta
                      semana
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums leading-none ${
                        programaConcluido ? "text-acento" : "text-texto-secundario"
                      }`}
                    >
                      {porcentagemSemana}%
                    </span>
                  </div>
                  <BarraProgressoSemanal
                    concluidas={fichasTreinadasSemana.size}
                    total={fichasDoPrograma.length}
                  />
                </div>
              )}
            </button>

            {/* Inventário: TODAS as fichas do programa, inclusive a já
                destacada acima — aqui a leitura é "do que o programa é
                feito", não "o que fazer agora". */}
            {fichasDoPrograma.length === 0 ? (
              <div className="border-t border-borda-suave px-4 py-8 text-center">
                <p className="text-sm text-texto-sutil">
                  Nenhuma ficha adicionada ao programa ainda.
                </p>
              </div>
            ) : (
              fichasDoPrograma.map((ficha, i) => (
                <div
                  key={ficha.id}
                  className="reveal-up border-t border-borda-suave"
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <LinhaFicha
                    ficha={ficha}
                    exerciciosCatalogo={exerciciosPadrao}
                    ultimoTreino={obterUltimoTreinoDaFicha(ficha.id, historico)}
                    aoIniciarTreino={(fichaId) => aoNavegar("execucao", { fichaId })}
                    aoAdicionarItens={(fichaId) =>
                      aoNavegar("editarFicha", {
                        id: fichaId,
                        programaId: programaAtivo.id,
                      })
                    }
                  />
                </div>
              ))
            )}

            <button
              type="button"
              onClick={() => aoNavegar("resumoPrograma", { id: programaAtivo.id })}
              className="flex w-full items-center justify-center gap-1 border-t border-borda-suave px-4 py-3 text-sm font-medium text-texto-secundario transition-colors duration-200 hover:bg-superficie-suave hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento"
            >
              Ver programa completo
              <Icone nome="setaDireita" tamanho={14} />
            </button>
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
