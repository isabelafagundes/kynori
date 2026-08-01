import { Icone } from "@/interface/widget/svg/Icone";

type AbaNavegacao = "treinos" | "historico" | "estatisticas" | "gerenciar";

interface PropriedadesNavegacaoInferior {
  abaAtiva: AbaNavegacao;
  aoMudarAba: (aba: AbaNavegacao) => void;
}

/** Config única das abas — compartilhada com a navegação lateral (desktop). */
export const ABAS: { id: AbaNavegacao; rotulo: string; icone: string }[] = [
  { id: "treinos", rotulo: "Treinos", icone: "halter" },
  { id: "historico", rotulo: "Histórico", icone: "grafico" },
  { id: "estatisticas", rotulo: "Estatísticas", icone: "tendencia" },
  { id: "gerenciar", rotulo: "Programas", icone: "clipboard" },
];

export type { AbaNavegacao };

export function NavegacaoInferior({ abaAtiva, aoMudarAba }: PropriedadesNavegacaoInferior) {
  const renderizarAba = (aba: { id: AbaNavegacao; rotulo: string; icone: string }) => {
    const ativa = abaAtiva === aba.id;
    return (
      <button
        key={aba.id}
        role="tab"
        aria-selected={ativa}
        aria-label={aba.rotulo}
        onClick={() => aoMudarAba(aba.id)}
        className={`
          flex-1 flex flex-col items-center justify-center gap-0.5
          pt-2 pb-1 min-h-[52px]
          transition-colors duration-150 ease-out
          cursor-pointer
          focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-acento
          ${ativa
            ? "text-texto-primario"
            : "text-texto-sutil hover:text-texto-secundario"
          }
        `}
      >
        <Icone nome={aba.icone} tamanho={22} />
        <span className={`text-[11px] leading-tight ${ativa ? "font-semibold" : "font-medium"}`}>
          {aba.rotulo}
        </span>
        {ativa && (
          <div className="w-1 h-1 rounded-full bg-acento mt-0.5" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Scrim glass de largura total: o conteúdo da rolagem some suavemente
          atrás de um blur/gradiente no rodapé, cobrindo a área da navigation bar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 w-full lg:hidden"
        style={{
          height: "calc(var(--safe-bottom) + 96px)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "linear-gradient(to top, var(--color-fundo) 35%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 62%, transparent 100%)",
          maskImage: "linear-gradient(to top, #000 0%, #000 62%, transparent 100%)",
        }}
      />
      <nav
      className="
        fixed bottom-0 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-[480px] md:max-w-[768px] -translate-x-1/2
        bg-superficie/70 backdrop-blur-xl backdrop-saturate-150
        border border-borda-suave/60
        mb-[max(var(--safe-bottom),16px)]
        rounded-2xl
        shadow-md shadow-black/[0.04]
        lg:hidden
      "
      role="tablist"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch">
        {ABAS.map(renderizarAba)}
      </div>
      </nav>
    </>
  );
}
