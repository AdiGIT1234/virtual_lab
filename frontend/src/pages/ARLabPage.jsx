import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import ARLabCanvas from "../components/arlab/ARLabCanvas";
import { useCircuitStore } from "../state/useCircuitStore";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";
import { UNO_PIN_COORDS } from "../constants/unoPinCoords";

// Inline replica of CircuitScene's pinToSceneCoords helper (cannot be imported from a Three component).
const pinToSceneCoords = (pinNum) => {
  const local = UNO_PIN_COORDS[pinNum] || [0, 0.05, 0];
  return [-0.6 + local[0], 0.01 + local[1] + 0.04, local[2]];
};

const presetOptions = Object.values(CIRCUIT_PRESETS);

const WIRE_PALETTE = [
  "#00e5ff", // cyan
  "#fbbf24", // yellow
  "#f97316", // orange
  "#22c55e", // green
  "#f87171", // red
  "#a78bfa", // violet
  "#38bdf8", // sky blue
  "#fb7185", // rose
];

// SVG icons for each part — cleaner than emoji/unicode
const PartIcon = ({ type }) => {
  const s = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "BOARD": return (
      <svg {...s}><rect x="2" y="3" width="12" height="10" rx="1"/>
        <line x1="5" y1="3" x2="5" y2="1"/><line x1="8" y1="3" x2="8" y2="1"/><line x1="11" y1="3" x2="11" y2="1"/>
        <line x1="5" y1="13" x2="5" y2="15"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="11" y1="13" x2="11" y2="15"/>
      </svg>
    );
    case "RESISTOR": return (
      <svg {...s}><line x1="1" y1="8" x2="3" y2="8"/>
        <path d="M3 8 l1.5-2 l1.5 4 l1.5-4 l1.5 4 l1.5-4 L11 8"/>
        <line x1="11" y1="8" x2="15" y2="8"/>
      </svg>
    );
    case "LED": return (
      <svg {...s}><path d="M5 5 L5 11 L11 8 Z"/><line x1="11" y1="5" x2="11" y2="11"/>
        <line x1="1" y1="8" x2="5" y2="8"/><line x1="11" y1="8" x2="15" y2="8"/>
        <line x1="12" y1="5" x2="14" y2="3"/><line x1="12" y1="7" x2="15" y2="5"/>
      </svg>
    );
    case "SERVO": return (
      <svg {...s}><rect x="2" y="5" width="10" height="6" rx="1"/>
        <circle cx="12" cy="8" r="2"/><line x1="12" y1="6" x2="14" y2="4"/>
      </svg>
    );
    case "TIMER_555": return (
      <svg {...s}><rect x="3" y="2" width="10" height="12" rx="1"/>
        <line x1="3" y1="5" x2="1" y2="5"/><line x1="3" y1="8" x2="1" y2="8"/><line x1="3" y1="11" x2="1" y2="11"/>
        <line x1="13" y1="5" x2="15" y2="5"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="13" y1="11" x2="15" y2="11"/>
      </svg>
    );
    case "CUSTOM_DIGITAL_IC": return (
      <svg {...s}><rect x="3" y="2" width="10" height="12" rx="1"/>
        <line x1="3" y1="4" x2="1" y2="4"/><line x1="3" y1="7" x2="1" y2="7"/><line x1="3" y1="10" x2="1" y2="10"/><line x1="3" y1="13" x2="1" y2="13"/>
        <line x1="13" y1="4" x2="15" y2="4"/><line x1="13" y1="7" x2="15" y2="7"/><line x1="13" y1="10" x2="15" y2="10"/><line x1="13" y1="13" x2="15" y2="13"/>
      </svg>
    );
    case "BUTTON": return (
      <svg {...s}><line x1="8" y1="1" x2="8" y2="5"/><line x1="8" y1="11" x2="8" y2="15"/>
        <circle cx="8" cy="8" r="3"/><line x1="5" y1="8" x2="2" y2="8"/><line x1="11" y1="8" x2="14" y2="8"/>
      </svg>
    );
    case "CAPACITOR": return (
      <svg {...s}><line x1="1" y1="8" x2="6" y2="8"/>
        <line x1="6" y1="4" x2="6" y2="12"/><line x1="10" y1="4" x2="10" y2="12"/>
        <line x1="10" y1="8" x2="15" y2="8"/>
      </svg>
    );
    case "NPN_TRANSISTOR": return (
      <svg {...s}><line x1="6" y1="4" x2="6" y2="12"/><line x1="1" y1="8" x2="6" y2="8"/>
        <line x1="6" y1="6" x2="12" y2="3"/><line x1="6" y1="10" x2="12" y2="13"/>
        <polyline points="10,13 12,13 12,11"/>
      </svg>
    );
    case "PNP_TRANSISTOR": return (
      <svg {...s}><line x1="6" y1="4" x2="6" y2="12"/><line x1="1" y1="8" x2="6" y2="8"/>
        <line x1="6" y1="6" x2="12" y2="3"/><line x1="6" y1="10" x2="12" y2="13"/>
        <polyline points="7,6 9,4 9,6"/>
      </svg>
    );
    case "BUZZER": return (
      <svg {...s}><rect x="2" y="5" width="5" height="6" rx="1"/>
        <path d="M7 6 Q11 8 7 10"/><path d="M8 4 Q14 8 8 12"/>
      </svg>
    );
    case "SEVEN_SEG": return (
      <svg {...s}><line x1="4" y1="2" x2="12" y2="2"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="4" y1="14" x2="12" y2="14"/>
        <line x1="4" y1="2" x2="4" y2="8"/><line x1="12" y1="2" x2="12" y2="8"/>
        <line x1="4" y1="8" x2="4" y2="14"/><line x1="12" y1="8" x2="12" y2="14"/>
      </svg>
    );
    default: return (
      <svg {...s}><rect x="3" y="3" width="10" height="10" rx="2"/></svg>
    );
  }
};

const INSERT_PARTS = [
  { id: "arduino",  label: "Arduino Uno",      type: "BOARD" },
  { id: "resistor", label: "Resistor",          type: "RESISTOR" },
  { id: "led",      label: "LED",               type: "LED" },
  { id: "button",   label: "Tactile Switch",    type: "BUTTON" },
  { id: "capacitor",label: "Capacitor",         type: "CAPACITOR" },
  { id: "npn",      label: "NPN Transistor",    type: "NPN_TRANSISTOR" },
  { id: "pnp",      label: "PNP Transistor",    type: "PNP_TRANSISTOR" },
  { id: "timer555", label: "555 Timer",         type: "TIMER_555" },
  { id: "chip8",    label: "8-Pin IC",          type: "CUSTOM_DIGITAL_IC" },
  { id: "buzzer",   label: "Buzzer",            type: "BUZZER" },
  { id: "sevenseg", label: "7-Segment",         type: "SEVEN_SEG" },
  { id: "motor",    label: "Motor",             type: "SERVO" },
  { id: "servo",    label: "Servo Motor",       type: "SERVO" },
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
  const [simRunning, setSimRunning] = useState(false);
  const [wiringMode, setWiringMode] = useState(false);
  const [wiringFrom, setWiringFrom] = useState(null);
  const [drawnWires, setDrawnWires] = useState([]);

  useEffect(() => {
    loadPreset(presetParam);
  }, [presetParam, loadPreset]);

  const handleHoleClick = useCallback((holeId) => {
    setOccupiedHoles(prev => {
      const next = new Set(prev);
      if (next.has(holeId)) next.delete(holeId);
      else next.add(holeId);
      return next;
    });
  }, []);

  const handlePinClick = useCallback((pinNum) => {
    if (!wiringMode) return;
    if (wiringFrom === null) {
      setWiringFrom(pinNum);
      return;
    }
    if (wiringFrom === pinNum) {
      // Click same pin to cancel
      setWiringFrom(null);
      return;
    }
    const p1 = pinToSceneCoords(wiringFrom);
    const p2 = pinToSceneCoords(pinNum);
    const exitY = Math.max(p1[1], p2[1]) + 0.10;
    const wirePoints = [
      p1,
      [p1[0], exitY, p1[2]],
      [p2[0], exitY, p2[2]],
      p2,
    ];
    const nextColor = WIRE_PALETTE[drawnWires.length % WIRE_PALETTE.length];
    setDrawnWires((prev) => [...prev, { points: wirePoints, color: nextColor }]);
    setWiringFrom(null);
  }, [wiringMode, wiringFrom]);

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
      <header style={styles.header} role="banner">
        <div style={styles.headerLeft}>
          <button
            style={styles.logoBtn}
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </button>
          <span style={styles.headerTitle}>Virtual Lab</span>
          <span style={styles.headerDivider} aria-hidden="true">|</span>
          <button style={styles.headerNavBtn} onClick={() => navigate("/")} aria-label="Explore projects">
            Explore
          </button>
        </div>

        <div style={styles.headerCenter}>
          <label htmlFor="preset-select" style={styles.srOnly}>Circuit preset</label>
          <div style={styles.selectWrapper}>
            <select
              id="preset-select"
              style={styles.presetDropdown}
              value={presetParam}
              onChange={(e) => navigate(`/arlab?preset=${e.target.value}`)}
              aria-label="Select circuit preset"
            >
              {presetOptions.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <span style={styles.selectChevron} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            style={styles.headerBtn}
            onClick={() => navigate("/sandbox")}
            aria-label="Switch to 2D workbench"
          >
            2D Workbench
          </button>
          <button
            style={{
              ...styles.headerBtn,
              background: wiringMode ? "rgba(0,229,255,0.15)" : "#21262d",
              color: wiringMode ? "#00e5ff" : "#c9d1d9",
              border: wiringMode ? "1px solid rgba(0,229,255,0.5)" : "1px solid #30363d",
            }}
            onClick={() => { setWiringMode(m => !m); setWiringFrom(null); }}
            aria-label="Toggle wire drawing mode"
            aria-pressed={wiringMode}
          >
            {wiringMode ? "Exit Wire Mode" : "Add Wire"}
          </button>
          <button
            style={{ ...styles.headerBtn, opacity: drawnWires.length === 0 ? 0.4 : 1 }}
            onClick={() => setDrawnWires(prev => prev.slice(0, -1))}
            disabled={drawnWires.length === 0}
            aria-label="Undo last wire"
            title="Undo last wire"
          >
            Undo Wire
          </button>
          {drawnWires.length > 0 && (
            <button
              style={{ ...styles.headerBtn, color: "#f87171" }}
              onClick={() => setDrawnWires([])}
              aria-label="Clear all drawn wires"
              title="Clear all wires"
            >
              Clear
            </button>
          )}
          <button
            style={{ ...styles.simulateBtn, background: simRunning ? "#b91c1c" : "#1a7f37" }}
            onClick={() => setSimRunning((r) => !r)}
            aria-label="Toggle simulation"
          >
            <span style={styles.simDot} aria-hidden="true"/>
            {simRunning ? "Stop" : "Simulate"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.main} role="main">
        {/* Sidebar */}
        <aside
          style={{
            ...styles.sidebar,
            width: sidebarOpen ? 200 : 0,
            padding: sidebarOpen ? "12px 0" : 0,
            opacity: sidebarOpen ? 1 : 0,
            overflow: sidebarOpen ? "auto" : "hidden",
          }}
          aria-label="Component library"
          aria-hidden={!sidebarOpen}
        >
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarLabel}>{presetMeta?.name || "Circuit"}</span>
            <span style={styles.sidebarDate}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div style={styles.sidebarSection}>
            <h2 style={styles.sidebarTitle}>Insert Part</h2>
          </div>

          <ul style={styles.partsList} role="list">
            {INSERT_PARTS.map((part) => (
              <li key={part.id} role="listitem">
                <button
                  style={{
                    ...styles.partItem,
                    background: hoveredPart === part.id ? "rgba(0,229,255,0.08)" : "transparent",
                    borderLeft: hoveredPart === part.id ? "2px solid rgba(0,229,255,0.5)" : "2px solid transparent",
                  }}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                  onClick={() => handleInsertPart(part)}
                  aria-label={`Insert ${part.label}`}
                >
                  <span style={{
                    ...styles.partIcon,
                    color: hoveredPart === part.id ? "#00e5ff" : "#8b949e",
                  }} aria-hidden="true">
                    <PartIcon type={part.type} />
                  </span>
                  <span style={styles.partLabel}>{part.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Toggle sidebar — moves with sidebar */}
        <button
          style={{
            ...styles.sidebarToggle,
            left: sidebarOpen ? 200 : 0,
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Hide component panel" : "Show component panel"}
          aria-expanded={sidebarOpen}
        >
          <svg
            width="10" height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ transform: sidebarOpen ? "none" : "rotate(180deg)", transition: "transform 0.25s" }}
          >
            <path d="M7 1L3 5l4 4"/>
          </svg>
        </button>

        {/* 3D Canvas */}
        <div style={styles.canvasContainer} aria-label="3D circuit view">
          {wiringMode && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 30, background: "rgba(0,10,20,0.85)", backdropFilter: "blur(10px)",
              border: `1px solid ${wiringFrom !== null ? "#00e5ff" : "rgba(0,229,255,0.3)"}`,
              borderRadius: 8, padding: "6px 16px", color: "#00e5ff",
              fontSize: 12, fontFamily: "monospace", fontWeight: 700,
              boxShadow: wiringFrom !== null ? "0 0 16px rgba(0,229,255,0.35)" : "none",
              pointerEvents: "none",
            }}>
              {wiringFrom !== null
                ? `FROM pin D${wiringFrom} — click destination pin`
                : "Click a pin to start a wire"}
            </div>
          )}
          <ARLabCanvas
            highlightedId={null}
            componentStyles={{}}
            occupiedHoles={occupiedHoles}
            onHoleClick={handleHoleClick}
            onPinClick={wiringMode ? handlePinClick : undefined}
            wiringFrom={wiringFrom}
            drawnWires={drawnWires}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  },

  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0d1117",
    fontFamily: "'Inter', 'Inconsolata', monospace, sans-serif",
    overflow: "hidden",
  },

  // Header
  header: {
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    flexShrink: 0,
    zIndex: 100,
    gap: 12,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  logoBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    borderRadius: 6,
    outline: "none",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e6edf3",
    whiteSpace: "nowrap",
  },
  headerDivider: {
    color: "#30363d",
    fontSize: 14,
    flexShrink: 0,
  },
  headerNavBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 6px",
    fontSize: 13,
    fontWeight: 500,
    color: "#8b949e",
    borderRadius: 6,
    outline: "none",
    fontFamily: "inherit",
  },
  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    flex: 1,
    justifyContent: "center",
  },
  selectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  presetDropdown: {
    appearance: "none",
    WebkitAppearance: "none",
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 8,
    padding: "5px 32px 5px 12px",
    fontSize: 13,
    fontWeight: 600,
    color: "#e6edf3",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
    minWidth: 160,
  },
  selectChevron: {
    position: "absolute",
    right: 10,
    color: "#8b949e",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  headerBtn: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #30363d",
    borderRadius: 7,
    background: "#21262d",
    color: "#c9d1d9",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
    whiteSpace: "nowrap",
  },
  simulateBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    borderRadius: 7,
    background: "#1a7f37",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
    whiteSpace: "nowrap",
    boxShadow: "0 0 12px rgba(26,127,55,0.35)",
  },
  simDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#4ac26b",
    display: "inline-block",
    flexShrink: 0,
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
    borderRight: "1px solid #21262d",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    transition: "width 0.25s ease, padding 0.25s ease, opacity 0.2s ease",
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 10,
  },
  sidebarHeader: {
    padding: "0 14px 12px",
    borderBottom: "1px solid #21262d",
    marginBottom: 8,
  },
  sidebarLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#e6edf3",
    marginBottom: 2,
    whiteSpace: "nowrap",
  },
  sidebarDate: {
    fontSize: 11,
    color: "#8b949e",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },
  sidebarSection: {
    padding: "0 14px 6px",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 10,
    fontWeight: 700,
    color: "#6e7681",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  partsList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },
  partItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.1s, border-left-color 0.1s",
    width: "100%",
    outline: "none",
    borderLeft: "2px solid transparent",
  },
  partIcon: {
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: 6,
    background: "#21262d",
    border: "1px solid #30363d",
    transition: "color 0.1s",
  },
  partLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#c9d1d9",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  sidebarToggle: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 20,
    width: 18,
    height: 44,
    border: "1px solid #21262d",
    borderLeft: "none",
    borderRadius: "0 6px 6px 0",
    background: "#161b22",
    color: "#6e7681",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    transition: "left 0.25s ease, color 0.15s",
    padding: 0,
  },

  // Canvas
  canvasContainer: {
    flex: 1,
    position: "relative",
    minHeight: 0,
    minWidth: 0,
  },
};
