import React from 'react';

/**
 * PNP BJT in TO-92 package.
 * SVG 60 × 80, lead tips at (15, 65), (30, 65), (45, 65) — matches DraggableWrapper terminalLayout.
 * Pins: E (Emitter), B (Base), C (Collector) labelled at the bottom.
 */
const PNPTransistor = () => {
  const [hovered, setHovered] = React.useState(null);

  const pins = [
    { id: 'e', label: 'E', cx: 15, desc: 'Emitter',   color: '#f472b6' },
    { id: 'b', label: 'B', cx: 30, desc: 'Base',      color: '#22d3ee' },
    { id: 'c', label: 'C', cx: 45, desc: 'Collector', color: '#a78bfa' },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      <svg width={60} height={80} viewBox="0 0 60 80" style={{ overflow: 'visible', display: 'block' }}>
        {/* ── TO-92 Package body — D-shaped (flat face front) ── */}
        <path
          d="M 8 38 A 22 24 0 0 1 52 38 Z"
          fill="#2d1b2e" stroke="#7c3f6e" strokeWidth={1.5}
        />
        <rect x={8} y={22} width={44} height={16} fill="#2d1b2e" stroke="#7c3f6e" strokeWidth={1.5} />
        <rect x={9} y={23} width={42} height={4} rx={1} fill="rgba(255,255,255,0.04)" />
        <line x1={8} y1={22} x2={52} y2={22} stroke="#7c3f6e" strokeWidth={1} />

        {/* Part number */}
        <text x={30} y={33} textAnchor="middle" fill="#f472b6"
          fontSize={8} fontWeight="800" fontFamily="monospace">PNP</text>

        {/* ── Leads ── */}
        {pins.map((pin) => {
          const glow = hovered === pin.id;
          return (
            <g key={pin.id} onMouseEnter={() => setHovered(pin.id)} onMouseLeave={() => setHovered(null)}>
              <line
                x1={pin.cx} y1={38}
                x2={pin.cx} y2={65}
                stroke={glow ? pin.color : '#64748b'}
                strokeWidth={glow ? 3 : 2.5}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.15s' }}
              />
              {/* Tip circle */}
              <circle
                cx={pin.cx} cy={65} r={3.5}
                fill={pin.color}
                stroke={glow ? '#fff' : 'rgba(255,255,255,0.25)'}
                strokeWidth={glow ? 1.5 : 1}
                opacity={glow ? 1 : 0.85}
                style={{ filter: glow ? `drop-shadow(0 0 4px ${pin.color})` : 'none', transition: 'all 0.15s' }}
              />
              {/* Label */}
              <text
                x={pin.cx} y={77}
                textAnchor="middle"
                fill={glow ? pin.color : '#94a3b8'}
                fontSize={9} fontFamily="monospace" fontWeight={glow ? '700' : '400'}
                style={{ transition: 'fill 0.15s' }}
              >
                {pin.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (() => {
        const pin = pins.find(p => p.id === hovered);
        return pin ? (
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)', marginBottom: 6,
            background: 'rgba(2,6,23,0.96)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap',
            fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace',
            pointerEvents: 'none', zIndex: 100,
          }}>
            {pin.label} — {pin.desc}
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default PNPTransistor;
