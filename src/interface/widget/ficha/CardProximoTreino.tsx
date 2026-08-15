import { forwardRef } from "react";
import type { Exercicio, Ficha } from "@/domain/tipos";
import { cardioDaFicha, exerciciosDaFicha } from "@/domain/ficha";
import {
  estimarDuracaoMinutos,
  extrairGruposMusculares,
} from "@/interface/page/area-logada/programa/utils";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone, IconeFicha } from "@/interface/widget/svg/Icone";

interface PropriedadesCardProximoTreino {
  ficha: Ficha;
  exerciciosCatalogo: Exercicio[];
  aoIniciarTreino: (fichaId: string) => void;
  /** Segunda via: começar um treino livre (sem ficha). Quando presente,
      um rodapé discreto aparece dentro do card, abaixo do CTA principal. */
  aoIniciarLivre?: () => void;
}

/**
 * Card do próximo treino — o elemento dominante da home.
 *
 * Hierarquia do conteúdo, de cima para baixo: grupos musculares como chips
 * (o "o que vou treinar" antes do nome), nome em display grande, e a linha
 * de custo (quantos exercícios, quanto tempo estimado) logo antes do CTA.
 * O ícone da ficha fica no canto, como assinatura, não como protagonista.
 *
 * A ref vai para o botão de iniciar porque o tutorial guiado precisa
 * medir o elemento real para recortá-lo no overlay.
 */
export const CardProximoTreino = forwardRef<
  HTMLButtonElement,
  PropriedadesCardProximoTreino
>(function CardProximoTreino(
  { ficha, exerciciosCatalogo, aoIniciarTreino, aoIniciarLivre },
  ref,
) {
  const exerciciosFicha = exerciciosDaFicha(ficha);
  const quantidadeCardio = cardioDaFicha(ficha).length;
  const gruposMusculares = extrairGruposMusculares(exerciciosFicha, exerciciosCatalogo);
  const duracaoEstimada = estimarDuracaoMinutos(ficha);
  const fichaVazia = exerciciosFicha.length === 0 && quantidadeCardio === 0;

  return (
    /* Em telas largas o CTA sai de baixo e vai para o lado: esticado ele
       virava um botão de ~700px, alvo desproporcional para uma ação única.
       Adaptar a composição, não apenas esticar o mesmo layout. */
    <div className="card-destaque relative overflow-hidden rounded-2xl border border-borda">
      <div className="relative p-4">
      {/* Só no mobile o ícone fica fora do fluxo, no canto: na linha dos
          chips ele esticava a linha e abria um vão antes do título. No md+
          o canto pertence ao CTA, então o ícone entra no fluxo à esquerda. */}
      <div
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-acento-suave text-texto-primario shadow-sm md:hidden"
        aria-hidden="true"
      >
        <IconeFicha nome={ficha.icone} tamanho={22} emoji={ficha.emoji} />
      </div>

      <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 items-center md:gap-4">
          <div
            className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-[12px] bg-acento-suave text-texto-primario shadow-sm md:flex"
            aria-hidden="true"
          >
            <IconeFicha nome={ficha.icone} tamanho={26} emoji={ficha.emoji} />
          </div>

          <div className="min-w-0 flex-1">
            {gruposMusculares.length > 0 && (
              <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5 pr-12 md:pr-0">
                {gruposMusculares.map((grupo) => (
                  <span
                    key={grupo}
                    className="inline-flex items-center rounded-full bg-acento-suave px-2 py-0.5 text-[11px] font-semibold leading-tight text-texto-secundario"
                  >
                    {grupo}
                  </span>
                ))}
              </div>
            )}

            <h3 className="truncate pr-12 font-display text-2xl font-bold leading-tight text-texto-primario md:pr-0">
              {ficha.nome}
            </h3>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-sutil">
            {fichaVazia ? (
              <span>Nenhum exercício ainda</span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="halter" tamanho={15} />
                  {exerciciosFicha.length}{" "}
                  {exerciciosFicha.length === 1 ? "exercício" : "exercícios"}
                  {quantidadeCardio > 0 &&
                    ` + ${quantidadeCardio} cardio`}
                </span>
                {duracaoEstimada > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icone nome="relogio" tamanho={15} />~{duracaoEstimada} min
                  </span>
                )}
              </>
            )}
            </p>
          </div>
        </div>

        <Botao
          ref={ref}
          variante="primario"
          ocuparLarguraTotal
          icone={<Icone nome="reproduzir" tamanho={15} />}
          onClick={() => aoIniciarTreino(ficha.id)}
          className="font-display text-[0.9375rem] font-bold md:w-auto md:flex-shrink-0 md:px-7"
        >
          Iniciar treino
        </Botao>
      </div>
      </div>

      {/* Segunda via — treino livre. Rodapé de largura total, dividido por um
          fio: mesma leitura no mobile (abaixo do CTA vertical) e no md+ (abaixo
          da linha horizontal). Secundário ao CTA principal, nunca compete. */}
      {aoIniciarLivre && (
        <button
          type="button"
          onClick={aoIniciarLivre}
          className="flex w-full items-center justify-center gap-2 border-t border-borda-suave px-4 py-3 text-sm font-semibold text-texto-secundario transition-colors duration-200 hover:bg-superficie-suave/60 hover:text-texto-primario focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento"
        >
          <Icone nome="raio" tamanho={15} />
          ou monte um treino livre
          <Icone nome="setaDireita" tamanho={14} />
        </button>
      )}
    </div>
  );
});
