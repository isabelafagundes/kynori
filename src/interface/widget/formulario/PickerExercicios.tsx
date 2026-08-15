/* ═══════════════════════════════════════════
   Picker de Exercícios — Fichas
   ═══════════════════════════════════════════ */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Exercicio } from "@/domain/tipos";
import { Botao } from "@/interface/widget/botao/Botao";
import { Chip } from "@/interface/widget/chip/Chip";
import { EstadoVazio } from "@/interface/widget/EstadoVazio";
import { Icone } from "@/interface/widget/svg/Icone";
import { Input } from "@/interface/widget/formulario/Input";
import { useAlvoTutorial } from "@/interface/widget/tutorial/TutorialProvider";

interface PickerExerciciosProps {
  exercicios: Exercicio[];
  exercicioIdsSelecionados: string[];
  aoAdicionar: (exercicioId: string) => void;
  gruposFiltrados?: string[];
  aoCriarExercicioCustom?: () => void;
  grupoInicial?: string;
  modo?: "adicionar" | "selecionar";
  textoVazio?: string;
}

export function PickerExercicios({
  exercicios,
  exercicioIdsSelecionados,
  aoAdicionar,
  gruposFiltrados,
  aoCriarExercicioCustom,
  grupoInicial,
  modo = "adicionar",
  textoVazio,
}: PickerExerciciosProps) {
  const alvoBusca = useAlvoTutorial("picker-busca");
  const [busca, setBusca] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(grupoInicial ?? null);

  // Filtrar exercícios
  const exerciciosFiltrados = useMemo(() => {
    let filtrados = exercicios;

    // Aplicar filtro de grupo se selecionado
    if (grupoSelecionado) {
      filtrados = filtrados.filter((e) => e.grupoMuscular === grupoSelecionado);
    }

    // Aplicar filtro de grupos filtrados (quando exercício já está na ficha)
    if (gruposFiltrados && gruposFiltrados.length > 0) {
      filtrados = filtrados.filter((e) =>
        gruposFiltrados.includes(e.grupoMuscular)
      );
    }

    // Aplicar busca por texto
    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtrados = filtrados.filter(
        (e) =>
          e.nome.toLowerCase().includes(buscaLower) ||
          e.grupoMuscular.toLowerCase().includes(buscaLower)
      );
    }

    // Remover já selecionados
    filtrados = filtrados.filter((e) => !exercicioIdsSelecionados.includes(e.id));

    return filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [exercicios, grupoSelecionado, busca, gruposFiltrados, exercicioIdsSelecionados]);

  // Agrupar resultados por grupo muscular
  const gruposDeResultados = useMemo(() => {
    const mapa = new Map<string, Exercicio[]>();
    for (const exercicio of exerciciosFiltrados) {
      const lista = mapa.get(exercicio.grupoMuscular) ?? [];
      lista.push(exercicio);
      mapa.set(exercicio.grupoMuscular, lista);
    }
    return [...mapa.entries()]
      .map(([grupo, lista]) => ({ grupo, lista }))
      .sort((a, b) => a.grupo.localeCompare(b.grupo));
  }, [exerciciosFiltrados]);

  // Obter grupos únicos
  const gruposUnicos = useMemo(() => {
    const grupos = new Set(exercicios.map((e) => e.grupoMuscular));
    return Array.from(grupos).sort();
  }, [exercicios]);

  // Setas de rolagem do filtro de grupos (apenas web — no mobile usa-se swipe)
  const refFiltros = useRef<HTMLDivElement>(null);
  const [podeRolarEsquerda, setPodeRolarEsquerda] = useState(false);
  const [podeRolarDireita, setPodeRolarDireita] = useState(false);

  const atualizarSetas = useCallback(() => {
    const el = refFiltros.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setPodeRolarEsquerda(scrollLeft > 1);
    setPodeRolarDireita(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const rolarFiltros = (direcao: 1 | -1) => {
    const el = refFiltros.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.75, behavior: "smooth" });
  };

  useEffect(() => {
    atualizarSetas();
    window.addEventListener("resize", atualizarSetas);
    return () => window.removeEventListener("resize", atualizarSetas);
  }, [atualizarSetas, gruposUnicos]);

  // Limpar seleção de grupo se não existir mais nos filtros
  if (grupoSelecionado && !gruposUnicos.includes(grupoSelecionado)) {
    setGrupoSelecionado(null);
  }

  const totalDisponivel = exerciciosFiltrados.length;
  const buscaAtivaSemResultado = totalDisponivel === 0 && Boolean(busca || grupoSelecionado);

  const limparFiltros = () => {
    setBusca("");
    setGrupoSelecionado(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de busca + filtros — fixa ao rolar */}
      <div
        ref={alvoBusca}
        /* A faixa opaca acima da barra mascara o conteúdo que passa por baixo
           ao rolar. Altura = py-4 (16px) dos containers que hospedam o picker;
           maior que isso ela invade o conteúdo que vem antes na tela. */
        className="
          sticky top-0 z-10 -mx-1 px-1 pt-1 pb-2 space-y-3 bg-superficie
          before:absolute before:inset-x-0 before:bottom-full before:h-4
          before:bg-superficie before:content-['']
        "
      >
        <Input
          tipo="busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar exercício..."
          aoLimpar={() => setBusca("")}
        />

        {/* Filtro de grupo muscular — rolagem horizontal (swipe no mobile, setas na web) */}
        {gruposUnicos.length > 0 && (
          <div className="relative -mx-1">
            <div
              ref={refFiltros}
              onScroll={atualizarSetas}
              className="flex flex-nowrap gap-2 overflow-x-auto scroll-smooth px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Chip
                rotulo="Todos"
                tamanho="pequeno"
                ativo={grupoSelecionado === null}
                aoClicar={() => setGrupoSelecionado(null)}
                className="shrink-0 min-h-[36px] px-3.5 text-[13px]"
              />
              {gruposUnicos.map((grupo) => (
                <Chip
                  key={grupo}
                  rotulo={grupo}
                  tamanho="pequeno"
                  ativo={grupoSelecionado === grupo}
                  aoClicar={() => setGrupoSelecionado(grupo)}
                  className="shrink-0 min-h-[36px] px-3.5 text-[13px]"
                />
              ))}
            </div>

            {/* Seta esquerda — apenas web, quando há conteúdo escondido à esquerda */}
            {podeRolarEsquerda && (
              <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 items-center justify-start bg-gradient-to-r from-superficie to-transparent pl-0.5 lg:flex">
                <button
                  type="button"
                  onClick={() => rolarFiltros(-1)}
                  aria-label="Ver grupos anteriores"
                  className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-borda bg-superficie text-texto-secundario shadow-sm transition-all duration-150 hover:bg-superficie-suave hover:text-texto-primario active:scale-95"
                >
                  <Icone nome="setaEsquerda" tamanho={16} />
                </button>
              </div>
            )}

            {/* Seta direita */}
            {podeRolarDireita && (
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 items-center justify-end bg-gradient-to-l from-superficie to-transparent pr-0.5 lg:flex">
                <button
                  type="button"
                  onClick={() => rolarFiltros(1)}
                  aria-label="Ver mais grupos"
                  className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-borda bg-superficie text-texto-secundario shadow-sm transition-all duration-150 hover:bg-superficie-suave hover:text-texto-primario active:scale-95"
                >
                  <Icone nome="setaDireita" tamanho={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enquanto o vazio de busca está na tela ele já traz o CTA de criar —
            manter os dois duplicaria a mesma ação. */}
        {aoCriarExercicioCustom && !buscaAtivaSemResultado && (
          <button
            type="button"
            onClick={aoCriarExercicioCustom}
            className="
              flex w-full items-center justify-center gap-2
              rounded-[10px] border border-dashed border-borda
              px-4 py-2.5 min-h-[44px]
              text-sm font-medium text-texto-secundario
              hover:border-acento hover:text-acento hover:bg-acento/5
              active:scale-[0.99]
              transition-all duration-150
            "
          >
            <Icone nome="mais" tamanho={16} />
            Criar exercício customizado
          </button>
        )}
      </div>

      {/* Lista de exercícios agrupada */}
      {buscaAtivaSemResultado ? (
        <EstadoVazio
          emoji="🔍"
          tamanho="compacto"
          titulo="Nenhum exercício encontrado"
          descricao={
            busca
              ? `Nada corresponde a “${busca}”${grupoSelecionado ? ` em ${grupoSelecionado}` : ""}.`
              : `Nenhum exercício em ${grupoSelecionado}.`
          }
          dica="💡 Tente um termo mais curto"
          acao={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Botao variante="secundario" tamanho="compacto" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
              {aoCriarExercicioCustom && (
                <Botao
                  variante="primario"
                  tamanho="compacto"
                  icone={<Icone nome="mais" tamanho={14} />}
                  onClick={aoCriarExercicioCustom}
                >
                  Criar exercício
                </Botao>
              )}
            </div>
          }
        />
      ) : totalDisponivel === 0 ? (
        <EstadoVazio
          emoji={modo === "selecionar" ? "🔁" : "✅"}
          tamanho="compacto"
          titulo={modo === "selecionar" ? "Nada para trocar" : "Tudo já adicionado"}
          descricao={
            textoVazio ?? (modo === "selecionar"
              ? "Nenhum exercício disponível para esta troca."
              : "Todos os exercícios já foram adicionados.")
          }
        />
      ) : (
        <div className="space-y-5">
          {gruposDeResultados.map(({ grupo, lista }) => (
            <section key={grupo} className="space-y-2">
              <div className="flex items-baseline justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-sutil">
                  {grupo}
                </h3>
                <span className="text-xs tabular-nums text-texto-sutil/60">
                  {lista.length}
                </span>
              </div>
              <div className="bg-superficie rounded-2xl border border-borda overflow-hidden">
                {lista.map((exercicio, index) => (
                  <button
                    key={exercicio.id}
                    type="button"
                    onClick={() => aoAdicionar(exercicio.id)}
                    className={`
                      group w-full px-4 py-3.5 min-h-[56px]
                      flex items-center justify-between gap-3
                      text-left
                      transition-colors duration-150
                      hover:bg-superficie-suave active:bg-superficie-hover
                      ${index < lista.length - 1 ? "border-b border-borda-suave" : ""}
                    `}
                  >
                    <span className="text-sm font-medium text-texto-primario truncate">
                      {exercicio.nome}
                    </span>
                    <span
                      className="
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-full bg-superficie-suave text-texto-sutil
                        transition-colors duration-150
                        group-hover:bg-acento group-hover:text-texto-invertido
                      "
                      aria-hidden="true"
                    >
                      <Icone nome={modo === "selecionar" ? "setaDireita" : "mais"} tamanho={16} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
