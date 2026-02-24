import React from 'react';

const RGB_LED = ({ rState = false, gState = false, bState = false, label = "RGB LED" }) => {
  // Calculate combined color based on boolean RGB states
  let r = rState ? 255 : 50;
  let g = gState ? 255 : 50;
  let b = bState ? 255 : 50;
  
  // If no pins are on, show a dormant off-white/gray lens
  if (!rState && !gState && !bState) {
    r = 100; g = 100; b = 100;
  }

  const colorStr = `rgb(${r}, ${g}, ${b})`;
  const isOff = (!rState && !gState && !bState);
  const glow = isOff ? "none" : `drop-shadow(0px 0px 15px rgba(${r}, ${g}, ${b}, 0.8)) drop-shadow(0px 0px 30px rgba(${r}, ${g}, ${b}, 0.6))`;

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
      <svg width="40" height="60" viewBox="0 0 40 60" style={{ filter: glow }}>
        
        {/* Metal Leads (4 leads for RGB: R, Common Cathode, G, B) */}
        <line x1="8" y1="30" x2="8" y2="60" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="30" x2="16" y2="60" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="30" x2="24" y2="60" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="30" x2="32" y2="60" stroke="#999" strokeWidth="2" strokeLinecap="round" />

        {/* LED Base Lip */}
        <rect x="2" y="32" width="36" height="4" rx="2" fill={`rgb(${r*0.6}, ${g*0.6}, ${b*0.6})`} />
        
        {/* LED Bulb Body */}
        <path d="M 4 32 L 4 15 C 4 5, 36 5, 36 15 L 36 32 Z" fill={colorStr} />

        {/* 3D Core Shading / Highlights */}
        <path d="M 8 32 L 8 15 C 8 8, 20 8, 20 15 L 20 32 Z" fill="rgba(255,255,255,0.4)" />
      </svg>
    </div>
  );
};

export default RGB_LED;
