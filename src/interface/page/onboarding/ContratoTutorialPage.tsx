/* ═══════════════════════════════════════════
   Onboarding · Etapa 3 — Contrato do tutorial
   Fecha a fase de perguntas e abre a prática.
   Traz a única nota de segurança da jornada.
   ═══════════════════════════════════════════ */

import { Botao } from "@/interface/widget/botao/Botao";
import { CascaOnboarding } from "./CascaOnboarding";

interface PropriedadesContratoTutorialPage {
  passo: number;
  total: number;
  primeiroNome: string;
  aoVoltar: () => void;
  aoIniciarTutorial: () => void;
  aoPularTutorial: () => void;
}

const ETAPAS_PRATICAS = [
  {
    titulo: "Criar um programa",
    descricao: "o guarda-chuva da sua rotina",
  },
  {
    titulo: "Montar a primeira ficha",
    descricao: "o treino de um dia",
  },
  {
    titulo: "Escolher seus exercícios",
    descricao: "da biblioteca ou criados por você",
  },
];

export function ContratoTutorialPage({
  passo,
  total,
  primeiroNome,
  aoVoltar,
  aoIniciarTutorial,
  aoPularTutorial,
}: PropriedadesContratoTutorialPage) {
  return (
    <CascaOnboarding
      progresso={{ passo, total }}
      aoVoltar={aoVoltar}
      rodape={
        <>
          <Botao
            variante="primario"
            ocuparLarguraTotal
            onClick={aoIniciarTutorial}
            className="reveal-up"
            style={{ animationDelay: "260ms" }}
          >
            Bora, me mostra
          </Botao>
          <Botao
            variante="fantasma"
            ocuparLarguraTotal
            onClick={aoPularTutorial}
            className="reveal-up"
            style={{ animationDelay: "300ms" }}
          >
            Sei me virar, pular tutorial
          </Botao>
        </>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-5">
        <div className="reveal-up flex justify-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-[22px] border-[1.5px] border-borda bg-acento-suave text-[34px]">
            🗺️
          </span>
        </div>

        <div className="reveal-up" style={{ animationDelay: "70ms" }}>
          <h1 className="font-display text-[1.7rem] font-semibold leading-[1.12] tracking-tight text-texto-primario">
            Pronto{primeiroNome ? `, ${primeiroNome}` : ""}.
            <br />
            Agora a parte
            <br />
            prática.
          </h1>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-texto-secundario">
            Chega de perguntas. Vou te mostrar onde fica cada coisa enquanto
            você monta o seu primeiro treino. Uns 3 minutos.
          </p>
        </div>

        <ol className="reveal-up flex flex-col gap-2.5 rounded-[18px] border border-borda bg-superficie px-4 py-4" style={{ animationDelay: "140ms" }}>
          {ETAPAS_PRATICAS.map((etapa, indice) => (
            <li key={etapa.titulo} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full bg-acento text-[11px] font-extrabold text-texto-invertido">
                {indice + 1}
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-texto-primario">
                  {etapa.titulo}
                </p>
                <p className="text-[11.5px] text-texto-sutil">
                  {etapa.descricao}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="reveal-up flex items-start gap-2.5 px-0.5" style={{ animationDelay: "210ms" }}>
          <span aria-hidden="true" className="mt-px text-[13px]">
            🫱
          </span>
          <p className="text-[11.5px] leading-relaxed text-texto-sutil">
            O Kynori{" "}
            <b className="text-texto-secundario">não monta treino por você</b>.
            Ele organiza e registra o treino que <i>você</i> escolhe. Se está
            começando agora, vale montar junto com um profissional.
          </p>
        </div>
      </div>
    </CascaOnboarding>
  );
}
