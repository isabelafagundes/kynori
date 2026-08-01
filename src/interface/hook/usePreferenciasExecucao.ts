import { useSyncExternalStore } from "react";
import {
  preferenciasManager,
  type PreferenciasExecucao,
} from "@/application/state/preferencias.state";

/** Assina o gerenciador de preferências e re-renderiza quando algo muda. */
export function usePreferenciasExecucao(): PreferenciasExecucao {
  return useSyncExternalStore(
    (callback) => preferenciasManager.inscrever(callback),
    () => preferenciasManager.obter(),
    () => preferenciasManager.obter()
  );
}
