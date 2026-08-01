import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Ficha, RegistroTreino } from "@/domain/tipos";
import { ItemHistorico } from "./ItemHistorico";

const registro: RegistroTreino = {
  id: "registro-1",
  fichaId: "ficha-1",
  data: "2026-07-27",
  iniciadoEm: "2026-07-27T23:53:00.000Z",
  finalizadoEm: "2026-07-27T23:54:00.000Z",
  exercicios: [],
  cardio: [],
};

const ficha: Ficha = {
  id: "ficha-1",
  nome: "Treino B",
  descricao: "",
  icone: "halter",
  itens: [],
};

describe("ItemHistorico", () => {
  it("exibe uma data sem horário no mesmo dia do calendário", () => {
    render(<ItemHistorico registro={registro} ficha={ficha} aoClicar={vi.fn()} />);

    expect(screen.getByText("27/07/26")).toBeInTheDocument();
  });
});
