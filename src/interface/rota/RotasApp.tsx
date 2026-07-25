/* ═══════════════════════════════════════════
   Definição das rotas + wrappers de página
   ───────────────────────────────────────────
   Cada wrapper lê params (useParams/useSearchParams)
   e dados (useDados), repassando às páginas exatamente
   as props que elas já recebiam. As páginas continuam
   inalteradas.
   ═══════════════════════════════════════════ */

import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type Location,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { HomePage } from "@/interface/page/area-logada/HomePage";
import { HistoricoPage } from "@/interface/page/area-logada/HistoricoPage";
import { DetalheHistoricoPage } from "@/interface/page/area-logada/historico/DetalheHistoricoPage";
import { GraficoProgressaoPage } from "@/interface/page/area-logada/historico/GraficoProgressaoPage";
import { GerenciarPage } from "@/interface/page/area-logada/gerenciar/GerenciarPage";
import { ResumoProgramaPage } from "@/interface/page/area-logada/programa/ResumoProgramaPage";
import { EditorProgramaPage } from "@/interface/page/area-logada/gerenciar/EditorProgramaPage";
import { EditorFichaPage } from "@/interface/page/area-logada/gerenciar/EditorFichaPage";
import { ExecucaoTreinoPage } from "@/interface/page/area-logada/execucao/ExecucaoTreinoPage";
import { EstatisticasPage } from "@/interface/page/area-logada/estatisticas/EstatisticasPage";
import { DetalheSequenciaPage } from "@/interface/page/area-logada/sequencia/DetalheSequenciaPage";
import { OnboardingUsuarioPage } from "@/interface/page/onboarding/OnboardingUsuarioPage";
import { ToastProvider } from "@/interface/widget/toast";
import { TutorialProvider } from "@/interface/widget/tutorial/TutorialProvider";
import { OverlayTutorial } from "@/interface/widget/tutorial/OverlayTutorial";

import { AppLayout } from "./AppLayout";
import { useDados } from "./DadosProvider";
import { useNavegar } from "./useNavegar";
import { ROTAS, ehTabRaiz } from "./rotas";

/* ─── Wrappers de página ─── */

function HomeRota() {
  const { programas, fichas, historico, usuario } = useDados();
  const { aoNavegar } = useNavegar();
  return (
    <HomePage
      programas={programas}
      fichas={fichas}
      historico={historico}
      metaSemanal={usuario?.metaSemanal}
      aoNavegar={aoNavegar}
    />
  );
}

function HistoricoRota() {
  const { fichas, programas, historico } = useDados();
  const { aoNavegar } = useNavegar();
  const navigate = useNavigate();
  return (
    <HistoricoPage
      fichas={fichas}
      programas={programas}
      historico={historico}
      aoNavegar={aoNavegar}
      aoIrParaTreinos={() => navigate(ROTAS.treinos)}
    />
  );
}

function EstatisticasRota() {
  const { historico, exercicios } = useDados();
  const { aoNavegar } = useNavegar();
  return <EstatisticasPage historico={historico} exercicios={exercicios} aoNavegar={aoNavegar} />;
}

function GerenciarRota({ visualizacao }: { visualizacao?: "programas" | "fichas" | "exercicios" }) {
  const { aoNavegar } = useNavegar();
  return <GerenciarPage aoNavegar={aoNavegar} visualizacao={visualizacao} />;
}

function DetalheSequenciaRota() {
  const { historico } = useDados();
  const { aoNavegar } = useNavegar();
  return <DetalheSequenciaPage historico={historico} aoNavegar={aoNavegar} />;
}

function ResumoProgramaRota() {
  const { programaId } = useParams();
  const { programas, fichas, historico, exercicios } = useDados();
  const { aoNavegar } = useNavegar();
  return (
    <ResumoProgramaPage
      programaId={programaId ?? ""}
      programas={programas}
      fichas={fichas}
      historico={historico}
      exercicios={exercicios}
      aoNavegar={aoNavegar}
    />
  );
}

function DetalheHistoricoRota() {
  const { registroId } = useParams();
  const { fichas, historico, exercicios } = useDados();
  const { aoNavegar, aoVoltar } = useNavegar();
  return (
    <DetalheHistoricoPage
      registroId={registroId ?? ""}
      fichas={fichas}
      historico={historico}
      exercicios={exercicios}
      aoNavegar={aoNavegar}
      aoVoltar={aoVoltar}
    />
  );
}

function GraficoRota() {
  const { exercicioId } = useParams();
  const { exercicios, historico } = useDados();
  return (
    <GraficoProgressaoPage
      exercicioId={exercicioId ?? ""}
      exercicios={exercicios}
      historico={historico}
    />
  );
}

// Atende /programa/novo e /programa/:programaId/editar.
function EditorProgramaRota() {
  const { programaId } = useParams();
  const { aoNavegar, aoVoltar } = useNavegar();
  return <EditorProgramaPage programaId={programaId} aoVoltar={aoVoltar} aoNavegar={aoNavegar} />;
}

// Atende /ficha/nova e /ficha/:fichaId/editar (programaId vem por query).
function EditorFichaRota() {
  const { fichaId } = useParams();
  const [searchParams] = useSearchParams();
  const { aoVoltar } = useNavegar();
  return (
    <EditorFichaPage
      fichaId={fichaId}
      programaId={searchParams.get("programaId") ?? undefined}
      aoVoltar={aoVoltar}
    />
  );
}

// Tela cheia (fora do layout). Resolve a ficha e trata ausência.
function ExecucaoRota() {
  const { fichaId } = useParams();
  const { fichas, historico } = useDados();
  const navigate = useNavigate();
  const ficha = fichaId ? fichas.find((f) => f.id === fichaId) : null;

  if (!ficha) {
    return (
      <div className="min-h-[100dvh] bg-fundo px-4 py-8 text-center text-sm text-texto-secundario">
        Ficha não encontrada.
      </div>
    );
  }

  return (
    <ExecucaoTreinoPage
      ficha={ficha}
      historico={historico}
      aoVoltar={() => navigate(ROTAS.treinos, { replace: true })}
    />
  );
}

/* ─── Botão voltar nativo (Android/Capacitor) ─── */

function useBackButtonNativo() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const registro = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!ehTabRaiz(location.pathname)) {
        navigate(-1);
        return;
      }
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      void registro.then((listener) => listener.remove());
    };
  }, [navigate, location.pathname]);
}

/* ─── Componente raiz das rotas ─── */

function TelaCarregando() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-fundo px-6 text-center">
      <div>
        <img src="/kynori-mark-black.png" alt="" className="mx-auto mb-3 h-10 w-10 object-contain" />
        <p className="font-display text-lg font-semibold text-texto-primario">Kynori</p>
        <p className="mt-2 text-sm text-texto-secundario">Carregando seus treinos...</p>
      </div>
    </div>
  );
}

export function RotasApp() {
  const { usuario, carregando } = useDados();
  const location = useLocation();
  useBackButtonNativo();

  if (carregando) return <TelaCarregando />;
  if (!usuario) return <OnboardingUsuarioPage aoConcluir={() => {}} />;

  // "Rota de fundo": quando presente, os editores são apresentados como drawer
  // por cima da tela anterior (que continua renderizada). Sem ela (ex.: link
  // direto), os editores renderizam normalmente (tela cheia) pela rota principal.
  const background = (location.state as { background?: Location } | null)?.background;

  return (
    <ToastProvider>
      <TutorialProvider>
      <Routes location={background ?? location}>
        {/* Tela cheia, fora do shell */}
        <Route path={ROTAS.execucao} element={<ExecucaoRota />} />

        {/* Shell com cabeçalho + navegação inferior */}
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={ROTAS.treinos} replace />} />
          <Route path={ROTAS.treinos} element={<HomeRota />} />
          <Route path={ROTAS.historico} element={<HistoricoRota />} />
          <Route path={ROTAS.estatisticas} element={<EstatisticasRota />} />
          <Route path={ROTAS.gerenciar} element={<GerenciarRota visualizacao="programas" />} />
          <Route path={ROTAS.gerenciarFichas} element={<GerenciarRota visualizacao="fichas" />} />
          <Route path={ROTAS.gerenciarExercicios} element={<GerenciarRota visualizacao="exercicios" />} />
          <Route path={ROTAS.sequencia} element={<DetalheSequenciaRota />} />
          <Route path={ROTAS.detalheHistorico} element={<DetalheHistoricoRota />} />
          <Route path={ROTAS.grafico} element={<GraficoRota />} />
          <Route path={ROTAS.criarPrograma} element={<EditorProgramaRota />} />
          <Route path={ROTAS.editarPrograma} element={<EditorProgramaRota />} />
          <Route path={ROTAS.resumoPrograma} element={<ResumoProgramaRota />} />
          <Route path={ROTAS.criarFicha} element={<EditorFichaRota />} />
          <Route path={ROTAS.editarFicha} element={<EditorFichaRota />} />
        </Route>

        <Route path="*" element={<Navigate to={ROTAS.treinos} replace />} />
      </Routes>

      {/* Camada de overlay: os editores como drawer sobre a tela de fundo. */}
      {background && (
        <Routes>
          <Route path={ROTAS.criarPrograma} element={<EditorProgramaRota />} />
          <Route path={ROTAS.editarPrograma} element={<EditorProgramaRota />} />
          <Route path={ROTAS.criarFicha} element={<EditorFichaRota />} />
          <Route path={ROTAS.editarFicha} element={<EditorFichaRota />} />
        </Routes>
      )}

      {/* Acima de tudo (z-100): os editores entram como drawer em z-60. */}
      <OverlayTutorial />
      </TutorialProvider>
    </ToastProvider>
  );
}
