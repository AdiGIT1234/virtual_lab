import React from 'react';

const Multimeter = ({ value = 0, label = "Multimeter", mode = "V", onModeChange }) => {
  const setMode = (m) => onModeChange?.(m);

  // Map 0-1023 input to simulated values
  const voltage = ((value / 1023) * 5.0).toFixed(2);
  const current = ((value / 1023) * 20.0).toFixed(1);
  const resistance = ((value / 1023) * 10.0).toFixed(2);

  let displayValue = "";
  let unit = "";
  if (mode === "V") { displayValue = voltage; unit = "V"; }
  if (mode === "A") { displayValue = current; unit = "mA"; }
  if (mode === "R") { displayValue = resistance; unit = "kΩ"; }

  const modeAngle = mode === "V" ? -45 : mode === "A" ? 45 : 180;

  return (
    <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      <svg width={140} height={210} viewBox="0 0 140 210" style={{ display: 'block' }}>
        {/* Label Background */}
        <rect x={10} y={0} width={120} height={16} rx={4} fill="rgba(0,0,0,0.5)" />
        <text x={70} y={11} fill="#ccc" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {label}
        </text>

        {/* Multimeter Body */}
        <rect x={0} y={20} width={140} height={190} rx={8} fill="#e6b800" stroke="#111" strokeWidth={3} />
        
        {/* LCD Screen area */}
        <rect x={10} y={30} width={120} height={50} rx={4} fill="#8fa38c" stroke="#536350" strokeWidth={2} />
        <text x={100} y={65} fill="#111" fontSize={28} fontFamily="monospace" fontWeight="bold" textAnchor="end">
          {displayValue}
        </text>
        <text x={105} y={65} fill="#222" fontSize={14} fontFamily="monospace" fontWeight="bold">
          {unit}
        </text>

        {/* Dial Background */}
        <circle cx={70} cy={115} r={32} fill="#111" stroke="#222" strokeWidth={2} />
        
        {/* Mode markings */}
        <text x={40} y={95} fill="#111" fontSize={12} fontWeight="bold" textAnchor="middle">V</text>
        <text x={100} y={95} fill="#111" fontSize={12} fontWeight="bold" textAnchor="middle">A</text>
        <text x={70} y={160} fill="#111" fontSize={12} fontWeight="bold" textAnchor="middle">Ω</text>

        {/* Dial Knob */}
        <g transform={`translate(70, 115) rotate(${modeAngle})`} style={{ transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <circle cx={0} cy={0} r={22} fill="#333" stroke="#111" strokeWidth={1} />
          <rect x={-2} y={-18} width={4} height={12} rx={2} fill="#fff" />
        </g>

        {/* Mode buttons (clickable via foreignObject or invisible rects, let's use svg elements) */}
        <g onClick={() => setMode("V")} style={{ cursor: 'pointer' }}>
          <rect x={20} y={150} width={28} height={20} rx={4} fill={mode === "V" ? "#ff3333" : "#444"} stroke="#111" strokeWidth={1} />
          <text x={34} y={164} fill="#fff" fontSize={12} fontWeight="bold" textAnchor="middle">V</text>
        </g>
        <g onClick={() => setMode("A")} style={{ cursor: 'pointer' }}>
          <rect x={56} y={150} width={28} height={20} rx={4} fill={mode === "A" ? "#ff3333" : "#444"} stroke="#111" strokeWidth={1} />
          <text x={70} y={164} fill="#fff" fontSize={12} fontWeight="bold" textAnchor="middle">A</text>
        </g>
        <g onClick={() => setMode("R")} style={{ cursor: 'pointer' }}>
          <rect x={92} y={150} width={28} height={20} rx={4} fill={mode === "R" ? "#ff3333" : "#444"} stroke="#111" strokeWidth={1} />
          <text x={106} y={164} fill="#fff" fontSize={12} fontWeight="bold" textAnchor="middle">Ω</text>
        </g>

        {/* Probe Sockets (V, A, Ω, COM) */}
        {/* Socket V */}
        <text x={26} y={185} fill="#ff3333" fontSize={8} fontWeight="bold" textAnchor="middle">V</text>
        <circle cx={26} cy={195} r={8} fill="#ff3333" stroke="#222" strokeWidth={2} />
        
        {/* Socket A */}
        <text x={55} y={185} fill="#ffcc00" fontSize={8} fontWeight="bold" textAnchor="middle">A</text>
        <circle cx={55} cy={195} r={8} fill="#ffcc00" stroke="#222" strokeWidth={2} />

        {/* Socket R (Ω) */}
        <text x={84} y={185} fill="#33ff33" fontSize={8} fontWeight="bold" textAnchor="middle">Ω</text>
        <circle cx={84} cy={195} r={8} fill="#33ff33" stroke="#222" strokeWidth={2} />

        {/* Socket COM */}
        <text x={113} y={185} fill="#bbb" fontSize={8} fontWeight="bold" textAnchor="middle">COM</text>
        <circle cx={113} cy={195} r={8} fill="#111" stroke="#222" strokeWidth={2} />
      </svg>
    </div>
  );
};

export default Multimeter;
