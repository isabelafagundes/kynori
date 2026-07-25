import { useEffect, useRef } from "react";
import type { Exercicio, TipoCardioDef } from "@/domain/tipos";
import { Icone } from "@/interface/widget/svg/Icone";
import type { StatusItem } from "./hooks/useSessaoTreino";
import { nomeDoItem } from "./nomeItem";

interface PropriedadesChipsItens {
  itens: StatusItem[];
  catalogo: Exercicio[];
  tiposCardio: TipoCardioDef[];
  aoIrPara: (indice: number) => void;
}

/** Navegação por item no mobile: um chip por item da ficha, na ordem definida
    na criação — cardio é só mais um chip. No md+ o rail assume esse papel. */
export function ChipsItens({ itens, catalogo, tiposCardio, aoIrPara }: PropriedadesChipsItens) {
  const chipAtivoRef = useRef<HTMLButtonElement | null>(null);

  const indiceAtivo = itens.findIndex((item) => item.estado === "ativo");

  useEffect(() => {
    chipAtivoRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [indiceAtivo]);

  return (
    <div className="scrollbar-mobile-hidden flex gap-1.5 overflow-x-auto px-4 pb-1 pt-2.5 md:hidden">
      {itens.map((item) => {
        const { nome, emoji } = nomeDoItem(item, catalogo, tiposCardio);
        const ativo = item.estado === "ativo";
        const concluido = item.estado === "concluido";
        const rotulo = item.tipo === "exercicio" ? nome.split(" ").slice(0, 2).join(" ") : nome;

        return (
          <button
            key={item.sessaoItemId}
            type="button"
            ref={ativo ? chipAtivoRef : undefined}
            onClick={() => aoIrPara(item.indice)}
            aria-label={`Ir para ${nome}`}
            aria-current={ativo ? "step" : undefined}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
              ativo
                ? "border-acento bg-acento font-semibold text-texto-invertido"
                : concluido
                  ? "border-borda-suave bg-superficie font-medium text-texto-primario"
                  : "border-borda-suave bg-superficie font-medium text-texto-sutil"
            }`}
          >
            {concluido ? (
              <Icone nome="check" tamanho={12} />
            ) : (
              <span className="tabular-nums">{item.indice + 1}</span>
            )}
            {emoji ? `${emoji} ${rotulo}` : rotulo}
          </button>
        );
      })}
    </div>
  );
}
