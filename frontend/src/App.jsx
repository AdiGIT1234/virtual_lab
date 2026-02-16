import { useState } from "react";

const PIN_LAYOUT = [
  { num: 1, label: "PC6" },
  { num: 2, label: "PD0 (D0)", arduino: 0, port: "D" },
  { num: 3, label: "PD1 (D1)", arduino: 1, port: "D" },
  { num: 4, label: "PD2 (D2)", arduino: 2, port: "D" },
  { num: 5, label: "PD3 (D3)", arduino: 3, port: "D" },
  { num: 6, label: "PD4 (D4)", arduino: 4, port: "D" },
  { num: 7, label: "VCC" },
  { num: 8, label: "GND" },
  { num: 9, label: "PB6", port: "B" },
  { num: 10, label: "PB7", port: "B" },
  { num: 11, label: "PD5 (D5)", arduino: 5, port: "D" },
  { num: 12, label: "PD6 (D6)", arduino: 6, port: "D" },
  { num: 13, label: "PD7 (D7)", arduino: 7, port: "D" },
  { num: 14, label: "PB0 (D8)", arduino: 8, port: "B" },
  { num: 15, label: "PB1 (D9)", arduino: 9, port: "B" },
  { num: 16, label: "PB2 (D10)", arduino: 10, port: "B" },
  { num: 17, label: "PB3 (D11)", arduino: 11, port: "B" },
  { num: 18, label: "PB4 (D12)", arduino: 12, port: "B" },
  { num: 19, label: "PB5 (D13)", arduino: 13, port: "B" },
  { num: 20, label: "AVCC" },
  { num: 21, label: "AREF" },
  { num: 22, label: "GND" },
  { num: 23, label: "PC0 (A0)", port: "C" },
  { num: 24, label: "PC1 (A1)", port: "C" },
  { num: 25, label: "PC2 (A2)", port: "C" },
  { num: 26, label: "PC3 (A3)", port: "C" },
  { num: 27, label: "PC4 (A4)", port: "C" },
  { num: 28, label: "PC5 (A5)", port: "C" }
];

function App() {
  const [code, setCode] = useState(`pinMode(13, OUTPUT);
digitalWrite(13, HIGH);`);

  const [registers, setRegisters] = useState(null);
  const [inputs, setInputs] = useState({});
  const [hoveredPin, setHoveredPin] = useState(null);

  const runCode = async () => {
    const response = await fetch("http://127.0.0.1:8000/run-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, inputs })
    });

    const data = await response.json();
    setRegisters(data.registers);
  };

  const getPinState = (arduinoPin) => {
    if (!registers || arduinoPin == null) return false;
    if (arduinoPin <= 7) return registers.PORTD?.[arduinoPin] === 1;
    if (arduinoPin <= 13) return registers.PORTB?.[arduinoPin - 8] === 1;
    return false;
  };

  const toggleInput = (arduinoPin) => {
    if (arduinoPin == null) return;
    setInputs(prev => ({
      ...prev,
      [arduinoPin]: prev[arduinoPin] ? 0 : 1
    }));
  };

  const leftPins = PIN_LAYOUT.slice(0, 14);
  const rightPins = PIN_LAYOUT.slice(14).reverse();

  const getPortColor = (port) => {
    if (port === "B") return "#4da6ff";
    if (port === "C") return "#66ff99";
    if (port === "D") return "#ff6666";
    return "#aaa";
  };

  const renderPin = (pin, index, side) => {
    const y = 110 + index * 28;
    const active = getPinState(pin.arduino);
    const isHovered = hoveredPin === pin.num;

    const leadBase = {
      position: "absolute",
      top: y,
      width: 24,
      height: 8,
      background: "linear-gradient(to bottom, #d9d9d9, #888, #cfcfcf)",
      boxShadow: active
        ? "0 0 10px #00ff88"
        : isHovered
        ? "0 0 8px rgba(255,255,255,0.6)"
        : "inset 0 1px 2px rgba(255,255,255,0.6)",
      transition: "all 0.2s ease",
      cursor: pin.arduino != null ? "pointer" : "default"
    };

    const labelStyle = {
      position: "absolute",
      top: y - 6,
      width: 130,
      fontSize: 12,
      fontWeight: 500,
      color: getPortColor(pin.port),
      textAlign: side === "left" ? "right" : "left",
      letterSpacing: 0.5
    };

    if (side === "left") {
      leadBase.left = -24;
      leadBase.borderTopLeftRadius = 3;
      leadBase.borderBottomLeftRadius = 3;
      labelStyle.left = -175;
    } else {
      leadBase.right = -24;
      leadBase.borderTopRightRadius = 3;
      leadBase.borderBottomRightRadius = 3;
      labelStyle.right = -175;
    }

    return (
      <div key={pin.num}>
        <div
          style={leadBase}
          onMouseEnter={() => setHoveredPin(pin.num)}
          onMouseLeave={() => setHoveredPin(null)}
          onClick={() => toggleInput(pin.arduino)}
        />
        <div style={labelStyle}>{pin.label}</div>
      </div>
    );
  };

  return (
    <div style={styles.app}>
      <div style={styles.editorPanel}>
        <h2 style={{ marginBottom: 20 }}>Code Editor</h2>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          style={styles.textarea}
        />
        <button onClick={runCode} style={styles.runButton}>
          Run Simulation
        </button>
      </div>

      <div style={styles.simulatorPanel}>
        <div style={styles.chipWrapper}>
          <div style={styles.chip}>
            <div style={styles.notch} />
            <div style={styles.engravedMain}>ATMEGA328P-PU</div>
            <div style={styles.engravedSub}>Microchip Technology</div>
            {leftPins.map((pin, i) => renderPin(pin, i, "left"))}
            {rightPins.map((pin, i) => renderPin(pin, i, "right"))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "radial-gradient(circle at center, #1a1a1a, #000)",
    color: "white"
  },
  editorPanel: {
    width: "35%",
    padding: 30,
    borderRight: "1px solid #222",
    background: "#0f0f0f",
    display: "flex",
    flexDirection: "column"
  },
  textarea: {
    flex: 1,
    background: "#1a1a1a",
    color: "#00ffcc",
    border: "1px solid #333",
    padding: 15,
    fontFamily: "monospace",
    fontSize: 14,
    marginBottom: 20
  },
  runButton: {
    padding: "12px 20px",
    background: "linear-gradient(90deg, #00ff88, #00cc66)",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: 6
  },
  simulatorPanel: {
    width: "65%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  chipWrapper: {
    position: "relative",
    width: 650,
    height: 650
  },
  chip: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 380,
    height: 560,
    borderRadius: 18,
    background:
      "linear-gradient(145deg, #1b1b1b, #0c0c0c)",
    boxShadow:
      "inset 0 8px 16px rgba(255,255,255,0.05), inset 0 -12px 20px rgba(0,0,0,0.9), 0 30px 60px rgba(0,0,0,0.9)"
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 120,
    height: 35,
    backgroundColor: "#0c0c0c",
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70
  },
  engravedMain: {
    position: "absolute",
    top: 70,
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 3,
    color: "#222",
    textShadow:
      "1px 1px 1px rgba(255,255,255,0.05), -1px -1px 1px rgba(0,0,0,0.9)"
  },
  engravedSub: {
    position: "absolute",
    top: 100,
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 2,
    color: "#1a1a1a",
    textShadow:
      "1px 1px 1px rgba(255,255,255,0.05), -1px -1px 1px rgba(0,0,0,0.9)"
  }
};

export default App;
