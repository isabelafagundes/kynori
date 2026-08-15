/* ═══════════════════════════════════════════
   Overlay de Adicionar Item à Ficha
   Bottom sheet (mobile) / diálogo centrado (≥sm) por cima da tela de itens,
   no mesmo padrão dos overlays da execução.

   A seleção é em lote: o que se toca aqui fica pendente até "Concluir".
   "Fechar" descarta o lote — é por isso que os dois botões coexistem.
   ═══════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import type { Exercicio, ItemFicha, TipoCardio, TipoCardioDef } from "@/domain/tipos";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { Icone } from "@/interface/widget/svg/Icone";
import { PickerExercicios } from "@/interface/widget/formulario/PickerExercicios";

interface OverlayAdicionarItemProps {
  tipo: "exercicio" | "cardio";
  exercicios: Exercicio[];
  tiposCardio: TipoCardioDef[];
  /** Já na ficha + já pendentes — o picker esconde ambos. */
  exercicioIdsIndisponiveis: string[];
  pendentes: ItemFicha[];
  rotuloDoItem: (item: ItemFicha) => string;
  aoAdicionarExercicio: (exercicioId: string) => void;
  aoAdicionarCardio: (tipo: TipoCardio) => void;
  aoRemoverPendente: (index: number) => void;
  aoCriarExercicioCustom: () => void;
  aoFechar: () => void;
  aoConcluir: () => void;
}

export function OverlayAdicionarItem({
  tipo,
  exercicios,
  tiposCardio,
  exercicioIdsIndisponiveis,
  pendentes,
  rotuloDoItem,
  aoAdicionarExercicio,
  aoAdicionarCardio,
  aoRemoverPendente,
  aoCriarExercicioCustom,
  aoFechar,
  aoConcluir,
}: OverlayAdicionarItemProps) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  // O chip novo entra no fim da fila — traz ele pra vista, senão a seleção
  // parece não ter acontecido.
  const refFaixaPendentes = useRef<HTMLDivElement>(null);
  const totalPendentes = pendentes.length;
  useEffect(() => {
    const el = refFaixaPendentes.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [totalPendentes]);

  const ehExercicio = tipo === "exercicio";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adicionar-item-title"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={aoFechar}
      />

      <div className="relative flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-borda bg-superficie shadow-xl sm:h-[72dvh] sm:max-w-[560px] sm:rounded-3xl">
        {/* Header — sem "×": fechar já mora no rodapé, junto do Concluir.
            O grabber mantém a leitura de bottom sheet no mobile. */}
        <div className="border-b border-borda-suave px-5 pb-4 pt-3">
          <div
            className="mx-auto mb-3 h-1 w-9 rounded-full bg-borda sm:hidden"
            aria-hidden="true"
          />
          <h2
            id="adicionar-item-title"
            className="font-display text-xl font-semibold text-texto-primario"
          >
            {ehExercicio ? "Adicionar exercício" : "Adicionar cardio"}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-texto-secundario">
            {ehExercicio
              ? "Toque nos exercícios que quer incluir na sequência."
              : "Toque nas atividades que quer incluir na sequência."}
          </p>
        </div>

        {/* Conteúdo rolável */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {ehExercicio ? (
            <PickerExercicios
              exercicios={exercicios}
              exercicioIdsSelecionados={exercicioIdsIndisponiveis}
              aoAdicionar={aoAdicionarExercicio}
              aoCriarExercicioCustom={aoCriarExercicioCustom}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiposCardio.map((tipoCardio) => (
                <button
                  key={tipoCardio.id}
                  type="button"
                  onClick={() => aoAdicionarCardio(tipoCardio.id)}
                  className="
                    group flex min-h-[52px] items-center gap-2.5 rounded-xl
                    border border-borda bg-superficie px-3 py-2.5 text-left
                    transition-all duration-150
                    hover:border-acento hover:bg-acento/5 active:scale-[0.98]
                  "
                >
                  <span className="shrink-0 text-xl leading-none">{tipoCardio.emoji}</span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-texto-primario">
                    {tipoCardio.nome}
                  </span>
                  <span
                    className="
                      flex h-6 w-6 shrink-0 items-center justify-center
                      rounded-full bg-superficie-suave text-texto-sutil
                      transition-colors duration-150
                      group-hover:bg-acento group-hover:text-texto-invertido
                    "
                    aria-hidden="true"
                  >
                    <Icone nome="mais" tamanho={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lote pendente — mostra o que entra ao concluir, com desfazer item a item */}
        {pendentes.length > 0 && (
          <div className="shrink-0 border-t border-borda-suave bg-superficie-suave/60 px-5 py-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
              {pendentes.length} {pendentes.length === 1 ? "selecionado" : "selecionados"}
            </p>
            {/* Uma linha só, rolando na horizontal: em lote grande a faixa não
                cresce pra cima e come a lista de exercícios. */}
            <div
              ref={refFaixaPendentes}
              className="-mx-5 flex flex-nowrap gap-1.5 overflow-x-auto scroll-smooth px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {pendentes.map((item, index) => (
                <span
                  key={`pendente-${index}`}
                  className="inline-flex max-w-[180px] shrink-0 items-center gap-1 rounded-full border border-borda bg-superficie py-1 pl-3 pr-1 text-[13px] text-texto-primario"
                >
                  <span className="truncate">{rotuloDoItem(item)}</span>
                  <button
                    type="button"
                    onClick={() => aoRemoverPendente(index)}
                    aria-label={`Remover ${rotuloDoItem(item)} da seleção`}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-texto-sutil transition-colors hover:bg-superficie-hover hover:text-texto-primario"
                  >
                    <Icone nome="fechar" tamanho={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé — Fechar descarta o lote, Concluir aplica */}
        <div className="shrink-0 border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
          <div className="flex gap-3">
            <BotaoAcao
              variante="secundario"
              className="flex-1"
              icone="fechar"
              onClick={aoFechar}
            >
              Fechar
            </BotaoAcao>
            <BotaoAcao
              variante="primario"
              className="flex-1"
              icone="check"
              onClick={aoConcluir}
              disabled={pendentes.length === 0}
            >
              Concluir{pendentes.length > 0 ? ` (${pendentes.length})` : ""}
            </BotaoAcao>
          </div>
        </div>
      </div>
    </div>
  );
}
