/* ═══════════════════════════════════════════
   Editor de Ficha — Criar/Editar Fichas (página única)
   A ficha é uma sequência única e ordenada de itens:
   exercícios de força e atividades de cardio intercalados.

   Estrutura: uma página fluida (nome, ícone, itens, programas), alinhada à
   estética de Editar Programa. Os itens são montados numa TELA DEDICADA
   empilhada por cima (push/pop), preservando o estado não salvo.
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  EntradaCardio,
  ChaveMetricaCardio,
  Exercicio,
  ExercicioFicha,
  Ficha,
  ItemFicha,
  Programa,
  TipoCardioDef,
  TipoCardio,
} from "@/domain/tipos";
import { META_METRICA_CARDIO, resolverTipoCardio } from "@/domain/tipos";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { Input } from "@/interface/widget/formulario/Input";
import { CampoNumerico } from "@/interface/widget/formulario/CampoNumerico";
import { CampoNumeroOpcional } from "@/interface/widget/formulario/CampoNumeroOpcional";
import { CampoCheck } from "@/interface/widget/formulario/CampoCheck";
import { SeletorIcone } from "@/interface/widget/formulario/SeletorIcone";
import { PickerExercicios } from "@/interface/widget/formulario/PickerExercicios";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone, IconeArrastar } from "@/interface/widget/svg/Icone";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ModalCriarExercicio } from "@/interface/widget/modal/ModalCriarExercicio";
import { ModalCopiarFicha } from "@/interface/widget/modal/ModalCopiarFicha";
import { ModalConfirmacao } from "@/interface/widget/modal/ModalConfirmacao";
import { useToast } from "@/interface/widget/toast";
import { useAlvoTutorial } from "@/interface/widget/tutorial/TutorialProvider";
import { useGuardaSaida } from "./useGuardaSaida";

interface PropriedadesEditorFichaPage {
  fichaId?: string;
  programaId?: string; // Opcional - ficha pode existir sem programa
  aoVoltar: () => void;
}

type PainelAdicionar = "exercicio" | "cardio" | null;

/** Assinatura dos campos que só são persistidos ao salvar, usada para detectar
    alterações não salvas (os vínculos de programa também só valem no "Salvar"). */
function assinaturaFicha(
  nome: string,
  descricao: string,
  icone: string | null,
  itens: ItemFicha[],
  programaIds: string[]
): string {
  return JSON.stringify({
    nome: nome.trim(),
    descricao: descricao.trim(),
    icone: icone ?? "",
    itens,
    programaIds: [...programaIds].sort(),
  });
}

/** Id estável do item para o dnd-kit (exercícios não se repetem na ficha;
    entradas de cardio têm UUID próprio). */
function idDoItem(item: ItemFicha): string {
  return item.tipo === "exercicio"
    ? `exercicio-${item.exercicio.exercicioId}`
    : `cardio-${item.cardio.id}`;
}

/** Rótulo de seção em caixa-alta (eyebrow), igual ao Editor de Programa. */
function RotuloSecao({
  children,
  dot,
  acao,
}: {
  children: ReactNode;
  dot?: boolean;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 px-0.5">
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-acento" />}
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
          {children}
        </span>
      </div>
      {acao}
    </div>
  );
}

export function EditorFichaPage({ fichaId, aoVoltar, programaId }: PropriedadesEditorFichaPage) {
  const { showError } = useToast();
  const alvoIdentidade = useAlvoTutorial("ficha-identidade");
  const alvoMontarTreino = useAlvoTutorial("ficha-montar-treino");
  const alvoAdicionarItem = useAlvoTutorial("ficha-adicionar-item");
  const alvoSalvar = useAlvoTutorial("ficha-salvar");
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [todosExercicios, setTodosExercicios] = useState<Exercicio[]>([]);
  const [tiposCardio, setTiposCardio] = useState<TipoCardioDef[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programasVinculados, setProgramasVinculados] = useState<Programa[]>([]);
  const vinculosProgramasAlteradosRef = useRef(false);
  // Snapshot dos campos no momento em que foram carregados, para detectar
  // alterações não salvas ao tentar fechar.
  const [baseline, setBaseline] = useState<string | null>(null);

  // Estado do formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemFicha[]>([]);
  const [painelAdicionar, setPainelAdicionar] = useState<PainelAdicionar>(null);

  // Camada de itens (push) e pop-up de ícone
  const [telaItensAberta, setTelaItensAberta] = useState(false);
  const [modalEmojiAberto, setModalEmojiAberto] = useState(false);

  // Sensores de drag-and-drop para reordenar itens.
  // PointerSensor cobre mouse e toque; o pequeno limiar evita disparar ao tocar nos campos.
  const sensoresDrag = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Estados dos modais
  const [modalCriarExercicioAberto, setModalCriarExercicioAberto] = useState(false);
  const [modalCopiarFichaAberto, setModalCopiarFichaAberto] = useState(false);
  const [modalVincularProgramaAberto, setModalVincularProgramaAberto] = useState(false);
  const [programaParaVincularId, setProgramaParaVincularId] = useState<string | null>(null);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const abrirModalVincularPrograma = () => {
    setProgramaParaVincularId(null);
    setModalVincularProgramaAberto(true);
  };

  const editando = Boolean(fichaId);
  const titulo = editando ? "Editar Ficha" : "Nova Ficha";

  const totalExercicios = itens.filter((item) => item.tipo === "exercicio").length;
  const totalCardio = itens.filter((item) => item.tipo === "cardio").length;

  const temAlteracoes =
    baseline !== null &&
    baseline !==
      assinaturaFicha(nome, descricao, icone, itens, programasVinculados.map((p) => p.id));
  const guarda = useGuardaSaida(temAlteracoes);

  // Carregar dados
  useEffect(() => {
    vinculosProgramasAlteradosRef.current = false;

    const carregarDados = () => {
      const exercicios = stateManagerRepository.listarTodosExercicios();
      const tiposCardio = stateManagerRepository.listarTiposCardio();
      const programas = stateManagerRepository.listarProgramas();
      setTodosExercicios(exercicios);
      setTiposCardio(tiposCardio);
      setProgramas(programas);

      if (fichaId) {
        const f = stateManagerRepository.obterFichaPorId(fichaId);
        if (f) {
          setFicha(f);
          setNome(f.nome);
          setDescricao(f.descricao);
          setIcone(f.emoji || "💪");
          setItens(f.itens);

          // Vínculos persistidos servem de baseline mesmo quando não recarregamos
          // o estado local (para não sobrescrever edições pendentes do usuário).
          const persistidosIds = stateManagerRepository
            .obterProgramasDaFicha(fichaId)
            .map((p) => p.id);

          // Carregar programas vinculados
          if (!vinculosProgramasAlteradosRef.current) {
            const programasVinc = stateManagerRepository.obterProgramasDaFicha(fichaId);
            setProgramasVinculados(programasVinc);
          }

          setBaseline(
            assinaturaFicha(f.nome, f.descricao, f.emoji || "💪", f.itens, persistidosIds)
          );
        }
      } else {
        const nomeGerado = stateManagerRepository.gerarNomeFicha();
        setNome(nomeGerado);
        setIcone("💪");

        // Se foi fornecido um programaId, vincular automaticamente
        let baselineProgramaIds: string[] = [];
        if (programaId) {
          const programa = programas.find((p) => p.id === programaId);
          if (programa) {
            setProgramasVinculados([programa]);
            vinculosProgramasAlteradosRef.current = true;
            baselineProgramaIds = [programa.id];
          }
        }

        // Ficha nova nasce "limpa": o nome gerado e o vínculo pré-preenchido não
        // contam como alteração do usuário.
        setBaseline(assinaturaFicha(nomeGerado, "", "💪", [], baselineProgramaIds));
      }
    };

    carregarDados();

    const cancelarInscricao = stateManagerRepository.inscrever(carregarDados);
    return cancelarInscricao;
  }, [fichaId, programaId]);

  // Voltar (back físico/navegador) fecha a camada de itens em vez de sair do
  // editor. Sentinela duplica o state do React Router pra não confundir a
  // reconciliação dele; "Concluir" também sai via history.back() (abaixo), então
  // a sentinela é sempre consumida — sem vazar entradas no histórico.
  useEffect(() => {
    if (!telaItensAberta) return;
    window.history.pushState(window.history.state, "");
    const aoVoltarHistorico = () => {
      setTelaItensAberta(false);
      setPainelAdicionar(null);
    };
    window.addEventListener("popstate", aoVoltarHistorico);
    return () => window.removeEventListener("popstate", aoVoltarHistorico);
  }, [telaItensAberta]);

  const abrirTelaItens = () => setTelaItensAberta(true);
  const fecharTelaItens = () => window.history.back();

  // Handlers
  const handleSalvar = () => {
    if (!nome.trim()) {
      showError("Digite um nome para a ficha.");
      return;
    }

    if (itens.length === 0) {
      showError("Adicione pelo menos um exercício ou cardio à ficha.");
      return;
    }

    const dadosFicha = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      icone: "halter" as const,
      emoji: icone || undefined,
      itens,
    };

    if (editando && ficha) {
      const programasAntesDeSalvar = stateManagerRepository.obterProgramasDaFicha(ficha.id);
      const deveAtualizarVinculos = vinculosProgramasAlteradosRef.current;

      stateManagerRepository.atualizarFicha(ficha.id, dadosFicha);

      // Atualizar vínculos de programas
      if (deveAtualizarVinculos) {
        const programasAntigosIds = new Set(programasAntesDeSalvar.map((p) => p.id));
        const programasNovosIds = new Set(programasVinculados.map((p) => p.id));

        // Desvincular programas removidos
        programasAntesDeSalvar.forEach((p) => {
          if (!programasNovosIds.has(p.id)) {
            stateManagerRepository.desvincularFichaDoPrograma(ficha.id, p.id);
          }
        });

        // Vincular novos programas
        programasVinculados.forEach((p) => {
          if (!programasAntigosIds.has(p.id)) {
            stateManagerRepository.vincularFichaAoPrograma(ficha.id, p.id);
          }
        });
      }
    } else {
      // Criar nova ficha
      const novaFicha = stateManagerRepository.adicionarFicha(dadosFicha);

      // Vincular aos programas selecionados
      programasVinculados.forEach((p) => {
        stateManagerRepository.vincularFichaAoPrograma(novaFicha.id, p.id);
      });
    }

    aoVoltar();
  };

  const handleExcluir = () => {
    if (!fichaId) return;
    stateManagerRepository.removerFicha(fichaId);
    setModalExcluirAberto(false);
    aoVoltar();
  };

  const handleAdicionarExercicio = (exercicioId: string) => {
    const novoExercicio: ExercicioFicha = {
      exercicioId,
      series: 3,
      repeticoes: 12,
      usaCarga: true,
      descansoSegundos: 60,
    };
    setItens((itensAtuais) => [...itensAtuais, { tipo: "exercicio", exercicio: novoExercicio }]);
    setPainelAdicionar(null);
  };

  const handleAdicionarCardio = (tipo: TipoCardio) => {
    setItens((itensAtuais) => [
      ...itensAtuais,
      {
        tipo: "cardio",
        cardio: { id: crypto.randomUUID(), tipo, duracaoMinutos: 20, nota: "" },
      },
    ]);
    setPainelAdicionar(null);
  };

  const handleRemoverItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleAtualizarExercicio = (
    index: number,
    atualizacoes: Partial<ExercicioFicha>
  ) => {
    setItens((itensAtuais) =>
      itensAtuais.map((item, i) =>
        i === index && item.tipo === "exercicio"
          ? { tipo: "exercicio", exercicio: { ...item.exercicio, ...atualizacoes } }
          : item
      )
    );
  };

  const handleAtualizarCardio = (
    index: number,
    atualizacoes: Partial<EntradaCardio>
  ) => {
    setItens((itensAtuais) =>
      itensAtuais.map((item, i) =>
        i === index && item.tipo === "cardio"
          ? { tipo: "cardio", cardio: { ...item.cardio, ...atualizacoes } }
          : item
      )
    );
  };

  const handleReordenarItens = (evento: DragEndEvent) => {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;
    setItens((atuais) => {
      const de = atuais.findIndex((item) => idDoItem(item) === active.id);
      const para = atuais.findIndex((item) => idDoItem(item) === over.id);
      if (de === -1 || para === -1) return atuais;
      return arrayMove(atuais, de, para);
    });
  };

  const handleCriarExercicioCustom = (exercicio: Omit<Exercicio, "id">) => {
    const novoExercicio = stateManagerRepository.adicionarExercicioCustom(exercicio);
    setTodosExercicios((exerciciosAtuais) => [...exerciciosAtuais, novoExercicio]);
    handleAdicionarExercicio(novoExercicio.id);
    setModalCriarExercicioAberto(false);
  };

  const handleCopiarFichaExistente = (fichaId: string) => {
    const ficha = stateManagerRepository.obterFichaPorId(fichaId);
    if (!ficha) return;

    setNome(ficha.nome.replace(/\s*\(cópia\)$/, ""));
    setDescricao(ficha.descricao);
    setIcone(ficha.emoji || "💪");
    setItens(ficha.itens);

    setModalCopiarFichaAberto(false);
  };

  const getNomeExercicio = (exercicioId: string): string => {
    const exercicio = todosExercicios.find((e) => e.id === exercicioId);
    return exercicio?.nome || "Exercício não encontrado";
  };

  const rotuloDoItem = (item: ItemFicha): string => {
    if (item.tipo === "exercicio") {
      return getNomeExercicio(item.exercicio.exercicioId);
    }
    const tipo = resolverTipoCardio(item.cardio.tipo, tiposCardio);
    return tipo.nome;
  };

  const detalheDoItem = (item: ItemFicha): string => {
    return item.tipo === "exercicio"
      ? `${item.exercicio.series}x${item.exercicio.repeticoes}`
      : `${item.cardio.duracaoMinutos}min`;
  };

  const partesResumo: string[] = [];
  if (totalExercicios > 0) {
    partesResumo.push(`${totalExercicios} ${totalExercicios === 1 ? "exercício" : "exercícios"}`);
  }
  if (totalCardio > 0) {
    partesResumo.push(`${totalCardio} ${totalCardio === 1 ? "cardio" : "cardios"}`);
  }
  const resumoItens = partesResumo.join(" · ");

  return (
    <>
      {/* Backdrop do drawer — apenas tablet/desktop (md+); fecha ao clicar fora. */}
      <div
        className="hidden md:block fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={() => guarda.solicitarSaida(aoVoltar)}
        aria-hidden="true"
      />
      {/* Tela cheia no mobile; drawer lateral à direita no md+. */}
      <div className="fixed inset-0 z-[60] flex flex-col bg-superficie md:left-auto md:right-0 md:w-full md:max-w-[560px] md:border-l md:border-borda md:shadow-2xl md-drawer-enter">
        {/* Header fixo */}
        <div className="px-5 pt-[max(var(--safe-top),16px)] pb-4 border-b border-borda shrink-0">
          <div className="flex items-center justify-between min-h-[32px]">
            <h1 className="text-2xl font-bold font-display tracking-tight text-texto-primario">
              {titulo}
            </h1>
            {/* Ação destrutiva no topo (menos alcançável), só no modo edição. */}
            {editando && (
              <button
                type="button"
                onClick={() => setModalExcluirAberto(true)}
                className="flex items-center gap-1.5 px-2 -mr-2 text-perigo hover:bg-perigo-suave rounded-lg transition-colors"
              >
                <Icone nome="lixeira" tamanho={18} />
                <span className="text-sm font-medium">Excluir</span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo scrollável — página única */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-4 pb-6 space-y-6">
            {/* Nome + copiar de existente (link sutil) */}
            <div ref={alvoIdentidade} className="space-y-2">
              <Input
                label="Nome da ficha"
                tipo="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Treino A"
              />
              <button
                type="button"
                onClick={() => setModalCopiarFichaAberto(true)}
                className="inline-flex items-center gap-1.5 px-0.5 text-xs text-texto-secundario transition-colors hover:text-texto-primario"
              >
                <Icone nome="copiar" tamanho={14} />
                Copiar de uma ficha existente
              </button>
            </div>

            <Input
              label="Descrição (opcional)"
              tipo="textarea"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Foco em peito e tríceps"
              linhas={2}
            />

            <SeletorIcone
              valor={icone}
              aoAlterar={setIcone}
              aberto={modalEmojiAberto}
              aoAbrir={() => setModalEmojiAberto(true)}
              aoFechar={() => setModalEmojiAberto(false)}
            />

            {/* Itens do treino — resumo/empty-state que leva à tela dedicada */}
            <div className="space-y-2.5">
              <RotuloSecao
                dot
                acao={
                  resumoItens ? (
                    <span className="text-xs text-texto-sutil">{resumoItens}</span>
                  ) : null
                }
              >
                Itens do treino
              </RotuloSecao>

              {itens.length === 0 ? (
                <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-borda bg-superficie-suave/60 px-5 py-7 text-center">
                  <span className="text-[32px] leading-none">🏋️</span>
                  <div>
                    <p className="text-sm font-semibold text-texto-primario">
                      Nenhum item ainda
                    </p>
                    <p className="mx-auto mt-1 max-w-[240px] text-[13px] text-texto-secundario">
                      Monte a sequência de exercícios e cardio numa tela dedicada.
                    </p>
                  </div>
                  <Botao
                    ref={alvoMontarTreino}
                    variante="primario"
                    tamanho="compacto"
                    icone={<Icone nome="mais" tamanho={16} />}
                    onClick={abrirTelaItens}
                  >
                    Montar treino
                  </Botao>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={abrirTelaItens}
                  className="block w-full overflow-hidden rounded-2xl border border-borda bg-superficie text-left"
                >
                  {itens.map((item, index) => (
                    <div
                      key={`resumo-${idDoItem(item)}`}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                        index > 0 ? "border-t border-borda-suave" : ""
                      }`}
                    >
                      <span className="truncate text-sm text-texto-primario">
                        {index + 1}. {rotuloDoItem(item)}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-texto-secundario">
                        {detalheDoItem(item)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center gap-1.5 border-t border-borda-suave bg-superficie-suave px-4 py-3 text-[13px] font-medium text-texto-primario">
                    <Icone nome="editar" tamanho={15} />
                    Editar itens do treino
                  </div>
                </button>
              )}
            </div>

            {/* Programas */}
            <div className="space-y-2.5">
              <RotuloSecao
                dot
                acao={
                  programas.length > programasVinculados.length ? (
                    <Botao
                      variante="fantasma"
                      tamanho="compacto"
                      icone={<Icone nome="mais" tamanho={14} />}
                      onClick={abrirModalVincularPrograma}
                    >
                      Vincular
                    </Botao>
                  ) : null
                }
              >
                Programas
              </RotuloSecao>

              {programasVinculados.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borda bg-superficie-suave/60 px-4 py-6 text-center">
                  <p className="mx-auto max-w-[240px] text-[13px] text-texto-secundario">
                    {programas.length === 0
                      ? "Crie um programa primeiro para vincular a esta ficha."
                      : "Esta ficha ainda não está em nenhum programa."}
                  </p>
                  {programas.length > 0 && (
                    <Botao
                      variante="secundario"
                      tamanho="compacto"
                      icone={<Icone nome="mais" tamanho={16} />}
                      onClick={abrirModalVincularPrograma}
                    >
                      Vincular a um programa
                    </Botao>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
                  {programasVinculados.map((programa, i) => (
                    <div
                      key={programa.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${
                        i > 0 ? "border-t border-borda-suave" : ""
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-acento">
                        <Icone nome="clipboard" tamanho={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-texto-primario">
                          {programa.nome}
                        </p>
                        {programa.ativo && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-texto-sutil">
                            <span className="h-1.5 w-1.5 rounded-full bg-acento" />
                            Programa ativo
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          vinculosProgramasAlteradosRef.current = true;
                          setProgramasVinculados(
                            programasVinculados.filter((p) => p.id !== programa.id)
                          );
                        }}
                        className="shrink-0 p-1.5 text-texto-secundario transition-colors hover:text-perigo"
                        aria-label={`Desvincular ${programa.nome}`}
                      >
                        <Icone nome="fechar" tamanho={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer fixo — ações rápidas ao alcance do polegar */}
        <div className="shrink-0 px-5 pt-4 pb-[max(var(--safe-bottom),16px)] border-t border-borda bg-superficie/95 backdrop-blur-sm">
          <div className="max-w-[480px] mx-auto flex gap-3">
            <Botao
              variante="secundario"
              onClick={() => guarda.solicitarSaida(aoVoltar)}
              className="flex-1"
            >
              Fechar
            </Botao>
            {/* Enquanto a subtela de itens está aberta por cima, este botão fica
                escondido atrás dela — não registra como alvo do tutorial, senão
                o recorte cairia num botão coberto. Volta a valer ao fechar. */}
            <Botao ref={telaItensAberta ? undefined : alvoSalvar} variante="primario" onClick={handleSalvar} className="flex-1">
              {editando ? "Salvar" : "Criar Ficha"}
            </Botao>
          </div>
        </div>

        {/* ── Camada de itens (push) — o antigo passo 2, como tela dedicada ── */}
        {telaItensAberta && (
          <div className="absolute inset-0 z-40 flex flex-col bg-superficie animate-slide-in-right">
            {/* Header com voltar */}
            <div className="px-5 pt-[max(var(--safe-top),16px)] pb-4 border-b border-borda shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={fecharTelaItens}
                className="-ml-1.5 rounded-lg p-1.5 text-texto-primario transition-colors hover:bg-superficie-suave"
                aria-label="Voltar"
              >
                <Icone nome="setaEsquerda" tamanho={22} />
              </button>
              <h2 className="flex-1 text-xl font-bold font-display tracking-tight text-texto-primario">
                Itens do treino
              </h2>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="px-5 py-4 pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-texto-secundario">
                    Monte a sequência. A ordem aqui é a ordem da execução.
                  </p>
                  {painelAdicionar !== null && (
                    <Botao
                      variante="fantasma"
                      tamanho="compacto"
                      icone={<Icone nome="fechar" tamanho={16} />}
                      onClick={() => setPainelAdicionar(null)}
                    >
                      Cancelar
                    </Botao>
                  )}
                </div>

                {painelAdicionar === "exercicio" ? (
                  <PickerExercicios
                    exercicios={todosExercicios}
                    exercicioIdsSelecionados={itens
                      .filter((item) => item.tipo === "exercicio")
                      .map((item) => (item.tipo === "exercicio" ? item.exercicio.exercicioId : ""))}
                    aoAdicionar={handleAdicionarExercicio}
                    aoCriarExercicioCustom={() => setModalCriarExercicioAberto(true)}
                  />
                ) : painelAdicionar === "cardio" ? (
                  <div className="space-y-3">
                    <p className="text-xs text-texto-sutil">
                      Toque para adicionar uma atividade
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {tiposCardio.map((tipo) => (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => handleAdicionarCardio(tipo.id)}
                          className="
                            group flex items-center gap-2.5 px-3 py-2.5 min-h-[52px]
                            rounded-xl border border-borda bg-superficie text-left
                            hover:border-acento hover:bg-acento/5
                            active:scale-[0.98] transition-all duration-150
                          "
                        >
                          <span className="text-xl leading-none shrink-0">
                            {tipo.emoji}
                          </span>
                          <span className="flex-1 min-w-0 text-[13px] font-medium leading-tight text-texto-primario">
                            {tipo.nome}
                          </span>
                          <span
                            className="
                              flex h-6 w-6 shrink-0 items-center justify-center
                              rounded-full bg-superficie-suave text-texto-sutil
                              transition-colors duration-150
                              group-hover:bg-acento group-hover:text-texto-invertido
                            "
                            aria-hidden="true"
                          >
                            <Icone nome="mais" tamanho={14} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Ações de adicionar */}
                    <div ref={alvoAdicionarItem} className="grid grid-cols-2 gap-2">
                      <Botao
                        variante="secundario"
                        className="border-dashed"
                        icone={<Icone nome="mais" tamanho={14} />}
                        onClick={() => setPainelAdicionar("exercicio")}
                      >
                        Exercício
                      </Botao>
                      <Botao
                        variante="secundario"
                        className="border-dashed"
                        icone={<Icone nome="mais" tamanho={14} />}
                        onClick={() => setPainelAdicionar("cardio")}
                      >
                        Cardio
                      </Botao>
                    </div>

                    {itens.length === 0 ? (
                      <div className="px-4 py-6 bg-superficie rounded-xl border border-borda text-center">
                        <p className="text-sm text-texto-secundario">
                          Nenhum item adicionado. Monte a sequência do treino com
                          exercícios e cardio na ordem que quiser.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {itens.length > 1 && (
                          <p className="flex items-center gap-1.5 text-xs text-texto-sutil">
                            <IconeArrastar tamanho={14} className="text-texto-sutil" />
                            Arraste pela alça para reordenar
                          </p>
                        )}
                        <DndContext
                          sensors={sensoresDrag}
                          collisionDetection={closestCenter}
                          onDragEnd={handleReordenarItens}
                        >
                          <SortableContext
                            items={itens.map(idDoItem)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="bg-superficie rounded-2xl border border-borda overflow-hidden">
                              {itens.map((item, index) =>
                                item.tipo === "exercicio" ? (
                                  <CardExercicioConfig
                                    key={idDoItem(item)}
                                    id={idDoItem(item)}
                                    numero={index + 1}
                                    nome={getNomeExercicio(item.exercicio.exercicioId)}
                                    config={item.exercicio}
                                    aoAtualizar={(atualizacoes) =>
                                      handleAtualizarExercicio(index, atualizacoes)
                                    }
                                    aoRemover={() => handleRemoverItem(index)}
                                    semBorda={index === itens.length - 1}
                                  />
                                ) : (
                                  <CardCardioConfig
                                    key={idDoItem(item)}
                                    id={idDoItem(item)}
                                    numero={index + 1}
                                    config={item.cardio}
                                    tiposCardio={tiposCardio}
                                    aoAtualizar={(atualizacoes) =>
                                      handleAtualizarCardio(index, atualizacoes)
                                    }
                                    aoRemover={() => handleRemoverItem(index)}
                                    semBorda={index === itens.length - 1}
                                  />
                                )
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer da camada de itens */}
            <div className="shrink-0 px-5 pt-4 pb-[max(var(--safe-bottom),16px)] border-t border-borda bg-superficie/95 backdrop-blur-sm">
              <div className="max-w-[480px] mx-auto">
                <Botao variante="primario" onClick={fecharTelaItens} className="w-full">
                  Concluir
                </Botao>
              </div>
            </div>
          </div>
        )}

        {/* Confirmação de saída com alterações não salvas */}
        <ModalConfirmacao
          aberto={guarda.confirmando}
          variant="atencao"
          titulo="Descartar alterações?"
          descricao="Você fez alterações nesta ficha que ainda não foram salvas. Se sair agora, elas serão perdidas."
          textoConfirmar="Descartar"
          textoCancelar="Continuar editando"
          aoConfirmar={guarda.confirmarSaida}
          aoCancelar={guarda.cancelarSaida}
        />

        {/* Confirmação de exclusão da ficha */}
        <ModalConfirmacao
          aberto={modalExcluirAberto}
          variant="perigo"
          titulo="Excluir ficha"
          descricao={`Deseja excluir "${nome.trim() || "esta ficha"}"? Esta ação não pode ser desfeita.`}
          textoConfirmar="Excluir"
          aoConfirmar={handleExcluir}
          aoCancelar={() => setModalExcluirAberto(false)}
        />

        {/* Modais */}
        <ModalCriarExercicio
          aberto={modalCriarExercicioAberto}
          aoCriar={handleCriarExercicioCustom}
          aoCancelar={() => setModalCriarExercicioAberto(false)}
        />

        <ModalCopiarFicha
          aberto={modalCopiarFichaAberto}
          aoCopiar={handleCopiarFichaExistente}
          aoCancelar={() => setModalCopiarFichaAberto(false)}
          fichaIdAtual={fichaId}
        />

        {/* Modal de vincular programas */}
        {modalVincularProgramaAberto &&
          createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              onClick={() => setModalVincularProgramaAberto(false)}
            >
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-vincular-programas"
                style={{ width: "min(350px, calc(100vw - 32px))" }}
                className="relative shrink-0 bg-superficie rounded-3xl max-h-[80vh] overflow-hidden border border-borda shadow-xl animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(evento) => evento.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-borda-suave shrink-0">
                  <h3 id="titulo-vincular-programas" className="text-lg font-semibold font-display text-texto-primario">
                    Vincular a programas
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalVincularProgramaAberto(false)}
                    className="p-2 -mr-2 text-texto-secundario hover:text-texto-primario hover:bg-superficie-suave rounded-lg transition-colors"
                    aria-label="Fechar"
                  >
                    <Icone nome="fechar" tamanho={20} />
                  </button>
                </div>
                <div className="flex-1 px-5 py-3 overflow-y-auto">
                  <div className="space-y-2">
                  {programas
                    .filter((p) => !programasVinculados.some((v) => v.id === p.id))
                    .map((programa) => (
                      <button
                        key={programa.id}
                        type="button"
                        onClick={() => setProgramaParaVincularId(programa.id)}
                        className={`w-full px-3.5 py-3 bg-superficie-suave border rounded-xl flex items-center gap-3 text-left transition-all duration-150 hover:border-acento/50 ${
                          programaParaVincularId === programa.id
                            ? "border-acento bg-acento-suave ring-2 ring-acento/20"
                            : "border-borda"
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-superficie text-acento">
                          <Icone nome="clipboard" tamanho={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-texto-primario">
                            {programa.nome}
                          </span>
                          <span className="block text-xs text-texto-secundario">
                            {programa.fichaIds.length} {programa.fichaIds.length === 1 ? "ficha" : "fichas"}
                            {programa.ativo && " · Ativo"}
                          </span>
                        </span>
                        {programaParaVincularId === programa.id && (
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acento text-texto-invertido">
                            <Icone nome="check" tamanho={13} />
                          </span>
                        )}
                      </button>
                    ))}
                  {programas.filter((p) => !programasVinculados.some((v) => v.id === p.id)).length === 0 && (
                    <p className="text-sm text-texto-sutil text-center py-4">
                      Todos os programas já estão vinculados
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex gap-3 px-5 py-4 border-t border-borda-suave shrink-0">
                  <Botao
                    variante="secundario"
                    onClick={() => setModalVincularProgramaAberto(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Botao>
                  <Botao
                    variante="primario"
                    className="flex-1"
                    disabled={!programaParaVincularId}
                    onClick={() => {
                      const programa = programas.find((item) => item.id === programaParaVincularId);
                      if (!programa) return;
                      vinculosProgramasAlteradosRef.current = true;
                      setProgramasVinculados([...programasVinculados, programa]);
                      setModalVincularProgramaAberto(false);
                    }}
                  >
                    Vincular
                  </Botao>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
}

/* ── Componentes Internos ── */

interface CardExercicioConfigProps {
  id: string;
  numero: number;
  nome: string;
  config: ExercicioFicha;
  aoAtualizar: (atualizacoes: Partial<ExercicioFicha>) => void;
  aoRemover: () => void;
  semBorda?: boolean;
}

function CardExercicioConfig({
  id,
  numero,
  nome,
  config,
  aoAtualizar,
  aoRemover,
  semBorda,
}: CardExercicioConfigProps) {
  // Só o primeiro item vira alvo do tutorial: destacar todos de uma vez não
  // ensinaria nada, e o passo fala de "séries, repetições e descanso" no
  // singular.
  const alvoSeries = useAlvoTutorial("item-series");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-superficie px-4 py-3 ${
        semBorda ? "" : "border-b border-borda-suave"
      } ${isDragging ? "z-10 opacity-90 shadow-lg" : ""}`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar ${nome}`}
            className="-ml-1.5 shrink-0 touch-none cursor-grab rounded-md p-1 text-texto-sutil hover:text-texto-secundario active:cursor-grabbing"
          >
            <IconeArrastar tamanho={18} />
          </button>
          <h4 className="truncate text-sm font-medium text-texto-primario">
            {numero}. {nome}
          </h4>
        </div>
        <button
          type="button"
          onClick={aoRemover}
          className="shrink-0 text-xs text-texto-secundario hover:text-perigo"
        >
          Remover
        </button>
      </div>

      <div
        ref={numero === 1 ? alvoSeries : undefined}
        className="grid grid-cols-4 gap-3"
      >
        {/* Séries */}
        <div>
          <label className="text-xs text-texto-secundario mb-1 block">
            Séries
          </label>
          <CampoNumerico
            variante="caixa"
            valor={config.series}
            minimo={1}
            maximo={20}
            aoAlterar={(series) => aoAtualizar({ series })}
            ariaLabel="Series"
          />
        </div>

        {/* Reps */}
        <div>
          <label className="text-xs text-texto-secundario mb-1 block">
            Reps
          </label>
          <CampoNumerico
            variante="caixa"
            valor={config.repeticoes}
            minimo={1}
            maximo={100}
            aoAlterar={(repeticoes) => aoAtualizar({ repeticoes })}
            ariaLabel="Repeticoes"
          />
        </div>

        {/* Carga */}
        <div>
          <label className="text-xs text-texto-secundario mb-1 block">
            Usa carga
          </label>
          <div className="flex h-10 items-center">
            <CampoCheck
              marcado={config.usaCarga}
              aoAlterar={(usaCarga) => aoAtualizar({ usaCarga })}
              ariaLabel="Usa carga"
            />
          </div>
        </div>

        {/* Descanso */}
        <div>
          <label className="text-xs text-texto-secundario mb-1 block">
            Descanso
          </label>
          <div className="flex items-center gap-1">
            <CampoNumerico
              variante="caixa"
              valor={config.descansoSegundos}
              minimo={10}
              maximo={600}
              passo={10}
              aoAlterar={(descansoSegundos) => aoAtualizar({ descansoSegundos })}
              ariaLabel="Descanso em segundos"
            />
            <span className="text-xs text-texto-sutil">s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardCardioConfigProps {
  id: string;
  numero: number;
  config: EntradaCardio;
  tiposCardio: TipoCardioDef[];
  aoAtualizar: (atualizacoes: Partial<EntradaCardio>) => void;
  aoRemover: () => void;
  semBorda?: boolean;
}

function CampoMetricaCardioConfig({
  metrica,
  valor,
  aoAlterar,
}: {
  metrica: ChaveMetricaCardio;
  valor: number | undefined;
  aoAlterar: (valor: number | undefined) => void;
}) {
  const meta = META_METRICA_CARDIO[metrica];
  const ehDecimal = meta.passo < 1;

  return (
    <label className="block">
      <span className="text-xs text-texto-secundario mb-1 block">
        {meta.rotulo}{meta.unidade ? ` (${meta.unidade})` : ""}
      </span>
      <CampoNumeroOpcional
        valor={valor}
        decimal={ehDecimal}
        passo={meta.passo}
        aoAlterar={aoAlterar}
      />
    </label>
  );
}

function CardCardioConfig({
  id,
  numero,
  config,
  tiposCardio,
  aoAtualizar,
  aoRemover,
  semBorda,
}: CardCardioConfigProps) {
  const tipo = resolverTipoCardio(config.tipo, tiposCardio);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-superficie px-4 py-3 ${
        semBorda ? "" : "border-b border-borda-suave"
      } ${isDragging ? "z-10 opacity-90 shadow-lg" : ""}`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar ${tipo.nome}`}
            className="-ml-1.5 shrink-0 touch-none cursor-grab rounded-md p-1 text-texto-sutil hover:text-texto-secundario active:cursor-grabbing"
          >
            <IconeArrastar tamanho={18} />
          </button>
          <h4 className="truncate text-sm font-medium text-texto-primario">
            {numero}. {tipo.emoji ? `${tipo.emoji} ` : ""}{tipo.nome}
          </h4>
        </div>
        <button
          type="button"
          onClick={aoRemover}
          className="shrink-0 text-xs text-texto-secundario hover:text-perigo"
        >
          Remover
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tipo.metricas.map((metrica) => (
          <CampoMetricaCardioConfig
            key={metrica}
            metrica={metrica}
            valor={config[metrica]}
            aoAlterar={(valor) =>
              aoAtualizar({ [metrica]: metrica === "duracaoMinutos" ? valor ?? 0 : valor })
            }
          />
        ))}
      </div>

      <div className="mt-2">
        <Input
          tipo="text"
          value={config.nota}
          onChange={(e) => aoAtualizar({ nota: e.target.value })}
          placeholder="Nota opcional (ex: zona 2)"
          className="text-sm"
        />
      </div>
    </div>
  );
}
