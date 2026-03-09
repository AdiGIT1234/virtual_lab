export default function MemoryViewer({ memory = [] }) {
  const rows = [];
  const chunkSize = 16;
  for (let i = 0; i < memory.length; i += chunkSize) {
    rows.push({ address: i, values: memory.slice(i, i + chunkSize) });
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Memory Viewer (0x0000 - 0x00FF)</div>
      <div style={styles.table}>
        {rows.map((row) => (
          <div key={row.address} style={styles.row}>
            <span style={styles.addr}>0x{row.address.toString(16).padStart(4, "0").toUpperCase()}</span>
            <div style={styles.bytes}>
              {row.values.map((val, idx) => (
                <span key={idx} style={styles.byte}>{(val ?? 0).toString(16).padStart(2, "0").toUpperCase()}</span>
              ))}
            </div>
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
    maxHeight: 220,
    overflowY: "auto",
    borderRadius: 8,
    border: "1px solid var(--border)",
  },
  row: {
    display: "flex",
    padding: "4px 8px",
    borderBottom: "1px solid var(--border)",
  },
  addr: {
    width: 90,
    color: "var(--text-secondary)",
  },
  bytes: {
    display: "grid",
    gridTemplateColumns: "repeat(16, minmax(20px, 1fr))",
    gap: 4,
    flex: 1,
  },
  byte: {
    background: "var(--surface-2)",
    borderRadius: 6,
    padding: "2px 4px",
    textAlign: "center",
    fontSize: "0.75rem",
  },
};
