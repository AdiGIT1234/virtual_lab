import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ExperimentPage from "./pages/ExperimentPage";
import SandboxPage from "./pages/SandboxPage";
import ARLabPage from "./pages/ARLabPage";
import ReferencePage from "./pages/ReferencePage";
import DashboardPage from "./pages/DashboardPage";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/experiment/:experimentId" element={<ExperimentPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/arlab" element={<ARLabPage />} />
            <Route path="/reference" element={<ReferencePage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
