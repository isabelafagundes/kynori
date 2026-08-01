import type { ProgressaoCompartilhavel } from "@/application/compartilhamento/calcular-progressao-exercicio";
import { desenharFundo } from "@/interface/widget/fundo-resultado/fundo-resultado.renderer";
import {
  velaFoto,
  type SelecaoFundo,
} from "@/interface/widget/fundo-resultado/presets-fundo";
import {
  formatarDataProgressao,
  formatarEvolucaoPercentual,
  formatarPeriodoProgressao,
  formatarValorProgressao,
} from "./formatar-progressao-compartilhavel";

const LARGURA = 1080;
const ALTURA = 1350;

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error("Não foi possível carregar a foto"));
    imagem.src = src;
  });
}

function desenharCover(
  contexto: CanvasRenderingContext2D,
  imagem: HTMLImageElement,
) {
  const escala = Math.max(LARGURA / imagem.width, ALTURA / imagem.height);
  const largura = imagem.width * escala;
  const altura = imagem.height * escala;
  contexto.drawImage(
    imagem,
    (LARGURA - largura) / 2,
    (ALTURA - altura) / 2,
    largura,
    altura,
  );
}

function textoTruncado(
  contexto: CanvasRenderingContext2D,
  texto: string,
  larguraMaxima: number,
) {
  if (contexto.measureText(texto).width <= larguraMaxima) return texto;
  let resultado = texto;
  while (resultado && contexto.measureText(`${resultado}…`).width > larguraMaxima) {
    resultado = resultado.slice(0, -1);
  }
  return `${resultado}…`;
}

function desenharFundoCard(
  contexto: CanvasRenderingContext2D,
  progressao: ProgressaoCompartilhavel,
  fundo: SelecaoFundo,
) {
  if (fundo.tipo === "preset") {
    desenharFundo(
      contexto,
      LARGURA,
      ALTURA,
      fundo.preset,
      `progressao-${progressao.id}`,
    );
    const scrim = contexto.createLinearGradient(0, 0, 0, ALTURA);
    scrim.addColorStop(0, "rgba(0,0,0,.08)");
    scrim.addColorStop(0.42, "rgba(0,0,0,.18)");
    scrim.addColorStop(1, "rgba(0,0,0,.58)");
    contexto.fillStyle = scrim;
    contexto.fillRect(0, 0, LARGURA, ALTURA);
    return Promise.resolve();
  }

  return carregarImagem(fundo.dataUrl).then((imagem) => {
    desenharCover(contexto, imagem);
    const vela = velaFoto(fundo.escurecer);
    const scrim = contexto.createLinearGradient(0, 0, 0, ALTURA);
    scrim.addColorStop(0, `rgba(0,0,0,${vela.topo})`);
    scrim.addColorStop(0.4, `rgba(0,0,0,${vela.meio})`);
    scrim.addColorStop(1, `rgba(0,0,0,${vela.base})`);
    contexto.fillStyle = scrim;
    contexto.fillRect(0, 0, LARGURA, ALTURA);
  });
}

function desenharTextoQuebrado(
  contexto: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  larguraMaxima: number,
  alturaLinha: number,
) {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let linha = "";

  for (const palavra of palavras) {
    const candidata = linha ? `${linha} ${palavra}` : palavra;
    if (contexto.measureText(candidata).width <= larguraMaxima || !linha) {
      linha = candidata;
    } else {
      linhas.push(linha);
      linha = palavra;
    }
  }
  if (linha) linhas.push(linha);

  linhas.slice(0, 2).forEach((item, indice) => {
    const ultimaLinha = indice === 1 && linhas.length > 2;
    contexto.fillText(
      ultimaLinha ? textoTruncado(contexto, item, larguraMaxima) : item,
      x,
      y + indice * alturaLinha,
    );
  });

  return Math.min(2, linhas.length);
}

function desenharPainel(
  contexto: CanvasRenderingContext2D,
  progressao: ProgressaoCompartilhavel,
) {
  const x = 64;
  const y = 670;
  const largura = 952;
  const altura = 600;

  contexto.beginPath();
  contexto.roundRect(x, y, largura, altura, 38);
  contexto.fillStyle = "rgba(255,255,255,.13)";
  contexto.fill();
  contexto.strokeStyle = "rgba(255,255,255,.22)";
  contexto.lineWidth = 2;
  contexto.stroke();

  const graficoX = x + 54;
  const graficoY = y + 58;
  const graficoLargura = largura - 108;
  const maiorValor = Math.max(1, ...progressao.pontos.map((ponto) => ponto.valor));
  const espaco = 18;
  // Cap na largura para poucos pontos não virarem barras gigantes; o grupo
  // fica centralizado no gráfico.
  const larguraBarra = Math.min(
    150,
    Math.max(
      28,
      (graficoLargura - espaco * (progressao.pontos.length - 1)) /
        progressao.pontos.length,
    ),
  );
  const larguraGrupo =
    larguraBarra * progressao.pontos.length +
    espaco * (progressao.pontos.length - 1);
  const graficoOffsetX = graficoX + Math.max(0, (graficoLargura - larguraGrupo) / 2);

  progressao.pontos.forEach((ponto, indice) => {
    const alturaBarra = Math.max(26, (ponto.valor / maiorValor) * 220);
    const barraX = graficoOffsetX + indice * (larguraBarra + espaco);
    const barraY = graficoY + 225 - alturaBarra;
    contexto.beginPath();
    contexto.roundRect(barraX, barraY, larguraBarra, alturaBarra, [12, 12, 0, 0]);
    contexto.fillStyle = indice === progressao.pontos.length - 1
      ? "rgba(255,255,255,1)"
      : "rgba(255,255,255,.45)";
    contexto.fill();

    contexto.font = `${indice === progressao.pontos.length - 1 ? "600" : "400"} 20px system-ui`;
    contexto.textAlign = "center";
    contexto.fillStyle = indice === progressao.pontos.length - 1
      ? "rgba(255,255,255,1)"
      : "rgba(255,255,255,.62)";
    contexto.fillText(
      formatarDataProgressao(ponto.data),
      barraX + larguraBarra / 2,
      graficoY + 260,
    );
  });

  contexto.beginPath();
  contexto.moveTo(graficoX, y + 366);
  contexto.lineTo(graficoX + graficoLargura, y + 366);
  contexto.strokeStyle = "rgba(255,255,255,.2)";
  contexto.lineWidth = 2;
  contexto.stroke();

  const metricas = [
    { rotulo: "Início", valor: progressao.valorInicial },
    { rotulo: "Atual", valor: progressao.valorAtual },
    { rotulo: "Melhor", valor: progressao.melhorValor },
  ];
  const larguraMetrica = graficoLargura / metricas.length;
  metricas.forEach((metrica, indice) => {
    const metricaX = graficoX + indice * larguraMetrica;
    contexto.textAlign = "left";
    contexto.fillStyle = "rgba(255,255,255,.58)";
    contexto.font = "500 24px system-ui";
    contexto.fillText(metrica.rotulo, metricaX, y + 424);
    contexto.fillStyle = indice === 1 ? "#fff" : "rgba(255,255,255,.86)";
    contexto.font = "700 34px system-ui";
    contexto.fillText(
      textoTruncado(
        contexto,
        formatarValorProgressao(progressao, metrica.valor),
        larguraMetrica - 24,
      ),
      metricaX,
      y + 472,
    );
  });

  contexto.fillStyle = "rgba(255,255,255,.58)";
  contexto.font = "500 24px system-ui";
  contexto.fillText(
    `${progressao.pontos.length} sessões · ${formatarPeriodoProgressao(progressao)}`,
    graficoX,
    y + 544,
  );
}

export async function desenharCardProgressao(
  progressao: ProgressaoCompartilhavel,
  fundo: SelecaoFundo,
) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível criar a imagem");

  await desenharFundoCard(contexto, progressao, fundo);

  contexto.textBaseline = "alphabetic";
  contexto.textAlign = "left";
  contexto.fillStyle = "#fff";
  contexto.font = "700 30px system-ui";
  contexto.fillText("KYNORI", 64, 90);
  contexto.textAlign = "right";
  contexto.fillStyle = "rgba(255,255,255,.72)";
  contexto.font = "600 23px system-ui";
  contexto.fillText("MINHA PROGRESSÃO", 1016, 90);

  contexto.textAlign = "left";
  contexto.fillStyle = "rgba(255,255,255,.72)";
  contexto.font = "500 27px system-ui";
  contexto.fillText(progressao.descricao, 64, 220);

  contexto.fillStyle = "#fff";
  contexto.font = "700 68px system-ui";
  const linhas = desenharTextoQuebrado(
    contexto,
    progressao.nome,
    64,
    300,
    930,
    74,
  );

  const rotulo = formatarEvolucaoPercentual(progressao);
  contexto.font = "600 31px system-ui";
  const larguraRotulo = contexto.measureText(rotulo).width + 58;
  const yRotulo = 300 + linhas * 74 + 28;
  contexto.beginPath();
  contexto.roundRect(64, yRotulo, larguraRotulo, 62, 31);
  contexto.fillStyle = "rgba(255,255,255,.16)";
  contexto.fill();
  contexto.strokeStyle = "rgba(255,255,255,.22)";
  contexto.lineWidth = 2;
  contexto.stroke();
  contexto.fillStyle = "#fff";
  contexto.fillText(rotulo, 93, yRotulo + 42);

  desenharPainel(contexto, progressao);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível gerar a imagem"))),
      "image/jpeg",
      0.92,
    );
  });
}
