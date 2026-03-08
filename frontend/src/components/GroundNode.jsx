import React from "react";

const GroundNode = ({ label = "GND" }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={styles.badge}>{label}</div>
      <svg width="60" height="80" viewBox="0 0 60 80">
        <line x1="30" y1="10" x2="30" y2="50" stroke="#888" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="50" x2="50" y2="50" stroke="#00ffaa" strokeWidth="4" />
        <line x1="18" y1="60" x2="42" y2="60" stroke="#00ffaa" strokeWidth="4" />
        <line x1="24" y1="70" x2="36" y2="70" stroke="#00ffaa" strokeWidth="4" />
      </svg>
    </div>
  );
};

const styles = {
  badge: {
    color: "#ccc",
    fontSize: "10px",
    background: "rgba(0,0,0,0.5)",
    padding: "2px 6px",
    borderRadius: "4px",
    marginBottom: "4px",
    letterSpacing: "0.1em",
  },
};

export default GroundNode;
