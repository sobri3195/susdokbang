import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { CausalPage } from "@/pages/causal-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { JamTerbangPage, McuPage, PsikotesPage } from "@/pages/data-pages";
import { DemoSidangPage } from "@/pages/demo-sidang-page";
import { DistributedSystemPage } from "@/pages/distributed-system-page";
import { ExecutiveDashboardPage } from "@/pages/executive-dashboard-page";
import { ImportHistoryPage } from "@/pages/import-history-page";
import { ImportPage } from "@/pages/import-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { PenerbangDetailPage } from "@/pages/penerbang-detail-page";
import { PenerbangPage } from "@/pages/penerbang-page";
import { PreAssessmentPage } from "@/pages/pre-assessment-page";
import { QualityGatePage } from "@/pages/quality-gate-page";
import { ReportsPage } from "@/pages/reports-page";
import { SettingsPage } from "@/pages/settings-page";
import { StyleGuidePage } from "@/pages/style-guide-page";
import { SurvivalPage } from "@/pages/survival-page";
import { ValidationHistoryPage } from "@/pages/validation-history-page";
import { ValidationPage } from "@/pages/validation-page";
import { useAuthStore } from "@/store/auth-store";

function ProtectedRoute() {
  const token = useAuthStore.getState().token;
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "eksekutif", element: <ExecutiveDashboardPage /> },
      { path: "demo-sidang", element: <DemoSidangPage /> },
      { path: "penerbang", element: <PenerbangPage /> },
      { path: "penerbang/:id", element: <PenerbangDetailPage /> },
      { path: "pemeriksaan/pre-assessment", element: <PreAssessmentPage /> },
      { path: "data/mcu", element: <McuPage /> },
      { path: "data/psikotes", element: <PsikotesPage /> },
      { path: "data/jam-terbang", element: <JamTerbangPage /> },
      { path: "import", element: <ImportPage /> },
      { path: "import/history", element: <ImportHistoryPage /> },
      { path: "analitik/survival", element: <SurvivalPage /> },
      { path: "analitik/quality-gate", element: <QualityGatePage /> },
      { path: "analitik/validasi", element: <ValidationPage /> },
      { path: "analitik/validasi/history", element: <ValidationHistoryPage /> },
      { path: "analitik/kausal", element: <CausalPage /> },
      { path: "laporan", element: <ReportsPage /> },
      { path: "pengaturan", element: <SettingsPage /> },
      { path: "sistem/terdistribusi", element: <DistributedSystemPage /> },
      { path: "style-guide", element: <StyleGuidePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
