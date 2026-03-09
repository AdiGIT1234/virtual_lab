import { useMemo, useState } from "react";

function formatAddress(value) {
  if (value == null) return "--";
  return `0x${value.toString(16).padStart(4, "0").toUpperCase()}`;
}

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default function ExecutionInspector({
  currentPC,
  speedMultiplier,
  onSpeedChange,
  breakpoints,
  onAddBreakpoint,
  onRemoveBreakpoint,
  breakpointHit,
}) {
  const [inputValue, setInputValue] = useState("");

  const formattedBreakpoints = useMemo(
    () => breakpoints.map((bp) => ({ value: bp, label: formatAddress(bp) })),
    [breakpoints]
  );

  const handleAdd = () => {
    if (!inputValue) return;
    const sanitized = inputValue.trim().toLowerCase();
    const parsed = sanitized.startsWith("0x")
      ? parseInt(sanitized, 16)
      : parseInt(sanitized, 10);
    if (!Number.isFinite(parsed)) return;
    onAddBreakpoint?.(clamp(parsed, 0, 0xffff));
    setInputValue("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Execution Inspector</div>
      <div style={styles.row}>
        <span style={styles.label}>Instruction Pointer</span>
        <span style={styles.value}>{formatAddress(currentPC)}</span>
      </div>
      {breakpointHit && (
        <div style={styles.breakAlert}>Breakpoint hit at {formatAddress(breakpointHit)}</div>
      )}
      <div style={styles.sectionTitle}>Speed</div>
      <div style={styles.sliderRow}>
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.25"
          value={speedMultiplier}
          onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={styles.speedLabel}>{speedMultiplier.toFixed(2)}x</span>
      </div>
      <div style={styles.sectionTitle}>Breakpoints</div>
      <div style={styles.breakpointInput}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. 0x0123"
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <div style={styles.breakpointList}>
        {formattedBreakpoints.length === 0 && (
          <span style={styles.emptyState}>No breakpoints</span>
        )}
        {formattedBreakpoints.map((bp) => (
          <div key={bp.value} style={styles.breakpointItem}>
            <span>{bp.label}</span>
            <button onClick={() => onRemoveBreakpoint?.(bp.value)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "16px",
    color: "var(--text-primary)",
    fontFamily: "monospace",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  header: {
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
  },
  value: {
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: "0.8rem",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    letterSpacing: "0.1em",
    marginTop: "8px",
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  speedLabel: {
    width: "60px",
    textAlign: "right",
  },
  breakpointInput: {
    display: "flex",
    gap: "8px",
  },
  breakpointList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "140px",
    overflowY: "auto",
  },
  breakpointItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    background: "var(--surface-2)",
    borderRadius: 8,
    border: "1px solid var(--border)",
  },
  emptyState: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
  },
  breakAlert: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    borderRadius: 8,
    padding: "6px 8px",
    color: "#ef4444",
    fontSize: "0.85rem",
  },
};
