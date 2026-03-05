import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ExperimentPage from "./pages/ExperimentPage";
import SandboxPage from "./pages/SandboxPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/experiment/:experimentId" element={<ExperimentPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
