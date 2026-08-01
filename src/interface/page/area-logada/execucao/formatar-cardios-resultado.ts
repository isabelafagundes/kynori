import {
  resolverTipoCardio,
  type RegistroCardio,
  type TipoCardioDef,
} from "@/domain/tipos";
import { formatarNumeroBR } from "@/interface/util/numero";

export interface CardioResultado {
  chave: string;
  nome: string;
  detalhes: string;
}

const LIMITE_LINHAS_CARDIO = 5;

export function formatarCardiosResultado(
  cardios: RegistroCardio[],
  tiposCardio: TipoCardioDef[] = [],
): CardioResultado[] {
  const itens = cardios.map((cardio, indice) => ({
    chave: `${cardio.cardioId}-${indice}`,
    nome: resolverTipoCardio(cardio.tipo, tiposCardio).nome,
    detalhes: `${formatarNumeroBR(cardio.duracaoMinutos)} min${
      cardio.distanciaKm
        ? ` · ${formatarNumeroBR(cardio.distanciaKm)} km`
        : ""
    }`,
  }));

  if (itens.length <= LIMITE_LINHAS_CARDIO) return itens;

  const visiveis = itens.slice(0, LIMITE_LINHAS_CARDIO - 1);
  const quantidadeOculta = itens.length - visiveis.length;
  return [
    ...visiveis,
    {
      chave: "cardios-adicionais",
      nome: `+${quantidadeOculta} ${
        quantidadeOculta === 1 ? "outra atividade" : "outras atividades"
      }`,
      detalhes: "",
    },
  ];
}
