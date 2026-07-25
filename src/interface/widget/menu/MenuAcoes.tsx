/* ═══════════════════════════════════════════
   MenuAcoes — Menu de ações (kebab)
   ───────────────────────────────────────────
   Botão de três pontos que abre um menu de ações. Fecha em clique fora,
   Esc, scroll ou seleção. O menu é renderizado em portal (fixed) porque os
   cartões das listas costumam usar `.reveal-up`, cujo transform residual cria
   um stacking context por item e prenderia o z-index de um dropdown ancorado.
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icone } from "@/interface/widget/svg/Icone";

export interface AcaoMenu {
  label: string;
  icone: string;
  onClick: () => void;
  perigo?: boolean;
  separadorAntes?: boolean;
}

const LARGURA_MENU = 208;

/** Três pontos verticais (kebab) — inline por serem círculos preenchidos. */
function IconeMaisOpcoes({ tamanho = 18 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export function MenuAcoes({
  rotulo,
  itens,
  largura = LARGURA_MENU,
}: {
  rotulo: string;
  itens: AcaoMenu[];
  largura?: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function abrir() {
    const r = botaoRef.current?.getBoundingClientRect();
    if (r) setPosicao({ top: r.bottom + 4, left: Math.max(8, r.right - largura) });
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (botaoRef.current?.contains(alvo) || menuRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    const fechar = () => setAberto(false);
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-texto-sutil transition-colors hover:bg-superficie-suave hover:text-texto-primario"
      >
        <IconeMaisOpcoes tamanho={18} />
      </button>
      {aberto &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: posicao.top, left: posicao.left, width: largura }}
            className="z-[70] overflow-hidden rounded-xl border border-borda bg-superficie shadow-lg shadow-black/10"
          >
            {itens.map((it, i) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false);
                  it.onClick();
                }}
                className={`flex w-full items-center gap-2.5 whitespace-nowrap px-3.5 py-2.5 text-left text-sm transition-colors ${
                  i > 0 || it.separadorAntes ? "border-t border-borda-suave" : ""
                } ${it.perigo ? "text-perigo hover:bg-perigo/10" : "text-texto-primario hover:bg-superficie-suave"}`}
              >
                <span className="shrink-0">
                  <Icone nome={it.icone} tamanho={16} />
                </span>
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
