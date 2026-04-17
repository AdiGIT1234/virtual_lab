import React from 'react';

/**
 * Ceramic / electrolytic capacitor — pure SVG, 48 × 80.
 * Pin tip circles at (24, 0) and (24, 80) — matches DraggableWrapper terminalLayout.
 * No wrapper div: SVG coordinates map 1-to-1 with terminalLayout.
 */
const Capacitor = ({ capacitance = 10, unit = 'μF' }) => {
  const cx      = 24;    // horizontal centre
  const r       = 22;    // disc radius
  const leadLen = 18;    // wire lead length above and below disc
  const totalH  = leadLen + r * 2 + leadLen;  // 80px total

  const discCy  = leadLen + r;  // 40

  return (
    <svg
      width={cx * 2}
      height={totalH}
      viewBox={`0 0 ${cx * 2} ${totalH}`}
      style={{ overflow: 'visible', display: 'block', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
    >
      {/* ── Top lead ── */}
      <line
        x1={cx} y1={0}
        x2={cx} y2={leadLen}
        stroke="#94a3b8" strokeWidth={3} strokeLinecap="round"
      />

      {/* ── Disc body ── */}
      <circle cx={cx} cy={discCy} r={r} fill="#0369a1" />
      {/* Highlight half */}
      <path
        d={`M ${cx} ${leadLen} A ${r} ${r} 0 0 1 ${cx} ${leadLen + r * 2}`}
        fill="#0ea5e9"
      />
      {/* Polarity stripe */}
      <rect x={cx} y={leadLen} width={r} height={r * 2} rx={0}
        fill="rgba(0,0,0,0.15)" />
      {/* "−" polarity mark */}
      <text x={cx + r * 0.5} y={discCy + 4}
        textAnchor="middle" fill="rgba(255,255,255,0.55)"
        fontSize={10} fontWeight="bold" fontFamily="monospace">−</text>
      {/* "+" mark on positive side */}
      <text x={cx - r * 0.5} y={discCy + 4}
        textAnchor="middle" fill="rgba(255,255,255,0.55)"
        fontSize={10} fontWeight="bold" fontFamily="monospace">+</text>

      {/* ── Value label ── */}
      <text
        x={cx} y={discCy + 2}
        textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={9} fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {capacitance}{unit}
      </text>

      {/* ── Bottom lead ── */}
      <line
        x1={cx} y1={leadLen + r * 2}
        x2={cx} y2={totalH}
        stroke="#94a3b8" strokeWidth={3} strokeLinecap="round"
      />

      {/* ── Pin tip circles (visual) ── */}
      <circle
        cx={cx} cy={0} r={4}
        fill="#22d3ee" stroke="rgba(255,255,255,0.3)" strokeWidth={1} opacity={0.9}
      />
      <circle
        cx={cx} cy={totalH} r={4}
        fill="#22d3ee" stroke="rgba(255,255,255,0.3)" strokeWidth={1} opacity={0.9}
      />

      {/* Pin labels */}
      <text x={cx + 8} y={6}
        fill="#475569" fontSize={7} fontFamily="monospace" dominantBaseline="middle">+</text>
      <text x={cx + 8} y={totalH - 2}
        fill="#475569" fontSize={7} fontFamily="monospace" dominantBaseline="middle">−</text>
    </svg>
  );
};

export default Capacitor;
