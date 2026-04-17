import { useState } from "react";
import { getESP32PinColor } from "../constants/esp32PinLayout";

function Pin({ pin, index, side, getPinState, toggleInput, portColors = {}, isESP32 = false, voltage = 5 }) {
  const [hovered, setHovered] = useState(false);

  const PIN_SPACING = isESP32 ? 34 : 32;
  const START_Y = isESP32 ? 160 : 120;

  const y = START_Y + index * PIN_SPACING;

  // For ESP32, use gpio number; for ATmega, use arduino pin number
  const pinId = isESP32 ? pin.gpio : pin.arduino;
  const active = getPinState(pinId);

  const getPortColor = (portOrPin) => {
    if (isESP32) {
      return getESP32PinColor(pin);
    }
    const port = portOrPin;
    if (port && portColors[port]) return portColors[port];
    if (port === "B") return "#4da6ff";
    if (port === "C") return "#66ff99";
    if (port === "D") return "#ff6666";
    return "#aaa";
  };

  const getPinInfo = (pinData) => {
    if (isESP32) {
      if (pinData.power) {
        if (pinData.label === "GND") return { type: "Ground", desc: "0V Reference" };
        if (pinData.label === "3V3") return { type: "Power", desc: "3.3V Supply" };
        if (pinData.label === "EN") return { type: "Enable", desc: "Active-High Reset" };
      }
      if (pinData.inputOnly) return { type: "Input-Only", desc: "No output driver, no pull-ups" };
      if (pinData.dac) return { type: "DAC", desc: `True analog output (0-3.3V)` };
      if (pinData.touch) return { type: "Touch + GPIO", desc: "Capacitive touch + Digital I/O" };
      if (pinData.strapping) return { type: "Strapping", desc: "⚠️ Affects boot mode" };
      if (pinData.functions?.some(f => f.startsWith("I2C"))) return { type: "I2C", desc: pinData.functions.filter(f => f.startsWith("I2C")).join(", ") };
      if (pinData.functions?.some(f => f.includes("SPI"))) return { type: "SPI", desc: pinData.functions.filter(f => f.includes("SPI")).join(", ") };
      if (pinData.functions?.some(f => f.startsWith("UART"))) return { type: "UART", desc: pinData.functions.filter(f => f.startsWith("UART")).join(", ") };
      return { type: "GPIO", desc: "General Purpose I/O (PWM capable)" };
    }

    // ATmega328P pin info (original logic)
    const label = pinData.label;
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

  const pinInfo = getPinInfo(pin);
  const pinColor = getPortColor(pin.port);

  // Don't render interactive elements for power/ground pins
  const isPowerPin = pin.power || pin.special === "reset";
  const isInteractive = !isPowerPin && pinId != null;

  const leadStyle = {
    position: "absolute",
    top: y,
    width: isESP32 ? 20 : 22,
    height: isESP32 ? 7 : 8,
    background: active === "PWM" 
      ? "linear-gradient(to bottom, #00aaff, #0077ff)"
      : active
        ? `linear-gradient(to bottom, ${isESP32 ? '#10b981' : '#00ff88'}, ${isESP32 ? '#059669' : '#00cc66'})`
        : (hovered ? "linear-gradient(to bottom, #f5f5f5, #aaa)" : "linear-gradient(to bottom, #d9d9d9, #888)"),
    boxShadow: active === "PWM"
      ? "0 0 15px #00aaff, 0 0 5px #00aaff"
      : active 
        ? `0 0 15px ${isESP32 ? '#10b981' : '#00ff88'}, 0 0 5px ${isESP32 ? '#10b981' : '#00ff88'}` 
        : (hovered ? "0 0 10px rgba(255,255,255,1)" : "inset 0 1px 2px rgba(255,255,255,0.6)"),
    cursor: isInteractive ? "pointer" : "default",
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
    background: isESP32 ? "#10b981" : "#00ff88",
    boxShadow: `0 0 10px ${isESP32 ? '#10b981' : '#00ff88'}`,
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
    width: isESP32 ? 110 : 130,
    fontSize: isESP32 ? 11 : 12,
    fontWeight: 500,
    color: hovered ? "#fff" : pinColor,
    textAlign: side === "left" ? "left" : "right",
    textShadow: hovered ? `0 0 8px ${pinColor}` : "none",
    cursor: isInteractive ? "pointer" : "default",
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
    [side === "left" ? "left" : "right"]: 10,
    width: isESP32 ? 160 : 140,
    background: "rgba(10, 10, 10, 0.95)",
    border: `1px solid ${pinColor}`,
    borderRadius: "6px",
    padding: "6px 10px",
    color: "#e0e0e0",
    fontSize: "10px",
    fontFamily: "monospace",
    zIndex: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.8)",
    pointerEvents: "none",
    opacity: hovered ? 1 : 0,
    visibility: hovered ? "visible" : "hidden",
    transform: hovered ? "scale(1)" : "scale(0.95)",
    transformOrigin: side === "left" ? "left center" : "right center",
    transition: "all 0.15s ease-out"
  };

  return (
    <>
      <div
        id={pinId != null ? `chip-pin-${pinId}` : `chip-pin-${pin.label}`}
        style={leadStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => isInteractive && toggleInput(pinId)}
        onMouseUp={(e) => {
           e.stopPropagation();
        }}
        data-chip-node="interactive"
      >
        {(
          <div 
            id={pinId != null ? `chip-pin-tip-${pinId}` : `chip-pin-tip-${pin.label}`} 
            style={terminalNodeStyle} 
            onMouseDown={(e) => {
              const pinIdentifier = pinId != null ? pinId : pin.label;
              e.stopPropagation();
              if (window.getActiveWire && window.getActiveWire()) {
                 if (window.onCompleteWire) window.onCompleteWire(pinIdentifier);
              } else if (window.onStartWire) {
                 const rect = e.target.getBoundingClientRect();
                 window.onStartWire(`mcu::${pinIdentifier}`, null, rect.left + rect.width / 2, rect.top + rect.height / 2);
              }
            }}
            data-chip-node="interactive"
          />
        )}
      </div>
      <div 
        style={{ ...labelStyle, userSelect: "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => isInteractive && toggleInput(pinId)}
        data-chip-node="interactive"
      >
        {pin.label}
      </div>

      <div style={infoBoxStyle}>
        <div style={{ color: pinColor, fontWeight: "bold", marginBottom: "4px", fontSize: "11px", userSelect: "none" }}>
          {pin.label}
        </div>
        <div style={{ color: "#aaa", marginBottom: "2px" }}>Type: {pinInfo.type}</div>
        <div style={{ color: "#777", fontSize: "9px" }}>{pinInfo.desc}</div>
        {isESP32 && pin.functions && (
          <div style={{ color: "#555", fontSize: "8px", marginTop: "3px" }}>
            {pin.functions.join(" · ")}
          </div>
        )}
        {pinId != null && (
          <div style={{ marginTop: "4px", color: active === "PWM" ? "#00aaff" : (active ? (isESP32 ? "#10b981" : "#00ff88") : "#888"), fontWeight: "bold" }}>
            State: {active === "PWM" ? "PWM (Wave)" : (active ? `HIGH (${voltage}V)` : "LOW (0V)")}
          </div>
        )}
        {isESP32 && pin.strapping && (
          <div style={{ marginTop: "3px", color: "#ef4444", fontSize: "8px", fontWeight: "bold" }}>
            ⚠️ STRAPPING PIN — affects boot
          </div>
        )}
        {isESP32 && pin.inputOnly && (
          <div style={{ marginTop: "3px", color: "#6b7280", fontSize: "8px" }}>
            🔒 Input-only — no output driver
          </div>
        )}
      </div>
    </>
  );
}

export default Pin;
