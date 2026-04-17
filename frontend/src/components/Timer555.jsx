import React from 'react';

const PIN_LABELS = [
  { id: 'gnd',   num: 1, name: 'GND',   side: 'left',  i: 0, desc: 'Ground'        },
  { id: 'trig',  num: 2, name: 'TRIG',  side: 'left',  i: 1, desc: 'Trigger'       },
  { id: 'out',   num: 3, name: 'OUT',   side: 'left',  i: 2, desc: 'Output'        },
  { id: 'reset', num: 4, name: 'RST',   side: 'left',  i: 3, desc: 'Reset'         },
  { id: 'ctrl',  num: 5, name: 'CTRL',  side: 'right', i: 3, desc: 'Control'       },
  { id: 'thres', num: 6, name: 'THR',   side: 'right', i: 2, desc: 'Threshold'     },
  { id: 'disch', num: 7, name: 'DIS',   side: 'right', i: 1, desc: 'Discharge'     },
  { id: 'vcc',   num: 8, name: 'VCC',   side: 'right', i: 0, desc: '+Supply'       },
];

// Body dimensions
const W = 60;   // body width
const H = 104;  // body height
const LEAD_LEN = 16;
const TOTAL_W = W + LEAD_LEN * 2;  // 92 total
const PIN_SPACING = H / 4;         // 26px between pins
const FIRST_PIN_Y = PIN_SPACING / 2 + 2; // ~15px from top

const PIN_COLORS = {
  gnd: '#475569',
  vcc: '#facc15',
  out: '#22d3ee',
  reset: '#f87171',
  trig: '#94a3b8',
  thres: '#94a3b8',
  disch: '#94a3b8',
  ctrl: '#94a3b8',
};

const Timer555 = () => {
  const [hovered, setHovered] = React.useState(null);
  const bodyX = LEAD_LEN;
  const bodyY = 0;

  return (
    <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      <svg
        width={TOTAL_W}
        height={H}
        viewBox={`0 0 ${TOTAL_W} ${H}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* ── DIP-8 body ── */}
        <rect
          x={bodyX} y={bodyY}
          width={W} height={H}
          rx={4}
          fill="#111827"
          stroke="#334155"
          strokeWidth={1.5}
        />
        {/* Top notch (orientation mark) */}
        <path
          d={`M ${bodyX + W / 2 - 8} ${bodyY} A 8 8 0 0 0 ${bodyX + W / 2 + 8} ${bodyY}`}
          fill="#0f172a"
        />
        {/* Die */}
        <rect x={bodyX + 10} y={bodyY + 30} width={W - 20} height={H - 60}
          rx={2} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
        {/* Part number */}
        <text
          x={bodyX + W / 2} y={bodyY + H / 2 - 4}
          fill="#f8fafc" fontSize={11} fontWeight="800"
          textAnchor="middle" fontFamily="monospace" opacity={0.9}
        >
          NE555
        </text>
        <text
          x={bodyX + W / 2} y={bodyY + H / 2 + 10}
          fill="#6366f1" fontSize={7} fontWeight="600"
          textAnchor="middle" fontFamily="monospace" opacity={0.8}
        >
          TIMER IC
        </text>

        {/* ── Pins ── */}
        {PIN_LABELS.map((pin) => {
          const isLeft = pin.side === 'left';
          const y = FIRST_PIN_Y + pin.i * PIN_SPACING;
          const leadX1 = isLeft ? bodyX : bodyX + W;
          const leadX2 = isLeft ? 0 : TOTAL_W;
          const tipX   = isLeft ? 0 : TOTAL_W;
          const color  = PIN_COLORS[pin.id] || '#94a3b8';
          const glow   = hovered === pin.id;

          return (
            <g key={pin.id} onMouseEnter={() => setHovered(pin.id)} onMouseLeave={() => setHovered(null)}>
              {/* Lead wire */}
              <line
                x1={leadX1} y1={y + 2}
                x2={leadX2} y2={y + 2}
                stroke={glow ? color : '#64748b'}
                strokeWidth={glow ? 3 : 2.5}
                strokeLinecap="round"
              />
              {/* Tip circle (interactive hit target marker) */}
              <circle
                cx={tipX} cy={y + 2} r={4}
                fill={color}
                stroke={glow ? '#fff' : 'rgba(255,255,255,0.3)'}
                strokeWidth={glow ? 1.5 : 1}
                opacity={glow ? 1 : 0.85}
                style={{ filter: glow ? `drop-shadow(0 0 4px ${color})` : 'none', transition: 'all 0.15s' }}
              />
              {/* Pin number */}
              <text
                x={isLeft ? bodyX + 5 : bodyX + W - 5}
                y={y + 6}
                fontSize={6.5}
                fontFamily="monospace"
                fill="#475569"
                textAnchor={isLeft ? 'start' : 'end'}
              >
                {pin.num}
              </text>
              {/* Pin name label */}
              <text
                x={isLeft ? bodyX + 14 : bodyX + W - 14}
                y={y + 6}
                fontSize={6.5}
                fontFamily="monospace"
                fill={glow ? color : '#94a3b8'}
                fontWeight={glow ? '700' : '500'}
                textAnchor={isLeft ? 'start' : 'end'}
                style={{ transition: 'fill 0.15s' }}
              >
                {pin.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (() => {
        const pin = PIN_LABELS.find(p => p.id === hovered);
        return pin ? (
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)', marginBottom: 6,
            background: 'rgba(2,6,23,0.96)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap',
            fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace',
            pointerEvents: 'none', zIndex: 100,
          }}>
            Pin {pin.num} · {pin.name} — {pin.desc}
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default Timer555;
