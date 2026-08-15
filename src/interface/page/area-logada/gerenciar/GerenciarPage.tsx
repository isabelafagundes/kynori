/* ═══════════════════════════════════════════
   Tela Principal de Gerenciamento — Pezzo
   ───────────────────────────────────────────
   Programas é a "casa" da seção (launchpad): herói do programa ativo +
   "trocar para" + bibliotecas (Fichas / Exercícios). Fichas e Exercícios
   são telas próprias (rotas /gerenciar/fichas e /gerenciar/exercicios),
   alcançadas pelo rodapé Bibliotecas (mobile/tablet) ou pela sidebar (desktop).
   Sem BigSwitcher — qual visualização vem por rota (prop `visualizacao`).
   ═══════════════════════════════════════════ */

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type {
  ChaveMetricaCardio,
  Exercicio,
  Ficha,
  Programa,
  TipoCardioDef,
} from "@/domain/tipos";
import { META_METRICA_CARDIO } from "@/domain/tipos";
import { cardioDaFicha, exerciciosDaFicha } from "@/domain/ficha";
import { stateManagerRepository } from "@/infrastructure/repo/state/state-manager.repo";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone } from "@/interface/widget/svg/Icone";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Input } from "@/interface/widget/formulario/Input";
import { ModalConfirmacao } from "@/interface/widget/modal/ModalConfirmacao";
import { ModalCriarExercicio } from "@/interface/widget/modal/ModalCriarExercicio";
import { MenuAcoes } from "@/interface/widget/menu/MenuAcoes";
import { useToast } from "@/interface/widget/toast";
import { ativacoesDoExercicio } from "@/domain/ativacao-muscular";
import { MapaMuscular } from "@/interface/widget/musculatura/MapaMuscular";

type VisualizacaoGerenciar = "programas" | "fichas" | "exercicios";
type TipoExclusaoGerenciar = "programa" | "exercicio" | "ficha" | "cardio";
/** Sub-abas da biblioteca de Exercícios: força vs. cardio. */
type AbaExercicios = "musculacao" | "cardio";

interface ModalExclusaoGerenciar {
  aberto: boolean;
  tipo: TipoExclusaoGerenciar | null;
  id: string | null;
  nome: string;
}

type ItensExcluindoGerenciar = Record<TipoExclusaoGerenciar, Set<string>>;

interface PropriedadesGerenciarPage {
  aoNavegar: (destino: string, params?: Record<string, string>) => void;
  /** Qual CRUD exibir. Definido pela rota; default "programas" (a casa). */
  visualizacao?: VisualizacaoGerenciar;
}

const CHAVES_METRICAS_CARDIO: ChaveMetricaCardio[] = [
  "duracaoMinutos",
  "distanciaKm",
  "passos",
  "niveis",
  "pulos",
  "inclinacaoPct",
  "resistencia",
  "rpm",
  "ritmo500m",
  "spm",
];

interface FormTipoCardio {
  nome: string;
  emoji: string;
  metricas: ChaveMetricaCardio[];
}

const FORM_CARDIO_INICIAL: FormTipoCardio = {
  nome: "",
  emoji: "",
  metricas: ["duracaoMinutos"],
};

const MODAL_EXCLUSAO_FECHADO: ModalExclusaoGerenciar = {
  aberto: false,
  tipo: null,
  id: null,
  nome: "",
};

const CONFIG_EXCLUSAO_GERENCIAR: Record<
  TipoExclusaoGerenciar,
  {
    titulo: string;
    descricao: (nome: string) => string;
    remover: (id: string) => void;
  }
> = {
  programa: {
    titulo: "Excluir programa",
    descricao: (nome) => `Tem certeza que deseja excluir "${nome}"? As fichas serão desvinculadas mas não excluídas.`,
    remover: (id) => stateManagerRepository.removerPrograma(id),
  },
  exercicio: {
    titulo: "Excluir exercício",
    descricao: (nome) => `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
    remover: (id) => stateManagerRepository.removerExercicioCustom(id),
  },
  ficha: {
    titulo: "Excluir ficha",
    descricao: (nome) => `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
    remover: (id) => stateManagerRepository.removerFicha(id),
  },
  cardio: {
    titulo: "Excluir cardio",
    descricao: (nome) => `Tem certeza que deseja excluir "${nome}"? O histórico antigo será mantido.`,
    remover: (id) => stateManagerRepository.removerCardioCustom(id),
  },
};

function criarItensExcluindo(): ItensExcluindoGerenciar {
  return {
    programa: new Set(),
    exercicio: new Set(),
    ficha: new Set(),
    cardio: new Set(),
  };
}

export function GerenciarPage({ aoNavegar, visualizacao = "programas" }: PropriedadesGerenciarPage) {
  const { showSuccess } = useToast();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [fichas, _setFichas] = useState<Ficha[]>([]);
  const [exerciciosCustom, setExerciciosCustom] = useState<Exercicio[]>([]);
  const [todosExercicios, setTodosExercicios] = useState<Exercicio[]>([]);
  const [tiposCardio, setTiposCardio] = useState<TipoCardioDef[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCriarExercicioAberto, setModalCriarExercicioAberto] = useState(false);
  const [exercicioPadraoSelecionado, setExercicioPadraoSelecionado] = useState<Exercicio | null>(null);
  const [abaExercicios, setAbaExercicios] = useState<AbaExercicios>("musculacao");
  const [buscaExercicios, setBuscaExercicios] = useState("");
  const [buscaFichas, setBuscaFichas] = useState("");
  const [formCardioAberto, setFormCardioAberto] = useState(false);
  const [tipoCardioEditando, setTipoCardioEditando] = useState<TipoCardioDef | null>(null);
  const [formCardio, setFormCardio] = useState<FormTipoCardio>(FORM_CARDIO_INICIAL);

  // IDs de itens sendo excluídos (para animação de fade-out)
  const [itensExcluindo, setItensExcluindo] = useState<ItensExcluindoGerenciar>(criarItensExcluindo);

  // Estado do modal de confirmação
  const [modalExclusao, setModalExclusao] = useState<ModalExclusaoGerenciar>(MODAL_EXCLUSAO_FECHADO);

  // Carregar dados e inscrever para mudanças
  useEffect(() => {
    const carregarDados = () => {
      setProgramas(stateManagerRepository.listarProgramas());
      _setFichas(stateManagerRepository.listarFichas());
      setExerciciosCustom(stateManagerRepository.listarExerciciosCustom());
      setTodosExercicios(stateManagerRepository.listarTodosExercicios());
      setTiposCardio(stateManagerRepository.listarTiposCardio());
      setCarregando(false);
    };

    // Simular loading inicial suave
    const timer = setTimeout(carregarDados, 300);

    const cancelarInscricao = stateManagerRepository.inscrever(carregarDados);
    return () => {
      clearTimeout(timer);
      cancelarInscricao();
    };
  }, []);

  // Termo de busca normalizado (aplicado à aba ativa)
  const buscaNormalizada = buscaExercicios.trim().toLowerCase();
  const buscaFichasNormalizada = buscaFichas.trim().toLowerCase();

  // IDs dos exercícios customizados — o restante do catálogo é padrão do app
  const idsExerciciosCustom = useMemo(
    () => new Set(exerciciosCustom.map((e) => e.id)),
    [exerciciosCustom]
  );

  // Exercícios (padrão + custom) após a busca (por nome ou grupo muscular)
  const exerciciosFiltrados = useMemo(() => {
    if (!buscaNormalizada) return todosExercicios;
    return todosExercicios.filter(
      (e) =>
        e.nome.toLowerCase().includes(buscaNormalizada) ||
        e.grupoMuscular.toLowerCase().includes(buscaNormalizada)
    );
  }, [todosExercicios, buscaNormalizada]);

  // Exercícios agrupados por grupo muscular, ordenados alfabeticamente
  const gruposDeExercicios = useMemo(() => {
    const mapa = new Map<string, Exercicio[]>();
    for (const exercicio of exerciciosFiltrados) {
      const lista = mapa.get(exercicio.grupoMuscular) ?? [];
      lista.push(exercicio);
      mapa.set(exercicio.grupoMuscular, lista);
    }
    return [...mapa.entries()]
      .map(([grupo, lista]) => ({
        grupo,
        lista: [...lista].sort((a, b) => a.nome.localeCompare(b.nome)),
      }))
      .sort((a, b) => a.grupo.localeCompare(b.grupo));
  }, [exerciciosFiltrados]);

  // Fichas agrupadas por programa (ativo primeiro), com as órfãs à parte.
  // Uma ficha vinculada a mais de um programa aparece em cada um deles —
  // o vínculo é muitos-para-muitos (Programa.fichaIds).
  const gruposDeFichas = useMemo(() => {
    // A busca casa o nome da ficha ou o do programa que a agrupa — o nome do
    // programa é o cabeçalho visível aqui, então buscá-lo tem que funcionar.
    const combina = (ficha: Ficha, nomePrograma?: string) =>
      !buscaFichasNormalizada ||
      ficha.nome.toLowerCase().includes(buscaFichasNormalizada) ||
      (nomePrograma ?? "").toLowerCase().includes(buscaFichasNormalizada);

    const porPrograma = [...programas]
      .sort((a, b) => Number(b.ativo) - Number(a.ativo))
      .map((programa) => ({
        programa,
        lista: fichas.filter(
          (ficha) => programa.fichaIds.includes(ficha.id) && combina(ficha, programa.nome)
        ),
      }))
      .filter(({ lista }) => lista.length > 0);

    const vinculadas = new Set(programas.flatMap((programa) => programa.fichaIds));
    const orfas = fichas.filter((ficha) => !vinculadas.has(ficha.id) && combina(ficha));

    // Fichas distintas — uma ficha em dois programas aparece nos dois grupos.
    const idsVisiveis = new Set([
      ...porPrograma.flatMap(({ lista }) => lista.map((ficha) => ficha.id)),
      ...orfas.map((ficha) => ficha.id),
    ]);

    return { porPrograma, orfas, totalVisivel: idsVisiveis.size };
  }, [programas, fichas, buscaFichasNormalizada]);

  // Tipos de cardio após a busca (por nome)
  const tiposCardioFiltrados = useMemo(() => {
    if (!buscaNormalizada) return tiposCardio;
    return tiposCardio.filter((t) => t.nome.toLowerCase().includes(buscaNormalizada));
  }, [tiposCardio, buscaNormalizada]);

  // Troca de aba limpa a busca (evita um termo de uma aba filtrar a outra)
  function trocarAbaExercicios(aba: AbaExercicios) {
    setAbaExercicios(aba);
    setBuscaExercicios("");
  }

  const programaAtivo = programas.find((p) => p.ativo) ?? null;
  const programasInativos = programas.filter((p) => !p.ativo);

  function handleCriarExercicioCustom(dados: Omit<Exercicio, "id">) {
    stateManagerRepository.adicionarExercicioCustom(dados);
    setModalCriarExercicioAberto(false);
    showSuccess(`"${dados.nome}" adicionado aos seus exercícios.`);
  }

  function handleAtivarPrograma(programa: Programa) {
    stateManagerRepository.atualizarPrograma(programa.id, { ativo: true });
    showSuccess(`"${programa.nome}" está guiando seus treinos.`);
  }

  function handleDesativarPrograma(programa: Programa) {
    stateManagerRepository.atualizarPrograma(programa.id, { ativo: false });
  }

  function handleDuplicarPrograma(programa: Programa) {
    const copia = stateManagerRepository.copiarPrograma(programa.id);
    if (copia) showSuccess(`"${programa.nome}" duplicado.`);
  }

  function abrirFormularioCardio(tipo?: TipoCardioDef) {
    setTipoCardioEditando(tipo ?? null);
    setFormCardio(
      tipo
        ? {
            nome: tipo.nome,
            emoji: tipo.emoji ?? "",
            metricas: tipo.metricas.length > 0 ? tipo.metricas : ["duracaoMinutos"],
          }
        : FORM_CARDIO_INICIAL
    );
    setFormCardioAberto(true);
  }

  function fecharFormularioCardio() {
    setTipoCardioEditando(null);
    setFormCardio(FORM_CARDIO_INICIAL);
    setFormCardioAberto(false);
  }

  useEffect(() => {
    if (!formCardioAberto) return;

    const fecharComEscape = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") fecharFormularioCardio();
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [formCardioAberto]);

  useEffect(() => {
    if (!exercicioPadraoSelecionado) return;

    const fecharComEscape = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") setExercicioPadraoSelecionado(null);
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [exercicioPadraoSelecionado]);

  function alternarMetricaCardio(chave: ChaveMetricaCardio) {
    setFormCardio((atual) => {
      const jaSelecionada = atual.metricas.includes(chave);
      const metricas = jaSelecionada
        ? atual.metricas.filter((item) => item !== chave)
        : [...atual.metricas, chave];

      return {
        ...atual,
        metricas: metricas.length > 0 ? metricas : ["duracaoMinutos"],
      };
    });
  }

  function salvarTipoCardio() {
    const nome = formCardio.nome.trim();
    if (!nome) return;

    const dados = {
      nome,
      emoji: formCardio.emoji.trim() || undefined,
      metricas: formCardio.metricas,
      builtin: tipoCardioEditando?.builtin ?? false,
    };

    if (tipoCardioEditando) {
      stateManagerRepository.atualizarCardioCustom(tipoCardioEditando.id, dados);
      showSuccess(`"${nome}" atualizado.`);
    } else {
      stateManagerRepository.adicionarCardioCustom(dados);
      showSuccess(`"${nome}" adicionado aos cardios.`);
    }

    fecharFormularioCardio();
  }

  const configModalExclusao = modalExclusao.tipo ? CONFIG_EXCLUSAO_GERENCIAR[modalExclusao.tipo] : null;

  return (
    <div className="px-5 py-4 space-y-4">
      {/* ══ Visualização: Programas (a casa) ══ */}
      {visualizacao === "programas" && (
        <section className="space-y-4">
          {carregando ? (
            <SkeletonProgramas />
          ) : programas.length === 0 ? (
            <EstadoVazio
              emoji="📋"
              titulo="Nenhum programa criado"
              descricao="Crie seu primeiro programa para organizar suas fichas de treino."
              dica="🗂️ Um programa agrupa as fichas de um ciclo"
              acao={
                <Botao
                  variante="secundario"
                  icone={<Icone nome="mais" tamanho={16} />}
                  onClick={() => aoNavegar("criarPrograma")}
                >
                  Criar Programa
                </Botao>
              }
            />
          ) : (
            <>
              {/* Header: contagem + Novo Programa */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-texto-sutil">
                  {programas.length} {programas.length === 1 ? "programa" : "programas"}
                </span>
                <Botao
                  variante="fantasma"
                  tamanho="compacto"
                  icone={<Icone nome="mais" tamanho={16} />}
                  onClick={() => aoNavegar("criarPrograma")}
                >
                  Novo Programa
                </Botao>
              </div>

              {/* Herói do programa ativo */}
              {programaAtivo ? (
                <div className="reveal-up space-y-2">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-acento" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
                      Programa ativo
                    </span>
                  </div>
                  <HeroProgramaAtivo
                    programa={programaAtivo}
                    quantidadeFichas={stateManagerRepository.obterFichasDoPrograma(programaAtivo.id).length}
                    estaSendoExcluido={itensExcluindo.programa.has(programaAtivo.id)}
                    aoEditar={() => aoNavegar("editarPrograma", { id: programaAtivo.id })}
                    aoDuplicar={() => handleDuplicarPrograma(programaAtivo)}
                    aoDesativar={() => handleDesativarPrograma(programaAtivo)}
                    aoExcluir={() => abrirModalExclusao("programa", programaAtivo.id, programaAtivo.nome)}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-borda bg-superficie-suave/60 px-4 py-3">
                  <p className="text-sm text-texto-secundario">
                    Nenhum programa ativo. Ative um abaixo para guiar seus treinos.
                  </p>
                </div>
              )}

              {/* Trocar para / Seus programas */}
              {(programaAtivo ? programasInativos : programas).length > 0 && (
                <section className="space-y-2.5 pt-1">
                  <span className="block px-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
                    {programaAtivo ? "Trocar para" : "Seus programas"}
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 items-start">
                    {(programaAtivo ? programasInativos : programas).map((programa, i) => (
                      <div key={programa.id} className="reveal-up" style={{ animationDelay: `${60 + i * 50}ms` }}>
                        <LinhaProgramaTrocar
                          programa={programa}
                          quantidadeFichas={stateManagerRepository.obterFichasDoPrograma(programa.id).length}
                          estaSendoExcluido={itensExcluindo.programa.has(programa.id)}
                          aoAtivar={() => handleAtivarPrograma(programa)}
                          aoEditar={() => aoNavegar("editarPrograma", { id: programa.id })}
                          aoDuplicar={() => handleDuplicarPrograma(programa)}
                          aoExcluir={() => abrirModalExclusao("programa", programa.id, programa.nome)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Bibliotecas — só mobile/tablet (no desktop moram na sidebar) */}
              <NavBibliotecas
                quantidadeFichas={fichas.length}
                quantidadeExercicios={exerciciosCustom.length}
                aoAbrirFichas={() => aoNavegar("gerenciarFichas")}
                aoAbrirExercicios={() => aoNavegar("gerenciarExercicios")}
              />
            </>
          )}
        </section>
      )}

      {/* ══ Visualização: Fichas ══ */}
      {visualizacao === "fichas" && (
        <section className="space-y-4">
          {carregando ? (
            <SkeletonCards />
          ) : (
            <>
              {fichas.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-texto-sutil">
                      {buscaFichasNormalizada
                        ? `${gruposDeFichas.totalVisivel} de ${fichas.length} fichas`
                        : `${fichas.length} ${fichas.length === 1 ? "ficha" : "fichas"}`}
                    </span>
                    <Botao
                      variante="fantasma"
                      tamanho="compacto"
                      icone={<Icone nome="mais" tamanho={16} />}
                      onClick={() => aoNavegar("criarFicha")}
                    >
                      Nova Ficha
                    </Botao>
                  </div>

                  <CampoBusca
                    valor={buscaFichas}
                    aoAlterar={setBuscaFichas}
                    placeholder="Buscar ficha ou programa..."
                  />
                </>
              )}

              {fichas.length === 0 ? (
                <EstadoVazio
                  emoji="🏋️"
                  titulo="Nenhuma ficha criada"
                  descricao="Crie sua primeira ficha de treino para começar."
                  dica="💡 Uma ficha por dia de treino — A, B, C…"
                  acao={
                    <Botao
                      variante="secundario"
                      icone={<Icone nome="mais" tamanho={16} />}
                      onClick={() => aoNavegar("criarFicha")}
                    >
                      Criar Ficha
                    </Botao>
                  }
                />
              ) : gruposDeFichas.totalVisivel === 0 ? (
                <SemResultadoBusca termo={buscaFichas} />
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                  {gruposDeFichas.porPrograma.map(({ programa, lista }, i) => (
                    <div key={programa.id} className="reveal-up" style={{ animationDelay: `${60 + i * 70}ms` }}>
                      <GrupoFichas
                        titulo={programa.nome}
                        ativo={programa.ativo}
                        fichas={lista}
                        itensExcluindo={itensExcluindo.ficha}
                        aoEditar={(ficha) => aoNavegar("editarFicha", { id: ficha.id })}
                        aoExcluir={(ficha) => abrirModalExclusao("ficha", ficha.id, ficha.nome)}
                      />
                    </div>
                  ))}

                  {gruposDeFichas.orfas.length > 0 && (
                    <div
                      className="reveal-up"
                      style={{ animationDelay: `${60 + gruposDeFichas.porPrograma.length * 70}ms` }}
                    >
                      <GrupoFichas
                        titulo="Sem programa"
                        fichas={gruposDeFichas.orfas}
                        tracejado
                        itensExcluindo={itensExcluindo.ficha}
                        aoEditar={(ficha) => aoNavegar("editarFicha", { id: ficha.id })}
                        aoExcluir={(ficha) => abrirModalExclusao("ficha", ficha.id, ficha.nome)}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ══ Visualização: Exercícios (abas Musculação / Cardio) ══ */}
      {visualizacao === "exercicios" && (
        <section className="space-y-4">
          {carregando ? (
            <div className="bg-superficie rounded-2xl border border-borda overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse border-b border-borda-suave last:border-b-0">
                  <div className="flex-1">
                    <div className="h-5 bg-borda-suave rounded w-32 mb-2"></div>
                    <div className="h-4 bg-borda-suave rounded w-24"></div>
                  </div>
                  <div className="h-8 bg-borda-suave rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <AbasExercicios
                aba={abaExercicios}
                aoAlterar={trocarAbaExercicios}
                contagemMusculacao={todosExercicios.length}
                contagemCardio={tiposCardio.length}
              />

              <CampoBusca
                valor={buscaExercicios}
                aoAlterar={setBuscaExercicios}
                placeholder={abaExercicios === "musculacao" ? "Buscar exercício..." : "Buscar cardio..."}
              />

              {abaExercicios === "musculacao" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-texto-sutil">
                      Exercícios usados nas fichas.
                    </span>
                    <Botao
                      variante="fantasma"
                      tamanho="compacto"
                      icone={<Icone nome="mais" tamanho={16} />}
                      onClick={() => setModalCriarExercicioAberto(true)}
                    >
                      Novo Exercício
                    </Botao>
                  </div>

                  {gruposDeExercicios.length === 0 ? (
                    <SemResultadoBusca termo={buscaExercicios} />
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                      {gruposDeExercicios.map(({ grupo, lista }, i) => (
                        <section
                          key={grupo}
                          className="space-y-2 reveal-up"
                          style={{ animationDelay: `${60 + i * 70}ms` }}
                        >
                          <div className="flex items-baseline justify-between px-1">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">
                              {grupo}
                            </h3>
                            <span className="text-xs tabular-nums text-texto-sutil/60">
                              {lista.length}
                            </span>
                          </div>
                          <div className="bg-superficie rounded-2xl border border-borda overflow-hidden">
                            {lista.map((exercicio, index) => {
                              const ehPadrao = !idsExerciciosCustom.has(exercicio.id);
                              return (
                                <LinhaExercicioCustom
                                  key={exercicio.id}
                                  exercicio={exercicio}
                                  ehPadrao={ehPadrao}
                                  aoVerResumo={() => setExercicioPadraoSelecionado(exercicio)}
                                  estaSendoExcluido={itensExcluindo.exercicio.has(exercicio.id)}
                                  aoExcluir={
                                    ehPadrao
                                      ? undefined
                                      : () => abrirModalExclusao("exercicio", exercicio.id, exercicio.nome)
                                  }
                                  semBorda={index === lista.length - 1}
                                />
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-texto-sutil">
                      Tipos e métricas usados nas fichas.
                    </span>
                    <Botao
                      variante="fantasma"
                      tamanho="compacto"
                      icone={<Icone nome="mais" tamanho={16} />}
                      onClick={() => abrirFormularioCardio()}
                    >
                      Novo Cardio
                    </Botao>
                  </div>

                  {formCardioAberto && (
                    <div
                      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="form-cardio-title"
                    >
                      <button
                        type="button"
                        aria-label="Fechar formulário de cardio"
                        className="absolute inset-0 h-full w-full bg-black/25 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={fecharFormularioCardio}
                      />
                      <div className="relative max-h-[90dvh] w-full space-y-4 overflow-y-auto rounded-t-3xl border border-borda bg-superficie p-5 shadow-xl animate-in slide-in-from-bottom-4 duration-200 sm:max-w-[560px] sm:rounded-3xl sm:zoom-in-95">
                        <div className="flex items-start justify-between gap-4 border-b border-borda-suave pb-4">
                          <div>
                            <h2 id="form-cardio-title" className="text-lg font-semibold font-display text-texto-primario">
                              {tipoCardioEditando
                                ? `${tipoCardioEditando.builtin ? "Customizar" : "Editar"} ${tipoCardioEditando.nome}`
                                : "Novo cardio"}
                            </h2>
                            <p className="mt-1 text-sm text-texto-secundario">
                              Escolha o nome e as métricas usadas nas fichas.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={fecharFormularioCardio}
                            className="-mr-2 rounded-lg p-2 text-texto-secundario transition-colors hover:bg-superficie-suave hover:text-texto-primario"
                            aria-label="Fechar"
                          >
                            <Icone nome="fechar" tamanho={20} />
                          </button>
                        </div>
                      <div className="grid grid-cols-[72px_1fr] gap-3">
                        <Input
                          label="Emoji"
                          tipo="text"
                          value={formCardio.emoji}
                          onChange={(e) => setFormCardio((atual) => ({ ...atual, emoji: e.target.value }))}
                          placeholder="🏃"
                        />
                        <Input
                          label="Nome"
                          tipo="text"
                          value={formCardio.nome}
                          onChange={(e) => setFormCardio((atual) => ({ ...atual, nome: e.target.value }))}
                          placeholder="Ex: Caminhada"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium text-texto-secundario">
                          Métricas
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CHAVES_METRICAS_CARDIO.map((chave) => {
                            const meta = META_METRICA_CARDIO[chave];
                            const selecionada = formCardio.metricas.includes(chave);
                            return (
                              <button
                                key={chave}
                                type="button"
                                role="checkbox"
                                aria-checked={selecionada}
                                onClick={() => alternarMetricaCardio(chave)}
                                className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                  selecionada
                                    ? "border-acento bg-acento/10 text-texto-primario"
                                    : "border-borda-suave bg-fundo text-texto-secundario hover:border-acento"
                                }`}
                              >
                                <span className="min-w-0 truncate">
                                  {meta.rotulo}
                                  {meta.unidade ? ` (${meta.unidade})` : ""}
                                </span>
                                {selecionada && (
                                  <Icone nome="check" tamanho={15} className="ml-auto shrink-0 text-acento" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="-mx-5 -mb-5 mt-5 flex gap-3 border-t border-borda-suave px-5 py-4">
                        <Botao
                          variante="secundario"
                          onClick={fecharFormularioCardio}
                          className="flex-1"
                        >
                          Cancelar
                        </Botao>
                        <Botao
                          variante="primario"
                          onClick={salvarTipoCardio}
                          className="flex-1"
                          disabled={!formCardio.nome.trim()}
                        >
                          {tipoCardioEditando ? "Salvar" : "Criar"}
                        </Botao>
                      </div>
                      </div>
                    </div>
                  )}

                  {tiposCardioFiltrados.length === 0 ? (
                    <SemResultadoBusca termo={buscaExercicios} />
                  ) : (
                    <div className="bg-superficie rounded-2xl border border-borda overflow-hidden">
                      {tiposCardioFiltrados.map((tipo, index) => (
                        <LinhaTipoCardio
                          key={tipo.id}
                          tipo={tipo}
                          estaSendoExcluido={itensExcluindo.cardio.has(tipo.id)}
                          aoEditar={() => abrirFormularioCardio(tipo)}
                          aoExcluir={() => abrirModalExclusao("cardio", tipo.id, tipo.nome)}
                          semBorda={index === tiposCardioFiltrados.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Modal de Criação de Exercício ── */}
      <ModalCriarExercicio
        aberto={modalCriarExercicioAberto}
        aoCriar={handleCriarExercicioCustom}
        aoCancelar={() => setModalCriarExercicioAberto(false)}
      />

      <ModalResumoExercicio
        exercicio={exercicioPadraoSelecionado}
        aoFechar={() => setExercicioPadraoSelecionado(null)}
      />

      {/* ── Modal de Confirmação ── */}
      <ModalConfirmacao
        aberto={modalExclusao.aberto}
        titulo={configModalExclusao?.titulo ?? ""}
        descricao={configModalExclusao?.descricao(modalExclusao.nome) ?? ""}
        textoConfirmar="Excluir"
        textoCancelar="Manter"
        variant="perigo"
        aoConfirmar={handleConfirmarExclusao}
        aoCancelar={fecharModalExclusao}
      />
    </div>
  );

  function abrirModalExclusao(tipo: TipoExclusaoGerenciar, id: string, nome: string) {
    setModalExclusao({ aberto: true, tipo, id, nome });
  }

  function fecharModalExclusao() {
    setModalExclusao(MODAL_EXCLUSAO_FECHADO);
  }

  function marcarItemExcluindo(tipo: TipoExclusaoGerenciar, id: string, excluindo: boolean) {
    setItensExcluindo((prev) => {
      const itensDoTipo = new Set(prev[tipo]);

      if (excluindo) {
        itensDoTipo.add(id);
      } else {
        itensDoTipo.delete(id);
      }

      return { ...prev, [tipo]: itensDoTipo };
    });
  }

  function handleConfirmarExclusao() {
    const { tipo, id } = modalExclusao;
    if (!tipo || !id) return;

    const { remover } = CONFIG_EXCLUSAO_GERENCIAR[tipo];
    marcarItemExcluindo(tipo, id, true);
    fecharModalExclusao();

    setTimeout(() => {
      remover(id);
      marcarItemExcluindo(tipo, id, false);
    }, 200);
  }
}

/* ── Componentes internos ── */

function SkeletonProgramas() {
  return (
    <div className="space-y-4">
      <div className="h-28 rounded-2xl border border-borda bg-superficie-suave animate-pulse" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-borda bg-superficie-suave animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[1, 2].map((grupo) => (
        <div key={grupo} className="space-y-2">
          <div className="h-3 w-24 rounded bg-borda-suave animate-pulse" />
          <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
            {[1, 2].map((linha) => (
              <div
                key={linha}
                className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-borda-suave last:border-b-0"
              >
                <div className="h-10 w-10 shrink-0 rounded-[10px] bg-borda-suave" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-28 rounded bg-borda-suave" />
                  <div className="h-3 w-20 rounded bg-borda-suave" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const OPCOES_ABAS_EXERCICIOS: { id: AbaExercicios; rotulo: string }[] = [
  { id: "musculacao", rotulo: "Musculação" },
  { id: "cardio", rotulo: "Cardio" },
];

interface AbasExerciciosProps {
  aba: AbaExercicios;
  aoAlterar: (aba: AbaExercicios) => void;
  contagemMusculacao: number;
  contagemCardio: number;
}

/** Abas sublinhadas Musculação / Cardio (padrão Hevy/Strong). Tablist acessível
    com roving tabindex e navegação por setas/Home/End — espelha o BigSwitcher. */
function AbasExercicios({ aba, aoAlterar, contagemMusculacao, contagemCardio }: AbasExerciciosProps) {
  const contagens: Record<AbaExercicios, number> = {
    musculacao: contagemMusculacao,
    cardio: contagemCardio,
  };

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, indiceAtual: number) {
    const ultima = OPCOES_ABAS_EXERCICIOS.length - 1;
    let proximo: number | null = null;

    if (event.key === "ArrowRight") proximo = indiceAtual === ultima ? 0 : indiceAtual + 1;
    if (event.key === "ArrowLeft") proximo = indiceAtual === 0 ? ultima : indiceAtual - 1;
    if (event.key === "Home") proximo = 0;
    if (event.key === "End") proximo = ultima;

    if (proximo === null) return;

    event.preventDefault();
    aoAlterar(OPCOES_ABAS_EXERCICIOS[proximo].id);

    const abas = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    requestAnimationFrame(() => abas?.[proximo]?.focus());
  }

  return (
    <div role="tablist" aria-label="Tipo de exercício" className="flex gap-6 border-b border-borda">
      {OPCOES_ABAS_EXERCICIOS.map((opcao, indice) => {
        const selecionado = aba === opcao.id;
        return (
          <button
            key={opcao.id}
            type="button"
            role="tab"
            aria-selected={selecionado}
            tabIndex={selecionado ? 0 : -1}
            onClick={() => aoAlterar(opcao.id)}
            onKeyDown={(event) => handleKeyDown(event, indice)}
            className={`
              relative -mb-px flex min-h-[44px] items-center gap-2 pb-2.5 pt-2
              font-display text-[15px] transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento
              ${
                selecionado
                  ? "font-bold text-texto-primario"
                  : "font-medium text-texto-sutil hover:text-texto-secundario"
              }
            `}
          >
            <span>{opcao.rotulo}</span>
            <span
              className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                selecionado
                  ? "bg-acento text-texto-invertido"
                  : "border border-borda bg-superficie text-texto-secundario"
              }`}
            >
              {contagens[opcao.id]}
            </span>
            {selecionado && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-acento" />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface CampoBuscaProps {
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder: string;
}

/** Campo de busca com lupa à esquerda e botão de limpar. Usa a variante
    canônica "busca" do Input (fonte de verdade do estilo de campo). */
function CampoBusca({ valor, aoAlterar, placeholder }: CampoBuscaProps) {
  return (
    <Input
      tipo="busca"
      value={valor}
      onChange={(e) => aoAlterar(e.target.value)}
      placeholder={placeholder}
      aoLimpar={() => aoAlterar("")}
    />
  );
}

/** Estado vazio de busca (nenhum resultado para o termo). */
function SemResultadoBusca({ termo }: { termo: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-texto-secundario">
        Nenhum resultado para “{termo.trim()}”.
      </p>
    </div>
  );
}

interface HeroProgramaAtivoProps {
  programa: Programa;
  quantidadeFichas: number;
  estaSendoExcluido?: boolean;
  aoEditar: () => void;
  aoDuplicar: () => void;
  aoDesativar: () => void;
  aoExcluir: () => void;
}

function HeroProgramaAtivo({
  programa,
  quantidadeFichas,
  estaSendoExcluido = false,
  aoEditar,
  aoDuplicar,
  aoDesativar,
  aoExcluir,
}: HeroProgramaAtivoProps) {
  return (
    <div
      className={`
        rounded-2xl border-[1.5px] border-acento bg-superficie
        shadow-lg shadow-acento/10 transition-all duration-200
        relative flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4 md:px-5
        ${estaSendoExcluido ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
    >
      <div className="min-w-0 flex-1 pr-9 md:pr-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-acento px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] text-texto-invertido">
            ATIVO
          </span>
          <span className="text-xs text-texto-sutil">
            {quantidadeFichas} {quantidadeFichas === 1 ? "ficha" : "fichas"}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold leading-tight text-texto-primario">
          {programa.nome}
        </h3>
        {programa.descricao && (
          <p className="mt-0.5 text-sm text-texto-secundario">{programa.descricao}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:shrink-0">
        <Botao
          variante="primario"
          icone={<Icone nome="editar" tamanho={16} />}
          onClick={aoEditar}
          className="flex-1 md:flex-none"
        >
          Editar programa
        </Botao>
        <div className="absolute right-2 top-2 md:static">
          <MenuAcoes
            rotulo={`Ações de ${programa.nome}`}
            itens={[
              { label: "Duplicar", icone: "copiar", onClick: aoDuplicar },
              { label: "Desativar", icone: "fechar", onClick: aoDesativar },
              { label: "Excluir", icone: "lixeira", onClick: aoExcluir, perigo: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

interface LinhaProgramaTrocarProps {
  programa: Programa;
  quantidadeFichas: number;
  estaSendoExcluido?: boolean;
  aoAtivar: () => void;
  aoEditar: () => void;
  aoDuplicar: () => void;
  aoExcluir: () => void;
}

function LinhaProgramaTrocar({
  programa,
  quantidadeFichas,
  estaSendoExcluido = false,
  aoAtivar,
  aoEditar,
  aoDuplicar,
  aoExcluir,
}: LinhaProgramaTrocarProps) {
  const meta = `${quantidadeFichas} ${quantidadeFichas === 1 ? "ficha" : "fichas"}${
    programa.descricao ? ` · ${programa.descricao}` : ""
  }`;
  return (
    <div
      className={`
        flex items-center gap-2 rounded-2xl border border-borda bg-superficie px-4 py-3
        transition-all duration-200 hover:bg-superficie-suave
        ${estaSendoExcluido ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-semibold text-texto-primario">
          {programa.nome}
        </p>
        <p className="truncate text-xs text-texto-sutil">{meta}</p>
      </div>
      <button
        type="button"
        onClick={aoAtivar}
        className="shrink-0 rounded-full border border-borda-forte px-3.5 py-1.5 text-sm font-semibold text-texto-primario transition-colors hover:bg-superficie-hover"
      >
        Ativar
      </button>
      <MenuAcoes
        rotulo={`Ações de ${programa.nome}`}
        itens={[
          { label: "Editar", icone: "editar", onClick: aoEditar },
          { label: "Duplicar", icone: "copiar", onClick: aoDuplicar },
          { label: "Excluir", icone: "lixeira", onClick: aoExcluir, perigo: true },
        ]}
      />
    </div>
  );
}

interface NavBibliotecasProps {
  quantidadeFichas: number;
  quantidadeExercicios: number;
  aoAbrirFichas: () => void;
  aoAbrirExercicios: () => void;
}

/** Atalhos para as bibliotecas (Fichas / Exercícios). Só mobile/tablet —
    no desktop essas entradas moram na barra lateral. */
function NavBibliotecas({
  quantidadeFichas,
  quantidadeExercicios,
  aoAbrirFichas,
  aoAbrirExercicios,
}: NavBibliotecasProps) {
  const itens = [
    {
      icone: "halter",
      nome: "Fichas",
      meta: `${quantidadeFichas} ${quantidadeFichas === 1 ? "ficha" : "fichas"}`,
      onClick: aoAbrirFichas,
    },
    {
      icone: "alvo",
      nome: "Exercícios & cardio",
      meta:
        quantidadeExercicios > 0
          ? `${quantidadeExercicios} ${quantidadeExercicios === 1 ? "personalizado" : "personalizados"}`
          : "Sua biblioteca de movimentos",
      onClick: aoAbrirExercicios,
    },
  ];
  return (
    <section className="space-y-2.5 pt-4 lg:hidden">
      <span className="block px-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-texto-sutil">
        Bibliotecas
      </span>
      <div className="overflow-hidden rounded-2xl border border-borda bg-superficie">
        {itens.map((it, i) => (
          <button
            key={it.nome}
            type="button"
            onClick={it.onClick}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-superficie-suave ${
              i > 0 ? "border-t border-borda-suave" : ""
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-texto-primario">
              <Icone nome={it.icone} tamanho={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold text-texto-primario">{it.nome}</p>
              <p className="truncate text-xs text-texto-sutil">{it.meta}</p>
            </div>
            <Icone nome="setaDireita" tamanho={18} className="shrink-0 text-texto-sutil" />
          </button>
        ))}
      </div>
    </section>
  );
}

interface BotaoExcluirItemProps {
  nome: string;
  aoExcluir: () => void;
}

function BotaoExcluirItem({ nome, aoExcluir }: BotaoExcluirItemProps) {
  return (
    <button
      type="button"
      onClick={aoExcluir}
      aria-label={`Excluir ${nome}`}
      className="p-2 text-texto-sutil hover:text-perigo hover:bg-perigo/10 rounded-lg transition-colors shrink-0"
    >
      <Icone nome="lixeira" tamanho={18} />
    </button>
  );
}

// Exercícios não exibem editar (só possuem nome e grupo). Os padrão do app
// ganham selo "padrão" e não podem ser excluídos; só os customizados têm lixeira.
interface LinhaExercicioCustomProps {
  exercicio: Exercicio;
  ehPadrao?: boolean;
  estaSendoExcluido?: boolean;
  aoExcluir?: () => void;
  aoVerResumo?: () => void;
  semBorda?: boolean;
}

function LinhaExercicioCustom({
  exercicio,
  ehPadrao = false,
  estaSendoExcluido = false,
  aoExcluir,
  aoVerResumo,
  semBorda,
}: LinhaExercicioCustomProps) {
  return (
    <div
      role={aoVerResumo ? "button" : undefined}
      tabIndex={aoVerResumo ? 0 : undefined}
      onClick={aoVerResumo}
      onKeyDown={(evento) => {
        if (aoVerResumo && (evento.key === "Enter" || evento.key === " ")) {
          evento.preventDefault();
          aoVerResumo();
        }
      }}
      className={`
        flex items-center gap-4 px-5 py-4 hover:bg-superficie-suave
        transition-all duration-200
        ${aoVerResumo ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-acento" : ""}
        ${estaSendoExcluido ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        ${semBorda ? "" : "border-b border-borda-suave"}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-texto-primario truncate">
            {exercicio.nome}
          </p>
          {ehPadrao && (
            <span className="shrink-0 rounded-full bg-superficie-suave px-2 py-0.5 text-[10px] font-medium text-texto-sutil">
              padrão
            </span>
          )}
        </div>
      </div>
      <Icone nome="setaDireita" tamanho={18} className="shrink-0 text-texto-sutil" />
      {!ehPadrao && aoExcluir && <BotaoExcluirItem nome={exercicio.nome} aoExcluir={aoExcluir} />}
    </div>
  );
}

function ModalResumoExercicio({
  exercicio,
  aoFechar,
}: {
  exercicio: Exercicio | null;
  aoFechar: () => void;
}) {
  if (!exercicio) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resumo-exercicio-title"
    >
      <button
        type="button"
        aria-label="Fechar resumo do exercício"
        className="absolute inset-0 h-full w-full bg-black/25 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={aoFechar}
      />
      <div className="relative w-full rounded-t-3xl border border-borda bg-superficie shadow-xl animate-in slide-in-from-bottom-4 duration-200 sm:max-w-[400px] sm:rounded-3xl sm:zoom-in-95">
        <div className="flex items-start justify-between gap-4 border-b border-borda-suave px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-texto-primario">
              <Icone nome="halter" tamanho={20} />
            </span>
            <div className="min-w-0">
              <h2 id="resumo-exercicio-title" className="truncate text-lg font-semibold font-display text-texto-primario">
                {exercicio.nome}
              </h2>
              <span className="text-xs font-medium text-texto-sutil">Mapa muscular do exercício</span>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="-mr-2 rounded-lg p-2 text-texto-secundario transition-colors hover:bg-superficie-suave hover:text-texto-primario"
            aria-label="Fechar"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <MapaMuscular ativacoes={ativacoesDoExercicio(exercicio)} />
          <div className="rounded-xl border border-borda-suave bg-superficie-suave p-4">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-texto-sutil">
              Grupo muscular principal
            </p>
            <p className="mt-1 text-base font-semibold text-texto-primario">
              {exercicio.grupoMuscular}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-texto-secundario">
            Movimento de musculação do catálogo do app com foco principal em {exercicio.grupoMuscular.toLowerCase()}.
            Você pode adicioná-lo a uma ficha e configurar séries, repetições, carga e descanso conforme o seu treino.
          </p>
        </div>

        <div className="border-t border-borda-suave px-5 py-4 pb-[max(var(--safe-bottom),16px)] sm:pb-4">
          <Botao variante="primario" onClick={aoFechar} className="w-full">
            Fechar
          </Botao>
        </div>
      </div>
    </div>
  );
}

interface LinhaTipoCardioProps {
  tipo: TipoCardioDef;
  estaSendoExcluido?: boolean;
  aoEditar: () => void;
  aoExcluir: () => void;
  semBorda?: boolean;
}

function LinhaTipoCardio({
  tipo,
  estaSendoExcluido = false,
  aoEditar,
  aoExcluir,
  semBorda,
}: LinhaTipoCardioProps) {
  const textoMetricas = tipo.metricas
    .map((metrica) => META_METRICA_CARDIO[metrica].rotulo)
    .join(", ");

  return (
    <div
      className={`
        flex items-center gap-3 px-5 py-4 hover:bg-superficie-suave
        transition-all duration-200
        ${estaSendoExcluido ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        ${semBorda ? "" : "border-b border-borda-suave"}
      `}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-xl">
        {tipo.emoji || "🏃"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-texto-primario">
            {tipo.nome}
          </p>
          {tipo.builtin && (
            <span className="rounded-full bg-superficie-suave px-2 py-0.5 text-[10px] font-medium text-texto-sutil">
              padrão
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-texto-sutil">
          {textoMetricas}
        </p>
      </div>
      <button
        type="button"
        onClick={aoEditar}
        className="px-3 py-2 text-sm font-medium text-texto-primario hover:bg-superficie-suave rounded-lg transition-colors"
      >
        {tipo.builtin ? "Customizar" : "Editar"}
      </button>
      {!tipo.builtin && <BotaoExcluirItem nome={tipo.nome} aoExcluir={aoExcluir} />}
    </div>
  );
}

interface GrupoFichasProps {
  titulo: string;
  fichas: Ficha[];
  /** Marca o programa ativo com o mesmo ponto usado no herói de Programas. */
  ativo?: boolean;
  /** Borda tracejada — sinaliza o grupo das fichas sem programa. */
  tracejado?: boolean;
  itensExcluindo: Set<string>;
  aoEditar: (ficha: Ficha) => void;
  aoExcluir: (ficha: Ficha) => void;
}

/** Fichas de um programa numa superfície agrupada — mesma anatomia dos
    grupos musculares da aba Exercícios (rótulo + contagem + linhas). */
function GrupoFichas({
  titulo,
  fichas,
  ativo = false,
  tracejado = false,
  itensExcluindo,
  aoEditar,
  aoExcluir,
}: GrupoFichasProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <div className="flex items-center gap-1.5">
          {ativo && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-acento" />}
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">
            {titulo}
          </h3>
        </div>
        <span className="text-xs tabular-nums text-texto-sutil/60">{fichas.length}</span>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border ${
          tracejado ? "border-dashed border-borda" : "border-borda bg-superficie"
        }`}
      >
        {fichas.map((ficha, index) => (
          <LinhaFicha
            key={ficha.id}
            ficha={ficha}
            estaSendoExcluida={itensExcluindo.has(ficha.id)}
            aoEditar={() => aoEditar(ficha)}
            aoExcluir={() => aoExcluir(ficha)}
            semBorda={index === fichas.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

interface LinhaFichaProps {
  ficha: Ficha;
  estaSendoExcluida?: boolean;
  aoEditar: () => void;
  aoExcluir: () => void;
  semBorda?: boolean;
}

/** Linha da biblioteca de fichas. A linha inteira abre o editor (o job da
    tela); o kebab carrega as mesmas ações, como em LinhaProgramaTrocar. */
function LinhaFicha({ ficha, estaSendoExcluida = false, aoEditar, aoExcluir, semBorda }: LinhaFichaProps) {
  const quantidadeExercicios = exerciciosDaFicha(ficha).length;
  const quantidadeCardio = cardioDaFicha(ficha).length;
  const meta = [
    `${quantidadeExercicios} ${quantidadeExercicios === 1 ? "exercício" : "exercícios"}`,
    ...(quantidadeCardio > 0
      ? [`${quantidadeCardio} ${quantidadeCardio === 1 ? "cardio" : "cardios"}`]
      : []),
  ].join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Editar ${ficha.nome}`}
      onClick={aoEditar}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          aoEditar();
        }
      }}
      className={`
        flex cursor-pointer items-center gap-3 px-4 py-3
        transition-all duration-200 hover:bg-superficie-suave
        focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-acento
        ${estaSendoExcluida ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        ${semBorda ? "" : "border-b border-borda-suave"}
      `}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-acento-suave text-xl">
        {ficha.emoji || "💪"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-semibold text-texto-primario">
          {ficha.nome}
        </p>
        <p className="truncate text-xs text-texto-sutil">{meta}</p>
      </div>
      {/* O menu vive dentro de uma linha clicável — o clique não pode abrir o editor. */}
      <div onClick={(evento) => evento.stopPropagation()}>
        <MenuAcoes
          rotulo={`Ações de ${ficha.nome}`}
          itens={[
            { label: "Editar", icone: "editar", onClick: aoEditar },
            { label: "Excluir", icone: "lixeira", onClick: aoExcluir, perigo: true },
          ]}
        />
      </div>
    </div>
  );
}
