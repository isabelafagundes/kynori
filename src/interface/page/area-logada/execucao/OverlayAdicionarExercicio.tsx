import { useState } from "react";
import type { Exercicio } from "@/domain/tipos";
import type { ConfiguracaoExercicioSessao } from "@/application/state/sessao-ativa";
import { CampoCheck } from "@/interface/widget/formulario/CampoCheck";
import { CampoNumerico } from "@/interface/widget/formulario/CampoNumerico";
import { PickerExercicios } from "@/interface/widget/formulario/PickerExercicios";
import { Icone } from "@/interface/widget/svg/Icone";
import type { ResultadoAdicionarExercicio } from "./hooks/useSessaoTreino";

interface OverlayAdicionarExercicioProps {
  exercicios: Exercicio[];
  exercicioIdsIndisponiveis: string[];
  grupoInicial?: string;
  aoAdicionar: (
    exercicioId: string,
    configuracao: ConfiguracaoExercicioSessao
  ) => ResultadoAdicionarExercicio;
  aoFechar: () => void;
}

const CONFIGURACAO_INICIAL: ConfiguracaoExercicioSessao = {
  series: 3,
  repeticoes: 12,
  usaCarga: true,
  descansoSegundos: 60,
};

export function OverlayAdicionarExercicio({
  exercicios,
  exercicioIdsIndisponiveis,
  grupoInicial,
  aoAdicionar,
  aoFechar,
}: OverlayAdicionarExercicioProps) {
  const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState<string | null>(null);
  const [configuracao, setConfiguracao] = useState(CONFIGURACAO_INICIAL);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const exercicioSelecionado = exercicios.find((item) => item.id === exercicioSelecionadoId);

  const confirmar = () => {
    if (!exercicioSelecionadoId) return;
    const resultado = aoAdicionar(exercicioSelecionadoId, configuracao);
    if (resultado === "adicionado") {
      aoFechar();
      return;
    }
    setMensagem(
      resultado === "duplicado"
        ? "Este exercício já aparece na execução de hoje."
        : "Revise a configuração e tente novamente."
    );
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adicionar-exercicio-title"
    >
      <button
        type="button"
        aria-label="Fechar adição de exercício"
        className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-sm"
        onClick={aoFechar}
      />
      <div className="relative flex h-[72dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-borda bg-superficie shadow-xl sm:max-w-[560px] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-borda-suave px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">
              Somente neste treino
            </p>
            <h2 id="adicionar-exercicio-title" className="mt-0.5 font-display text-xl font-semibold text-texto-primario">
              {exercicioSelecionado ? "Configurar exercício" : "Adicionar exercício depois"}
            </h2>
            {exercicioSelecionado ? (
              <p className="mt-1 truncate text-sm text-texto-secundario">{exercicioSelecionado.nome}</p>
            ) : null}
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
          {exercicioSelecionado ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1.5 text-xs font-medium text-texto-secundario">
                  <span>Séries</span>
                  <CampoNumerico
                    valor={configuracao.series}
                    aoAlterar={(series) => setConfiguracao((atual) => ({ ...atual, series }))}
                    minimo={1}
                    maximo={20}
                    variante="caixa"
                    ariaLabel="Séries do exercício adicionado"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-texto-secundario">
                  <span>Repetições</span>
                  <CampoNumerico
                    valor={configuracao.repeticoes}
                    aoAlterar={(repeticoes) =>
                      setConfiguracao((atual) => ({ ...atual, repeticoes }))
                    }
                    minimo={1}
                    maximo={100}
                    variante="caixa"
                    ariaLabel="Repetições do exercício adicionado"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-texto-secundario">
                  <span>Descanso</span>
                  <CampoNumerico
                    valor={configuracao.descansoSegundos}
                    aoAlterar={(descansoSegundos) =>
                      setConfiguracao((atual) => ({ ...atual, descansoSegundos }))
                    }
                    minimo={0}
                    maximo={900}
                    variante="caixa"
                    ariaLabel="Descanso do exercício adicionado em segundos"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-borda bg-fundo px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-texto-primario">Registrar carga</p>
                  <p className="mt-0.5 text-xs text-texto-sutil">Exibe o campo de peso nas séries.</p>
                </div>
                <CampoCheck
                  marcado={configuracao.usaCarga}
                  aoAlterar={(usaCarga) => setConfiguracao((atual) => ({ ...atual, usaCarga }))}
                  ariaLabel="Registrar carga no exercício adicionado"
                />
              </div>

              {mensagem ? <p className="text-sm text-perigo" role="status">{mensagem}</p> : null}
            </div>
          ) : (
            <PickerExercicios
              exercicios={exercicios}
              exercicioIdsSelecionados={exercicioIdsIndisponiveis}
              aoAdicionar={(exercicioId) => {
                setExercicioSelecionadoId(exercicioId);
                setMensagem(null);
              }}
              grupoInicial={grupoInicial}
              modo="selecionar"
              textoVazio="Nenhum exercício disponível para adicionar hoje."
            />
          )}
        </div>

        <div className="border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
          <p className="mb-3 text-center text-xs text-texto-sutil">
            A ficha e os próximos treinos permanecem inalterados.
          </p>
          {exercicioSelecionado ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExercicioSelecionadoId(null)}
                className="min-h-11 rounded-xl border border-borda bg-superficie px-4 text-sm font-medium text-texto-primario"
              >
                Escolher outro
              </button>
              <button
                type="button"
                onClick={confirmar}
                className="min-h-11 rounded-xl bg-texto-primario px-4 text-sm font-medium text-texto-invertido"
              >
                Adicionar depois
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
