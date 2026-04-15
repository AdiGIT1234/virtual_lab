import React from "react";

const VccNode = ({ value = 5, onChange }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.badge}>
        <input 
          type="number"
          min="1"
          max="24"
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          onMouseDown={(e) => e.stopPropagation()}
          style={styles.input}
        />
        <span style={styles.suffix}>V</span>
      </div>
      <svg width="60" height="80" viewBox="0 0 60 80" style={styles.svg}>
        <polygon points="30,10 50,40 10,40" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
        <line x1="30" y1="40" x2="30" y2="70" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
        <circle cx="30" cy="70" r="6" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
        
        {/* Glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    background: "rgba(15, 23, 42, 0.9)",
    padding: "3px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(250, 204, 21, 0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    marginBottom: "4px",
    cursor: "pointer",
  },
  input: {
    background: "transparent",
    border: "none",
    color: "#fef08a",
    width: "30px",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "right",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
  },
  suffix: {
    color: "#ca8a04",
    fontSize: "10px",
    fontWeight: "bold",
  },
  svg: {
    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
  }
};

export default VccNode;
