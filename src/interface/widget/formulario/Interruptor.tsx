interface InterruptorProps {
  ativo: boolean;
  aoAlternar: (proximo: boolean) => void;
  /** Rótulo acessível quando não há <label> associado visualmente. */
  rotulo: string;
}

/** Toggle on/off acessível (role="switch"), no visual do design system. */
export function Interruptor({ ativo, aoAlternar, rotulo }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
      onClick={() => aoAlternar(!ativo)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
        ativo ? "bg-acento" : "bg-borda-forte/40"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 transform rounded-full bg-superficie shadow-sm transition-transform ${
          ativo ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
