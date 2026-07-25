import { useState } from "react";
import type { Exercicio } from "@/domain/tipos";
import { PickerExercicios } from "@/interface/widget/formulario/PickerExercicios";
import { Icone } from "@/interface/widget/svg/Icone";
import type { ResultadoTrocaExercicio } from "./hooks/useSessaoTreino";

interface OverlayTrocarExercicioProps {
  aberto: boolean;
  exercicioAtual: Exercicio;
  exercicioPlanejado?: Exercicio;
  exercicios: Exercicio[];
  exercicioIdsIndisponiveis: string[];
  iniciado: boolean;
  aoTrocar: (exercicioId: string, confirmarDescarte?: boolean) => ResultadoTrocaExercicio;
  aoRestaurar?: (confirmarDescarte?: boolean) => ResultadoTrocaExercicio;
  aoFechar: () => void;
}

type AcaoPendente =
  | { tipo: "trocar"; exercicioId: string }
  | { tipo: "restaurar" };

export function OverlayTrocarExercicio({
  aberto,
  exercicioAtual,
  exercicioPlanejado,
  exercicios,
  exercicioIdsIndisponiveis,
  iniciado,
  aoTrocar,
  aoRestaurar,
  aoFechar,
}: OverlayTrocarExercicioProps) {
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const substituido =
    exercicioPlanejado !== undefined && exercicioAtual.id !== exercicioPlanejado.id;

  if (!aberto) return null;

  const tratarResultado = (resultado: ResultadoTrocaExercicio, pendente: AcaoPendente) => {
    if (resultado === "trocado") {
      aoFechar();
      return;
    }
    if (resultado === "requerConfirmacao") {
      setAcaoPendente(pendente);
      setMensagem(null);
      return;
    }
    const mensagens: Record<Exclude<ResultadoTrocaExercicio, "trocado" | "requerConfirmacao">, string> = {
      jaIniciado: "Este exercício já foi iniciado e não pode mais ser trocado.",
      duplicado: "Este exercício já aparece em outro item do treino.",
      invalido: "Não foi possível realizar esta troca.",
    };
    setMensagem(mensagens[resultado]);
  };

  const selecionar = (exercicioId: string) => {
    tratarResultado(aoTrocar(exercicioId), { tipo: "trocar", exercicioId });
  };

  const restaurar = () => {
    if (aoRestaurar) tratarResultado(aoRestaurar(), { tipo: "restaurar" });
  };

  const confirmar = () => {
    if (!acaoPendente) return;
    const resultado = acaoPendente.tipo === "trocar"
      ? aoTrocar(acaoPendente.exercicioId, true)
      : aoRestaurar?.(true) ?? "invalido";
    tratarResultado(resultado, acaoPendente);
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trocar-exercicio-title"
    >
      <button
        type="button"
        aria-label="Fechar troca de exercício"
        className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-sm"
        onClick={aoFechar}
      />
      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-borda bg-superficie shadow-xl sm:max-w-[560px] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-borda-suave px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">
              Somente neste treino
            </p>
            <h2 id="trocar-exercicio-title" className="mt-0.5 font-display text-xl font-semibold text-texto-primario">
              Trocar exercício
            </h2>
            <p className="mt-1 truncate text-sm text-texto-secundario">
              Atual: {exercicioAtual.nome}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="-mr-2 rounded-lg p-2 text-texto-secundario hover:bg-superficie-suave"
            aria-label="Fechar"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {iniciado ? (
            <div className="rounded-2xl border border-borda bg-fundo p-4">
              <p className="font-medium text-texto-primario">Exercício já iniciado</p>
              <p className="mt-1 text-sm leading-relaxed text-texto-secundario">
                A troca fica indisponível depois que uma série é concluída, para não atribuir dados ao exercício errado.
              </p>
            </div>
          ) : acaoPendente ? (
            <div className="rounded-2xl border border-borda bg-fundo p-4">
              <p className="font-medium text-texto-primario">Reiniciar dados deste exercício?</p>
              <p className="mt-1 text-sm leading-relaxed text-texto-secundario">
                As cargas, repetições editadas e a nota serão removidas. A ficha original não será alterada.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAcaoPendente(null)}
                  className="min-h-11 rounded-xl border border-borda bg-superficie px-4 text-sm font-medium text-texto-primario"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={confirmar}
                  className="min-h-11 rounded-xl bg-texto-primario px-4 text-sm font-medium text-texto-invertido"
                >
                  Reiniciar e trocar
                </button>
              </div>
            </div>
          ) : (
            <PickerExercicios
              exercicios={exercicios}
              exercicioIdsSelecionados={exercicioIdsIndisponiveis}
              aoAdicionar={selecionar}
              grupoInicial={exercicioAtual.grupoMuscular}
              modo="selecionar"
            />
          )}

          {mensagem ? (
            <p className="mt-3 rounded-xl bg-fundo px-3 py-2 text-sm text-texto-secundario" role="status">
              {mensagem}
            </p>
          ) : null}
        </div>

        <div className="border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
          <p className="text-center text-xs text-texto-sutil">
            A ficha e os próximos treinos permanecem inalterados.
          </p>
          {substituido && exercicioPlanejado && aoRestaurar && !iniciado && !acaoPendente ? (
            <button
              type="button"
              onClick={restaurar}
              className="mt-3 min-h-11 w-full rounded-xl border border-borda bg-superficie px-4 text-sm font-medium text-texto-primario hover:bg-superficie-suave"
            >
              Restaurar {exercicioPlanejado.nome}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
