import { useMemo } from "react";
import type { DadosFrequencia } from "@/domain/tipos";
import { contarDiasComTreinoNaSemana } from "@/interface/page/area-logada/estatisticas/utils";
import { construirDiasDaSemana } from "@/interface/widget/calendario/StripSemanal";
import { Icone } from "@/interface/widget/svg/Icone";

interface PropriedadesCardSequencia {
  dados: DadosFrequencia;
  /** Meta de treinos por semana escolhida no onboarding. Sem ela, o
      denominador segue sendo os 7 dias da semana. */
  metaSemanal?: number;
  aoAbrirDetalhe?: () => void;
}

/**
 * Card "Sua sequência" da home: cabeçalho com a leitura da meta ("faltam N
 * treinos") e o placar da semana, com a grade de dias embaixo.
 *
 * Substitui o StripSemanal solto na home — a grade continua sendo a mesma
 * (blocos `dia-semana`, estado carregado pela forma), mas ganha container e
 * contexto, seguindo a hierarquia saudação → ação → sequência → métricas.
 */
export function CardSequencia({
  dados,
  metaSemanal,
  aoAbrirDetalhe,
}: PropriedadesCardSequencia) {
  const dias = useMemo(() => construirDiasDaSemana(dados), [dados]);
  const treinosSemana = useMemo(
    () => contarDiasComTreinoNaSemana(dados),
    [dados],
  );

  const meta = metaSemanal ?? 7;
  const faltam = meta - treinosSemana;
  const metaBatida = metaSemanal !== undefined && faltam <= 0;

  const subtitulo =
    metaSemanal === undefined
      ? "Seus treinos nesta semana"
      : metaBatida
        ? "Meta da semana batida 🎯"
        : `${faltam === 1 ? "Falta" : "Faltam"} ${faltam} ${faltam === 1 ? "treino" : "treinos"} para bater sua meta`;

  const resumoAcessivel = dias
    .filter((dia) => dia.estado === "feito")
    .map((dia) => dia.nome)
    .join(", ");

  const conteudo = (
    <>
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-acento-suave text-texto-primario"
          aria-hidden="true"
        >
          <Icone nome="fogo" tamanho={18} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold leading-tight text-texto-primario">
            Sua sequência
          </h2>
          <p className="mt-0.5 truncate text-xs text-texto-sutil">{subtitulo}</p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end" aria-hidden="true">
          <span
            className={`font-display text-2xl font-bold leading-none tabular-nums ${
              metaBatida ? "text-acento" : "text-texto-primario"
            }`}
          >
            {treinosSemana}
          </span>
          <span className="mt-0.5 text-[11px] leading-none text-texto-sutil">
            / {meta} esta semana
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-1.5 md:gap-2" aria-hidden="true">
        {dias.map((dia) => (
          <span
            key={dia.iso}
            className={`dia-semana h-11 flex-1 text-[0.8125rem] md:h-12 md:text-sm ${
              dia.estado === "feito"
                ? "dia-semana-feito"
                : dia.estado === "hoje"
                  ? "dia-semana-hoje"
                  : "dia-semana-vazio"
            }`}
          >
            {dia.inicial}
          </span>
        ))}
      </div>

      <span className="sr-only">
        {treinosSemana === 0
          ? "Nenhum treino registrado esta semana."
          : `Treinos esta semana: ${resumoAcessivel}. ${treinosSemana} de ${meta} dias.`}
      </span>
    </>
  );

  const classesCard =
    "w-full rounded-2xl border border-borda bg-superficie p-4 text-left";

  return aoAbrirDetalhe ? (
    <button
      type="button"
      onClick={aoAbrirDetalhe}
      aria-label="Ver detalhes da sequência"
      className={`${classesCard} transition-colors duration-200 hover:bg-superficie-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento`}
    >
      {conteudo}
    </button>
  ) : (
    <div className={classesCard}>{conteudo}</div>
  );
}
