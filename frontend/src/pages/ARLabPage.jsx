import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ARLabCanvas from "../components/arlab/ARLabCanvas";
import { useCircuitStore } from "../state/useCircuitStore";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";

const presetOptions = Object.values(CIRCUIT_PRESETS);
const LED_PALETTE = ["#ff5b5b", "#ffb347", "#fffb91", "#6dffb1", "#5bc0ff", "#d084ff"];

export default function ARLabPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const presetParam = params.get("preset") || "blink";

  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const presetMeta = useCircuitStore((state) => state.presetMeta);
  const components = useCircuitStore((state) => state.components);
  const outputs = useCircuitStore((state) => state.outputs);
  const setOutputLevel = useCircuitStore((state) => state.setOutputLevel);

  const [selectedId, setSelectedId] = useState(null);
  const [styleOverrides, setStyleOverrides] = useState({});

  useEffect(() => {
    loadPreset(presetParam);
    setStyleOverrides({});
    setSelectedId(null);
  }, [presetParam, loadPreset]);

  useEffect(() => {
    if (components.length && !selectedId) {
      setSelectedId(components[0].id);
    }
  }, [components, selectedId]);

  const selectedComponent = useMemo(() => components.find((c) => c.id === selectedId), [components, selectedId]);

  const currentLevel = selectedComponent && selectedComponent.pin != null
    ? styleOverrides[selectedComponent.id]?.level ?? outputs[selectedComponent.pin] ?? 0
    : 0;

  const handleColorPick = (color) => {
    if (!selectedComponent) return;
    setStyleOverrides((prev) => ({
      ...prev,
      [selectedComponent.id]: { ...prev[selectedComponent.id], color },
    }));
  };

  const handleLevelChange = (value) => {
    if (!selectedComponent || selectedComponent.pin == null) return;
    const level = Number(value);
    setStyleOverrides((prev) => ({
      ...prev,
      [selectedComponent.id]: { ...prev[selectedComponent.id], level },
    }));
    setOutputLevel(selectedComponent.pin, level);
  };

  return (
    <div style={styles.page}>
      <header style={styles.heroBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div>
          <p style={styles.heroKicker}>Immersive Circuit Preview</p>
          <h1 style={styles.heroTitle}>ATmega328P 3D Lab</h1>
        </div>
        <div style={styles.presetCluster}>
          <label style={styles.presetLabel}>Preset</label>
          <select
            style={styles.presetSelect}
            value={presetParam}
            onChange={(e) => navigate(`/arlab?preset=${e.target.value}`)}
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main style={styles.layout}>
        <section style={styles.previewPanel}>
          <div style={styles.canvasFrame}>
            <ARLabCanvas highlightedId={selectedId} componentStyles={styleOverrides} />
            <div style={styles.previewHud}>
              <div>
                <p style={styles.hudLabel}>Preset</p>
                <h3 style={styles.hudTitle}>{presetMeta?.name}</h3>
                <p style={styles.hudBody}>{presetMeta?.description}</p>
              </div>
              <div>
                <p style={styles.hudLabel}>Camera Controls</p>
                <ul style={styles.hudList}>
                  <li>Orbit: drag left mouse</li>
                  <li>Pan: shift + drag</li>
                  <li>Zoom: scroll</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <aside style={styles.sidePanel}>
          <div style={styles.componentShelf}>
            <div style={styles.sectionHeader}>
              <h2>Active Components</h2>
              <span>{components.length} items</span>
            </div>
            <div style={styles.componentGrid}>
              {components.map((component) => (
                <button
                  key={component.id}
                  style={{
                    ...styles.componentCard,
                    borderColor: component.id === selectedId ? "#00ffd5" : "rgba(255,255,255,0.08)",
                    boxShadow: component.id === selectedId ? "0 15px 30px rgba(0,255,204,0.15)" : "none",
                  }}
                  onClick={() => setSelectedId(component.id)}
                >
                  <div style={styles.componentType}>{component.type}</div>
                  <div style={styles.componentPin}>Pin {component.pin ?? "—"}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedComponent && (
            <div style={styles.detailPanel}>
              <p style={styles.detailLabel}>Selected</p>
              <h3 style={styles.detailTitle}>{selectedComponent.type}</h3>
              <p style={styles.detailMeta}>Pin {selectedComponent.pin ?? "—"}</p>

              {selectedComponent.type === "LED" && (
                <div style={styles.paletteRow}>
                  {LED_PALETTE.map((swatch) => (
                    <button
                      key={swatch}
                      style={{
                        ...styles.swatch,
                        background: swatch,
                        outline: styleOverrides[selectedComponent.id]?.color === swatch ? "2px solid #fff" : "none",
                      }}
                      onClick={() => handleColorPick(swatch)}
                    />
                  ))}
                </div>
              )}

              {selectedComponent.pin != null && (
                <div style={styles.sliderBlock}>
                  <label style={styles.sliderLabel}>Drive Level</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentLevel}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    style={styles.slider}
                  />
                </div>
              )}

              <p style={styles.detailHint}>Adjust color and intensity to preview how the sandbox wiring will glow in the immersive scene.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 20%, rgba(0,255,208,0.1), #02040a 65%)",
    color: "#e8f8ff",
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroBar: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  backBtn: {
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "999px",
    padding: "10px 16px",
    background: "transparent",
    color: "#9ad9ff",
    cursor: "pointer",
  },
  heroKicker: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.4em",
    fontSize: 12,
    color: "#7efbe4",
  },
  heroTitle: {
    margin: 0,
    fontSize: 32,
  },
  presetCluster: {
    marginLeft: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 200,
  },
  presetLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.3em",
    color: "#7fa1b3",
  },
  presetSelect: {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.35)",
    color: "#f6ffff",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 0.9fr)",
    gap: 24,
    flex: 1,
  },
  previewPanel: {
    position: "relative",
  },
  canvasFrame: {
    width: "100%",
    minHeight: 600,
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
    boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
    position: "relative",
  },
  previewHud: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    background: "linear-gradient(180deg, transparent, rgba(1,2,4,0.85))",
  },
  hudLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.3em",
    fontSize: 11,
    color: "#76e8ff",
    margin: 0,
  },
  hudTitle: {
    margin: "6px 0 4px",
    fontSize: 20,
  },
  hudBody: {
    margin: 0,
    maxWidth: 280,
    color: "#bfd8e4",
    fontSize: 14,
  },
  hudList: {
    margin: "6px 0 0",
    paddingLeft: 18,
    color: "#bfd8e4",
    fontSize: 14,
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  componentShelf: {
    padding: 20,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(3,8,14,0.85)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  componentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12,
  },
  componentCard: {
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  componentType: {
    fontSize: 12,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#8fbdd2",
  },
  componentPin: {
    fontSize: 18,
    fontWeight: 700,
  },
  detailPanel: {
    padding: 20,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(5,12,18,0.9)",
    minHeight: 200,
  },
  detailLabel: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.3em",
    fontSize: 11,
    color: "#7efbe4",
  },
  detailTitle: {
    margin: "6px 0",
    fontSize: 22,
  },
  detailMeta: {
    margin: 0,
    color: "#9fbacd",
  },
  paletteRow: {
    display: "flex",
    gap: 8,
    margin: "18px 0",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
  },
  sliderBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },
  sliderLabel: {
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: "0.3em",
    color: "#7fadff",
  },
  slider: {
    width: "100%",
    accentColor: "#00ffd5",
  },
  detailHint: {
    fontSize: 12,
    color: "#9fbacd",
    lineHeight: 1.4,
  },
};
