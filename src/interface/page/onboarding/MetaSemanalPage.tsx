/* ═══════════════════════════════════════════
   Onboarding · Etapa 2 — Meta semanal
   NÃO prescreve treino: a resposta só vira o
   denominador da contagem semanal na home.
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { OPCOES_META_SEMANAL } from "@/domain/usuario";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";
import { CascaOnboarding } from "./CascaOnboarding";

interface PropriedadesMetaSemanalPage {
  passo: number;
  total: number;
  metaInicial?: number;
  aoVoltar: () => void;
  aoContinuar: (metaSemanal: number | undefined) => void;
}

/** Reprodução do StripSemanal da home com a meta aplicada. */
function PreviaStrip({ meta }: { meta: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-acento" />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
          O que muda na home
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-2 flex items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-suave/80">
          <Icone nome="fogo" tamanho={16} className="text-texto-sutil" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight text-texto-secundario">
            Comece sua sequência hoje
          </p>
          <p className="mt-1 text-xs leading-tight tabular-nums text-texto-sutil">
            0/<span className="font-bold text-grafico-forte">{meta}</span> esta
            semana
          </p>
        </div>
      </div>
    </div>
  );
}

export function MetaSemanalPage({
  passo,
  total,
  metaInicial,
  aoVoltar,
  aoContinuar,
}: PropriedadesMetaSemanalPage) {
  const [meta, setMeta] = useState<number | undefined>(metaInicial);

  return (
    <CascaOnboarding
      progresso={{ passo, total }}
      aoVoltar={aoVoltar}
      aoPular={() => aoContinuar(undefined)}
      rodape={
        <Botao
          variante="primario"
          ocuparLarguraTotal
          onClick={() => aoContinuar(meta)}
          className="reveal-up"
          style={{ animationDelay: "140ms" }}
        >
          Continuar
        </Botao>
      }
    >
      <div className="reveal-up">
        <h1 className="font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-texto-primario">
          Quantos dias
          <br />
          por semana
          <br />
          você quer treinar?
        </h1>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-texto-secundario">
          Isso vira sua meta na tela inicial — não muda nada no seu treino. Dá
          pra ajustar quando quiser.
        </p>
      </div>

      <div
        className="reveal-up flex gap-2"
        style={{ animationDelay: "70ms" }}
        role="radiogroup"
        aria-label="Meta de treinos por semana"
      >
        {OPCOES_META_SEMANAL.map((opcao) => {
          const selecionada = meta === opcao;
          return (
            <button
              key={opcao}
              type="button"
              role="radio"
              aria-checked={selecionada}
              onClick={() => setMeta(selecionada ? undefined : opcao)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] border-[1.5px] py-4 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
                selecionada
                  ? "border-acento bg-acento text-texto-invertido"
                  : "border-borda bg-superficie text-texto-primario hover:bg-superficie-suave"
              }`}
            >
              <span className="font-display text-[22px] font-bold leading-none tabular-nums">
                {opcao}
              </span>
              <span className="text-[9.5px] opacity-65">dias</span>
            </button>
          );
        })}
      </div>

      {meta !== undefined && (
        <div className="reveal-up">
          <PreviaStrip meta={meta} />
        </div>
      )}

      <p className="px-0.5 text-[11.5px] leading-relaxed text-texto-sutil">
        Não escolhemos os dias por você — treine quando der. A meta é só um
        número pra acompanhar a constância.
      </p>
    </CascaOnboarding>
  );
}
