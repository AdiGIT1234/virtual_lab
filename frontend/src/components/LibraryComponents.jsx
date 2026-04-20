import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PeripheralSimulator } from '../engine/PeripheralSimulator';

// ── Shared helpers ─────────────────────────────────────────────────────────

const Pin = ({ x, y, label, color = '#22d3ee' }) => (
  <g>
    <circle cx={x} cy={y} r={3.5} fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
    {label && (
      <text x={x} y={y + 10} fill="#64748b" fontSize={6.5} textAnchor="middle" fontFamily="monospace">
        {label}
      </text>
    )}
  </g>
);

const MountingHole = ({ x, y }) => (
  <g>
    <circle cx={x} cy={y} r={4} fill="#020617" />
    <circle cx={x} cy={y} r={2.5} fill="none" stroke="#334155" strokeWidth={1} />
  </g>
);

// ── Shared sensor helpers ───────────────────────────────────────────────────

function pushAnalog(pin, normalized) {
  if (pin == null) return;
  window.__esp32AnalogInputs = window.__esp32AnalogInputs || {};
  window.__esp32AnalogInputs[pin] = Math.max(0, Math.min(1, normalized));
}

const SENSOR_PANEL = {
  display: 'flex', flexDirection: 'column', gap: 3,
  padding: '5px 7px', marginTop: 3,
  background: 'rgba(0,0,0,0.65)', borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.07)',
  userSelect: 'none',
};

const SliderRow = ({ label, value, min, max, step = 1, unit = '', color = '#22d3ee', onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ color: '#64748b', fontSize: 8, fontFamily: 'monospace', width: 12, flexShrink: 0 }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(+e.target.value)}
      style={{ flex: 1, height: 2, accentColor: color, cursor: 'pointer', minWidth: 0 }}
    />
    <span style={{ color, fontSize: 8, fontFamily: 'monospace', width: 36, textAlign: 'right', flexShrink: 0 }}>
      {Number.isInteger(value) ? value : value.toFixed(1)}{unit}
    </span>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// LCD 1602 — 16×2 character display with live buffer + character cell grid
// ══════════════════════════════════════════════════════════════════════════
export const Lcd1602 = ({ id, wiredPins }) => {
  const [buffer, setBuffer] = useState(new Array(32).fill(' '));
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!id || !wiredPins) return;

    PeripheralSimulator.registerComponent(id, 'LCD1602', {
      pins: {
        rs: wiredPins['rs'],
        e: wiredPins['e'],
        d4: wiredPins['d4'],
        d5: wiredPins['d5'],
        d6: wiredPins['d6'],
        d7: wiredPins['d7'],
      },
      onRenderTarget: (newBuffer) => {
        setBuffer([...newBuffer]);
        setIsActive(true);
      },
    });

    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const line1 = buffer.slice(0, 16).join('');
  const line2 = buffer.slice(16, 32).join('');
  const isEmpty = !isActive;

  // Character cell dimensions inside the SVG
  const CELL_W = 9.5;
  const CELL_H = 14;
  const COLS = 16;
  const ROWS = 2;
  const DISPLAY_X = 18;
  const DISPLAY_Y = 20;
  const DISPLAY_W = COLS * CELL_W + 4;
  const DISPLAY_H = ROWS * (CELL_H + 4) + 4;

  return (
    <svg width={220} height={130} viewBox="0 0 220 130" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`lcd-pcb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <filter id={`lcd-glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* PCB */}
      <rect x={0} y={0} width={220} height={108} rx={4} fill={`url(#lcd-pcb-${id})`} />
      <rect x={0} y={0} width={220} height={108} rx={4} fill="none" stroke="#059669" strokeWidth={1} opacity={0.5} />

      {/* Mounting holes */}
      <MountingHole x={8} y={8} />
      <MountingHole x={212} y={8} />
      <MountingHole x={8} y={100} />
      <MountingHole x={212} y={100} />

      {/* LCD glass area + backlight */}
      <rect x={DISPLAY_X - 2} y={DISPLAY_Y - 2} width={DISPLAY_W + 4} height={DISPLAY_H + 4}
        rx={2} fill={isActive ? '#4ade80' : '#166534'} opacity={0.9} />
      {/* Subtle backlight glow when active */}
      {isActive && (
        <rect x={DISPLAY_X - 6} y={DISPLAY_Y - 6} width={DISPLAY_W + 12} height={DISPLAY_H + 12}
          rx={4} fill="#4ade80" opacity={0.12} style={{ filter: `url(#lcd-glow-${id})` }} />
      )}

      {/* Character cell grid */}
      {[0, 1].map(row =>
        Array.from({ length: COLS }).map((_, col) => (
          <rect
            key={`cell-${row}-${col}`}
            x={DISPLAY_X + 2 + col * CELL_W}
            y={DISPLAY_Y + 2 + row * (CELL_H + 4)}
            width={CELL_W - 1}
            height={CELL_H}
            rx={0.5}
            fill="#166534"
            opacity={0.5}
          />
        ))
      )}

      {/* Buffer text — line 1 */}
      <text
        x={DISPLAY_X + 3}
        y={DISPLAY_Y + 13}
        fill={isActive ? '#052e16' : '#166534'}
        fontSize={11}
        fontFamily="'Courier New', Courier, monospace"
        fontWeight="bold"
        letterSpacing={2}
        style={{ userSelect: 'none' }}
      >
        {isEmpty ? '                ' : line1.padEnd(16)}
      </text>

      {/* Buffer text — line 2 */}
      <text
        x={DISPLAY_X + 3}
        y={DISPLAY_Y + 31}
        fill={isActive ? '#052e16' : '#166534'}
        fontSize={11}
        fontFamily="'Courier New', Courier, monospace"
        fontWeight="bold"
        letterSpacing={2}
        style={{ userSelect: 'none' }}
      >
        {isEmpty ? '   LCD  1602    ' : line2.padEnd(16)}
      </text>

      {/* Idle placeholder dots */}
      {isEmpty && (
        <text x={110} y={58} fill="#4ade80" fontSize={8} textAnchor="middle" opacity={0.4}>
          Waiting for I²C…
        </text>
      )}

      {/* Pin header — 16 pins */}
      <g transform="translate(0, 118)">
        {['VSS','VDD','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','A','K'].map((l, i) => (
          <Pin key={i} x={10 + i * 13} y={5}
            label={l}
            color={i < 3 || i > 13 ? '#facc15' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// OLED SSD1306 — 128×64 I²C OLED with live pixel canvas
// ══════════════════════════════════════════════════════════════════════════
export const OledSSD1306 = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);

  const drawBuffer = useCallback((buffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(128, 64);

    for (let page = 0; page < 8; page++) {
      for (let col = 0; col < 128; col++) {
        const byte = buffer[page * 128 + col];
        for (let bit = 0; bit < 8; bit++) {
          const on = (byte & (1 << bit)) !== 0;
          const x = col;
          const y = page * 8 + bit;
          const idx = (y * 128 + x) * 4;
          imgData.data[idx]     = 0;
          imgData.data[idx + 1] = on ? 220 : 4;
          imgData.data[idx + 2] = on ? 255 : 18;
          imgData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    setHasContent(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    // Draw idle scan-line pattern
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 128, 64);
    }

    PeripheralSimulator.registerComponent(id, 'OLED_SSD1306', {
      address: 0x3c,
      onRenderTarget: drawBuffer,
    });

    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins, drawBuffer]);

  return (
    <svg width={110} height={130} viewBox="0 0 110 130" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`oled-pcb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <filter id={`oled-glow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* PCB */}
      <rect x={0} y={0} width={110} height={108} rx={5} fill={`url(#oled-pcb-${id})`} />
      <rect x={0} y={0} width={110} height={108} rx={5} fill="none" stroke="#3b82f6" strokeWidth={1.5} />

      {/* Mounting holes */}
      <MountingHole x={7} y={7} />
      <MountingHole x={103} y={7} />
      <MountingHole x={7} y={101} />
      <MountingHole x={103} y={101} />

      {/* Screen bezel */}
      <rect x={7} y={14} width={96} height={68} rx={3} fill="#020617" stroke="#0f172a" strokeWidth={1.5} />

      {/* Active glow */}
      {hasContent && (
        <rect x={5} y={12} width={100} height={72} rx={4} fill="#00dcff" opacity={0.06}
          style={{ filter: `url(#oled-glow-${id})` }} />
      )}

      {/* Live canvas */}
      <foreignObject x={8} y={15} width={94} height={66}>
        <canvas
          ref={canvasRef}
          width={128}
          height={64}
          style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
        />
      </foreignObject>

      {/* Module label */}
      <text x={55} y={96} fill="#60a5fa" fontSize={7.5} fontWeight="700" textAnchor="middle" fontFamily="monospace">
        SSD1306 · 128×64 · I²C
      </text>

      {/* 4-pin header */}
      <g transform="translate(0, 118)">
        {['VCC','GND','SCL','SDA'].map((l, i) => (
          <Pin key={i} x={18 + i * 25} y={5} label={l}
            color={i < 2 ? '#facc15' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ILI9341 TFT — 240×320 SPI TFT with live RGB565 canvas + color-test idle
// ══════════════════════════════════════════════════════════════════════════
export const Ili9341Tft = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const renderRef = useRef(null);

  // Draw color-test bars on idle
  const drawIdlePattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
    const sliceH = Math.floor(320 / colors.length);
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * sliceH, 240, sliceH);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 240, 320);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ILI9341', 120, 155);
    ctx.font = '12px monospace';
    ctx.fillText('240 × 320', 120, 175);
  }, []);

  useEffect(() => {
    if (!id || !wiredPins) return;

    drawIdlePattern();

    PeripheralSimulator.registerComponent(id, 'TFT_ILI9341', {
      pins: {
        cs:   wiredPins['cs'],
        dc:   wiredPins['dc'],
        rst:  wiredPins['rst'],
        mosi: wiredPins['mosi'],
        sck:  wiredPins['sck'],
      },
    });

    renderRef.current = setInterval(() => {
      const comp = PeripheralSimulator.components.get(id);
      if (!comp?.state?.buffer || !canvasRef.current) return;

      // Only render if something was actually written
      const buf = comp.state.buffer;
      const hasData = buf.some(v => v !== 0);
      if (!hasData) return;

      const ctx = canvasRef.current.getContext('2d');
      const imgData = ctx.createImageData(240, 320);
      for (let i = 0; i < buf.length; i++) {
        const c = buf[i];
        imgData.data[i * 4]     = ((c >> 11) & 0x1f) * 255 / 31;
        imgData.data[i * 4 + 1] = ((c >> 5)  & 0x3f) * 255 / 63;
        imgData.data[i * 4 + 2] = (c & 0x1f)         * 255 / 31;
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      setHasContent(true);
    }, 80);

    return () => {
      clearInterval(renderRef.current);
      PeripheralSimulator.unregisterComponent(id);
    };
  }, [id, wiredPins, drawIdlePattern]);

  return (
    <svg width={140} height={185} viewBox="0 0 140 185" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`tft-pcb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>

      {/* PCB */}
      <rect x={0} y={0} width={140} height={162} rx={4} fill={`url(#tft-pcb-${id})`} />
      <rect x={0} y={0} width={140} height={162} rx={4} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.5} />

      {/* Mounting holes */}
      <MountingHole x={7} y={7} />
      <MountingHole x={133} y={7} />
      <MountingHole x={7} y={155} />
      <MountingHole x={133} y={155} />

      {/* Screen bezel */}
      <rect x={8} y={12} width={124} height={132} rx={3} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />

      {/* Live canvas */}
      <foreignObject x={9} y={13} width={122} height={130}>
        <canvas
          ref={canvasRef}
          width={240}
          height={320}
          style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
        />
      </foreignObject>

      {/* Module label */}
      <text x={70} y={153} fill="#fca5a5" fontSize={7} fontWeight="700" textAnchor="middle" fontFamily="monospace">
        ILI9341 · 240×320 · SPI
      </text>

      {/* 8-pin header */}
      <g transform="translate(0, 172)">
        {['VCC','GND','CS','RST','DC','MOSI','SCK','LED'].map((l, i) => (
          <Pin key={i} x={10 + i * 16} y={5} label={l}
            color={i < 2 ? '#facc15' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// E-Paper — 296×128 e-ink display with live B/W canvas
// ══════════════════════════════════════════════════════════════════════════
export const EPaperDisplay = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const renderRef = useRef(null);

  const drawIdlePattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0ede0';
    ctx.fillRect(0, 0, 296, 128);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('E-Paper Display', 148, 56);
    ctx.font = '10px monospace';
    ctx.fillText('296 × 128 · SPI', 148, 74);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 288, 120);
  }, []);

  useEffect(() => {
    if (!id || !wiredPins) return;

    drawIdlePattern();

    PeripheralSimulator.registerComponent(id, 'EPAPER_BASIC', {
      pins: {
        cs:   wiredPins['cs'],
        dc:   wiredPins['dc'],
        rst:  wiredPins['rst'],
        mosi: wiredPins['mosi'],
        sck:  wiredPins['sck'],
        busy: wiredPins['busy'],
      },
    });

    renderRef.current = setInterval(() => {
      const comp = PeripheralSimulator.components.get(id);
      if (!comp?.state?.updatePending || !canvasRef.current) return;

      comp.state.updatePending = false;
      const ctx = canvasRef.current.getContext('2d');
      const buf = comp.state.buffer;
      const W = 296, H = 128;
      const imgData = ctx.createImageData(W, H);
      const bytesPerRow = Math.ceil(W / 8);

      for (let i = 0; i < buf.length; i++) {
        const byte = buf[i];
        const y = Math.floor(i / bytesPerRow);
        const xBase = (i % bytesPerRow) * 8;
        for (let bit = 0; bit < 8; bit++) {
          const white = (byte & (0x80 >> bit)) !== 0;
          const px = xBase + bit;
          if (px >= W || y >= H) continue;
          const idx = (y * W + px) * 4;
          const v = white ? 240 : 10;
          imgData.data[idx]     = v;
          imgData.data[idx + 1] = white ? 237 : 10;
          imgData.data[idx + 2] = white ? 224 : 10;
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setHasContent(true);
    }, 250);

    return () => {
      clearInterval(renderRef.current);
      PeripheralSimulator.unregisterComponent(id);
    };
  }, [id, wiredPins, drawIdlePattern]);

  return (
    <svg width={170} height={120} viewBox="0 0 170 120" style={{ display: 'block', overflow: 'visible' }}>
      {/* Module frame */}
      <rect x={0} y={0} width={170} height={92} rx={4} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={2} />
      <rect x={4} y={4} width={162} height={84} rx={2} fill="#f0ede0" />

      {/* Live canvas */}
      <foreignObject x={4} y={4} width={162} height={84}>
        <canvas
          ref={canvasRef}
          width={296}
          height={128}
          style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'crisp-edges' }}
        />
      </foreignObject>

      {/* Update shimmer when content arrives */}
      {hasContent && (
        <rect x={4} y={4} width={162} height={84} rx={2} fill="none" stroke="#22d3ee" strokeWidth={1} opacity={0.4} />
      )}

      {/* Pin header */}
      <g transform="translate(0, 104)">
        {['VCC','GND','SCK','MOSI','CS','DC','RST','BUSY'].map((l, i) => (
          <Pin key={i} x={11 + i * 21} y={5} label={l}
            color={i < 2 ? '#facc15' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Analog TV — static animation
// ══════════════════════════════════════════════════════════════════════════
export const AnalogTV = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let counter = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(160, 120);
      const barY = counter % 120;
      for (let i = 0; i < 160 * 120; i++) {
        const y = Math.floor(i / 160);
        let n = Math.random() * 80 + 30;
        if (Math.abs(y - barY) < 4) n = Math.min(255, n + 60);
        imgData.data[i * 4]     = n;
        imgData.data[i * 4 + 1] = n;
        imgData.data[i * 4 + 2] = n;
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      counter++;
      setTimeout(() => { rafRef.current = requestAnimationFrame(draw); }, 33);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <svg width={210} height={185} viewBox="0 0 210 185" style={{ display: 'block', overflow: 'visible' }}>
      {/* TV cabinet */}
      <rect x={0} y={0} width={210} height={165} rx={12} fill="#78350f" stroke="#92400e" strokeWidth={2} />
      <rect x={4} y={4} width={202} height={157} rx={10} fill="#451a03" />
      {/* Side vents */}
      {[20,32,44,56,68].map(y => <rect key={y} x={172} y={y} width={24} height={7} rx={2} fill="#3a1502" />)}
      {/* Dials */}
      <circle cx={182} cy={90} r={12} fill="#78350f" stroke="#92400e" strokeWidth={1.5} />
      <circle cx={182} cy={90} r={5} fill="#451a03" />
      <circle cx={182} cy={118} r={12} fill="#78350f" stroke="#92400e" strokeWidth={1.5} />
      <circle cx={182} cy={118} r={5} fill="#451a03" />
      {/* Screen area */}
      <rect x={12} y={12} width={150} height={140} rx={20} fill="#1a0d02" />
      <rect x={16} y={16} width={142} height={132} rx={16} fill="#020617" />
      <foreignObject x={16} y={16} width={142} height={132}
        style={{ clipPath: 'inset(0 0 0 0 round 16px)' }}>
        <canvas ref={canvasRef} width={160} height={120}
          style={{ width: '100%', height: '100%', display: 'block', borderRadius: '16px' }} />
      </foreignObject>
      {/* CRT glare */}
      <ellipse cx={50} cy={36} rx={28} ry={16} fill="white" opacity={0.05} transform="rotate(-10 50 36)" />
      <text x={95} y={154} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" opacity={0.2}>ANALOG</text>
      {/* Pins */}
      {['VIDEO','GND'].map((l, i) => (
        <Pin key={i} x={60 + i * 60} y={178} label={l} color={i === 0 ? '#eab308' : '#22d3ee'} />
      ))}
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// LED Bar Graph
// ══════════════════════════════════════════════════════════════════════════
export const LedBarGraph = ({ pinStates = {} }) => {
  const segColors = ['#22c55e','#22c55e','#84cc16','#eab308','#f97316','#f97316','#ef4444','#ef4444','#dc2626','#b91c1c'];
  return (
    <svg width={155} height={55} viewBox="0 0 155 55" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={155} height={55} rx={4} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
      {Array.from({ length: 10 }).map((_, i) => {
        const isOn = Object.keys(pinStates).length === 0 ? i < 7 : pinStates[(i + 1).toString()] === 1;
        const c = segColors[i];
        return (
          <g key={i}>
            <rect x={6 + i * 14} y={6} width={10} height={32} rx={2} fill={c} opacity={isOn ? 1 : 0.12} />
            {isOn && <rect x={6 + i * 14} y={6} width={10} height={32} rx={2} fill={c} opacity={0.3}
              style={{ filter: `drop-shadow(0 0 4px ${c})` }} />}
          </g>
        );
      })}
      {/* Pins */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Pin key={i} x={11 + i * 14} y={50} label={(i + 1).toString()} color="#22d3ee" />
      ))}
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Membrane Keypad — interactive 4×4
// ══════════════════════════════════════════════════════════════════════════
export const MembraneKeypad = ({ id, wiredPins }) => {
  const [activeKey, setActiveKey] = useState(null);
  const KEYS = [
    ['1','2','3','A'],
    ['4','5','6','B'],
    ['7','8','9','C'],
    ['*','0','#','D'],
  ];

  useEffect(() => {
    if (!id || !wiredPins) return;
    PeripheralSimulator.registerComponent(id, 'KEYPAD', {
      pins: ['p1','p2','p3','p4','p5','p6','p7','p8'].map(p => wiredPins[p]),
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const handleDown = (r, c) => {
    setActiveKey(`r${r}c${c}`);
    const comp = PeripheralSimulator.components.get(id);
    if (comp?.state) {
      comp.state.activeNode = `r${r}c${c}`;
      const rowPin = comp.state.pins[r - 1];
      const colPin = comp.state.pins[c + 3];
      if (rowPin && PeripheralSimulator.getPinVal(rowPin) === 0 && window.setExternalPin) {
        window.setExternalPin(colPin, false);
      }
    }
  };

  const handleUp = () => {
    const comp = PeripheralSimulator.components.get(id);
    if (comp?.state?.activeNode) {
      const colIdx = parseInt(comp.state.activeNode.charAt(3), 10);
      const colPin = comp.state.pins[colIdx + 3];
      comp.state.activeNode = null;
      if (colPin && window.setExternalPin) window.setExternalPin(colPin, true);
    }
    setActiveKey(null);
  };

  return (
    <svg width={100} height={130} viewBox="0 0 100 130" style={{ display: 'block', overflow: 'visible' }}>
      {/* PCB */}
      <rect x={0} y={0} width={80} height={115} rx={5} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
      {/* Keypad label */}
      <text x={40} y={12} fill="#475569" fontSize={7} fontWeight="700" textAnchor="middle" fontFamily="monospace">4×4 KEYPAD</text>
      {KEYS.map((row, r) =>
        row.map((key, c) => {
          const k = `r${r + 1}c${c + 1}`;
          const pressed = activeKey === k;
          const isFunc = ['A','B','C','D'].includes(key);
          return (
            <g key={k}>
              <rect
                x={5 + c * 18} y={16 + r * 22}
                width={15} height={16} rx={3}
                fill={pressed ? '#f8fafc' : isFunc ? '#1e40af' : '#1e293b'}
                stroke={pressed ? '#ffffff' : isFunc ? '#3b82f6' : '#334155'}
                strokeWidth={1}
                onPointerDown={e => { e.stopPropagation(); handleDown(r + 1, c + 1); }}
                onPointerUp={e => { e.stopPropagation(); handleUp(); }}
                onPointerLeave={handleUp}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={12 + c * 18} y={27 + r * 22}
                fill={pressed ? '#0f172a' : isFunc ? '#93c5fd' : '#94a3b8'}
                fontSize={8} fontWeight="700" textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {key}
              </text>
            </g>
          );
        })
      )}
      {/* Ribbon cable */}
      <rect x={20} y={104} width={40} height={8} rx={2} fill="#e2e8f0" />
      {/* Pins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Pin key={i} x={92} y={10 + i * 14} label={`P${i + 1}`} color="#22d3ee" />
      ))}
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// NeoPixel Ring — live WS2812B color rendering
// ══════════════════════════════════════════════════════════════════════════
export const NeopixelRing = ({ id, wiredPins }) => {
  const [colors, setColors] = useState(new Array(12).fill('#1e293b'));

  useEffect(() => {
    if (!id || !wiredPins?.din) return;
    PeripheralSimulator.registerComponent(id, 'NEOPIXEL', {
      pin: wiredPins['din'],
      length: 12,
      onRenderTarget: (buffer) => {
        const c = [];
        for (let i = 0; i < 12; i++) {
          const g = buffer[i * 3];
          const r = buffer[i * 3 + 1] ?? 0;
          const b = buffer[i * 3 + 2] ?? 0;
          c.push(r === 0 && g === 0 && b === 0 ? '#1e293b' : `rgb(${r},${g},${b})`);
        }
        setColors(c);
      },
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const isActive = colors.some(c => c !== '#1e293b');

  return (
    <svg width={105} height={110} viewBox="0 0 105 110" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`ring-inner-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      {/* PCB ring */}
      <circle cx={52} cy={48} r={44} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      <circle cx={52} cy={48} r={26} fill={`url(#ring-inner-${id})`} />
      <text x={52} y={52} fill="#475569" fontSize={7} fontWeight="700" textAnchor="middle" fontFamily="monospace">WS2812B</text>
      {/* LEDs */}
      {colors.map((c, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 52 + 36 * Math.cos(angle);
        const y = 48 + 36 * Math.sin(angle);
        const active = c !== '#1e293b';
        return (
          <g key={i}>
            {active && <circle cx={x} cy={y} r={10} fill={c} opacity={0.2} />}
            <circle cx={x} cy={y} r={5.5} fill={active ? c : '#0f172a'}
              stroke={active ? c : '#334155'} strokeWidth={active ? 0.5 : 1}
              style={active ? { filter: `drop-shadow(0 0 3px ${c})` } : {}}
            />
          </g>
        );
      })}
      {/* Pins */}
      <g transform="translate(0, 98)">
        {['5V','DIN','GND'].map((l, i) => (
          <Pin key={i} x={22 + i * 30} y={5} label={l}
            color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// NeoPixel single pixel
// ══════════════════════════════════════════════════════════════════════════
export const NeopixelPixel = ({ id, wiredPins }) => {
  const [color, setColor] = useState('#1e293b');

  useEffect(() => {
    if (!id || !wiredPins?.din) return;
    PeripheralSimulator.registerComponent(id, 'NEOPIXEL', {
      pin: wiredPins['din'],
      length: 1,
      onRenderTarget: (buf) => {
        const g = buf[0], r = buf[1], b = buf[2];
        setColor(r === 0 && g === 0 && b === 0 ? '#1e293b' : `rgb(${r},${g},${b})`);
      },
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const on = color !== '#1e293b';
  return (
    <svg width={55} height={62} viewBox="0 0 55 62" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={5} y={5} width={45} height={42} rx={3} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1} />
      {on && <circle cx={27} cy={26} r={18} fill={color} opacity={0.2} />}
      <circle cx={27} cy={26} r={12} fill={on ? color : '#1e293b'}
        style={on ? { filter: `drop-shadow(0 0 6px ${color})` } : {}}
      />
      {on && <ellipse cx={22} cy={20} rx={4} ry={3} fill="white" opacity={0.3} transform="rotate(-20 22 20)" />}
      <g transform="translate(0, 52)">
        {['5V','DIN','GND'].map((l, i) => (
          <Pin key={i} x={10 + i * 18} y={5} label={l}
            color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </g>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Passive & misc components (kept concise, visually improved)
// ══════════════════════════════════════════════════════════════════════════
export const Buzzer = ({ pinStates = {} }) => {
  const active = pinStates?.main === 1 || pinStates?.SIG === 1;
  return (
    <svg width={80} height={95} viewBox="0 0 80 95" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="buzzGrad" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      {active && <circle cx={40} cy={40} r={36} fill="#22c55e" opacity={0.1} />}
      <circle cx={40} cy={40} r={32} fill="url(#buzzGrad)" stroke={active ? '#22c55e' : '#334155'} strokeWidth={1.5} />
      <circle cx={40} cy={40} r={16} fill="#111827" stroke="#1e293b" strokeWidth={1} />
      <circle cx={40} cy={40} r={5} fill="#334155" />
      {/* Vent holes */}
      {[0,1,2,3,4,5].map(i => {
        const a = i * 60 * Math.PI / 180;
        return <circle key={i} cx={40 + 26 * Math.cos(a)} cy={40 + 26 * Math.sin(a)} r={2.5} fill="#0f172a" />;
      })}
      <text x={26} y={20} fill="#94a3b8" fontSize={14} fontWeight="700">+</text>
      {active && (
        <>
          <path d="M62 32 Q70 40 62 48" stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
          <path d="M66 28 Q76 40 66 52" stroke="#22c55e" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.4} />
        </>
      )}
      <Pin x={24} y={84} label="SIG" color={active ? '#22c55e' : '#22d3ee'} />
      <Pin x={56} y={84} label="GND" color="#94a3b8" />
      <line x1={24} y1={72} x2={24} y2={84} stroke="#94a3b8" strokeWidth={2} />
      <line x1={56} y1={72} x2={56} y2={84} stroke="#94a3b8" strokeWidth={2} />
    </svg>
  );
};

export const Dht22 = ({ id, pinStates = {}, wiredPins = {} }) => {
  const [temp, setTemp] = useState(25);
  const [humid, setHumid] = useState(60);

  useEffect(() => {
    window.__sensorValues = window.__sensorValues || {};
    window.__sensorValues[id] = { temp, humidity: humid };
    const pin = wiredPins.data ?? wiredPins.DATA;
    pushAnalog(pin, temp / 80);
  }, [id, temp, humid, wiredPins.data]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={68} height={110} viewBox="0 0 68 110" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="dhtBdy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        <rect x={5} y={5} width={58} height={72} rx={6} fill="url(#dhtBdy)" stroke="#cbd5e1" strokeWidth={1.5} />
        {[0,1,2,3].map(row =>
          [0,1,2,3,4].map(col => (
            <circle key={`${row}-${col}`} cx={11 + col * 11} cy={13 + row * 11} r={1.8} fill="#cbd5e1" />
          ))
        )}
        <text x={34} y={53} fill="#0369a1" fontSize={9} fontWeight="800" textAnchor="middle" fontFamily="monospace">DHT22</text>
        <text x={34} y={64} fill="#f59e0b" fontSize={8} textAnchor="middle" fontFamily="monospace">{temp.toFixed(1)}°C</text>
        <text x={34} y={74} fill="#0ea5e9" fontSize={7} textAnchor="middle" fontFamily="monospace">{humid}% RH</text>
        {['VCC','DATA','GND'].map((l, i) => (
          <g key={i}>
            <rect x={12 + i * 18} y={77} width={8} height={16} rx={1} fill="#94a3b8" />
            <Pin x={16 + i * 18} y={98} label={l} color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'} />
          </g>
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="T" value={temp} min={-10} max={80} step={0.5} unit="°C" color="#f59e0b" onChange={setTemp} />
        <SliderRow label="H" value={humid} min={0} max={100} step={1} unit="%" color="#0ea5e9" onChange={setHumid} />
      </div>
    </div>
  );
};

export const NtcSensor = ({ id, wiredPins = {} }) => {
  const [temp, setTemp] = useState(25);

  useEffect(() => {
    window.__sensorValues = window.__sensorValues || {};
    window.__sensorValues[id] = { temp };
    const pin = wiredPins.t1 ?? wiredPins.T1;
    pushAnalog(pin, (temp + 50) / 200);
  }, [id, temp, wiredPins.t1]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={55} height={90} viewBox="0 0 55 90" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="ntcGrad" cx="45%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" />
          </radialGradient>
        </defs>
        <circle cx={27} cy={32} r={16} fill="url(#ntcGrad)" stroke="#1d4ed8" strokeWidth={1.5} />
        <circle cx={27} cy={32} r={8} fill="#1e3a8a" />
        <text x={27} y={33} fill="#93c5fd" fontSize={7} fontWeight="700" textAnchor="middle">NTC</text>
        <text x={27} y={57} fill="#f59e0b" fontSize={8} fontWeight="700" textAnchor="middle" fontFamily="monospace">{temp}°C</text>
        <path d="M18 78 Q18 56 22 48" stroke="#94a3b8" strokeWidth={2} fill="none" />
        <path d="M36 78 Q36 56 32 48" stroke="#94a3b8" strokeWidth={2} fill="none" />
        <Pin x={18} y={82} label="T1" />
        <Pin x={36} y={82} label="T2" />
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="T" value={temp} min={-50} max={150} step={1} unit="°C" color="#f59e0b" onChange={setTemp} />
      </div>
    </div>
  );
};

export const Photoresistor = () => (
  <svg width={55} height={85} viewBox="0 0 55 85" style={{ display: 'block', overflow: 'visible' }}>
    <defs>
      <radialGradient id="ldrGrad" cx="45%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
    </defs>
    <rect x={7} y={22} width={40} height={26} rx={10} fill="url(#ldrGrad)" stroke="#d97706" strokeWidth={1.5} />
    <path d="M14 35 L19 28 L24 42 L29 28 L34 35 L39 28" stroke="#92400e" strokeWidth={2} fill="none" strokeLinejoin="round" />
    {/* Light rays */}
    {[-20,-10,0,10,20].map((offset, i) => (
      <line key={i} x1={27 + offset} y1={18} x2={27 + offset - 2} y2={10} stroke="#fde68a" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
    ))}
    <path d="M14 78 C14 60 14 52 20 52" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <path d="M40 78 C40 60 40 52 34 52" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <Pin x={14} y={82} label="L1" />
    <Pin x={40} y={82} label="L2" />
  </svg>
);

export const PirSensor = () => (
  <svg width={80} height={95} viewBox="0 0 80 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={18} width={70} height={62} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1} />
    <defs>
      <radialGradient id="pirDome" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#d1d5db" />
      </radialGradient>
    </defs>
    <circle cx={40} cy={50} r={28} fill="url(#pirDome)" stroke="#94a3b8" strokeWidth={1.5} />
    {[0,1,2,3].map(i => (
      <circle key={i} cx={40} cy={50} r={8 + i * 5.5} fill="none" stroke="#94a3b8" strokeWidth={0.5} opacity={0.5} />
    ))}
    {[0,1,2,3].map(i => (
      <line key={i} x1={40} y1={22} x2={40} y2={78} stroke="#94a3b8" strokeWidth={0.5} opacity={0.4}
        transform={`rotate(${i * 45} 40 50)`} />
    ))}
    <circle cx={40} cy={50} r={4.5} fill="#9ca3af" />
    <circle cx={20} cy={68} r={7} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
    <circle cx={60} cy={68} r={7} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
    {['VCC','OUT','GND'].map((l, i) => (
      <Pin key={i} x={18 + i * 22} y={90} label={l}
        color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const Mpu6050 = () => (
  <svg width={90} height={70} viewBox="0 0 90 70" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={90} height={55} rx={4} fill="#1e3a8a" stroke="#3b82f6" strokeWidth={1} />
    <rect x={30} y={10} width={30} height={30} rx={3} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
    <path d="M30 25 H60 M45 10 V40" stroke="#3b82f6" strokeWidth={1.5} opacity={0.6} />
    <circle cx={45} cy={25} r={4} fill="#3b82f6" />
    <text x={14} y={28} fill="white" fontSize={9} fontWeight="800">MPU</text>
    <text x={14} y={39} fill="#93c5fd" fontSize={7} fontWeight="600">6050</text>
    <MountingHole x={7} y={7} />
    <MountingHole x={83} y={7} />
    {['VCC','GND','SCL','SDA'].map((l, i) => (
      <Pin key={i} x={11 + i * 22} y={64} label={l}
        color={i < 2 ? '#facc15' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const HcSr04 = () => (
  <svg width={118} height={70} viewBox="0 0 118 70" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={118} height={55} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
    <defs>
      <radialGradient id="transducerGrad" cx="45%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#94a3b8" />
      </radialGradient>
    </defs>
    {[32, 86].map(cx => (
      <g key={cx}>
        <circle cx={cx} cy={27} r={20} fill="url(#transducerGrad)" stroke="#64748b" strokeWidth={1.5} />
        <circle cx={cx} cy={27} r={10} fill="#475569" />
        <circle cx={cx} cy={27} r={4} fill="#94a3b8" />
      </g>
    ))}
    {/* Ripple waves */}
    <path d="M46 16 Q54 27 46 38" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.35} />
    <path d="M72 16 Q64 27 72 38" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.35} />
    {/* HC-SR04 label */}
    <text x={59} y={52} fill="#93c5fd" fontSize={7} fontWeight="700" textAnchor="middle">HC-SR04</text>
    {['VCC','TRIG','ECHO','GND'].map((l, i) => (
      <Pin key={i} x={15 + i * 28} y={65} label={l}
        color={i === 0 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const FlameSensor = () => (
  <svg width={75} height={95} viewBox="0 0 75 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={22} width={75} height={60} rx={4} fill="#7e22ce" stroke="#9333ea" strokeWidth={1} />
    <path d="M57 18 C57 18, 49 28, 49 33 C49 36.5, 51.5 38 55 38 C55 38, 51 34, 54 30 C54 30, 56 36, 59 34 C62 32, 62 28, 60 23 C59 21, 57 18, 57 18 Z"
      fill="#f97316" />
    <path d="M57 24 C57 24, 53 30, 53 33 C53 35, 55 37, 57 37 C59 37, 60 35, 60 33 C60 30, 57 24, 57 24 Z"
      fill="#fbbf24" />
    <circle cx={57} cy={35} r={2} fill="#fef3c7" />
    <text x={37} y={56} fill="white" fontSize={9} fontWeight="800" textAnchor="middle">FLAME</text>
    <text x={37} y={68} fill="#c4b5fd" fontSize={7} textAnchor="middle">IR Sensor</text>
    {['AOUT','DOUT','VCC','GND'].map((l, i) => (
      <Pin key={i} x={10 + i * 18} y={90} label={l}
        color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#a78bfa'}
      />
    ))}
  </svg>
);

export const GasSensor = () => (
  <svg width={85} height={105} viewBox="0 0 85 105" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={32} width={85} height={60} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1} />
    {/* MQ sensor element */}
    <rect x={20} y={5} width={45} height={30} rx={3} fill="#475569" stroke="#64748b" strokeWidth={1.5} />
    {[6,11,16,21,26].map(x => (
      <line key={x} x1={20 + x} y1={5} x2={20 + x} y2={35} stroke="#94a3b8" strokeWidth={0.8} />
    ))}
    {[8,14,20,26].map(y => (
      <line key={y} x1={20} y1={y} x2={65} y2={y} stroke="#94a3b8" strokeWidth={0.8} />
    ))}
    {/* Heating element */}
    <circle cx={42} cy={20} r={8} fill="#dc2626" opacity={0.7} />
    <circle cx={42} cy={20} r={4} fill="#fca5a5" opacity={0.8} />
    <text x={42} y={70} fill="white" fontSize={11} fontWeight="800" textAnchor="middle">MQ-2</text>
    {['AOUT','DOUT','VCC','GND'].map((l, i) => (
      <Pin key={i} x={12 + i * 20} y={100} label={l}
        color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const HeartbeatSensor = () => (
  <svg width={75} height={95} viewBox="0 0 75 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={75} height={65} rx={30} fill="#7f1d1d" stroke="#b91c1c" strokeWidth={1.5} />
    <path d="M37 24 L35 21 C31 15 23 14 20 20 C17 26 21 32 27 38 L37 48 L47 38 C53 32 57 26 54 20 C51 14 43 15 39 21 Z"
      fill="#ef4444" stroke="#fca5a5" strokeWidth={0.5} />
    {/* ECG line */}
    <path d="M6 62 H16 L18 56 L22 72 L26 52 L30 62 H44 L46 56 L50 72 L54 52 L58 62 H68"
      stroke="#fca5a5" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx={37} cy={42} rx={8} ry={6} fill="#fca5a5" opacity={0.6} />
    {['VCC','SIG','GND'].map((l, i) => (
      <Pin key={i} x={14 + i * 24} y={89} label={l}
        color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const SoundSensor = () => (
  <svg width={80} height={95} viewBox="0 0 80 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={22} width={80} height={60} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
    {/* Microphone capsule */}
    <circle cx={18} cy={14} r={12} fill="#475569" stroke="#64748b" strokeWidth={1.5} />
    <circle cx={18} cy={14} r={7} fill="#1e293b" />
    {/* Mesh pattern */}
    {[0,1,2].map(r => [0,1,2].map(c => (
      <circle key={`${r}${c}`} cx={13 + c * 5} cy={9 + r * 5} r={1} fill="#374151" />
    )))}
    <text x={50} y={54} fill="white" fontSize={10} fontWeight="800" textAnchor="middle">SOUND</text>
    <text x={50} y={66} fill="#93c5fd" fontSize={7} textAnchor="middle">Microphone</text>
    {['AOUT','DOUT','VCC','GND'].map((l, i) => (
      <Pin key={i} x={11 + i * 19} y={90} label={l}
        color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const LoadCellHx711 = () => (
  <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={95} height={75} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1} />
    <rect x={30} y={18} width={34} height={34} rx={3} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
    <text x={47} y={39} fill="#4ade80" fontSize={8} fontWeight="700" textAnchor="middle">HX711</text>
    <MountingHole x={7} y={7} />
    <MountingHole x={88} y={7} />
    {['E+','E-','A+','A-','DT','SCK','VCC','GND'].map((l, i) => (
      <Pin key={i} x={9 + i * 11} y={90} label={l}
        color={i < 4 ? '#f87171' : i > 5 ? '#facc15' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const RotaryEncoder = () => (
  <svg width={70} height={95} viewBox="0 0 70 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={26} width={60} height={56} rx={4} fill="#334155" stroke="#475569" strokeWidth={1.5} />
    {/* Encoder disc */}
    <circle cx={35} cy={22} r={18} fill="#94a3b8" stroke="#64748b" strokeWidth={1.5} />
    {/* Knurled edge */}
    {Array.from({ length: 24 }).map((_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return (
        <line key={i}
          x1={35 + 16 * Math.cos(a)} y1={22 + 16 * Math.sin(a)}
          x2={35 + 19 * Math.cos(a)} y2={22 + 19 * Math.sin(a)}
          stroke="#64748b" strokeWidth={1} />
      );
    })}
    <circle cx={35} cy={22} r={10} fill="#cbd5e1" />
    <circle cx={35} cy={22} r={4} fill="#475569" />
    <line x1={35} y1={22} x2={35} y2={14} stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
    {['CLK','DT','SW','VCC','GND'].map((l, i) => (
      <Pin key={i} x={10 + i * 12} y={90} label={l}
        color={i === 3 ? '#facc15' : i === 4 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const AnalogJoystick = () => (
  <svg width={90} height={100} viewBox="0 0 90 100" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={18} width={90} height={68} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1} />
    <circle cx={45} cy={52} r={28} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
    <circle cx={45} cy={52} r={18} fill="#374151" stroke="#475569" strokeWidth={1} />
    <circle cx={45} cy={52} r={8} fill="#94a3b8" />
    <circle cx={41} cy={48} r={3} fill="#cbd5e1" opacity={0.4} />
    {['VRX','VRY','SW','VCC','GND'].map((l, i) => (
      <Pin key={i} x={10 + i * 17} y={96} label={l}
        color={i === 3 ? '#facc15' : i === 4 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const DipSwitch8 = () => (
  <svg width={120} height={70} viewBox="0 0 120 70" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={120} height={50} rx={4} fill="#b91c1c" stroke="#ef4444" strokeWidth={1} />
    {/* Labels */}
    <text x={60} y={10} fill="white" fontSize={7} fontWeight="700" textAnchor="middle">DIP-8</text>
    {[1,2,3,4,5,6,7,8].map(i => (
      <g key={i}>
        <rect x={i * 11 - 4} y={12} width={8} height={22} rx={2} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={0.5} />
        {/* Slider thumb — half off for some */}
        <rect x={i * 11 - 4} y={i % 2 === 0 ? 12 : 23} width={8} height={10} rx={1.5} fill={i % 2 === 0 ? '#dc2626' : '#e2e8f0'} />
        <text x={i * 11} y={44} fill="white" fontSize={7} textAnchor="middle">{i}</text>
      </g>
    ))}
    <Pin x={110} y={60} label="COM" color="#f59e0b" />
  </svg>
);

export const SlideSwitch = () => (
  <svg width={60} height={60} viewBox="0 0 60 60" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={12} width={50} height={30} rx={6} fill="#475569" stroke="#64748b" strokeWidth={1.5} />
    <rect x={8} y={15} width={20} height={24} rx={4} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} />
    {/* Knurls */}
    {[18,21,24].map(y => <line key={y} x1={10} y1={y} x2={26} y2={y} stroke="#94a3b8" strokeWidth={1} opacity={0.5} />)}
    {['1','2','3'].map((l, i) => (
      <Pin key={i} x={14 + i * 16} y={52} label={l} />
    ))}
  </svg>
);

export const StepperMotor = () => (
  <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
    <defs>
      <radialGradient id="stepperGrad" cx="45%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#94a3b8" />
      </radialGradient>
    </defs>
    <circle cx={47} cy={43} r={40} fill="url(#stepperGrad)" stroke="#94a3b8" strokeWidth={2} />
    {/* Stator slots */}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <line key={i}
          x1={47 + 28 * Math.cos(a)} y1={43 + 28 * Math.sin(a)}
          x2={47 + 38 * Math.cos(a)} y2={43 + 38 * Math.sin(a)}
          stroke="#64748b" strokeWidth={2} />
      );
    })}
    <circle cx={47} cy={43} r={18} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
    <circle cx={47} cy={43} r={5} fill="#475569" />
    <rect x={15} y={80} width={65} height={5} fill="#0ea5e9" rx={2} />
    {['A+','A-','B+','B-'].map((l, i) => (
      <Pin key={i} x={20 + i * 18} y={90} label={l} color="#f59e0b" />
    ))}
  </svg>
);

export const IrReceiver = () => (
  <svg width={55} height={75} viewBox="0 0 55 75" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={10} y={14} width={35} height={44} rx={18} fill="#111827" stroke="#1e293b" strokeWidth={1.5} />
    <circle cx={27} cy={30} r={10} fill="#1e293b" stroke="#334155" strokeWidth={1} />
    <circle cx={27} cy={30} r={5} fill="#374151" />
    <circle cx={25} cy={28} r={2} fill="#475569" opacity={0.6} />
    {['OUT','VCC','GND'].map((l, i) => (
      <Pin key={i} x={12 + i * 15} y={70} label={l}
        color={i === 1 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const IrRemote = () => (
  <svg width={80} height={135} viewBox="0 0 80 135" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={5} width={70} height={125} rx={12} fill="#111827" stroke="#1e293b" strokeWidth={1.5} />
    <circle cx={40} cy={20} r={8} fill="#ef4444" stroke="#dc2626" strokeWidth={1} />
    {[35,58,80,102].map(y =>
      [18, 35, 52].map(x => (
        <rect key={`${x}${y}`} x={x} y={y} width={14} height={12} rx={3}
          fill="#1e293b" stroke="#334155" strokeWidth={0.8} />
      ))
    )}
  </svg>
);

export const Ds1307Rtc = () => (
  <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={95} height={78} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1} />
    <circle cx={25} cy={35} r={22} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1.5} />
    {/* Clock face */}
    <circle cx={25} cy={35} r={18} fill="#f8fafc" />
    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return <circle key={i} cx={25 + 14 * Math.cos(a)} cy={35 + 14 * Math.sin(a)} r={1.5} fill="#94a3b8" />;
    })}
    <line x1={25} y1={35} x2={25} y2={23} stroke="#374151" strokeWidth={2} strokeLinecap="round" />
    <line x1={25} y1={35} x2={34} y2={38} stroke="#374151" strokeWidth={1.5} strokeLinecap="round" />
    <text x={23} y={55} fill="#475569" fontSize={6} textAnchor="middle">CR2032</text>
    <rect x={55} y={18} width={25} height={36} rx={3} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
    <text x={67} y={40} fill="#4ade80" fontSize={7} fontWeight="700" textAnchor="middle">DS</text>
    <text x={67} y={49} fill="#4ade80" fontSize={7} fontWeight="700" textAnchor="middle">1307</text>
    {['VCC','GND','SCL','SDA'].map((l, i) => (
      <Pin key={i} x={12 + i * 23} y={90} label={l}
        color={i < 2 ? '#facc15' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const MicroSdModule = () => (
  <svg width={85} height={80} viewBox="0 0 85 80" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={85} height={62} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
    {/* SD slot */}
    <rect x={14} y={5} width={57} height={42} rx={3} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
    <rect x={18} y={9} width={49} height={34} rx={2} fill="#f8fafc" />
    {/* Card notch */}
    <path d="M66 9 L71 9 L71 14" stroke="#cbd5e1" strokeWidth={1.5} fill="none" />
    <rect x={22} y={14} width={40} height={24} rx={1} fill="#0f172a" />
    <text x={42} y={29} fill="#94a3b8" fontSize={8} fontWeight="700" textAnchor="middle">SD</text>
    {['VCC','GND','MISO','MOSI','SCK','CS'].map((l, i) => (
      <Pin key={i} x={8 + i * 14} y={75} label={l}
        color={i < 2 ? '#facc15' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const ShiftRegister = () => (
  <svg width={110} height={115} viewBox="0 0 110 115" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={22} y={10} width={66} height={95} rx={4} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
    {/* Notch */}
    <rect x={44} y={10} width={22} height={8} rx={4} fill="#1e293b" />
    <text x={55} y={62} fill="white" fontSize={9} fontWeight="700" textAnchor="middle" transform="rotate(-90 55 62)">74HC595</text>
    {['VCC','Q0','DS','OE','STCP','SHCP','MR','Q7\''].map((l, i) => (
      <Pin key={i} x={12} y={18 + i * 10} label={l}
        color={i === 0 ? '#facc15' : '#22d3ee'}
      />
    ))}
    {['Q7','Q6','Q5','Q4','Q3','Q2','Q1','GND'].map((l, i) => (
      <Pin key={i} x={98} y={18 + i * 10} label={l}
        color={i === 7 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
  </svg>
);

export const RelayModule = () => (
  <svg width={95} height={105} viewBox="0 0 95 105" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={95} height={82} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
    {/* Relay coil */}
    <rect x={8} y={8} width={50} height={55} rx={3} fill="#2563eb" stroke="#3b82f6" strokeWidth={1} />
    <rect x={12} y={12} width={42} height={46} rx={2} fill="#1d4ed8" />
    <text x={33} y={35} fill="white" fontSize={11} fontWeight="800" textAnchor="middle">RELAY</text>
    <text x={33} y={47} fill="#93c5fd" fontSize={7} textAnchor="middle">5V coil</text>
    {/* Status LED */}
    <circle cx={68} cy={24} r={7} fill="#22c55e" opacity={0.5} />
    <circle cx={68} cy={24} r={4} fill="#22c55e" />
    {/* Screw terminals */}
    {[8,28,48,68].map(y => (
      <rect key={y} x={76} y={y} width={16} height={14} rx={2} fill="#374151" stroke="#4b5563" strokeWidth={1} />
    ))}
    {['IN','VCC','GND'].map((l, i) => (
      <Pin key={i} x={16 + i * 18} y={98} label={l}
        color={i === 1 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
      />
    ))}
    {['COM','NO','NC'].map((l, i) => (
      <Pin key={i} x={58 + i * 14} y={98} label={l} color="#f59e0b" />
    ))}
  </svg>
);

export const LedMatrix8x8 = ({ pinStates = {} }) => (
  <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={95} height={65} rx={4} fill="#111827" stroke="#1e293b" strokeWidth={1} />
    {[0,1,2,3,4,5,6,7].map(r => [0,1,2,3,4,5,6,7].map(c => {
      const on = Object.keys(pinStates).length === 0 ? (r + c) % 2 === 0 : (pinStates[`r${r}`] === 1 && (pinStates[`c${c}`] === 0 || pinStates[`c${c}`] === undefined));
      return (
        <g key={`${r}${c}`}>
          {on && <circle cx={13 + c * 10} cy={23 + r * 8} r={5} fill="#ef4444" opacity={0.2} />}
          <circle cx={13 + c * 10} cy={23 + r * 8} r={3} fill={on ? '#ef4444' : '#1e293b'}
            style={on ? { filter: 'drop-shadow(0 0 2px #ef4444)' } : {}}
          />
        </g>
      );
    }))}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`T${i}`} x={13 + i * 10} y={5} label={`C${i}`} />)}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`B${i}`} x={13 + i * 10} y={89} label={`R${i}`} />)}
  </svg>
);
