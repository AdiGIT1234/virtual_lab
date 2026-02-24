import React from 'react';

const PushButton = ({ state = false, label = "Button" }) => {
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
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ filter: "drop-shadow(0px 4px 5px rgba(0,0,0,0.5))" }}>
        
        {/* Metal Legs */}
        <line x1="10" y1="10" x2="10" y2="0" stroke="#999" strokeWidth="4" />
        <line x1="50" y1="10" x2="50" y2="0" stroke="#999" strokeWidth="4" />
        <line x1="10" y1="50" x2="10" y2="60" stroke="#999" strokeWidth="4" />
        <line x1="50" y1="50" x2="50" y2="60" stroke="#999" strokeWidth="4" />

        {/* Outer Body (Metal/Plastic base) */}
        <rect x="5" y="10" width="50" height="40" rx="4" fill="#2a2a2a" stroke="#111" strokeWidth="2" />
        <rect x="10" y="15" width="40" height="30" rx="2" fill="#1a1a1a" />
        
        {/* Pressable Cap */}
        <circle 
          cx="30" cy="30" r="12" 
          fill={state ? "#cc0000" : "#ff3333"} 
          stroke="#440000" strokeWidth="2" 
          style={{
            transform: `scale(${state ? 0.9 : 1})`,
            transformOrigin: "center",
            transition: "transform 0.05s ease-in-out, fill 0.05s ease-in-out"
          }}
        />
        
        {/* Cap Highlight to look 3D */}
        {!state && <circle cx="28" cy="26" r="4" fill="rgba(255,255,255,0.3)" />}

      </svg>
    </div>
  );
};

export default PushButton;
