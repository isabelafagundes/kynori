import { useEffect, useRef, useState } from "react";

interface ToastDesfazerProps {
  mensagem: string | null;
  aoDesfazer: () => void;
  aoFechar: () => void;
}

const TEMPO_VISIVEL = 3000;
const TEMPO_SAIDA = 200;

export function ToastDesfazer({ mensagem, aoDesfazer, aoFechar }: ToastDesfazerProps) {
  if (!mensagem) return null;
  // `key` remonta o conteúdo a cada nova mensagem, reiniciando a animação de
  // entrada e o timer sem precisar resetar estado manualmente.
  return (
    <ToastConteudo
      key={mensagem}
      mensagem={mensagem}
      aoDesfazer={aoDesfazer}
      aoFechar={aoFechar}
    />
  );
}

function ToastConteudo({
  mensagem,
  aoDesfazer,
  aoFechar,
}: {
  mensagem: string;
  aoDesfazer: () => void;
  aoFechar: () => void;
}) {
  const [saindo, setSaindo] = useState(false);
  // Mantém a referência atual sem recriar o timer a cada render do pai
  // (o cronômetro do treino re-renderiza a cada segundo).
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    const idSaida = window.setTimeout(() => setSaindo(true), TEMPO_VISIVEL);
    const idFechar = window.setTimeout(
      () => aoFecharRef.current(),
      TEMPO_VISIVEL + TEMPO_SAIDA
    );
    return () => {
      window.clearTimeout(idSaida);
      window.clearTimeout(idFechar);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-[max(calc(var(--safe-top)+16px),16px)] left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 px-4"
    >
      <div
        className={`pointer-events-auto mx-auto flex w-fit items-center gap-3 rounded-full border border-borda-suave bg-texto-primario px-4 py-2 text-sm text-texto-invertido shadow-md ${
          saindo ? "animate-toast-out" : "animate-toast-in"
        }`}
      >
        <span>{mensagem}</span>
        <button
          type="button"
          onClick={() => {
            aoDesfazer();
            aoFechar();
          }}
          className="text-sm font-medium underline-offset-2 hover:underline"
        >
          desfazer
        </button>
      </div>
    </div>
  );
}
