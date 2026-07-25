/* ═══════════════════════════════════════════
   Overlay do tutorial — tratamento "recorte escuro"

   O véu vem de um box-shadow de raio enorme num
   elemento no lugar do alvo (buraco arredondado);
   faixas transparentes ao redor só bloqueiam o
   clique fora, mantendo o alvo clicável.
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { numeroDoPasso, TOTAL_PASSOS_NUMERADOS } from "@/domain/tutorial";
import { useTutorial } from "./TutorialProvider";

interface Caixa {
  topo: number;
  esquerda: number;
  largura: number;
  altura: number;
}

const RESPIRO = 8;
const LARGURA_BALAO = 320;
const MARGEM_TELA = 16;
/** Espaço mínimo abaixo do alvo para o balão caber sem apertar. */
const ESPACO_MINIMO_ABAIXO = 220;

function mesmaCaixa(a: Caixa | null, b: Caixa | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.topo - b.topo) < 0.5 &&
    Math.abs(a.esquerda - b.esquerda) < 0.5 &&
    Math.abs(a.largura - b.largura) < 0.5 &&
    Math.abs(a.altura - b.altura) < 0.5
  );
}

/**
 * Acompanha a posição do alvo. Usa rAF em vez de escutar scroll/resize porque
 * o alvo pode se mover por animação (os editores entram como drawer) — e
 * animação não dispara nenhum desses eventos.
 */
function useCaixaDoAlvo(elemento: HTMLElement | null): Caixa | null {
  const [caixa, setCaixa] = useState<Caixa | null>(null);

  // O alvo é lido por ref DENTRO do loop, nunca capturado no closure. Ao trocar
  // de passo o React às vezes RECICLA o nó do alvo antigo (o footer "Criar
  // Ficha" da ficha vira o "Salvar" do programa, mesma posição na árvore); um
  // loop que tivesse capturado o elemento continuaria medindo o nó reciclado e
  // recortaria o botão errado. Um único loop persistente lendo elRef.current
  // sempre mede o alvo atual.
  const elRef = useRef(elemento);
  elRef.current = elemento;

  useEffect(() => {
    let frame = 0;
    let anterior: Caixa | null = null;

    const empurrar = (atual: Caixa | null) => {
      if (!mesmaCaixa(anterior, atual)) {
        anterior = atual;
        setCaixa(atual);
      }
    };

    const medir = () => {
      const el = elRef.current;
      if (!el || !el.isConnected) {
        empurrar(null);
        frame = requestAnimationFrame(medir);
        return;
      }

      const r = el.getBoundingClientRect();

      // O alvo pode estar montado mas COBERTO por uma camada superior — a
      // subtela de itens da ficha, ou o drawer de programa que reabre depois
      // de salvar. Nesses casos o alvo de fundo não é o que a pessoa vê, então
      // o overlay espera (caixa nula) até ele voltar a ficar por cima. Sem
      // isso o recorte cairia num botão escondido, desalinhado do de cima.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // elementsFromPoint (plural) devolve a pilha de cima para baixo. O
      // próprio overlay está no topo (z-100), então ignoramos qualquer coisa
      // dele e pegamos o primeiro elemento REAL sob o cursor. Sem isso a
      // checagem enxergaria a própria faixa de bloqueio e se auto-ocultaria.
      const noTopo = document
        .elementsFromPoint(cx, cy)
        .find((alvo) => !alvo.closest("[data-tutorial-overlay]"));
      const visivel = !!noTopo && (el.contains(noTopo) || noTopo.contains(el));

      empurrar(
        visivel
          ? { topo: r.top, esquerda: r.left, largura: r.width, altura: r.height }
          : null,
      );
      frame = requestAnimationFrame(medir);
    };

    frame = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(frame);
  }, []);

  return caixa;
}

export function OverlayTutorial() {
  const { ativo, passo, indicePasso, elementoAlvo, avancar, encerrar } =
    useTutorial();
  const caixa = useCaixaDoAlvo(elementoAlvo);

  // Traz o alvo para a área visível antes de destacá-lo.
  useEffect(() => {
    if (!elementoAlvo) return;
    elementoAlvo.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [elementoAlvo]);

  // Sem alvo montado o overlay simplesmente não aparece — o tutorial espera
  // a tela certa em vez de escurecer uma tela onde não tem o que apontar.
  if (!ativo || !passo || !caixa) return null;

  const buraco = {
    topo: caixa.topo - RESPIRO,
    esquerda: caixa.esquerda - RESPIRO,
    largura: caixa.largura + RESPIRO * 2,
    altura: caixa.altura + RESPIRO * 2,
  };
  const buracoBase = buraco.topo + buraco.altura;
  const alturaTela = window.innerHeight;
  const larguraTela = window.innerWidth;

  const larguraBalao = Math.min(LARGURA_BALAO, larguraTela - MARGEM_TELA * 2);
  const cabeAbaixo = alturaTela - buracoBase >= ESPACO_MINIMO_ABAIXO;

  const centroAlvo = caixa.esquerda + caixa.largura / 2;
  const esquerdaBalao = Math.min(
    Math.max(centroAlvo - larguraBalao / 2, MARGEM_TELA),
    larguraTela - larguraBalao - MARGEM_TELA,
  );
  // A seta aponta o alvo mesmo quando o balão foi empurrado pela borda da tela.
  const setaEsquerda = Math.min(
    Math.max(centroAlvo - esquerdaBalao - 6.5, 14),
    larguraBalao - 27,
  );

  const numero = numeroDoPasso(indicePasso);
  // Faixas transparentes: só bloqueiam o clique fora do alvo. O escurecimento
  // fica por conta do box-shadow do recorte, para o buraco poder ser arredondado.
  const bloqueio = "absolute pointer-events-auto";

  return createPortal(
    <div
      // pointer-events-none no contêiner é o que deixa o buraco realmente
      // vazio: as faixas e o balão reativam o evento por conta própria. Sem
      // isso o alvo aparece destacado mas não recebe o toque.
      className="pointer-events-none fixed inset-0 z-[100]"
      data-tutorial-overlay=""
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial: ${passo.titulo}`}
    >
      {/*
        Recorte + escurecimento num elemento só: o box-shadow de raio enorme
        pinta tudo em volta e o border-radius arredonda o buraco de verdade.
        Quatro faixas retangulares deixariam os cantos do buraco em ângulo reto
        (as "pontas") porque o anel arredondado não cobre a luz do canto.
        Os dois shadows: 2px claro colado na borda (o antigo ring) + o véu.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-[14px]"
        style={{
          top: buraco.topo,
          left: buraco.esquerda,
          width: buraco.largura,
          height: buraco.altura,
          boxShadow:
            "0 0 0 2px oklch(0.985 0.005 70 / 0.9), 0 0 0 9999px oklch(0.15 0.01 55 / 0.65)",
        }}
      />

      {/* Faixas invisíveis ao redor do alvo — o buraco no meio fica clicável */}
      <div className={bloqueio} style={{ top: 0, left: 0, right: 0, height: Math.max(buraco.topo, 0) }} />
      <div className={bloqueio} style={{ top: buracoBase, left: 0, right: 0, bottom: 0 }} />
      <div
        className={bloqueio}
        style={{
          top: buraco.topo,
          left: 0,
          width: Math.max(buraco.esquerda, 0),
          height: buraco.altura,
        }}
      />
      <div
        className={bloqueio}
        style={{
          top: buraco.topo,
          left: buraco.esquerda + buraco.largura,
          right: 0,
          height: buraco.altura,
        }}
      />

      {/* Balão */}
      <div
        className="pointer-events-auto absolute"
        style={
          cabeAbaixo
            ? { top: buracoBase + 12, left: esquerdaBalao, width: larguraBalao }
            : {
                bottom: alturaTela - buraco.topo + 12,
                left: esquerdaBalao,
                width: larguraBalao,
              }
        }
      >
        <span
          aria-hidden="true"
          className="absolute h-3 w-3 rotate-45 bg-acento"
          style={
            cabeAbaixo
              ? { top: -5, left: setaEsquerda }
              : { bottom: -5, left: setaEsquerda }
          }
        />

        <div className="rounded-2xl bg-acento p-4 shadow-2xl shadow-black/40">
          {numero > 0 && (
            <p className="mb-1.5 font-display text-[10px] font-extrabold uppercase tracking-[0.09em] text-texto-invertido/60">
              Passo {numero} de {TOTAL_PASSOS_NUMERADOS}
            </p>
          )}

          <p className="text-sm font-bold leading-snug text-texto-invertido">
            {passo.titulo}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-texto-invertido/65">
            {passo.texto}
          </p>

          {passo.aviso && (
            <div className="mt-2.5 flex items-start gap-2 rounded-[10px] bg-texto-invertido/10 px-2.5 py-2">
              <span aria-hidden="true" className="text-xs leading-snug">
                ⚠️
              </span>
              <p className="text-[11.5px] leading-relaxed text-texto-invertido/70">
                {passo.aviso}
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={encerrar}
              className="rounded-lg py-1 text-xs font-semibold text-texto-invertido/60 transition-colors hover:text-texto-invertido focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-superficie"
            >
              Sair do tutorial
            </button>
            <button
              type="button"
              onClick={avancar}
              className="rounded-[9px] bg-superficie px-3.5 py-2 text-[12.5px] font-bold text-acento transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-superficie"
            >
              {passo.rotuloAcao}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
