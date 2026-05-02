import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import PageLoader from "./components/PageLoader";

const LandingPage     = lazy(() => import("./pages/LandingPage"));
const ExperimentPage  = lazy(() => import("./pages/ExperimentPage"));
const SandboxPage     = lazy(() => import("./pages/SandboxPage"));
const ARLabPage       = lazy(() => import("./pages/ARLabPage"));
const ReferencePage   = lazy(() => import("./pages/ReferencePage"));
const DashboardPage   = lazy(() => import("./pages/DashboardPage"));
const AdminControls   = lazy(() => import("./pages/AdminControls"));

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
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
