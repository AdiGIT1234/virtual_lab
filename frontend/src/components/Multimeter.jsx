import React, { useState } from 'react';

const Multimeter = ({ value = 0, label = "Multimeter" }) => {
  const [mode, setMode] = useState("V"); // "V", "A", "R"

  // Map 0-1023 input to simulated voltage (0-5V)
  const voltage = ((value / 1023) * 5.0).toFixed(2);
  
  // Calculate simulated current assuming a standard 220Ω resistor and 20mA max
  const current = ((value / 1023) * 20.0).toFixed(1);
  
  // Resistance is irrelevant when measuring an active circuit without calculations, but we'll simulate a reading from 0 to 10k
  const resistance = ((value / 1023) * 10.0).toFixed(2);

  let displayValue = "";
  let unit = "";
  if (mode === "V") { displayValue = voltage; unit = "V"; }
  if (mode === "A") { displayValue = current; unit = "mA"; }
  if (mode === "R") { displayValue = resistance; unit = "kΩ"; }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        color: "#ccc",
        fontFamily: "monospace",
        fontSize: "10px",
        marginBottom: "6px",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 6px",
        borderRadius: "4px"
      }}>
        {label}
      </div>

      <div style={{
        width: 140,
        height: 180,
        background: "#e6b800", // Classic Yellow Multimeter Corpe
        borderRadius: "8px",
        border: "3px solid #111",
        boxShadow: "0 8px 20px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px",
        boxSizing: "border-box"
      }}>
        
        {/* LCD Screen */}
        <div style={{
          width: "100%",
          height: 50,
          background: "#8fa38c", // LCD Green/Grey
          border: "2px inset #536350",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "5px 10px",
          boxSizing: "border-box",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.3)"
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "28px", fontWeight: "bold", color: "#111", textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>
            {displayValue}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#222", marginLeft: "4px", marginTop: "10px" }}>
            {unit}
          </span>
        </div>

        {/* Rotary Dial Area */}
        <div style={{ marginTop: "15px", position: "relative", width: 60, height: 60, borderRadius: "50%", background: "#111", border: "2px solid #222" }}>
          {/* Knob */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 40,
            height: 40,
            background: "#333",
            borderRadius: "50%",
            boxShadow: "0 2px 5px rgba(0,0,0,0.8)",
            transform: `translate(-50%, -50%) rotate(${mode === "V" ? -45 : mode === "A" ? 45 : 180}deg)`,
            transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}>
            <div style={{ position: "absolute", top: 4, left: "50%", width: 4, height: 14, background: "#fff", transform: "translateX(-50%)", borderRadius: 2 }} />
          </div>
        </div>

        {/* Mode Buttons */}
        <div style={{ display: "flex", gap: "8px", marginTop: "15px" }}>
          <button onMouseDown={() => setMode("V")} style={btnStyle(mode === "V")}>V</button>
          <button onMouseDown={() => setMode("A")} style={btnStyle(mode === "A")}>A</button>
          <button onMouseDown={() => setMode("R")} style={btnStyle(mode === "R")}>Ω</button>
        </div>

      </div>
    </div>
  );
};

const btnStyle = (active) => ({
  background: active ? "#ff3333" : "#444",
  color: "#fff",
  border: "1px solid #111",
  borderRadius: "4px",
  width: "30px",
  height: "24px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: active ? "inset 0 2px 4px rgba(0,0,0,0.4)" : "0 2px 3px rgba(0,0,0,0.6)"
});

export default Multimeter;
