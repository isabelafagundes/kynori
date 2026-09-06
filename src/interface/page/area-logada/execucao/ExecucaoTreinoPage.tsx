import { useEffect, useMemo, useRef, useState } from "react";
import type { Ficha, RegistroTreino } from "@/domain/tipos";
import { ehTreinoLivre } from "@/domain/treino-livre";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { Icone } from "@/interface/widget/svg/Icone";
import { Botao } from "@/interface/widget/botao/Botao";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { appModule } from "@/interface/configuration/module/app.module";
import { HeaderExecucao } from "./HeaderExecucao";
import { ChipsItens } from "./ChipsItens";
import { RailItens } from "./RailItens";
import { CardSeries } from "./CardSeries";
import { CardRegistroCardio } from "./CardRegistroCardio";
import { HistoricoCardio } from "./HistoricoCardio";
import { NotaExercicio } from "./NotaExercicio";
import { AccordionProgressao } from "./AccordionProgressao";
import { TimerDescansoInline } from "./TimerDescansoInline";
import { ToastDesfazer } from "./ToastDesfazer";
import { OverlayConfirmarFinalizar } from "./OverlayConfirmarFinalizar";
import { OverlayFinalizado, type EtapaResultado } from "./OverlayFinalizado";
import { OverlayConfirmarCancelar } from "./OverlayConfirmarCancelar";
import { OverlayHistoricoSerie } from "./OverlayHistoricoSerie";
import { OverlayGraficoProgressao } from "./OverlayGraficoProgressao";
import { OverlayTrocarExercicio } from "./OverlayTrocarExercicio";
import { OverlayAdicionarExercicio } from "./OverlayAdicionarExercicio";
import { OverlayPularExercicio } from "./OverlayPularExercicio";
import { useSessaoTreino, type EntradaExercicioAdicionado } from "./hooks/useSessaoTreino";
import { useTimerDescanso } from "./hooks/useTimerDescanso";
import { useInterceptarVoltar } from "./hooks/useInterceptarVoltar";
import { usePreferenciasExecucao } from "@/interface/hook/usePreferenciasExecucao";
import { nomeDoItem } from "./nomeItem";
import { ativacoesDoExercicio } from "@/domain/ativacao-muscular";
import { MapaMuscular } from "@/interface/widget/musculatura/MapaMuscular";

interface ExecucaoTreinoPageProps {
  ficha: Ficha;
  historico: RegistroTreino[];
  aoVoltar: () => void;
}

/** Espera antes do avanço automático, pra dar tempo do check animar. */
const MS_AVANCO_AUTOMATICO = 450;

/** Execução de treino paginada por item da ficha (exercício ou cardio, na
    ordem definida na criação). Mobile navega por chips + footer; no md+ os
    chips viram rail lateral; no lg+ entra o painel de contexto à direita. */
export function ExecucaoTreinoPage({ ficha, historico, aoVoltar }: ExecucaoTreinoPageProps) {
  const sessao = useSessaoTreino(ficha, historico);
  const treinoLivre = ehTreinoLivre(ficha.id);
  const segundosDescanso = sessao.configuracaoAtual?.descansoSegundos ?? 0;
  const timer = useTimerDescanso(segundosDescanso);
  const { resetar: resetarTimer, rodando: timerRodando, segundosRestantes: timerSegundosRestantes } = timer;

  const preferencias = usePreferenciasExecucao();
  // Lido via ref para não recriar callbacks/efeitos a cada mudança de preferência.
  const preferenciasRef = useRef(preferencias);
  useEffect(() => {
    preferenciasRef.current = preferencias;
  }, [preferencias]);

  // Feedback tátil gated pela preferência de vibração (referência estável).
  const feedbackTatil = useMemo(
    () => ({
      impactoMedio: () => {
        if (preferenciasRef.current.vibracao) void appModule.feedbackTatil.impactoMedio();
      },
      sucesso: () => {
        if (preferenciasRef.current.vibracao) void appModule.feedbackTatil.sucesso();
      },
    }),
    []
  );

  const [confirmarFinalizarAberto, setConfirmarFinalizarAberto] = useState(false);
  const [confirmarCancelarAberto, setConfirmarCancelarAberto] = useState(false);
  const [serieHistoricoAlvo, setSerieHistoricoAlvo] = useState<number | null>(null);
  const [graficoAberto, setGraficoAberto] = useState(false);
  const [mapaMuscularAberto, setMapaMuscularAberto] = useState(false);
  const [trocarExercicioAberto, setTrocarExercicioAberto] = useState(false);
  const [adicionarExercicioAberto, setAdicionarExercicioAberto] = useState(false);
  const [pularExercicioAberto, setPularExercicioAberto] = useState(false);
  const [desfazerAlvo, setDesfazerAlvo] = useState<{
    texto: string;
    executar: () => void;
  } | null>(null);
  const [finalizadoAberto, setFinalizadoAberto] = useState(false);
  const [registroFinalizado, setRegistroFinalizado] = useState<RegistroTreino | null>(null);
  const [etapaResultado, setEtapaResultado] = useState<EtapaResultado>("celebracao");
  const rodandoAnterior = useRef(false);

  // "Voltar" (back do navegador ou físico do Android) não pode sair direto pra
  // home: primeiro fecha algum overlay aberto; senão, pede confirmação de
  // abandono — a mesma do kebab. Inativo quando o treino já foi finalizado
  // (aí o "Concluir" do overlay de fim é quem leva embora).
  useInterceptarVoltar(true, () => {
    if (finalizadoAberto) {
      if (etapaResultado === "editor") return setEtapaResultado("resumo");
      if (etapaResultado === "celebracao") return;
      return aoVoltar();
    }
    if (confirmarFinalizarAberto) return setConfirmarFinalizarAberto(false);
    if (serieHistoricoAlvo !== null) return setSerieHistoricoAlvo(null);
    if (graficoAberto) return setGraficoAberto(false);
    if (mapaMuscularAberto) return setMapaMuscularAberto(false);
    if (trocarExercicioAberto) return setTrocarExercicioAberto(false);
    if (adicionarExercicioAberto) return setAdicionarExercicioAberto(false);
    if (pularExercicioAberto) return setPularExercicioAberto(false);
    if (confirmarCancelarAberto) return setConfirmarCancelarAberto(false);
    setConfirmarCancelarAberto(true);
  });

  // Descanso terminou: feedback tátil e volta ao tempo programado. O card
  // permanece disponível para que o usuário possa iniciá-lo novamente.
  useEffect(() => {
    if (rodandoAnterior.current && !timerRodando && timerSegundosRestantes === 0) {
      feedbackTatil.sucesso();
      resetarTimer();
    }
    rodandoAnterior.current = timerRodando;
  }, [feedbackTatil, resetarTimer, timerRodando, timerSegundosRestantes]);

  const catalogo = stateManagerRepository.listarTodosExercicios();
  const tiposCardio = stateManagerRepository.listarTiposCardio();

  const historicoDaFicha = useMemo(
    () => historico.filter((registro) => registro.fichaId === ficha.id),
    [ficha.id, historico]
  );

  const itemAtual = sessao.itemAtual;
  const exercicioAtual = itemAtual?.tipo === "exercicio" ? itemAtual.exercicio : undefined;
  const cardioAtual = itemAtual?.tipo === "cardio" ? itemAtual : undefined;

  const statusAtual = sessao.statusItens[sessao.indiceAtual];
  const nomeAtual = statusAtual ? nomeDoItem(statusAtual, catalogo, tiposCardio).nome : "";
  const exercicioCatalogo = catalogo.find(
    (exercicio) => exercicio.id === exercicioAtual?.exercicioId
  );
  const exercicioPlanejadoCatalogo = catalogo.find(
    (exercicio) => exercicio.id === exercicioAtual?.exercicioPlanejadoId
  );
  const exercicioFoiSubstituido =
    exercicioAtual?.exercicioPlanejadoId !== undefined &&
    exercicioAtual.exercicioId !== exercicioAtual.exercicioPlanejadoId;
  const exercicioIdsIndisponiveis = useMemo(
    () =>
      sessao.itens.flatMap((item) =>
        item.tipo === "exercicio" ? [item.exercicio.exercicioId] : []
      ),
    [sessao.itens]
  );
  const grupoMuscular = exercicioCatalogo?.grupoMuscular;
  const ativacoes = exercicioCatalogo ? ativacoesDoExercicio(exercicioCatalogo) : [];

  const statusAnterior = sessao.indiceAtual > 0 ? sessao.statusItens[sessao.indiceAtual - 1] : undefined;
  const statusProximo = sessao.ultimoItem ? undefined : sessao.statusItens[sessao.indiceAtual + 1];
  const nomeAnterior = statusAnterior && nomeDoItem(statusAnterior, catalogo, tiposCardio).nome;
  const nomeProximo = statusProximo && nomeDoItem(statusProximo, catalogo, tiposCardio).nome;

  // Séries da última sessão deste exercício — rótulos da coluna "anterior".
  const seriesAnteriores = useMemo(() => {
    const id = exercicioAtual?.exercicioId;
    if (!id) return [];
    const registro = [...historicoDaFicha]
      .sort((a, b) => new Date(b.finalizadoEm).getTime() - new Date(a.finalizadoEm).getTime())
      .find((item) =>
        item.exercicios.some((exercicio) => exercicio.exercicioId === id && exercicio.series.length > 0)
      );
    return registro?.exercicios.find((exercicio) => exercicio.exercicioId === id)?.series ?? [];
  }, [historicoDaFicha, exercicioAtual?.exercicioId]);

  const cardioPrePreenchido = useMemo(
    () =>
      cardioAtual !== undefined &&
      historicoDaFicha.some((registro) =>
        registro.cardio.some((item) => item.tipo === cardioAtual.registro.tipo)
      ),
    [cardioAtual, historicoDaFicha]
  );

  // O timer fica sempre disponível nos exercícios que possuem descanso,
  // inclusive antes do primeiro check e depois do fim da contagem.
  const timerVisivel = exercicioAtual !== undefined && segundosDescanso > 0;

  const persistirFinalizacao = () => {
    const registro = sessao.finalizar();
    const registroSalvo = stateManagerRepository.adicionarTreino({
      fichaId: registro.fichaId,
      data: registro.data,
      iniciadoEm: registro.iniciadoEm,
      finalizadoEm: registro.finalizadoEm,
      exercicios: registro.exercicios,
      cardio: registro.cardio,
    });
    void sessao.encerrar();
    resetarTimer(); // para o descanso: sem isso ele re-renderiza a cada segundo.
    setRegistroFinalizado(registroSalvo);
    // Sem a animação, pula a celebração e vai direto ao resumo do treino.
    setEtapaResultado(preferencias.animacaoFinalizar ? "celebracao" : "resumo");
    setConfirmarFinalizarAberto(false);
    setFinalizadoAberto(true);
    feedbackTatil.sucesso();
  };

  const descartarTreino = () => {
    void sessao.encerrar();
    aoVoltar();
  };

  const solicitarFinalizacao = () => {
    if (sessao.resumoFinalizacao().completo) {
      persistirFinalizacao();
      return;
    }
    setConfirmarFinalizarAberto(true);
  };

  const concluirSerie = (indiceSerie: number) => {
    const indiceItem = sessao.indiceAtual;
    const jaConcluida = exercicioAtual?.concluidas.has(indiceSerie);
    sessao.marcarConcluida(indiceItem, indiceSerie);
    if (jaConcluida) return;

    feedbackTatil.impactoMedio();

    // O exercício fica completo com esta série? (concluidas ainda não refletiu
    // o marcarConcluida acima, então projeta o conjunto resultante.)
    const totalSeries = exercicioAtual?.series.length ?? 0;
    const concluidasProjetadas = new Set(exercicioAtual?.concluidas);
    concluidasProjetadas.add(indiceSerie);
    const exercicioCompleto = totalSeries > 0 && concluidasProjetadas.size === totalSeries;
    const podeAvancar =
      preferencias.avancoAutomatico && exercicioCompleto && !sessao.ultimoItem;

    if (podeAvancar) {
      // Não faz sentido descansar após a última série: avança para o próximo.
      window.setTimeout(() => sessao.proximo(), MS_AVANCO_AUTOMATICO);
    } else if (preferencias.descansoAutomatico && segundosDescanso > 0) {
      timer.reiniciar();
    }

    if (preferencias.avisoDesfazer) {
      setDesfazerAlvo({
        texto: `Série ${indiceSerie + 1} concluída`,
        executar: () => {
          sessao.marcarConcluida(indiceItem, indiceSerie);
          timer.resetar();
        },
      });
    }
  };

  const concluirCardio = (id: string) => {
    if (cardioAtual && !cardioAtual.concluido) {
      feedbackTatil.impactoMedio();
    }
    sessao.marcarCardioConcluido(id);
  };

  const trocarExercicio = (exercicioId: string, confirmarDescarte = false) => {
    const resultado = sessao.trocarExercicio(
      sessao.indiceAtual,
      exercicioId,
      confirmarDescarte
    );
    if (resultado === "trocado") {
      timer.resetar();
      feedbackTatil.impactoMedio();
    }
    return resultado;
  };

  const restaurarExercicio = (confirmarDescarte = false) => {
    const resultado = sessao.restaurarExercicioPlanejado(
      sessao.indiceAtual,
      confirmarDescarte
    );
    if (resultado === "trocado") {
      timer.resetar();
      feedbackTatil.impactoMedio();
    }
    return resultado;
  };

  const adicionarExercicios = (entradas: EntradaExercicioAdicionado[]) => {
    const resultados = sessao.adicionarExerciciosApos(
      sessao.itens.length === 0 ? -1 : sessao.indiceAtual,
      entradas
    );
    if (resultados.includes("adicionado")) {
      feedbackTatil.impactoMedio();
    }
    return resultados;
  };

  const confirmarPularExercicio = () => {
    const alteracao = sessao.pularExercicio(sessao.indiceAtual);
    if (!alteracao) return;
    timer.resetar();
    setPularExercicioAberto(false);
    setDesfazerAlvo({
      texto:
        alteracao.modo === "interrompido"
          ? "Exercício encerrado por hoje"
          : "Exercício pulado hoje",
      executar: () => sessao.desfazerPularExercicio(alteracao),
    });
    feedbackTatil.impactoMedio();
  };

  if (sessao.itens.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col text-texto-primario">
        <HeaderExecucao
          nomeFicha={ficha.nome}
          iconeFicha={ficha.icone}
          emojiFicha={ficha.emoji}
          iniciadoEm={sessao.iniciadoEm}
          progresso={sessao.progresso}
          temExercicioAtual={false}
          exercicioIniciado={false}
          treinoLivre={treinoLivre}
          aoTrocarExercicio={() => {}}
          aoPularExercicio={() => {}}
          aoAdicionarExercicio={() => setAdicionarExercicioAberto(true)}
          aoFinalizar={solicitarFinalizacao}
          aoAbandonar={() => setConfirmarCancelarAberto(true)}
        />
        <main className="grid flex-1 place-items-center px-5 py-10">
          <div className="w-full max-w-[420px] text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-acento-suave">
              <Icone nome={treinoLivre ? "raio" : "check"} tamanho={24} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold">
              {treinoLivre ? "Monte seu treino livre" : "Nenhum item restante hoje"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-texto-secundario">
              {treinoLivre
                ? "Adicione os exercícios que quiser, na ordem que quiser. Isso não altera seus programas."
                : "Você pode adicionar outro exercício ou finalizar o treino. A ficha original permanece intacta."}
            </p>
            <div className="mt-6 grid gap-2">
              <BotaoAcao
                icone="mais"
                ocuparLarguraTotal
                onClick={() => setAdicionarExercicioAberto(true)}
              >
                Adicionar exercício
              </BotaoAcao>
              {/* No livre não há o que finalizar antes do primeiro exercício —
                  a saída honesta é descartar, e ela fica à vista. */}
              {treinoLivre ? (
                <BotaoAcao
                  icone="lixeira"
                  variante="secundario"
                  ocuparLarguraTotal
                  onClick={descartarTreino}
                >
                  Descartar treino
                </BotaoAcao>
              ) : (
                <BotaoAcao
                  icone="check"
                  variante="secundario"
                  ocuparLarguraTotal
                  onClick={solicitarFinalizacao}
                >
                  Finalizar treino
                </BotaoAcao>
              )}
            </div>
          </div>
        </main>
        {adicionarExercicioAberto ? (
          <OverlayAdicionarExercicio
            exercicios={catalogo}
            exercicioIdsIndisponiveis={[]}
            treinoLivre={treinoLivre}
            sessaoVazia
            aoAdicionar={adicionarExercicios}
            aoFechar={() => setAdicionarExercicioAberto(false)}
          />
        ) : null}
        <OverlayConfirmarCancelar
          aberto={confirmarCancelarAberto}
          aoContinuar={() => setConfirmarCancelarAberto(false)}
          aoDescartar={descartarTreino}
        />
        <OverlayFinalizado
          aberto={finalizadoAberto}
          registro={registroFinalizado}
          ficha={ficha}
          catalogo={catalogo}
          etapa={etapaResultado}
          aoMudarEtapa={setEtapaResultado}
          aoConcluir={aoVoltar}
        />
        <ToastDesfazer
          mensagem={desfazerAlvo?.texto ?? null}
          aoDesfazer={() => desfazerAlvo?.executar()}
          aoFechar={() => setDesfazerAlvo(null)}
        />
      </div>
    );
  }

  const botaoProximo = (
    <Botao
      variante="secundario"
      ocuparLarguraTotal
      className="min-w-0 overflow-hidden"
      onClick={sessao.ultimoItem ? solicitarFinalizacao : sessao.proximo}
      aria-label={sessao.ultimoItem ? "Finalizar treino" : `Próximo exercício: ${nomeProximo}`}
    >
      <span className="min-w-0 flex-1 truncate">
        {sessao.ultimoItem ? "Finalizar treino" : nomeProximo}
      </span>
      <Icone nome="setaDireita" tamanho={15} className="shrink-0" />
    </Botao>
  );

  return (
    // Sem bg opaco: deixa o degradê quente do #root (index.css) aparecer.
    <div className="flex h-[100dvh] flex-col overflow-hidden text-texto-primario">
      <HeaderExecucao
        nomeFicha={ficha.nome}
        iconeFicha={ficha.icone}
        emojiFicha={ficha.emoji}
        iniciadoEm={sessao.iniciadoEm}
        progresso={sessao.progresso}
        temExercicioAtual={exercicioAtual !== undefined}
        exercicioIniciado={(exercicioAtual?.concluidas.size ?? 0) > 0}
        treinoLivre={treinoLivre}
        aoTrocarExercicio={() => setTrocarExercicioAberto(true)}
        aoPularExercicio={() => setPularExercicioAberto(true)}
        aoAdicionarExercicio={() => setAdicionarExercicioAberto(true)}
        aoFinalizar={solicitarFinalizacao}
        aoAbandonar={() => setConfirmarCancelarAberto(true)}
      />

      <div className="flex min-h-0 flex-1">
        <RailItens
          itens={sessao.statusItens}
          catalogo={catalogo}
          tiposCardio={tiposCardio}
          aoIrPara={sessao.irPara}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <ChipsItens
            itens={sessao.statusItens}
            catalogo={catalogo}
            tiposCardio={tiposCardio}
            aoIrPara={sessao.irPara}
            aoAdicionarExercicio={() => setAdicionarExercicioAberto(true)}
          />

          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-6 md:pt-4">
              <div className="mx-auto w-full max-w-[640px]">
                <h1 className="break-words font-display text-[clamp(24px,6.5vw,28px)] font-semibold leading-[1.1] text-texto-primario">
                  {nomeAtual}
                </h1>
                <p className="mt-1.5 text-[13px] text-texto-secundario">
                  {exercicioAtual && sessao.configuracaoAtual
                    ? `${grupoMuscular ?? "Grupo"} · ${sessao.configuracaoAtual.series}x${sessao.configuracaoAtual.repeticoes} · ${sessao.configuracaoAtual.descansoSegundos}s descanso`
                    : cardioPrePreenchido
                      ? "Cardio · valores da última sessão pré-preenchidos"
                      : "Cardio"}
                </p>
                {exercicioFoiSubstituido && exercicioPlanejadoCatalogo ? (
                  <p className="mt-1 inline-flex rounded-full bg-acento-suave px-2.5 py-1 text-xs text-texto-secundario">
                    Substitui {exercicioPlanejadoCatalogo.nome} somente hoje
                  </p>
                ) : null}
                {/* No livre todo exercício é "adicionado" — o selo não
                    distinguiria nada e só faria ruído. */}
                {exercicioAtual?.origem === "adicionado" && !treinoLivre ? (
                  <p className="mt-1 inline-flex rounded-full bg-acento-suave px-2.5 py-1 text-xs text-texto-secundario">
                    Adicionado somente hoje
                  </p>
                ) : null}

                {timerVisivel ? (
                  <div className="mt-3">
                    <TimerDescansoInline
                      tempoFormatado={timer.tempoFormatado}
                      segundosRestantes={timer.segundosRestantes}
                      segundosIniciais={segundosDescanso}
                      rodando={timer.rodando}
                      aoAlternar={timer.alternar}
                      aoPular={timer.resetar}
                    />
                  </div>
                ) : null}

                <div className="mt-3.5">
                  {exercicioAtual && sessao.configuracaoAtual ? (
                    <CardSeries
                      exercicio={exercicioAtual}
                      usaCarga={sessao.configuracaoAtual.usaCarga}
                      seriesAnteriores={seriesAnteriores}
                      aoAtualizarSerie={(indiceSerie, atualizacao) =>
                        sessao.atualizarSerie(sessao.indiceAtual, indiceSerie, atualizacao)
                      }
                      aoAdicionarSerie={() => sessao.adicionarSerie(sessao.indiceAtual)}
                      aoRemoverSerie={(indiceSerie) =>
                        sessao.removerSerie(sessao.indiceAtual, indiceSerie)
                      }
                      aoMarcarConcluida={concluirSerie}
                      aoAbrirHistorico={setSerieHistoricoAlvo}
                    />
                  ) : cardioAtual ? (
                    <CardRegistroCardio
                      registro={cardioAtual.registro}
                      tiposCardio={tiposCardio}
                      concluido={cardioAtual.concluido}
                      aoAtualizar={(atualizacao) =>
                        sessao.atualizarCardio(cardioAtual.registro.cardioId, atualizacao)
                      }
                      aoConcluir={() => concluirCardio(cardioAtual.registro.cardioId)}
                    />
                  ) : null}
                </div>

                {/* Nota/progressão colapsadas — no lg+ vivem abertas no painel */}
                <div className="mt-3 space-y-3 lg:hidden">
                  {exercicioAtual ? (
                    <>
                      <NotaExercicio
                        nota={exercicioAtual.nota}
                        aoAtualizar={(nota) => sessao.atualizarNota(sessao.indiceAtual, nota)}
                      />
                      <AccordionProgressao
                        exercicioId={exercicioAtual.exercicioId}
                        historico={historicoDaFicha}
                        aoAbrirGrafico={() => setGraficoAberto(true)}
                      />
                    </>
                  ) : cardioAtual ? (
                    <NotaExercicio
                      nota={cardioAtual.registro.nota}
                      aoAtualizar={(nota) =>
                        sessao.atualizarCardio(cardioAtual.registro.cardioId, { nota })
                      }
                      rotulo="nota desta atividade"
                    />
                  ) : null}
                </div>

                {/* Próximo inline (md+): o rail cobre o "Anterior" */}
                <div className="mt-4 hidden md:block">{botaoProximo}</div>

                {exercicioAtual && (
                  <button
                    type="button"
                    onClick={() => setMapaMuscularAberto(true)}
                    className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-2xl border border-borda bg-superficie px-3 py-3 text-left text-[13px] font-medium text-texto-secundario transition-colors duration-150 hover:text-texto-primario lg:hidden"
                  >
                    <Icone nome="humano" tamanho={15} />
                    <span>músculos atingidos</span>
                    <span className="flex-1" />
                    <Icone nome="setaDireita" tamanho={14} className="shrink-0" />
                  </button>
                )}
              </div>
            </main>

            {/* Painel de contexto (lg+): o que no mobile é accordion, aberto */}
            <aside className="hidden w-[clamp(340px,30vw,480px)] shrink-0 space-y-3 overflow-y-auto py-4 pl-1 pr-5 lg:block">
              {exercicioAtual ? (
                <>
                  <MapaMuscular ativacoes={ativacoes} amplo />
                  <AccordionProgressao
                    exercicioId={exercicioAtual.exercicioId}
                    historico={historicoDaFicha}
                    aoAbrirGrafico={() => setGraficoAberto(true)}
                    variante="aberta"
                  />
                  <NotaExercicio
                    nota={exercicioAtual.nota}
                    aoAtualizar={(nota) => sessao.atualizarNota(sessao.indiceAtual, nota)}
                    variante="aberta"
                  />
                </>
              ) : cardioAtual ? (
                <>
                  <HistoricoCardio historico={historicoDaFicha} tiposCardio={tiposCardio} />
                  <NotaExercicio
                    nota={cardioAtual.registro.nota}
                    aoAtualizar={(nota) =>
                      sessao.atualizarCardio(cardioAtual.registro.cardioId, { nota })
                    }
                    rotulo="nota desta atividade"
                    variante="aberta"
                  />
                </>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      {/* Footer mobile: navegação entre itens. Abandonar saiu daqui (zona do
          dedão) e virou item do kebab no header. */}
      <footer className="border-t border-borda-suave bg-fundo/95 px-4 pb-[calc(var(--safe-bottom)+18px)] pt-2.5 backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Botao
            variante="secundario"
            ocuparLarguraTotal
            className="min-w-0 overflow-hidden"
            disabled={sessao.indiceAtual === 0}
            onClick={sessao.anterior}
            icone={<Icone nome="setaEsquerda" tamanho={15} className="shrink-0" />}
          >
            <span className="min-w-0 flex-1 truncate">{nomeAnterior ?? "Anterior"}</span>
          </Botao>
          {botaoProximo}
        </div>
      </footer>

      {mapaMuscularAberto && exercicioAtual && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mapa-muscular-title"
        >
          <button
            type="button"
            aria-label="Fechar mapa muscular"
            className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-sm"
            onClick={() => setMapaMuscularAberto(false)}
          />
          <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-borda bg-superficie shadow-xl sm:max-w-[460px] sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-borda-suave px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">Músculos atingidos</p>
                <h2 id="mapa-muscular-title" className="mt-0.5 truncate font-display text-xl font-semibold text-texto-primario">{nomeAtual}</h2>
              </div>
              <button type="button" onClick={() => setMapaMuscularAberto(false)} className="-mr-2 rounded-lg p-2 text-texto-secundario hover:bg-superficie-suave" aria-label="Fechar">
                <Icone nome="fechar" tamanho={20} />
              </button>
            </div>
            <div className="p-5">
              <MapaMuscular ativacoes={ativacoes} className="border-0 bg-transparent p-0" />
              <p className="mt-4 text-center text-xs leading-relaxed text-texto-sutil">Quanto mais intensa a cor, maior a participação estimada do músculo no exercício.</p>
            </div>
            <div className="border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
              <Botao variante="primario" ocuparLarguraTotal onClick={() => setMapaMuscularAberto(false)}>Fechar</Botao>
            </div>
          </div>
        </div>
      )}

      {trocarExercicioAberto && exercicioAtual && exercicioCatalogo ? (
        <OverlayTrocarExercicio
          aberto={trocarExercicioAberto}
          exercicioAtual={exercicioCatalogo}
          exercicioPlanejado={exercicioPlanejadoCatalogo}
          exercicios={catalogo}
          exercicioIdsIndisponiveis={exercicioIdsIndisponiveis}
          iniciado={exercicioAtual.concluidas.size > 0}
          aoTrocar={trocarExercicio}
          aoRestaurar={exercicioPlanejadoCatalogo ? restaurarExercicio : undefined}
          aoFechar={() => setTrocarExercicioAberto(false)}
        />
      ) : null}

      {adicionarExercicioAberto ? (
        <OverlayAdicionarExercicio
          exercicios={catalogo}
          exercicioIdsIndisponiveis={exercicioIdsIndisponiveis}
          grupoInicial={grupoMuscular}
          treinoLivre={treinoLivre}
          aoAdicionar={adicionarExercicios}
          aoFechar={() => setAdicionarExercicioAberto(false)}
        />
      ) : null}

      {pularExercicioAberto && exercicioAtual ? (
        <OverlayPularExercicio
          nomeExercicio={nomeAtual}
          seriesConcluidas={exercicioAtual.concluidas.size}
          seriesTotal={exercicioAtual.series.length}
          aoConfirmar={confirmarPularExercicio}
          aoFechar={() => setPularExercicioAberto(false)}
        />
      ) : null}

      <OverlayConfirmarFinalizar
        aberto={confirmarFinalizarAberto}
        resumo={sessao.resumoFinalizacao()}
        aoContinuar={() => setConfirmarFinalizarAberto(false)}
        aoFinalizar={persistirFinalizacao}
      />
      <OverlayConfirmarCancelar
        aberto={confirmarCancelarAberto}
        aoContinuar={() => setConfirmarCancelarAberto(false)}
        aoDescartar={descartarTreino}
      />
      {exercicioAtual && (
        <OverlayHistoricoSerie
          aberto={serieHistoricoAlvo !== null}
          exercicioId={exercicioAtual.exercicioId}
          historico={historicoDaFicha}
          aoFechar={() => setSerieHistoricoAlvo(null)}
          aoSelecionar={(serie) => {
            if (serieHistoricoAlvo !== null) sessao.preencherDoHistorico(serieHistoricoAlvo, serie);
            setSerieHistoricoAlvo(null);
          }}
        />
      )}
      {exercicioAtual && (
        <OverlayGraficoProgressao
          aberto={graficoAberto}
          aoFechar={() => setGraficoAberto(false)}
          exercicioId={exercicioAtual.exercicioId}
          exercicios={catalogo}
          historico={historicoDaFicha}
        />
      )}
      <OverlayFinalizado aberto={finalizadoAberto} registro={registroFinalizado} ficha={ficha} catalogo={catalogo} etapa={etapaResultado} aoMudarEtapa={setEtapaResultado} aoConcluir={aoVoltar} />
      <ToastDesfazer
        mensagem={desfazerAlvo?.texto ?? null}
        aoDesfazer={() => desfazerAlvo?.executar()}
        aoFechar={() => setDesfazerAlvo(null)}
      />
    </div>
  );
}
