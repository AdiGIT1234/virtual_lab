import React from 'react';

const getColor = (digit) => {
  const colors = ["#000000","#964B00","#FF0000","#FFA500","#FFFF00","#008000","#0000FF","#8B00FF","#808080","#FFFFFF"];
  return colors[Math.max(0, Math.min(9, digit))] || "#999";
};

const getMultiplierColor = (multiplier) => {
  const multipliers = ["#000000","#964B00","#FF0000","#FFA500","#FFFF00","#008000","#0000FF","#8B00FF","#808080","#FFFFFF","#CFB53B","#C0C0C0"];
  const power = multiplier > 0 ? Math.round(Math.log10(multiplier)) : 0;
  if (power === -1) return multipliers[10];
  if (power === -2) return multipliers[11];
  return multipliers[Math.max(0, Math.min(9, power))] || "#999";
};

const formatValue = (val) => {
  const n = Number(val) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}MΩ`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}kΩ`;
  return `${n}Ω`;
};

/**
 * Resistor SVG — 120 × 60.
 * Pin tip circles at (0, 36) and (120, 36) — matches DraggableWrapper terminalLayout.
 * Single SVG: no separate label div, so coordinates are absolute within the SVG.
 */
const Resistor = ({ resistance = 220 }) => {
  const ohms  = Math.max(1, Math.round(Number(resistance) || 220));
  const str   = ohms.toString();
  const d1    = parseInt(str[0]) || 0;
  const d2    = parseInt(str[1]) || 0;
  const mult  = Math.max(1, Math.pow(10, Math.max(0, str.length - 2)));

  const leadY  = 36;   // centered vertical position of leads
  const bodyX1 = 28;   // body left edge
  const bodyX2 = 92;   // body right edge
  const bodyW  = bodyX2 - bodyX1; // 64

  return (
    <svg
      width={120} height={60}
      viewBox="0 0 120 60"
      style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
    >
      <defs>
        <linearGradient id="rLead" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#94a3b8" />
          <stop offset="50%"  stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <radialGradient id="metalEnd" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#f1f5f9" />
          <stop offset="45%"  stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
        <linearGradient id="rBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#e9c46a" />
          <stop offset="50%"  stopColor="#d4a373" />
          <stop offset="100%" stopColor="#9a6b40" />
        </linearGradient>
      </defs>

      {/* ── Value label ── */}
      <text
        x={60} y={13}
        textAnchor="middle" dominantBaseline="middle"
        fill="#e2e8f0" fontSize={9} fontWeight="700"
        fontFamily="'JetBrains Mono', 'Courier New', monospace"
        letterSpacing="0.05em"
      >
        {formatValue(ohms)}
      </text>

      {/* ── Left & right leads ── */}
      <line x1={0}   y1={leadY} x2={bodyX1} y2={leadY} stroke="url(#rLead)" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={bodyX2} y1={leadY} x2={120} y2={leadY} stroke="url(#rLead)" strokeWidth={3.5} strokeLinecap="round" />

      {/* ── Body ── */}
      <rect x={bodyX1} y={leadY - 10} width={bodyW} height={20} rx={5} fill="url(#rBody)" stroke="#4a3b2c" strokeWidth={0.5} />
      {/* Top highlight */}
      <rect x={bodyX1} y={leadY - 10} width={bodyW} height={6} rx={5} fill="rgba(255,255,255,0.2)" />
      {/* Bottom shadow */}
      <rect x={bodyX1} y={leadY + 4}  width={bodyW} height={6} rx={5} fill="rgba(0,0,0,0.25)" />

      {/* ── Color bands ── */}
      <rect x={bodyX1 + 9}  y={leadY - 10} width={5} height={20} fill={getColor(d1)} />
      <rect x={bodyX1 + 18} y={leadY - 10} width={5} height={20} fill={getColor(d2)} />
      <rect x={bodyX1 + 27} y={leadY - 10} width={5} height={20} fill={getMultiplierColor(mult)} />
      {/* Gold tolerance band */}
      <rect x={bodyX2 - 14} y={leadY - 10} width={4} height={20} fill="#CFB53B" />

      {/* Band highlight gloss */}
      <rect x={bodyX1} y={leadY - 10} width={bodyW} height={4} rx={2} fill="rgba(255,255,255,0.12)" />

      {/* ── Pin tip circles — metallic wire ends ── */}
      <circle cx={0}   cy={leadY} r={5} fill="url(#metalEnd)" stroke="#1e293b" strokeWidth={0.8} />
      <circle cx={120} cy={leadY} r={5} fill="url(#metalEnd)" stroke="#1e293b" strokeWidth={0.8} />

      {/* Pin labels */}
      <text x={10}  y={leadY + 14} textAnchor="middle" fill="#475569" fontSize={7} fontFamily="monospace">T1</text>
      <text x={110} y={leadY + 14} textAnchor="middle" fill="#475569" fontSize={7} fontFamily="monospace">T2</text>
    </svg>
  );
};

export default Resistor;
