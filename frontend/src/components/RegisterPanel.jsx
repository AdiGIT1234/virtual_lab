function RegisterPanel({ registers, onToggleBit }) {
  if (!registers) return null;

  const getDesc = (name) => {
    if (name.startsWith("DDR")) return "Data Direction (1=Out, 0=In)";
    if (name.startsWith("PORT")) return "Data Register (Output State)";
    if (name.startsWith("PIN")) return "Input Pins (Read State)";
    return "";
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Internal Registers</h3>

      {Object.entries(registers).map(([name, bits]) => (
        <div key={name} style={styles.registerBlock}>
          <div style={styles.labelRow}>
            <span style={styles.name}>{name}</span>
            <span style={styles.desc}>{getDesc(name)}</span>
          </div>

          <div style={styles.bitRow}>
            {/* AVR Registers are MSB to LSB (Bit 7 down to Bit 0) visually usually, but indices are 0-7 left to right in our array */}
            {bits.map((bit, i) => (
              <div key={i} style={styles.bitCol}>
                <span style={styles.bitIndex}>{i}</span>
                <div
                  onClick={() => onToggleBit && onToggleBit(name, i)}
                  style={{
                    ...styles.bitBox,
                    background: bit ? "#00ff88" : "#222",
                    color: bit ? "#000" : "#666",
                    boxShadow: bit ? "0 0 8px rgba(0,255,136,0.4)" : "none",
                    cursor: onToggleBit ? "pointer" : "default"
                  }}
                >
                  {bit}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    marginTop: 20,
    background: "#111",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #333"
  },
  header: {
    color: "#fff",
    fontFamily: "monospace",
    textTransform: "uppercase",
    fontSize: "0.9rem",
    marginBottom: "15px",
    marginTop: 0
  },
  registerBlock: {
    marginBottom: 15,
    borderBottom: "1px solid #222",
    paddingBottom: 10
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    color: "#00ccff"
  },
  desc: {
    fontSize: 10,
    color: "#888",
    fontFamily: "sans-serif"
  },
  bitRow: {
    display: "flex",
    gap: 4
  },
  bitCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  bitIndex: {
    fontSize: 9,
    color: "#555",
    fontFamily: "monospace",
    marginBottom: 2
  },
  bitBox: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "monospace",
    transition: "all 0.2s"
  }
};

export default RegisterPanel;
