import React from 'react';

const Servo = ({ angle = 0, label = "Servo" }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        color: "#ccc",
        fontFamily: "monospace",
        fontSize: "10px",
        marginBottom: "4px",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 6px",
        borderRadius: "4px"
      }}>
        {label}
      </div>
      <div style={{ position: "relative", width: 80, height: 60 }}>
        {/* Chassis */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 10,
          width: 60,
          height: 40,
          background: "#1e5fa7", // Classic transparent-ish blue servo
          borderRadius: 4,
          boxShadow: "0 4px 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.2)"
        }}>
          {/* Mount Tabs */}
          <div style={{ position: "absolute", bottom: -5, left: -10, width: 10, height: 20, background: "#1b4d85", borderRadius: "4px 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: -5, right: -10, width: 10, height: 20, background: "#1b4d85", borderRadius: "0 4px 4px 0" }} />
        </div>

        {/* Cylinder / Gear Base */}
        <div style={{
          position: "absolute",
          top: 10,
          left: 40,
          transform: "translateX(-50%)",
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#1e5fa7",
          boxShadow: "inset 0 4px 4px rgba(255,255,255,0.2)"
        }} />

        {/* The White Servo Horn (Rotates) */}
        <div style={{
          position: "absolute",
          top: 25,
          left: 40,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ddd",
          boxShadow: "0 2px 5px rgba(0,0,0,0.6)",
          zIndex: 10,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transformOrigin: "center center",
          transition: "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}>
          {/* Horn Arm */}
          <div style={{
            position: "absolute",
            top: 4,
            left: 50,
            transform: "translateY(-50%)",
            width: 30,
            height: 6,
            background: "#ddd",
            borderRadius: 3,
            boxShadow: "0 2px 3px rgba(0,0,0,0.5)"
          }} />
        </div>

        {/* Wiring Leads coming out of the side */}
        <div style={{ position: "absolute", right: -5, bottom: 5, width: 15, height: 10, display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ width: "100%", height: 3, background: "#ff6600" }} /> {/* Signal inline */}
          <div style={{ width: "100%", height: 3, background: "#cc0000" }} /> {/* VCC inline */}
          <div style={{ width: "100%", height: 3, background: "#5a3a22" }} /> {/* GND inline */}
        </div>

      </div>
    </div>
  );
};

export default Servo;
