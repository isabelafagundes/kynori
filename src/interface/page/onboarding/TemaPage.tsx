/* ═══════════════════════════════════════════
   Onboarding · Etapa — Tema
   Grade de mini-prévias dos 6 temas. Tocar já
   aplica o tema (temaManager repinta o :root),
   então a própria tela confirma a escolha.
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { temaManager } from "@/application/state/tema.state";
import type { Tema } from "@/domain/tema";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";
import { CascaOnboarding } from "./CascaOnboarding";

interface PropriedadesTemaPage {
  passo: number;
  total: number;
  aoVoltar: () => void;
  aoContinuar: () => void;
}

/** Retratinho do app naquele tema — usa as variáveis do próprio tema, não as
    aplicadas, para que cada cartão mostre sua cara independente da atual. */
function MiniPreviaTema({ tema }: { tema: Tema }) {
  const v = tema.variaveis;
  return (
    <div
      className="flex h-[92px] flex-col gap-1.5 overflow-hidden rounded-xl border p-2.5"
      style={{ background: v["--color-fundo"], borderColor: v["--color-borda"] }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="grid h-4 w-4 place-items-center rounded-full text-[9px]"
          style={{ background: v["--color-acento-suave"] }}
        >
          🔥
        </span>
        <span
          className="h-1.5 w-11 rounded-full opacity-85"
          style={{ background: v["--color-texto-primario"] }}
        />
      </div>
      <div
        className="flex flex-1 flex-col gap-1.5 rounded-lg border p-2"
        style={{ background: v["--color-superficie"], borderColor: v["--color-borda"] }}
      >
        <span
          className="h-1 w-[70%] rounded-full opacity-70"
          style={{ background: v["--color-texto-primario"] }}
        />
        <span
          className="h-1 w-[45%] rounded-full opacity-60"
          style={{ background: v["--color-texto-sutil"] }}
        />
        <div className="mt-auto flex items-center gap-1">
          <span
            className="h-2.5 flex-1 rounded-full"
            style={{ background: v["--color-acento"] }}
          />
          <span
            className="h-2.5 w-2.5 rounded-[3px] border"
            style={{
              background: v["--color-superficie-suave"],
              borderColor: v["--color-borda"],
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Swatch círculo dividido (fundo + acento), fiel ao AmostraTema. */
function SwatchTema({ tema }: { tema: Tema }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full border border-borda-suave"
    >
      <span className="h-full flex-1" style={{ background: tema.variaveis["--color-fundo"] }} />
      <span className="h-full flex-1" style={{ background: tema.variaveis["--color-acento"] }} />
    </span>
  );
}

export function TemaPage({ passo, total, aoVoltar, aoContinuar }: PropriedadesTemaPage) {
  const temas = temaManager.listarTemas();
  const [temaId, setTemaId] = useState(() => temaManager.obterTema().id);

  function escolher(tema: Tema) {
    // Aplica na hora: o :root repinta e a tela toda confirma a escolha.
    temaManager.definirTema(tema);
    setTemaId(tema.id);
  }

  return (
    <CascaOnboarding
      progresso={{ passo, total }}
      aoVoltar={aoVoltar}
      rodape={
        <Botao variante="primario" ocuparLarguraTotal onClick={aoContinuar}>
          Continuar
        </Botao>
      }
    >
      <div className="reveal-up">
        <h1 className="font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-texto-primario">
          Escolha a cara
          <br />
          do app
        </h1>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-texto-secundario">
          Seis climas pra treinar do seu jeito. Toque pra ver, dá pra trocar
          quando quiser nas preferências.
        </p>
      </div>

      <div
        className="reveal-up grid grid-cols-2 gap-2.5"
        style={{ animationDelay: "70ms" }}
        role="radiogroup"
        aria-label="Tema do app"
      >
        {temas.map((tema) => {
          const selecionado = tema.id === temaId;
          return (
            <button
              key={tema.id}
              type="button"
              role="radio"
              aria-checked={selecionado}
              aria-label={`Tema ${tema.nome}`}
              onClick={() => escolher(tema)}
              className={`relative flex flex-col gap-2 rounded-2xl border-[1.5px] p-2 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
                selecionado
                  ? "border-acento bg-acento-suave ring-1 ring-acento"
                  : "border-borda bg-superficie hover:bg-superficie-suave"
              }`}
            >
              <MiniPreviaTema tema={tema} />
              <div className="flex items-center gap-2 px-0.5 pb-0.5">
                <SwatchTema tema={tema} />
                <span className="text-[12.5px] font-semibold text-texto-primario">
                  {tema.nome}
                </span>
                {selecionado && (
                  <span className="ml-auto grid h-[18px] w-[18px] place-items-center rounded-full bg-acento text-texto-invertido">
                    <Icone nome="check" tamanho={11} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </CascaOnboarding>
  );
}
