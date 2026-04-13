import React from 'react';

/**
 * Minimal capacitor SVG — just the ceramic disc body + two wire leads.
 * Terminal access points are at the very tip of each lead (top and bottom).
 * The component has zero bounding box padding — wires connect to lead tips.
 *
 * Layout (SVG coords):
 *   - Lead 1 tip:  (cx, 0)    ← top terminal
 *   - Disc centre: (cx, leadLen)
 *   - Lead 2 tip:  (cx, leadLen + r*2 + leadLen) ← bottom terminal
 */
const Capacitor = ({ capacitance = 10, unit = 'μF' }) => {
  const cx  = 24;    // horizontal centre
  const r   = 22;    // disc radius
  const leadLen = 18; // wire lead length above and below disc
  const totalH  = leadLen + r * 2 + leadLen;  // full SVG height

  return (
    <svg
      width={cx * 2}
      height={totalH}
      viewBox={`0 0 ${cx * 2} ${totalH}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Lead 1 — top */}
      <line
        x1={cx} y1={0}
        x2={cx} y2={leadLen}
        stroke="#bbb"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Disc body */}
      <circle
        cx={cx}
        cy={leadLen + r}
        r={r}
        fill="#0284c7"
      />
      {/* Highlight half */}
      <path
        d={`M ${cx} ${leadLen} A ${r} ${r} 0 0 1 ${cx} ${leadLen + r * 2}`}
        fill="#38bdf8"
      />
      {/* Polarity marker line */}
      <line
        x1={cx} y1={leadLen + r * 0.6}
        x2={cx} y2={leadLen + r * 1.4}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={2}
      />

      {/* Value label */}
      <text
        x={cx}
        y={leadLen + r + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {capacitance}{unit}
      </text>

      {/* Lead 2 — bottom */}
      <line
        x1={cx} y1={leadLen + r * 2}
        x2={cx} y2={totalH}
        stroke="#bbb"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Capacitor;
