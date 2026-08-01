import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pezzoState } from "@/application/state/pezzo.state";
import { ToastProvider } from "@/interface/widget/toast";
import { EditorProgramaPage } from "./EditorProgramaPage";

vi.mock("@/interface/widget/tutorial/TutorialProvider", () => ({
  useAlvoTutorial: () => () => undefined,
}));

const dadosVazios = {
  programas: [],
  fichas: [],
  historico: [],
  exerciciosCustom: [],
  cardioCustom: [],
};

describe("EditorProgramaPage", () => {
  beforeEach(() => {
    localStorage.clear();
    pezzoState.substituirDados(dadosVazios, "2024-01-01T00:00:00.000Z");
  });

  it("preenche o nome e valida no primeiro clique em Nova ficha", async () => {
    render(
      <ToastProvider>
        <EditorProgramaPage
          aoVoltar={vi.fn()}
          aoNavegar={vi.fn()}
        />
      </ToastProvider>,
    );

    const campoNome = await screen.findByPlaceholderText("Ex: Rotina Janeiro");
    expect(campoNome).toHaveValue("Programa 1");

    fireEvent.click(screen.getByRole("button", { name: "Nova ficha" }));
    expect(screen.getByRole("heading", { name: "Nova Ficha" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.change(campoNome, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Nova ficha" }));

    expect(
      screen.getByText("Digite um nome para o programa antes de criar fichas."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nova Ficha" })).not.toBeInTheDocument();
  });
});
