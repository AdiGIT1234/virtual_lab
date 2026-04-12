export default function SlidePotentiometer({ value = 0, onChange, label = "Slide Pot" }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>{label}</div>
      <div style={styles.body}>
        <div style={styles.track} />
        <input
          type="range"
          min="0"
          max="1023"
          step="1"
          value={value}
          onChange={(event) => onChange?.(parseInt(event.target.value, 10))}
          style={styles.slider}
          aria-label={label}
        />
        <div style={styles.endCapLeft} />
        <div style={styles.endCapRight} />
      </div>
      <div style={styles.readout}>{Math.round(value)}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    minWidth: 150,
  },
  label: {
    color: "#cbd5e1",
    fontFamily: "monospace",
    fontSize: 10,
    background: "rgba(0,0,0,0.45)",
    padding: "3px 8px",
    borderRadius: 999,
  },
  body: {
    position: "relative",
    width: 140,
    height: 42,
    borderRadius: 999,
    background: "linear-gradient(180deg, #1f2937, #0f172a)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 6,
    borderRadius: 999,
    background: "linear-gradient(90deg, #334155, #475569)",
  },
  slider: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    background: "transparent",
    cursor: "ew-resize",
    accentColor: "#22d3ee",
  },
  endCapLeft: {
    position: "absolute",
    left: 12,
    width: 8,
    height: 18,
    borderRadius: 4,
    background: "#94a3b8",
  },
  endCapRight: {
    position: "absolute",
    right: 12,
    width: 8,
    height: 18,
    borderRadius: 4,
    background: "#94a3b8",
  },
  readout: {
    color: "#67e8f9",
    fontFamily: "monospace",
    fontSize: 12,
    background: "#020617",
    border: "1px solid rgba(103,232,249,0.2)",
    padding: "3px 10px",
    borderRadius: 999,
    fontWeight: 700,
  },
};
