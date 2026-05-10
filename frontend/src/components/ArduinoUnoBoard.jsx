import { useState } from "react";

const BW = 680;
const BH = 480;

// ── Pin layout (coordinates unchanged — wiring system depends on these) ───────
const TOP_POWER = [
  { id: "IOREF", x: 72,  y: 14, label: "IOREF" },
  { id: "RST",   x: 94,  y: 14, label: "RST"   },
  { id: "3V3",   x: 116, y: 14, label: "3V3"   },
  { id: "5V",    x: 138, y: 14, label: "5V"     },
  { id: "GND1",  x: 160, y: 14, label: "GND"   },
  { id: "GND2",  x: 182, y: 14, label: "GND"   },
  { id: "VIN",   x: 204, y: 14, label: "VIN"   },
];
const TOP_DIGITAL = [
  { id: "SCL",  x: 348, y: 14, label: "SCL"  },
  { id: "SDA",  x: 370, y: 14, label: "SDA"  },
  { id: "AREF", x: 392, y: 14, label: "AREF" },
  { id: "GND3", x: 414, y: 14, label: "GND"  },
  { pinId: 13, x: 436, y: 14, label: "13",  pwm: false },
  { pinId: 12, x: 458, y: 14, label: "12",  pwm: false },
  { pinId: 11, x: 480, y: 14, label: "~11", pwm: true  },
  { pinId: 10, x: 502, y: 14, label: "~10", pwm: true  },
  { pinId:  9, x: 524, y: 14, label: "~9",  pwm: true  },
  { pinId:  8, x: 546, y: 14, label: "8",   pwm: false },
];
const BOTTOM_ANALOG = [
  { pinId: 14, x: 72,  y: 466, label: "A0" },
  { pinId: 15, x: 94,  y: 466, label: "A1" },
  { pinId: 16, x: 116, y: 466, label: "A2" },
  { pinId: 17, x: 138, y: 466, label: "A3" },
  { pinId: 18, x: 160, y: 466, label: "A4" },
  { pinId: 19, x: 182, y: 466, label: "A5" },
];
const BOTTOM_DIGITAL = [
  { pinId:  7, x: 348, y: 466, label: "7",   pwm: false },
  { pinId:  6, x: 370, y: 466, label: "~6",  pwm: true  },
  { pinId:  5, x: 392, y: 466, label: "~5",  pwm: true  },
  { pinId:  4, x: 414, y: 466, label: "4",   pwm: false },
  { pinId:  3, x: 436, y: 466, label: "~3",  pwm: true  },
  { pinId:  2, x: 458, y: 466, label: "2",   pwm: false },
  { pinId:  1, x: 480, y: 466, label: "TX",  pwm: false },
  { pinId:  0, x: 502, y: 466, label: "RX",  pwm: false },
];

const ALL_INTERACTIVE = [
  ...TOP_DIGITAL.filter(p => p.pinId !== undefined),
  ...BOTTOM_ANALOG,
  ...BOTTOM_DIGITAL,
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function stateColor(state) {
  if (state === "PWM") return "#00aaff";
  if (state === true)  return "#00ff88";
  return null;
}

function getPinState(registers, pinId) {
  if (!registers || pinId == null) return false;
  if (registers.PWM?.[pinId] > 0 && registers.PWM[pinId] < 255) return "PWM";
  if (registers.PWM?.[pinId] === 255) return true;
  if (pinId <= 7)  return registers.PORTD?.[pinId] === 1;
  if (pinId <= 13) return registers.PORTB?.[pinId - 8] === 1;
  if (pinId <= 19) return registers.PORTC?.[pinId - 14] === 1;
  return false;
}

// ── Static pad (power / special pins) ────────────────────────────────────────
function StaticPad({ pin }) {
  const isTop = pin.y < 100;
  const lx = pin.x;
  const ly = isTop ? pin.y - 22 : pin.y + 22;
  return (
    <g>
      <rect x={pin.x - 5} y={pin.y - 5} width={10} height={10} rx={1}
        fill="#0c0c0c" stroke="#b8943a" strokeWidth="1.2" />
      <rect x={pin.x - 3} y={pin.y - 3} width={6} height={6} rx={0.5} fill="#c8a34a" />
      <rect x={pin.x - 1.5} y={pin.y - 1.5} width={3} height={3} fill="#080808" />
      <text x={lx} y={ly} textAnchor="middle"
        fill="rgba(255,255,255,0.72)" fontSize={5.5}
        fontFamily="'JetBrains Mono', monospace" fontWeight="600"
        transform={`rotate(-90,${lx},${ly})`}
        style={{ userSelect: "none" }}>
        {pin.label}
      </text>
    </g>
  );
}

// ── Interactive pad (digital / analog pins) ───────────────────────────────────
function InteractivePad({ pin, state, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const sc = stateColor(state);
  const isTop = pin.y < 100;
  const lx = pin.x;
  const ly = isTop ? pin.y - 22 : pin.y + 22;
  const tooltipY = isTop ? pin.y + 18 : pin.y - 48;

  function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (window.getActiveWire?.()) {
      window.onCompleteWire?.(pin.pinId);
    } else {
      const r = e.target.getBoundingClientRect();
      window.onStartWire?.(`mcu::${pin.pinId}`, null, r.left + r.width / 2, r.top + r.height / 2);
    }
  }

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onToggle?.(pin.pinId)}
      style={{ cursor: "pointer" }}
      data-chip-node="interactive"
    >
      {/* Pad housing */}
      <rect x={pin.x - 5} y={pin.y - 5} width={10} height={10} rx={1}
        fill="#0c0c0c"
        stroke={sc ? sc : hovered ? "#00ff88" : "#b8943a"}
        strokeWidth="1.2"
      />
      {/* Pad fill */}
      <rect x={pin.x - 3} y={pin.y - 3} width={6} height={6} rx={0.5}
        fill={sc ?? "#c8a34a"}
        style={sc ? { filter: `drop-shadow(0 0 4px ${sc})` } : {}}
      />
      {/* Drill hole */}
      <rect x={pin.x - 1.5} y={pin.y - 1.5} width={3} height={3} fill="#060606" />
      {/* Hover glow */}
      {hovered && (
        <rect x={pin.x - 7} y={pin.y - 7} width={14} height={14} rx={2}
          fill="none" stroke="#00ff88" strokeWidth={1} opacity={0.7} />
      )}

      {/* Wiring hit target */}
      <circle
        id={`chip-pin-tip-${pin.pinId}`}
        cx={pin.x} cy={pin.y} r={7}
        fill="transparent" stroke="transparent"
        onMouseDown={handleMouseDown}
        onClick={e => e.stopPropagation()}
        data-chip-node="interactive"
      />

      {/* Rotated label */}
      <text x={lx} y={ly} textAnchor="middle"
        fill={hovered ? "#fff" : sc ? sc : "rgba(255,255,255,0.78)"}
        fontSize={5.5} fontFamily="'JetBrains Mono', monospace" fontWeight="700"
        transform={`rotate(-90,${lx},${ly})`}
        style={{ userSelect: "none", pointerEvents: "none" }}>
        {pin.label}
      </text>

      {/* Hover tooltip */}
      {hovered && (
        <g style={{ pointerEvents: "none" }}>
          <rect x={pin.x - 30} y={tooltipY} width={60} height={28} rx={3}
            fill="#0a0a0a" stroke="#333" strokeWidth={1} opacity={0.95} />
          <text x={pin.x} y={tooltipY + 11} textAnchor="middle"
            fill="#00F2FF" fontSize={8} fontFamily="monospace" fontWeight="700">
            {pin.label.startsWith("A")
              ? pin.label
              : `${pin.pwm ? "~" : ""}D${pin.label.replace(/^~/, "")}`}
          </text>
          <text x={pin.x} y={tooltipY + 21} textAnchor="middle"
            fill="#888" fontSize={7} fontFamily="monospace">
            {state === "PWM" ? "PWM" : state ? "HIGH 5V" : "LOW 0V"}
          </text>
        </g>
      )}
    </g>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export default function ArduinoUnoBoard({ registers, toggleInput }) {
  const d13 = getPinState(registers, 13);
  const isPowered = !!(registers?.PORTB || registers?.PORTC || registers?.PORTD);

  return (
    <div id="arduino-uno-board" style={{ position: "relative", width: BW, height: BH, userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${BW} ${BH}`}
        width={BW} height={BH}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="pcbBlue" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#1c5ea0" />
            <stop offset="100%" stopColor="#134d87" />
          </linearGradient>
          <linearGradient id="usbMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#aaaaaa" />
            <stop offset="100%" stopColor="#707070" />
          </linearGradient>
          <linearGradient id="chipBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#222" />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
        </defs>

        {/* ── PCB body ─────────────────────────────────────────────────────── */}
        <rect x={28} y={15} width={612} height={450} rx={10}
          fill="url(#pcbBlue)" />
        {/* Top edge highlight */}
        <rect x={28} y={15} width={612} height={450} rx={10}
          fill="none" stroke="#2272c3" strokeWidth={1.5} opacity={0.5} />
        {/* Subtle inner bevel */}
        <rect x={36} y={23} width={596} height={434} rx={7}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

        {/* ── Mounting holes ── */}
        {[[50,34],[618,34],[50,456],[604,456]].map(([mx,my],i) => (
          <g key={i}>
            <circle cx={mx} cy={my} r={7.5} fill="#0c3560" stroke="#0a2a4a" strokeWidth={1} />
            <circle cx={mx} cy={my} r={4}   fill="#071e33" />
          </g>
        ))}

        {/* ── USB Type-B connector (left side) ── */}
        <rect x={8} y={70} width={32} height={90} rx={5}
          fill="url(#usbMetal)" stroke="#555" strokeWidth={1} />
        <rect x={11} y={75} width={26} height={80} rx={3} fill="#888" />
        <rect x={13} y={80} width={22} height={70} rx={2} fill="#1a1a1a" />
        {/* USB-B port opening (trapezoid-ish) */}
        <rect x={15} y={86} width={18} height={56} rx={1} fill="#0a0a0a" />
        <rect x={17} y={90} width={14} height={48} rx={1} fill="#050505" />

        {/* ── DC Power Jack (bottom-left) ── */}
        <rect x={8} y={358} width={38} height={66} rx={5}
          fill="#1e1e1e" stroke="#111" strokeWidth={1.5} />
        <rect x={12} y={363} width={30} height={56} rx={3} fill="#181818" />
        <ellipse cx={27} cy={391} rx={15} ry={15} fill="#111" stroke="#0a0a0a" strokeWidth={2} />
        <ellipse cx={27} cy={391} rx={8}  ry={8}  fill="#1e1e1e" />
        <circle  cx={27} cy={391} r={3}   fill="#080808" />

        {/* ── ATmega16U2 USB controller ── */}
        <rect x={90} y={92} width={52} height={40} rx={2}
          fill="#141414" stroke="#222" strokeWidth={1} />
        <circle cx={95} cy={97} r={2.5} fill="#0a0a0a" stroke="#2a2a2a" strokeWidth={0.5} />
        <text x={116} y={115} textAnchor="middle"
          fill="#282828" fontSize={6.5} fontFamily="'JetBrains Mono', monospace" fontWeight="700">16U2</text>

        {/* ── Reset button ── */}
        <rect x={148} y={74} width={44} height={42} rx={3}
          fill="#3a3a3a" stroke="#2a2a2a" strokeWidth={1} />
        {/* Tactile button cap */}
        <circle cx={170} cy={95} r={15} fill="#bb1e1e" stroke="#881010" strokeWidth={2} />
        <circle cx={170} cy={95} r={8}  fill="#cc3333" opacity={0.5} />
        <circle cx={170} cy={95} r={3}  fill="#ee5555" opacity={0.3} />
        <text x={170} y={132} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize={6} fontFamily="monospace">RESET</text>

        {/* ── Crystal oscillator ── */}
        <rect x={246} y={315} width={13} height={34} rx={4}
          fill="#b0b0b0" stroke="#d0d0d0" strokeWidth={0.5} />
        <rect x={248} y={320} width={9} height={24} rx={2} fill="#999" />
        <line x1={252.5} y1={313} x2={252.5} y2={315} stroke="#888" strokeWidth={2} />
        <line x1={252.5} y1={349} x2={252.5} y2={351} stroke="#888" strokeWidth={2} />

        {/* ── ATmega328P DIP-28 chip ── */}
        {/* Top leads (14 pins) */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={`tl-${i}`} x={270 + i * 17.5} y={294} width={4} height={10} rx={0.8}
            fill="#c0c0c0" stroke="#999" strokeWidth={0.5} />
        ))}
        {/* Bottom leads (14 pins) */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={`bl-${i}`} x={270 + i * 17.5} y={366} width={4} height={10} rx={0.8}
            fill="#c0c0c0" stroke="#999" strokeWidth={0.5} />
        ))}
        {/* IC body */}
        <rect x={263} y={304} width={245} height={62} rx={3}
          fill="url(#chipBody)" stroke="#2a2a2a" strokeWidth={1.5} />
        <rect x={265} y={306} width={241} height={58} rx={2} fill="#111" />
        {/* IC orientation notch */}
        <path d="M378,304 a10,10 0 0,1 20,0" fill="#0a0a0a" />
        {/* Chip label */}
        <text x={388} y={330} textAnchor="middle"
          fill="#505050" fontSize={9} fontFamily="'JetBrains Mono', monospace"
          fontWeight="700" letterSpacing="1.5">ATMEGA328P</text>
        <text x={388} y={346} textAnchor="middle"
          fill="#363636" fontSize={6.5} fontFamily="monospace">Microchip Technology</text>
        <text x={388} y={356} textAnchor="middle"
          fill="#2e2e2e" fontSize={5.5} fontFamily="monospace">MEGAAVR® 8-BIT  16 MHz</text>

        {/* ── Arduino logo (⊖⊕ style) ── */}
        <g transform="translate(448,205)">
          <circle cx={0} cy={0} r={29} fill="none" stroke="white" strokeWidth={2.5} />
          {/* Left circle with minus */}
          <circle cx={-11} cy={0} r={10} fill="none" stroke="white" strokeWidth={2} />
          <line x1={-15.5} y1={0} x2={-6.5} y2={0} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
          {/* Right circle with plus */}
          <circle cx={11} cy={0} r={10} fill="none" stroke="white" strokeWidth={2} />
          <line x1={6.5} y1={0} x2={15.5} y2={0} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={11} y1={-4.5} x2={11} y2={4.5} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
        </g>

        {/* ── "UNO" box ── */}
        <rect x={490} y={188} width={68} height={34} rx={4}
          fill="none" stroke="white" strokeWidth={2.5} />
        <text x={524} y={212} textAnchor="middle"
          fill="white" fontSize={17} fontFamily="'Arial Black', 'Inter', sans-serif"
          fontWeight={900} letterSpacing={3}>UNO</text>

        {/* ── "ARDUINO" text ── */}
        <text x={450} y={252} textAnchor="middle"
          fill="white" fontSize={13} fontFamily="'Arial Black', 'Inter', sans-serif"
          fontWeight={900} letterSpacing={5}>ARDUINO</text>

        {/* ── SMD LEDs ── */}
        {/* L (pin 13) */}
        <rect x={392} y={188} width={10} height={8} rx={1.5}
          fill={d13 ? "#ffaa00" : "#2a1500"}
          style={d13 ? { filter: "drop-shadow(0 0 6px #ffaa00)" } : {}} />
        <text x={393} y={204} fill="rgba(255,255,255,0.55)" fontSize={6} fontFamily="monospace">L</text>

        {/* TX */}
        <rect x={392} y={218} width={10} height={8} rx={1.5} fill="#00660020" />
        <rect x={392} y={218} width={10} height={8} rx={1.5} fill="none" stroke="#005500" strokeWidth={0.8} />
        <text x={393} y={234} fill="rgba(255,255,255,0.45)" fontSize={5.5} fontFamily="monospace">TX</text>

        {/* RX */}
        <rect x={392} y={234} width={10} height={8} rx={1.5} fill="#00660020" />
        <rect x={392} y={234} width={10} height={8} rx={1.5} fill="none" stroke="#005500" strokeWidth={0.8} />
        <text x={393} y={250} fill="rgba(255,255,255,0.45)" fontSize={5.5} fontFamily="monospace">RX</text>

        {/* ON (power) */}
        <rect x={593} y={273} width={10} height={8} rx={1.5}
          fill={isPowered ? "#00e64d" : "#002200"}
          style={isPowered ? { filter: "drop-shadow(0 0 5px #00e64d)" } : {}} />
        <text x={578} y={288} fill="rgba(255,255,255,0.45)" fontSize={5.5} fontFamily="monospace">ON</text>

        {/* ── ICSP header (near digital pins, top area) ── */}
        <g transform="translate(270,26)">
          {[0,1,2].flatMap(col => [0,1].map(row => (
            <rect key={`i1-${col}-${row}`}
              x={col * 10} y={row * 10} width={7} height={7} rx={1}
              fill="#c8a34a" stroke="#0a0a0a" strokeWidth={1} />
          )))}
          <text x={15} y={33} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" fontSize={5.5} fontFamily="monospace">ICSP</text>
        </g>

        {/* ── ICSP header (lower, near analog side) ── */}
        <g transform="translate(178,394)">
          {[0,1,2].flatMap(col => [0,1].map(row => (
            <rect key={`i2-${col}-${row}`}
              x={col * 10} y={row * 10} width={7} height={7} rx={1}
              fill="#c8a34a" stroke="#0a0a0a" strokeWidth={1} />
          )))}
        </g>

        {/* ── Pin connector housings ── */}
        {/* Top: POWER group */}
        <rect x={57} y={5} width={162} height={17} rx={2} fill="#0d0d0d" />
        {/* Top: DIGITAL group */}
        <rect x={333} y={5} width={228} height={17} rx={2} fill="#0d0d0d" />
        {/* Bottom: ANALOG IN group */}
        <rect x={57} y={458} width={140} height={17} rx={2} fill="#0d0d0d" />
        {/* Bottom: DIGITAL group */}
        <rect x={333} y={458} width={184} height={17} rx={2} fill="#0d0d0d" />

        {/* ── Header silkscreen labels ── */}
        <text x={138} y={44} textAnchor="middle"
          fill="rgba(255,255,255,0.42)" fontSize={6.5} fontFamily="monospace" fontWeight="700">POWER</text>
        <text x={456} y={44} textAnchor="middle"
          fill="rgba(255,255,255,0.42)" fontSize={6.5} fontFamily="monospace" fontWeight="700">DIGITAL (PWM ~)</text>
        <text x={127} y={448} textAnchor="middle"
          fill="rgba(255,255,255,0.42)" fontSize={6.5} fontFamily="monospace" fontWeight="700">ANALOG IN</text>
        <text x={425} y={448} textAnchor="middle"
          fill="rgba(255,255,255,0.42)" fontSize={6.5} fontFamily="monospace" fontWeight="700">DIGITAL</text>

        {/* ── Pin pads — static ── */}
        {TOP_POWER.map(p => <StaticPad key={p.id} pin={p} />)}
        {TOP_DIGITAL.filter(p => !("pinId" in p)).map(p => <StaticPad key={p.id} pin={p} />)}

        {/* ── Pin pads — interactive ── */}
        {ALL_INTERACTIVE.map(p => (
          <InteractivePad
            key={p.pinId}
            pin={p}
            state={getPinState(registers, p.pinId)}
            onToggle={toggleInput}
          />
        ))}
      </svg>
    </div>
  );
}
