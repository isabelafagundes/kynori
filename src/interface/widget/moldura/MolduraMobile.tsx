/* ═══════════════════════════════════════════
   Moldura de celular para a web em telas largas
   ───────────────────────────────────────────
   O Kynori é um app mobile. Em vez de esticar as telas no desktop, a versão
   web em tela larga desenha uma "mesa" com um celular no centro e roda o app
   dentro dele.

   O app roda num <iframe> de propósito: as media queries (lg:, @media) são
   avaliadas contra a viewport do iframe, então dentro da moldura o app é
   mobile de verdade — sem precisar neutralizar cada breakpoint espalhado pela
   interface. O iframe carrega a mesma página com ?moldura=1, que é o que
   impede a recursão (ver Raiz.tsx).
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";

const LARGURA_TELA = 390; // iPhone 14/15 em pontos CSS
const ALTURA_TELA = 844;
const BISEL = 10;

export function MolduraMobile() {
  const refIframe = useRef<HTMLIFrameElement>(null);
  const refObservador = useRef<MutationObserver | null>(null);

  // Calculado uma única vez: mudar o src remontaria o app dentro da moldura.
  const [src] = useState(
    () => `${window.location.pathname}?moldura=1${window.location.hash || "#/"}`,
  );

  useEffect(() => () => refObservador.current?.disconnect(), []);

  function aoCarregar() {
    const janela = refIframe.current?.contentWindow;
    if (!janela) return;

    // Espelha a navegação interna na URL da aba: recarregar a página — ou
    // estreitar a janela e sair da moldura — cai na mesma tela.
    const sincronizarHash = () => {
      window.history.replaceState(null, "", janela.location.hash || "#/");
    };
    sincronizarHash();
    janela.addEventListener("hashchange", sincronizarHash);

    // A mesa segue o tema escolhido dentro do app (o temaManager do iframe é
    // outra instância, então observamos o atributo que ele escreve).
    const raizInterna = janela.document.documentElement;
    const espelharTema = () => {
      const tema = raizInterna.getAttribute("data-tema");
      if (tema) document.documentElement.setAttribute("data-tema", tema);
      document.documentElement.style.colorScheme = raizInterna.style.colorScheme;
    };
    espelharTema();

    refObservador.current?.disconnect();
    refObservador.current = new MutationObserver(espelharTema);
    refObservador.current.observe(raizInterna, {
      attributes: true,
      attributeFilter: ["data-tema", "style"],
    });
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden bg-superficie-suave px-6 py-8">
      {/* Halo atrás do celular: dá profundidade sem competir com o app. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 45%, var(--background-app-a), transparent 70%)",
        }}
      />

      <div
        className="relative flex-shrink"
        style={{
          width: LARGURA_TELA + BISEL * 2,
          height: `min(${ALTURA_TELA + BISEL * 2}px, calc(100dvh - 9rem))`,
        }}
      >
        {/* Botões físicos: sugerem o aparelho sem invadir a tela. */}
        <div aria-hidden>
          <span className="absolute -left-[3px] top-[104px] h-7 w-[4px] rounded-l-full bg-acento/70" />
          <span className="absolute -left-[3px] top-[148px] h-12 w-[4px] rounded-l-full bg-acento/70" />
          <span className="absolute -left-[3px] top-[208px] h-12 w-[4px] rounded-l-full bg-acento/70" />
          <span className="absolute -right-[3px] top-[176px] h-20 w-[4px] rounded-r-full bg-acento/70" />
        </div>

        {/* Bisel */}
        <div
          className="h-full w-full rounded-[46px] bg-acento"
          style={{
            padding: BISEL,
            boxShadow:
              "inset 0 1px 0 oklch(1 0 0 / 0.14), 0 32px 64px -16px oklch(0 0 0 / 0.35), 0 8px 24px -8px oklch(0 0 0 / 0.25), 0 0 0 1px oklch(0 0 0 / 0.08)",
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-[37px] bg-fundo">
            <iframe
              ref={refIframe}
              src={src}
              onLoad={aoCarregar}
              title="Kynori"
              allow="clipboard-write; fullscreen"
              className="block h-full w-full border-0"
            />
          </div>
        </div>
      </div>

      <p className="relative max-w-[420px] text-center text-sm leading-relaxed text-texto-sutil">
        O Kynori foi feito para o celular. No computador ele roda nesta moldura,
        com a mesma experiência no tamanho certo.
      </p>
    </div>
  );
}
