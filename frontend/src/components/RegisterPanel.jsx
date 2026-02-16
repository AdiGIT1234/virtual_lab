function RegisterPanel({ registers }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Registers</h3>

      {Object.entries(registers).map(([name, bits]) => (
        <div key={name} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12 }}>{name}</div>

          <div style={{ display: "flex", gap: 4 }}>
            {bits.map((bit, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  background: bit ? "#00ff88" : "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  fontSize: 12
                }}
              >
                {bit}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RegisterPanel;
