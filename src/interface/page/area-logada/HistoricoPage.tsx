import type { Ficha, Programa, RegistroTreino } from "@/domain/tipos";
import { criarFichaLivre, ehTreinoLivre } from "@/domain/treino-livre";
import { ItemHistorico } from "@/interface/widget/historico/ItemHistorico";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Icone } from "@/interface/widget/svg/Icone";
import { useToast } from "@/interface/widget/toast";
import { calcularStreakAtual } from "./estatisticas/utils";
import {
  ListaMetricas,
  FaixaPropriedades,
  type ItemMetrica,
} from "./estatisticas/ListaMetricas";

interface PropriedadesHistoricoPage {
  fichas: Ficha[];
  programas: Programa[];
  historico: RegistroTreino[];
  aoNavegar: (destino: string, params?: Record<string, string>) => void;
  aoIrParaTreinos: () => void;
}

export function HistoricoPage({
  fichas,
  programas,
  historico,
  aoNavegar,
  aoIrParaTreinos,
}: PropriedadesHistoricoPage) {
  const { showError } = useToast();

  function aoComecarTreinar() {
    const programaAtivo = programas.find((p) => p.ativo);
    const temFicha = programaAtivo ? programaAtivo.fichaIds.length > 0 : false;
    if (programaAtivo && temFicha) {
      aoIrParaTreinos();
    } else {
      showError("Você não possui programas de treino");
    }
  }

  // Ordenar histórico por data (mais recente primeiro)
  const historicoOrdenado = [...historico].sort(
    (a, b) => new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime()
  );
  const grupos = agruparPorMes(historicoOrdenado);
  const totalMesAtual = contarTreinosNoMesAtual(historico);
  const streak = calcularStreakAtual(historico);

  // Mobile: lista vertical de propriedades (mesmo componente das Estatísticas).
  const itensResumo: ItemMetrica[] = [
    { icone: "halter", rotulo: "Total de treinos", valor: historico.length },
    { icone: "calendario", rotulo: "Este mês", valor: totalMesAtual },
    {
      icone: "fogo",
      rotulo: "Sequência",
      valor: `${streak} ${streak === 1 ? "dia" : "dias"}`,
    },
  ];
  // Largo (md+): faixa horizontal com rótulos curtos.
  const itensResumoFaixa: ItemMetrica[] = [
    { icone: "halter", rotulo: "Total", valor: historico.length },
    { icone: "calendario", rotulo: "Este mês", valor: totalMesAtual },
    { icone: "fogo", rotulo: "Sequência", valor: `${streak}d` },
  ];

  return (
    <div className="px-5 py-4">
      <div className="mb-5 reveal-up">
        <div className="md:hidden">
          <ListaMetricas itens={itensResumo} />
        </div>
        <div className="hidden md:block">
          <FaixaPropriedades itens={itensResumoFaixa} />
        </div>
      </div>

      {historicoOrdenado.length > 0 ? (
        <div className="space-y-5">
          {(() => {
            let indiceGlobal = 0;
            return grupos.map((grupo) => (
              <section key={grupo.mes}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil reveal-up">
                  {grupo.mes}
                </h2>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {grupo.registros.map((registro) => {
                    const ficha =
                      fichas.find((f) => f.id === registro.fichaId) ??
                      (ehTreinoLivre(registro.fichaId) ? criarFichaLivre() : undefined);
                    const atraso = 60 + Math.min(indiceGlobal, 12) * 50;
                    indiceGlobal += 1;
                    return (
                      <div
                        key={registro.id}
                        className="reveal-up"
                        style={{ animationDelay: `${atraso}ms` }}
                      >
                        <ItemHistorico
                          registro={registro}
                          ficha={ficha}
                          aoClicar={(registroId) => aoNavegar("detalheHistorico", { registroId })}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ));
          })()}
        </div>
      ) : (
        <div className="reveal-up">
        <EstadoVazio
          emoji="📓"
          titulo="Seu diário começa vazio"
          descricao="Cada treino concluído vira um registro aqui — com carga, séries e tempo."
          dica="🗓️ Os treinos entram sozinhos quando você finaliza"
          acao={
            <button
              onClick={aoComecarTreinar}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[10px] bg-acento text-texto-invertido text-sm font-medium hover:bg-acento-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento transition-all duration-150"
            >
              <Icone nome="reproduzir" tamanho={16} />
              Começar a Treinar
            </button>
          }
        />
        </div>
      )}
    </div>
  );
}

function agruparPorMes(registros: RegistroTreino[]) {
  const grupos = new Map<string, RegistroTreino[]>();

  registros.forEach((registro) => {
    const mes = new Date(registro.iniciadoEm).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const chave = mes.charAt(0).toUpperCase() + mes.slice(1);
    grupos.set(chave, [...(grupos.get(chave) ?? []), registro]);
  });

  return Array.from(grupos.entries()).map(([mes, registrosDoMes]) => ({
    mes,
    registros: registrosDoMes,
  }));
}

function contarTreinosNoMesAtual(registros: RegistroTreino[]) {
  const hoje = new Date();
  return registros.filter((registro) => {
    const data = new Date(registro.iniciadoEm);
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).length;
}

