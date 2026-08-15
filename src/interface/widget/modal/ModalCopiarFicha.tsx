/* ═══════════════════════════════════════════
   Modal de Cópia de Ficha Existente
   ═══════════════════════════════════════════ */

import { useState, useEffect, useMemo } from "react";
import { exerciciosDaFicha, temCardio } from "@/domain/ficha";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { Icone } from "@/interface/widget/svg/Icone";
import { Input } from "@/interface/widget/formulario/Input";

interface ModalCopiarFichaProps {
  aberto: boolean;
  aoCopiar: (fichaId: string) => void;
  aoCancelar: () => void;
  fichaIdAtual?: string; // Para não mostrar a ficha being edited
}

export function ModalCopiarFicha({
  aberto,
  aoCopiar,
  aoCancelar,
  fichaIdAtual,
}: ModalCopiarFichaProps) {
  const [busca, setBusca] = useState("");
  const [fichaSelecionada, setFichaSelecionada] = useState<string | null>(null);

  // Resetar ao abrir
  useEffect(() => {
    if (aberto) {
      const id = window.setTimeout(() => {
        setBusca("");
        setFichaSelecionada(null);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [aberto]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    if (!aberto) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        aoCancelar();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [aberto, aoCancelar]);

  // Listar e filtrar fichas
  const fichasFiltradas = useMemo(() => {
    const todasFichas = stateManagerRepository.listarFichas();

    // Filtrar busca
    let filtradas = todasFichas;
    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtradas = filtradas.filter((f) =>
        f.nome.toLowerCase().includes(buscaLower)
      );
    }

    // Remover ficha atual (se estiver editando)
    if (fichaIdAtual) {
      filtradas = filtradas.filter((f) => f.id !== fichaIdAtual);
    }

    return filtradas.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [busca, fichaIdAtual]);

  const handleCopiar = () => {
    if (!fichaSelecionada) return;
    aoCopiar(fichaSelecionada);
  };

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-copiar-ficha-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={aoCancelar}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[350px] bg-superficie rounded-3xl shadow-xl border border-borda animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borda-suave shrink-0">
          <h2
            id="modal-copiar-copiar-ficha-title"
            className="text-lg font-semibold font-display text-texto-primario"
          >
            Copiar de Existente
          </h2>
          <button
            type="button"
            onClick={aoCancelar}
            className="p-2 -mr-2 text-texto-secundario hover:text-texto-primario hover:bg-superficie-suave rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        {/* Busca */}
        <div className="px-5 py-4 border-b border-borda-suave shrink-0">
          <Input
            tipo="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ficha..."
            aoLimpar={() => setBusca("")}
          />
        </div>

        {/* Lista de fichas */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {fichasFiltradas.length === 0 ? (
            <div className="py-12 text-center">
              <Icone nome="clipboard" tamanho={48} className="text-texto-sutil mx-auto mb-3" />
              <p className="text-sm text-texto-secundario">
                {busca ? "Nenhuma ficha encontrada." : "Nenhuma ficha disponível."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fichasFiltradas.map((ficha) => (
                <button
                  key={ficha.id}
                  type="button"
                  onClick={() => setFichaSelecionada(ficha.id)}
                  className={`
                    w-full px-4 py-3
                    bg-superficie-suave border rounded-xl
                    flex items-center gap-3
                    text-left
                    transition-all duration-150
                    hover:border-acento/50
                    ${fichaSelecionada === ficha.id
                      ? "border-acento bg-acento-suave ring-2 ring-acento/20"
                      : "border-borda"
                    }
                  `}
                >
                  {/* Emoji */}
                  <span className="text-2xl shrink-0">
                    {ficha.emoji || "💪"}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-texto-primario truncate">
                      {ficha.nome}
                    </p>
                    <p className="text-xs text-texto-secundario">
                      {exerciciosDaFicha(ficha).length} {exerciciosDaFicha(ficha).length === 1 ? "exercício" : "exercícios"}
                      {temCardio(ficha) && " · cardio"}
                    </p>
                  </div>

                  {/* Indicador de seleção */}
                  {fichaSelecionada === ficha.id && (
                    <div className="shrink-0">
                      <svg
                        className="w-5 h-5 text-acento"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-5 py-4 border-t border-borda-suave shrink-0">
          <BotaoAcao
            variante="secundario"
            onClick={aoCancelar}
            icone="fechar"
            className="flex-1"
          >
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            variante="primario"
            onClick={handleCopiar}
            icone="copiar"
            className="flex-1"
            disabled={!fichaSelecionada}
          >
            Copiar
          </BotaoAcao>
        </div>
      </div>
    </div>
  );
}
