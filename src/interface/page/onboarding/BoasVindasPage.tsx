/* ═══════════════════════════════════════════
   Onboarding · Boas-vindas
   Primeira tela do app. Mostra o que o Kynori
   faz antes de pedir qualquer coisa.
   ═══════════════════════════════════════════ */

import { Botao } from "@/interface/widget/botao/Botao";
import { AmostraProduto, CascaOnboarding } from "./CascaOnboarding";

interface PropriedadesBoasVindasPage {
  aoComecar: () => void;
}

export function BoasVindasPage({ aoComecar }: PropriedadesBoasVindasPage) {
  return (
    <CascaOnboarding
      painelHeadline={false}
      rodape={
        <Botao
          variante="primario"
          ocuparLarguraTotal
          onClick={aoComecar}
          className="reveal-up"
          style={{ animationDelay: "180ms" }}
        >
          Bora começar
        </Botao>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6 py-6 lg:flex-none lg:py-0">
        {/* No lg a prova de produto mora no painel escuro; aqui só no mobile. */}
        <div className="reveal-up lg:hidden" style={{ animationDelay: "60ms" }}>
          <AmostraProduto />
        </div>

        <div className="reveal-up" style={{ animationDelay: "120ms" }}>
          {/* A marca só aparece aqui no mobile — no lg ela vive no painel. */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img
              src="/kynori-mark-black.png"
              alt=""
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-texto-sutil">
              Kynori
            </span>
          </div>

          <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-texto-primario lg:text-[2.75rem]">
            Seu treino,
            <br />
            do jeito que
            <br />
            você faz.
          </h1>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-texto-secundario lg:mt-5 lg:text-[17px]">
            Monte seu programa, registre cada série e veja a carga subir. Leva 2
            minutos pra começar.
          </p>
        </div>
      </div>
    </CascaOnboarding>
  );
}
