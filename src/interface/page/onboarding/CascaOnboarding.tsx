/* ═══════════════════════════════════════════
   Casca do onboarding em telas largas (split).

   Até `lg` (1024px): coluna única mobile — é o
   layout que já existia; tablets em retrato
   (≤834px) nunca racham, então nada aperta.
   A partir de `lg`: painel de marca fixo à
   esquerda + coluna interativa à direita. No
   pior caso (1024px) a coluna da direita ainda
   tem ~624px, folgada para o formulário.
   ═══════════════════════════════════════════ */

import type { ReactNode } from "react";
import { Icone } from "@/interface/widget/svg/Icone";

interface Progresso {
  /** Índice do passo atual (base 0) */
  passo: number;
  total: number;
}

/** Amostra visual do produto: um card de ficha e um de progressão.
    São ilustrações do que o app registra — nada aqui é sugestão de treino. */
export function AmostraProduto() {
  const barras = [13, 18, 16, 23, 27, 34];

  return (
    <div aria-hidden="true" className="relative h-[190px]">
      <div className="absolute left-0 top-3 w-[210px] -rotate-[4deg] rounded-2xl border border-borda bg-superficie px-3.5 py-3 shadow-lg shadow-black/[0.07]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-acento-suave text-[17px]">
            🔥
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-texto-primario">
              Peito &amp; Tríceps
            </p>
            <p className="text-[11px] text-texto-sutil">6 exercícios · 48 min</p>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-[76px] w-[180px] rotate-[3deg] rounded-2xl border border-borda bg-superficie px-3.5 py-3 shadow-lg shadow-black/[0.07]">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
          Supino reto
        </p>
        <div className="mt-2.5 flex h-[34px] items-end gap-1">
          {barras.map((altura, indice) => (
            <span
              key={indice}
              style={{ height: altura }}
              className={`flex-1 rounded-[3px] ${
                indice === barras.length - 1
                  ? "bg-grafico-forte"
                  : "bg-grafico/45"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11.5px] font-bold text-grafico-forte">
          +12 kg em 8 semanas
        </p>
      </div>
    </div>
  );
}

/** Barra de progresso segmentada do wizard. */
export function BarraProgresso({ passo, total }: Progresso) {
  return (
    <div
      className="flex w-full gap-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={passo + 1}
      aria-label={`Etapa ${passo + 1} de ${total}`}
    >
      {Array.from({ length: total }).map((_, indice) => (
        <span
          key={indice}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            indice <= passo ? "bg-acento" : "bg-borda"
          }`}
        />
      ))}
    </div>
  );
}

/** Barra de progresso clara — versão do painel escuro. */
function BarraProgressoClara({ passo, total }: Progresso) {
  return (
    <div className="flex w-full gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, indice) => (
        <span
          key={indice}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            indice <= passo ? "bg-texto-invertido" : "bg-texto-invertido/25"
          }`}
        />
      ))}
    </div>
  );
}

/** Painel de marca — só aparece em `lg`. Âncora fixa da jornada:
    logo, prova de produto e (no wizard) o progresso. */
function PainelMarca({
  progresso,
  mostrarHeadline,
}: {
  progresso?: Progresso;
  mostrarHeadline: boolean;
}) {
  return (
    <aside className="hidden bg-acento px-8 py-12 text-texto-invertido lg:flex lg:flex-col lg:justify-between xl:px-12">
      <div className="flex items-center gap-2">
        <img
          src="/kynori-mark-black.png"
          alt=""
          className="h-7 w-7 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-texto-invertido/70">
          Kynori
        </span>
      </div>

      <div>
        <div className="mb-10 origin-left scale-105 opacity-95">
          <AmostraProduto />
        </div>
        {mostrarHeadline && (
          <>
            <h2 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight">
              Seu treino,
              <br />
              do jeito que
              <br />
              você faz.
            </h2>
            <p className="mt-3.5 max-w-[32ch] text-[14.5px] leading-relaxed text-texto-invertido/60">
              Monte seu programa, registre cada série e veja a carga subir.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {progresso ? (
          <>
            <BarraProgressoClara {...progresso} />
            <span className="text-[12px] text-texto-invertido/50">
              Etapa {progresso.passo + 1} de {progresso.total}
            </span>
          </>
        ) : (
          <span className="text-[12px] text-texto-invertido/45">
            Leva 2 minutos pra começar.
          </span>
        )}
      </div>
    </aside>
  );
}

interface PropriedadesCasca {
  /** Presente nas etapas do wizard; ausente nas boas-vindas. */
  progresso?: Progresso;
  aoVoltar?: () => void;
  aoPular?: () => void;
  rotuloPular?: string;
  /** O painel escuro mostra a headline "Seu treino…" (wizard) ou só a prova
      de produto (boas-vindas, que já traz a headline na coluna direita). */
  painelHeadline?: boolean;
  children: ReactNode;
  /** Barra de ação fixa. Ausente quando a própria tela já traz o botão inline
      (ex.: Perfil, cujo submit vive dentro do FormularioPerfil). */
  rodape?: ReactNode;
}

export function CascaOnboarding({
  progresso,
  aoVoltar,
  aoPular,
  rotuloPular = "Pular",
  painelHeadline = true,
  children,
  rodape,
}: PropriedadesCasca) {
  const temChrome = Boolean(aoVoltar || aoPular || progresso);

  return (
    <div className="min-h-[100dvh] bg-fundo lg:grid lg:h-[100dvh] lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr]">
      <PainelMarca progresso={progresso} mostrarHeadline={painelHeadline} />

      {/* Coluna interativa — no mobile é a tela inteira; no lg, metade direita. */}
      <div className="flex min-h-[100dvh] flex-col lg:h-[100dvh] lg:min-h-0">
        {temChrome && (
          <div className="mx-auto w-full max-w-[480px] shrink-0 px-6 pt-[max(var(--safe-top),16px)] lg:max-w-[520px] lg:px-8">
            <div className="flex h-8 items-center justify-between pt-1.5">
              {aoVoltar ? (
                <button
                  type="button"
                  onClick={aoVoltar}
                  aria-label="Voltar"
                  className="-ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-texto-secundario transition-colors hover:bg-superficie-suave hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                >
                  <Icone nome="setaEsquerda" tamanho={18} />
                </button>
              ) : (
                <span />
              )}

              {aoPular && (
                <button
                  type="button"
                  onClick={aoPular}
                  className="-mr-2 rounded-lg px-2 py-1 text-sm font-medium text-texto-sutil transition-colors hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                >
                  {rotuloPular}
                </button>
              )}
            </div>

            {/* No lg o progresso mora no painel escuro; aqui some. */}
            {progresso && (
              <div className="mt-3.5 lg:hidden">
                <BarraProgresso {...progresso} />
              </div>
            )}
          </div>
        )}

        {/* Corpo rolável; no lg o bloco se centra verticalmente (my-auto) sem
            cortar o topo quando é alto demais. */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 px-6 pb-2 pt-5 lg:max-w-[460px] lg:my-auto lg:flex-none lg:px-8 lg:py-6">
            {children}
          </div>
        </div>

        {/* Rodapé: barra fixa no mobile; no lg vira parte da coluna, sem borda. */}
        {rodape && (
          <div className="mx-auto flex w-full max-w-[480px] shrink-0 flex-col gap-2 border-t border-borda-suave bg-superficie/90 px-6 pb-[max(var(--safe-bottom),20px)] pt-3 backdrop-blur-sm lg:max-w-[460px] lg:border-t-0 lg:bg-transparent lg:px-8 lg:pb-10 lg:backdrop-blur-none">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}
