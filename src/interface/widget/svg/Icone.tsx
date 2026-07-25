import type { NomeIcone } from "@/domain/tipos";

/**
 * Mapa de paths SVG para ícones do sistema.
 * Combina ícones Heroicons (outline 24px) com ícones fitness customizados.
 * viewBox padrão: "0 0 24 24"
 */
const caminhoIcones: Record<string, { caminhos: string[]; preenchido?: boolean }> = {
  /* ── UI / Navegação (Heroicons Outline) ── */

  casa: {
    caminhos: [
      "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    ],
  },

  grafico: {
    caminhos: [
      "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    ],
  },

  usuario: {
    caminhos: [
      "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    ],
  },

  engrenagem: {
    caminhos: [
      "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    ],
  },

  relogio: {
    caminhos: ["M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"],
  },

  setaDireita: {
    caminhos: ["M8.25 4.5l7.5 7.5-7.5 7.5"],
  },

  setaEsquerda: {
    caminhos: ["M15.75 4.5l-7.5 7.5 7.5 7.5"],
  },

  setaBaixo: {
    caminhos: ["M19.5 8.25l-7.5 7.5-7.5-7.5"],
  },

  fechar: {
    caminhos: ["M6 18L18 6M6 6l12 12"],
  },

  busca: {
    caminhos: ["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"],
  },

  editar: {
    caminhos: [
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    ],
  },

  lixeira: {
    caminhos: [
      "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
    ],
  },

  clipboard: {
    caminhos: [
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    ],
  },

  copiar: {
    caminhos: [
      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
    ],
  },

  trocar: {
    caminhos: [
      "M7.5 7.5h10.75m0 0l-3-3m3 3l-3 3",
      "M16.5 16.5H5.75m0 0l3 3m-3-3l3-3",
    ],
  },

  compartilhar: {
    caminhos: [
      "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 6.55-3.819m-6.55 6.005 6.55 3.819m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-9.819a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z",
    ],
  },

  imagem: {
    caminhos: [
      "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    ],
  },

  mais: {
    caminhos: ["M12 4.5v15m7.5-7.5h-15"],
  },

  reproduzir: {
    caminhos: [
      "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z",
    ],
    preenchido: true,
  },

  calendario: {
    caminhos: [
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    ],
  },

  listaVerificacao: {
    caminhos: [
      "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    ],
  },

  check: {
    caminhos: ["M4.5 12.75l6 6 9-13.5"],
  },

  tendencia: {
    caminhos: [
      "M3.75 20.25L9 14.25l3.75 3 4.5-5.25L21 7.5M17.25 7.5H21v3.75",
    ],
  },

  pausar: {
    caminhos: ["M8 5v14", "M16 5v14"],
  },

  nota: {
    caminhos: [
      "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z",
      "M14 3v5h5",
    ],
  },

  sair: {
    caminhos: [
      "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4",
      "M16 17l5-5-5-5",
      "M21 12H9",
    ],
  },

  /* ── Fitness / Fichas ── */

  halter: {
    caminhos: [
      "M6.5 8.5v7M17.5 8.5v7M4 9.5v5a1 1 0 001 1h1v-7H5a1 1 0 00-1 1zM18 8.5h1a1 1 0 011 1v5a1 1 0 01-1 1h-1v-7zM6.5 12h11",
    ],
  },

  braco: {
    caminhos: [
      "M7 18c0-2 1-3 2.5-4.5S12 11 12 8.5C12 6.5 11 4 8.5 4M8.5 4C10 4 13 5 14 8c1 3 2.5 4 4 4.5M14 8c-.5 1.5-1 4 0 5.5s3 2.5 4 2.5M7 18c1 0 3-.5 4.5-2",
    ],
  },

  humano: {
    caminhos: [
      "M12 4.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z",
      "M8.25 9.25L9.5 6.5h5l1.25 2.75M9.5 6.75L7 13m7.5-6.25L17 13M10 11.5l-.75 5.25L7.5 22m6.5-10.5l.75 5.25L16.5 22",
    ],
  },

  raio: {
    caminhos: ["M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"],
    preenchido: true,
  },

  fogo: {
    caminhos: [
      "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z",
      "M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z",
    ],
    preenchido: true,
  },

  coracao: {
    caminhos: [
      "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    ],
    preenchido: true,
  },

  estrela: {
    caminhos: [
      "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    ],
    preenchido: true,
  },

  trofeu: {
    caminhos: [
      "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 2.625 2.625 0 0022.5 8.25V6.75a2.25 2.25 0 00-2.25-2.25h-.894M7.5 18.75v-4.5a3.375 3.375 0 01-3.375-3.375A2.625 2.625 0 011.5 8.25V6.75A2.25 2.25 0 013.75 4.5h.894M7.5 18.75h9M12 4.5v14.25",
    ],
  },

  alvo: {
    caminhos: [
      "M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z",
      "M12 6a6 6 0 100 12 6 6 0 000-12z",
      "M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z",
    ],
  },

  montanha: {
    caminhos: [
      "M3 19.5l6.75-9 4.5 4.5 3-3L21 19.5H3z",
    ],
    preenchido: true,
  },

  corrida: {
    caminhos: [
      "M13.5 5.5a2 2 0 100-4 2 2 0 000 4zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A7.04 7.04 0 0017 13v-2a5.02 5.02 0 01-3.1-1.6L12.2 7a1.98 1.98 0 00-1.7-1c-.3 0-.5.1-.8.2L5 8.3V13h2V9.6l2.8-1.7z",
    ],
    preenchido: true,
  },
};

interface PropriedadesIcone {
  nome: string;
  tamanho?: number;
  className?: string;
}

export function Icone({ nome, tamanho = 24, className = "" }: PropriedadesIcone) {
  const icone = caminhoIcones[nome];

  if (!icone) {
    return (
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">?</text>
      </svg>
    );
  }

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={icone.preenchido ? "currentColor" : "none"}
      stroke={icone.preenchido ? "none" : "currentColor"}
      strokeWidth={icone.preenchido ? 0 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icone.caminhos.map((caminho, indice) => (
        <path key={indice} d={caminho} />
      ))}
    </svg>
  );
}

/**
 * Ícone de alça de arrastar (grip de 6 pontos).
 * Renderiza círculos preenchidos — por isso não usa o mapa de paths do `Icone`.
 */
export function IconeArrastar({
  tamanho = 20,
  className = "",
}: {
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {[9, 15].flatMap((cx) =>
        [6, 12, 18].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />
        ))
      )}
    </svg>
  );
}

/** Retorna o ícone da ficha pelo NomeIcone */
export function IconeFicha({ nome, tamanho = 20, className = "", emoji }: { nome: NomeIcone; tamanho?: number; className?: string; emoji?: string }) {
  // Se emoji fornecido, renderiza emoji; caso contrário, usa ícone SVG
  if (emoji) {
    return (
      <span
        className={className}
        style={{ fontSize: `${tamanho}px`, lineHeight: 1 }}
        aria-hidden="true"
      >
        {emoji}
      </span>
    );
  }
  return <Icone nome={nome} tamanho={tamanho} className={className} />;
}
