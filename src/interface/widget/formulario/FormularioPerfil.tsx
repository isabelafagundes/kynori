/* ═══════════════════════════════════════════
   Formulário de Perfil — compartilhado entre
   onboarding (primeiro acesso) e edição

   No onboarding a grade de avatares fica exposta
   (escolher é parte do momento). Na edição ela
   se recolhe num combo (avatarRecolhido) — abrir
   só quando quer trocar tira a poluição da tela.
   ═══════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { Input } from "@/interface/widget/formulario/Input";
import { Icone } from "@/interface/widget/svg/Icone";
import {
  emojisAvatar,
  AVATAR_EMOJI_PADRAO,
  OPCOES_META_SEMANAL,
} from "@/domain/usuario";

interface FormularioPerfilProps {
  nomeInicial?: string;
  avatarInicial?: string;
  textoBotao?: string;
  aoSalvar: (dados: {
    nome: string;
    avatarEmoji: string;
    metaSemanal?: number;
  }) => void;
  /** Notifica cada alteração, para quem renderiza uma prévia ao vivo do
      avatar/nome fora do formulário (onboarding). */
  aoAlterar?: (dados: { nome: string; avatarEmoji: string }) => void;
  /** O onboarding mostra a prévia do cabeçalho acima do formulário; nesse
      caso o círculo grande do avatar aqui dentro vira redundante. */
  ocultarPreviaAvatar?: boolean;
  /** Mostra o seletor de meta semanal. No onboarding a meta é uma etapa
      própria; aqui (edição de perfil) ela entra no mesmo formulário. */
  mostrarMetaSemanal?: boolean;
  metaSemanalInicial?: number;
  /** Recolhe a grade de avatares num combo com popover, em vez de expor os
      24 emojis. Usado na edição, onde a grade exposta polui a tela. */
  avatarRecolhido?: boolean;
}

/** Grade dos 24 emojis. Reaproveitada exposta (onboarding) e dentro do
    popover do combo (edição). */
function GradeAvatares({
  valor,
  aoEscolher,
  comCheck = false,
}: {
  valor: string;
  aoEscolher: (emoji: string) => void;
  comCheck?: boolean;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {emojisAvatar.map((emoji) => {
        const selecionado = valor === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => aoEscolher(emoji)}
            aria-label={`Selecionar avatar ${emoji}`}
            aria-pressed={selecionado}
            className={`
              relative aspect-square w-full
              rounded-lg border border-borda bg-superficie
              flex items-center justify-center
              text-2xl
              transition-all duration-200 ease-out
              hover:scale-105 hover:bg-superficie-suave
              focus:outline-none focus:ring-2 focus:ring-acento focus:ring-offset-2
              ${selecionado ? "ring-2 ring-offset-2 ring-acento bg-acento-suave" : ""}
            `}
          >
            {emoji}
            {comCheck && selecionado && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-acento text-texto-invertido">
                <Icone nome="check" tamanho={10} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Combo do avatar: mostra o emoji atual e abre um popover com a grade.
    Fecha no Esc, no clique fora e ao escolher; devolve o foco ao gatilho. */
function ComboAvatar({
  avatar,
  aoEscolher,
}: {
  avatar: string;
  aoEscolher: (emoji: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    // Ao abrir, foca o avatar já selecionado para navegação por teclado.
    painelRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.focus();

    function aoClicarFora(evento: MouseEvent) {
      if (!wrapperRef.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        gatilhoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function escolher(emoji: string) {
    aoEscolher(emoji);
    setAberto(false);
    gatilhoRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <label id="rotulo-avatar" className="text-sm font-medium text-texto-primario">
        Avatar
      </label>
      <div ref={wrapperRef} className="relative">
        <button
          ref={gatilhoRef}
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-labelledby="rotulo-avatar"
          className={`flex w-full items-center gap-3 rounded-[10px] border bg-superficie px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
            aberto
              ? "border-acento ring-1 ring-acento"
              : "border-borda hover:bg-superficie-suave"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-acento-suave text-lg">
            {avatar}
          </span>
          <span className="flex-1 text-left text-sm text-texto-secundario">
            Toque pra trocar
          </span>
          <span
            className={`text-texto-sutil transition-transform ${aberto ? "rotate-180" : ""}`}
          >
            <Icone nome="setaBaixo" tamanho={18} />
          </span>
        </button>

        {aberto && (
          <div
            ref={painelRef}
            role="dialog"
            aria-label="Escolha um avatar"
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[280px] overflow-y-auto rounded-[14px] border border-borda bg-superficie p-3 shadow-2xl shadow-black/20"
          >
            <GradeAvatares valor={avatar} aoEscolher={escolher} comCheck />
          </div>
        )}
      </div>
    </div>
  );
}

export function FormularioPerfil({
  nomeInicial = "",
  avatarInicial = AVATAR_EMOJI_PADRAO,
  textoBotao = "Salvar",
  aoSalvar,
  aoAlterar,
  ocultarPreviaAvatar = false,
  mostrarMetaSemanal = false,
  metaSemanalInicial,
  avatarRecolhido = false,
}: FormularioPerfilProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [avatarEmoji, setAvatarEmoji] = useState(avatarInicial);
  const [metaSemanal, setMetaSemanal] = useState<number | undefined>(
    metaSemanalInicial
  );
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const nomeVazio = nome.trim().length === 0;

  function alterarNome(valor: string) {
    setNome(valor);
    aoAlterar?.({ nome: valor, avatarEmoji });
  }

  function alterarAvatar(emoji: string) {
    setAvatarEmoji(emoji);
    aoAlterar?.({ nome, avatarEmoji: emoji });
  }

  function handleSalvar() {
    setTentouSalvar(true);
    if (nomeVazio) return;
    aoSalvar({ nome: nome.trim(), avatarEmoji, metaSemanal });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Preview do avatar selecionado */}
      {!ocultarPreviaAvatar && (
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-acento-suave text-4xl ring-[1.5px] ring-borda-suave">
            {avatarEmoji}
          </div>
        </div>
      )}

      <Input
        label="Como podemos te chamar?"
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => alterarNome(e.target.value)}
        erro={tentouSalvar && nomeVazio ? "Digite seu nome" : undefined}
      />

      {avatarRecolhido ? (
        <ComboAvatar avatar={avatarEmoji} aoEscolher={alterarAvatar} />
      ) : (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-texto-primario">
            Escolha um avatar
          </label>
          <GradeAvatares valor={avatarEmoji} aoEscolher={alterarAvatar} />
        </div>
      )}

      {mostrarMetaSemanal && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-texto-primario">
              Meta de treinos por semana
            </label>
            <p className="mt-1 text-xs leading-relaxed text-texto-sutil">
              Vira o denominador da sua sequência na home. Não muda seu treino.
            </p>
          </div>
          <div
            className="flex gap-2"
            role="radiogroup"
            aria-label="Meta de treinos por semana"
          >
            {OPCOES_META_SEMANAL.map((opcao) => {
              const selecionada = metaSemanal === opcao;
              return (
                <button
                  key={opcao}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  onClick={() =>
                    setMetaSemanal(selecionada ? undefined : opcao)
                  }
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] border-[1.5px] py-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
                    selecionada
                      ? "border-acento bg-acento text-texto-invertido"
                      : "border-borda bg-superficie text-texto-primario hover:bg-superficie-suave"
                  }`}
                >
                  <span className="font-display text-[20px] font-bold leading-none tabular-nums">
                    {opcao}
                  </span>
                  <span className="text-[9.5px] opacity-65">dias</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-texto-sutil">
            {metaSemanal === undefined
              ? "Sem meta definida: a sequência conta sobre os 7 dias da semana."
              : "Toque de novo na opção marcada pra remover a meta."}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSalvar}
        className="
          w-full rounded-[10px] bg-acento px-4 py-3.5
          text-base font-semibold text-texto-invertido
          transition-all duration-150
          hover:bg-acento-hover active:scale-[0.99]
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento
        "
      >
        {textoBotao}
      </button>
    </div>
  );
}
