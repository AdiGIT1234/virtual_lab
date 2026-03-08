import React from "react";

const VccNode = ({ label = "+5V" }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={styles.badge}>{label}</div>
      <svg width="60" height="80" viewBox="0 0 60 80">
        <polygon points="30,10 50,40 10,40" fill="#ffcf33" stroke="#b88c00" strokeWidth="2" />
        <line x1="30" y1="40" x2="30" y2="70" stroke="#ffcf33" strokeWidth="4" strokeLinecap="round" />
        <circle cx="30" cy="70" r="6" fill="#ffcf33" stroke="#b88c00" strokeWidth="2" />
      </svg>
    </div>
  );
};

const styles = {
  badge: {
    color: "#f8f1d4",
    fontSize: "10px",
    background: "rgba(20,20,0,0.5)",
    padding: "2px 6px",
    borderRadius: "4px",
    marginBottom: "4px",
    letterSpacing: "0.1em",
  },
};

export default VccNode;
