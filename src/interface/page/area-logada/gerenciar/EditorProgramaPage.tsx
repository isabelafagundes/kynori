/* ═══════════════════════════════════════════
   Editor de Programa — Criar/Editar Programas
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import type { Programa } from "@/domain/tipos";
import { exerciciosDaFicha } from "@/domain/ficha";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { Input } from "@/interface/widget/formulario/Input";
import { Botao } from "@/interface/widget/botao/Botao";
import { BotaoAcao } from "@/interface/widget/botao/BotaoAcao";
import { Icone } from "@/interface/widget/svg/Icone";
import { useToast } from "@/interface/widget/toast";
import { ModalCopiarPrograma } from "@/interface/widget/modal/ModalCopiarPrograma";
import { ModalConfirmacao } from "@/interface/widget/modal/ModalConfirmacao";
import { MenuAcoes } from "@/interface/widget/menu/MenuAcoes";
import { useAlvoTutorial } from "@/interface/widget/tutorial/TutorialProvider";
import type { OpcoesNavegacao } from "@/interface/rota/useNavegar";
import { useGuardaSaida } from "./useGuardaSaida";
import { RodapeEditor } from "./RodapeEditor";

/** Assinatura dos campos que só são persistidos ao salvar. */
function assinaturaPrograma(nome: string, descricao: string, ativo: boolean): string {
  return JSON.stringify({ nome: nome.trim(), descricao: descricao.trim(), ativo });
}

interface PropriedadesEditorProgramaPage {
  programaId?: string;
  aoVoltar: () => void;
  aoNavegar: (
    destino: string,
    params?: Record<string, string>,
    opcoes?: OpcoesNavegacao
  ) => void;
}

export function EditorProgramaPage({
  programaId,
  aoVoltar,
  aoNavegar,
}: PropriedadesEditorProgramaPage) {
  const { showError } = useToast();
  const alvoNome = useAlvoTutorial("programa-nome");
  const alvoNovaFicha = useAlvoTutorial("programa-nova-ficha");
  const [, setPrograma] = useState<Programa | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [programaTempId, setProgramaTempId] = useState<string | null>(null);
  const [modalCopiarProgramaAberto, setModalCopiarProgramaAberto] = useState(false);
  const [modalNovaFicha, setModalNovaFicha] = useState(false);
  const [modalSelecionarFicha, setModalSelecionarFicha] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [fichaParaRemover, setFichaParaRemover] = useState<{ id: string; nome: string } | null>(null);
  const inicializouNovoProgramaRef = useRef(false);

  // Snapshot dos campos no momento em que foram carregados/salvos, para detectar
  // alterações não salvas ao tentar fechar.
  const [baseline, setBaseline] = useState<string | null>(null);

  const editando = Boolean(programaId);
  const titulo = editando ? "Editar Programa" : "Novo Programa";
  const idParaUsar = programaId || programaTempId;
  const programaPersistido = Boolean(idParaUsar);

  const temAlteracoes =
    baseline !== null && baseline !== assinaturaPrograma(nome, descricao, ativo);
  const guarda = useGuardaSaida(temAlteracoes);

  // Carregar dados
  useEffect(() => {
    const carregarDados = () => {
      if (programaId) {
        inicializouNovoProgramaRef.current = false;
        const prog = stateManagerRepository.obterProgramaPorId(programaId);
        if (prog) {
          setPrograma(prog);
          setNome(prog.nome);
          setDescricao(prog.descricao);
          setAtivo(prog.ativo);
          setBaseline(assinaturaPrograma(prog.nome, prog.descricao, prog.ativo));
        }
      } else if (!inicializouNovoProgramaRef.current) {
        // Novo programa - começar como ativo se não houver outros
        const nomeGerado = stateManagerRepository.gerarNomePrograma();
        const programaAtivo = stateManagerRepository.obterProgramaAtivo();
        const ativoInicial = !programaAtivo;
        setNome(nomeGerado);
        setAtivo(ativoInicial);
        setBaseline(assinaturaPrograma(nomeGerado, "", ativoInicial));
        inicializouNovoProgramaRef.current = true;
      }
    };

    carregarDados();

    const cancelarInscricao = stateManagerRepository.inscrever(carregarDados);
    return cancelarInscricao;
  }, [programaId]);

  /**
   * Garante que o programa exista no repositório e devolve o id.
   *
   * Antes, "Nova ficha" só aparecia depois de salvar — a tela cobrava um
   * "Criar Programa" no meio do caminho só para liberar o resto do formulário.
   * O modal já criava o programa em silêncio nesse caso; aqui isso virou o
   * comportamento único, e a seção de fichas fica disponível desde o começo.
   *
   * Retorna null (com aviso) quando ainda falta o nome — único dado
   * obrigatório para persistir.
   */
  const garantirProgramaPersistido = (): string | null => {
    if (idParaUsar) return idParaUsar;

    if (!nome.trim()) {
      showError("Digite um nome para o programa antes de criar fichas.");
      return null;
    }

    const novoPrograma = stateManagerRepository.adicionarPrograma({
      nome: nome.trim(),
      descricao: descricao.trim(),
      ativo,
      fichaIds: [],
    });

    setProgramaTempId(novoPrograma.id);
    // O que está no formulário acabou de ser persistido: sem reajustar o
    // baseline, sair da tela dispararia "descartar alterações?" à toa.
    setBaseline(assinaturaPrograma(nome, descricao, ativo));
    // Passar a rota a apontar para o programa criado faz o `programaId` virar
    // a fonte da verdade. Sem isso o efeito de recarga cai no ramo "novo
    // programa" e reescreve o toggle de ativo por baixo do formulário.
    aoNavegar("editarPrograma", { id: novoPrograma.id }, { substituir: true });

    return novoPrograma.id;
  };

  // Handlers
  const handleSalvar = () => {
    if (!nome.trim()) {
      showError("Digite um nome para o programa.");
      return;
    }

    if (idParaUsar) {
      // Ao editar, atualizamos apenas os campos editáveis, preservando fichaIds
      stateManagerRepository.atualizarPrograma(idParaUsar, {
        nome: nome.trim(),
        descricao: descricao.trim(),
        ativo,
      });
    } else {
      // Ao criar, passamos todos os campos incluindo fichaIds vazio
      stateManagerRepository.adicionarPrograma({
        nome: nome.trim(),
        descricao: descricao.trim(),
        ativo,
        fichaIds: [],
      });
    }

    aoVoltar();
  };

  const handleAbrirNovaFicha = () => {
    if (!nome.trim()) {
      showError("Digite um nome para o programa antes de criar fichas.");
      return;
    }

    setModalNovaFicha(true);
  };

  const handleCopiarProgramaExistente = (programaId: string) => {
    const programa = stateManagerRepository.obterProgramaPorId(programaId);
    if (!programa) return;

    setNome(programa.nome);
    setDescricao(programa.descricao);
    setAtivo(false); // Começa inativo ao copiar

    setModalCopiarProgramaAberto(false);
  };

  const handleExcluir = () => {
    if (!programaId) return;
    stateManagerRepository.removerPrograma(programaId);
    setModalExcluirAberto(false);
    aoVoltar();
  };

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

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-5 py-4 pb-6 space-y-6">
          {/* Nome + atalho para copiar de um programa existente */}
          <div ref={alvoNome} className="space-y-2">
            <Input
              label="Nome"
              tipo="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rotina Janeiro"
            />
            <button
              type="button"
              onClick={() => setModalCopiarProgramaAberto(true)}
              className="inline-flex items-center gap-1.5 px-0.5 text-xs text-texto-secundario transition-colors hover:text-texto-primario"
            >
              <Icone nome="copiar" tamanho={14} />
              Copiar de um programa existente
            </button>
          </div>

          {/* Descrição */}
          <Input
            label="Descrição (opcional)"
            tipo="textarea"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Rotina de volume, 4x por semana"
            linhas={2}
            ajuda="Descreva o objetivo ou características do programa"
          />

          {/* Status */}
          <div className="space-y-2">
            <span className="block px-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
              Status
            </span>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className="flex w-full items-center gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-left transition-colors hover:bg-superficie-suave"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-texto-primario">
                  Programa ativo
                </p>
                <p className="text-xs text-texto-sutil">
                  Apenas um programa pode estar ativo por vez
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${ativo ? "bg-acento" : "bg-borda"}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-superficie transition-transform duration-200 ${ativo ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>
          </div>

          {/* Fichas do programa */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-acento" />
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
                  Fichas do programa
                </span>
              </div>
              {/* Sempre disponível: o programa é persistido em silêncio no
                  primeiro uso, sem cobrar um "salvar" no meio do formulário. */}
              <Botao
                ref={alvoNovaFicha}
                variante="fantasma"
                tamanho="compacto"
                icone={<Icone nome="mais" tamanho={14} />}
                onClick={handleAbrirNovaFicha}
              >
                Nova ficha
              </Botao>
            </div>

            {(() => {
              const fichasDoPrograma = idParaUsar
                ? stateManagerRepository.obterFichasDoPrograma(idParaUsar)
                : [];
              if (fichasDoPrograma.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-borda bg-superficie-suave/60 px-4 py-6 text-center">
                    <p className="text-sm text-texto-secundario">
                      Nenhuma ficha ainda. Adicione a primeira com “Nova ficha”.
                    </p>
                  </div>
                );
              }
              return (
                  <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
                    {fichasDoPrograma.map((ficha, i) => (
                      <div
                        key={ficha.id}
                        className={`flex items-center gap-3 px-3 py-2.5 ${
                          i > 0 ? "border-t border-borda-suave" : ""
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-lg">
                          {ficha.emoji || "💪"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-texto-primario">
                            {ficha.nome}
                          </p>
                          <p className="text-xs text-texto-sutil">
                            {exerciciosDaFicha(ficha).length} {exerciciosDaFicha(ficha).length === 1 ? "exercício" : "exercícios"}
                          </p>
                        </div>
                        <MenuAcoes
                          rotulo={`Ações de ${ficha.nome}`}
                          itens={[
                            {
                              label: "Editar",
                              icone: "editar",
                              onClick: () => aoNavegar("editarFicha", { id: ficha.id }),
                            },
                            {
                              label: "Remover do programa",
                              icone: "lixeira",
                              onClick: () => setFichaParaRemover({ id: ficha.id, nome: ficha.nome }),
                              perigo: true,
                            },
                          ]}
                        />
                      </div>
                    ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Footer fixo com botões */}
      <RodapeEditor
        rotuloSalvar={programaPersistido ? "Salvar" : "Criar Programa"}
        aoSalvar={handleSalvar}
        aoFechar={() => guarda.solicitarSaida(aoVoltar)}
      />

      {/* Confirmação de saída com alterações não salvas */}
      <ModalConfirmacao
        aberto={guarda.confirmando}
        variant="atencao"
        titulo="Descartar alterações?"
        descricao="Você fez alterações neste programa que ainda não foram salvas. Se sair agora, elas serão perdidas."
        textoConfirmar="Descartar"
        iconeConfirmar="lixeira"
        textoCancelar="Continuar editando"
        aoConfirmar={guarda.confirmarSaida}
        aoCancelar={guarda.cancelarSaida}
      />

      {/* Confirmação de exclusão do programa */}
      <ModalConfirmacao
        aberto={modalExcluirAberto}
        variant="perigo"
        titulo="Excluir programa"
        descricao={`Deseja excluir "${nome.trim() || "este programa"}"? As fichas serão desvinculadas, mas não excluídas.`}
        textoConfirmar="Excluir"
        aoConfirmar={handleExcluir}
        aoCancelar={() => setModalExcluirAberto(false)}
      />

      {/* Modal de copiar programa */}
      <ModalCopiarPrograma
        aberto={modalCopiarProgramaAberto}
        aoCopiar={handleCopiarProgramaExistente}
        aoCancelar={() => setModalCopiarProgramaAberto(false)}
      />

      {/* Modal de confirmação de remoção de ficha */}
      <ModalConfirmacao
        aberto={fichaParaRemover !== null}
        titulo="Remover ficha do programa"
        descricao={
          fichaParaRemover
            ? `Deseja remover "${fichaParaRemover.nome}" deste programa? A ficha não será apagada e continuará disponível em outros programas.`
            : ""
        }
        textoConfirmar="Remover"
        aoConfirmar={() => {
          if (fichaParaRemover && idParaUsar) {
            stateManagerRepository.desvincularFichaDoPrograma(
              fichaParaRemover.id,
              idParaUsar
            );
          }
          setFichaParaRemover(null);
        }}
        aoCancelar={() => setFichaParaRemover(null)}
      />

      {/* Modal Nova Ficha - Opções */}
      {modalNovaFicha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalNovaFicha(false)}
          />

          {/* Modal Content */}
          <div className="relative w-[350px] bg-superficie rounded-3xl shadow-xl border border-borda animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-borda-suave">
              <h3 className="text-lg font-semibold font-display text-texto-primario">Nova Ficha</h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const programaIdFinal = garantirProgramaPersistido();
                  if (!programaIdFinal) return;

                  setModalNovaFicha(false);
                  aoNavegar("criarFicha", { programaId: programaIdFinal });
                }}
                className="w-full px-4 py-3 bg-superficie-suave hover:bg-superficie-hover rounded-xl border border-borda-suave text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icone nome="mais" tamanho={20} />
                  <div>
                    <p className="font-medium text-sm">Criar nova ficha</p>
                    <p className="text-xs text-texto-secundario">Crie uma ficha do zero</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!garantirProgramaPersistido()) return;

                  setModalNovaFicha(false);
                  setModalSelecionarFicha(true);
                }}
                className="w-full px-4 py-3 bg-superficie-suave hover:bg-superficie-hover rounded-xl border border-borda-suave text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icone nome="halter" tamanho={20} />
                  <div>
                    <p className="font-medium text-sm">Adicionar ficha existente</p>
                    <p className="text-xs text-texto-secundario">Selecione uma ficha criada anteriormente</p>
                  </div>
                </div>
              </button>
            </div>
            <div className="px-5 py-4 border-t border-borda-suave flex justify-end">
              <BotaoAcao
                variante="fantasma"
                icone="fechar"
                onClick={() => setModalNovaFicha(false)}
              >
                Cancelar
              </BotaoAcao>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selecionar Ficha Existente */}
      {modalSelecionarFicha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalSelecionarFicha(false)}
          />

          {/* Modal Content */}
          <div className="relative w-[350px] max-h-[80vh] bg-superficie rounded-3xl shadow-xl border border-borda animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-5 py-4 border-b border-borda-suave shrink-0">
              <h3 className="text-lg font-semibold font-display text-texto-primario">Adicionar ficha existente</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {stateManagerRepository.listarFichas().map((ficha) => {
                  const programasDaFicha = stateManagerRepository.obterProgramasDaFicha(ficha.id);
                  const jaVinculada = programasDaFicha.some((p) => p.id === idParaUsar);
                  return (
                    <button
                      key={ficha.id}
                      type="button"
                      disabled={jaVinculada}
                      onClick={() => {
                        if (idParaUsar) {
                          stateManagerRepository.vincularFichaAoPrograma(ficha.id, idParaUsar);
                          setModalSelecionarFicha(false);
                        }
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        jaVinculada
                          ? "bg-superficie-suave border-borda-suave opacity-50 cursor-not-allowed"
                          : "bg-superficie-suave hover:bg-superficie-hover border-borda-suave"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{ficha.emoji || "💪"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-texto-primario truncate">{ficha.nome}</p>
                          <p className="text-xs text-texto-secundario">
                            {exerciciosDaFicha(ficha).length} {exerciciosDaFicha(ficha).length === 1 ? "exercício" : "exercícios"}
                          </p>
                        </div>
                        {jaVinculada && (
                          <span className="text-xs text-texto-sutil shrink-0">Já adicionada</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {stateManagerRepository.listarFichas().length === 0 && (
                  <p className="text-sm text-texto-sutil text-center py-8">
                    Nenhuma ficha criada ainda
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-borda-suave flex justify-end shrink-0">
              <BotaoAcao
                variante="fantasma"
                icone="fechar"
                onClick={() => setModalSelecionarFicha(false)}
              >
                Cancelar
              </BotaoAcao>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
