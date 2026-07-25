/* ═══════════════════════════════════════════
   Onboarding · Etapa 1 — Perfil
   Reaproveita o FormularioPerfil (o mesmo de
   "Editar perfil") dentro da casca do wizard.
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { FormularioPerfil } from "@/interface/widget/formulario/FormularioPerfil";
import { AVATAR_EMOJI_PADRAO } from "@/domain/usuario";
import { CascaOnboarding } from "./CascaOnboarding";

interface PropriedadesPerfilPage {
  passo: number;
  total: number;
  nomeInicial: string;
  avatarInicial: string;
  aoVoltar: () => void;
  aoContinuar: (dados: { nome: string; avatarEmoji: string }) => void;
}

/** Prévia do CabecalhoApp — o único lugar onde nome e avatar aparecem hoje.
    Mantida fiel de propósito: prometer uma tela que não existe seria pior
    que não ter prévia. */
function PreviaCabecalho({ avatarEmoji }: { avatarEmoji: string }) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex items-center justify-between gap-3 rounded-2xl border border-borda-suave/60 bg-superficie/70 px-3 py-2.5 shadow-sm shadow-black/[0.04] backdrop-blur-xl"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-white p-[3px]">
            <img
              src="/kynori-mark-black.png"
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
          <span className="font-display text-[11.5px] font-bold uppercase tracking-[0.08em] text-texto-primario">
            Kynori
          </span>
          <span className="text-[9px] text-texto-sutil/30">/</span>
          <span className="truncate font-display text-xs font-semibold text-texto-sutil">
            Início
          </span>
        </div>

        <span className="relative shrink-0">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-acento-suave text-[15px] ring-[1.5px] ring-borda-suave">
            {avatarEmoji}
          </span>
          <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-acento ring-[1.5px] ring-superficie" />
        </span>
      </div>
      <p className="mt-1.5 text-right text-[11px] text-texto-sutil">
        É assim que seu avatar aparece no app
      </p>
    </div>
  );
}

export function PerfilPage({
  passo,
  total,
  nomeInicial,
  avatarInicial,
  aoVoltar,
  aoContinuar,
}: PropriedadesPerfilPage) {
  // A prévia acompanha o emoji escolhido em tempo real; sem isso ela mostraria
  // sempre o avatar inicial enquanto a pessoa troca de opção logo abaixo.
  const [avatarPrevia, setAvatarPrevia] = useState(
    avatarInicial || AVATAR_EMOJI_PADRAO
  );

  return (
    <CascaOnboarding
      progresso={{ passo, total }}
      aoVoltar={aoVoltar}
    >
      <div className="reveal-up">
        <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-texto-primario">
          Prazer,
          <br />
          como te chamo?
        </h1>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-texto-secundario">
          Só o básico. Dá pra mudar quando quiser.
        </p>
      </div>

      <div className="reveal-up" style={{ animationDelay: "70ms" }}>
        <PreviaCabecalho avatarEmoji={avatarPrevia} />
      </div>

      <div className="reveal-up" style={{ animationDelay: "140ms" }}>
        <FormularioPerfil
          nomeInicial={nomeInicial}
          avatarInicial={avatarInicial}
          textoBotao="Continuar"
          aoSalvar={aoContinuar}
          aoAlterar={({ avatarEmoji }) => setAvatarPrevia(avatarEmoji)}
          ocultarPreviaAvatar
        />
      </div>
    </CascaOnboarding>
  );
}
