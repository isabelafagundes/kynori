/* ═══════════════════════════════════════════
   Provider do tutorial guiado

   Mantém o passo atual e um registro dos alvos
   montados. As telas reais só marcam seus
   elementos com useAlvoTutorial(); quem decide
   o que destacar é o overlay.
   ═══════════════════════════════════════════ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { tutorialManager } from "@/application/state/tutorial.state";
import {
  PASSOS_TUTORIAL,
  type AlvoTutorial,
  type PassoTutorial,
} from "@/domain/tutorial";

interface ContextoTutorial {
  ativo: boolean;
  indicePasso: number;
  passo: PassoTutorial | null;
  /** Elemento do alvo do passo atual, quando montado. */
  elementoAlvo: HTMLElement | null;
  registrarAlvo: (alvo: AlvoTutorial, elemento: HTMLElement | null) => void;
  avancar: () => void;
  encerrar: () => void;
}

const Contexto = createContext<ContextoTutorial | null>(null);

export function useTutorial(): ContextoTutorial {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useTutorial deve ser usado dentro de <TutorialProvider>");
  return ctx;
}

/**
 * Marca um elemento como alvo de um passo do tutorial.
 * Devolve uma ref callback — basta espalhar no elemento a destacar.
 */
export function useAlvoTutorial(alvo: AlvoTutorial) {
  const { registrarAlvo } = useTutorial();
  return useCallback(
    (elemento: HTMLElement | null) => registrarAlvo(alvo, elemento),
    [registrarAlvo, alvo],
  );
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState(() => tutorialManager.obterEstado());
  // Alvos montados no momento. Guardado em ref + versão para não recriar o
  // callback de registro a cada mudança (ele vai para dentro de useCallback
  // das telas e não pode mudar de identidade a toda renderização).
  const alvosRef = useRef(new Map<AlvoTutorial, HTMLElement>());
  const [versaoAlvos, setVersaoAlvos] = useState(0);

  useEffect(() => {
    const cancelar = tutorialManager.inscrever(() =>
      setEstado(tutorialManager.obterEstado()),
    );
    void tutorialManager.inicializar();
    return cancelar;
  }, []);

  const registrarAlvo = useCallback(
    (alvo: AlvoTutorial, elemento: HTMLElement | null) => {
      const mapa = alvosRef.current;
      if (elemento) {
        if (mapa.get(alvo) === elemento) return;
        mapa.set(alvo, elemento);
      } else {
        if (!mapa.has(alvo)) return;
        mapa.delete(alvo);
      }
      setVersaoAlvos((v) => v + 1);
    },
    [],
  );

  const ativo = !estado.concluido && estado.passo < PASSOS_TUTORIAL.length;
  const passo = ativo ? PASSOS_TUTORIAL[estado.passo] ?? null : null;

  const elementoAlvo = useMemo(() => {
    void versaoAlvos; // recalcula quando o registro muda
    return passo ? alvosRef.current.get(passo.alvo) ?? null : null;
  }, [passo, versaoAlvos]);

  // Avanço natural: nos passos que levam a outra tela, o alvo seguinte
  // aparecer significa que a pessoa agiu sozinha (tocou no botão em vez de
  // usar o balão) — o tutorial acompanha em vez de ficar preso.
  useEffect(() => {
    if (!ativo || !passo || !passo.avancaComProximoAlvo) return;
    const proximo = PASSOS_TUTORIAL[estado.passo + 1];
    if (proximo && alvosRef.current.has(proximo.alvo)) {
      tutorialManager.avancar();
    }
  }, [ativo, passo, estado.passo, versaoAlvos]);

  const valor = useMemo<ContextoTutorial>(
    () => ({
      ativo,
      indicePasso: estado.passo,
      passo,
      elementoAlvo,
      registrarAlvo,
      avancar: () => tutorialManager.avancar(),
      encerrar: () => tutorialManager.encerrar(),
    }),
    [ativo, estado.passo, passo, elementoAlvo, registrarAlvo],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
