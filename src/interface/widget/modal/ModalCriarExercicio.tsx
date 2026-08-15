/* ═══════════════════════════════════════════
   Modal de Criação de Exercício Customizado
   ═══════════════════════════════════════════ */

import { useState, useEffect } from "react";
import type { Exercicio } from "@/domain/tipos";
import { Input } from "@/interface/widget/formulario/Input";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { Icone } from "@/interface/widget/svg/Icone";
import { useToast } from "@/interface/widget/toast";

const GRUPOS_MUSCULARES_PREDEFINIDOS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Abdômen",
  "Antebraço",
  "Trapézio",
];

interface ModalCriarExercicioProps {
  aberto: boolean;
  aoCriar: (exercicio: Omit<Exercicio, "id">) => void;
  aoCancelar: () => void;
}

export function ModalCriarExercicio({
  aberto,
  aoCriar,
  aoCancelar,
}: ModalCriarExercicioProps) {
  const { showError } = useToast();
  const [nome, setNome] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState("");
  const [grupoCustomizado, setGrupoCustomizado] = useState("");
  const [usarGrupoCustomizado, setUsarGrupoCustomizado] = useState(false);

  // Resetar formulário ao abrir
  useEffect(() => {
    if (aberto) {
      const id = window.setTimeout(() => {
        setNome("");
        setGrupoMuscular("");
        setGrupoCustomizado("");
        setUsarGrupoCustomizado(false);
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

  const handleCriar = () => {
    const nomeTrimado = nome.trim();
    const grupoFinal = usarGrupoCustomizado
      ? grupoCustomizado.trim()
      : grupoMuscular;

    // Validações
    if (nomeTrimado.length < 2) {
      showError("Digite um nome com pelo menos 2 caracteres.");
      return;
    }

    if (!grupoFinal) {
      showError("Selecione ou digite um grupo muscular.");
      return;
    }

    aoCriar({
      nome: nomeTrimado,
      grupoMuscular: grupoFinal,
    });
  };

  const nomeTrimado = nome.trim();
  const grupoParaUsar = usarGrupoCustomizado ? grupoCustomizado : grupoMuscular;

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-criar-exercicio-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={aoCancelar}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[350px] bg-superficie rounded-3xl shadow-xl border border-borda animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borda-suave">
          <h2
            id="modal-criar-exercicio-title"
            className="text-lg font-semibold font-display text-texto-primario"
          >
            Criar Exercício
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

        {/* Formulário */}
        <div className="px-5 py-4 space-y-4">
          {/* Nome */}
          <Input
            label="Nome do exercício"
            tipo="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Elevação Pélvica"
          />

          {/* Grupo Muscular */}
          <div>
            <label className="text-sm font-medium text-texto-primario mb-2 block">
              Grupo muscular
            </label>

            {!usarGrupoCustomizado ? (
              <div className="space-y-2">
                <Input
                  tipo="select"
                  value={grupoMuscular}
                  onChange={(e) => setGrupoMuscular(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {GRUPOS_MUSCULARES_PREDEFINIDOS.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </Input>

                <button
                  type="button"
                  onClick={() => setUsarGrupoCustomizado(true)}
                  className="text-sm text-acento hover:underline"
                >
                  Outro grupo...
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  tipo="text"
                  value={grupoCustomizado}
                  onChange={(e) => setGrupoCustomizado(e.target.value)}
                  placeholder="Ex: Mobilidade"
                />

                <button
                  type="button"
                  onClick={() => setUsarGrupoCustomizado(false)}
                  className="text-sm text-texto-secundario hover:text-texto-primario"
                >
                  ← Voltar para lista
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {nomeTrimado && grupoParaUsar && (
            <div className="px-4 py-3 bg-superficie-suave rounded-xl border border-borda-suave">
              <p className="text-xs text-texto-sutil mb-1">Preview:</p>
              <p className="text-sm font-medium text-texto-primario">
                {nomeTrimado}
              </p>
              <p className="text-xs text-texto-secundario">{grupoParaUsar}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-5 py-4 border-t border-borda-suave">
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
            onClick={handleCriar}
            icone="check"
            className="flex-1"
            disabled={!nomeTrimado || !grupoParaUsar}
          >
            Criar
          </BotaoAcao>
        </div>
      </div>
    </div>
  );
}
