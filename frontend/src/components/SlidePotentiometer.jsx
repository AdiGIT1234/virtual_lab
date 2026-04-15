import React from 'react';

export default function SlidePotentiometer({ 
  value = 0, 
  onChange, 
  label = "Precision Slider", 
  min = 0, 
  max = 10000, 
  step = 1 
}) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>{label}</div>
      <div style={styles.container}>
        <div style={styles.rail}>
          <div style={{ ...styles.activeRail, width: `${((value - min) / (max - min)) * 100}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onMouseDown={(e) => e.stopPropagation()} 
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(event) => onChange?.(parseFloat(event.target.value))}
          style={styles.slider}
        />
        <div style={styles.notchLeft} />
        <div style={styles.notchRight} />
      </div>
      <div style={styles.display}>
        <span style={styles.valueText}>{value.toLocaleString()}</span>
        <span style={styles.unitText}>Ω</span>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "16px",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  label: {
    color: "#94a3b8",
    fontFamily: "'Inter', sans-serif",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: "600",
  },
  container: {
    position: "relative",
    width: "160px",
    height: "28px",
    display: "flex",
    alignItems: "center",
  },
  rail: {
    position: "absolute",
    width: "100%",
    height: "10px",
    background: "#0f172a",
    borderRadius: "5px",
    border: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
  },
  activeRail: {
    height: "100%",
    background: "linear-gradient(90deg, #0ea5e9, #2dd4bf)",
    boxShadow: "0 0 10px rgba(14, 165, 233, 0.4)",
  },
  slider: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    height: "100%",
    margin: 0,
    background: "transparent",
    appearance: "none",
    cursor: "pointer",
    outline: "none",
    // thumb styling via inline css is hard, but we can use global styles or simple appearance
  },
  display: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    background: "#020617",
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
  },
  valueText: {
    color: "#22d3ee",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    fontWeight: "700",
    textShadow: "0 0 8px rgba(34, 211, 238, 0.3)",
  },
  unitText: {
    color: "#64748b",
    fontSize: "10px",
    fontFamily: "monospace",
  },
  notchLeft: {
    position: "absolute",
    left: "-4px",
    width: "2px",
    height: "14px",
    background: "#475569",
    borderRadius: "1px",
  },
  notchRight: {
    position: "absolute",
    right: "-4px",
    width: "2px",
    height: "14px",
    background: "#475569",
    borderRadius: "1px",
  },
};
