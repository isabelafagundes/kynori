import type { ResumoCompartilhamento } from "@/application/compartilhamento/calcular-resumo-treino";
import type { Ficha, RegistroTreino, TipoCardioDef } from "@/domain/tipos";
import { desenharFundo } from "@/interface/widget/fundo-resultado/fundo-resultado.renderer";
import { velaFoto, type SelecaoFundo } from "@/interface/widget/fundo-resultado/presets-fundo";
import { formatarCardiosResultado, type CardioResultado } from "./formatar-cardios-resultado";

const L = 1080;
const A = 1350;

function formatarDuracao(segundos: number) { const h = Math.floor(segundos / 3600); const m = Math.floor((segundos % 3600) / 60); return h ? `${h}h ${m}min` : `${Math.max(1, m)} min`; }

function textoTruncado(ctx: CanvasRenderingContext2D, texto: string, max: number) { if (ctx.measureText(texto).width <= max) return texto; let t = texto; while (t.length && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1); return `${t}…`; }

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("Não foi possível carregar a foto")); img.src = src; });
}
/** Desenha a imagem cobrindo (cover) a área w×h, centralizada. */
function desenharCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const escala = Math.max(w / img.width, h / img.height);
  const dw = img.width * escala, dh = img.height * escala;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Chips de grupos musculares numa linha; ignora os que não couberem. */
function desenharGrupos(ctx: CanvasRenderingContext2D, grupos: string[], x0: number, y: number) {
  const h = 44; let x = x0; ctx.font = "500 24px system-ui"; ctx.textBaseline = "middle";
  for (const grupo of grupos) {
    const largura = ctx.measureText(grupo).width + 42;
    if (x + largura > 984) break;
    ctx.beginPath(); ctx.roundRect(x, y, largura, h, 22);
    ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillText(grupo, x + 21, y + h / 2 + 1);
    x += largura + 12;
  }
  ctx.textBaseline = "alphabetic";
}

interface ChipCardio {
  rotulo: string;
  largura: number;
}

function prepararChipsCardio(ctx: CanvasRenderingContext2D, cardios: CardioResultado[], larguraMaxima: number): ChipCardio[] {
  ctx.font = "500 24px system-ui";
  return cardios.map((cardio) => {
    const rotuloCompleto = `${cardio.nome}${cardio.detalhes ? ` · ${cardio.detalhes}` : ""}`;
    const rotulo = textoTruncado(ctx, rotuloCompleto, larguraMaxima - 42);
    return { rotulo, largura: ctx.measureText(rotulo).width + 42 };
  });
}

function contarLinhasChips(chips: ChipCardio[], larguraMaxima: number): number {
  if (!chips.length) return 0;
  let linhas = 1;
  let larguraLinha = 0;
  for (const chip of chips) {
    const proximaLargura = larguraLinha ? larguraLinha + 12 + chip.largura : chip.largura;
    if (proximaLargura > larguraMaxima && larguraLinha) {
      linhas += 1;
      larguraLinha = chip.largura;
    } else {
      larguraLinha = proximaLargura;
    }
  }
  return linhas;
}

function desenharChipsCardio(ctx: CanvasRenderingContext2D, chips: ChipCardio[], x0: number, y0: number, larguraMaxima: number) {
  const h = 44;
  let x = x0;
  let y = y0;
  ctx.font = "500 24px system-ui";
  ctx.textBaseline = "middle";
  for (const chip of chips) {
    if (x > x0 && x + chip.largura > x0 + larguraMaxima) {
      x = x0;
      y += h + 12;
    }
    ctx.beginPath(); ctx.roundRect(x, y, chip.largura, h, 22);
    ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillText(chip.rotulo, x + 21, y + h / 2 + 1);
    x += chip.largura + 12;
  }
  ctx.textBaseline = "alphabetic";
}

export async function desenharCard(registro: RegistroTreino, ficha: Ficha, resumo: ResumoCompartilhamento, fundo: SelecaoFundo, grupos: string[], tiposCardio: TipoCardioDef[] = []): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas"); canvas.width = L; canvas.height = A;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas indisponível");
  const cardios = formatarCardiosResultado(registro.cardio, tiposCardio);
  const larguraConteudo = L - 96 - 112;
  const chipsCardio = prepararChipsCardio(ctx, cardios, larguraConteudo);
  const linhasCardio = contarLinhasChips(chipsCardio, larguraConteudo);

  // Fundo: preset (gradiente) ou foto (cover).
  if (fundo.tipo === "foto") { desenharCover(ctx, await carregarImagem(fundo.dataUrl), L, A); }
  else { desenharFundo(ctx, L, A, fundo.preset, registro.id, 0); }

  // Véu de contraste (mais forte sobre foto, conforme "escurecer").
  const v = fundo.tipo === "foto" ? velaFoto(fundo.escurecer) : { topo: 0.04, meio: 0.12, base: 0.5 };
  const shade = ctx.createLinearGradient(0, 0, 0, A);
  shade.addColorStop(0, `rgba(0,0,0,${v.topo})`); shade.addColorStop(0.4, `rgba(0,0,0,${v.meio})`); shade.addColorStop(1, `rgba(0,0,0,${v.base})`);
  ctx.fillStyle = shade; ctx.fillRect(0, 0, L, A);

  // Zona superior: marca + eyebrow + emoji.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff"; ctx.font = "700 32px system-ui"; ctx.textAlign = "left"; ctx.fillText("KYNORI", 88, 110);
  ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "600 22px system-ui"; ctx.textAlign = "right"; ctx.fillText("TREINO CONCLUÍDO", 992, 108);
  if (fundo.tipo !== "foto") {
    ctx.textAlign = "center"; ctx.font = "150px system-ui"; ctx.fillText(ficha.emoji || "💪", L / 2, 470);
  }
  ctx.textAlign = "left";

  // Painel glass inferior (sem blur no canvas: painel translúcido).
  const px = 48, py = 735 - Math.max(0, linhasCardio - 1) * 56, pw = L - 96, ph = A - py - 48, pad = 56, cx = px + pad;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 28);
  ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.stroke();

  ctx.fillStyle = "#fff";
  const tituloX = fundo.tipo === "foto" ? cx + 72 : cx;
  if (fundo.tipo === "foto") {
    ctx.font = "48px system-ui";
    ctx.fillText(ficha.emoji || "💪", cx, py + 94);
  }
  ctx.font = "600 58px system-ui";
  ctx.fillText(textoTruncado(ctx, ficha.nome, pw - pad * 2 - (tituloX - cx)), tituloX, py + 96);
  ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "400 27px system-ui"; ctx.fillText(new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(registro.finalizadoEm)), cx, py + 140);

  if (grupos.length) desenharGrupos(ctx, grupos, cx, py + 170);

  const yDiv = py + 250;
  ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, yDiv); ctx.lineTo(px + pw - pad, yDiv); ctx.stroke();

  const metricas = [
    ...(resumo.duracaoSegundos ? [{ v: formatarDuracao(resumo.duracaoSegundos), r: "duração" }] : []),
    ...(resumo.volumeTotalKg > 0 ? [{ v: new Intl.NumberFormat("pt-BR").format(resumo.volumeTotalKg), r: "volume kg" }] : []),
    { v: String(resumo.totalExercicios), r: "exercícios" },
    { v: String(resumo.totalSeries), r: "séries" },
  ];
  const colW = (pw - pad * 2) / 2;
  metricas.forEach((m, i) => {
    const x = cx + (i % 2) * colW; const yV = yDiv + 70 + Math.floor(i / 2) * 88;
    ctx.fillStyle = "#fff"; ctx.font = "700 44px system-ui"; ctx.fillText(m.v, x, yV);
    ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = "400 24px system-ui"; ctx.fillText(m.r, x, yV + 32);
  });

  if (cardios.length) {
    const yCardioDiv = yDiv + 200;
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, yCardioDiv); ctx.lineTo(px + pw - pad, yCardioDiv); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "600 22px system-ui"; ctx.fillText("CARDIO", cx, yCardioDiv + 34);
    desenharChipsCardio(ctx, chipsCardio, cx, yCardioDiv + 52, larguraConteudo);
  }

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a imagem")), "image/jpeg", .92));
}
