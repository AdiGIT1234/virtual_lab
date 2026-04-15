import React from 'react';

const PNPTransistor = () => {
  const pinTextColor = "#cbd5e1";

  return (
    <div style={{ position: 'relative', width: 60, height: 80 }}>
      <svg width="60" height="80" viewBox="0 0 60 80" style={{ overflow: 'visible' }}>
        {/* TO-92 Body */}
        <path 
          d="M 10 20 A 20 20 0 0 1 50 20 L 50 35 L 10 35 Z" 
          fill="#333" stroke="#000" strokeWidth="1.5" 
        />
        <rect x="10" y="20" width="40" height="1" fill="#444" />
        
        {/* Emitter (E) */}
        <line x1="15" y1="35" x2="15" y2="65" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <text x="15" y="78" textAnchor="middle" fill={pinTextColor} fontSize="9" fontFamily="monospace">E</text>

        {/* Base (B) */}
        <line x1="30" y1="35" x2="30" y2="65" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <text x="30" y="78" textAnchor="middle" fill={pinTextColor} fontSize="9" fontFamily="monospace">B</text>

        {/* Collector (C) */}
        <line x1="45" y1="35" x2="45" y2="65" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <text x="45" y="78" textAnchor="middle" fill={pinTextColor} fontSize="9" fontFamily="monospace">C</text>

        {/* Label on Body */}
        <text x="30" y="31" textAnchor="middle" fill="#f472b6" fontSize="8" fontWeight="bold" fontFamily="monospace">PNP</text>
      </svg>
    </div>
  );
};

export default PNPTransistor;
