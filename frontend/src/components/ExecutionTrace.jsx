const formatTime = (t) => `${t} cycles`;
const formatPc = (pc) => (pc == null ? "--" : `0x${pc.toString(16).padStart(4, "0").toUpperCase()}`);

export default function ExecutionTrace({ timeline = [], currentStep = 0 }) {
  const preview = timeline.slice(Math.max(0, timeline.length - 30)).reverse();

  return (
    <div style={styles.container}>
      <div style={styles.header}>Execution Trace</div>
      <div style={styles.table}>
        <div style={styles.headRow}>
          <span>Step</span>
          <span>PC</span>
          <span>Time</span>
          <span>Type</span>
        </div>
        <div style={styles.body}>
          {preview.length === 0 && <div style={styles.empty}>No entries yet</div>}
          {preview.map((entry, idx) => {
            const stepIndex = timeline.length - 1 - idx;
            const active = stepIndex === currentStep;
            return (
              <div key={idx} style={{ ...styles.row, background: active ? "rgba(0,255,204,0.08)" : "transparent" }}>
                <span>{stepIndex}</span>
                <span>{formatPc(entry?.pc)}</span>
                <span>{formatTime(entry?.time ?? 0)}</span>
                <span>{entry?.type || "SNAP"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 16,
    color: "var(--text-primary)",
    fontFamily: "monospace",
  },
  header: {
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  table: {
    borderRadius: 8,
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  headRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    padding: "6px 10px",
    background: "var(--surface-2)",
    color: "var(--text-secondary)",
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  body: {
    maxHeight: 220,
    overflowY: "auto",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    padding: "6px 10px",
    borderBottom: "1px solid var(--border)",
    fontSize: "0.85rem",
  },
  empty: {
    padding: "12px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
};
