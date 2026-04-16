/**
 * GPIO register visualization — supports both ATmega328P (port-based) and ESP32 (flat GPIO).
 *
 * ATmega mode: registers = { DDRB, DDRC, DDRD, PORTB, PORTC, PORTD, PINB, PINC, PIND }
 * ESP32 mode:  registers = { GPIO_DIR, GPIO_OUT, GPIO_IN, PWM, ADC, DAC, TOUCH }
 */
function GpioView({ registers, onInputChange, mcu }) {
  if (!registers) return null;

  const isESP32 = mcu?.chipStyle === "module" || !!registers.GPIO_OUT;

  if (isESP32) {
    return <ESP32GpioView registers={registers} onInputChange={onInputChange} />;
  }

  return <AVRGpioView registers={registers} onInputChange={onInputChange} />;
}

// ──── ATmega328P GPIO View (original) ────
function AVRGpioView({ registers, onInputChange }) {
  const { DDRB, DDRC, DDRD, PORTB, PORTC, PORTD, PINB, PINC, PIND } = registers;

  const getPinState = (ddr, port, pin, bit) => {
    const mode = ddr?.[bit] === 1 ? "OUTPUT" : "INPUT";
    const valueReg = mode === "OUTPUT" ? port : pin;
    const value = valueReg?.[bit] === 1 ? "HIGH" : "LOW";
    return { mode, value };
  };

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

  const analogPins = [];
  for (let i = 0; i <= 5; i++) {
    const { mode, value } = getPinState(DDRC, PORTC, PINC, i);
    analogPins.push({ pin: 14 + i, label: `A${i}`, mode, value });
  }

  return (
    <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
      <PinSection title="Digital Pins" pins={digitalPins} onInputChange={onInputChange} />
      <PinSection title="Analog Pins" pins={analogPins} onInputChange={onInputChange} />
    </div>
  );
}

// ──── ESP32 GPIO View ────
function ESP32GpioView({ registers, onInputChange }) {
  const dir = registers.GPIO_DIR || [];
  const out = registers.GPIO_OUT || [];
  const inp = registers.GPIO_IN || [];
  const pwm = registers.PWM || [];
  const dac = registers.DAC || [];

  // ESP32 DevKit V1 exposed GPIOs (30-pin board)
  const exposedGPIOs = [
    0, 1, 2, 3, 4, 5,
    12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 23, 25, 26, 27,
    32, 33, 34, 35, 36, 39
  ];

  const inputOnlyPins = new Set([34, 35, 36, 39]);
  const dacPins = new Set([25, 26]);
  const touchPins = new Set([0, 2, 4, 12, 13, 14, 15, 27, 32, 33]);

  const gpioPins = exposedGPIOs.map((gpio) => {
    const isOutput = dir[gpio] === 1;
    const mode = isOutput ? "OUTPUT" : "INPUT";
    const rawValue = isOutput ? out[gpio] : inp[gpio];
    const pwmValue = pwm[gpio] || 0;
    const dacValue = dac[gpio] || 0;

    let value = rawValue === 1 ? "HIGH" : "LOW";
    let extra = "";

    if (pwmValue > 0 && pwmValue < 255) {
      value = `PWM(${pwmValue})`;
      extra = "ledc";
    } else if (dacValue > 0) {
      const voltage = ((dacValue / 255) * 3.3).toFixed(2);
      value = `DAC(${voltage}V)`;
      extra = "dac";
    }

    let tag = "";
    if (inputOnlyPins.has(gpio)) tag = "IN-ONLY";
    else if (dacPins.has(gpio)) tag = "DAC";
    else if (touchPins.has(gpio)) tag = "TOUCH";

    return {
      pin: gpio,
      label: `GPIO${gpio}`,
      mode,
      value,
      extra,
      tag,
      isInputOnly: inputOnlyPins.has(gpio),
    };
  });

  return (
    <div style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
      <div style={{
        padding: "0.75rem",
        border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: "6px",
        background: "rgba(16,185,129,0.03)",
      }}>
        <div style={{
          fontWeight: "600",
          marginBottom: "0.5rem",
          color: "#10b981",
          fontSize: "0.95rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span>⬡</span> ESP32 GPIO
          <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 400 }}>
            ({gpioPins.length} pins)
          </span>
        </div>
        <ESP32PinHeader />
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {gpioPins.map((p) => (
            <ESP32PinRow key={p.pin} {...p} onInputChange={onInputChange} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──── Shared PinSection (ATmega) ────
function PinSection({ title, pins, onInputChange }) {
  return (
    <div style={{ padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "1rem" }}>
      <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>{title}</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "60px 80px 80px",
        gap: "0 1rem",
        marginBottom: "0.5rem",
        padding: "0 0.5rem",
      }}>
        <span style={{ fontWeight: "bold" }}>Pin</span>
        <span style={{ fontWeight: "bold" }}>Mode</span>
        <span style={{ fontWeight: "bold" }}>Value</span>
      </div>
      {pins.map((p) => (
        <AVRPinRow key={p.label} {...p} onInputChange={onInputChange} />
      ))}
    </div>
  );
}

// ──── ATmega Pin Row ────
function AVRPinRow({ pin, label, mode, value, onInputChange }) {
  const isOutput = mode === "OUTPUT";
  const isHigh = value === "HIGH";
  const canToggle = !isOutput && onInputChange;

  const handleClick = () => {
    if (!canToggle) return;
    onInputChange(pin, isHigh ? 0 : 1);
  };

  return (
    <div
      role={canToggle ? "button" : undefined}
      tabIndex={canToggle ? 0 : undefined}
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
      <span style={{
        padding: "0.2rem 0.4rem",
        borderRadius: "3px",
        backgroundColor: isHigh ? "#4caf50" : "#e0e0e0",
        color: isHigh ? "#fff" : "#333",
      }}>
        {value}
      </span>
    </div>
  );
}

// ──── ESP32 Pin Header ────
function ESP32PinHeader() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "70px 55px 50px 90px",
      gap: "0 0.5rem",
      marginBottom: "0.4rem",
      padding: "0 0.4rem",
      fontSize: "0.8rem",
    }}>
      <span style={{ fontWeight: "bold", color: "#9ca3af" }}>Pin</span>
      <span style={{ fontWeight: "bold", color: "#9ca3af" }}>Tag</span>
      <span style={{ fontWeight: "bold", color: "#9ca3af" }}>Mode</span>
      <span style={{ fontWeight: "bold", color: "#9ca3af" }}>Value</span>
    </div>
  );
}

// ──── ESP32 Pin Row ────
function ESP32PinRow({ pin, label, mode, value, extra, tag, isInputOnly, onInputChange }) {
  const isOutput = mode === "OUTPUT";
  const isHigh = value === "HIGH";
  const isPWM = extra === "ledc";
  const isDAC = extra === "dac";
  const canToggle = !isOutput && !isInputOnly && onInputChange;

  const handleClick = () => {
    if (!canToggle) return;
    onInputChange(pin, isHigh ? 0 : 1);
  };

  const tagColors = {
    "IN-ONLY": { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
    "DAC": { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
    "TOUCH": { bg: "rgba(6,182,212,0.15)", color: "#06b6d4" },
  };
  const tagStyle = tagColors[tag] || { bg: "transparent", color: "#6b7280" };

  let valueBg = "#1f2937";
  let valueColor = "#9ca3af";
  if (isPWM) { valueBg = "rgba(0,170,255,0.15)"; valueColor = "#00aaff"; }
  else if (isDAC) { valueBg = "rgba(139,92,246,0.15)"; valueColor = "#8b5cf6"; }
  else if (isHigh) { valueBg = "rgba(16,185,129,0.2)"; valueColor = "#10b981"; }

  return (
    <div
      role={canToggle ? "button" : undefined}
      tabIndex={canToggle ? 0 : undefined}
      onClick={canToggle ? handleClick : undefined}
      onKeyDown={canToggle ? (e) => e.key === "Enter" && handleClick() : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "70px 55px 50px 90px",
        gap: "0 0.5rem",
        alignItems: "center",
        marginBottom: "2px",
        padding: "0.3rem 0.4rem",
        borderRadius: "4px",
        cursor: canToggle ? "pointer" : "default",
        opacity: isInputOnly ? 0.65 : 1,
        background: canToggle ? "rgba(16,185,129,0.04)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontWeight: "600", color: "#d1d5db", fontSize: "0.8rem" }}>{label}</span>
      <span style={{
        fontSize: "0.65rem",
        padding: "1px 4px",
        borderRadius: 3,
        background: tagStyle.bg,
        color: tagStyle.color,
        textAlign: "center",
      }}>
        {tag || "—"}
      </span>
      <span style={{ fontSize: "0.75rem", color: isOutput ? "#f59e0b" : "#6b7280" }}>
        {isOutput ? "OUT" : "IN"}
      </span>
      <span style={{
        padding: "2px 6px",
        borderRadius: "3px",
        fontSize: "0.75rem",
        background: valueBg,
        color: valueColor,
        fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}

export default GpioView;
