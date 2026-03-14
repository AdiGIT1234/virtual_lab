import { useState } from "react";

function Pin({ pin, index, side, getPinState, toggleInput, portColors = {} }) {
  const [hovered, setHovered] = useState(false);

  const PIN_SPACING = 32;
  const START_Y = 120;

  const y = START_Y + index * PIN_SPACING;
  const active = getPinState(pin.arduino);

  const getPortColor = (port) => {
    if (port && portColors[port]) return portColors[port];
    if (port === "B") return "#4da6ff";
    if (port === "C") return "#66ff99";
    if (port === "D") return "#ff6666";
    return "#aaa";
  };

  const getPinInfo = (label) => {
    if (label.includes("VCC") || label === "AVCC") return { type: "Power", desc: "5V Supply" };
    if (label.includes("GND")) return { type: "Ground", desc: "0V Reference" };
    if (label.includes("AREF")) return { type: "Analog Ref", desc: "Reference Voltage" };
    if (label.includes("(A")) return { type: "Analog Input", desc: "10-bit ADC / Digital I/O" };
    if (label.includes("PC6")) return { type: "Reset", desc: "Active Low Reset" };
    if (label.includes("(D")) {
      let desc = "Digital I/O";
      if (label.includes("D3") || label.includes("D5") || label.includes("D6") || 
          label.includes("D9") || label.includes("D10") || label.includes("D11")) {
        desc += " (PWM Support)";
      }
      return { type: "Digital", desc };
    }
    return { type: "I/O", desc: "General Purpose" };
  };

  const pinInfo = getPinInfo(pin.label);

  const leadStyle = {
    position: "absolute",
    top: y,
    width: 22,
    height: 8,
    background: active === "PWM" 
      ? "linear-gradient(to bottom, #00aaff, #0077ff)"
      : active
        ? "linear-gradient(to bottom, #00ff88, #00cc66)"
        : (hovered ? "linear-gradient(to bottom, #f5f5f5, #aaa)" : "linear-gradient(to bottom, #d9d9d9, #888)"),
    boxShadow: active === "PWM"
      ? "0 0 15px #00aaff, 0 0 5px #00aaff"
      : active 
        ? "0 0 15px #00ff88, 0 0 5px #00ff88" 
        : (hovered ? "0 0 10px rgba(255,255,255,1)" : "inset 0 1px 2px rgba(255,255,255,0.6)"),
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    transformOrigin: side === "left" ? "right center" : "left center",
    zIndex: hovered ? 10 : 1
  };

  const terminalNodeStyle = {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.9)",
    background: "#00ff88",
    boxShadow: "0 0 10px #00ff88",
    opacity: hovered ? 1 : 0,
    transition: "all 0.15s ease-in-out",
    pointerEvents: "all",
    zIndex: 20
  };

  if (side === "left") {
    terminalNodeStyle.left = 0;
  } else {
    terminalNodeStyle.left = "100%";
  }

  const labelStyle = {
    position: "absolute",
    top: y - 6,
    width: 130,
    fontSize: 12,
    fontWeight: 500,
    color: hovered ? "#fff" : getPortColor(pin.port),
    textAlign: side === "left" ? "left" : "right",
    textShadow: hovered ? `0 0 8px ${getPortColor(pin.port)}` : "none",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: hovered ? 10 : 1
  };

  if (side === "left") {
    leadStyle.left = -28;
    leadStyle.borderTopLeftRadius = 3;
    leadStyle.borderBottomLeftRadius = 3;
    labelStyle.left = 12;
  } else {
    leadStyle.right = -28;
    leadStyle.borderTopRightRadius = 3;
    leadStyle.borderBottomRightRadius = 3;
    labelStyle.right = 12;
  }

  const infoBoxStyle = {
    position: "absolute",
    top: y - 10,
    [side === "left" ? "left" : "right"]: 10, // Places it 10px inside the chip from the respective edge
    width: 140,
    background: "rgba(10, 10, 10, 0.95)",
    border: `1px solid ${getPortColor(pin.port)}`,
    borderRadius: "6px",
    padding: "6px 10px",
    color: "#e0e0e0",
    fontSize: "10px",
    fontFamily: "monospace",
    zIndex: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.8)",
    pointerEvents: "none", // so hover isn't disrupted
    opacity: hovered ? 1 : 0,
    visibility: hovered ? "visible" : "hidden",
    transform: hovered ? "scale(1)" : "scale(0.95)",
    transformOrigin: side === "left" ? "left center" : "right center",
    transition: "all 0.15s ease-out"
  };

  return (
    <>
      <div
        id={pin.arduino != null ? `chip-pin-${pin.arduino}` : `chip-pin-${pin.label}`}
        style={leadStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => toggleInput(pin.arduino)}
        onMouseUp={(e) => {
           e.stopPropagation();
        }}
      >
        <div 
          id={pin.arduino != null ? `chip-pin-tip-${pin.arduino}` : `chip-pin-tip-${pin.label}`} 
          style={terminalNodeStyle} 
          onMouseDown={(e) => {
            const pinIdentifier = pin.arduino != null ? pin.arduino : pin.label;
            e.stopPropagation();
            if (window.getActiveWire && window.getActiveWire()) {
               if (window.onCompleteWire) window.onCompleteWire(pinIdentifier);
            } else if (window.onStartWire) {
               const rect = e.target.getBoundingClientRect();
               window.onStartWire(`mcu::${pinIdentifier}`, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
          }}
        />
      </div>
      <div 
        style={labelStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => toggleInput(pin.arduino)}
      >
        {pin.label}
      </div>

      <div style={infoBoxStyle}>
        <div style={{ color: getPortColor(pin.port), fontWeight: "bold", marginBottom: "4px", fontSize: "11px" }}>
          {pin.label}
        </div>
        <div style={{ color: "#aaa", marginBottom: "2px" }}>Type: {pinInfo.type}</div>
        <div style={{ color: "#777", fontSize: "9px" }}>{pinInfo.desc}</div>
        {pin.arduino != null && (
          <div style={{ marginTop: "4px", color: active === "PWM" ? "#00aaff" : (active ? "#00ff88" : "#888"), fontWeight: "bold" }}>
            State: {active === "PWM" ? "PWM (Wave)" : (active ? "HIGH (5V)" : "LOW (0V)")}
          </div>
        )}
      </div>
    </>
  );
}

export default Pin;
