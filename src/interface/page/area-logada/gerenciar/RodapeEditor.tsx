/* ═══════════════════════════════════════════
   Rodapé dos editores — Fechar / Salvar
   ═══════════════════════════════════════════ */

import type { Ref } from "react";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";

interface PropriedadesRodapeEditor {
  /** Rótulo do botão primário — muda entre criar e editar. */
  rotuloSalvar: string;
  aoSalvar: () => void;
  aoFechar: () => void;
  /** Usado pelo tutorial para recortar o botão primário. */
  refSalvar?: Ref<HTMLButtonElement>;
}

/** Par de ações fixo ao alcance do polegar, igual nos editores de programa e
    de ficha — sair sem salvar sempre disponível ao lado do salvar. */
export function RodapeEditor({
  rotuloSalvar,
  aoSalvar,
  aoFechar,
  refSalvar,
}: PropriedadesRodapeEditor) {
  return (
    <div className="shrink-0 px-5 pt-4 pb-[max(var(--safe-bottom),16px)] border-t border-borda bg-superficie/95 backdrop-blur-sm">
      <div className="max-w-[480px] mx-auto flex gap-3">
        <Botao
          variante="secundario"
          onClick={aoFechar}
          icone={<Icone nome="fechar" tamanho={16} />}
          className="flex-1"
        >
          Fechar
        </Botao>
        <Botao
          ref={refSalvar}
          variante="primario"
          onClick={aoSalvar}
          icone={<Icone nome="check" tamanho={16} />}
          className="flex-1"
        >
          {rotuloSalvar}
        </Botao>
      </div>
    </div>
  );
}
