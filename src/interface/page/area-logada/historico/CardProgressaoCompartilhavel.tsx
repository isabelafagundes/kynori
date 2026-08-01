import type { ProgressaoCompartilhavel } from "@/application/compartilhamento/calcular-progressao-exercicio";
import { FundoResultado } from "@/interface/widget/fundo-resultado/FundoResultado";
import {
  velaFoto,
  type SelecaoFundo,
} from "@/interface/widget/fundo-resultado/presets-fundo";
import {
  formatarDataProgressao,
  formatarEvolucaoPercentual,
  formatarPeriodoProgressao,
  formatarValorProgressao,
} from "./formatar-progressao-compartilhavel";

export function CardProgressaoCompartilhavel({
  progressao,
  fundo,
}: {
  progressao: ProgressaoCompartilhavel;
  fundo: SelecaoFundo;
}) {
  const maiorValor = Math.max(1, ...progressao.pontos.map((ponto) => ponto.valor));
  const scrim = fundo.tipo === "foto"
    ? (() => {
        const vela = velaFoto(fundo.escurecer);
        return `linear-gradient(to bottom, rgba(0,0,0,${vela.topo}), rgba(0,0,0,${vela.meio}) 40%, rgba(0,0,0,${vela.base}))`;
      })()
    : "linear-gradient(to bottom, rgba(0,0,0,.08), rgba(0,0,0,.18) 42%, rgba(0,0,0,.58))";

  return (
    <div
      style={{ containerType: "inline-size" }}
      className="relative aspect-[4/5] w-full overflow-hidden rounded-[14px] border border-black/15 bg-slate-900 text-white shadow-sm"
      aria-label={`Prévia da progressão de ${progressao.nome}`}
    >
      {fundo.tipo === "foto" ? (
        <img src={fundo.dataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <FundoResultado preset={fundo.preset} seed={`progressao-${progressao.id}`} animado />
      )}
      <div className="absolute inset-0" style={{ background: scrim }} />

      <div className="relative flex h-full flex-col p-[6%]">
        <div className="flex items-center justify-between">
          <span className="text-[clamp(11px,3.4cqw,18px)] font-bold uppercase tracking-[.2em]">
            Kynori
          </span>
          <span className="text-[clamp(8px,2.5cqw,13px)] font-semibold uppercase tracking-[.14em] text-white/70">
            Minha progressão
          </span>
        </div>

        <div className="mt-[8%]">
          <p className="text-[clamp(9px,2.7cqw,14px)] font-medium text-white/70">
            {progressao.descricao}
          </p>
          <h2 className="mt-[1%] line-clamp-2 font-display text-[clamp(22px,8cqw,42px)] font-bold leading-[1.02]">
            {progressao.nome}
          </h2>
          <div className="mt-[4%] inline-flex rounded-full border border-white/20 bg-white/15 px-[4%] py-[1.5%] text-[clamp(10px,3cqw,15px)] font-semibold backdrop-blur-sm">
            {formatarEvolucaoPercentual(progressao)}
          </div>
        </div>

        <div className="mt-auto rounded-[16px] border border-white/20 bg-white/[0.13] p-[5%] backdrop-blur-md">
          <div className="flex h-[29cqw] items-end justify-center gap-[3%] border-b border-white/20 pb-[4%]">
            {progressao.pontos.map((ponto, indice) => {
              const altura = Math.max(10, (ponto.valor / maiorValor) * 100);
              const ultimo = indice === progressao.pontos.length - 1;
              return (
                <div key={ponto.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-[5%]">
                  <div className="flex min-h-0 flex-1 items-end justify-center">
                    <span
                      className={`block w-full max-w-[15cqw] rounded-t-[4px] ${ultimo ? "bg-white shadow-sm" : "bg-white/45"}`}
                      style={{ height: `${altura}%` }}
                    />
                  </div>
                  <span className={`truncate text-center text-[clamp(7px,2cqw,10px)] tabular-nums ${ultimo ? "font-semibold text-white" : "text-white/60"}`}>
                    {formatarDataProgressao(ponto.data)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-[4%] grid grid-cols-3 gap-[3%]">
            <Metrica rotulo="Início" valor={formatarValorProgressao(progressao, progressao.valorInicial)} />
            <Metrica rotulo="Atual" valor={formatarValorProgressao(progressao, progressao.valorAtual)} destaque />
            <Metrica rotulo="Melhor" valor={formatarValorProgressao(progressao, progressao.melhorValor)} />
          </div>
          <p className="mt-[4%] text-[clamp(8px,2.4cqw,12px)] text-white/60">
            {progressao.pontos.length} sessões · {formatarPeriodoProgressao(progressao)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-[clamp(7px,2.2cqw,11px)] text-white/55">{rotulo}</span>
      <strong className={`mt-[2%] block truncate font-display text-[clamp(11px,3.8cqw,20px)] font-bold tabular-nums ${destaque ? "text-white" : "text-white/85"}`}>
        {valor}
      </strong>
    </div>
  );
}
