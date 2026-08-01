/* ═══════════════════════════════════════════
   Onboarding — Primeiro acesso ao Kynori

   Orquestra as etapas da fase de perguntas:
   boas-vindas → perfil → meta semanal → contrato.
   O perfil só é persistido no fim, para que o
   botão voltar não deixe um usuário meio criado.
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { usuarioManager } from "@/application/state/usuario.state";
import { tutorialManager } from "@/application/state/tutorial.state";
import { AVATAR_EMOJI_PADRAO } from "@/domain/usuario";
import { BoasVindasPage } from "./BoasVindasPage";
import { PerfilPage } from "./PerfilPage";
import { MetaSemanalPage } from "./MetaSemanalPage";
import { TemaPage } from "./TemaPage";
import { ContratoTutorialPage } from "./ContratoTutorialPage";

interface OnboardingUsuarioPageProps {
  aoConcluir: () => void;
}

type Etapa = "boas-vindas" | "perfil" | "meta" | "tema" | "contrato";

/** Etapas com barra de progresso, na ordem em que aparecem. */
const ETAPAS_WIZARD: Etapa[] = ["perfil", "meta", "tema", "contrato"];
const TOTAL_ETAPAS = ETAPAS_WIZARD.length;

interface RespostasOnboarding {
  nome: string;
  avatarEmoji: string;
  metaSemanal?: number;
}

export function OnboardingUsuarioPage({
  aoConcluir,
}: OnboardingUsuarioPageProps) {
  const [etapa, setEtapa] = useState<Etapa>("boas-vindas");
  const [respostas, setRespostas] = useState<RespostasOnboarding>({
    nome: "",
    avatarEmoji: AVATAR_EMOJI_PADRAO,
  });

  const indiceDoPasso = ETAPAS_WIZARD.indexOf(etapa);

  /** Persiste o perfil e libera a área logada. `comTutorial` decide se a fase
      prática (os balões sobre as telas reais) começa a rodar. */
  function concluir(dados: RespostasOnboarding, comTutorial: boolean) {
    usuarioManager.definirUsuario({
      nome: dados.nome,
      avatarEmoji: dados.avatarEmoji,
      metaSemanal: dados.metaSemanal,
    });
    if (comTutorial) tutorialManager.iniciar();
    else tutorialManager.encerrar();
    aoConcluir();
  }

  if (etapa === "boas-vindas") {
    return <BoasVindasPage aoComecar={() => setEtapa("perfil")} />;
  }

  if (etapa === "perfil") {
    return (
      <PerfilPage
        passo={indiceDoPasso}
        total={TOTAL_ETAPAS}
        nomeInicial={respostas.nome}
        avatarInicial={respostas.avatarEmoji}
        aoVoltar={() => setEtapa("boas-vindas")}
        aoContinuar={({ nome, avatarEmoji }) => {
          setRespostas((atual) => ({ ...atual, nome, avatarEmoji }));
          setEtapa("meta");
        }}
      />
    );
  }

  if (etapa === "meta") {
    return (
      <MetaSemanalPage
        passo={indiceDoPasso}
        total={TOTAL_ETAPAS}
        metaInicial={respostas.metaSemanal}
        aoVoltar={() => setEtapa("perfil")}
        aoContinuar={(metaSemanal) => {
          setRespostas((atual) => ({ ...atual, metaSemanal }));
          setEtapa("tema");
        }}
      />
    );
  }

  if (etapa === "tema") {
    return (
      <TemaPage
        passo={indiceDoPasso}
        total={TOTAL_ETAPAS}
        aoVoltar={() => setEtapa("meta")}
        aoContinuar={() => setEtapa("contrato")}
      />
    );
  }

  return (
    <ContratoTutorialPage
      passo={indiceDoPasso}
      total={TOTAL_ETAPAS}
      primeiroNome={respostas.nome.trim().split(/\s+/)[0] ?? ""}
      aoVoltar={() => setEtapa("tema")}
      aoIniciarTutorial={() => concluir(respostas, true)}
      aoPularTutorial={() => concluir(respostas, false)}
    />
  );
}
