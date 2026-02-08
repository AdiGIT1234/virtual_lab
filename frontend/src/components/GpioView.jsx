/**
 * GPIO register visualization. INPUT pins are clickable when onInputChange is provided.
 * Accepts registers: { DDRB, DDRC, DDRD, PORTB, PORTC, PORTD, PINB, PINC, PIND }
 * D0–D7 → PORTD, D8–D13 → PORTB, A0–A5 → PORTC (pins 14–19)
 */
function GpioView({ registers, onInputChange }) {
  if (!registers) return null;

  const { DDRB, DDRC, DDRD, PORTB, PORTC, PORTD, PINB, PINC, PIND } = registers;

  const getPinState = (ddr, port, pin, bit) => {
    const mode = ddr?.[bit] === 1 ? "OUTPUT" : "INPUT";
    const valueReg = mode === "OUTPUT" ? port : pin;
    const value = valueReg?.[bit] === 1 ? "HIGH" : "LOW";
    return { mode, value };
  };

  // Digital pins D0–D13 (pin numbers 0–13)
  const digitalPins = [];
  for (let i = 0; i <= 13; i++) {
    const isPortB = i >= 8;
    const bit = isPortB ? i - 8 : i;
    const ddr = isPortB ? DDRB : DDRD;
    const port = isPortB ? PORTB : PORTD;
    const pin = isPortB ? PINB : PIND;
    const { mode, value } = getPinState(ddr, port, pin, bit);
    digitalPins.push({ pin: i, label: `D${i}`, mode, value });
  }

  // Analog pins A0–A5 (pin numbers 14–19)
  const analogPins = [];
  for (let i = 0; i <= 5; i++) {
    const { mode, value } = getPinState(DDRC, PORTC, PINC, i);
    analogPins.push({ pin: 14 + i, label: `A${i}`, mode, value });
  }

  const PinRow = ({ pin, label, mode, value }) => {
    const isOutput = mode === "OUTPUT";
    const isHigh = value === "HIGH";
    const canToggle = !isOutput && onInputChange;

    const handleClick = () => {
      if (!canToggle) return;
      const newValue = isHigh ? 0 : 1;
      onInputChange(pin, newValue);
    };

    return (
      <div
        role={canToggle ? "button" : undefined}
        tabIndex={canToggle ? 0 : undefined}
        title={canToggle ? "External Input – Click to toggle" : isOutput ? undefined : undefined}
        onClick={canToggle ? handleClick : undefined}
        onKeyDown={canToggle ? (e) => e.key === "Enter" && handleClick() : undefined}
        style={{
          display: "grid",
          gridTemplateColumns: "60px 80px 80px",
          gap: "0 1rem",
          alignItems: "center",
          marginBottom: "0.25rem",
          padding: "0.35rem 0.5rem",
          border: isOutput ? "1px solid #333" : "1px dashed #999",
          borderRadius: "4px",
          cursor: canToggle ? "pointer" : isOutput ? "not-allowed" : "default",
          opacity: isOutput ? 0.7 : 1,
        }}
      >
        <span style={{ fontWeight: "600", color: "#111" }}>{label}</span>
        <span>
          {mode}
          {canToggle && <span style={{ marginLeft: "0.25rem", color: "#888", fontSize: "0.8em" }}>(External Input)</span>}
        </span>
        <span
          style={{
            padding: "0.2rem 0.4rem",
            borderRadius: "3px",
            backgroundColor: isHigh ? "#4caf50" : "#e0e0e0",
            color: isHigh ? "#fff" : "#333",
          }}
        >
          {value}
        </span>
      </div>
    );
  };

  const header = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 80px 80px",
        gap: "0 1rem",
        marginBottom: "0.5rem",
        padding: "0 0.5rem",
      }}
    >
      <span style={{ fontWeight: "bold" }}>Pin</span>
      <span style={{ fontWeight: "bold" }}>Mode</span>
      <span style={{ fontWeight: "bold" }}>Value</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
      {/* Digital Pins */}
      <div style={{ padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "1rem" }}>
        <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>Digital Pins</div>
        {header}
        {digitalPins.map((p) => (
          <PinRow key={p.label} {...p} />
        ))}
      </div>

      {/* Analog Pins */}
      <div style={{ padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>Analog Pins</div>
        {header}
        {analogPins.map((p) => (
          <PinRow key={p.label} {...p} />
        ))}
      </div>
    </div>
  );
}

export default GpioView;
