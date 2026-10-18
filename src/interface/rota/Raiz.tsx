/* ═══════════════════════════════════════════
   Raiz da árvore: app direto ou dentro da moldura
   ───────────────────────────────────────────
   O Kynori é mobile-only por enquanto. Na web, acima do breakpoint de
   desktop, o app não estica: ele roda dentro de uma moldura de celular
   (MolduraMobile), que o carrega num iframe com ?moldura=1.

   Esta é a única decisão sobre moldura no projeto — tudo abaixo daqui
   (DadosProvider, rotas, telas) continua sem saber que ela existe.
   ═══════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import { MolduraMobile } from "@/interface/widget/moldura/MolduraMobile";
import { DadosProvider } from "./DadosProvider";
import { RotasApp } from "./RotasApp";

// `pointer: fine` exclui tablets grandes (iPad em paisagem passa de 1024px e
// não faz sentido emoldurar um app mobile dentro de outro aparelho mobile).
const CONSULTA_DESKTOP = "(min-width: 1024px) and (pointer: fine)";

/** Esta janela já é o conteúdo de uma moldura? Evita a recursão infinita. */
function estaDentroDaMoldura() {
  return new URLSearchParams(window.location.search).get("moldura") === "1";
}

function deveEmoldurar() {
  if (Capacitor.isNativePlatform() || estaDentroDaMoldura()) return false;
  return window.matchMedia(CONSULTA_DESKTOP).matches;
}

export function Raiz() {
  const [emoldurado, setEmoldurado] = useState(deveEmoldurar);

  useEffect(() => {
    if (Capacitor.isNativePlatform() || estaDentroDaMoldura()) return;
    const consulta = window.matchMedia(CONSULTA_DESKTOP);
    const aoMudar = () => setEmoldurado(consulta.matches);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  if (emoldurado) return <MolduraMobile />;

  return (
    <HashRouter>
      <DadosProvider>
        <RotasApp />
      </DadosProvider>
    </HashRouter>
  );
}
