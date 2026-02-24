import React from 'react';

const Resistor = ({ ohms = "220" }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        color: '#ccc', 
        fontFamily: 'monospace', 
        fontSize: '10px', 
        marginBottom: '4px', 
        background: 'rgba(0,0,0,0.5)', 
        padding: '2px 6px', 
        borderRadius: '4px' 
      }}>
        {ohms}Ω Resistor
      </div>
      <svg width="100" height="30" viewBox="0 0 100 30" style={{ filter: "drop-shadow(0px 4px 5px rgba(0,0,0,0.5))" }}>
        
        {/* Metal Leads */}
        <line x1="0" y1="15" x2="30" y2="15" stroke="#999" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="15" x2="100" y2="15" stroke="#999" strokeWidth="4" strokeLinecap="round" />
        
        {/* Resistor Body Base */}
        <rect x="25" y="4" width="50" height="22" fill="#d4a373" rx="6" stroke="#4a3b2c" strokeWidth="1" />
        
        {/* 3D Core Shading */}
        <rect x="25" y="4" width="50" height="8" fill="rgba(255,255,255,0.2)" rx="6" />
        <rect x="25" y="20" width="50" height="6" fill="rgba(0,0,0,0.3)" rx="6" />

        {/* Color Bands (assuming 220 Ohm matching standard RED RED BROWN GOLD) */}
        <rect x="35" y="4" width="4" height="22" fill="#cc0000" />
        <rect x="45" y="4" width="4" height="22" fill="#cc0000" />
        <rect x="55" y="4" width="4" height="22" fill="#4a3b2c" />
        <rect x="65" y="4" width="3" height="22" fill="#cfb53b" />
      </svg>
    </div>
  );
};

export default Resistor;
