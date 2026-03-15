import { useNavigate } from "react-router-dom";
import HardwarePreview from "../components/HardwarePreview";
import { HARDWARE_DETAILS } from "../data/hardwareDetails";

const SECTION_ORDER = [
  { key: "chips", title: "Microcontroller Boards" },
  { key: "displays", title: "Displays" },
  { key: "sensors", title: "Sensors" },
  { key: "inputs", title: "Input Devices" },
  { key: "outputs", title: "Outputs & Actuators" },
  { key: "modules", title: "Modules & Tools" },
];

export default function ReferencePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.shell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.heroBadge}>Hardware Library</p>
          <h1 style={styles.heroTitle}>Every Device, One Playground</h1>
          <p style={styles.heroSub}>
            Browse pinouts, common voltages, and usage notes for every chip, sensor, and module available inside AR Lab. No external references required—everything you need lives right here.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.primaryBtn} onClick={() => navigate("/sandbox")}>Go to Sandbox</button>
            <button style={styles.secondaryBtn} onClick={() => navigate("/")}>Back to Home</button>
          </div>
        </div>
        <div style={styles.heroOrbit}>
          <div style={styles.orbitGlow} />
          <div style={styles.orbitCore}>
            <span style={{ fontSize: 48 }}>⬢</span>
            <span style={styles.orbitLabel}>Live Knowledge Grid</span>
          </div>
        </div>
      </section>

      {SECTION_ORDER.map((section) => (
        <section key={section.key} style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>{section.title}</h2>
            <p>Pin-accurate notes, usage tips, and visual previews straight from our simulator models.</p>
          </div>
          <div style={styles.cardGrid}>
            {(HARDWARE_DETAILS[section.key] || []).map((item) => (
              <article key={item.id} style={styles.card}>
                <div style={styles.cardMedia}>
                  {item.imageTag ? (
                    <HardwarePreview tag={item.imageTag} size="small" style={styles.previewFrame} />
                  ) : (
                    <div style={styles.cardGlyph} aria-hidden="true">
                      {item.name?.split(" ").map((part) => part[0]).join("")?.slice(0, 3) || "•"}
                    </div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <h3>{item.name}</h3>
                  <p style={styles.cardHeadline}>{item.headline || item.summary}</p>
                  <p style={styles.cardSummary}>{item.summary}</p>
                  <p style={styles.cardPins}><strong>Pins:</strong> {item.pins || item.usage}</p>
                  {item.usage && (
                    <p style={styles.cardUsage}><strong>Usage:</strong> {item.usage}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const styles = {
  shell: {
    padding: "80px clamp(20px, 6vw, 80px)",
    background: "radial-gradient(circle at top, rgba(0,255,200,0.08), transparent 50%)",
    color: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 40,
    alignItems: "center",
    marginBottom: 64,
  },
  heroBadge: {
    textTransform: "uppercase",
    letterSpacing: "0.4em",
    fontSize: 12,
    color: "#6ff7d7",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: "clamp(32px, 4vw, 48px)",
    margin: "0 0 16px 0",
  },
  heroSub: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#b9c4d0",
    maxWidth: 520,
  },
  heroActions: {
    marginTop: 24,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #17ffd8, #00b5ff)",
    color: "#050505",
    border: "none",
    borderRadius: 999,
    padding: "12px 28px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 999,
    padding: "12px 28px",
    color: "#f5f5f5",
    cursor: "pointer",
  },
  heroOrbit: {
    position: "relative",
    minHeight: 260,
  },
  orbitGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(0,255,208,0.4), rgba(0,102,255,0.25))",
    filter: "blur(60px)",
  },
  orbitCore: {
    position: "relative",
    width: 220,
    height: 220,
    margin: "0 auto",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(5,5,8,0.85)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
  },
  orbitLabel: {
    letterSpacing: "0.2em",
    fontSize: 12,
    color: "#c4d3de",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 64,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    background: "rgba(10,12,16,0.85)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 240,
  },
  cardMedia: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  previewFrame: {
    width: "100%",
  },
  cardGlyph: {
    width: 64,
    height: 64,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(135deg, rgba(0,255,208,0.15), rgba(0,102,255,0.1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#7bffe2",
    marginBottom: 12,
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardHeadline: {
    color: "#8ef5ff",
    fontSize: 13,
    margin: 0,
  },
  cardSummary: {
    color: "#cdd6df",
    fontSize: 13,
    margin: 0,
  },
  cardPins: {
    fontSize: 12,
    color: "#aab6c4",
    margin: 0,
  },
  cardUsage: {
    fontSize: 12,
    color: "#8fa3bc",
    margin: 0,
  },
};
