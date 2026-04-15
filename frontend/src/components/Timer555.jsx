import React from 'react';

const Timer555 = () => {
  const pinTextColor = "#94a3b8";

  return (
    <div style={{ position: 'relative', width: 100, height: 120 }}>
      <svg width="100" height="120" viewBox="0 0 100 120" style={{ overflow: 'visible' }}>
        {/* DIP-8 Body */}
        <rect 
          x="25" y="10" width="50" height="100" 
          fill="#1e1e1e" rx="3" 
          stroke="#000" strokeWidth="1.5"
        />
        
        {/* Orientation Notch */}
        <path d="M 40 10 A 10 10 0 0 0 60 10" fill="#000" />

        {/* Part Label */}
        <text 
          x="50" y="65" 
          fill="#fff" 
          fontSize="14" 
          fontWeight="800" 
          textAnchor="middle" 
          fontFamily="monospace"
          style={{ opacity: 0.7 }}
        >
          555
        </text>

        {/* Left Side (1-4) - GND, TRIG, OUT, RESET */}
        {[1, 2, 3, 4].map((id, i) => (
          <g key={id}>
            <rect x="10" y={25 + i * 22} width="15" height="4" fill="#64748b" rx="1" />
            <text x="5" y={28 + i * 22} textAnchor="end" fontSize="8" fill={pinTextColor} fontFamily="monospace">{id}</text>
          </g>
        ))}

        {/* Right Side (8-5) - VCC, DISCH, THRES, CTRL */}
        {[8, 7, 6, 5].map((id, i) => (
          <g key={id}>
            <rect x="75" y={25 + i * 22} width="15" height="4" fill="#64748b" rx="1" />
            <text x="95" y={28 + i * 22} textAnchor="start" fontSize="8" fill={pinTextColor} fontFamily="monospace">{id}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Timer555;
