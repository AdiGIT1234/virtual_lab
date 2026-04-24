import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import ARLabCanvas from "../components/arlab/ARLabCanvas";
import { useCircuitStore } from "../state/useCircuitStore";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";

const presetOptions = Object.values(CIRCUIT_PRESETS);

// Component library for the sidebar — like diode's "Insert Part"
const INSERT_PARTS = [
  { id: "arduino", label: "Arduino Uno", icon: "🔲", type: "BOARD" },
  { id: "resistor", label: "Resistor", icon: "═╤═", type: "RESISTOR" },
  { id: "led", label: "Led", icon: "💡", type: "LED" },
  { id: "motor", label: "Motor", icon: "⚙️", type: "SERVO" },
  { id: "timer555", label: "555 Timer", icon: "▣", type: "TIMER_555" },
  { id: "chip8", label: "8 Pin Custom Chip", icon: "▤", type: "CUSTOM_DIGITAL_IC" },
  { id: "button", label: "Tactile Switch", icon: "⬜", type: "BUTTON" },
  { id: "capacitor", label: "Capacitor", icon: "⏚", type: "CAPACITOR" },
  { id: "npn", label: "NPN Transistor", icon: "⊿", type: "NPN_TRANSISTOR" },
  { id: "pnp", label: "PNP Transistor", icon: "⊾", type: "PNP_TRANSISTOR" },
  { id: "buzzer", label: "Buzzer", icon: "🔈", type: "BUZZER" },
  { id: "sevenseg", label: "7-Segment", icon: "8.", type: "SEVEN_SEG" },
  { id: "servo", label: "Servo Motor", icon: "↻", type: "SERVO" },
];

export default function ARLabPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const presetParam = params.get("preset") || "blink";

  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const presetMeta = useCircuitStore((state) => state.presetMeta);
  const addComponent = useCircuitStore((state) => state.addComponent);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [occupiedHoles, setOccupiedHoles] = useState(new Set());
  const [hoveredPart, setHoveredPart] = useState(null);

  useEffect(() => {
    loadPreset(presetParam);
  }, [presetParam, loadPreset]);

  const handleHoleClick = useCallback((holeId) => {
    setOccupiedHoles(prev => {
      const next = new Set(prev);
      if (next.has(holeId)) {
        next.delete(holeId);
      } else {
        next.add(holeId);
      }
      return next;
    });
  }, []);

  const handleInsertPart = useCallback((part) => {
    if (addComponent && part.type !== "BOARD" && part.type !== "WIRE") {
      addComponent({
        id: `${part.type.toLowerCase()}-${Date.now()}`,
        type: part.type,
        pin: null,
        pins: { main: null },
        x: 400 + Math.random() * 100,
        y: 200 + Math.random() * 100,
      });
    }
  }, [addComponent]);

  return (
    <div style={styles.page}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.logoBtn} onClick={() => navigate("/")} title="Home">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <hexagon cx="12" cy="12" r="10" />
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            </svg>
          </button>
          <span style={styles.headerTitle}>Virtual Lab</span>
          <span style={styles.headerDivider}>|</span>
          <span style={styles.headerLink} onClick={() => navigate("/")}>Explore</span>
        </div>

        <div style={styles.headerCenter}>
          <select
            style={styles.presetDropdown}
            value={presetParam}
            onChange={(e) => navigate(`/arlab?preset=${e.target.value}`)}
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <span style={styles.presetArrow}>▾</span>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.headerBtn} onClick={() => navigate("/sandbox")}>
            2D Workbench
          </button>
          <button style={styles.simulateBtn}>
            ● Simulate
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Sidebar — Insert Part panel (like Diode) */}
        <aside style={{
          ...styles.sidebar,
          width: sidebarOpen ? 180 : 0,
          padding: sidebarOpen ? "16px 0" : 0,
          opacity: sidebarOpen ? 1 : 0,
          overflow: sidebarOpen ? "auto" : "hidden",
        }}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarLabel}>
              {presetMeta?.name || "Circuit"}
            </span>
            <span style={styles.sidebarDate}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Insert Part</h3>
          </div>

          <div style={styles.partsList}>
            {INSERT_PARTS.map((part) => (
              <button
                key={part.id}
                style={{
                  ...styles.partItem,
                  background: hoveredPart === part.id ? "rgba(0,229,255,0.06)" : "transparent",
                }}
                onMouseEnter={() => setHoveredPart(part.id)}
                onMouseLeave={() => setHoveredPart(null)}
                onClick={() => handleInsertPart(part)}
              >
                <span style={styles.partIcon}>{part.icon}</span>
                <span style={styles.partLabel}>{part.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Toggle sidebar button */}
        <button
          style={styles.sidebarToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {/* 3D Canvas — full viewport */}
        <div style={styles.canvasContainer}>
          <ARLabCanvas
            highlightedId={null}
            componentStyles={{}}
            occupiedHoles={occupiedHoles}
            onHoleClick={handleHoleClick}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0d1117",
    fontFamily: "'Inconsolata', 'Inter', monospace, sans-serif",
    overflow: "hidden",
  },

  // Header
  header: {
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "#161b22",
    borderBottom: "1px solid #30363d",
    flexShrink: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e6edf3",
  },
  headerDivider: {
    color: "#30363d",
    fontSize: 16,
  },
  headerLink: {
    fontSize: 14,
    fontWeight: 600,
    color: "#8b949e",
    cursor: "pointer",
    textDecoration: "none",
  },
  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  presetDropdown: {
    appearance: "none",
    background: "transparent",
    border: "none",
    fontSize: 14,
    fontWeight: 700,
    color: "#e6edf3",
    cursor: "pointer",
    fontFamily: "'Inconsolata', monospace",
    textAlign: "center",
  },
  presetArrow: {
    fontSize: 10,
    color: "#8b949e",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #30363d",
    borderRadius: 6,
    background: "#21262d",
    color: "#c9d1d9",
    cursor: "pointer",
    fontFamily: "'Inconsolata', monospace",
  },
  simulateBtn: {
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    borderRadius: 6,
    background: "#238636",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'Inconsolata', monospace",
    boxShadow: "0 0 10px rgba(35,134,54,0.4)",
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    position: "relative",
    overflow: "hidden",
  },

  // Sidebar
  sidebar: {
    background: "#161b22",
    borderRight: "1px solid #30363d",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    transition: "all 0.25s ease",
    overflowY: "auto",
    overflowX: "hidden",
  },
  sidebarHeader: {
    padding: "0 16px 12px",
    borderBottom: "1px solid #30363d",
    marginBottom: 12,
  },
  sidebarLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#e6edf3",
    marginBottom: 2,
  },
  sidebarDate: {
    fontSize: 11,
    color: "#8b949e",
    fontFamily: "'Inconsolata', monospace",
  },
  sidebarSection: {
    padding: "0 16px 8px",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: "#8b949e",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  partsList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  partItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.1s",
    width: "100%",
  },
  partIcon: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
    borderRadius: 6,
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#8b949e",
  },
  partLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#c9d1d9",
    fontFamily: "'Inconsolata', monospace",
    whiteSpace: "nowrap",
  },

  sidebarToggle: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 50,
    width: 20,
    height: 48,
    border: "1px solid #30363d",
    borderLeft: "none",
    borderRadius: "0 6px 6px 0",
    background: "#161b22",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Canvas
  canvasContainer: {
    flex: 1,
    position: "relative",
    minHeight: 0,
  },
};
