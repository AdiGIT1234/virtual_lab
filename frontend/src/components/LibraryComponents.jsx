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
        const isOn = Object.keys(pinStates).length === 0 ? i < 7 : !!pinStates[(i + 1).toString()];
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
export const NeopixelRing = ({ id, type, wiredPins }) => {
  const ringSize = type === 'NEOPIXEL_RING_24' ? 24 : type === 'NEOPIXEL_RING_16' ? 16 : 12;
  const [colors, setColors] = useState(new Array(ringSize).fill('#1e293b'));

  useEffect(() => {
    if (!id || !wiredPins?.din) return;
    PeripheralSimulator.registerComponent(id, 'NEOPIXEL', {
      pin: wiredPins['din'],
      length: ringSize,
      onRenderTarget: (buffer) => {
        const c = [];
        for (let i = 0; i < ringSize; i++) {
          const g = buffer[i * 3];
          const r = buffer[i * 3 + 1] ?? 0;
          const b = buffer[i * 3 + 2] ?? 0;
          c.push(r === 0 && g === 0 && b === 0 ? '#1e293b' : `rgb(${r},${g},${b})`);
        }
        setColors(c);
      },
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins, ringSize]);

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
      <text x={52} y={49} fill="#475569" fontSize={7} fontWeight="700" textAnchor="middle" fontFamily="monospace">WS2812B</text>
      <text x={52} y={58} fill="#334155" fontSize={6} textAnchor="middle" fontFamily="monospace">{ringSize} LED</text>
      {/* LEDs */}
      {colors.map((c, i) => {
        const angle = (i / ringSize) * Math.PI * 2 - Math.PI / 2;
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
  const active = !!pinStates?.sig;
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

export const Photoresistor = ({ id, wiredPins = {} }) => {
  const [light, setLight] = useState(50);

  useEffect(() => {
    // Resistance drops with more light; push inverse as analog (0=dark, 1=bright)
    const pin = wiredPins.l1 ?? wiredPins.l2;
    pushAnalog(pin, light / 100);
    if (window.setExternalPin) window.setExternalPin(String(pin), light > 50);
  }, [id, light, wiredPins.l1, wiredPins.l2]);

  const rayOpacity = light / 100;
  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={55} height={85} viewBox="0 0 55 85" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="ldrGrad" cx="45%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <rect x={7} y={22} width={40} height={26} rx={10}
          fill="url(#ldrGrad)" stroke="#d97706" strokeWidth={1.5} opacity={0.3 + light * 0.007} />
        <path d="M14 35 L19 28 L24 42 L29 28 L34 35 L39 28" stroke="#92400e" strokeWidth={2} fill="none" strokeLinejoin="round" />
        {[-20,-10,0,10,20].map((offset, i) => (
          <line key={i} x1={27 + offset} y1={18} x2={27 + offset - 2} y2={10}
            stroke="#fde68a" strokeWidth={1.5} strokeLinecap="round" opacity={rayOpacity * 0.9} />
        ))}
        <path d="M14 78 C14 60 14 52 20 52" stroke="#94a3b8" strokeWidth={2} fill="none" />
        <path d="M40 78 C40 60 40 52 34 52" stroke="#94a3b8" strokeWidth={2} fill="none" />
        <Pin x={14} y={82} label="L1" />
        <Pin x={40} y={82} label="L2" />
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="☀" value={light} min={0} max={100} step={1} unit="%" color="#fde68a" onChange={setLight} />
      </div>
    </div>
  );
};

export const PirSensor = ({ id, wiredPins = {} }) => {
  const [detected, setDetected] = useState(false);
  const timerRef = useRef(null);

  const triggerMotion = useCallback(() => {
    const pin = wiredPins.out;
    if (pin == null) return;
    setDetected(true);
    PeripheralSimulator.setButtonState(String(pin), true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDetected(false);
      PeripheralSimulator.setButtonState(String(pin), false);
    }, 2000);
  }, [wiredPins.out]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={80} height={95} viewBox="0 0 80 95" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={5} y={18} width={70} height={62} rx={4}
          fill={detected ? '#14532d' : '#166534'} stroke={detected ? '#22c55e' : '#15803d'} strokeWidth={1} />
        <defs>
          <radialGradient id="pirDome" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#d1d5db" />
          </radialGradient>
        </defs>
        <circle cx={40} cy={50} r={28} fill="url(#pirDome)" stroke="#94a3b8" strokeWidth={1.5} />
        {[0,1,2,3].map(i => (
          <circle key={i} cx={40} cy={50} r={8 + i * 5.5} fill="none"
            stroke={detected ? '#22c55e' : '#94a3b8'} strokeWidth={0.5} opacity={detected ? 0.8 : 0.5} />
        ))}
        {[0,1,2,3].map(i => (
          <line key={i} x1={40} y1={22} x2={40} y2={78} stroke="#94a3b8" strokeWidth={0.5} opacity={0.4}
            transform={`rotate(${i * 45} 40 50)`} />
        ))}
        <circle cx={40} cy={50} r={4.5} fill={detected ? '#22c55e' : '#9ca3af'} />
        <circle cx={20} cy={68} r={7} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
        <circle cx={60} cy={68} r={7} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
        {['VCC','OUT','GND'].map((l, i) => (
          <Pin key={i} x={18 + i * 22} y={90} label={l}
            color={i === 0 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={{ ...SENSOR_PANEL, textAlign: 'center' }}>
        <button
          onClick={triggerMotion}
          style={{
            background: detected ? '#14532d' : '#1e293b',
            color: detected ? '#22c55e' : '#94a3b8',
            border: `1px solid ${detected ? '#22c55e' : '#334155'}`,
            borderRadius: 3, padding: '2px 10px', fontSize: 8,
            fontFamily: 'monospace', cursor: 'pointer',
          }}
        >
          {detected ? 'MOTION — HIGH for 2s' : 'Trigger motion'}
        </button>
      </div>
    </div>
  );
};

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

export const HcSr04 = ({ id, pinStates = {}, wiredPins = {} }) => {
  const [distance, setDistance] = useState(20);
  const prevTrigRef = useRef(false);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    const trig = !!pinStates['trig'];
    if (trig && !prevTrigRef.current) {
      // Rising edge of TRIG: fire ECHO pulse proportional to distance
      const echoPin = String(wiredPins.echo);
      const echoDurationMs = (distance * 58.2) / 1000;
      setPinging(true);
      if (window.setExternalPin) {
        window.setExternalPin(echoPin, true);
        setTimeout(() => {
          window.setExternalPin(echoPin, false);
          setPinging(false);
        }, echoDurationMs);
      }
    }
    prevTrigRef.current = trig;
  });

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={118} height={70} viewBox="0 0 118 70" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={0} y={0} width={118} height={55} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
        <defs>
          <radialGradient id="transducerGrad" cx="45%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
        </defs>
        {[32, 86].map(tcx => (
          <g key={tcx}>
            <circle cx={tcx} cy={27} r={20} fill="url(#transducerGrad)" stroke="#64748b" strokeWidth={1.5} />
            <circle cx={tcx} cy={27} r={10} fill="#475569" />
            <circle cx={tcx} cy={27} r={4} fill="#94a3b8" />
          </g>
        ))}
        {pinging && [1,2,3].map(r => (
          <path key={r} d={`M${46 + r*4} ${16-r*2} Q59 27 ${46+r*4} ${38+r*2}`}
            stroke="#22d3ee" strokeWidth={1.5 - r*0.3} fill="none" strokeLinecap="round" opacity={1 - r*0.25} />
        ))}
        {!pinging && (
          <>
            <path d="M46 16 Q54 27 46 38" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.35} />
            <path d="M72 16 Q64 27 72 38" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.35} />
          </>
        )}
        <text x={59} y={48} fill="#93c5fd" fontSize={7} fontWeight="700" textAnchor="middle">HC-SR04</text>
        <text x={59} y={54} fill={pinging ? '#22d3ee' : '#64748b'} fontSize={6} textAnchor="middle" fontFamily="monospace">
          {pinging ? `ECHO ${distance}cm` : `${distance}cm`}
        </text>
        {['VCC','TRIG','ECHO','GND'].map((l, i) => (
          <Pin key={i} x={15 + i * 28} y={65} label={l}
            color={i === 0 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="d" value={distance} min={2} max={400} step={1} unit="cm" color="#22d3ee" onChange={setDistance} />
      </div>
    </div>
  );
};

export const FlameSensor = ({ id, wiredPins = {} }) => {
  const [intensity, setIntensity] = useState(0);
  const above = intensity > 50;

  useEffect(() => {
    pushAnalog(wiredPins.aout, intensity / 100);
    PeripheralSimulator.setButtonState(String(wiredPins.dout), above);
  }, [id, intensity, wiredPins.aout, wiredPins.dout, above]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={75} height={95} viewBox="0 0 75 95" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={0} y={22} width={75} height={60} rx={4} fill="#7e22ce" stroke="#9333ea" strokeWidth={1} />
        <path d="M57 18 C57 18, 49 28, 49 33 C49 36.5, 51.5 38 55 38 C55 38, 51 34, 54 30 C54 30, 56 36, 59 34 C62 32, 62 28, 60 23 C59 21, 57 18, 57 18 Z"
          fill={intensity > 0 ? '#f97316' : '#78350f'} opacity={0.4 + intensity * 0.006} />
        <path d="M57 24 C57 24, 53 30, 53 33 C53 35, 55 37, 57 37 C59 37, 60 35, 60 33 C60 30, 57 24, 57 24 Z"
          fill={intensity > 0 ? '#fbbf24' : '#92400e'} opacity={0.4 + intensity * 0.006} />
        <circle cx={57} cy={35} r={2} fill={intensity > 20 ? '#fef3c7' : '#475569'} />
        <text x={37} y={56} fill="white" fontSize={9} fontWeight="800" textAnchor="middle">FLAME</text>
        <text x={37} y={68} fill={above ? '#f97316' : '#c4b5fd'} fontSize={7} textAnchor="middle">
          {above ? 'DOUT HIGH' : 'IR Sensor'}
        </text>
        {['AOUT','DOUT','VCC','GND'].map((l, i) => (
          <Pin key={i} x={10 + i * 18} y={90} label={l}
            color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#a78bfa'}
          />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="~" value={intensity} min={0} max={100} step={1} unit="%" color="#f97316" onChange={setIntensity} />
      </div>
    </div>
  );
};

export const GasSensor = ({ id, wiredPins = {} }) => {
  const [ppm, setPpm] = useState(0);
  const above = ppm > 50;

  useEffect(() => {
    pushAnalog(wiredPins.aout, ppm / 100);
    PeripheralSimulator.setButtonState(String(wiredPins.dout), above);
  }, [id, ppm, wiredPins.aout, wiredPins.dout, above]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={85} height={105} viewBox="0 0 85 105" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={0} y={32} width={85} height={60} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1} />
        <rect x={20} y={5} width={45} height={30} rx={3} fill="#475569" stroke="#64748b" strokeWidth={1.5} />
        {[6,11,16,21,26].map(x => (
          <line key={x} x1={20 + x} y1={5} x2={20 + x} y2={35} stroke="#94a3b8" strokeWidth={0.8} />
        ))}
        {[8,14,20,26].map(y => (
          <line key={y} x1={20} y1={y} x2={65} y2={y} stroke="#94a3b8" strokeWidth={0.8} />
        ))}
        <circle cx={42} cy={20} r={8} fill="#dc2626" opacity={0.4 + ppm * 0.006} />
        <circle cx={42} cy={20} r={4} fill="#fca5a5" opacity={0.4 + ppm * 0.006} />
        <text x={42} y={70} fill={above ? '#ef4444' : 'white'} fontSize={11} fontWeight="800" textAnchor="middle">MQ-2</text>
        <text x={42} y={82} fill={above ? '#ef4444' : '#64748b'} fontSize={7} textAnchor="middle">
          {above ? 'DOUT HIGH' : `${ppm}%`}
        </text>
        {['AOUT','DOUT','VCC','GND'].map((l, i) => (
          <Pin key={i} x={12 + i * 20} y={100} label={l}
            color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="~" value={ppm} min={0} max={100} step={1} unit="%" color="#ef4444" onChange={setPpm} />
      </div>
    </div>
  );
};

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

export const SoundSensor = ({ id, wiredPins = {} }) => {
  const [level, setLevel] = useState(0);
  const above = level > 50;

  useEffect(() => {
    pushAnalog(wiredPins.aout, level / 100);
    PeripheralSimulator.setButtonState(String(wiredPins.dout), above);
  }, [id, level, wiredPins.aout, wiredPins.dout, above]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={80} height={95} viewBox="0 0 80 95" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={0} y={22} width={80} height={60} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
        <circle cx={18} cy={14} r={12} fill="#475569" stroke="#64748b" strokeWidth={1.5} />
        <circle cx={18} cy={14} r={7} fill="#1e293b" />
        {[0,1,2].map(r => [0,1,2].map(c => (
          <circle key={`${r}${c}`} cx={13 + c * 5} cy={9 + r * 5} r={1} fill="#374151" />
        )))}
        {/* Sound wave bars */}
        {[0,1,2,3].map(i => (
          <rect key={i} x={35 + i * 8} y={42 - level * 0.1 * (i % 2 === 0 ? 1 : 0.6)} width={5}
            height={level * 0.1 * (i % 2 === 0 ? 1 : 0.6) * 2 + 4}
            fill={above ? '#22c55e' : '#3b82f6'} rx={2} opacity={0.8} />
        ))}
        <text x={50} y={76} fill="white" fontSize={10} fontWeight="800" textAnchor="middle">SOUND</text>
        <text x={50} y={84} fill={above ? '#22c55e' : '#93c5fd'} fontSize={7} textAnchor="middle">
          {above ? 'DOUT HIGH' : 'Microphone'}
        </text>
        {['AOUT','DOUT','VCC','GND'].map((l, i) => (
          <Pin key={i} x={11 + i * 19} y={90} label={l}
            color={i === 2 ? '#facc15' : i === 3 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="~" value={level} min={0} max={100} step={1} unit="%" color="#3b82f6" onChange={setLevel} />
      </div>
    </div>
  );
};

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

export const RotaryEncoder = ({ id, wiredPins = {} }) => {
  const [count, setCount] = useState(0);
  const [angle, setAngle] = useState(0);

  const pulse = useCallback((cw) => {
    const clkPin = String(wiredPins.clk);
    const dtPin = String(wiredPins.dt);
    if (!wiredPins.clk && !wiredPins.dt) return;
    // CW: CLK falls first; CCW: DT falls first
    if (cw) {
      PeripheralSimulator.setButtonState(dtPin, true);
      PeripheralSimulator.setButtonState(clkPin, false);
      setTimeout(() => PeripheralSimulator.setButtonState(clkPin, true), 5);
    } else {
      PeripheralSimulator.setButtonState(clkPin, true);
      PeripheralSimulator.setButtonState(dtPin, false);
      setTimeout(() => {
        PeripheralSimulator.setButtonState(clkPin, false);
        setTimeout(() => {
          PeripheralSimulator.setButtonState(clkPin, true);
          PeripheralSimulator.setButtonState(dtPin, true);
        }, 5);
      }, 5);
    }
    setCount(c => c + (cw ? 1 : -1));
    setAngle(a => a + (cw ? 15 : -15));
  }, [wiredPins.clk, wiredPins.dt]);

  const markerX = 35 + 10 * Math.sin((angle * Math.PI) / 180);
  const markerY = 22 - 10 * Math.cos((angle * Math.PI) / 180);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={70} height={95} viewBox="0 0 70 95" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={5} y={26} width={60} height={56} rx={4} fill="#334155" stroke="#475569" strokeWidth={1.5} />
        <circle cx={35} cy={22} r={18} fill="#94a3b8" stroke="#64748b" strokeWidth={1.5} />
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
        <line x1={35} y1={22} x2={markerX} y2={markerY} stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
        <text x={35} y={55} fill="#22d3ee" fontSize={8} fontWeight="700" textAnchor="middle" fontFamily="monospace">{count}</text>
        {['CLK','DT','SW','VCC','GND'].map((l, i) => (
          <Pin key={i} x={10 + i * 12} y={90} label={l}
            color={i === 3 ? '#facc15' : i === 4 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={{ ...SENSOR_PANEL, flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        <button onClick={() => pulse(false)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 3, padding: '2px 8px', fontSize: 9, fontFamily: 'monospace', cursor: 'pointer' }}>{'<< CCW'}</button>
        <button onClick={() => pulse(true)}  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 3, padding: '2px 8px', fontSize: 9, fontFamily: 'monospace', cursor: 'pointer' }}>{'CW >>'}</button>
      </div>
    </div>
  );
};

export const AnalogJoystick = ({ id, wiredPins = {} }) => {
  const [vrx, setVrx] = useState(50);
  const [vry, setVry] = useState(50);

  useEffect(() => {
    pushAnalog(wiredPins.vrx, vrx / 100);
    pushAnalog(wiredPins.vry, vry / 100);
  }, [id, vrx, vry, wiredPins.vrx, wiredPins.vry]);

  const stickX = 45 + (vrx - 50) * 0.28;
  const stickY = 52 + (vry - 50) * 0.28;

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={90} height={100} viewBox="0 0 90 100" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={0} y={18} width={90} height={68} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1} />
        <circle cx={45} cy={52} r={28} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
        <circle cx={45} cy={52} r={18} fill="#374151" stroke="#475569" strokeWidth={1} />
        <circle cx={stickX} cy={stickY} r={8} fill="#94a3b8" />
        <circle cx={stickX - 2} cy={stickY - 2} r={3} fill="#cbd5e1" opacity={0.4} />
        {['VRX','VRY','SW','VCC','GND'].map((l, i) => (
          <Pin key={i} x={10 + i * 17} y={96} label={l}
            color={i === 3 ? '#facc15' : i === 4 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="X" value={vrx} min={0} max={100} step={1} unit="%" color="#22d3ee" onChange={setVrx} />
        <SliderRow label="Y" value={vry} min={0} max={100} step={1} unit="%" color="#a78bfa" onChange={setVry} />
      </div>
    </div>
  );
};

export const DipSwitch8 = ({ id, wiredPins = {} }) => {
  const [states, setStates] = useState(Array(8).fill(false));

  const toggle = useCallback((i) => {
    setStates(prev => {
      const next = [...prev];
      next[i] = !next[i];
      const pin = wiredPins[String(i + 1)];
      PeripheralSimulator.setButtonState(String(pin), next[i]);
      return next;
    });
  }, [wiredPins]);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={120} height={70} viewBox="0 0 120 70" style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}>
        <rect x={0} y={0} width={120} height={50} rx={4} fill="#b91c1c" stroke="#ef4444" strokeWidth={1} />
        <text x={60} y={10} fill="white" fontSize={7} fontWeight="700" textAnchor="middle">DIP-8</text>
        {[0,1,2,3,4,5,6,7].map(i => (
          <g key={i} onClick={() => toggle(i)} style={{ cursor: 'pointer' }}>
            <rect x={8 + i * 13} y={12} width={10} height={22} rx={2} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={0.5} />
            <rect x={8 + i * 13} y={states[i] ? 12 : 24} width={10} height={10} rx={1.5}
              fill={states[i] ? '#dc2626' : '#e2e8f0'} />
            <text x={13 + i * 13} y={45} fill="white" fontSize={7} textAnchor="middle">{i + 1}</text>
          </g>
        ))}
        <Pin x={110} y={60} label="COM" color="#f59e0b" />
      </svg>
    </div>
  );
};

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

export const StepperMotor = ({ pinStates = {} }) => {
  const stepCountRef = useRef(0);
  const prevStateRef = useRef({ aPlus: false, aMinus: false, bPlus: false, bMinus: false });
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const aPlus  = !!pinStates['a+'];
    const aMinus = !!pinStates['a-'];
    const bPlus  = !!pinStates['b+'];
    const bMinus = !!pinStates['b-'];
    const prev = prevStateRef.current;
    // Detect step: any coil transition counts as a step
    if (aPlus !== prev.aPlus || bPlus !== prev.bPlus) {
      const cw = (aPlus && !bPlus) || (!aPlus && bPlus && aMinus);
      stepCountRef.current += cw ? 1 : -1;
      setAngle(stepCountRef.current * (360 / 200)); // 200 steps/rev (1.8°/step)
    }
    prevStateRef.current = { aPlus, aMinus, bPlus, bMinus };
  });

  const coilA = !!pinStates['a+'] || !!pinStates['a-'];
  const coilB = !!pinStates['b+'] || !!pinStates['b-'];
  const markerAngle = (angle * Math.PI) / 180;

  return (
    <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="stepperGrad" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>
      <circle cx={47} cy={43} r={40} fill="url(#stepperGrad)" stroke="#94a3b8" strokeWidth={2} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const isCoilA = i % 3 === 0;
        const active = isCoilA ? coilA : coilB;
        return (
          <line key={i}
            x1={47 + 28 * Math.cos(a)} y1={43 + 28 * Math.sin(a)}
            x2={47 + 38 * Math.cos(a)} y2={43 + 38 * Math.sin(a)}
            stroke={active ? '#f59e0b' : '#64748b'} strokeWidth={active ? 3 : 2} />
        );
      })}
      <circle cx={47} cy={43} r={18} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
      <circle cx={47} cy={43} r={5} fill="#475569" />
      {/* Rotor position marker */}
      <line
        x1={47} y1={43}
        x2={47 + 14 * Math.sin(markerAngle)}
        y2={43 - 14 * Math.cos(markerAngle)}
        stroke="#0ea5e9" strokeWidth={3} strokeLinecap="round" />
      <text x={47} y={88} fill="#94a3b8" fontSize={6.5} textAnchor="middle" fontFamily="monospace">
        {((((angle % 360) + 360) % 360)).toFixed(1)}°
      </text>
      <rect x={15} y={80} width={65} height={5} fill={coilA || coilB ? '#0ea5e9' : '#1e293b'} rx={2} />
      {['A+','A-','B+','B-'].map((l, i) => (
        <Pin key={i} x={20 + i * 18} y={90} label={l} color="#f59e0b" />
      ))}
    </svg>
  );
};

// Shared IR global — IrRemote fires, IrReceiver listens
function irBroadcast(code, label) {
  window.__irLastCode = code;
  window.__irLastLabel = label;
  window.__irPulseTime = Date.now();
}

export const IrReceiver = ({ id, wiredPins = {} }) => {
  const [lastCode, setLastCode] = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__irPulseTime && Date.now() - window.__irPulseTime < 150) return;
      if (!window.__irLastCode) return;
      const code = window.__irLastCode;
      const label = window.__irLastLabel;
      window.__irLastCode = null;
      window.__irPulseTime = 0;
      const pin = wiredPins.out;
      setLastCode(`0x${code.toString(16).toUpperCase().padStart(8,'0')} (${label})`);
      setActive(true);
      if (pin != null) {
        PeripheralSimulator.setButtonState(String(pin), true);
        setTimeout(() => {
          PeripheralSimulator.setButtonState(String(pin), false);
          setActive(false);
        }, 120);
      } else {
        setTimeout(() => setActive(false), 300);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [wiredPins.out]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={55} height={75} viewBox="0 0 55 75" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={10} y={14} width={35} height={44} rx={18}
          fill="#111827" stroke={active ? '#f59e0b' : '#1e293b'} strokeWidth={1.5} />
        <circle cx={27} cy={30} r={10} fill={active ? '#1e293b' : '#1e293b'} stroke="#334155" strokeWidth={1} />
        <circle cx={27} cy={30} r={5} fill={active ? '#f59e0b' : '#374151'}
          style={active ? { filter: 'drop-shadow(0 0 4px #f59e0b)' } : {}} />
        <circle cx={25} cy={28} r={2} fill="#475569" opacity={0.6} />
        {['OUT','VCC','GND'].map((l, i) => (
          <Pin key={i} x={12 + i * 15} y={70} label={l}
            color={i === 1 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
          />
        ))}
      </svg>
      <div style={{ ...SENSOR_PANEL, minWidth: 55 }}>
        <span style={{ color: active ? '#f59e0b' : '#475569', fontSize: 7, fontFamily: 'monospace', display: 'block', textAlign: 'center' }}>
          {lastCode ?? 'awaiting signal'}
        </span>
      </div>
    </div>
  );
};

const IR_BUTTONS = [
  ['CH-', 0xFFA25D], ['CH',  0xFF629D], ['CH+', 0xFFE21D],
  ['|<<', 0xFF22DD], ['>>|', 0xFF02FD], ['>||', 0xFFC23D],
  ['-',   0xFFE01F], ['+',   0xFFA857], ['EQ',  0xFF906F],
  ['0',   0xFF6897], ['100+',0xFF9867], ['200+',0xFFB04F],
  ['1',   0xFF30CF], ['2',   0xFF18E7], ['3',   0xFF7A85],
  ['4',   0xFF10EF], ['5',   0xFF38C7], ['6',   0xFF5AA5],
  ['7',   0xFF42BD], ['8',   0xFF4AB5], ['9',   0xFF52AD],
];

export const IrRemote = () => {
  const [pressed, setPressed] = useState(null);

  const handlePress = useCallback((label, code) => {
    irBroadcast(code, label);
    setPressed(label);
    setTimeout(() => setPressed(null), 200);
  }, []);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={80} height={28} viewBox="0 0 80 28" style={{ display: 'block', overflow: 'visible' }}>
        <rect x={5} y={0} width={70} height={24} rx={8} fill="#111827" stroke="#1e293b" strokeWidth={1.5} />
        <circle cx={40} cy={12} r={7} fill="#ef4444" stroke="#dc2626" strokeWidth={1} />
        <text x={40} y={16} fill="white" fontSize={7} fontWeight="800" textAnchor="middle">IR</text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 2 }}>
        {IR_BUTTONS.map(([label, code]) => (
          <button key={label}
            onMouseDown={() => handlePress(label, code)}
            style={{
              background: pressed === label ? '#78350f' : '#1e293b',
              color: pressed === label ? '#f59e0b' : '#94a3b8',
              border: `1px solid ${pressed === label ? '#f59e0b' : '#334155'}`,
              borderRadius: 3, padding: '3px 0', fontSize: 8,
              fontFamily: 'monospace', cursor: 'pointer', minWidth: 24,
            }}
          >{label}</button>
        ))}
      </div>
    </div>
  );
};

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

export const ShiftRegister = ({ pinStates = {} }) => {
  // Q0-Q7 output state driven by resolveConnection in SandboxPage
  const bits = [0,1,2,3,4,5,6,7].map(i => !!pinStates[`q${i}`]);
  return (
    <svg width={110} height={115} viewBox="0 0 110 115" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={22} y={10} width={66} height={95} rx={4} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
      <rect x={44} y={10} width={22} height={8} rx={4} fill="#1e293b" />
      <text x={55} y={62} fill="white" fontSize={9} fontWeight="700" textAnchor="middle" transform="rotate(-90 55 62)">74HC595</text>
      {/* Q0-Q7 indicator row */}
      {bits.map((on, i) => (
        <circle key={i} cx={28 + i * 8} cy={57} r={3}
          fill={on ? '#22c55e' : '#1e293b'}
          stroke={on ? '#22c55e' : '#334155'} strokeWidth={0.8}
          style={on ? { filter: 'drop-shadow(0 0 3px #22c55e)' } : {}}
        />
      ))}
      {['VCC','Q0','DS','OE','STCP','SHCP','MR',"Q7'"].map((l, i) => (
        <Pin key={i} x={12} y={18 + i * 10} label={l}
          color={i === 0 ? '#facc15' : '#22d3ee'}
        />
      ))}
      {['Q7','Q6','Q5','Q4','Q3','Q2','Q1','GND'].map((l, i) => (
        <Pin key={i} x={98} y={18 + i * 10} label={l}
          color={i === 7 ? '#94a3b8' : !!bits[7 - i] ? '#22c55e' : '#22d3ee'}
        />
      ))}
    </svg>
  );
};

export const RelayModule = ({ pinStates = {} }) => {
  const activated = !!pinStates['in'];
  return (
    <svg width={95} height={105} viewBox="0 0 95 105" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={95} height={82} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
      {/* Relay coil block */}
      <rect x={8} y={8} width={50} height={55} rx={3} fill="#2563eb" stroke="#3b82f6" strokeWidth={1} />
      <rect x={12} y={12} width={42} height={46} rx={2} fill="#1d4ed8" />
      <text x={33} y={32} fill="white" fontSize={11} fontWeight="800" textAnchor="middle">RELAY</text>
      <text x={33} y={44} fill="#93c5fd" fontSize={7} textAnchor="middle">5V coil</text>
      {/* State label */}
      <text x={33} y={56} fill={activated ? '#22c55e' : '#64748b'} fontSize={7} fontWeight="700" textAnchor="middle">
        {activated ? 'ENERGIZED' : 'OFF'}
      </text>
      {/* Status LED */}
      {activated && <circle cx={68} cy={24} r={9} fill="#22c55e" opacity={0.25} />}
      <circle cx={68} cy={24} r={5} fill={activated ? '#22c55e' : '#374151'}
        style={activated ? { filter: 'drop-shadow(0 0 4px #22c55e)' } : {}} />
      {/* Contact state indicator */}
      <text x={68} y={50} fill={activated ? '#22c55e' : '#64748b'} fontSize={6} textAnchor="middle">
        COM→{activated ? 'NO' : 'NC'}
      </text>
      {/* Screw terminals */}
      {[8, 28, 48, 68].map(y => (
        <rect key={y} x={76} y={y} width={16} height={14} rx={2} fill="#374151" stroke="#4b5563" strokeWidth={1} />
      ))}
      {['IN', 'VCC', 'GND'].map((l, i) => (
        <Pin key={i} x={16 + i * 18} y={98} label={l}
          color={i === 1 ? '#facc15' : i === 2 ? '#94a3b8' : '#22d3ee'}
        />
      ))}
      {['COM', 'NO', 'NC'].map((l, i) => (
        <Pin key={i} x={58 + i * 14} y={98} label={l} color="#f59e0b" />
      ))}
    </svg>
  );
};

export const LedMatrix8x8 = ({ pinStates = {} }) => (
  <svg width={95} height={95} viewBox="0 0 95 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={95} height={65} rx={4} fill="#111827" stroke="#1e293b" strokeWidth={1} />
    {[0,1,2,3,4,5,6,7].map(r => [0,1,2,3,4,5,6,7].map(c => {
      const on = Object.keys(pinStates).length === 0 ? (r + c) % 2 === 0 : (pinStates[`r${r}`] === true && pinStates[`c${c}`] === false);
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

// ══════════════════════════════════════════════════════════════════════════
// Logic Gate IC — visual simulation for AND/OR/NOT/NAND/NOR/XOR/DFF
// ══════════════════════════════════════════════════════════════════════════
const GATE_FN = {
  LOGIC_AND:  (a, b) => a && b,
  LOGIC_OR:   (a, b) => a || b,
  LOGIC_NAND: (a, b) => !(a && b),
  LOGIC_NOR:  (a, b) => !(a || b),
  LOGIC_XOR:  (a, b) => Boolean(a) !== Boolean(b),
  LOGIC_NOT:  (a)    => !a,
  LOGIC_DFLIPFLOP: (d) => d,
};
const GATE_LABEL = {
  LOGIC_AND: 'AND', LOGIC_OR: 'OR', LOGIC_NAND: 'NAND',
  LOGIC_NOR: 'NOR', LOGIC_XOR: 'XOR', LOGIC_NOT: 'NOT',
  LOGIC_DFLIPFLOP: 'DFF',
};
const sigColor = (v) => v ? '#22c55e' : '#ef4444';

export const LogicGateIC = ({ id: _id, type, pinStates = {} }) => {
  const isNOT = type === 'LOGIC_NOT';
  const isDFF = type === 'LOGIC_DFLIPFLOP';

  const inA = !!(pinStates['in1'] || pinStates['d']);
  const inB = !!(pinStates['in2'] || pinStates['clk']);

  let outQ, outQN;
  if (isDFF) {
    // Use the resolved Q pinState (from edge-triggered resolveConnection) when available
    outQ = pinStates['q'] !== undefined ? !!pinStates['q'] : inA;
    outQN = !outQ;
  } else if (isNOT) {
    outQ = GATE_FN[type](inA);
  } else {
    outQ = GATE_FN[type] ? GATE_FN[type](inA, inB) : false;
  }

  const label = GATE_LABEL[type] || '?';

  return (
    <svg width={90} height={70} style={{ overflow: 'visible', display: 'block' }}>
      {/* IC body */}
      <rect x={12} y={4} width={66} height={62} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      {/* Pin-1 dot */}
      <circle cx={18} cy={12} r={2} fill="#475569" />
      {/* Gate label */}
      <text x={45} y={28} fill="#94a3b8" fontSize={9} fontWeight="bold" textAnchor="middle" fontFamily="monospace">{label}</text>
      <text x={45} y={40} fill="#475569" fontSize={7} textAnchor="middle" fontFamily="monospace">74HC</text>

      {/* Input A (in1 / d) */}
      <line x1={0} y1={22} x2={12} y2={22} stroke="#475569" strokeWidth={1.5} />
      <circle cx={8} cy={22} r={3} fill={sigColor(inA)} />
      <text x={15} y={20} fill="#64748b" fontSize={6} fontFamily="monospace">{isDFF ? 'D' : 'A'}</text>

      {/* Input B (in2 / clk) — hidden for NOT */}
      {!isNOT && (
        <>
          <line x1={0} y1={48} x2={12} y2={48} stroke="#475569" strokeWidth={1.5} />
          <circle cx={8} cy={48} r={3} fill={sigColor(inB)} />
          <text x={15} y={46} fill="#64748b" fontSize={6} fontFamily="monospace">{isDFF ? 'CLK' : 'B'}</text>
        </>
      )}

      {/* Output Y / Q */}
      <line x1={78} y1={isDFF ? 22 : 35} x2={90} y2={isDFF ? 22 : 35} stroke="#475569" strokeWidth={1.5} />
      <circle cx={82} cy={isDFF ? 22 : 35} r={3} fill={sigColor(outQ)} />
      <text x={74} y={isDFF ? 20 : 33} fill="#64748b" fontSize={6} textAnchor="end" fontFamily="monospace">{isDFF ? 'Q' : 'Y'}</text>

      {/* Output QN — only for DFF */}
      {isDFF && (
        <>
          <line x1={78} y1={48} x2={90} y2={48} stroke="#475569" strokeWidth={1.5} />
          <circle cx={82} cy={48} r={3} fill={sigColor(outQN)} />
          <text x={74} y={46} fill="#64748b" fontSize={6} textAnchor="end" fontFamily="monospace">Q̄</text>
        </>
      )}

      {/* NAND/NOR inversion bubble */}
      {(type === 'LOGIC_NAND' || type === 'LOGIC_NOR') && (
        <circle cx={76} cy={35} r={3} fill="none" stroke="#94a3b8" strokeWidth={1} />
      )}
    </svg>
  );
};

export const DcMotor = ({ type: _t, pinStates = {} }) => {
  const mPlus  = pinStates['m+'];
  const mMinus = pinStates['m-'];
  // determine speed/direction
  const isOn = !!mPlus && !mMinus;
  const isPWM = mPlus === 'PWM';
  const spinDur = isPWM ? '0.4s' : isOn ? '0.9s' : null;

  return (
    <svg width={80} height={86} style={{ overflow: 'visible', display: 'block' }}>
      {/* Body */}
      <rect x={5} y={4} width={70} height={72} rx={35} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      {/* Inner circle / rotor — spins when active */}
      <g style={spinDur ? { transformOrigin: '40px 40px', animation: `spin ${spinDur} linear infinite` } : {}}>
        <circle cx={40} cy={40} r={18} fill="none" stroke="#475569" strokeWidth={2} />
        <line x1={40} y1={22} x2={40} y2={58} stroke="#94a3b8" strokeWidth={1.5} />
        <line x1={22} y1={40} x2={58} y2={40} stroke="#94a3b8" strokeWidth={1.5} />
        {/* Rotor indicator */}
        <circle cx={40} cy={25} r={3} fill={isOn || isPWM ? '#22c55e' : '#334155'} />
      </g>
      {/* Shaft */}
      <rect x={36} y={2} width={8} height={8} rx={1} fill="#64748b" />
      {/* Status label */}
      <text x={40} y={68} fill={isOn || isPWM ? '#22c55e' : '#475569'} fontSize={7}
            textAnchor="middle" fontFamily="monospace">
        {isPWM ? 'PWM' : isOn ? 'ON' : 'OFF'}
      </text>
      {/* Terminal leads */}
      <line x1={22} y1={76} x2={22} y2={86} stroke="#64748b" strokeWidth={2} />
      <line x1={58} y1={76} x2={58} y2={86} stroke="#64748b" strokeWidth={2} />
      <Pin x={22} y={86} label="M+" color="#f97316" />
      <Pin x={58} y={86} label="M−" color="#94a3b8" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
};

const getMotorState = (en, in1, in2) => {
  if (!en && en !== 'PWM') return 'OFF';
  if (in1 && !in2) return 'CW';
  if (!in1 && in2) return 'CCW';
  if (in1 && in2)  return 'BRAKE';
  return 'STOP';
};
const motorColor = (s) => ({ CW: '#22c55e', CCW: '#3b82f6', BRAKE: '#ef4444', STOP: '#f59e0b', OFF: '#475569' })[s];

export const L298nDriver = ({ type: _t, pinStates = {} }) => {
  const stateA = getMotorState(pinStates['ena'], pinStates['in1'], pinStates['in2']);
  const stateB = getMotorState(pinStates['enb'], pinStates['in3'], pinStates['in4']);
  return (
    <svg width={120} height={116} style={{ display: 'block', overflow: 'visible' }}>
      {/* IC body */}
      <rect x={8} y={4} width={104} height={108} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      <text x={60} y={20} fill="#64748b" fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">L298N</text>
      {/* Channel A */}
      <rect x={16} y={26} width={40} height={36} rx={3} fill="#0f172a" stroke="#1e3a5f" strokeWidth={1} />
      <text x={36} y={39} fill="#94a3b8" fontSize={7} textAnchor="middle" fontFamily="monospace">CH-A</text>
      <text x={36} y={52} fill={motorColor(stateA)} fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">{stateA}</text>
      {/* Channel B */}
      <rect x={64} y={26} width={40} height={36} rx={3} fill="#0f172a" stroke="#1e3a5f" strokeWidth={1} />
      <text x={84} y={39} fill="#94a3b8" fontSize={7} textAnchor="middle" fontFamily="monospace">CH-B</text>
      <text x={84} y={52} fill={motorColor(stateB)} fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">{stateB}</text>
      {/* Left-side pin leads and labels */}
      {[['ENA',20],['IN1',38],['IN2',56],['IN3',74],['IN4',92],['ENB',110]].map(([lbl,y]) => (
        <g key={lbl}>
          <line x1={0} y1={y} x2={8} y2={y} stroke="#475569" strokeWidth={1.5} />
          <text x={10} y={y+3} fill="#64748b" fontSize={6} fontFamily="monospace">{lbl}</text>
        </g>
      ))}
      {/* Right-side pin leads */}
      {[['VCC',20],['GND',38]].map(([lbl,y]) => (
        <g key={lbl}>
          <line x1={112} y1={y} x2={120} y2={y} stroke="#475569" strokeWidth={1.5} />
          <text x={100} y={y+3} fill="#64748b" fontSize={6} textAnchor="end" fontFamily="monospace">{lbl}</text>
        </g>
      ))}
    </svg>
  );
};

export const MosfetIC = ({ type, pinStates = {} }) => {
  const isP     = type === 'PMOSFET';
  const gate    = !!pinStates['g'];
  const conducting = isP ? !gate : gate;  // N: on when G high; P: on when G low
  const chanColor  = conducting ? '#22c55e' : '#ef4444';
  const label      = isP ? 'P-MOS' : 'N-MOS';

  return (
    <svg width={60} height={82} style={{ display: 'block', overflow: 'visible' }}>
      {/* Body */}
      <rect x={10} y={4} width={40} height={54} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      <text x={30} y={22} fill="#94a3b8" fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">{label}</text>
      {/* Channel indicator */}
      <rect x={18} y={28} width={24} height={14} rx={2} fill={conducting ? '#14532d' : '#450a0a'} stroke={chanColor} strokeWidth={1} />
      <text x={30} y={39} fill={chanColor} fontSize={7} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        {conducting ? 'ON' : 'OFF'}
      </text>
      {/* Gate dot */}
      <circle cx={10} cy={31} r={3} fill={gate ? '#22c55e' : '#ef4444'} />
      {/* Three leads */}
      <line x1={15} y1={58} x2={15} y2={75} stroke="#64748b" strokeWidth={2} />
      <line x1={30} y1={58} x2={30} y2={75} stroke="#64748b" strokeWidth={2} />
      <line x1={45} y1={58} x2={45} y2={75} stroke="#64748b" strokeWidth={2} />
      <text x={15} y={82} fill="#94a3b8" fontSize={6} textAnchor="middle" fontFamily="monospace">G</text>
      <text x={30} y={82} fill="#94a3b8" fontSize={6} textAnchor="middle" fontFamily="monospace">D</text>
      <text x={45} y={82} fill="#94a3b8" fontSize={6} textAnchor="middle" fontFamily="monospace">S</text>
    </svg>
  );
};

export const OptocouplerIC = ({ type: _t, pinStates = {} }) => {
  const ledOn = !!pinStates['ano'] && !pinStates['cat'];
  const xColor = ledOn ? '#f59e0b' : '#475569';
  const tColor = ledOn ? '#22c55e' : '#ef4444';
  return (
    <svg width={60} height={80} style={{ display: 'block', overflow: 'visible' }}>
      <rect x={6} y={4} width={48} height={62} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      <text x={30} y={16} fill="#64748b" fontSize={7} fontWeight="bold" textAnchor="middle" fontFamily="monospace">PC817</text>
      {/* Isolation barrier */}
      <line x1={30} y1={20} x2={30} y2={60} stroke="#1e3a5f" strokeWidth={1} strokeDasharray="2,2" />
      {/* LED symbol */}
      <polygon points="14,28 14,44 24,36" fill={ledOn ? '#fbbf24' : '#374151'} stroke={xColor} strokeWidth={1} />
      <line x1={24} y1={28} x2={24} y2={44} stroke={xColor} strokeWidth={1.5} />
      {/* Light rays */}
      {ledOn && <>
        <line x1={26} y1={30} x2={30} y2={26} stroke="#fbbf24" strokeWidth={1} />
        <line x1={26} y1={36} x2={31} y2={32} stroke="#fbbf24" strokeWidth={1} />
      </>}
      {/* Transistor symbol */}
      <line x1={36} y1={28} x2={36} y2={44} stroke={tColor} strokeWidth={1.5} />
      <line x1={36} y1={32} x2={46} y2={26} stroke={tColor} strokeWidth={1.5} />
      <line x1={36} y1={40} x2={46} y2={46} stroke={tColor} strokeWidth={1.5} />
      {/* Pin leads */}
      <line x1={0}  y1={22} x2={6}  y2={22} stroke="#475569" strokeWidth={1.5} />
      <line x1={0}  y1={58} x2={6}  y2={58} stroke="#475569" strokeWidth={1.5} />
      <line x1={54} y1={22} x2={60} y2={22} stroke="#475569" strokeWidth={1.5} />
      <line x1={54} y1={58} x2={60} y2={58} stroke="#475569" strokeWidth={1.5} />
      <text x={8}  y={20} fill="#64748b" fontSize={6} fontFamily="monospace">A</text>
      <text x={8}  y={56} fill="#64748b" fontSize={6} fontFamily="monospace">K</text>
      <text x={50} y={20} fill="#64748b" fontSize={6} fontFamily="monospace">C</text>
      <text x={50} y={56} fill="#64748b" fontSize={6} fontFamily="monospace">E</text>
    </svg>
  );
};

// ── TTP223 Touch Sensor ────────────────────────────────────────────────────
export const Ttp223Touch = ({ id, wiredPins = {} }) => {
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const pin = wiredPins.io;
    if (pin == null) return;
    PeripheralSimulator.setButtonState(String(pin), touched);
  }, [touched, wiredPins.io]);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={70} height={74} style={{ display: 'block', overflow: 'visible' }}>
        {/* PCB */}
        <rect x={3} y={4} width={64} height={58} rx={4} fill="#166534" stroke="#15803d" strokeWidth={1.5} />
        {/* Touch pad */}
        <circle cx={35} cy={28} r={18}
          fill={touched ? '#22c55e' : '#0f172a'}
          stroke={touched ? '#4ade80' : '#334155'} strokeWidth={2}
          style={{ cursor: 'pointer', transition: 'fill 0.1s, stroke 0.1s' }}
          onMouseDown={() => setTouched(true)}
          onMouseUp={() => setTouched(false)}
          onMouseLeave={() => setTouched(false)}
        />
        <text x={35} y={32} fill={touched ? '#fff' : '#475569'} fontSize={8}
              fontWeight="bold" textAnchor="middle" fontFamily="monospace">TOUCH</text>
        <text x={35} y={52} fill="#64748b" fontSize={6.5} textAnchor="middle" fontFamily="monospace">TTP223</text>
        {/* Pins */}
        {[['VCC',12,'#facc15'],['IO',34,'#22d3ee'],['GND',56,'#94a3b8']].map(([l,x,c]) => (
          <Pin key={l} x={x} y={68} label={l} color={c} />
        ))}
      </svg>
      <div style={{ ...SENSOR_PANEL, textAlign: 'center' }}>
        <span style={{ color: touched ? '#22c55e' : '#475569', fontSize: 8, fontFamily: 'monospace' }}>
          {touched ? 'TOUCHED — HIGH' : 'Hold to touch'}
        </span>
      </div>
    </div>
  );
};

// ── SW420 Vibration Sensor ─────────────────────────────────────────────────
export const Sw420Vibration = ({ id, wiredPins = {} }) => {
  const [vibrating, setVibrating] = useState(false);

  const triggerVibration = useCallback(() => {
    const pin = wiredPins.dout;
    if (pin == null) return;
    setVibrating(true);
    PeripheralSimulator.setButtonState(String(pin), true);
    setTimeout(() => {
      setVibrating(false);
      PeripheralSimulator.setButtonState(String(pin), false);
    }, 300);
  }, [wiredPins.dout]);

  return (
    <div style={{ display: 'inline-block', userSelect: 'none' }}>
      <svg width={70} height={74} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={3} y={4} width={64} height={58} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
        {/* Vibration coil symbol */}
        {[0,1,2,3].map(i => (
          <ellipse key={i} cx={35} cy={28} rx={6+i*4} ry={6+i*4}
            fill="none" stroke={vibrating ? '#f59e0b' : '#334155'}
            strokeWidth={1} opacity={1 - i*0.2}
          />
        ))}
        <circle cx={35} cy={28} r={4} fill={vibrating ? '#f59e0b' : '#475569'} />
        <text x={35} y={52} fill="#64748b" fontSize={6.5} textAnchor="middle" fontFamily="monospace">SW-420</text>
        {[['VCC',12,'#facc15'],['DOUT',34,'#22d3ee'],['GND',56,'#94a3b8']].map(([l,x,c]) => (
          <Pin key={l} x={x} y={68} label={l} color={c} />
        ))}
      </svg>
      <div style={{ ...SENSOR_PANEL, textAlign: 'center' }}>
        <button
          onMouseDown={triggerVibration}
          style={{
            background: vibrating ? '#92400e' : '#1e293b',
            color: vibrating ? '#f59e0b' : '#94a3b8',
            border: `1px solid ${vibrating ? '#f59e0b' : '#334155'}`,
            borderRadius: 3, padding: '2px 10px', fontSize: 8,
            fontFamily: 'monospace', cursor: 'pointer',
          }}
        >
          {vibrating ? 'VIBRATING!' : 'Trigger vibration'}
        </button>
      </div>
    </div>
  );
};

// ── Rain Sensor ────────────────────────────────────────────────────────────
export const RainSensorComp = ({ id, wiredPins = {} }) => {
  const [wetness, setWetness] = useState(0);
  const isWet = wetness > 40;

  useEffect(() => {
    const aPin = wiredPins.aout;
    const dPin = wiredPins.dout;
    if (aPin != null) PeripheralSimulator.setAnalogValue(String(aPin), wetness / 100);
    if (dPin != null) PeripheralSimulator.setButtonState(String(dPin), isWet);
  }, [wetness, wiredPins.aout, wiredPins.dout, isWet]);

  const dropColor = isWet ? '#3b82f6' : '#1e3a5f';

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={90} height={94} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={4} y={4} width={82} height={78} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
        {/* Sensor tracks */}
        {[0,1,2,3,4,5].map(i => (
          <line key={i} x1={12 + i*12} y1={14} x2={12 + i*12} y2={62}
            stroke={isWet ? '#3b82f6' : '#334155'} strokeWidth={3}
            strokeDasharray="4,3" strokeLinecap="round" />
        ))}
        {/* Rain drops */}
        {isWet && [20,40,60,30,50].map((x, i) => (
          <ellipse key={i} cx={x} cy={20 + i * 8} rx={2} ry={3.5}
            fill={dropColor} opacity={0.7 - i*0.1} />
        ))}
        <text x={45} y={74} fill={isWet ? '#3b82f6' : '#64748b'} fontSize={7}
              textAnchor="middle" fontFamily="monospace">{isWet ? 'WET' : 'DRY'} ({wetness}%)</text>
        {[['AOUT',10],['DOUT',30],['VCC',50],['GND',70]].map(([l,x],i) => (
          <Pin key={l} x={x} y={88} label={l}
            color={i===2?'#facc15':i===3?'#94a3b8':i===1&&isWet?'#22c55e':'#22d3ee'} />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="~" value={wetness} min={0} max={100} step={1} unit="%" color="#3b82f6" onChange={setWetness} />
      </div>
    </div>
  );
};

// ── MAX30102 Pulse Oximeter ────────────────────────────────────────────────
const MAX30102_ADDR = 0x57;
// Static register defaults (non-FIFO)
const MAX30102_REG_MAP = { 0x00: 0x40, 0x01: 0x00, 0x04: 0x01, 0x05: 0x00, 0x06: 0x00, 0xFE: 0x03, 0xFF: 0x15 };

export const Max30102 = ({ id: _id }) => {
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [beat, setBeat] = useState(false);
  const bpmRef = useRef(72);
  const spo2Ref = useRef(98);
  const regPtrRef = useRef(0x07);  // current register pointer
  const fifoByteRef = useRef(0);   // byte index within FIFO sample

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { spo2Ref.current = spo2; }, [spo2]);

  useEffect(() => {
    const iv = setInterval(() => setBeat(b => !b), (60000 / bpm) / 2);
    return () => clearInterval(iv);
  }, [bpm]);

  useEffect(() => {
    // Track which register the master is pointing to
    const prevOnTWIByte = window.onTWIByte;
    window.onTWIByte = (value, cycles, addr) => {
      if (addr === MAX30102_ADDR) {
        regPtrRef.current = value;
        fifoByteRef.current = 0;
      }
      prevOnTWIByte?.(value, cycles, addr);
    };

    // Register read-byte handler
    const prevGetTWIReadByte = window.getTWIReadByte;
    window.getTWIReadByte = (addr) => {
      if (addr !== MAX30102_ADDR) return prevGetTWIReadByte?.(addr) ?? 0x00;

      if (regPtrRef.current === 0x07) {
        // FIFO_DATA: return oscillating IR + RED values
        const t = Date.now() / 1000;
        const phase = (t * bpmRef.current / 60) * 2 * Math.PI;
        const pulse = Math.max(0, Math.sin(phase));
        const IR_DC = 80000, IR_AC = 3000;
        const ir = Math.round(IR_DC + IR_AC * pulse);
        // RED amplitude ratio from SpO2: R = (110 - spo2) / 25
        const R = (110 - spo2Ref.current) / 25;
        const RED_DC = 50000;
        const RED_AC = Math.round(R * (RED_DC / IR_DC) * IR_AC * 8);
        const red = Math.round(RED_DC + RED_AC * pulse);
        // 6 bytes per sample: RED[2:0] then IR[2:0] (24-bit, upper 6 bits unused)
        const idx = fifoByteRef.current % 6;
        fifoByteRef.current++;
        if (idx === 0) return (red >> 16) & 0x03;
        if (idx === 1) return (red >> 8) & 0xFF;
        if (idx === 2) return red & 0xFF;
        if (idx === 3) return (ir >> 16) & 0x03;
        if (idx === 4) return (ir >> 8) & 0xFF;
        if (idx === 5) return ir & 0xFF;
      }
      return MAX30102_REG_MAP[regPtrRef.current] ?? 0x00;
    };

    return () => {
      window.onTWIByte = prevOnTWIByte;
      window.getTWIReadByte = prevGetTWIReadByte;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={80} height={88} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={4} y={4} width={72} height={72} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
        <text x={40} y={35} fontSize={22} textAnchor="middle"
              style={{ transition: 'transform 0.15s', transform: beat ? 'scale(1.15)' : 'scale(1)', transformOrigin: '40px 30px', display: 'inline-block' }}>
          ❤️
        </text>
        <text x={40} y={52} fill="#f87171" fontSize={11} fontWeight="bold"
              textAnchor="middle" fontFamily="monospace">{bpm} BPM</text>
        <text x={40} y={63} fill="#60a5fa" fontSize={8}
              textAnchor="middle" fontFamily="monospace">SpO₂ {spo2}%</text>
        <text x={40} y={72} fill="#334155" fontSize={6}
              textAnchor="middle" fontFamily="monospace">MAX30102</text>
        {['VCC','GND','SCL','SDA'].map((l, i) => (
          <Pin key={l} x={10 + i*18} y={82} label={l}
            color={i===0?'#facc15':i===1?'#94a3b8':'#22d3ee'} />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="♥" value={bpm}  min={40} max={200} step={1} unit=" BPM" color="#f87171" onChange={setBpm} />
        <SliderRow label="O₂" value={spo2} min={70} max={100} step={1} unit="%"    color="#60a5fa" onChange={setSpo2} />
      </div>
    </div>
  );
};

// ── TCS34725 Color Sensor ──────────────────────────────────────────────────
const TCS34725_ADDR = 0x29;

export const Tcs34725Color = ({ id: _id }) => {
  const [r, setR] = useState(128);
  const [g, setG] = useState(128);
  const [b, setB] = useState(128);
  const color = `rgb(${r},${g},${b})`;
  const rRef = useRef(128), gRef = useRef(128), bRef = useRef(128);
  const regPtrRef = useRef(0x12);

  useEffect(() => { rRef.current = r; }, [r]);
  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => { bRef.current = b; }, [b]);

  useEffect(() => {
    // TCS34725 uses command byte: writes are 0x80|reg_addr
    const prevOnTWIByte = window.onTWIByte;
    window.onTWIByte = (value, cycles, addr) => {
      if (addr === TCS34725_ADDR) regPtrRef.current = value & 0x7F; // strip command bit
      prevOnTWIByte?.(value, cycles, addr);
    };

    const prevGetTWIReadByte = window.getTWIReadByte;
    window.getTWIReadByte = (addr) => {
      if (addr !== TCS34725_ADDR) return prevGetTWIReadByte?.(addr) ?? 0x00;
      const reg = regPtrRef.current;
      // Scale 0-255 slider values to 16-bit counts (× 256)
      const R16 = rRef.current * 256, G16 = gRef.current * 256, B16 = bRef.current * 256;
      const C16 = Math.min(65535, R16 + G16 + B16);
      const regMap = {
        0x00: 0x03,   // ENABLE: PON|AEN
        0x12: 0x44,   // ID: TCS34725
        0x13: 0x01,   // STATUS: AVALID
        0x14: C16 & 0xFF, 0x15: (C16 >> 8) & 0xFF,   // CDATAL/H
        0x16: R16 & 0xFF, 0x17: (R16 >> 8) & 0xFF,   // RDATAL/H
        0x18: G16 & 0xFF, 0x19: (G16 >> 8) & 0xFF,   // GDATAL/H
        0x1A: B16 & 0xFF, 0x1B: (B16 >> 8) & 0xFF,   // BDATAL/H
      };
      const val = regMap[reg] ?? 0x00;
      regPtrRef.current = (reg + 1) & 0x7F; // auto-increment
      return val;
    };

    return () => {
      window.onTWIByte = prevOnTWIByte;
      window.getTWIReadByte = prevGetTWIReadByte;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={80} height={88} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={4} y={4} width={72} height={72} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
        <rect x={14} y={12} width={52} height={36} rx={3} fill={color} />
        <rect x={14} y={12} width={52} height={36} rx={3} fill="none" stroke="#334155" strokeWidth={1} />
        <text x={40} y={60} fill="#94a3b8" fontSize={7} textAnchor="middle" fontFamily="monospace">
          rgb({r},{g},{b})
        </text>
        <text x={40} y={70} fill="#334155" fontSize={6} textAnchor="middle" fontFamily="monospace">TCS34725</text>
        {['VCC','GND','SCL','SDA'].map((l, i) => (
          <Pin key={l} x={10 + i*18} y={82} label={l}
            color={i===0?'#facc15':i===1?'#94a3b8':'#22d3ee'} />
        ))}
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="R" value={r} min={0} max={255} step={1} color="#f87171" onChange={setR} />
        <SliderRow label="G" value={g} min={0} max={255} step={1} color="#4ade80" onChange={setG} />
        <SliderRow label="B" value={b} min={0} max={255} step={1} color="#60a5fa" onChange={setB} />
      </div>
    </div>
  );
};

// ── HC-05 Bluetooth ────────────────────────────────────────────────────────
const BT_PANEL = { background: '#0f172a', border: '1px solid #1d4ed8', borderRadius: 4, padding: '4px 6px', marginTop: 2, width: 160, fontFamily: 'monospace', fontSize: 10 };

export const Hc05Bluetooth = () => {
  const [rxLog, setRxLog] = useState(''); // data received from MCU (MCU TX → BT)
  const [sendVal, setSendVal] = useState('');

  useEffect(() => {
    // Subscribe to MCU serial TX bytes (what the MCU sends to HC-05's RXD)
    const prev = window.onSerialTX;
    window.onSerialTX = (byte) => {
      prev?.(byte);
      setRxLog(log => (log + String.fromCharCode(byte)).slice(-200));
    };
    return () => { window.onSerialTX = prev; };
  }, []);

  const handleSend = useCallback(() => {
    if (!sendVal) return;
    for (const ch of sendVal + '\n') {
      window.injectSerialByte?.(ch.charCodeAt(0));
    }
    setSendVal('');
  }, [sendVal]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={100} height={84} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={4} y={4} width={92} height={68} rx={4} fill="#172554" stroke="#1d4ed8" strokeWidth={1.5} />
        <text x={50} y={34} fontSize={20} textAnchor="middle">🔵</text>
        <text x={50} y={50} fill="#93c5fd" fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">HC-05</text>
        <text x={50} y={60} fill="#1d4ed8" fontSize={6} textAnchor="middle" fontFamily="monospace">BLUETOOTH</text>
        {['VCC','GND','TXD','RXD','ST','EN'].map((l, i) => (
          <Pin key={l} x={10 + i*16} y={78} label={l}
            color={i===0?'#facc15':i===1?'#94a3b8':'#22d3ee'} />
        ))}
      </svg>
      <div style={BT_PANEL}>
        <div style={{ color: '#93c5fd', marginBottom: 3, fontSize: 9 }}>MCU → BT:</div>
        <div style={{ color: '#4ade80', minHeight: 28, maxHeight: 40, overflowY: 'auto', wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: 9 }}>
          {rxLog || <span style={{ color: '#334155' }}>waiting…</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <input
            value={sendVal}
            onChange={e => setSendVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="send to MCU…"
            style={{ flex: 1, background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 3, color: '#e2e8f0', fontSize: 9, padding: '2px 4px', outline: 'none' }}
          />
          <button
            onClick={handleSend}
            style={{ background: '#1d4ed8', border: 'none', borderRadius: 3, color: '#fff', fontSize: 9, padding: '2px 6px', cursor: 'pointer' }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

// ── RC522 RFID ─────────────────────────────────────────────────────────────
export const Rc522Rfid = () => (
  <svg width={114} height={74} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={4} y={4} width={106} height={58} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    {/* Antenna coil */}
    {[0,1,2].map(i => (
      <rect key={i} x={8+i*4} y={8+i*4} width={50-i*8} height={42-i*8}
        rx={3} fill="none" stroke={i===0?'#f59e0b':'#475569'} strokeWidth={1} />
    ))}
    <text x={80} y={28} fill="#94a3b8" fontSize={7} fontWeight="bold" textAnchor="middle" fontFamily="monospace">RC522</text>
    <text x={80} y={40} fill="#475569" fontSize={6} textAnchor="middle" fontFamily="monospace">RFID</text>
    {['SDA','SCK','MOSI','MISO','IRQ','GND','RST','3V3'].map((l, i) => (
      <Pin key={l} x={8 + i*13} y={68} label={l}
        color={i===5?'#94a3b8':i===7?'#facc15':'#22d3ee'} />
    ))}
  </svg>
);

// ══════════════════════════════════════════════════════════════════════════
// Power components & connectors
// ══════════════════════════════════════════════════════════════════════════

export const AaBattery = () => (
  <svg width={30} height={96} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={9} y={0} width={12} height={6} rx={2} fill="#facc15" />
    <rect x={3} y={6} width={24} height={72} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    <rect x={3} y={22} width={24} height={30} rx={0} fill="#172554" />
    <text x={15} y={42} fill="#93c5fd" fontSize={5.5} fontWeight="bold" textAnchor="middle" fontFamily="monospace">1.5V</text>
    <rect x={3} y={78} width={24} height={4} rx={1} fill="#94a3b8" />
    <line x1={14} y1={0}  x2={14} y2={-4} stroke="#facc15" strokeWidth={2} />
    <line x1={14} y1={82} x2={14} y2={88} stroke="#94a3b8" strokeWidth={2} />
    <Pin x={14} y={5}  label="+" color="#facc15" />
    <Pin x={14} y={88} label="−" color="#94a3b8" />
  </svg>
);

export const BenchPsu = () => (
  <svg width={100} height={84} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={3} y={3} width={94} height={70} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    <text x={50} y={18} fill="#94a3b8" fontSize={8} fontWeight="bold" textAnchor="middle" fontFamily="monospace">BENCH PSU</text>
    <rect x={10} y={22} width={50} height={22} rx={2} fill="#0f172a" stroke="#22d3ee" strokeWidth={1} />
    <text x={35} y={37} fill="#22d3ee" fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="monospace">5.00V</text>
    <circle cx={80} cy={32} r={5} fill="#22c55e" style={{filter:'drop-shadow(0 0 3px #22c55e)'}} />
    <circle cx={20} cy={58} r={5} fill="#ef4444" stroke="#7f1d1d" strokeWidth={1} />
    <circle cx={50} cy={58} r={5} fill="#1e293b" stroke="#334155" strokeWidth={1} />
    <circle cx={80} cy={58} r={5} fill="#1e293b" stroke="#334155" strokeWidth={1} />
    {[['V+',20,'#ef4444'],['V−',50,'#94a3b8'],['GND',80,'#94a3b8']].map(([l,x,c]) => (
      <Pin key={l} x={x} y={78} label={l} color={c} />
    ))}
  </svg>
);

export const BuckConverter = () => (
  <svg width={90} height={62} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={6} y={4} width={78} height={54} rx={4} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    {[0,1,2,3,4].map(i => (
      <ellipse key={i} cx={22+i*7} cy={26} rx={4} ry={10} fill="none" stroke="#475569" strokeWidth={2} />
    ))}
    <rect x={52} y={14} width={24} height={22} rx={2} fill="#0f172a" stroke="#64748b" strokeWidth={1} />
    <text x={64} y={28} fill="#64748b" fontSize={5.5} fontWeight="bold" textAnchor="middle" fontFamily="monospace">LM2596</text>
    <text x={45} y={48} fill="#64748b" fontSize={6} textAnchor="middle" fontFamily="monospace">DC-DC BUCK</text>
    <line x1={0} y1={26} x2={6} y2={26} stroke="#475569" strokeWidth={1.5} />
    <line x1={0} y1={52} x2={6} y2={52} stroke="#475569" strokeWidth={1.5} />
    <line x1={84} y1={26} x2={90} y2={26} stroke="#475569" strokeWidth={1.5} />
    <line x1={84} y1={52} x2={90} y2={52} stroke="#475569" strokeWidth={1.5} />
    <Pin x={0}  y={26} label="IN+"  color="#facc15" />
    <Pin x={0}  y={52} label="IN−"  color="#94a3b8" />
    <Pin x={90} y={26} label="OUT+" color="#22c55e" />
    <Pin x={90} y={52} label="OUT−" color="#94a3b8" />
  </svg>
);

export const Lm7805Reg = () => (
  <svg width={60} height={82} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={8} y={4} width={44} height={8} rx={1} fill="#64748b" />
    <rect x={14} y={8} width={6} height={4} rx={0} fill="#334155" />
    <rect x={8} y={12} width={44} height={50} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    <text x={30} y={30} fill="#94a3b8" fontSize={7} fontWeight="bold" textAnchor="middle" fontFamily="monospace">LM7805</text>
    <text x={30} y={42} fill="#64748b" fontSize={6} textAnchor="middle" fontFamily="monospace">+5V REG</text>
    <line x1={15} y1={62} x2={15} y2={75} stroke="#64748b" strokeWidth={2} />
    <line x1={30} y1={62} x2={30} y2={75} stroke="#64748b" strokeWidth={2} />
    <line x1={45} y1={62} x2={45} y2={75} stroke="#64748b" strokeWidth={2} />
    <Pin x={15} y={75} label="IN"  color="#facc15" />
    <Pin x={30} y={75} label="GND" color="#94a3b8" />
    <Pin x={45} y={75} label="OUT" color="#22c55e" />
  </svg>
);

export const FunctionGenerator = () => {
  const [freq, setFreq] = useState(1000);
  const [wave, setWave] = useState('SQR');
  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={100} height={84} style={{ display: 'block', overflow: 'visible' }}>
        <rect x={3} y={3} width={94} height={70} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
        <text x={50} y={16} fill="#94a3b8" fontSize={7} fontWeight="bold" textAnchor="middle" fontFamily="monospace">FUNC GEN</text>
        <rect x={8} y={20} width={84} height={22} rx={2} fill="#0f172a" stroke="#22d3ee" strokeWidth={1} />
        <text x={50} y={35} fill="#22d3ee" fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          {freq >= 1000 ? `${(freq/1000).toFixed(1)}kHz` : `${freq}Hz`} {wave}
        </text>
        {['SQR','SIN','TRI'].map((w, i) => (
          <g key={w} style={{ cursor: 'pointer' }} onClick={() => setWave(w)}>
            <rect x={10+i*28} y={46} width={24} height={14} rx={2}
              fill={wave===w ? '#164e63' : '#0f172a'} stroke={wave===w ? '#22d3ee' : '#334155'} strokeWidth={1} />
            <text x={22+i*28} y={57} fill={wave===w ? '#22d3ee' : '#64748b'} fontSize={6}
              textAnchor="middle" fontFamily="monospace">{w}</text>
          </g>
        ))}
        <Pin x={20} y={78} label="SIG" color="#22d3ee" />
        <Pin x={70} y={78} label="GND" color="#94a3b8" />
      </svg>
      <div style={SENSOR_PANEL}>
        <SliderRow label="f" value={freq} min={1} max={100000} step={1} unit="Hz" color="#22d3ee" onChange={setFreq} />
      </div>
    </div>
  );
};

export const UsbConnector = () => (
  <svg width={68} height={66} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={4} y={8} width={60} height={36} rx={3} fill="#64748b" stroke="#475569" strokeWidth={1.5} />
    <rect x={10} y={14} width={48} height={24} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={1} />
    {[0,1,2,3].map(i => (
      <rect key={i} x={16+i*10} y={22} width={6} height={8} rx={1} fill="#d4a017" />
    ))}
    <text x={34} y={55} fill="#64748b" fontSize={6.5} textAnchor="middle" fontFamily="monospace">USB-A</text>
    {[['VBUS',10,'#facc15'],['D−',25,'#22d3ee'],['D+',40,'#22d3ee'],['GND',55,'#94a3b8']].map(([l,x,c]) => (
      <Pin key={l} x={x} y={60} label={l} color={c} />
    ))}
  </svg>
);

export const BarrelJack = () => (
  <svg width={48} height={64} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={4} y={12} width={40} height={32} rx={16} fill="#334155" stroke="#475569" strokeWidth={1.5} />
    <circle cx={24} cy={28} r={10} fill="#1e293b" stroke="#64748b" strokeWidth={1} />
    <circle cx={24} cy={28} r={4}  fill="#d4a017" />
    <text x={24} y={52} fill="#64748b" fontSize={6} textAnchor="middle" fontFamily="monospace">DC JACK</text>
    <Pin x={14} y={58} label="+"   color="#facc15" />
    <Pin x={34} y={58} label="GND" color="#94a3b8" />
  </svg>
);

export const ScrewTerminal2 = () => (
  <svg width={40} height={54} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={2} y={4} width={36} height={36} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    {[0,1].map(i => (
      <g key={i}>
        <rect x={6+i*16} y={8}  width={14} height={14} rx={2} fill="#0f172a" stroke="#475569" strokeWidth={1} />
        <circle cx={13+i*16} cy={15} r={3} fill="#64748b" />
        <line x1={11+i*16} y1={13} x2={15+i*16} y2={17} stroke="#334155" strokeWidth={1} />
        <rect x={8+i*16} y={22} width={10} height={10} rx={1} fill="#0f172a" stroke="#334155" strokeWidth={1} />
      </g>
    ))}
    <Pin x={12} y={48} label="T1" color="#22d3ee" />
    <Pin x={28} y={48} label="T2" color="#22d3ee" />
  </svg>
);

export const ScrewTerminal3 = () => (
  <svg width={56} height={54} style={{ display: 'block', overflow: 'visible' }}>
    <rect x={2} y={4} width={52} height={36} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x={5+i*16} y={8}  width={14} height={14} rx={2} fill="#0f172a" stroke="#475569" strokeWidth={1} />
        <circle cx={12+i*16} cy={15} r={3} fill="#64748b" />
        <line x1={10+i*16} y1={13} x2={14+i*16} y2={17} stroke="#334155" strokeWidth={1} />
        <rect x={7+i*16} y={22} width={10} height={10} rx={1} fill="#0f172a" stroke="#334155" strokeWidth={1} />
      </g>
    ))}
    <Pin x={10} y={48} label="T1" color="#22d3ee" />
    <Pin x={27} y={48} label="T2" color="#22d3ee" />
    <Pin x={44} y={48} label="T3" color="#22d3ee" />
  </svg>
);

// ── Seven-Segment Display ──────────────────────────────────────────────────
// Segment layout (standard):
//   a=top, b=top-right, c=bot-right, d=bottom, e=bot-left, f=top-left, g=middle
const SEG_W = 22, SEG_H = 5; // segment bar dims
const SEG_DEFS = {
  a:  { x: 24,  y: 8,   r: 0 },
  b:  { x: 49,  y: 24,  r: 90 },
  c:  { x: 49,  y: 52,  r: 90 },
  d:  { x: 24,  y: 74,  r: 0 },
  e:  { x: 0,   y: 52,  r: 90 },
  f:  { x: 0,   y: 24,  r: 90 },
  g:  { x: 24,  y: 41,  r: 0 },
};

export const SevenSegDisplay = ({ pinStates = {} }) => {
  const active = (id) => !!pinStates[id];
  const color = '#ff3333';
  const dim   = '#1a0000';

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={90} height={130} style={{ display: 'block', overflow: 'visible' }}>
        {/* Housing */}
        <rect x={2} y={2} width={86} height={96} rx={4} fill="#111" stroke="#334155" strokeWidth={1.5} />

        {/* Segments */}
        {Object.entries(SEG_DEFS).map(([id, { x, y, r }]) => {
          const on = active(id);
          const cx = x + (r === 90 ? SEG_H / 2 : SEG_W / 2);
          const cy = y + (r === 90 ? SEG_W / 2 : SEG_H / 2);
          return (
            <rect
              key={id}
              x={x} y={y}
              width={r === 90 ? SEG_H : SEG_W}
              height={r === 90 ? SEG_W : SEG_H}
              rx={2}
              fill={on ? color : dim}
              style={{ filter: on ? `drop-shadow(0 0 4px ${color})` : 'none' }}
            />
          );
        })}

        {/* Decimal point */}
        <circle cx={74} cy={77} r={3}
          fill={active('dp') ? color : dim}
          style={{ filter: active('dp') ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        />

        {/* Pin labels along bottom */}
        {['a','b','c','d','e','f','g','dp'].map((id, i) => (
          <g key={id}>
            <line x1={9 + i * 10} y1={98} x2={9 + i * 10} y2={108} stroke="#94a3b8" strokeWidth={1.5} />
            <text x={9 + i * 10} y={120} fontSize={6} fill="#64748b" textAnchor="middle" fontFamily="monospace">{id}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};
