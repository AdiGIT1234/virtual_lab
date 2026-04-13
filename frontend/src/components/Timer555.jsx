import React from 'react';

/**
 * Minimal DIP-8 555 Timer IC.
 * Just the black package body with a notch and 8 small leads.
 */
const Timer555 = ({ label = "NE555" }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        color: '#60a5fa',
        fontFamily: 'monospace',
        fontSize: '9px',
        marginBottom: '2px',
        background: 'rgba(0,0,0,0.5)',
        padding: '1px 4px',
        borderRadius: '3px'
      }}>
        {label}
      </div>
      <svg width="60" height="70" viewBox="0 0 60 70" style={{ overflow: 'visible' }}>
        {/* DIP-8 Body */}
        <rect x="10" y="10" width="40" height="50" rx="2" fill="#111" stroke="#000" strokeWidth="1" />
        {/* Notch */}
        <path d="M 24 10 A 6 6 0 0 0 36 10" fill="#111" stroke="#333" strokeWidth="1" />
        
        {/* Pins (8 leads) */}
        {[0, 1, 2, 3].map(i => (
          <React.Fragment key={i}>
            <line x1="2" y1={20 + i * 10} x2="10" y2={20 + i * 10} stroke="#999" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1={20 + i * 10} x2="58" y2={20 + i * 10} stroke="#999" strokeWidth="2" strokeLinecap="round" />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

export default Timer555;
