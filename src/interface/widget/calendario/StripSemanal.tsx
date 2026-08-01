import { useMemo } from "react";
import type { DadosFrequencia } from "@/domain/tipos";
import {
  contarDiasComTreinoNaSemana,
  inicioDaSemana,
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

/** Iniciais dos dias, semana começando na segunda — mesma definição de
    `inicioDaSemana`, a fonte única de "semana" do app. */
const INICIAIS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;
const NOMES_DIA = [
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
  "domingo",
] as const;

export type EstadoDia = "feito" | "hoje" | "vazio";

export interface DiaDaSemana {
  inicial: (typeof INICIAIS)[number];
  iso: string;
  estado: EstadoDia;
  nome: (typeof NOMES_DIA)[number];
}

/** Os 7 dias da semana corrente (segunda a domingo) com o estado de treino
    de cada um — compartilhado entre a grade do strip e o card de sequência. */
export function construirDiasDaSemana(
  dados: DadosFrequencia,
  hoje: Date = new Date(),
): DiaDaSemana[] {
  const registrosPorData = new Map<string, boolean>();
  for (const registro of dados.registros) {
    registrosPorData.set(registro.data, registro.completou);
  }

  const referencia = new Date(hoje);
  referencia.setHours(0, 0, 0, 0);
  const isoHoje = toISODate(referencia);
  const inicio = inicioDaSemana(referencia);

  return INICIAIS.map((inicial, indice) => {
    const data = new Date(inicio);
    data.setDate(data.getDate() + indice);
    const iso = toISODate(data);
    const treinou = registrosPorData.get(iso) === true;
    const estado: EstadoDia = treinou ? "feito" : iso === isoHoje ? "hoje" : "vazio";
    return { inicial, iso, estado, nome: NOMES_DIA[indice] };
  });
}

/**
 * Grade da semana na home — 7 blocos, um por dia, com a inicial dentro.
 *
 * O estado é carregado pela forma, não só pela cor: dia vazio é uma
 * cavidade escavada, dia treinado é um bloco extrudado. Isso mantém a
 * leitura sob daltonismo e sob sol, e dispensa legenda.
 *
 * Fica sem container por decisão de composição: entre dois cards, ela é
 * o respiro que separa a zona de ação (próximo treino) da zona de
 * acervo (programa). O calendário completo vive na tela de detalhe.
 */
export function StripSemanal({
  dados,
  metaSemanal,
  aoAbrirDetalhe,
}: PropriedadesStripSemanal) {
  const dias = useMemo(() => construirDiasDaSemana(dados), [dados]);

  const treinosSemana = useMemo(
    () => contarDiasComTreinoNaSemana(dados),
    [dados],
  );

  const meta = metaSemanal ?? 7;
  const metaBatida = metaSemanal !== undefined && treinosSemana >= metaSemanal;

  const grade = (
    /* As células dividem a largura disponível em vez de terem largura fixa.
       Com um teto por célula elas viravam ilhas: em tablet sobravam 58px de
       vão entre blocos de 46px, e a faixa perdia a leitura de "uma semana".
       Preenchendo, as bordas casam com as dos cards em qualquer largura. */
    <div className="flex items-start gap-1.5 md:gap-2" aria-hidden="true">
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
  );

  /* Leitura acessível equivalente à grade, que é decorativa para o leitor
     de tela — repetir 7 blocos letra a letra não ajudaria ninguém. */
  const resumoAcessivel = dias
    .filter((dia) => dia.estado === "feito")
    .map((dia) => dia.nome)
    .join(", ");

  const legenda = (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-xs tabular-nums text-texto-sutil">
        <span className={metaBatida ? "font-bold text-texto-primario" : undefined}>
          {treinosSemana} de {meta}
        </span>{" "}
        {meta === 1 ? "dia" : "dias"} esta semana
        {metaBatida && " · meta batida 🎯"}
      </span>
      {aoAbrirDetalhe && (
        <span className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-texto-sutil">
          Sequência
          <Icone nome="setaDireita" tamanho={12} />
        </span>
      )}
    </div>
  );

  const conteudo = (
    <>
      {grade}
      {legenda}
      <span className="sr-only">
        {treinosSemana === 0
          ? "Nenhum treino registrado esta semana."
          : `Treinos esta semana: ${resumoAcessivel}. ${treinosSemana} de ${meta} dias.`}
      </span>
    </>
  );

  return aoAbrirDetalhe ? (
    <button
      type="button"
      onClick={aoAbrirDetalhe}
      aria-label="Ver detalhes da sequência"
      className="w-full rounded-2xl py-1 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
    >
      {conteudo}
    </button>
  ) : (
    <div className="py-1">{conteudo}</div>
  );
}
