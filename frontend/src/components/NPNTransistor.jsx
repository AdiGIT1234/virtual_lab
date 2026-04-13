import React from 'react';

/**
 * Minimal NPN Transistor SVG.
 * Just the TO-92 body and 3 leads.
 */
const NPNTransistor = ({ label = "NPN" }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: '9px',
        marginBottom: '2px',
        background: 'rgba(0,0,0,0.5)',
        padding: '1px 4px',
        borderRadius: '3px'
      }}>
        {label}
      </div>
      <svg width="40" height="60" viewBox="0 0 40 60" style={{ overflow: 'visible' }}>
        {/* TO-92 Body */}
        <path d="M 10 30 A 10 10 0 0 1 30 30 L 30 45 L 10 45 Z" fill="#222" stroke="#111" strokeWidth="1" />
        <rect x="10" y="30" width="20" height="2" fill="#444" />
        
        {/* Leads (Collector, Base, Emitter) */}
        <line x1="15" y1="45" x2="15" y2="60" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="45" x2="20" y2="60" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="45" x2="25" y2="60" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default NPNTransistor;
