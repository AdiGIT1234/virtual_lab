import React from 'react';

const ExternalLED = ({ color = "red", state = false, label = "LED" }) => {
  // ... existing code
  const colors = {
    red: { off: "#5a0000", on: "#ff0000", glow: "rgba(255, 0, 0, 0.6)", highlight: "#ff8888" },
    green: { off: "#003b00", on: "#00ff00", glow: "rgba(0, 255, 0, 0.6)", highlight: "#88ff88" },
    blue: { off: "#00005a", on: "#0088ff", glow: "rgba(0, 136, 255, 0.6)", highlight: "#88ccff" },
    yellow: { off: "#5a5a00", on: "#ffff00", glow: "rgba(255, 255, 0, 0.6)", highlight: "#ffff88" },
  };

  const theme = colors[color] || colors.red;
  const currentFill = state ? theme.on : theme.off;
  const currentGlow = state ? `drop-shadow(0px 0px 15px ${theme.glow}) drop-shadow(0px 0px 30px ${theme.glow})` : "none";

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
      <svg width="60" height="100" viewBox="0 0 60 100" style={{ filter: currentGlow, transition: "all 0.1s ease-in-out" }}>
        <defs>
          <linearGradient id={`legGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#777" />
            <stop offset="50%" stopColor="#ddd" />
            <stop offset="100%" stopColor="#666" />
          </linearGradient>
          <radialGradient id={`bulbGrad-${color}-${state ? 'on' : 'off'}`} cx="30%" cy="30%" r="60%">
            <stop offset="0%" stopColor={state ? theme.highlight : theme.on} />
            <stop offset="40%" stopColor={currentFill} />
            <stop offset="100%" stopColor={theme.off} />
          </radialGradient>
        </defs>

        {/* Anode (Long Leg) */}
        <rect x="35" y="55" width="4" height="45" fill={`url(#legGrad-${color})`} rx="2" />
        {/* Cathode (Short Leg) */}
        <polygon points="21,55 25,55 25,90 21,90" fill={`url(#legGrad-${color})`} rx="2" />

        {/* LED Base Ring */}
        <rect x="8" y="47" width="44" height="8" rx="2" fill={currentFill} stroke="#111" strokeWidth="1" />
        
        {/* LED Bulb */}
        <path d="M 12 48 L 12 25 C 12 5 48 5 48 25 L 48 48 Z" fill={`url(#bulbGrad-${color}-${state ? 'on' : 'off'})`} stroke="#111" strokeWidth="1" />
        
      </svg>
    </div>
  );
};

export default ExternalLED;
