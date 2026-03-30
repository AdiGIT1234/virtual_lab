import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@wokwi/elements";
import "./elements/vlab-relay-module.js";

createRoot(document.getElementById("root")).render(
  <App />
);
