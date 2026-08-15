/* ═══════════════════════════════════════════
   Botão de ação — rodapés de editor e de modal
   ═══════════════════════════════════════════ */

import { forwardRef } from "react";
import { Botao, type PropriedadesBotao } from "./Botao";
import { Icone, type NomeIconeUI } from "@/interface/widget/svg/Icone";

interface PropriedadesBotaoAcao extends Omit<PropriedadesBotao, "icone"> {
  /** Obrigatório por design: toda ação de rodapé/modal carrega um ícone.
      É o que separa este componente do `Botao` cru — quem esquecer não compila. */
  icone: NomeIconeUI;
}

/**
 * Ação de confirmar/cancelar em rodapé de editor ou de modal.
 *
 * O par ✕ / ✓ já era o padrão informal do projeto (rodapé dos editores,
 * OverlayAdicionarItem); aqui ele deixa de depender de disciplina. Use `Botao`
 * direto apenas para ações inline no corpo da tela.
 */
export const BotaoAcao = forwardRef<HTMLButtonElement, PropriedadesBotaoAcao>(
  function BotaoAcao({ icone, tamanho = "normal", ...props }, ref) {
    return (
      <Botao
        ref={ref}
        tamanho={tamanho}
        icone={<Icone nome={icone} tamanho={tamanho === "compacto" ? 14 : 16} />}
        {...props}
      />
    );
  }
);
