import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type VarianteBotao = "primario" | "secundario" | "fantasma";
type TamanhoBotao = "normal" | "compacto";

interface PropriedadesBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  children: ReactNode;
  icone?: ReactNode;
  ocuparLarguraTotal?: boolean;
}

const estilosPorVariante: Record<VarianteBotao, string> = {
  primario:
    "bg-acento text-texto-invertido hover:bg-acento-hover hover:-translate-y-px active:scale-[0.97] active:translate-y-0 shadow-sm hover:shadow-md",
  secundario:
    "bg-superficie text-texto-primario border border-borda hover:bg-superficie-hover hover:-translate-y-px active:scale-[0.97] active:translate-y-0 shadow-sm hover:shadow-md",
  fantasma:
    "bg-transparent text-texto-secundario hover:bg-superficie-hover hover:text-texto-primario hover:-translate-y-px active:scale-[0.97] active:translate-y-0",
};

const estilosPorTamanho: Record<TamanhoBotao, string> = {
  normal: "px-4 py-3 min-h-[44px] rounded-[10px] text-sm gap-2",
  compacto: "px-3 py-2 rounded-[8px] text-xs gap-2",
};

/** Encaminha a ref para o <button> — o tutorial guiado precisa medir o
    elemento real para recortá-lo no overlay. */
export const Botao = forwardRef<HTMLButtonElement, PropriedadesBotao>(function Botao(
  {
    variante = "primario",
    tamanho = "normal",
    children,
    icone,
    ocuparLarguraTotal = false,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center
        font-medium
        transition-all duration-200 ease-out
        cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:translate-y-0
        ${ocuparLarguraTotal ? "w-full" : ""}
        ${estilosPorTamanho[tamanho]}
        ${estilosPorVariante[variante]}
        ${className}
      `}
      {...props}
    >
      {icone}
      {children}
    </button>
  );
});
