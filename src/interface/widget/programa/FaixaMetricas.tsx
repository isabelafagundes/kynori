import { Icone } from "@/interface/widget/svg/Icone";

interface PropriedadesFaixaMetricas {
  totalTreinos: number;
  /** Texto já formatado do último treino (ex.: "Ontem", "há 4 dias", "—") */
  ultimoTreinoLabel: string;
  treinadasSemana: number;
  /** Meta da semana = nº de fichas do programa */
  meta: number;
}

/** Acima deste nº de fichas, bolinhas dariam overflow na coluna → vira barra. */
const LIMIAR_BOLINHAS = 6;

/**
 * Progresso da semana como elemento concreto: uma bolinha por ficha da meta
 * (poucas fichas) ou uma barra que escala (muitas). Substitui o antigo ícone
 * de chama, que ficava pequeno e destoava numa fração X/Y.
 */
function ProgressoSemana({ feitas, meta }: { feitas: number; meta: number }) {
  if (meta > 0 && meta <= LIMIAR_BOLINHAS) {
    return (
      <div className="flex h-5 items-center justify-center gap-1.5">
        {Array.from({ length: meta }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i < feitas ? "bg-grafico-forte" : "border-[1.5px] border-borda"
            }`}
          />
        ))}
      </div>
    );
  }

  const pct = meta > 0 ? Math.min(100, Math.round((feitas / meta) * 100)) : 0;
  return (
    <div className="flex h-5 items-center justify-center">
      <div className="h-[7px] w-full max-w-[104px] overflow-hidden rounded-full bg-borda-suave">
        <div
          className="h-full rounded-full bg-grafico-forte"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Faixa de três métricas do programa: treinos realizados, último treino e
 * progresso da semana. Substitui a grade 2×2 de cartões + a barra separada
 * (que triplicavam a informação "esta semana").
 */
export function FaixaMetricas({
  totalTreinos,
  ultimoTreinoLabel,
  treinadasSemana,
  meta,
}: PropriedadesFaixaMetricas) {
  const completo = meta > 0 && treinadasSemana >= meta;

  return (
    <div className="flex items-center rounded-2xl border border-borda bg-superficie px-2 py-3.5">
      <div className="flex-1 px-1.5 text-center">
        <div className="flex h-5 items-center justify-center gap-1.5">
          <Icone nome="check" tamanho={15} className="text-texto-sutil" />
          <span className="font-display text-lg font-bold leading-none text-texto-primario tabular-nums">
            {totalTreinos}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-texto-sutil">treinos</p>
      </div>

      <div className="my-0.5 w-px self-stretch bg-borda-suave" />

      <div className="flex-1 px-1.5 text-center">
        <div className="flex h-5 items-center justify-center gap-1.5">
          <Icone nome="relogio" tamanho={15} className="text-texto-sutil" />
          <span className="font-display text-lg font-bold leading-none text-texto-primario">
            {ultimoTreinoLabel}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-texto-sutil">último treino</p>
      </div>

      <div className="my-0.5 w-px self-stretch bg-borda-suave" />

      <div className="flex-1 px-1.5 text-center">
        <ProgressoSemana feitas={treinadasSemana} meta={meta} />
        <p
          className={`mt-1.5 text-[11px] ${
            completo ? "font-semibold text-grafico-forte" : "text-texto-sutil"
          }`}
        >
          {treinadasSemana}/{meta} esta semana
        </p>
      </div>
    </div>
  );
}
