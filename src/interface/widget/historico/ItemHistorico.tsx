import type { Ficha, RegistroTreino } from "@/domain/tipos";
import { interpretarDataLocal } from "@/interface/util/data-local";
import { Icone, IconeFicha } from "@/interface/widget/svg/Icone";

interface PropriedadesItemHistorico {
  registro: RegistroTreino;
  ficha?: Ficha;
  aoClicar: (registroId: string) => void;
}

/** Formata data ISO para exibição legível */
function formatarData(dataISO: string): string {
  const data = interpretarDataLocal(dataISO);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Formata horário a partir de ISO */
function formatarHorario(dataISO: string): string {
  const data = new Date(dataISO);
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Calcula duração em minutos entre duas datas ISO */
function calcularDuracaoMinutos(inicio: string, fim: string): number {
  const diff = new Date(fim).getTime() - new Date(inicio).getTime();
  return Math.round(diff / 60000);
}

export function ItemHistorico({
  registro,
  ficha,
  aoClicar,
}: PropriedadesItemHistorico) {
  const nomeFicha = ficha?.nome ?? "Ficha removida";
  const duracaoMin = calcularDuracaoMinutos(registro.iniciadoEm, registro.finalizadoEm);
  const totalExercicios = registro.exercicios.length;
  const temCardio = registro.cardio.length > 0;

  return (
    <button
      onClick={() => aoClicar(registro.id)}
      className="
        w-full flex items-center gap-3.5 px-4 py-3.5
        bg-superficie rounded-[12px] border border-borda
        text-left transition-colors duration-150 ease-out
        hover:bg-superficie-hover
        active:scale-[0.99] cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento
        min-h-[56px]
      "
    >
      {/* Indicador visual com ícone da ficha */}
      <div className="flex-shrink-0 w-9 h-9 rounded-[8px] bg-acento-suave flex items-center justify-center text-texto-secundario">
        {ficha ? (
          <IconeFicha nome={ficha.icone} tamanho={18} emoji={ficha.emoji} />
        ) : (
          <Icone nome="listaVerificacao" tamanho={18} />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-texto-primario truncate font-display">
            {nomeFicha}
          </span>
          <span className="flex-shrink-0 text-xs text-texto-sutil tabular-nums">
            {formatarData(registro.data)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-texto-sutil">
          <span>
            {totalExercicios} exercício{totalExercicios !== 1 ? "s" : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {formatarHorario(registro.iniciadoEm)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {duracaoMin} min
          </span>
          {temCardio && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-0.5">
                <Icone nome="coracao" tamanho={12} />
                cardio
              </span>
            </>
          )}
        </div>
      </div>

      {/* Seta */}
      <div className="flex-shrink-0 text-texto-sutil">
        <Icone nome="setaDireita" tamanho={16} />
      </div>
    </button>
  );
}
