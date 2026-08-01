import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResumoCompartilhamento } from "@/application/compartilhamento/calcular-resumo-treino";
import type { Ficha, RegistroTreino, TipoCardioDef } from "@/domain/tipos";
import { CardResultadoTreino } from "./CardResultadoTreino";
import { desenharCard } from "./desenhar-card";

vi.mock("@/interface/widget/fundo-resultado/FundoResultado", () => ({
  FundoResultado: () => <div data-testid="fundo-preset" />,
}));

vi.mock("@/interface/widget/fundo-resultado/fundo-resultado.renderer", () => ({
  desenharFundo: vi.fn(),
}));

const registro: RegistroTreino = {
  id: "registro-1",
  fichaId: "ficha-1",
  data: "2026-07-25T10:00:00Z",
  iniciadoEm: "2026-07-25T10:00:00Z",
  finalizadoEm: "2026-07-25T11:39:00Z",
  exercicios: [],
  cardio: [],
};

const ficha: Ficha = {
  id: "ficha-1",
  nome: "Quadríceps",
  descricao: "",
  icone: "halter",
  emoji: "🦵",
  itens: [],
};

const resumo: ResumoCompartilhamento = {
  duracaoSegundos: 5_940,
  totalExercicios: 5,
  totalSeries: 17,
  volumeTotalKg: 4_030,
  totalCardios: 0,
  duracaoCardioMinutos: 0,
};

const tiposCardio: TipoCardioDef[] = [
  {
    id: "cardio-custom",
    nome: "Transport",
    emoji: "🚶",
    metricas: ["duracaoMinutos"],
    builtin: false,
  },
];

const registroComCardios: RegistroTreino = {
  ...registro,
  cardio: [
    {
      cardioId: "cardio-1",
      tipo: "Esteira",
      duracaoMinutos: 20,
      distanciaKm: 3.2,
      nota: "",
    },
    {
      cardioId: "cardio-2",
      tipo: "cardio-custom",
      duracaoMinutos: 15,
      nota: "",
    },
  ],
};

describe("CardResultadoTreino", () => {
  it("coloca o emoji junto ao nome quando há foto de fundo", () => {
    render(
      <CardResultadoTreino
        registro={registro}
        ficha={ficha}
        resumo={resumo}
        fundo={{ tipo: "foto", dataUrl: "data:image/jpeg;base64,foto", escurecer: 50 }}
        grupos={["Pernas"]}
      />,
    );

    const titulo = screen.getByRole("heading", { name: ficha.nome });
    expect(titulo.parentElement).toHaveTextContent(`🦵${ficha.nome}`);
    expect(screen.getAllByText("🦵")).toHaveLength(1);
  });

  it("mantém o emoji centralizado quando o fundo é gráfico", () => {
    render(
      <CardResultadoTreino
        registro={registro}
        ficha={ficha}
        resumo={resumo}
        fundo={{ tipo: "preset", preset: "oceanic" }}
        grupos={["Pernas"]}
      />,
    );

    const titulo = screen.getByRole("heading", { name: ficha.nome });
    expect(titulo.parentElement).not.toHaveTextContent("🦵");
    expect(screen.getByText("🦵")).toBeInTheDocument();
  });

  it("lista cada cardio após um divider", () => {
    render(
      <CardResultadoTreino
        registro={registroComCardios}
        ficha={ficha}
        resumo={{ ...resumo, totalCardios: 2, duracaoCardioMinutos: 35, distanciaCardioKm: 3.2 }}
        fundo={{ tipo: "preset", preset: "oceanic" }}
        grupos={["Pernas"]}
        tiposCardio={tiposCardio}
      />,
    );

    const secaoCardio = screen.getByText("Cardio").parentElement;
    expect(secaoCardio).toHaveClass("border-t");
    expect(screen.getByText("Esteira · 20 min · 3,2 km")).toBeInTheDocument();
    expect(screen.getByText("Transport · 15 min")).toBeInTheDocument();
  });
});

describe("desenharCard", () => {
  const fillText = vi.fn();
  const contexto = {
    beginPath: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText,
    lineTo: vi.fn(),
    measureText: vi.fn((texto: string) => ({ width: texto.length * 20 })),
    moveTo: vi.fn(),
    roundRect: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  beforeEach(() => {
    fillText.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(contexto);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["imagem"], { type: "image/jpeg" }));
    });
    vi.stubGlobal("Image", class {
      width = 1080;
      height = 1350;
      onload: (() => void) | null = null;

      set src(_valor: string) {
        queueMicrotask(() => this.onload?.());
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exporta o emoji ao lado do título somente quando há foto", async () => {
    await desenharCard(
      registro,
      ficha,
      resumo,
      { tipo: "foto", dataUrl: "data:image/jpeg;base64,foto", escurecer: 50 },
      ["Pernas"],
    );

    expect(fillText).toHaveBeenCalledWith("🦵", 104, 829);
    expect(fillText).toHaveBeenCalledWith(ficha.nome, 176, 831);
    expect(fillText).not.toHaveBeenCalledWith("🦵", 540, 470);

    fillText.mockClear();
    await desenharCard(
      registro,
      ficha,
      resumo,
      { tipo: "preset", preset: "oceanic" },
      ["Pernas"],
    );

    expect(fillText).toHaveBeenCalledWith("🦵", 540, 470);
    expect(fillText).toHaveBeenCalledWith(ficha.nome, 104, 831);
    expect(fillText).not.toHaveBeenCalledWith("🦵", 104, 829);
  });

  it("exporta cada cardio abaixo de um divider", async () => {
    await desenharCard(
      registroComCardios,
      ficha,
      { ...resumo, totalCardios: 2, duracaoCardioMinutos: 35, distanciaCardioKm: 3.2 },
      { tipo: "preset", preset: "oceanic" },
      ["Pernas"],
      tiposCardio,
    );

    expect(contexto.moveTo).toHaveBeenCalledWith(104, 1129);
    expect(contexto.lineTo).toHaveBeenCalledWith(976, 1129);
    expect(contexto.roundRect).toHaveBeenCalledWith(104, 1181, 542, 44, 22);
    expect(contexto.roundRect).toHaveBeenCalledWith(104, 1237, 402, 44, 22);
    expect(fillText).toHaveBeenCalledWith("Esteira · 20 min · 3,2 km", 125, 1204);
    expect(fillText).toHaveBeenCalledWith("Transport · 15 min", 125, 1260);
  });
});
