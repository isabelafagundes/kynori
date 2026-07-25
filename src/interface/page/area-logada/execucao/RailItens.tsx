import type { Exercicio, TipoCardioDef } from "@/domain/tipos";
import { Icone } from "@/interface/widget/svg/Icone";
import type { StatusItem } from "./hooks/useSessaoTreino";
import { nomeDoItem } from "./nomeItem";

interface PropriedadesRailItens {
  itens: StatusItem[];
  catalogo: Exercicio[];
  tiposCardio: TipoCardioDef[];
  aoIrPara: (indice: number) => void;
}

/** Lista lateral de itens (tablet/desktop): substitui os chips do mobile.
    Mostra a sequência inteira com status e progresso por item. "Abandonar
    treino" saiu do pé daqui e virou item do kebab (⋮) no header. */
export function RailItens({
  itens,
  catalogo,
  tiposCardio,
  aoIrPara,
}: PropriedadesRailItens) {
  return (
    <aside className="hidden w-[252px] shrink-0 flex-col border-r border-borda-suave md:flex lg:w-[288px]">
      <div className="px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-sutil">
        itens da ficha
      </div>

      <nav aria-label="Itens da ficha" className="min-h-0 flex-1 overflow-y-auto px-3">
        {itens.map((item) => {
          const { nome, emoji } = nomeDoItem(item, catalogo, tiposCardio);
          const ativo = item.estado === "ativo";
          const concluido = item.estado === "concluido";

          return (
            <button
              key={item.sessaoItemId}
              type="button"
              onClick={() => aoIrPara(item.indice)}
              aria-current={ativo ? "step" : undefined}
              className={`mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
                ativo
                  ? "border-borda-suave bg-acento-suave text-texto-primario shadow-sm"
                  : "border-transparent hover:bg-superficie-suave"
              }`}
            >
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                  ativo
                    ? "border-acento bg-acento text-texto-invertido"
                    : concluido
                      ? "border-acento bg-acento text-texto-invertido"
                    : "border-borda-suave bg-superficie text-texto-sutil"
                }`}
              >
                {concluido ? <Icone nome="check" tamanho={12} /> : item.indice + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] ${
                    ativo
                      ? "font-semibold text-texto-primario"
                      : concluido
                        ? "font-medium text-texto-sutil"
                        : "font-medium text-texto-primario"
                  }`}
                >
                  {emoji ? `${emoji} ${nome}` : nome}
                </span>
                <span
                  className={`block text-[11px] tabular-nums ${
                    ativo ? "text-texto-secundario" : "text-texto-sutil"
                  }`}
                >
                  {item.rotuloProgresso}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
