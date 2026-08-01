/* ═══════════════════════════════════════════
   Estado do Pezzo — Gerenciador de Dados de Treino
   ═══════════════════════════════════════════ */

import type {
  Programa,
  Ficha,
  ItemFicha,
  RegistroTreino,
  Exercicio,
  ExercicioFicha,
  EntradaCardio,
  TipoCardioDef,
} from "@/domain/tipos";
import { CATALOGO_CARDIO_BUILTIN } from "@/domain/tipos";
import { exerciciosDaFicha, itensDeFormatoAntigo } from "@/domain/ficha";
import { STORAGE_KEYS } from "@/constants";
import { exerciciosPadrao } from "@/infrastructure/repo/mock/exercicio-mock.repo";
import { appModule } from "@/interface/configuration/module/app.module";

/** Dados portateis do usuario no snapshot */
export interface DadosTreinoPortateis {
  programas: Programa[];
  fichas: Ficha[];
  historico: RegistroTreino[];
  exerciciosCustom: Exercicio[];
  cardioCustom: TipoCardioDef[];
}

/** Interface dos dados persistidos */
interface DadosTreino extends DadosTreinoPortateis {
  atualizadoEm: string;
}

/** Estado gerenciado pelo Pezzo */
type PezzoState = DadosTreino;

/** Ficha como pode existir em dados salvos: formato novo (itens) ou
    antigo (modalidade + exercicios + cardio separados). */
type FichaPersistida = Omit<Ficha, "itens"> & {
  itens?: ItemFicha[];
  modalidade?: string;
  exercicios?: ExercicioFicha[];
  cardio?: EntradaCardio[];
};

type ProgramaPersistido = Omit<Programa, "fichaIds" | "ativo"> & {
  fichaIds?: string[];
  ativo?: boolean;
};

function normalizarFicha(fichaPersistida: FichaPersistida): Ficha {
  const { modalidade: _modalidade, exercicios, cardio, itens, ...ficha } = fichaPersistida;

  return {
    ...ficha,
    icone: ficha.icone ?? "halter",
    itens: Array.isArray(itens)
      ? itens
      : itensDeFormatoAntigo(
          Array.isArray(exercicios) ? exercicios : [],
          Array.isArray(cardio) ? cardio : []
        ),
  };
}

/** Duplica itens da ficha gerando ids novos para as entradas de cardio */
function copiarItens(itens: ItemFicha[]): ItemFicha[] {
  return itens.map((item) =>
    item.tipo === "cardio"
      ? { tipo: "cardio", cardio: { ...item.cardio, id: crypto.randomUUID() } }
      : { tipo: "exercicio", exercicio: { ...item.exercicio } }
  );
}

function normalizarPrograma(programa: ProgramaPersistido): Programa {
  return {
    ...programa,
    fichaIds: Array.isArray(programa.fichaIds) ? programa.fichaIds : [],
    ativo: Boolean(programa.ativo),
  };
}

/** Gerenciador de estado global para dados de treino */
export class PezzoStateManager {
  private static instancia: PezzoStateManager;
  private estado: PezzoState;
  private listeners: Set<() => void>;
  private inicializado: boolean;

  private constructor() {
    this.listeners = new Set();
    this.estado = this.criarEstadoInicial();
    this.inicializado = false;
  }

  /** Obter instância singleton */
  static obterInstancia(): PezzoStateManager {
    if (!PezzoStateManager.instancia) {
      PezzoStateManager.instancia = new PezzoStateManager();
    }
    return PezzoStateManager.instancia;
  }

  /** Inscrever para mudanças de estado */
  inscrever(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async inicializar(): Promise<void> {
    if (this.inicializado) return;

    this.estado = (await this.carregarDadosSalvos()) || this.criarEstadoInicial();
    this.inicializado = true;
    this.notificar();
  }

  estaInicializado(): boolean {
    return this.inicializado;
  }

  /** Notificar todos os listeners */
  private notificar(): void {
    this.listeners.forEach((cb) => cb());
  }

  /** Obter todos os programas */
  getProgramas(): Programa[] {
    return [...this.estado.programas];
  }

  /** Obter todas as fichas */
  getFichas(): Ficha[] {
    return [...this.estado.fichas];
  }

  /** Obter todo o histórico */
  getHistorico(): RegistroTreino[] {
    return [...this.estado.historico];
  }

  /** Obter exercícios customizados */
  getExerciciosCustom(): Exercicio[] {
    return [...this.estado.exerciciosCustom];
  }

  /** Obter todos os exercícios (padrão + customizados) */
  getAtualizadoEm(): string {
    return this.estado.atualizadoEm;
  }

  getDadosPortateis(): DadosTreinoPortateis {
    return {
      programas: [...this.estado.programas],
      fichas: [...this.estado.fichas],
      historico: [...this.estado.historico],
      exerciciosCustom: [...this.estado.exerciciosCustom],
      cardioCustom: [...this.estado.cardioCustom],
    };
  }

  substituirDados(dados: DadosTreinoPortateis, atualizadoEm: string): void {
    this.estado = {
      programas: (dados.programas || []).map((programa) => normalizarPrograma(programa)),
      fichas: (dados.fichas || []).map((ficha) => normalizarFicha(ficha)),
      historico: [...(dados.historico || [])],
      exerciciosCustom: [...(dados.exerciciosCustom || [])],
      cardioCustom: [...(dados.cardioCustom || [])],
      atualizadoEm,
    };
    void this.persistirDados();
    this.notificar();
  }

  getTodosExercicios(): Exercicio[] {
    return [...exerciciosPadrao, ...this.estado.exerciciosCustom];
  }

  getCardioCustom(): TipoCardioDef[] {
    return [...this.estado.cardioCustom];
  }

  getTiposCardio(): TipoCardioDef[] {
    const customPorId = new Map(this.estado.cardioCustom.map((tipo) => [tipo.id, tipo]));
    const builtins = CATALOGO_CARDIO_BUILTIN.map((tipo) => customPorId.get(tipo.id) ?? tipo);
    const customNovos = this.estado.cardioCustom.filter(
      (tipo) => !CATALOGO_CARDIO_BUILTIN.some((builtin) => builtin.id === tipo.id)
    );

    return [...builtins, ...customNovos];
  }

  /** Obter programa ativo */
  getProgramaAtivo(): Programa | null {
    return (
      this.estado.programas.find((p) => p.ativo) || null
    );
  }

  /** Obter fichas de um programa */
  getFichasDoPrograma(programaId: string): Ficha[] {
    const programa = this.estado.programas.find((p) => p.id === programaId);
    if (!programa) return [];

    return this.estado.fichas.filter((f) =>
      programa.fichaIds.includes(f.id)
    );
  }

  /** Obter programas de uma ficha (múltiplos) */
  getProgramasDaFicha(fichaId: string): Programa[] {
    return this.estado.programas.filter((p) => p.fichaIds.includes(fichaId));
  }

  /** Obter programa por ID */
  getProgramaPorId(id: string): Programa | null {
    return this.estado.programas.find((p) => p.id === id) || null;
  }

  /** Obter ficha por ID */
  getFichaPorId(id: string): Ficha | null {
    return this.estado.fichas.find((f) => f.id === id) || null;
  }

  /** Obter exercício por ID */
  getExercicioPorId(id: string): Exercicio | null {
    return this.getTodosExercicios().find((e) => e.id === id) || null;
  }

  /** Obter histórico de uma ficha */
  getHistoricoDaFicha(fichaId: string): RegistroTreino[] {
    return this.estado.historico.filter((h) => h.fichaId === fichaId);
  }

  /** Adicionar programa */
  adicionarPrograma(
    programa: Omit<Programa, "id">
  ): Programa {
    const novo: Programa = {
      ...programa,
      id: crypto.randomUUID(),
    };

    // Se estiver marcado como ativo, desativar os demais
    if (novo.ativo) {
      this.estado.programas.forEach((p) => (p.ativo = false));
    }

    this.estado.programas.push(novo);
    void this.salvarDados();
    this.notificar();
    return novo;
  }

  /** Atualizar programa */
  atualizarPrograma(
    id: string,
    atualizacoes: Partial<Omit<Programa, "id">>
  ): Programa | null {
    const index = this.estado.programas.findIndex((p) => p.id === id);
    if (index === -1) return null;

    // Se estiver ativando, desativar os demais
    if (atualizacoes.ativo) {
      this.estado.programas.forEach((p) => (p.ativo = false));
    }

    this.estado.programas[index] = {
      ...this.estado.programas[index],
      ...atualizacoes,
    };
    void this.salvarDados();
    this.notificar();
    return this.estado.programas[index];
  }

  /** Remover programa (não remove fichas, apenas desvincula) */
  removerPrograma(id: string): boolean {
    const index = this.estado.programas.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const programa = this.estado.programas[index];

    // Desvincular fichas do programa (fichas podem existir sem programas)
    programa.fichaIds = [];

    // Remover o programa
    this.estado.programas.splice(index, 1);

    void this.salvarDados();
    this.notificar();
    return true;
  }

  /** Vincular ficha a um programa */
  vincularFichaAoPrograma(fichaId: string, programaId: string): boolean {
    const ficha = this.estado.fichas.find((f) => f.id === fichaId);
    if (!ficha) {
      console.error(`Ficha com ID ${fichaId} não encontrada`);
      return false;
    }

    const programa = this.estado.programas.find((p) => p.id === programaId);
    if (!programa) {
      console.error(`Programa com ID ${programaId} não encontrado`);
      return false;
    }

    // Verificar se já está vinculada
    if (programa.fichaIds.includes(fichaId)) {
      return false; // Já está vinculada
    }

    programa.fichaIds.push(fichaId);
    void this.salvarDados();
    this.notificar();
    return true;
  }

  /** Desvincular ficha de um programa */
  desvincularFichaDoPrograma(fichaId: string, programaId: string): boolean {
    const programa = this.estado.programas.find((p) => p.id === programaId);
    if (!programa) return false;

    const index = programa.fichaIds.indexOf(fichaId);
    if (index === -1) return false;

    programa.fichaIds.splice(index, 1);
    void this.salvarDados();
    this.notificar();
    return true;
  }

  /** Obter fichas não vinculadas a nenhum programa */
  getFichasOrfas(): Ficha[] {
    const fichasVinculadas = new Set(
      this.estado.programas.flatMap((p) => p.fichaIds)
    );

    return this.estado.fichas.filter((f) => !fichasVinculadas.has(f.id));
  }

  /** Adicionar ficha (opcionalmente vinculada a um programa) */
  adicionarFicha(
    ficha: Omit<Ficha, "id">,
    programaId?: string
  ): Ficha {
    const nova: Ficha = {
      ...ficha,
      id: crypto.randomUUID(),
    };

    this.estado.fichas.push(nova);

    // Se fornecido, vincula ao programa
    if (programaId) {
      this.vincularFichaAoPrograma(nova.id, programaId);
    }

    void this.salvarDados();
    this.notificar();
    return nova;
  }

  /** Atualizar ficha */
  atualizarFicha(
    id: string,
    atualizacoes: Partial<Omit<Ficha, "id">>
  ): Ficha | null {
    const index = this.estado.fichas.findIndex((f) => f.id === id);
    if (index === -1) return null;

    this.estado.fichas[index] = {
      ...this.estado.fichas[index],
      ...atualizacoes,
    };
    void this.salvarDados();
    this.notificar();
    return this.estado.fichas[index];
  }

  /** Remover ficha (desvincula de todos os programas e remove) */
  removerFicha(id: string): boolean {
    const index = this.estado.fichas.findIndex((f) => f.id === id);
    if (index === -1) return false;

    this.estado.fichas.splice(index, 1);

    // Remover referências em programas
    this.estado.programas.forEach((p) => {
      p.fichaIds = p.fichaIds.filter((fid) => fid !== id);
    });

    // Remover registros do histórico
    this.estado.historico = this.estado.historico.filter(
      (h) => h.fichaId !== id
    );

    void this.salvarDados();
    this.notificar();
    return true;
  }

  /** Adicionar exercício customizado */
  adicionarExercicioCustom(
    exercicio: Omit<Exercicio, "id">
  ): Exercicio {
    const novo: Exercicio = {
      ...exercicio,
      id: `custom-${crypto.randomUUID()}`,
    };

    this.estado.exerciciosCustom.push(novo);
    void this.salvarDados();
    this.notificar();
    return novo;
  }

  /** Remover exercício customizado */
  removerExercicioCustom(id: string): boolean {
    const index = this.estado.exerciciosCustom.findIndex((e) => e.id === id);
    if (index === -1) return false;

    this.estado.exerciciosCustom.splice(index, 1);
    void this.salvarDados();
    this.notificar();
    return true;
  }

  adicionarCardioCustom(
    tipo: Omit<TipoCardioDef, "id" | "builtin">
  ): TipoCardioDef {
    const novo: TipoCardioDef = {
      ...tipo,
      id: `cardio-${crypto.randomUUID()}`,
      builtin: false,
    };

    this.estado.cardioCustom.push(novo);
    void this.salvarDados();
    this.notificar();
    return novo;
  }

  atualizarCardioCustom(
    id: string,
    atualizacoes: Partial<Omit<TipoCardioDef, "id">>
  ): TipoCardioDef | null {
    const existente = this.estado.cardioCustom.findIndex((tipo) => tipo.id === id);
    const builtin = CATALOGO_CARDIO_BUILTIN.find((tipo) => tipo.id === id);

    if (existente === -1 && !builtin) return null;

    if (existente === -1 && builtin) {
      const customizado: TipoCardioDef = {
        ...builtin,
        ...atualizacoes,
        id: builtin.id,
        builtin: true,
      };
      this.estado.cardioCustom.push(customizado);
      void this.salvarDados();
      this.notificar();
      return customizado;
    }

    this.estado.cardioCustom[existente] = {
      ...this.estado.cardioCustom[existente],
      ...atualizacoes,
      id,
    };
    void this.salvarDados();
    this.notificar();
    return this.estado.cardioCustom[existente];
  }

  removerCardioCustom(id: string): boolean {
    const index = this.estado.cardioCustom.findIndex((tipo) => tipo.id === id);
    if (index === -1 || this.estado.cardioCustom[index].builtin) return false;

    this.estado.cardioCustom.splice(index, 1);
    void this.salvarDados();
    this.notificar();
    return true;
  }

  /** Adicionar registro de treino */
  adicionarTreino(
    registro: Omit<RegistroTreino, "id">
  ): RegistroTreino {
    const novo: RegistroTreino = {
      ...registro,
      id: crypto.randomUUID(),
    };

    this.estado.historico.unshift(novo);
    void this.salvarDados();
    this.notificar();
    return novo;
  }

  /** Copiar ficha (sem vincular automaticamente a programa) */
  copiarFicha(fichaId: string): Ficha | null {
    const ficha = this.getFichaPorId(fichaId);
    if (!ficha) return null;

    // Copiar sem vincular a programa (usuário pode vincular depois)
    const copia = this.adicionarFicha({
      nome: `${ficha.nome} (cópia)`,
      descricao: ficha.descricao,
      icone: ficha.icone,
      emoji: ficha.emoji,
      itens: copiarItens(ficha.itens),
    });

    return copia;
  }

  /** Copiar programa */
  copiarPrograma(programaId: string): Programa | null {
    const programa = this.getProgramaPorId(programaId);
    if (!programa) return null;

    // Criar o programa novo sem fichas (serão copiadas depois)
    const copia = this.adicionarPrograma({
      nome: `${programa.nome} (cópia)`,
      descricao: programa.descricao,
      fichaIds: [], // Será preenchido com as cópias das fichas
      ativo: false,
    });

    // Copiar cada ficha do programa original
    const fichasOriginais = programa.fichaIds.map((id) =>
      this.getFichaPorId(id)
    );

    fichasOriginais.forEach((fichaOriginal) => {
      if (fichaOriginal) {
        const copiaFicha = this.adicionarFicha(
          {
            nome: fichaOriginal.nome,
            descricao: fichaOriginal.descricao,
            icone: fichaOriginal.icone,
            emoji: fichaOriginal.emoji,
            itens: copiarItens(fichaOriginal.itens),
          },
          copia.id // Adicionar ao programa copiado
        );

        // A adicionarFicha já adiciona ao programa, mas vamos garantir
        // que fichaIds está correto (caso a implementação mude)
        if (!copia.fichaIds.includes(copiaFicha.id)) {
          copia.fichaIds.push(copiaFicha.id);
        }
      }
    });

    // Salvar novamente para garantir consistência
    void this.salvarDados();

    return copia;
  }

  /** Gerar nome único para ficha */
  gerarNomeFicha(): string {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fichasExistentes = this.estado.fichas.map((f) =>
      f.nome.replace("Treino ", "")
    );

    for (let i = 0; i < letras.length; i++) {
      const nome = `Treino ${letras[i]}`;
      if (!fichasExistentes.includes(letras[i])) {
        return nome;
      }
    }

    // Se todas as letras foram usadas, adicionar número
    return `Treino ${fichasExistentes.length + 1}`;
  }

  /** Gerar nome único para programa */
  gerarNomePrograma(): string {
    const nomesExistentes = new Set(
      this.estado.programas.map((programa) => programa.nome.trim().toLocaleLowerCase())
    );

    let numero = 1;
    while (nomesExistentes.has(`programa ${numero}`)) {
      numero += 1;
    }

    return `Programa ${numero}`;
  }

  /** Obter grupos musculares usados nas fichas */
  getGruposMusculares(): string[] {
    const grupos = new Set<string>();

    this.estado.fichas.forEach((ficha) => {
      exerciciosDaFicha(ficha).forEach((exFicha) => {
        const exercicio = this.getExercicioPorId(exFicha.exercicioId);
        if (exercicio) {
          grupos.add(exercicio.grupoMuscular);
        }
      });
    });

    return Array.from(grupos).sort();
  }

  /** Obter próximo número de treino para nomeação automática */
  proximoNumeroTreino(): number {
    return this.estado.fichas.length + 1;
  }

  /** Carregar dados salvos do localStorage */
  private async carregarDadosSalvos(): Promise<PezzoState | null> {
    try {
      const salvo = await appModule.armazenamento.obter(STORAGE_KEYS.DADOS_TREINO);
      if (salvo) {
        const dados: DadosTreino = JSON.parse(salvo);

        // Não removemos mais fichas órfãs - elas podem existir independentemente
        return {
          programas: (dados.programas || []).map((programa) =>
            normalizarPrograma(programa as ProgramaPersistido)
          ),
          fichas: (dados.fichas || []).map((ficha) =>
            normalizarFicha(ficha as FichaPersistida)
          ),
          historico: dados.historico || [],
          exerciciosCustom: dados.exerciciosCustom || [],
          cardioCustom: dados.cardioCustom || [],
          atualizadoEm:
            typeof dados.atualizadoEm === "string"
              ? dados.atualizadoEm
              : new Date().toISOString(),
        };
      }
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
    }
    return null;
  }

  /** Criar estado inicial vazio */
  private criarEstadoInicial(): PezzoState {
    return {
      programas: [],
      fichas: [],
      historico: [],
      exerciciosCustom: [],
      cardioCustom: [],
      atualizadoEm: new Date().toISOString(),
    };
  }

  /** Salvar dados no localStorage */
  private async salvarDados(): Promise<void> {
    this.estado.atualizadoEm = new Date().toISOString();
    await this.persistirDados();
  }

  private async persistirDados(): Promise<void> {
    try {
      const dados: DadosTreino = {
        programas: this.estado.programas,
        fichas: this.estado.fichas,
        historico: this.estado.historico,
        exerciciosCustom: this.estado.exerciciosCustom,
        cardioCustom: this.estado.cardioCustom,
        atualizadoEm: this.estado.atualizadoEm,
      };
      await appModule.armazenamento.definir(STORAGE_KEYS.DADOS_TREINO, JSON.stringify(dados));
    } catch (erro) {
      console.error("Erro ao salvar dados:", erro);
    }
  }

  /** Limpar todos os dados (útil para testes) */
  limparDados(): void {
    this.estado = this.criarEstadoInicial();
    void this.salvarDados();
    this.notificar();
  }
}

/** Instância global do gerenciador de estado */
export const pezzoState = PezzoStateManager.obterInstancia();
