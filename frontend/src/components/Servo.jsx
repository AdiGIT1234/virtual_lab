import React from 'react';

const Servo = ({ angle = 0, label = "Micro Servo SG90" }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>{label}</div>
      <div style={styles.body}>
        {/* Main Case */}
        <div style={styles.case}>
          {/* Top Gear Housing */}
          <div style={styles.gearHousing} />
          
          {/* Output Shaft / Shaft Base */}
          <div style={styles.shaftBase} />

          {/* Servo Horn (Rotating Part) */}
          <div style={{
            ...styles.hornContainer,
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          }}>
            <div style={styles.hornArm} />
            <div style={styles.hornCenter} />
          </div>
        </div>
        
        {/* Output Wires (Standard Servo Colors) */}
        <div style={styles.wires}>
          <div style={{ ...styles.wire, background: "#fbbf24" }} /> {/* Signal (Yellow) */}
          <div style={{ ...styles.wire, background: "#ef4444" }} /> {/* VCC (Red) */}
          <div style={{ ...styles.wire, background: "#451a03" }} /> {/* GND (Brown) */}
        </div>
      </div>
      <div style={styles.readout}>{Math.round(angle)}°</div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
    gap: "6px",
  },
  label: {
    color: "#94a3b8",
    fontFamily: "Inter, sans-serif",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    background: "rgba(15, 23, 42, 0.6)",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  body: {
    position: "relative",
    width: 70,
    height: 90,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  case: {
    width: 44,
    height: 60,
    background: "linear-gradient(135deg, #1d4ed8, #1e40af)",
    borderRadius: "4px",
    position: "relative",
    boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)",
    border: "1px solid rgba(0,0,0,0.3)",
  },
  gearHousing: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#1d4ed8",
    border: "1px solid rgba(0,0,0,0.2)",
    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1)",
  },
  shaftBase: {
    position: "absolute",
    top: -4,
    left: "50%",
    transform: "translateX(-50%)",
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#1e3a8a",
    boxShadow: "inset 0 4px 6px rgba(0,0,0,0.4)",
  },
  hornContainer: {
    position: "absolute",
    top: 6,
    left: "50%",
    width: 10,
    height: 10,
    zIndex: 10,
    transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  hornCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#f1f5f9",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  hornArm: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translateY(-50%)",
    width: 28,
    height: 6,
    background: "#f1f5f9",
    borderRadius: "0 3px 3px 0",
    boxShadow: "2px 2px 4px rgba(0,0,0,0.2)",
  },
  hornArmReverse: {
    position: "absolute",
    top: "50%",
    right: "50%",
    transform: "translateY(-50%)",
    width: 10,
    height: 6,
    background: "#f1f5f9",
    borderRadius: "3px 0 0 3px",
  },
  wires: {
    marginTop: "2px",
    display: "flex",
    gap: "1px",
  },
  wire: {
    width: "4px",
    height: "20px",
    borderRadius: "1px",
    boxShadow: "inset -1px 0 2px rgba(0,0,0,0.3)",
  },
  readout: {
    color: "#fbbf24",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: "700",
    background: "rgba(0,0,0,0.8)",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid rgba(251, 191, 36, 0.2)",
  }
};

export default Servo;
