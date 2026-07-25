/* ═══════════════════════════════════════════
   Estado do Tutorial Guiado

   Segue o mesmo padrão do UsuarioManager:
   singleton + listeners + persistência local.
   ═══════════════════════════════════════════ */

import { STORAGE_KEYS } from "@/constants";
import {
  ESTADO_TUTORIAL_INICIAL,
  PASSOS_TUTORIAL,
  type EstadoTutorial,
} from "@/domain/tutorial";
import { appModule } from "@/interface/configuration/module/app.module";

export class TutorialManager {
  private static instancia: TutorialManager;
  private estado: EstadoTutorial;
  private listeners: Set<() => void>;
  private inicializado: boolean;

  private constructor() {
    // Começa "concluído" para que nada apareça antes de carregar do
    // armazenamento — o overlay nunca pisca em quem já terminou.
    this.estado = { passo: 0, concluido: true };
    this.listeners = new Set();
    this.inicializado = false;
  }

  static obterInstancia(): TutorialManager {
    if (!TutorialManager.instancia) {
      TutorialManager.instancia = new TutorialManager();
    }
    return TutorialManager.instancia;
  }

  inscrever(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async inicializar(): Promise<void> {
    if (this.inicializado) return;
    this.estado = await this.carregar();
    this.inicializado = true;
    this.notificar();
  }

  obterEstado(): EstadoTutorial {
    return this.estado;
  }

  /** Em andamento: nem concluído, nem além do último passo. */
  estaAtivo(): boolean {
    return !this.estado.concluido && this.estado.passo < PASSOS_TUTORIAL.length;
  }

  /** Chamado ao aceitar o tutorial no fim do wizard de onboarding. */
  iniciar(): void {
    this.definir({ passo: 0, concluido: false });
  }

  irParaPasso(indice: number): void {
    if (this.estado.concluido) return;
    const limitado = Math.max(0, Math.min(indice, PASSOS_TUTORIAL.length - 1));
    if (limitado === this.estado.passo) return;
    this.definir({ ...this.estado, passo: limitado });
  }

  avancar(): void {
    if (this.estado.concluido) return;
    const proximo = this.estado.passo + 1;
    if (proximo >= PASSOS_TUTORIAL.length) {
      this.encerrar();
      return;
    }
    this.definir({ passo: proximo, concluido: false });
  }

  /** Sair no meio ou concluir — em ambos o tutorial não reabre sozinho. */
  encerrar(): void {
    this.definir({ ...this.estado, concluido: true });
  }

  /** Retomada pelo card da home: volta a rodar do passo onde parou. */
  retomar(): void {
    this.definir({ ...this.estado, concluido: false });
  }

  private definir(estado: EstadoTutorial): void {
    this.estado = estado;
    void this.salvar(estado);
    this.notificar();
  }

  private notificar(): void {
    this.listeners.forEach((listener) => listener());
  }

  private async carregar(): Promise<EstadoTutorial> {
    try {
      const salvo = await appModule.armazenamento.obter(STORAGE_KEYS.TUTORIAL);
      if (!salvo) return { ...ESTADO_TUTORIAL_INICIAL, concluido: true };

      const dados = JSON.parse(salvo) as Partial<EstadoTutorial>;
      const passo =
        typeof dados.passo === "number" && dados.passo >= 0
          ? Math.min(dados.passo, PASSOS_TUTORIAL.length - 1)
          : 0;
      return { passo, concluido: dados.concluido !== false };
    } catch {
      // Falha de leitura não pode fazer o tutorial reaparecer para quem já usa.
      return { ...ESTADO_TUTORIAL_INICIAL, concluido: true };
    }
  }

  private async salvar(estado: EstadoTutorial): Promise<void> {
    try {
      await appModule.armazenamento.definir(
        STORAGE_KEYS.TUTORIAL,
        JSON.stringify(estado),
      );
    } catch {
      // Falha no armazenamento não deve quebrar o app.
    }
  }
}

export const tutorialManager = TutorialManager.obterInstancia();
