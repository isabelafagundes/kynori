import type { Exercicio, Ficha } from "@/domain/tipos";
import { cardioDaFicha, exerciciosDaFicha } from "@/domain/ficha";
import {
  extrairGruposMusculares,
  formatarDataRelativa,
} from "@/interface/page/area-logada/programa/utils";
import { Botao } from "@/interface/widget/botao/Botao";
import { Icone, IconeFicha } from "@/interface/widget/svg/Icone";

interface PropriedadesLinhaFicha {
  ficha: Ficha;
  exerciciosCatalogo: Exercicio[];
  ultimoTreino?: string | null;
  aoIniciarTreino: (fichaId: string) => void;
  /** Quando a ficha está vazia, troca o play por "+ Adicionar" (abre o
      editor da ficha). Sem o callback, a linha vazia mantém o play. */
  aoAdicionarItens?: (fichaId: string) => void;
}

/**
 * Linha compacta de ficha na lista do programa da home.
 *
 * A ação é um play circular, sem rótulo: dentro do card do programa a linha
 * é inventário, não chamada — o CTA com texto vive no card de próximo
 * treino. Ficha vazia troca o play por "+ Adicionar", que leva ao editor.
 *
 * Os grupos musculares truncam com reticências. Antes rolavam num
 * letreiro infinito, que obrigava a esperar o texto passar para ler e
 * mantinha movimento perpétuo numa tela cuja proposta é foco.
 */
export function LinhaFicha({
  ficha,
  exerciciosCatalogo,
  ultimoTreino,
  aoIniciarTreino,
  aoAdicionarItens,
}: PropriedadesLinhaFicha) {
  const exerciciosFicha = exerciciosDaFicha(ficha);
  const quantidadeCardio = cardioDaFicha(ficha).length;
  const fichaVazia = exerciciosFicha.length === 0 && quantidadeCardio === 0;
  const gruposMusculares = extrairGruposMusculares(exerciciosFicha, exerciciosCatalogo);
  const textoGruposMusculares = gruposMusculares.join(" · ");

  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors duration-200 hover:bg-superficie-suave">
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-acento-suave text-texto-primario shadow-sm">
          <IconeFicha nome={ficha.icone} tamanho={26} emoji={ficha.emoji} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 truncate font-display text-sm font-semibold leading-tight text-texto-primario">
            {ficha.nome}
          </h3>
          {ultimoTreino && (
            <span className="flex-shrink-0 text-xs leading-none text-texto-sutil">
              <span className="sr-only">Última vez treinada: </span>
              {formatarDataRelativa(ultimoTreino)}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-texto-sutil">
          {fichaVazia ? (
            "Nenhum exercício"
          ) : (
            <>
              {exerciciosFicha.length} exerc.
              {quantidadeCardio > 0 && ` + ${quantidadeCardio} cardio`}
              {textoGruposMusculares && ` · ${textoGruposMusculares}`}
            </>
          )}
        </p>
      </div>

      {fichaVazia && aoAdicionarItens ? (
        <Botao
          variante="fantasma"
          tamanho="compacto"
          icone={<Icone nome="mais" tamanho={13} />}
          onClick={() => aoAdicionarItens(ficha.id)}
          className="flex-shrink-0 border border-borda"
        >
          Adicionar
        </Botao>
      ) : (
        <button
          type="button"
          aria-label={`Iniciar ${ficha.nome}`}
          onClick={() => aoIniciarTreino(ficha.id)}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-borda bg-superficie text-texto-primario shadow-sm transition-all duration-200 hover:bg-superficie-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        >
          <Icone nome="reproduzir" tamanho={13} />
        </button>
      )}
    </div>
  );
}
