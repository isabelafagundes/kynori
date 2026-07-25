import { useMemo } from "react";
import type { DadosFrequencia } from "@/domain/tipos";
import {
  contarDiasComTreinoNaSemana,
  toISODate,
} from "@/interface/page/area-logada/estatisticas/utils";
import { Icone } from "@/interface/widget/svg/Icone";

interface PropriedadesStripSemanal {
  dados: DadosFrequencia;
  /** Meta de treinos por semana escolhida no onboarding. Sem ela, o
      denominador segue sendo os 7 dias da semana. */
  metaSemanal?: number;
  aoAbrirDetalhe?: () => void;
}

/**
 * Resumo sutil da sequência na home — uma única linha.
 * O calendário completo (7 dias, mês) vive na tela de detalhe,
 * aberta pelo tap; aqui mostramos só a essência: streak e semana.
 */
export function StripSemanal({
  dados,
  metaSemanal,
  aoAbrirDetalhe,
}: PropriedadesStripSemanal) {
  const registrosPorData = useMemo(() => {
    const mapa = new Map<string, boolean>();
    for (const registro of dados.registros) mapa.set(registro.data, registro.completou);
    return mapa;
  }, [dados.registros]);

  const streak = useMemo(() => {
    let total = 0;
    const hoje = new Date();
    for (let indice = 0; indice < 365; indice++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - indice);
      if (registrosPorData.get(toISODate(data))) total++;
      else if (indice > 0) break;
    }
    return total;
  }, [registrosPorData]);

  const treinosSemana = useMemo(
    () => contarDiasComTreinoNaSemana(dados),
    [dados],
  );

  const temStreak = streak > 0;
  const meta = metaSemanal ?? 7;
  const metaBatida = metaSemanal !== undefined && treinosSemana >= metaSemanal;

  const conteudo = (
    <>
      <span
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${
          temStreak ? "bg-[oklch(0.88_0.05_45)]" : "bg-superficie-suave/80"
        }`}
      >
        <Icone
          nome="fogo"
          tamanho={16}
          className={temStreak ? "text-[oklch(0.45_0.16_40)] animate-flame" : "text-texto-sutil"}
        />
      </span>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm leading-tight text-texto-secundario">
          {temStreak ? (
            <>
              <span className="font-bold tabular-nums text-texto-primario">{streak}</span>{" "}
              {streak === 1 ? "dia" : "dias"} de sequência
            </>
          ) : (
            "Comece sua sequência hoje"
          )}
        </p>
        <p className="mt-1 text-xs leading-tight tabular-nums text-texto-sutil">
          <span className={metaBatida ? "font-bold text-grafico-forte" : undefined}>
            {treinosSemana}/{meta}
          </span>{" "}
          esta semana
          {metaBatida && " · meta batida 🎯"}
        </p>
      </div>

      {aoAbrirDetalhe && (
        <span className="flex-shrink-0 text-texto-sutil" aria-hidden="true">
          <Icone nome="setaDireita" tamanho={18} />
        </span>
      )}
    </>
  );

  const classeBase =
    "w-full bg-superficie rounded-2xl border border-borda px-4 py-3 flex items-center gap-3";

  return aoAbrirDetalhe ? (
    <button
      type="button"
      onClick={aoAbrirDetalhe}
      aria-label="Ver detalhes da sequência"
      className={`${classeBase} text-left transition-colors duration-200 hover:bg-superficie-suave active:bg-superficie-suave/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento`}
    >
      {conteudo}
    </button>
  ) : (
    <div className={classeBase}>{conteudo}</div>
  );
}
