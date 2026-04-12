import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HardwarePreview from "../components/HardwarePreview";
import { HARDWARE_DETAILS } from "../data/hardwareDetails";

const SECTION_ORDER = [
  { key: "chips", title: "Microcontroller Boards", icon: "⬢" },
  { key: "displays", title: "Displays", icon: "◻" },
  { key: "sensors", title: "Sensors", icon: "◈" },
  { key: "inputs", title: "Input Devices", icon: "◉" },
  { key: "outputs", title: "Outputs & Actuators", icon: "⬡" },
  { key: "analog", title: "Analog Controls", icon: "⚙" },
  { key: "passives", title: "Passive & Support Components", icon: "◇" },
  { key: "modules", title: "Modules & Interfaces", icon: "⧉" },
  { key: "tools", title: "Lab Tools & Diagnostics", icon: "⌁" },
  { key: "power", title: "Power & Wiring", icon: "⊕" },
];

/* ─── Spec-label formatting helper ─── */
const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/url$/i, "URL")
    .trim();

/* ─── DatasheetTooltip ─── */
function DatasheetTooltip({ item, anchorRect, onMouseEnter, onMouseLeave }) {
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: "right" });

  useEffect(() => {
    if (!anchorRect || !tipRef.current) return;
    const tip = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;

    let top, left, placement;

    // Try right
    if (anchorRect.right + gap + tip.width < vw) {
      placement = "right";
      left = anchorRect.right + gap;
      top = anchorRect.top + anchorRect.height / 2 - tip.height / 2;
    }
    // Try left
    else if (anchorRect.left - gap - tip.width > 0) {
      placement = "left";
      left = anchorRect.left - gap - tip.width;
      top = anchorRect.top + anchorRect.height / 2 - tip.height / 2;
    }
    // Fall back to bottom
    else {
      placement = "bottom";
      left = anchorRect.left + anchorRect.width / 2 - tip.width / 2;
      top = anchorRect.bottom + gap;
    }

    // Clamp into viewport
    top = Math.max(12, Math.min(top, vh - tip.height - 12));
    left = Math.max(12, Math.min(left, vw - tip.width - 12));

    setPos({ top, left, placement });
  }, [anchorRect]);

  if (!item) return null;

  const data = item.datasheet;
  const entries = data ? Object.entries(data).filter(([key]) => !["datasheetUrl", "referenceUrl", "linkLabel"].includes(key)) : [];
  const datasheetUrl = data ? data.datasheetUrl : null;
  const referenceUrl = data ? data.referenceUrl : null;
  const linkHref = datasheetUrl || referenceUrl;
  const linkLabel = datasheetUrl ? data?.linkLabel || "Download PDF" : referenceUrl ? data?.linkLabel || "Reference URL" : null;

  return (
    <div
      ref={tipRef}
      style={{
        ...tooltipStyles.wrapper,
        top: pos.top,
        left: pos.left,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Glow bar */}
      <div style={tooltipStyles.glowBar} />

      <div style={tooltipStyles.header}>
        <span style={tooltipStyles.headerIcon}>📋</span>
        <span style={tooltipStyles.headerTitle}>{item.name} Specs</span>
      </div>

      <div style={tooltipStyles.generalInfo}>
        {item.headline && <p style={tooltipStyles.cardHeadline}>{item.headline}</p>}
        {item.summary && <p style={tooltipStyles.cardSummary}>{item.summary}</p>}
        {item.pins && <p style={tooltipStyles.cardPins}><strong>Pins:</strong> {item.pins}</p>}
        {item.usage && <p style={tooltipStyles.cardUsage}><strong>Usage:</strong> {item.usage}</p>}
      </div>

      {entries.length > 0 && (
        <div style={tooltipStyles.specGrid}>
          {entries.map(([key, value]) => (
            <div key={key} style={tooltipStyles.specRow}>
              <span style={tooltipStyles.specLabel}>{formatLabel(key)}</span>
              <span style={tooltipStyles.specValue}>{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {linkHref && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          style={tooltipStyles.datasheetLink}
        >
          <span style={{ marginRight: 6 }}>📄</span>
          {linkLabel}
          <span style={{ marginLeft: 6, opacity: 0.6 }}>↗</span>
        </a>
      )}
    </div>
  );
}

/* ─── ComponentCard ─── */
function ComponentCard({ item }) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    clearTimeout(timerRef.current);
    if (item.datasheet) {
      timerRef.current = setTimeout(() => {
        if (cardRef.current) {
          setAnchorRect(cardRef.current.getBoundingClientRect());
        }
        setShowTooltip(true);
      }, 350);
    }
  }, [item.datasheet]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    clearTimeout(timerRef.current);
    // Give a small delay so user can move cursor to the tooltip
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 250);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowTooltip(true);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 250);
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <>
      <article
        ref={cardRef}
        style={{
          ...cardStyles.card,
          borderColor: hovered
            ? "rgba(0,255,208,0.35)"
            : "rgba(255,255,255,0.08)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 12px 40px rgba(0,255,208,0.12), 0 0 0 1px rgba(0,255,208,0.15)"
            : "none",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={cardStyles.cardMedia}>
          {item.imageUrl ? (
            <HardwarePreview
              imageUrl={item.imageUrl}
              size="medium"
              style={cardStyles.previewFrame}
            />
          ) : item.imageTag ? (
            <HardwarePreview
              tag={item.imageTag}
              size="medium"
              style={cardStyles.previewFrame}
            />
          ) : (
            <div style={cardStyles.cardGlyph} aria-hidden="true">
              {item.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                ?.slice(0, 3) || "•"}
            </div>
          )}
        </div>

        <div style={cardStyles.cardBody}>
          <h3 style={cardStyles.cardName}>{item.name}</h3>
        </div>

        {/* Hover hint badge */}
        {item.datasheet && (
          <div
            style={{
              ...cardStyles.hoverBadge,
              opacity: hovered ? 1 : 0,
            }}
          >
            <span style={{ fontSize: 10 }}>📋</span> Hover for specs
          </div>
        )}
      </article>

      {/* Portal-style tooltip */}
      {showTooltip && item.datasheet && (
        <DatasheetTooltip
          item={item}
          anchorRect={anchorRect}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        />
      )}
    </>
  );
}

/* ─── ReferencePage ─── */
export default function ReferencePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.shell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.heroBadge}>Hardware Library</p>
          <h1 style={styles.heroTitle}>Every Device, One Playground</h1>
          <p style={styles.heroSub}>
            Browse pinouts, voltage specs, timing diagrams, and full datasheet
            references for every chip, sensor, and module available inside AR
            Lab. Hover over any component to reveal its detailed specifications.
          </p>
          <div style={styles.heroActions}>
            <button
              style={styles.primaryBtn}
              onClick={() => navigate("/sandbox")}
            >
              Go to Sandbox
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
        <div style={styles.heroOrbit}>
          <div style={styles.orbitGlow} />
          <div style={styles.orbitCore}>
            <span style={{ fontSize: 48 }}>⬢</span>
            <span style={styles.orbitLabel}>Independent Device Atlas</span>
          </div>
        </div>
      </section>

      {SECTION_ORDER.map((section) => (
        <section key={section.key} style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>
              <span style={{ marginRight: 10, opacity: 0.5 }}>
                {section.icon}
              </span>
              {section.title}
            </h2>
            <p>
              Pin-accurate notes, usage tips, and full datasheet specs straight
              from manufacturer documentation. Hover any card to see more.
            </p>
          </div>
          <div style={styles.cardGrid}>
            {(HARDWARE_DETAILS[section.key] || []).map((item) => (
              <ComponentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ─── Page styles ─── */
const styles = {
  shell: {
    padding: "80px clamp(20px, 6vw, 80px)",
    background:
      "radial-gradient(circle at top, rgba(0,255,200,0.08), transparent 50%)",
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
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  secondaryBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 999,
    padding: "12px 28px",
    color: "#f5f5f5",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  heroOrbit: {
    position: "relative",
    minHeight: 260,
  },
  orbitGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, rgba(0,255,208,0.4), rgba(0,102,255,0.25))",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
};

/* ─── Card styles ─── */
const cardStyles = {
  card: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(10,12,16,0.85)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 180,
    cursor: "default",
    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease",
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
    background:
      "linear-gradient(135deg, rgba(0,255,208,0.15), rgba(0,102,255,0.1))",
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
  cardName: {
    margin: 0,
    fontSize: 16,
  },
  cardHeadline: {
    color: "#8ef5ff",
    fontSize: 13,
    margin: 0,
    overflowWrap: "anywhere",
  },
  cardSummary: {
    color: "#cdd6df",
    fontSize: 13,
    margin: 0,
    overflowWrap: "anywhere",
  },
  cardPins: {
    fontSize: 12,
    color: "#aab6c4",
    margin: 0,
    overflowWrap: "anywhere",
  },
  cardUsage: {
    fontSize: 12,
    color: "#8fa3bc",
    margin: 0,
    overflowWrap: "anywhere",
  },
  hoverBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(0,255,208,0.12)",
    border: "1px solid rgba(0,255,208,0.25)",
    borderRadius: 8,
    padding: "3px 8px",
    fontSize: 10,
    color: "#6ff7d7",
    fontFamily: "'Space Grotesk', monospace",
    letterSpacing: "0.04em",
    transition: "opacity 0.25s ease",
    pointerEvents: "none",
  },
};

/* ─── Tooltip styles ─── */
const tooltipStyles = {
  wrapper: {
    position: "fixed",
    zIndex: 9999,
    width: "min(380px, calc(100vw - 24px))",
    maxHeight: "80vh",
    overflowY: "auto",
    background: "rgba(8, 10, 18, 0.97)",
    border: "1px solid rgba(0,255,208,0.2)",
    borderRadius: 16,
    padding: "0 0 16px 0",
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    backdropFilter: "blur(24px)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.6), 0 0 1px rgba(0,255,208,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
    /* Custom scrollbar */
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(0,255,208,0.3) transparent",
  },
  generalInfo: {
    padding: "14px 18px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  glowBar: {
    height: 3,
    borderRadius: "16px 16px 0 0",
    background: "linear-gradient(90deg, #00ffd0, #00b5ff, #7b61ff, #00ffd0)",
    backgroundSize: "200% 100%",
    animation: "shimmer 3s linear infinite",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 18px 10px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6ff7d7",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  specGrid: {
    padding: "8px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  specRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "7px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    gap: 12,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#8fa3bc",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    flexShrink: 0,
    maxWidth: "40%",
  },
  specValue: {
    fontSize: 12,
    color: "#e8ecf1",
    textAlign: "right",
    lineHeight: 1.45,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    maxWidth: "60%",
  },
  datasheetLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "12px 18px 0 18px",
    padding: "10px 16px",
    borderRadius: 10,
    background: "linear-gradient(135deg, rgba(0,255,208,0.1), rgba(0,181,255,0.1))",
    border: "1px solid rgba(0,255,208,0.25)",
    color: "#6ff7d7",
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    letterSpacing: "0.04em",
    transition: "background 0.2s, transform 0.15s",
    cursor: "pointer",
  },
};
