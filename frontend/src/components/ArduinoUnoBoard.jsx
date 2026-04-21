import { useState } from "react";

const BW = 680;
const BH = 480;

// ── Pin layout ───────────────────────────────────────────────────────────────
// Top header (y=14): power group left, digital 8-13+special right
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

// Bottom header (y=466): analog left, digital 0-7 right
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Static pad (power / special, no interaction) ─────────────────────────────
function StaticPad({ pin }) {
  const isGnd = pin.label === "GND";
  const isTop = pin.y < 100;
  return (
    <g>
      <circle cx={pin.x} cy={pin.y} r={6.5} fill="#165618" stroke="#b8943a" strokeWidth="1.5" />
      <circle cx={pin.x} cy={pin.y} r={4.5} fill={isGnd ? "#555" : "#c8a34a"} />
      <circle cx={pin.x} cy={pin.y} r={1.5} fill="#050505" />
      <text x={pin.x} y={isTop ? pin.y - 12 : pin.y + 20}
        textAnchor="middle" fill="#c8c8a0" fontSize={6}
        fontFamily="'JetBrains Mono', monospace" fontWeight="600"
        style={{ userSelect: "none" }}>
        {pin.label}
      </text>
    </g>
  );
}

// ── Interactive pad (digital / analog pin) ────────────────────────────────────
function InteractivePad({ pin, state, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const sc = stateColor(state);
  const isTop = pin.y < 100;
  const labelY = isTop ? pin.y - 12 : pin.y + 20;
  const tooltipY = isTop ? pin.y + 14 : pin.y - 44;

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
      {/* Land ring */}
      <circle cx={pin.x} cy={pin.y} r={6.5} fill="#165618" stroke="#b8943a" strokeWidth="1.5" />
      {/* Pad fill — lit up when HIGH/PWM */}
      <circle cx={pin.x} cy={pin.y} r={4.5}
        fill={sc ?? "#c8a34a"}
        style={sc ? { filter: `drop-shadow(0 0 4px ${sc})` } : {}}
      />
      {/* Drill hole */}
      <circle cx={pin.x} cy={pin.y} r={1.5} fill="#050505" />
      {/* Hover ring */}
      {hovered && <circle cx={pin.x} cy={pin.y} r={7.5} fill="none" stroke="#00ff88" strokeWidth={1} opacity={0.8} />}

      {/* Terminal node — wiring system hooks into this element */}
      <circle
        id={`chip-pin-tip-${pin.pinId}`}
        cx={pin.x} cy={pin.y} r={7}
        fill="transparent" stroke="transparent"
        onMouseDown={handleMouseDown}
        onClick={e => e.stopPropagation()}
        data-chip-node="interactive"
      />

      {/* Label */}
      <text x={pin.x} y={labelY}
        textAnchor="middle"
        fill={hovered ? "#fff" : sc ? sc : "#c8c8a0"}
        fontSize={6} fontFamily="'JetBrains Mono', monospace" fontWeight="700"
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
            {pin.pwm ? "~" : ""}D{pin.label}
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
    <div style={{ position: "relative", width: BW, height: BH, userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${BW} ${BH}`}
        width={BW} height={BH}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* ── PCB body ─────────────────────────────────────────── */}
        <rect x={10} y={10} width={610} height={460} rx={8}
          fill="#1e7a26" stroke="#279434" strokeWidth={1.5} />
        {/* Subtle inner highlight */}
        <rect x={18} y={18} width={594} height={444} rx={5}
          fill="none" stroke="rgba(100,200,100,0.08)" strokeWidth={1} />

        {/* ── USB Type-B connector (right side) ── */}
        <rect x={618} y={160} width={44} height={110} rx={6} fill="#8a8a8a" />
        <rect x={623} y={168} width={34} height={94} rx={3} fill="#1a1a1a" />
        <text x={640} y={218} textAnchor="middle" fill="#555"
          fontSize={7} fontFamily="monospace">USB</text>

        {/* ── DC Power Jack (right side) ── */}
        <rect x={618} y={360} width={38} height={60} rx={6} fill="#333" />
        <circle cx={637} cy={390} r={13} fill="#222" stroke="#111" strokeWidth={2} />
        <circle cx={637} cy={390} r={7}  fill="#3a3a3a" />
        <circle cx={637} cy={390} r={3}  fill="#111" />

        {/* ── Mounting holes ── */}
        {[[36,36],[590,36],[36,444],[582,444]].map(([mx,my],i) => (
          <g key={i}>
            <circle cx={mx} cy={my} r={5.5} fill="none" stroke="#145818" strokeWidth={2} />
            <circle cx={mx} cy={my} r={2}   fill="#0a200c" />
          </g>
        ))}
        {/* Extra hole near digital headers */}
        <circle cx={390} cy={36} r={5.5} fill="none" stroke="#145818" strokeWidth={2} />
        <circle cx={390} cy={36} r={2}   fill="#0a200c" />

        {/* ── Circuit traces (decorative) ── */}
        {[72,94,138,160].map(tx => (
          <line key={tx} x1={tx} y1={26} x2={tx} y2={70} stroke="#145818" strokeWidth={1.5} />
        ))}
        {[436,458,480].map(tx => (
          <line key={tx} x1={tx} y1={26} x2={tx} y2={95} stroke="#145818" strokeWidth={1.5} />
        ))}
        {[72,94,116].map(bx => (
          <line key={bx} x1={bx} y1={454} x2={bx} y2={410} stroke="#145818" strokeWidth={1.5} />
        ))}

        {/* ── ATmega328P chip ── */}
        <rect x={205} y={165} width={200} height={150} rx={4}
          fill="#111" stroke="#3a3a3a" strokeWidth={1} />
        {/* Orientation notch (semicircle on left edge) */}
        <path d="M205 232 A 14 14 0 0 1 205 260 Z" fill="#0a0a0a" />
        {/* Pin 1 dot */}
        <circle cx={222} cy={182} r={4} fill="#0a0a0a" stroke="#333" strokeWidth={1} />
        {/* Chip text */}
        <text x={305} y={229} textAnchor="middle"
          fill="#4a4a4a" fontSize={11} fontFamily="'JetBrains Mono', monospace">ATMEGA</text>
        <text x={305} y={246} textAnchor="middle"
          fill="#666" fontSize={15} fontFamily="'JetBrains Mono', monospace" fontWeight={700}>328P</text>
        <text x={305} y={261} textAnchor="middle"
          fill="#3a3a3a" fontSize={8} fontFamily="monospace">Microchip Technology</text>

        {/* ── USB controller (ATmega16U2) ── */}
        <rect x={500} y={285} width={58} height={44} rx={2}
          fill="#111" stroke="#2a2a2a" strokeWidth={1} />
        <circle cx={506} cy={291} r={3} fill="#0a0a0a" stroke="#333" strokeWidth={0.5} />
        <text x={529} y={311} textAnchor="middle"
          fill="#2e2e2e" fontSize={7} fontFamily="monospace">16U2</text>

        {/* ── Crystal ── */}
        <rect x={172} y={208} width={14} height={38} rx={3}
          fill="#888" stroke="#bbb" strokeWidth={0.5} />

        {/* ── Reset button ── */}
        <circle cx={168} cy={110} r={11} fill="#cc2222" stroke="#991111" strokeWidth={2} />
        <circle cx={168} cy={110} r={5}  fill="#dd5555" opacity={0.5} />
        <text x={190} y={114} fill="#b8b8a0" fontSize={7} fontFamily="monospace">RESET</text>

        {/* ── Power LED (always green when running) ── */}
        <ellipse cx={100} cy={110} rx={4} ry={5}
          fill={isPowered ? "#00ff55" : "#1a3a1a"}
          stroke={isPowered ? "#007722" : "#0a180a"} strokeWidth={0.5}
          style={isPowered ? { filter: "drop-shadow(0 0 5px #00ff55)" } : {}} />
        <text x={100} y={124} textAnchor="middle"
          fill="#8a9a8a" fontSize={6.5} fontFamily="monospace">PWR</text>

        {/* ── D13 built-in LED ── */}
        <ellipse cx={436} cy={110} rx={4} ry={5}
          fill={d13 ? "#ffaa00" : "#2a1a00"}
          stroke={d13 ? "#885500" : "#110800"} strokeWidth={0.5}
          style={d13 ? { filter: "drop-shadow(0 0 6px #ffaa00)" } : {}} />
        <text x={436} y={124} textAnchor="middle"
          fill="#888" fontSize={6.5} fontFamily="monospace">L</text>

        {/* ── ICSP header (2×3) between power and digital groups ── */}
        <g transform="translate(268, 30)">
          {[0,1,2].flatMap(col => [0,1].map(row => (
            <circle key={`${col}-${row}`}
              cx={col * 10 + 5} cy={row * 10 + 5} r={3}
              fill="#c8a34a" stroke="#165618" strokeWidth={1} />
          )))}
          <text x={15} y={32} textAnchor="middle"
            fill="#668866" fontSize={6} fontFamily="monospace">ICSP</text>
        </g>

        {/* ── Board silkscreen watermarks ── */}
        <text x={280} y={148} textAnchor="middle"
          fill="rgba(180,220,180,0.1)" fontSize={34}
          fontFamily="'Arial Black', sans-serif" fontWeight={900} letterSpacing={6}>
          ARDUINO
        </text>
        <text x={280} y={378} textAnchor="middle"
          fill="rgba(180,220,180,0.08)" fontSize={38}
          fontFamily="'Arial Black', sans-serif" fontWeight={900} letterSpacing={10}>
          UNO
        </text>

        {/* ── Header silkscreen labels ── */}
        <text x={138} y={40} textAnchor="middle"
          fill="rgba(200,220,180,0.5)" fontSize={6.5} fontFamily="monospace">POWER</text>
        <text x={460} y={40} textAnchor="middle"
          fill="rgba(200,220,180,0.5)" fontSize={6.5} fontFamily="monospace">DIGITAL PWM~</text>
        <text x={127} y={450} textAnchor="middle"
          fill="rgba(200,220,180,0.5)" fontSize={6.5} fontFamily="monospace">ANALOG IN</text>
        <text x={425} y={450} textAnchor="middle"
          fill="rgba(200,220,180,0.5)" fontSize={6.5} fontFamily="monospace">DIGITAL</text>

        {/* ── Pin pads — static (power/special) ── */}
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
