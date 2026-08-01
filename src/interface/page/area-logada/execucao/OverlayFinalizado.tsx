import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercicio, Ficha, RegistroTreino, TipoCardioDef } from "@/domain/tipos";
import { calcularResumoTreino, type ResumoCompartilhamento } from "@/application/compartilhamento/calcular-resumo-treino";
import { resumirExerciciosTreino, gruposMuscularesTreino, type ResumoExercicioTreino } from "@/application/compartilhamento/resumir-exercicios-treino";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone, IconeFicha } from "@/interface/widget/svg/Icone";
import { formatarNumeroBR } from "@/interface/util/numero";
import { useControleFundoResultado } from "@/interface/widget/fundo-resultado/useControleFundoResultado";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { CardResultadoTreino } from "./CardResultadoTreino";
import { formatarDuracaoTreino } from "./formatar-resultado";
import { SeletorFundoResultado, type ControleFundo } from "./SeletorFundoResultado";
import { useCompartilhamentoTreino } from "./hooks/useCompartilhamentoTreino";

export type EtapaResultado = "celebracao" | "resumo" | "editor";
const CORES_CONFETE = [
  "oklch(0.65 0.18 45)", "oklch(0.55 0.20 35)",
  "oklch(0.50 0.18 25)", "oklch(0.60 0.15 55)", "oklch(0.70 0.12 65)",
];

type Share = ReturnType<typeof useCompartilhamentoTreino>;

/** md+ (tablet/desktop). Decide se o resultado é um pop-up (largo) ou o
    takeover em tela cheia do mobile. */
function useEhTelaLarga(): boolean {
  const consulta = "(min-width: 768px)";
  const [larga, setLarga] = useState(() => typeof window !== "undefined" && window.matchMedia(consulta).matches);
  useEffect(() => {
    const mql = window.matchMedia(consulta);
    const aoMudar = () => setLarga(mql.matches);
    mql.addEventListener("change", aoMudar);
    return () => mql.removeEventListener("change", aoMudar);
  }, []);
  return larga;
}

export function OverlayFinalizado({ aberto, registro, ficha, catalogo, etapa, aoMudarEtapa, aoConcluir }: {
  aberto: boolean; registro: RegistroTreino | null; ficha: Ficha; catalogo: Exercicio[]; etapa: EtapaResultado;
  aoMudarEtapa: (etapa: EtapaResultado) => void; aoConcluir: () => void;
}) {
  const fundo = useControleFundoResultado(aberto);
  if (!aberto || !registro) return null;
  if (etapa === "celebracao") return <Celebracao aoConcluir={() => aoMudarEtapa("resumo")} />;
  return <Conteudo registro={registro} ficha={ficha} catalogo={catalogo} fundo={fundo} etapa={etapa} aoMudarEtapa={aoMudarEtapa} aoConcluir={aoConcluir} />;
}

/** Abre somente o editor do card para um treino que já está no histórico. */
export function OverlayCompartilharTreino({ aberto, registro, ficha, catalogo, aoFechar }: {
  aberto: boolean;
  registro: RegistroTreino;
  ficha: Ficha;
  catalogo: Exercicio[];
  aoFechar: () => void;
}) {
  const fundo = useControleFundoResultado(aberto);
  if (!aberto) return null;

  return (
    <Conteudo
      registro={registro}
      ficha={ficha}
      catalogo={catalogo}
      fundo={fundo}
      etapa="editor"
      aoMudarEtapa={aoFechar}
      aoConcluir={aoFechar}
    />
  );
}

function Celebracao({ aoConcluir }: { aoConcluir: () => void }) {
  // Ref para não reiniciar o timeout de 2,6s a cada re-render do pai (o timer
  // de descanso, se estiver rodando, re-renderiza a cada segundo).
  const aoConcluirRef = useRef(aoConcluir);
  useEffect(() => { aoConcluirRef.current = aoConcluir; }, [aoConcluir]);
  useEffect(() => { if (typeof navigator.vibrate === "function") navigator.vibrate([40, 60, 40]); const id = window.setTimeout(() => aoConcluirRef.current(), 2600); return () => window.clearTimeout(id); }, []);
  const confetes = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: ((i * 17) % 12) / 10, drift: ((i * 41) % 120) - 60, spin: 180 + ((i * 53) % 240), color: CORES_CONFETE[i % CORES_CONFETE.length] })), []);
  return <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-fundo animate-fade-in" role="status" aria-live="polite">
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">{confetes.map((p, i) => <span key={i} className="animate-confetti absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${p.left}%`, backgroundColor: p.color, animationDelay: `${p.delay}s`, ["--confetti-drift" as string]: `${p.drift}px`, ["--confetti-spin" as string]: `${p.spin}deg` }} />)}</div>
    <div className="relative flex flex-col items-center gap-4 px-6 text-center"><span className="text-7xl animate-check-bounce" aria-hidden="true">💪</span><h1 className="font-display text-2xl font-semibold text-texto-primario slide-in-from-top-2">Treino finalizado!</h1><p className="text-sm text-texto-secundario">Bom trabalho.</p></div>
  </div>;
}

function Conteudo({ registro, ficha, catalogo, fundo, etapa, aoMudarEtapa, aoConcluir }: { registro: RegistroTreino; ficha: Ficha; catalogo: Exercicio[]; fundo: ControleFundo; etapa: Exclude<EtapaResultado, "celebracao">; aoMudarEtapa: (etapa: EtapaResultado) => void; aoConcluir: () => void }) {
  const resumo = useMemo(() => calcularResumoTreino(registro), [registro]);
  const exercicios = useMemo(() => resumirExerciciosTreino(registro, catalogo), [registro, catalogo]);
  const grupos = useMemo(() => gruposMuscularesTreino(exercicios), [exercicios]);
  const tiposCardio = stateManagerRepository.listarTiposCardio();
  const share = useCompartilhamentoTreino(registro, ficha, resumo, fundo.selecao, grupos, tiposCardio);
  const telaLarga = useEhTelaLarga();

  // Tablet/desktop: um único pop-up que alterna entre resumo e compartilhar.
  if (telaLarga) {
    return <ModalResultado etapa={etapa} ficha={ficha} registro={registro} resumo={resumo} exercicios={exercicios} grupos={grupos} tiposCardio={tiposCardio} fundo={fundo} share={share} aoCompartilhar={() => aoMudarEtapa("editor")} aoVoltar={() => aoMudarEtapa("resumo")} aoConcluir={aoConcluir} />;
  }
  // Mobile: takeover em tela cheia (resumo) + tela cheia (compartilhar).
  if (etapa === "resumo") return <ResumoMobile ficha={ficha} registro={registro} resumo={resumo} exercicios={exercicios} aoCompartilhar={() => aoMudarEtapa("editor")} aoConcluir={aoConcluir} />;
  return <EditorMobile registro={registro} ficha={ficha} resumo={resumo} fundo={fundo} share={share} grupos={grupos} tiposCardio={tiposCardio} aoVoltar={() => aoMudarEtapa("resumo")} />;
}

/* ─────────────────────────── Conteúdos compartilhados ─────────────────────────── */

function ResumoCorpo({ ficha, registro, resumo, exercicios }: { ficha: Ficha; registro: RegistroTreino; resumo: ResumoCompartilhamento; exercicios: ResumoExercicioTreino[] }) {
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(registro.finalizadoEm));
  const volume = new Intl.NumberFormat("pt-BR").format(resumo.volumeTotalKg);
  const metricas = [
    ...(resumo.duracaoSegundos > 0 ? [{ icone: "relogio", valor: formatarDuracaoTreino(resumo.duracaoSegundos), rotulo: "Duração" }] : []),
    { icone: "halter", valor: String(resumo.totalExercicios), rotulo: "Exercícios" },
    { icone: "listaVerificacao", valor: String(resumo.totalSeries), rotulo: "Séries" },
  ];
  const temExercicios = exercicios.length > 0;
  const temCardio = resumo.totalCardios > 0;

  return <div className="mx-auto w-full max-w-[560px]">
    {/* Cabeçalho celebratório */}
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-acento text-texto-invertido shadow-lg shadow-acento/25"><Icone nome="check" tamanho={26} /></div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">Treino concluído</p>
      <h1 id="resultado-title" className="mt-1 flex items-center justify-center gap-2 font-display text-2xl font-bold tracking-tight text-texto-primario">
        {ficha.emoji ? <span aria-hidden="true">{ficha.emoji}</span> : <IconeFicha nome={ficha.icone} tamanho={24} />}
        <span>{ficha.nome}</span>
      </h1>
      <p className="mt-1 text-sm capitalize text-texto-secundario">{data}</p>
    </div>

    {/* Volume herói + métricas */}
    <div className="mt-6 flex flex-col gap-3">
      {resumo.volumeTotalKg > 0 && (
        <div className="rounded-[16px] border border-borda-suave bg-superficie px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-texto-sutil">Volume total</p>
          <p className="mt-1 flex items-baseline justify-center gap-1.5">
            <strong className="font-display text-[40px] font-bold leading-none tabular-nums">{volume}</strong>
            <span className="text-lg font-semibold text-texto-secundario">kg</span>
          </p>
        </div>
      )}
      <div className={`grid ${metricas.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-2.5`}>
        {metricas.map((item, indice) => {
          const destaque = indice === 0;
          return <div key={item.rotulo} className={`rounded-[14px] px-3.5 py-3.5 ${destaque ? "bg-acento text-texto-invertido" : "border border-borda-suave bg-superficie"}`}>
            <Icone nome={item.icone} tamanho={16} className={destaque ? "text-texto-invertido/80" : "text-texto-sutil"} />
            <strong className="mt-2 block font-display text-xl font-bold leading-none tabular-nums">{item.valor}</strong>
            <span className={`mt-1 block text-xs ${destaque ? "text-texto-invertido/70" : "text-texto-secundario"}`}>{item.rotulo}</span>
          </div>;
        })}
      </div>
    </div>

    {/* Lista de exercícios */}
    {(temExercicios || temCardio) && (
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-texto-sutil">Exercícios</p>
        <div className="overflow-hidden rounded-[14px] border border-borda-suave bg-superficie">
          {exercicios.map((exercicio, indice) => (
            <div key={exercicio.exercicioId} className={`flex items-center gap-3 px-3.5 py-3 ${indice > 0 ? "border-t border-borda-suave" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-texto-primario">{exercicio.nome}</p>
                {exercicio.grupoMuscular && <p className="mt-0.5 text-xs text-texto-sutil">{exercicio.grupoMuscular}</p>}
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p className="text-[13px] font-semibold text-texto-primario">{exercicio.totalSeries} {exercicio.totalSeries === 1 ? "série" : "séries"}</p>
                <p className="mt-0.5 text-xs text-texto-secundario">{exercicio.usaCarga ? `${formatarNumeroBR(exercicio.cargaMaxima)} kg` : "peso corporal"}</p>
              </div>
            </div>
          ))}
          {temCardio && (
            <div className={`flex items-center gap-3 bg-superficie-suave px-3.5 py-3 ${temExercicios ? "border-t border-borda-suave" : ""}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-acento-suave text-texto-secundario"><Icone nome="coracao" tamanho={16} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-texto-primario">Cardio</p></div>
              <p className="shrink-0 text-[13px] font-semibold tabular-nums text-texto-primario">{formatarNumeroBR(resumo.duracaoCardioMinutos)} min{resumo.distanciaCardioKm ? ` · ${formatarNumeroBR(resumo.distanciaCardioKm)} km` : ""}</p>
            </div>
          )}
        </div>
      </div>
    )}
  </div>;
}

function EditorCorpo({ registro, ficha, resumo, fundo, share, grupos, tiposCardio }: { registro: RegistroTreino; ficha: Ficha; resumo: ResumoCompartilhamento; fundo: ControleFundo; share: Share; grupos: string[]; tiposCardio: TipoCardioDef[] }) {
  return <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-8">
    <div className="mx-auto w-full max-w-[320px] md:max-w-[380px]"><CardResultadoTreino registro={registro} ficha={ficha} resumo={resumo} fundo={fundo.selecao} grupos={grupos} tiposCardio={tiposCardio} /></div>
    <div className="mt-6 md:mt-0">
      <h3 className="mb-2 hidden font-display text-base font-semibold text-texto-primario md:block">Fundo</h3>
      <SeletorFundoResultado ctrl={fundo} />
      {share.erro && <p role="alert" className="mt-4 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">{share.erro}</p>}
    </div>
  </div>;
}

/* ─────────────────────────── Tablet / desktop: pop-up único ─────────────────────────── */

function ModalResultado({ etapa, ficha, registro, resumo, exercicios, grupos, tiposCardio, fundo, share, aoCompartilhar, aoVoltar, aoConcluir }: { etapa: Exclude<EtapaResultado, "celebracao">; ficha: Ficha; registro: RegistroTreino; resumo: ResumoCompartilhamento; exercicios: ResumoExercicioTreino[]; grupos: string[]; tiposCardio: TipoCardioDef[]; fundo: ControleFundo; share: Share; aoCompartilhar: () => void; aoVoltar: () => void; aoConcluir: () => void }) {
  const editando = etapa === "editor";
  return <div className="fixed inset-0 z-[80] flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="resultado-title">
    {editando
      ? <button type="button" aria-label="Voltar ao resumo" onClick={aoVoltar} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      : <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />}
    <div className="relative mx-4 flex h-[86dvh] max-h-[860px] w-full max-w-[840px] flex-col overflow-hidden rounded-[20px] border border-borda-suave bg-fundo shadow-xl">
      {editando && (
        <header className="flex shrink-0 items-center gap-3 border-b border-borda-suave px-7 pb-3 pt-5">
          <button
            type="button"
            onClick={aoVoltar}
            aria-label="Voltar ao resumo"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-texto-secundario transition-colors hover:bg-superficie-hover hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
          >
            <Icone nome="setaEsquerda" tamanho={18} />
          </button>
          <div className="min-w-0">
            <h2 id="resultado-title" className="truncate font-display text-lg font-semibold leading-tight text-texto-primario">Personalizar resultado</h2>
            <p className="text-xs text-texto-secundario">Escolha um fundo · exportado em 4:5</p>
          </div>
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
        {editando
          ? <EditorCorpo registro={registro} ficha={ficha} resumo={resumo} fundo={fundo} share={share} grupos={grupos} tiposCardio={tiposCardio} />
          : <ResumoCorpo ficha={ficha} registro={registro} resumo={resumo} exercicios={exercicios} />}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-borda bg-superficie/95 px-7 py-4 backdrop-blur-sm">
        {editando
          ? <Botao icone={<Icone nome="compartilhar" tamanho={17} />} disabled={share.compartilhando} onClick={() => void share.compartilhar()}>{share.compartilhando ? "Criando imagem…" : "Compartilhar imagem"}</Botao>
          : <>
              <Botao variante="secundario" icone={<Icone nome="compartilhar" tamanho={16} />} onClick={aoCompartilhar}>Compartilhar resultado</Botao>
              <Botao icone={<Icone nome="check" tamanho={16} />} onClick={aoConcluir}>Concluir</Botao>
            </>}
      </div>
    </div>
  </div>;
}

/* ─────────────────────────── Mobile ─────────────────────────── */

function ResumoMobile({ ficha, registro, resumo, exercicios, aoCompartilhar, aoConcluir }: { ficha: Ficha; registro: RegistroTreino; resumo: ResumoCompartilhamento; exercicios: ResumoExercicioTreino[]; aoCompartilhar: () => void; aoConcluir: () => void }) {
  return <div className="fixed inset-0 z-[80] flex flex-col bg-fundo animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="resultado-title">
    <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-[max(var(--safe-top),24px)]"><ResumoCorpo ficha={ficha} registro={registro} resumo={resumo} exercicios={exercicios} /></main>
    <footer className="shrink-0 border-t border-borda bg-superficie/95 px-5 pb-[max(var(--safe-bottom),16px)] pt-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[480px] gap-3">
        <Botao variante="secundario" className="flex-1" icone={<Icone nome="compartilhar" tamanho={16} />} onClick={aoCompartilhar}>Compartilhar</Botao>
        <Botao className="flex-1" icone={<Icone nome="check" tamanho={16} />} onClick={aoConcluir}>Concluir</Botao>
      </div>
    </footer>
  </div>;
}

function EditorMobile({ registro, ficha, resumo, fundo, share, grupos, tiposCardio, aoVoltar }: { registro: RegistroTreino; ficha: Ficha; resumo: ResumoCompartilhamento; fundo: ControleFundo; share: Share; grupos: string[]; tiposCardio: TipoCardioDef[]; aoVoltar: () => void }) {
  return <div className="fixed inset-0 z-[80] flex flex-col bg-fundo animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="resultado-title">
    <header className="flex shrink-0 items-center gap-3 border-b border-borda-suave px-5 pb-3 pt-[max(var(--safe-top),16px)]">
      <button type="button" onClick={aoVoltar} aria-label="Voltar ao resumo" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-borda bg-superficie-suave text-texto-secundario shadow-sm shadow-black/[0.04] transition-all duration-150 hover:border-acento hover:bg-superficie-hover hover:text-texto-primario active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"><Icone nome="setaEsquerda" tamanho={16} /></button>
      <div className="min-w-0">
        <h1 id="resultado-title" className="truncate font-display text-lg font-semibold leading-tight text-texto-primario">Personalizar resultado</h1>
        <p className="text-xs text-texto-secundario">Escolha um fundo · exportado em 4:5</p>
      </div>
    </header>
    <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5"><EditorCorpo registro={registro} ficha={ficha} resumo={resumo} fundo={fundo} share={share} grupos={grupos} tiposCardio={tiposCardio} /></main>
    <footer className="shrink-0 border-t border-borda bg-superficie/95 px-5 pb-[max(var(--safe-bottom),16px)] pt-4 backdrop-blur-sm"><Botao ocuparLarguraTotal icone={<Icone nome="compartilhar" tamanho={16} />} disabled={share.compartilhando} onClick={() => void share.compartilhar()}>{share.compartilhando ? "Criando imagem…" : "Compartilhar imagem"}</Botao></footer>
  </div>;
}
