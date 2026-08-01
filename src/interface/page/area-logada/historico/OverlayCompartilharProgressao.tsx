import { useEffect } from "react";
import type { ProgressaoCompartilhavel } from "@/application/compartilhamento/calcular-progressao-exercicio";
import { Botao } from "@/interface/widget/botao/Botao";
import { useControleFundoResultado } from "@/interface/widget/fundo-resultado/useControleFundoResultado";
import { Icone } from "@/interface/widget/svg/Icone";
import { SeletorFundoResultado } from "../execucao/SeletorFundoResultado";
import { CardProgressaoCompartilhavel } from "./CardProgressaoCompartilhavel";
import { useCompartilhamentoProgressao } from "./useCompartilhamentoProgressao";

export function OverlayCompartilharProgressao({
  aberto,
  progressao,
  aoFechar,
}: {
  aberto: boolean;
  progressao: ProgressaoCompartilhavel;
  aoFechar: () => void;
}) {
  const fundo = useControleFundoResultado(aberto);
  const compartilhamento = useCompartilhamentoProgressao(progressao, fundo.selecao);

  useEffect(() => {
    if (!aberto) return;
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-fundo md:bg-black/40 md:p-5 md:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compartilhar-progressao-titulo"
    >
      <div className="flex h-full w-full max-w-[840px] flex-col overflow-hidden bg-fundo md:h-[86dvh] md:max-h-[860px] md:rounded-[20px] md:border md:border-borda-suave md:shadow-xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-borda-suave px-5 pb-3 pt-[max(var(--safe-top),16px)] md:px-7 md:pt-5">
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Voltar para a progressão"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-texto-secundario transition-colors hover:bg-superficie-hover hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
          >
            <Icone nome="setaEsquerda" tamanho={18} />
          </button>
          <div className="min-w-0">
            <h1
              id="compartilhar-progressao-titulo"
              className="truncate font-display text-lg font-semibold leading-tight text-texto-primario"
            >
              Personalizar progressão
            </h1>
            <p className="text-xs text-texto-secundario">
              Escolha um fundo · exportado em 4:5
            </p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-7">
          <div className="md:grid md:grid-cols-[minmax(0,380px)_1fr] md:items-start md:gap-8">
            <div className="mx-auto w-full max-w-[320px] md:max-w-[380px]">
              <CardProgressaoCompartilhavel
                progressao={progressao}
                fundo={fundo.selecao}
              />
            </div>
            <div className="mt-6 md:mt-0">
              <h2 className="mb-2 hidden font-display text-base font-semibold text-texto-primario md:block">
                Fundo
              </h2>
              <SeletorFundoResultado ctrl={fundo} />
              {compartilhamento.erro ? (
                <p
                  role="alert"
                  className="mt-4 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700"
                >
                  {compartilhamento.erro}
                </p>
              ) : null}
            </div>
          </div>
        </main>

        <footer className="shrink-0 border-t border-borda bg-superficie/95 px-5 pb-[max(var(--safe-bottom),16px)] pt-4 backdrop-blur-sm md:flex md:justify-end md:px-7 md:pb-4">
          <Botao
            ocuparLarguraTotal
            className="md:w-auto"
            icone={<Icone nome="compartilhar" tamanho={17} />}
            disabled={compartilhamento.compartilhando}
            onClick={() => void compartilhamento.compartilhar()}
          >
            {compartilhamento.compartilhando
              ? "Criando imagem…"
              : "Compartilhar imagem"}
          </Botao>
        </footer>
      </div>
    </div>
  );
}
