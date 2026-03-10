import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ARLabCanvas from "../components/arlab/ARLabCanvas";
import { useCircuitStore } from "../state/useCircuitStore";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";

const presetOptions = Object.values(CIRCUIT_PRESETS);

export default function ARLabPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const presetParam = params.get("preset") || "blink";

  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const presetMeta = useCircuitStore((state) => state.presetMeta);

  useEffect(() => {
    loadPreset(presetParam);
  }, [presetParam, loadPreset]);

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>ATmega328P Immersive Lab</h1>
        <p style={styles.lead}>Laptop-only 3D preview of Arduino Uno circuits.</p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Preset</h2>
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
          <p style={styles.sectionBody}>{presetMeta?.description}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Controls</h2>
          <ul style={styles.list}>
            <li>Left click + drag: orbit</li>
            <li>Scroll: zoom</li>
            <li>Shift + drag: pan</li>
            <li>Right click + drag: smooth pan</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Status</h2>
          <p style={styles.statusBadge}>3D viewport live</p>
          <p style={styles.sectionHint}>Next: wire simulator outputs + interactive pins.</p>
        </div>
      </div>

      <div style={styles.canvasArea}>
        <div style={styles.canvasFrame}>
          <ARLabCanvas />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#010104",
    color: "#e7f9ff",
    fontFamily: "'Space Grotesk', 'Inter', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: "340px",
    padding: "32px 28px",
    borderRight: "1px solid #0c1b22",
    background: "linear-gradient(180deg, #030b14 0%, #06121e 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  backBtn: {
    alignSelf: "flex-start",
    border: "1px solid #12384a",
    background: "transparent",
    color: "#8ad8ff",
    borderRadius: "12px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
  },
  title: {
    fontSize: "28px",
    margin: 0,
    color: "#c1f4ff",
  },
  lead: {
    margin: 0,
    color: "#8bb1c1",
    lineHeight: 1.4,
  },
  section: {
    background: "#071927",
    borderRadius: "18px",
    padding: "16px 18px",
    border: "1px solid #0d2735",
  },
  sectionTitle: {
    fontSize: "16px",
    margin: "0 0 10px 0",
    color: "#88e0ff",
  },
  sectionBody: {
    margin: 0,
    color: "#d0efff",
  },
  sectionHint: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#6d8897",
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: "#bcd6e2",
    lineHeight: 1.6,
  },
  statusBadge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "rgba(0, 255, 204, 0.14)",
    color: "#00ffcc",
    fontSize: "13px",
  },
  canvasArea: {
    flex: 1,
    padding: "32px",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  },
  canvasFrame: {
    flex: 1,
    borderRadius: "28px",
    border: "1px solid #0c2738",
    background: "radial-gradient(circle at top, rgba(0,255,204,0.08), rgba(2,12,21,0.95))",
    minHeight: "540px",
    position: "relative",
    overflow: "hidden",
  },
  presetSelect: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #12384a",
    background: "#04111b",
    color: "#c1f4ff",
    fontSize: "14px",
    marginBottom: "8px",
  },
};
