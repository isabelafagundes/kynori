import { useState } from "react";
import type { Exercicio } from "@/domain/tipos";
import type { ConfiguracaoExercicioSessao } from "@/application/state/sessao-ativa";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { CampoCheck } from "@/interface/widget/formulario/CampoCheck";
import { CampoNumerico } from "@/interface/widget/formulario/CampoNumerico";
import { PickerExercicios } from "@/interface/widget/formulario/PickerExercicios";
import { Icone } from "@/interface/widget/svg/Icone";
import type {
  EntradaExercicioAdicionado,
  ResultadoAdicionarExercicio,
} from "./hooks/useSessaoTreino";

interface OverlayAdicionarExercicioProps {
  exercicios: Exercicio[];
  exercicioIdsIndisponiveis: string[];
  grupoInicial?: string;
  /** Muda a copy: no livre não existe ficha a preservar, o treino é a fila. */
  treinoLivre?: boolean;
  /** Sessão ainda sem nenhum item — o botão passa a "Começar com N". */
  sessaoVazia?: boolean;
  aoAdicionar: (entradas: EntradaExercicioAdicionado[]) => ResultadoAdicionarExercicio[];
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
  treinoLivre = false,
  sessaoVazia = false,
  aoAdicionar,
  aoFechar,
}: OverlayAdicionarExercicioProps) {
  // A fila é a unidade de trabalho: o sheet só fecha quando ela é confirmada.
  const [fila, setFila] = useState<EntradaExercicioAdicionado[]>([]);
  const [ajustandoId, setAjustandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const emAjuste = fila.find((entrada) => entrada.exercicioId === ajustandoId);
  const exercicioEmAjuste = exercicios.find((item) => item.id === ajustandoId);
  const nomeDe = (id: string) => exercicios.find((item) => item.id === id)?.nome ?? id;

  const enfileirar = (exercicioId: string) => {
    setMensagem(null);
    setFila((atual) => [...atual, { exercicioId, configuracao: CONFIGURACAO_INICIAL }]);
  };

  const desenfileirar = (exercicioId: string) => {
    setFila((atual) => atual.filter((entrada) => entrada.exercicioId !== exercicioId));
    if (ajustandoId === exercicioId) setAjustandoId(null);
  };

  const ajustar = (mudanca: Partial<ConfiguracaoExercicioSessao>) => {
    setFila((atual) =>
      atual.map((entrada) =>
        entrada.exercicioId === ajustandoId
          ? { ...entrada, configuracao: { ...entrada.configuracao, ...mudanca } }
          : entrada
      )
    );
  };

  const confirmar = () => {
    if (fila.length === 0) return;
    const resultados = aoAdicionar(fila);
    const recusados = fila.filter((_, indice) => resultados[indice] !== "adicionado");
    if (recusados.length === 0) {
      aoFechar();
      return;
    }
    setFila(recusados);
    setMensagem(
      resultados.includes("duplicado")
        ? "Alguns já estão na execução de hoje. Remova-os da fila para continuar."
        : "Revise a configuração e tente novamente."
    );
  };

  const rotuloConfirmar = sessaoVazia
    ? `Começar com ${fila.length} exercício${fila.length === 1 ? "" : "s"}`
    : `Adicionar ${fila.length} exercício${fila.length === 1 ? "" : "s"}`;

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
              {treinoLivre ? "Treino livre" : "Somente neste treino"}
            </p>
            <h2
              id="adicionar-exercicio-title"
              className="mt-0.5 font-display text-xl font-semibold text-texto-primario"
            >
              {emAjuste ? "Ajustar exercício" : "Escolher exercícios"}
            </h2>
            {emAjuste && exercicioEmAjuste ? (
              <p className="mt-1 truncate text-sm text-texto-secundario">
                {exercicioEmAjuste.nome}
              </p>
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
          {emAjuste ? (
            <div className="space-y-4">
              {/* Séries não entram aqui: o card de execução já permite
                  acrescentar e remover séries no meio do exercício. */}
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs font-medium text-texto-secundario">
                  <span>Repetições</span>
                  <CampoNumerico
                    valor={emAjuste.configuracao.repeticoes}
                    aoAlterar={(repeticoes) => ajustar({ repeticoes })}
                    minimo={1}
                    maximo={100}
                    variante="caixa"
                    ariaLabel="Repetições do exercício adicionado"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-texto-secundario">
                  <span>Descanso (s)</span>
                  <CampoNumerico
                    valor={emAjuste.configuracao.descansoSegundos}
                    aoAlterar={(descansoSegundos) => ajustar({ descansoSegundos })}
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
                  <p className="mt-0.5 text-xs text-texto-sutil">
                    Exibe o campo de peso nas séries.
                  </p>
                </div>
                <CampoCheck
                  marcado={emAjuste.configuracao.usaCarga}
                  aoAlterar={(usaCarga) => ajustar({ usaCarga })}
                  ariaLabel="Registrar carga no exercício adicionado"
                />
              </div>
            </div>
          ) : (
            <PickerExercicios
              exercicios={exercicios}
              /* Some da lista o que já está na sessão e o que já foi
                 enfileirado — a fila abaixo é quem mostra o segundo grupo. */
              exercicioIdsSelecionados={[
                ...exercicioIdsIndisponiveis,
                ...fila.map((entrada) => entrada.exercicioId),
              ]}
              aoAdicionar={enfileirar}
              grupoInicial={grupoInicial}
              modo="adicionar"
              textoVazio={
                treinoLivre
                  ? "Todos os exercícios do catálogo já estão neste treino."
                  : "Nenhum exercício disponível para adicionar hoje."
              }
            />
          )}
        </div>

        <div className="border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
          {emAjuste ? (
            <BotaoAcao icone="check" ocuparLarguraTotal onClick={() => setAjustandoId(null)}>
              Pronto
            </BotaoAcao>
          ) : (
            <>
              {fila.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {fila.map((entrada) => (
                    <span
                      key={entrada.exercicioId}
                      className="inline-flex items-center gap-1 rounded-full border border-borda bg-fundo py-1 pl-3 pr-1 text-xs font-medium text-texto-primario"
                    >
                      <button
                        type="button"
                        onClick={() => setAjustandoId(entrada.exercicioId)}
                        className="max-w-[160px] truncate hover:text-acento"
                        aria-label={`Ajustar ${nomeDe(entrada.exercicioId)}`}
                      >
                        {nomeDe(entrada.exercicioId)}
                      </button>
                      <button
                        type="button"
                        onClick={() => desenfileirar(entrada.exercicioId)}
                        className="rounded-full p-1 text-texto-sutil hover:bg-superficie-suave hover:text-perigo"
                        aria-label={`Tirar ${nomeDe(entrada.exercicioId)} da fila`}
                      >
                        <Icone nome="fechar" tamanho={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {mensagem ? (
                <p className="mb-3 text-center text-sm text-perigo" role="status">
                  {mensagem}
                </p>
              ) : (
                <p className="mb-3 text-center text-xs text-texto-sutil">
                  {fila.length === 0
                    ? treinoLivre
                      ? "Escolha quantos quiser — dá pra continuar adicionando durante o treino."
                      : "A ficha e os próximos treinos permanecem inalterados."
                    : `Entram como ${CONFIGURACAO_INICIAL.series}x${CONFIGURACAO_INICIAL.repeticoes} · ${CONFIGURACAO_INICIAL.descansoSegundos}s — toque no nome pra ajustar.`}
                </p>
              )}

              <BotaoAcao
                icone={sessaoVazia ? "reproduzir" : "mais"}
                ocuparLarguraTotal
                disabled={fila.length === 0}
                onClick={confirmar}
              >
                {fila.length === 0 ? "Escolha ao menos um exercício" : rotuloConfirmar}
              </BotaoAcao>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
