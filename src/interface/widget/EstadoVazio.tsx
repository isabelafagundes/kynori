import type { ReactNode } from "react";
import { Icone } from "@/interface/widget/svg/Icone";

interface PropriedadesEstadoVazio {
  /** Emoji do emblema — preferido sobre `icone` (mesma linguagem das fichas). */
  emoji?: string;
  /** Fallback em traço, para casos sem emoji que caiba. */
  icone?: string;
  titulo: string;
  descricao: ReactNode;
  acao?: ReactNode;
  /** Linha de rodapé separada por hairline: expectativa, atalho ou dica. */
  dica?: ReactNode;
  /** `compacto` encolhe o emblema e os espaços — para vazios dentro de
   *  drawers e listas, onde o cartão inteiro dominaria o conteúdo. */
  tamanho?: "normal" | "compacto";
}

/**
 * Estado sem conteúdo, apresentado como cartão.
 *
 * O vazio é a primeira tela de quem acabou de instalar, então ele carrega
 * o mesmo acabamento dos cartões com dado: véu de gradiente do
 * `card-destaque`, emblema com anéis em onda e uma dica de rodapé que diz
 * o que esperar. Ver `.emblema-vazio` em `index.css`.
 */
export function EstadoVazio({
  emoji,
  icone,
  titulo,
  descricao,
  acao,
  dica,
  tamanho = "normal",
}: PropriedadesEstadoVazio) {
  const compacto = tamanho === "compacto";

  return (
    <div
      className={`
        card-destaque fade-in relative flex flex-col items-center overflow-hidden
        rounded-[18px] border border-borda-suave text-center
        shadow-[0_1px_2px_oklch(0_0_0/0.04),0_12px_28px_-18px_oklch(0_0_0/0.35)]
        ${compacto ? "px-5 pt-5" : "px-[22px] pt-[26px]"}
      `}
    >
      <Emblema emoji={emoji} icone={icone} compacto={compacto} />

      <h3
        className={`mt-3.5 font-semibold tracking-[-0.015em] text-texto-primario ${
          compacto ? "text-[15px]" : "text-lg"
        }`}
      >
        {titulo}
      </h3>

      <p
        className={`mt-1.5 max-w-[252px] text-[13.5px] leading-relaxed text-texto-secundario ${
          acao ? "mb-[18px]" : "mb-0"
        }`}
      >
        {descricao}
      </p>

      {acao}

      {/* A hairline sangra até a borda do cartão: o rodapé é uma faixa, não
          um parágrafo solto. Por isso a largura extra compensa o padding. */}
      {dica ? (
        <div
          className={`mt-[22px] border-t border-borda-suave pt-[11px] pb-3 text-xs text-texto-sutil ${
            compacto ? "w-[calc(100%+40px)]" : "w-[calc(100%+44px)]"
          }`}
        >
          {dica}
        </div>
      ) : (
        <div className={compacto ? "h-5" : "h-[26px]"} />
      )}
    </div>
  );
}

function Emblema({
  emoji,
  icone,
  compacto,
}: {
  emoji?: string;
  icone?: string;
  compacto: boolean;
}) {
  const caixa = compacto ? 76 : 96;
  const nucleo = compacto ? 46 : 54;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: caixa, height: caixa }}
      aria-hidden="true"
    >
      {/* Três ecos defasados: o negativo mantém o ciclo já em andamento na
          montagem, senão o primeiro anel só nasceria 1,6s depois. */}
      {["0s", "-1.6s", "-3.2s"].map((atraso) => (
        <span
          key={atraso}
          className="emblema-onda absolute rounded-full border border-borda"
          style={{
            width: caixa - 6,
            height: caixa - 6,
            animationDelay: atraso,
          }}
        />
      ))}

      <span
        className="emblema-vazio absolute rounded-full"
        style={{ width: caixa, height: caixa }}
      />

      <span
        className="emblema-nucleo relative grid place-items-center rounded-full border border-borda-suave bg-superficie text-texto-secundario shadow-[0_6px_16px_oklch(0_0_0/0.08),inset_0_1px_0_oklch(1_0_0/0.8)]"
        style={{ width: nucleo, height: nucleo }}
      >
        {emoji ? (
          <span className={compacto ? "text-xl leading-none" : "text-2xl leading-none"}>
            {emoji}
          </span>
        ) : icone ? (
          <Icone nome={icone} tamanho={compacto ? 20 : 24} />
        ) : null}
      </span>
    </div>
  );
}
