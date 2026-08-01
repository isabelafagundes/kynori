import { beforeEach, describe, expect, it, vi } from "vitest";
import { pezzoState } from "@/application/state/pezzo.state";
import { cardioDaFicha, exerciciosDaFicha } from "@/domain/ficha";
import type {
  EntradaCardio,
  ExercicioFicha,
  Ficha,
  ItemFicha,
  Programa,
} from "@/domain/tipos";

const dadosVazios = {
  programas: [],
  fichas: [],
  historico: [],
  exerciciosCustom: [],
  cardioCustom: [],
};

/* ── Factories de teste ───────────────────────────────── */

function novoExercicioFicha(
  parcial: Partial<ExercicioFicha> = {}
): ExercicioFicha {
  return {
    exercicioId: "ex-1",
    series: 3,
    repeticoes: 10,
    usaCarga: true,
    descansoSegundos: 60,
    ...parcial,
  };
}

function novaEntradaCardio(parcial: Partial<EntradaCardio> = {}): EntradaCardio {
  return {
    id: "cardio-1",
    tipo: "Esteira",
    duracaoMinutos: 20,
    nota: "",
    ...parcial,
  };
}

function itemExercicio(parcial: Partial<ExercicioFicha> = {}): ItemFicha {
  return { tipo: "exercicio", exercicio: novoExercicioFicha(parcial) };
}

function itemCardio(parcial: Partial<EntradaCardio> = {}): ItemFicha {
  return { tipo: "cardio", cardio: novaEntradaCardio(parcial) };
}

/** Cria os dados de uma ficha (sem id — para passar ao adicionarFicha) */
function dadosFicha(parcial: Partial<Omit<Ficha, "id">> = {}): Omit<Ficha, "id"> {
  return {
    nome: "Treino A",
    descricao: "",
    icone: "halter",
    itens: [itemExercicio()],
    ...parcial,
  };
}

/** Cria os dados de um programa (sem id — para passar ao adicionarPrograma) */
function dadosPrograma(
  parcial: Partial<Omit<Programa, "id">> = {}
): Omit<Programa, "id"> {
  return {
    nome: "Hipertrofia",
    descricao: "",
    fichaIds: [],
    ativo: false,
    ...parcial,
  };
}

describe("pezzoState", () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    pezzoState.substituirDados(dadosVazios, "2024-01-01T00:00:00.000Z");
  });

  it("substituirDados aplica dados e preserva atualizadoEm informado", () => {
    const atualizadoEm = "2024-03-04T05:06:07.000Z";

    pezzoState.substituirDados(
      {
        programas: [
          {
            id: "programa-1",
            nome: "Hipertrofia",
            descricao: "",
            fichaIds: [],
            ativo: true,
          },
        ],
        fichas: [],
        historico: [],
        exerciciosCustom: [],
        cardioCustom: [],
      },
      atualizadoEm
    );

    expect(pezzoState.getProgramas()).toHaveLength(1);
    expect(pezzoState.getAtualizadoEm()).toBe(atualizadoEm);
  });

  it("converte fichas do formato antigo (exercicios + cardio) para itens ao substituir dados", () => {
    pezzoState.substituirDados(
      {
        programas: [],
        fichas: [
          {
            id: "ficha-antiga",
            nome: "Treino antigo",
            descricao: "",
            icone: "halter",
            modalidade: "ambos",
            exercicios: [novoExercicioFicha({ exercicioId: "ex-A" })],
            cardio: [novaEntradaCardio({ id: "cardio-A" })],
          },
        ] as unknown as Ficha[],
        historico: [],
        exerciciosCustom: [],
        cardioCustom: [],
      },
      "2024-03-04T05:06:07.000Z"
    );

    const ficha = pezzoState.getFichaPorId("ficha-antiga")!;
    // Exercícios primeiro, cardio no fim — espelha o fluxo antigo de execução
    expect(ficha.itens.map((item) => item.tipo)).toEqual(["exercicio", "cardio"]);
    expect(exerciciosDaFicha(ficha).map((e) => e.exercicioId)).toEqual(["ex-A"]);
    expect(cardioDaFicha(ficha).map((c) => c.id)).toEqual(["cardio-A"]);
    expect(ficha).not.toHaveProperty("modalidade");
    expect(ficha).not.toHaveProperty("exercicios");
  });

  it("normaliza arrays ausentes em dados antigos ao substituir dados", () => {
    pezzoState.substituirDados(
      {
        programas: [
          {
            id: "programa-legado",
            nome: "Legado",
            descricao: "",
            ativo: true,
          },
        ] as unknown as Programa[],
        fichas: [
          {
            id: "ficha-legada",
            nome: "Ficha legada",
            descricao: "",
          },
        ] as unknown as Ficha[],
        historico: [],
        exerciciosCustom: [],
        cardioCustom: [],
      },
      "2024-03-04T05:06:07.000Z"
    );

    expect(pezzoState.getProgramas()[0]).toMatchObject({
      id: "programa-legado",
      fichaIds: [],
      ativo: true,
    });
    expect(pezzoState.getFichaPorId("ficha-legada")).toMatchObject({
      icone: "halter",
      itens: [],
    });
  });

  it("gerencia tipos de cardio customizados e customizacao de built-in", () => {
    const custom = pezzoState.adicionarCardioCustom({
      nome: "Caminhada na praia",
      emoji: "🏖️",
      metricas: ["duracaoMinutos", "distanciaKm", "passos"],
    });

    expect(custom.id).toMatch(/^cardio-/);
    expect(pezzoState.getTiposCardio().some((tipo) => tipo.id === custom.id)).toBe(true);

    pezzoState.atualizarCardioCustom("Esteira", {
      metricas: ["duracaoMinutos", "distanciaKm", "inclinacaoPct"],
    });

    expect(pezzoState.getTiposCardio().find((tipo) => tipo.id === "Esteira")?.metricas).toEqual([
      "duracaoMinutos",
      "distanciaKm",
      "inclinacaoPct",
    ]);
    expect(pezzoState.removerCardioCustom("Esteira")).toBe(false);
    expect(pezzoState.removerCardioCustom(custom.id)).toBe(true);
  });

  it("mutacoes locais atualizam atualizadoEm", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-04-05T06:07:08.000Z"));

    pezzoState.substituirDados(dadosVazios, "2024-01-01T00:00:00.000Z");
    pezzoState.adicionarPrograma({
      nome: "Forca",
      descricao: "",
      fichaIds: [],
      ativo: true,
    });

    expect(pezzoState.getAtualizadoEm()).toBe("2024-04-05T06:07:08.000Z");
    vi.useRealTimers();
  });

  /* ══════════════════════════════════════════════════════
     PROGRAMAS — criar / atualizar / remover
     ══════════════════════════════════════════════════════ */
  describe("programas", () => {
    it("adicionarPrograma gera um id e retorna o programa criado", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());

      expect(programa.id).toBeTruthy();
      expect(programa.nome).toBe("Hipertrofia");
      expect(pezzoState.getProgramas()).toHaveLength(1);
    });

    it("ao adicionar um programa ativo, desativa os demais", () => {
      const primeiro = pezzoState.adicionarPrograma(
        dadosPrograma({ nome: "A", ativo: true })
      );
      const segundo = pezzoState.adicionarPrograma(
        dadosPrograma({ nome: "B", ativo: true })
      );

      expect(pezzoState.getProgramaPorId(primeiro.id)?.ativo).toBe(false);
      expect(pezzoState.getProgramaPorId(segundo.id)?.ativo).toBe(true);
      // Só pode existir um programa ativo
      expect(pezzoState.getProgramaAtivo()?.id).toBe(segundo.id);
    });

    it("atualizarPrograma retorna null quando o programa nao existe", () => {
      expect(pezzoState.atualizarPrograma("inexistente", { nome: "X" })).toBeNull();
    });

    it("ao ativar um programa via atualizarPrograma, desativa os demais", () => {
      const a = pezzoState.adicionarPrograma(
        dadosPrograma({ nome: "A", ativo: true })
      );
      const b = pezzoState.adicionarPrograma(dadosPrograma({ nome: "B" }));

      pezzoState.atualizarPrograma(b.id, { ativo: true });

      expect(pezzoState.getProgramaPorId(a.id)?.ativo).toBe(false);
      expect(pezzoState.getProgramaPorId(b.id)?.ativo).toBe(true);
    });

    it("removerPrograma retorna false quando o programa nao existe", () => {
      expect(pezzoState.removerPrograma("inexistente")).toBe(false);
    });

    it("removerPrograma remove o programa mas mantem as fichas (apenas desvincula)", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const ficha = pezzoState.adicionarFicha(dadosFicha(), programa.id);

      const removido = pezzoState.removerPrograma(programa.id);

      expect(removido).toBe(true);
      expect(pezzoState.getProgramaPorId(programa.id)).toBeNull();
      // A ficha continua existindo, agora como orfã
      expect(pezzoState.getFichaPorId(ficha.id)).not.toBeNull();
      expect(pezzoState.getFichasOrfas().map((f) => f.id)).toContain(ficha.id);
    });
  });

  /* ══════════════════════════════════════════════════════
     FICHAS — criar / atualizar / remover
     ══════════════════════════════════════════════════════ */
  describe("fichas", () => {
    it("adicionarFicha gera um id e nao vincula a programa quando programaId e omitido", () => {
      const ficha = pezzoState.adicionarFicha(dadosFicha());

      expect(ficha.id).toBeTruthy();
      expect(pezzoState.getProgramasDaFicha(ficha.id)).toHaveLength(0);
      expect(pezzoState.getFichasOrfas().map((f) => f.id)).toContain(ficha.id);
    });

    it("adicionarFicha vincula automaticamente ao programa quando programaId e fornecido", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const ficha = pezzoState.adicionarFicha(dadosFicha(), programa.id);

      expect(pezzoState.getFichasDoPrograma(programa.id).map((f) => f.id)).toContain(
        ficha.id
      );
      expect(pezzoState.getProgramaPorId(programa.id)?.fichaIds).toContain(ficha.id);
    });

    it("atualizarFicha retorna null quando a ficha nao existe", () => {
      expect(pezzoState.atualizarFicha("inexistente", { nome: "X" })).toBeNull();
    });

    it("removerFicha retorna false quando a ficha nao existe", () => {
      expect(pezzoState.removerFicha("inexistente")).toBe(false);
    });

    it("removerFicha limpa as referencias da ficha em todos os programas", () => {
      const p1 = pezzoState.adicionarPrograma(dadosPrograma({ nome: "P1" }));
      const p2 = pezzoState.adicionarPrograma(dadosPrograma({ nome: "P2" }));
      const ficha = pezzoState.adicionarFicha(dadosFicha(), p1.id);
      pezzoState.vincularFichaAoPrograma(ficha.id, p2.id);

      pezzoState.removerFicha(ficha.id);

      expect(pezzoState.getFichaPorId(ficha.id)).toBeNull();
      expect(pezzoState.getProgramaPorId(p1.id)?.fichaIds).not.toContain(ficha.id);
      expect(pezzoState.getProgramaPorId(p2.id)?.fichaIds).not.toContain(ficha.id);
    });
  });

  /* ══════════════════════════════════════════════════════
     VINCULAR / DESVINCULAR ficha ↔ programa
     ══════════════════════════════════════════════════════ */
  describe("vincular e desvincular", () => {
    it("vincularFichaAoPrograma retorna false quando a ficha nao existe", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      expect(pezzoState.vincularFichaAoPrograma("inexistente", programa.id)).toBe(
        false
      );
    });

    it("vincularFichaAoPrograma retorna false quando o programa nao existe", () => {
      const ficha = pezzoState.adicionarFicha(dadosFicha());
      expect(pezzoState.vincularFichaAoPrograma(ficha.id, "inexistente")).toBe(false);
    });

    it("vincularFichaAoPrograma nao duplica um vinculo existente", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const ficha = pezzoState.adicionarFicha(dadosFicha());

      expect(pezzoState.vincularFichaAoPrograma(ficha.id, programa.id)).toBe(true);
      // Segunda tentativa deve falhar (já vinculada) e não duplicar o id
      expect(pezzoState.vincularFichaAoPrograma(ficha.id, programa.id)).toBe(false);

      const fichaIds = pezzoState.getProgramaPorId(programa.id)?.fichaIds ?? [];
      expect(fichaIds.filter((id) => id === ficha.id)).toHaveLength(1);
    });

    it("uma ficha pode estar vinculada a varios programas ao mesmo tempo", () => {
      const p1 = pezzoState.adicionarPrograma(dadosPrograma({ nome: "P1" }));
      const p2 = pezzoState.adicionarPrograma(dadosPrograma({ nome: "P2" }));
      const ficha = pezzoState.adicionarFicha(dadosFicha());

      pezzoState.vincularFichaAoPrograma(ficha.id, p1.id);
      pezzoState.vincularFichaAoPrograma(ficha.id, p2.id);

      expect(pezzoState.getProgramasDaFicha(ficha.id).map((p) => p.id)).toEqual(
        expect.arrayContaining([p1.id, p2.id])
      );
    });

    it("desvincularFichaDoPrograma retorna false quando o programa nao existe", () => {
      const ficha = pezzoState.adicionarFicha(dadosFicha());
      expect(pezzoState.desvincularFichaDoPrograma(ficha.id, "inexistente")).toBe(
        false
      );
    });

    it("desvincularFichaDoPrograma retorna false quando a ficha nao esta vinculada", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const ficha = pezzoState.adicionarFicha(dadosFicha());
      expect(pezzoState.desvincularFichaDoPrograma(ficha.id, programa.id)).toBe(false);
    });

    it("desvincularFichaDoPrograma remove o vinculo sem apagar a ficha", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const ficha = pezzoState.adicionarFicha(dadosFicha(), programa.id);

      expect(pezzoState.desvincularFichaDoPrograma(ficha.id, programa.id)).toBe(true);
      expect(pezzoState.getProgramaPorId(programa.id)?.fichaIds).not.toContain(
        ficha.id
      );
      expect(pezzoState.getFichaPorId(ficha.id)).not.toBeNull();
    });
  });

  /* ══════════════════════════════════════════════════════
     COPIAR FICHA — onde um bug corromperia dados
     ══════════════════════════════════════════════════════ */
  describe("copiarFicha", () => {
    it("retorna null quando a ficha original nao existe", () => {
      expect(pezzoState.copiarFicha("inexistente")).toBeNull();
    });

    it("cria uma copia com sufixo (copia) e id proprio", () => {
      const original = pezzoState.adicionarFicha(dadosFicha({ nome: "Peito" }));

      const copia = pezzoState.copiarFicha(original.id);

      expect(copia).not.toBeNull();
      expect(copia!.id).not.toBe(original.id);
      expect(copia!.nome).toBe("Peito (cópia)");
      expect(pezzoState.getFichas()).toHaveLength(2);
    });

    it("a copia NAO e vinculada a nenhum programa", () => {
      const programa = pezzoState.adicionarPrograma(dadosPrograma());
      const original = pezzoState.adicionarFicha(dadosFicha(), programa.id);

      const copia = pezzoState.copiarFicha(original.id)!;

      expect(pezzoState.getFichasDoPrograma(programa.id).map((f) => f.id)).not.toContain(
        copia.id
      );
      expect(pezzoState.getFichasOrfas().map((f) => f.id)).toContain(copia.id);
    });

    it("gera novos ids para as entradas de cardio (sem compartilhar referencia)", () => {
      const original = pezzoState.adicionarFicha(
        dadosFicha({ itens: [itemCardio({ id: "cardio-orig" })] })
      );

      const copia = pezzoState.copiarFicha(original.id)!;
      const cardioCopia = cardioDaFicha(copia);

      expect(cardioCopia).toHaveLength(1);
      expect(cardioCopia[0].id).not.toBe("cardio-orig");
      // Conteúdo preservado, apenas o id muda
      expect(cardioCopia[0].tipo).toBe("Esteira");
    });

    it("preserva a ordem dos itens intercalados na copia", () => {
      const original = pezzoState.adicionarFicha(
        dadosFicha({
          itens: [
            itemCardio({ id: "cardio-aquecimento" }),
            itemExercicio({ exercicioId: "ex-A" }),
            itemCardio({ id: "cardio-final" }),
          ],
        })
      );

      const copia = pezzoState.copiarFicha(original.id)!;

      expect(copia.itens.map((item) => item.tipo)).toEqual([
        "cardio",
        "exercicio",
        "cardio",
      ]);
    });

    it("copia os itens em um array novo (mutar a copia nao afeta o original)", () => {
      const original = pezzoState.adicionarFicha(
        dadosFicha({ itens: [itemExercicio({ exercicioId: "ex-A" })] })
      );

      const copia = pezzoState.copiarFicha(original.id)!;

      // Editar a lista de itens da cópia
      pezzoState.atualizarFicha(copia.id, {
        itens: [itemExercicio({ exercicioId: "ex-B" })],
      });

      const originalAtual = pezzoState.getFichaPorId(original.id)!;
      expect(exerciciosDaFicha(originalAtual).map((e) => e.exercicioId)).toEqual(["ex-A"]);
    });
  });

  /* ══════════════════════════════════════════════════════
     COPIAR PROGRAMA — cópia profunda das fichas vinculadas
     ══════════════════════════════════════════════════════ */
  describe("copiarPrograma", () => {
    it("retorna null quando o programa original nao existe", () => {
      expect(pezzoState.copiarPrograma("inexistente")).toBeNull();
    });

    it("cria uma copia inativa com sufixo (copia) e id proprio", () => {
      const original = pezzoState.adicionarPrograma(
        dadosPrograma({ nome: "Cutting", ativo: true })
      );

      const copia = pezzoState.copiarPrograma(original.id)!;

      expect(copia.id).not.toBe(original.id);
      expect(copia.nome).toBe("Cutting (cópia)");
      // A cópia nunca herda o status de ativo
      expect(copia.ativo).toBe(false);
      expect(pezzoState.getProgramaPorId(original.id)?.ativo).toBe(true);
    });

    it("duplica as fichas vinculadas gerando novos ids (cópia profunda)", () => {
      const original = pezzoState.adicionarPrograma(dadosPrograma());
      const fichaA = pezzoState.adicionarFicha(dadosFicha({ nome: "A" }), original.id);
      const fichaB = pezzoState.adicionarFicha(dadosFicha({ nome: "B" }), original.id);

      const copia = pezzoState.copiarPrograma(original.id)!;
      const fichasCopia = pezzoState.getFichasDoPrograma(copia.id);
      const idsOriginais = [fichaA.id, fichaB.id];

      expect(fichasCopia).toHaveLength(2);
      // As fichas da cópia são objetos novos, não as originais
      fichasCopia.forEach((f) => {
        expect(idsOriginais).not.toContain(f.id);
      });
      // As fichas originais continuam intactas e vinculadas ao programa original
      expect(pezzoState.getFichasDoPrograma(original.id).map((f) => f.id)).toEqual(
        idsOriginais
      );
    });

    it("editar uma ficha do programa copiado nao altera a ficha original", () => {
      const original = pezzoState.adicionarPrograma(dadosPrograma());
      const fichaOriginal = pezzoState.adicionarFicha(
        dadosFicha({ nome: "Original" }),
        original.id
      );

      const copia = pezzoState.copiarPrograma(original.id)!;
      const fichaCopiada = pezzoState.getFichasDoPrograma(copia.id)[0];

      pezzoState.atualizarFicha(fichaCopiada.id, { nome: "Modificada" });

      expect(pezzoState.getFichaPorId(fichaOriginal.id)?.nome).toBe("Original");
      expect(pezzoState.getFichaPorId(fichaCopiada.id)?.nome).toBe("Modificada");
    });

    it("copia um programa sem fichas sem erros", () => {
      const original = pezzoState.adicionarPrograma(dadosPrograma());

      const copia = pezzoState.copiarPrograma(original.id)!;

      expect(copia.fichaIds).toHaveLength(0);
      expect(pezzoState.getFichasDoPrograma(copia.id)).toHaveLength(0);
    });
  });

  /* ══════════════════════════════════════════════════════
     EXERCÍCIOS CUSTOMIZADOS
     ══════════════════════════════════════════════════════ */
  describe("exercicios customizados", () => {
    it("adicionarExercicioCustom gera id com prefixo custom-", () => {
      const exercicio = pezzoState.adicionarExercicioCustom({
        nome: "Crucifixo na polia",
        grupoMuscular: "Peito",
      });

      expect(exercicio.id.startsWith("custom-")).toBe(true);
      expect(pezzoState.getExerciciosCustom()).toHaveLength(1);
      // Fica acessível junto com os exercícios padrão
      expect(pezzoState.getExercicioPorId(exercicio.id)?.nome).toBe(
        "Crucifixo na polia"
      );
    });

    it("removerExercicioCustom retorna false quando o exercicio nao existe", () => {
      expect(pezzoState.removerExercicioCustom("custom-inexistente")).toBe(false);
    });

    it("removerExercicioCustom remove o exercicio existente", () => {
      const exercicio = pezzoState.adicionarExercicioCustom({
        nome: "Remada unilateral",
        grupoMuscular: "Costas",
      });

      expect(pezzoState.removerExercicioCustom(exercicio.id)).toBe(true);
      expect(pezzoState.getExerciciosCustom()).toHaveLength(0);
    });
  });

  /* ══════════════════════════════════════════════════════
     gerarNomeFicha — nomeação automática sequencial
     ══════════════════════════════════════════════════════ */
  describe("gerarNomeFicha", () => {
    it("retorna 'Treino A' quando nao ha fichas", () => {
      expect(pezzoState.gerarNomeFicha()).toBe("Treino A");
    });

    it("pula as letras ja usadas", () => {
      pezzoState.adicionarFicha(dadosFicha({ nome: "Treino A" }));
      pezzoState.adicionarFicha(dadosFicha({ nome: "Treino B" }));

      expect(pezzoState.gerarNomeFicha()).toBe("Treino C");
    });
  });

  /* ═══════════════════════════════════════════════════════════════════════════
     gerarNomePrograma — nomeação automática sequencial
     ═══════════════════════════════════════════════════════════════════════════ */
  describe("gerarNomePrograma", () => {
    it("retorna 'Programa 1' quando nao ha programas", () => {
      expect(pezzoState.gerarNomePrograma()).toBe("Programa 1");
    });

    it("usa o primeiro numero disponivel", () => {
      pezzoState.adicionarPrograma(dadosPrograma({ nome: "Programa 1" }));
      pezzoState.adicionarPrograma(dadosPrograma({ nome: "Programa 3" }));

      expect(pezzoState.gerarNomePrograma()).toBe("Programa 2");
    });

    it("compara nomes sem diferenciar maiusculas e espacos externos", () => {
      pezzoState.adicionarPrograma(dadosPrograma({ nome: "  PROGRAMA 1  " }));

      expect(pezzoState.gerarNomePrograma()).toBe("Programa 2");
    });
  });
});
