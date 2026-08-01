import type { ProgressaoCompartilhavel } from "@/application/compartilhamento/calcular-progressao-exercicio";
import { formatarNumeroBR } from "@/interface/util/numero";

function formatarRitmo(segundos: number) {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function formatarValorProgressao(
  progressao: ProgressaoCompartilhavel,
  valor: number,
) {
  if (progressao.unidade === "/500m") return `${formatarRitmo(valor)}/500m`;

  const casas = progressao.unidade === "km" ? 2 : 1;
  const numero = formatarNumeroBR(valor, casas);
  if (!progressao.unidade) return numero;
  if (progressao.unidade === "%") return `${numero}%`;
  return `${numero} ${progressao.unidade}`;
}

export function formatarEvolucaoPercentual(progressao: ProgressaoCompartilhavel) {
  const percentual = progressao.variacaoPercentual;
  if (percentual === null) return "Evolução registrada";
  if (Math.abs(percentual) < 0.05) return "Estável no período";

  const valor = formatarNumeroBR(Math.abs(percentual), 1);
  return percentual > 0 ? `+${valor}% de evolução` : `-${valor}% no período`;
}

export function formatarDataProgressao(dataISO: string) {
  return new Date(dataISO).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatarPeriodoProgressao(progressao: ProgressaoCompartilhavel) {
  const primeiro = progressao.pontos[0];
  const ultimo = progressao.pontos[progressao.pontos.length - 1];
  if (!primeiro || !ultimo) return "";

  const formatador = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  });
  const inicio = formatador.format(new Date(primeiro.data));
  const fim = formatador.format(new Date(ultimo.data));
  return inicio === fim ? inicio : `${inicio} a ${fim}`;
}
