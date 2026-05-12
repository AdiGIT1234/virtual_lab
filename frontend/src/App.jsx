import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import PageLoader from "./components/PageLoader";

const LandingPage     = lazy(() => import("./pages/LandingPage"));
const ExperimentPage  = lazy(() => import("./pages/ExperimentPage"));
const SandboxPage     = lazy(() => import("./pages/SandboxPage"));
const ARLabPage       = lazy(() => import("./pages/ARLabPage"));
const ReferencePage   = lazy(() => import("./pages/ReferencePage"));
const DashboardPage   = lazy(() => import("./pages/DashboardPage"));
const AdminControls   = lazy(() => import("./pages/AdminControls"));

function SessionExpiredBanner() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionExpired) return;
    const id = setTimeout(() => {
      clearSessionExpired();
      navigate("/");
    }, 4000);
    return () => clearTimeout(id);
  }, [sessionExpired, clearSessionExpired, navigate]);

  if (!sessionExpired) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#dc2626",
        color: "#fff",
        textAlign: "center",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      Your session expired. Redirecting to sign-in…
      <button
        onClick={() => { clearSessionExpired(); navigate("/"); }}
        style={{ marginLeft: 16, textDecoration: "underline", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "inherit" }}
      >
        Sign in now
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <SessionExpiredBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminControls />} />
              <Route path="/experiment/:experimentId" element={<ExperimentPage />} />
              <Route path="/sandbox" element={<SandboxPage />} />
              <Route path="/arlab" element={<ARLabPage />} />
              <Route path="/reference" element={<ReferencePage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
