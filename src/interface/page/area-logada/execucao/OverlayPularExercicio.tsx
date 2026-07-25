interface OverlayPularExercicioProps {
  nomeExercicio: string;
  seriesConcluidas: number;
  seriesTotal: number;
  aoConfirmar: () => void;
  aoFechar: () => void;
}

export function OverlayPularExercicio({
  nomeExercicio,
  seriesConcluidas,
  seriesTotal,
  aoConfirmar,
  aoFechar,
}: OverlayPularExercicioProps) {
  const iniciado = seriesConcluidas > 0;

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/25 md:items-center" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pular-exercicio-title"
        className="w-full max-w-[480px] rounded-t-[16px] border border-borda bg-superficie px-5 pb-[calc(var(--safe-bottom)+20px)] pt-4 shadow-xl md:rounded-2xl md:pb-5"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-borda md:hidden" />
        <h2 id="pular-exercicio-title" className="font-display text-xl font-semibold text-texto-primario">
          {iniciado ? "Parar exercício por hoje?" : "Pular exercício hoje?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-texto-secundario">
          {iniciado
            ? `${seriesConcluidas} de ${seriesTotal} séries de ${nomeExercicio} serão mantidas no histórico. As restantes não serão executadas hoje.`
            : `${nomeExercicio} sairá somente da execução de hoje.`}
        </p>
        <p className="mt-2 text-xs text-texto-sutil">A ficha original não será alterada.</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-11 rounded-[8px] border border-borda-suave bg-superficie text-sm font-medium text-texto-primario"
          >
            Continuar no exercício
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            className="min-h-11 rounded-[8px] bg-texto-primario text-sm font-medium text-texto-invertido"
          >
            {iniciado ? "Manter séries e parar" : "Pular somente hoje"}
          </button>
        </div>
      </div>
    </div>
  );
}
