import { useEffect, useState } from "react";

interface PropriedadesBarraProgressoSemanal {
  /** Quantas fichas já foram treinadas nesta semana */
  concluidas: number;
  /** Total de fichas do programa */
  total: number;
  /** Exibe o rótulo "X/Y esta semana" acima da barra */
  comRotulo?: boolean;
}

/**
 * Barra de progresso semanal do programa, com animação de preenchimento
 * a partir do zero ao montar. Reutilizada pelo card do programa (Home) e
 * pela tela de resumo do programa.
 */
export function BarraProgressoSemanal({
  concluidas,
  total,
  comRotulo = false,
}: PropriedadesBarraProgressoSemanal) {
  const temProgresso = total > 0;
  const porcentagem = temProgresso ? Math.round((concluidas / total) * 100) : 0;
  const completo = temProgresso && concluidas >= total;

  const [larguraBarra, setLarguraBarra] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLarguraBarra(Math.min(porcentagem, 100)));
    return () => cancelAnimationFrame(id);
  }, [porcentagem]);

  if (!temProgresso) return null;

  return (
    <div>
      {comRotulo && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-texto-sutil">Esta semana</span>
          <span
            className={`text-xs font-semibold tabular-nums leading-none ${completo ? "text-acento" : "text-texto-secundario"}`}
          >
            {concluidas}/{total}
          </span>
        </div>
      )}

      {/* Sem rótulo de porcentagem: a fração "X de Y fichas" já vive no
          cabeçalho do banner, e a barra cheia comunica o 100%. Eram três
          codificações do mesmo fato lado a lado. */}
      <div className="group h-2 overflow-hidden rounded-full bg-borda-suave">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            completo
              ? "bg-acento"
              : "bg-texto-secundario/50 group-hover:bg-texto-secundario/60"
          }`}
          style={{ width: `${larguraBarra}%` }}
        />
      </div>
    </div>
  );
}
