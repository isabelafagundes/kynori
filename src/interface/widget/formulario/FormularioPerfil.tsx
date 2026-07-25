/* ═══════════════════════════════════════════
   Formulário de Perfil — compartilhado entre
   onboarding (primeiro acesso) e edição
   ═══════════════════════════════════════════ */

import { useState } from "react";
import { Input } from "@/interface/widget/formulario/Input";
import { emojisAvatar, AVATAR_EMOJI_PADRAO } from "@/domain/usuario";

interface FormularioPerfilProps {
  nomeInicial?: string;
  avatarInicial?: string;
  textoBotao?: string;
  aoSalvar: (dados: { nome: string; avatarEmoji: string }) => void;
  /** Notifica cada alteração, para quem renderiza uma prévia ao vivo do
      avatar/nome fora do formulário (onboarding). */
  aoAlterar?: (dados: { nome: string; avatarEmoji: string }) => void;
  /** O onboarding mostra a prévia do cabeçalho acima do formulário; nesse
      caso o círculo grande do avatar aqui dentro vira redundante. */
  ocultarPreviaAvatar?: boolean;
}

export function FormularioPerfil({
  nomeInicial = "",
  avatarInicial = AVATAR_EMOJI_PADRAO,
  textoBotao = "Salvar",
  aoSalvar,
  aoAlterar,
  ocultarPreviaAvatar = false,
}: FormularioPerfilProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [avatarEmoji, setAvatarEmoji] = useState(avatarInicial);
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
    aoSalvar({ nome: nome.trim(), avatarEmoji });
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

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-texto-primario">
          Escolha um avatar
        </label>
        <div className="grid grid-cols-6 gap-2">
          {emojisAvatar.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => alterarAvatar(emoji)}
              aria-label={`Selecionar avatar ${emoji}`}
              aria-pressed={avatarEmoji === emoji}
              className={`
                relative aspect-square w-full
                rounded-lg border border-borda bg-superficie
                flex items-center justify-center
                text-2xl
                transition-all duration-200 ease-out
                hover:scale-105 hover:bg-superficie-suave
                focus:outline-none focus:ring-2 focus:ring-acento focus:ring-offset-2
                ${avatarEmoji === emoji
                  ? "ring-2 ring-offset-2 ring-acento bg-acento-suave"
                  : ""
                }
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

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
