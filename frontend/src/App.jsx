import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ExperimentPage from "./pages/ExperimentPage";
import SandboxPage from "./pages/SandboxPage";
import ARLabPage from "./pages/ARLabPage";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/experiment/:experimentId" element={<ExperimentPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/arlab" element={<ARLabPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
