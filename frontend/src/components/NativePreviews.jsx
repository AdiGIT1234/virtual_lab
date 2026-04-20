/* eslint-disable react-refresh/only-export-components */
import React from "react";

const createPreview = (PreviewComponent) => (props) => (
  <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} {...props}>
    {React.createElement(PreviewComponent)}
  </svg>
);

// ── Shared helpers ─────────────────────────────────────────────────────────

const MountingHole = ({ cx, cy }) => (
  <>
    <circle cx={cx} cy={cy} r={4} fill="#020617" />
    <circle cx={cx} cy={cy} r={2.5} fill="none" stroke="#334155" strokeWidth={1} />
  </>
);

const PinHeader = ({ x, y, count, vertical = false, color = "#d4a373" }) =>
  Array.from({ length: count }).map((_, i) => (
    <rect
      key={i}
      x={vertical ? x : x + i * 7}
      y={vertical ? y + i * 7 : y}
      width={vertical ? 5 : 5}
      height={vertical ? 5 : 5}
      rx={1}
      fill={color}
      stroke="#92400e"
      strokeWidth={0.5}
    />
  ));

const SolderPad = ({ x, y }) => (
  <circle cx={x} cy={y} r={2} fill="#d4a373" stroke="#92400e" strokeWidth={0.5} />
);

// ── High-fidelity component previews ──────────────────────────────────────

const UnoPreview = () => (
  <>
    <defs>
      <linearGradient id="unoBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#007a80" />
        <stop offset="100%" stopColor="#005457" />
      </linearGradient>
    </defs>
    <rect x="8" y="14" width="104" height="88" rx="4" fill="url(#unoBg)" />
    <rect x="8" y="14" width="104" height="88" rx="4" fill="none" stroke="#00b8bf" strokeWidth="1" opacity="0.5" />
    {/* USB connector */}
    <rect x="8" y="42" width="14" height="24" rx="2" fill="#1e293b" />
    <rect x="10" y="46" width="10" height="16" rx="1" fill="#374151" />
    {/* ATmega chip */}
    <rect x="38" y="38" width="36" height="28" rx="3" fill="#111827" stroke="#1e293b" strokeWidth="1" />
    <text x="56" y="55" fill="#94a3b8" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="monospace">ATmega</text>
    <text x="56" y="63" fill="#64748b" fontSize="5" textAnchor="middle" fontFamily="monospace">328P</text>
    {/* Power LED */}
    <circle cx="90" cy="30" r="3" fill="#22c55e" />
    <circle cx="90" cy="30" r="5" fill="#22c55e" opacity="0.2" />
    {/* Digital pins top */}
    {Array.from({ length: 14 }).map((_, i) => (
      <rect key={i} x={18 + i * 6} y="9" width="3" height="7" rx="0.5" fill="#cbd5e1" />
    ))}
    {/* Analog pins bottom-right */}
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={64 + i * 6} y="104" width="3" height="7" rx="0.5" fill="#cbd5e1" />
    ))}
    {/* Power pins */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={16 + i * 6} y="104" width="3" height="7" rx="0.5" fill="#fbbf24" />
    ))}
    <text x="56" y="80" fill="#00b8bf" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="'Inter',sans-serif" letterSpacing="2">UNO</text>
    <MountingHole cx={16} cy={18} />
    <MountingHole cx={104} cy={18} />
    <MountingHole cx={104} cy={98} />
  </>
);

const MegaPreview = () => (
  <>
    <defs>
      <linearGradient id="megaBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#007a80" />
        <stop offset="100%" stopColor="#004f52" />
      </linearGradient>
    </defs>
    <rect x="5" y="8" width="110" height="104" rx="4" fill="url(#megaBg)" />
    <rect x="5" y="8" width="110" height="104" rx="4" fill="none" stroke="#00b8bf" strokeWidth="1" opacity="0.4" />
    <rect x="5" y="30" width="14" height="24" rx="2" fill="#1e293b" />
    <rect x="7" y="34" width="10" height="16" rx="1" fill="#374151" />
    {/* ATmega2560 chip */}
    <rect x="32" y="30" width="44" height="44" rx="3" fill="#111827" stroke="#1e293b" strokeWidth="1.5" />
    <text x="54" y="54" fill="#94a3b8" fontSize="6" fontWeight="700" textAnchor="middle" fontFamily="monospace">ATmega</text>
    <text x="54" y="62" fill="#64748b" fontSize="5" textAnchor="middle" fontFamily="monospace">2560</text>
    {Array.from({ length: 18 }).map((_, i) => (
      <rect key={i} x={8 + i * 6} y="4" width="2.5" height="6" rx="0.5" fill="#cbd5e1" />
    ))}
    <text x="60" y="96" fill="#00b8bf" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="'Inter',sans-serif" letterSpacing="2">MEGA 2560</text>
    <circle cx="96" cy="22" r="3" fill="#22c55e" />
    <circle cx="96" cy="22" r="5" fill="#22c55e" opacity="0.15" />
    <MountingHole cx={14} cy={14} />
    <MountingHole cx={106} cy={14} />
  </>
);

const ESP32Preview = () => (
  <>
    <defs>
      <linearGradient id="esp32Bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    {/* PCB */}
    <rect x="22" y="8" width="76" height="104" rx="4" fill="url(#esp32Bg)" />
    <rect x="22" y="8" width="76" height="104" rx="4" fill="none" stroke="#334155" strokeWidth="1.5" />
    {/* Antenna section */}
    <rect x="34" y="8" width="52" height="28" rx="2" fill="#cbd5e1" />
    <rect x="40" y="12" width="40" height="20" rx="1" fill="#94a3b8" />
    {/* Antenna trace */}
    <path d="M 74 20 L 80 20 L 80 28" stroke="#475569" strokeWidth="1.5" fill="none" />
    {/* ESP32 chip */}
    <rect x="36" y="42" width="48" height="36" rx="3" fill="#111827" stroke="#00b8bf" strokeWidth="0.8" />
    <text x="60" y="60" fill="#00b8bf" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="monospace">ESP32</text>
    <text x="60" y="70" fill="#475569" fontSize="5" textAnchor="middle" fontFamily="monospace">WROOM-32</text>
    {/* WiFi/BT indicator */}
    <circle cx="90" cy="44" r="3" fill="#3b82f6" />
    <circle cx="90" cy="44" r="5" fill="#3b82f6" opacity="0.2" />
    {/* Left pins */}
    {Array.from({ length: 15 }).map((_, i) => (
      <rect key={`l${i}`} x="14" y={10 + i * 6.5} width="8" height="3" rx="0.5" fill="#fbbf24" />
    ))}
    {/* Right pins */}
    {Array.from({ length: 15 }).map((_, i) => (
      <rect key={`r${i}`} x="98" y={10 + i * 6.5} width="8" height="3" rx="0.5" fill="#fbbf24" />
    ))}
    {/* USB */}
    <rect x="46" y="102" width="28" height="10" rx="2" fill="#374151" />
    <rect x="50" y="104" width="20" height="6" rx="1" fill="#1e293b" />
    <MountingHole cx={30} cy={16} />
    <MountingHole cx={90} cy={16} />
  </>
);

const LCDPreview = () => (
  <>
    <defs>
      <linearGradient id="lcdPcb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      <linearGradient id="lcdScreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    {/* PCB */}
    <rect x="4" y="22" width="112" height="76" rx="3" fill="url(#lcdPcb)" />
    <rect x="4" y="22" width="112" height="76" rx="3" fill="none" stroke="#059669" strokeWidth="1" opacity="0.6" />
    {/* LCD glass */}
    <rect x="12" y="30" width="96" height="52" rx="2" fill="url(#lcdScreen)" opacity="0.85" />
    {/* Character cell rows — 2 rows × 16 chars */}
    {[0, 1].map(row =>
      Array.from({ length: 16 }).map((_, col) => (
        <rect key={`${row}-${col}`}
          x={14 + col * 5.8}
          y={36 + row * 18}
          width={4.8} height={11}
          rx={0.5}
          fill="#166534"
          opacity={0.35}
        />
      ))
    )}
    {/* Cursor blink */}
    <rect x="14" y="36" width="4.8" height="11" rx="0.5" fill="#14532d" opacity="0.7" />
    {/* Label */}
    <text x="60" y="87" fill="#a7f3d0" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="monospace">LCD 1602 · 16×2</text>
    {/* Pin header */}
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={i} x={10 + i * 6.2} y="98" width="4" height="8" rx="0.5" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
    ))}
    <MountingHole cx={10} cy={26} />
    <MountingHole cx={110} cy={26} />
    <MountingHole cx={10} cy={94} />
    <MountingHole cx={110} cy={94} />
  </>
);

const OLEDPreview = () => (
  <>
    <defs>
      <linearGradient id="oledPcb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
    {/* PCB */}
    <rect x="14" y="12" width="92" height="96" rx="4" fill="url(#oledPcb)" />
    <rect x="14" y="12" width="92" height="96" rx="4" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    {/* Screen glass */}
    <rect x="18" y="22" width="84" height="56" rx="2" fill="#020617" />
    {/* Pixel scan-lines simulation */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={20} y={24 + i * 6.5} width={80} height={3} rx={0.5} fill="#00f2ff" opacity={i % 3 === 0 ? 0.18 : 0.08} />
    ))}
    {/* OLED "glow" text */}
    <text x="60" y="52" fill="#00f2ff" fontSize="14" fontWeight="800" textAnchor="middle" fontFamily="monospace" opacity="0.7">OLED</text>
    <text x="60" y="64" fill="#38bdf8" fontSize="7" textAnchor="middle" fontFamily="monospace" opacity="0.5">128 × 64 px</text>
    {/* Label below screen */}
    <text x="60" y="92" fill="#93c5fd" fontSize="7" fontWeight="600" textAnchor="middle" fontFamily="monospace">SSD1306 · I²C</text>
    {/* 4-pin header */}
    {["VCC","GND","SCL","SDA"].map((_, i) => (
      <rect key={i} x={28 + i * 16} y="100" width="10" height="7" rx="1" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
    ))}
    <MountingHole cx={20} cy={18} />
    <MountingHole cx={100} cy={18} />
    <MountingHole cx={20} cy={104} />
    <MountingHole cx={100} cy={104} />
  </>
);

const ILI9341Preview = () => (
  <>
    <defs>
      <linearGradient id="tftPcb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#991b1b" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
      <linearGradient id="tftScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="25%" stopColor="#047857" />
        <stop offset="50%" stopColor="#b45309" />
        <stop offset="75%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
    </defs>
    <rect x="10" y="8" width="100" height="104" rx="4" fill="url(#tftPcb)" />
    <rect x="10" y="8" width="100" height="104" rx="4" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
    {/* Screen */}
    <rect x="16" y="14" width="88" height="74" rx="2" fill="url(#tftScreen)" opacity="0.9" />
    {/* Scan lines */}
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={16} y1={14 + i * 7.5} x2={104} y2={14 + i * 7.5} stroke="black" strokeWidth={0.5} opacity={0.2} />
    ))}
    <text x="60" y="55" fill="white" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="'Inter',sans-serif" opacity="0.8">TFT</text>
    <text x="60" y="68" fill="white" fontSize="7" textAnchor="middle" opacity="0.6">240 × 320 · RGB565</text>
    <text x="60" y="96" fill="#fca5a5" fontSize="6.5" fontWeight="600" textAnchor="middle" fontFamily="monospace">ILI9341 · SPI</text>
    {/* 8-pin header left */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={22 + i * 10} y="102" width="7" height="8" rx="1" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
    ))}
    <MountingHole cx={18} cy={14} />
    <MountingHole cx={102} cy={14} />
  </>
);

const SevenSegmentPreview = () => {
  const seg = (d, on) => (
    <path d={d} fill={on ? "#ef4444" : "#1e293b"} stroke="#111" strokeWidth="0.5" />
  );
  return (
    <>
      <rect x="28" y="14" width="64" height="92" rx="4" fill="#111827" stroke="#1e293b" strokeWidth="1.5" />
      {/* Segments: a=top, b=top-right, c=bot-right, d=bot, e=bot-left, f=top-left, g=mid */}
      {seg("M42,22 L70,22 L67,26 L45,26 Z", true)}   {/* a - top */}
      {seg("M72,24 L76,44 L72,47 L68,27 Z", false)}  {/* b - top-right */}
      {seg("M74,50 L70,70 L66,66 L70,46 Z", true)}   {/* c - bot-right */}
      {seg("M68,72 L40,72 L43,68 L65,68 Z", false)}  {/* d - bottom */}
      {seg("M44,70 L40,50 L44,47 L48,66 Z", true)}   {/* e - bot-left */}
      {seg("M42,46 L46,26 L50,29 L46,47 Z", true)}   {/* f - top-left */}
      {seg("M46,49 L68,49 L66,53 L44,53 Z", true)}   {/* g - middle */}
      {/* Decimal point */}
      <circle cx="77" cy="70" r="3.5" fill="#ef4444" />
      {/* Glow */}
      <circle cx="77" cy="70" r="6" fill="#ef4444" opacity="0.15" />
      {/* Pins bottom */}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={34 + i * 8} y="106" width="5" height="10" rx="0.5" fill="#cbd5e1" />
      ))}
    </>
  );
};

const DHT22Preview = () => (
  <>
    <defs>
      <linearGradient id="dhtBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
    {/* Housing */}
    <rect x="30" y="14" width="60" height="68" rx="6" fill="url(#dhtBg)" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Mesh holes (ventilation grid) */}
    {[0,1,2,3,4].map(row =>
      [0,1,2,3,4].map(col => (
        <circle key={`${row}-${col}`} cx={36 + col * 10} cy={22 + row * 10} r={1.5} fill="#cbd5e1" />
      ))
    )}
    {/* Label */}
    <text x="60" y="65" fill="#0ea5e9" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="monospace">DHT22</text>
    {/* Temp/humidity icons */}
    <text x="44" y="52" fontSize="12" textAnchor="middle">🌡</text>
    <text x="76" y="52" fontSize="12" textAnchor="middle">💧</text>
    {/* 3 pins */}
    {[0,1,2].map(i => (
      <rect key={i} x={36 + i * 16} y="82" width="8" height="22" rx="1" fill="#94a3b8" />
    ))}
  </>
);

const PIRPreview = () => (
  <>
    <defs>
      <radialGradient id="pirLens" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="60%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </radialGradient>
    </defs>
    {/* PCB */}
    <rect x="20" y="22" width="80" height="68" rx="4" fill="#166534" stroke="#15803d" strokeWidth="1" />
    {/* Fresnel lens dome */}
    <circle cx="60" cy="52" r="28" fill="url(#pirLens)" stroke="#94a3b8" strokeWidth="1.5" />
    {/* Lens facets */}
    {[0,1,2,3].map(i => (
      <circle key={i} cx="60" cy="52" r={8 + i * 5.5} fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.5" />
    ))}
    {[0,1,2,3].map(i => (
      <line key={i} x1="60" y1="24" x2="60" y2="80" stroke="#94a3b8" strokeWidth="0.5" opacity="0.4"
        transform={`rotate(${i * 45} 60 52)`} />
    ))}
    <circle cx="60" cy="52" r="4" fill="#94a3b8" />
    {/* Trimpots */}
    <circle cx="32" cy="70" r="6" fill="#0f172a" stroke="#374151" strokeWidth="1" />
    <circle cx="32" cy="70" r="2" fill="#374155" />
    <circle cx="88" cy="70" r="6" fill="#0f172a" stroke="#374151" strokeWidth="1" />
    <circle cx="88" cy="70" r="2" fill="#374155" />
    {/* Label */}
    <text x="60" y="106" fill="#94a3b8" fontSize="7" textAnchor="middle">PIR Motion</text>
    {["VCC","OUT","GND"].map((_, i) => (
      <rect key={i} x={34 + i * 18} y="88" width="8" height="20" rx="1" fill="#94a3b8" />
    ))}
  </>
);

const HCSR04Preview = () => (
  <>
    <defs>
      <radialGradient id="transducer" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </radialGradient>
    </defs>
    {/* PCB */}
    <rect x="8" y="30" width="104" height="54" rx="4" fill="#2563eb" stroke="#3b82f6" strokeWidth="1" />
    {/* Transducer cylinders */}
    <ellipse cx="32" cy="57" rx="18" ry="18" fill="url(#transducer)" stroke="#64748b" strokeWidth="1.5" />
    <ellipse cx="32" cy="57" rx="8" ry="8" fill="#475569" />
    <ellipse cx="32" cy="57" rx="3" ry="3" fill="#94a3b8" />
    <ellipse cx="88" cy="57" rx="18" ry="18" fill="url(#transducer)" stroke="#64748b" strokeWidth="1.5" />
    <ellipse cx="88" cy="57" rx="8" ry="8" fill="#475569" />
    <ellipse cx="88" cy="57" rx="3" ry="3" fill="#94a3b8" />
    {/* Sonic wave rings */}
    <path d="M44 42 Q52 57 44 72" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
    <path d="M47 46 Q53 57 47 68" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
    <path d="M76 42 Q68 57 76 72" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
    <path d="M73 46 Q67 57 73 68" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
    {/* Label */}
    <text x="60" y="25" fill="#93c5fd" fontSize="8" fontWeight="700" textAnchor="middle">HC-SR04</text>
    {["VCC","TRIG","ECHO","GND"].map((_, i) => (
      <rect key={i} x={24 + i * 19} y="84" width="9" height="20" rx="1" fill="#94a3b8" />
    ))}
  </>
);

const ServoPreview = () => (
  <>
    <defs>
      <linearGradient id="servoBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Body */}
    <rect x="30" y="20" width="60" height="70" rx="6" fill="url(#servoBg)" />
    <rect x="22" y="36" width="76" height="36" rx="4" fill="#1e40af" />
    {/* Servo hub */}
    <circle cx="60" cy="34" r="16" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
    <circle cx="60" cy="34" r="8" fill="#f8fafc" />
    <circle cx="60" cy="34" r="3" fill="#94a3b8" />
    {/* Arm */}
    <rect x="58" y="14" width="22" height="8" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"
      transform="rotate(-20 60 34)" />
    <circle cx="80" cy="26" r="3.5" fill="#cbd5e1" transform="rotate(-20 60 34)" />
    {/* Screw holes */}
    <circle cx="36" cy="22" r="4" fill="#1e3a8a" />
    <circle cx="84" cy="22" r="4" fill="#1e3a8a" />
    {/* Wires */}
    <rect x="51" y="90" width="5" height="20" rx="1" fill="#f8fafc" />
    <rect x="58" y="90" width="5" height="20" rx="1" fill="#ef4444" />
    <rect x="65" y="90" width="5" height="20" rx="1" fill="#111827" />
    <text x="60" y="80" fill="white" fontSize="8" fontWeight="700" textAnchor="middle">SERVO</text>
  </>
);

const LedPreview = () => (
  <>
    <defs>
      <radialGradient id="ledGlow" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Glow halo */}
    <circle cx="60" cy="52" r="38" fill="url(#ledGlow)" />
    {/* LED body — dome */}
    <path d="M38,56 A22,22 0 0,1 82,56 L82,70 L38,70 Z" fill="#ef4444" opacity="0.92" />
    {/* Highlight */}
    <ellipse cx="52" cy="52" rx="7" ry="9" fill="white" opacity="0.3" transform="rotate(-15 52 52)" />
    {/* Flat */}
    <rect x="34" y="70" width="52" height="8" rx="2" fill="#7f1d1d" />
    {/* Leads */}
    <rect x="50" y="78" width="5" height="30" rx="1" fill="#94a3b8" />   {/* anode - longer */}
    <rect x="66" y="78" width="5" height="24" rx="1" fill="#94a3b8" />  {/* cathode */}
    {/* Emission rays */}
    <path d="M52,44 L42,32" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M62,42 L60,28" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M70,46 L80,36" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </>
);

const ResistorPreview = () => (
  <>
    {/* Leads */}
    <line x1="14" y1="60" x2="36" y2="60" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="60" x2="106" y2="60" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
    {/* Body */}
    <rect x="34" y="48" width="52" height="24" rx="8" fill="#d97706" />
    {/* Color bands */}
    <rect x="42" y="48" width="5" height="24" rx="1" fill="#111827" />  {/* 1st: black */}
    <rect x="51" y="48" width="5" height="24" rx="1" fill="#d97706" opacity="0" />
    <rect x="54" y="48" width="5" height="24" rx="1" fill="#ef4444" />  {/* 2nd: red */}
    <rect x="63" y="48" width="5" height="24" rx="1" fill="#f59e0b" /> {/* 3rd: orange */}
    <rect x="74" y="48" width="5" height="24" rx="1" fill="#f8fafc" /> {/* tolerance: silver */}
    {/* Highlight */}
    <rect x="34" y="49" width="52" height="6" rx="3" fill="white" opacity="0.15" />
  </>
);

const CapacitorPreview = () => (
  <>
    <defs>
      <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
    {/* Body */}
    <ellipse cx="60" cy="55" rx="26" ry="32" fill="url(#capGrad)" />
    {/* Polarity stripe */}
    <rect x="34" y="30" width="14" height="50" rx="7" fill="#0c4a6e" />
    <text x="41" y="58" fill="white" fontSize="18" fontWeight="900" textAnchor="middle">−</text>
    {/* Top cap */}
    <ellipse cx="60" cy="23" rx="26" ry="6" fill="#0ea5e9" opacity="0.7" />
    {/* Highlight */}
    <ellipse cx="70" cy="38" rx="8" ry="14" fill="white" opacity="0.1" transform="rotate(10 70 38)" />
    {/* Lead markings */}
    <text x="75" y="54" fill="white" fontSize="8" fontWeight="700">10µF</text>
    <text x="75" y="63" fill="white" fontSize="7" opacity="0.7">50V</text>
    {/* Leads */}
    <rect x="50" y="87" width="5" height="24" rx="1" fill="#94a3b8" />
    <rect x="65" y="87" width="5" height="20" rx="1" fill="#94a3b8" />
  </>
);

const PotentiometerPreview = () => (
  <>
    <defs>
      <radialGradient id="potKnob" cx="45%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#334155" />
      </radialGradient>
    </defs>
    {/* Body */}
    <rect x="28" y="22" width="64" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
    {/* Knob */}
    <circle cx="60" cy="50" r="22" fill="url(#potKnob)" stroke="#475569" strokeWidth="1.5" />
    <circle cx="60" cy="50" r="14" fill="#0f172a" />
    <circle cx="60" cy="50" r="5" fill="#475569" />
    {/* Indicator line */}
    <line x1="60" y1="50" x2="60" y2="30" stroke="#00f2ff" strokeWidth="3" strokeLinecap="round"
      transform="rotate(-45 60 50)" />
    {/* Scale marks */}
    {Array.from({ length: 11 }).map((_, i) => {
      const angle = -135 + i * 27;
      const rad = angle * Math.PI / 180;
      const r1 = 20, r2 = 24;
      return (
        <line key={i}
          x1={60 + r1 * Math.cos(rad)} y1={50 + r1 * Math.sin(rad)}
          x2={60 + r2 * Math.cos(rad)} y2={50 + r2 * Math.sin(rad)}
          stroke="#475569" strokeWidth={1} />
      );
    })}
    {/* Leads */}
    {[40, 60, 80].map((x, i) => (
      <rect key={i} x={x - 2} y="82" width="4" height="22" rx="0.5" fill="#94a3b8" />
    ))}
  </>
);

const SlidePotPreview = () => (
  <>
    <rect x="14" y="38" width="92" height="36" rx="10" fill="#111827" stroke="#334155" strokeWidth="1.5" />
    <rect x="24" y="52" width="72" height="8" rx="4" fill="#1e293b" stroke="#374151" strokeWidth="1" />
    {/* Track marks */}
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={26 + i * 9} y="54" width="1.5" height="4" rx="0.5" fill="#475569" />
    ))}
    {/* Slider thumb */}
    <rect x="46" y="30" width="28" height="52" rx="8" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
    <rect x="51" y="38" width="18" height="10" rx="3" fill="#64748b" />
    {/* Leads */}
    {[26, 60, 94].map((x, i) => (
      <rect key={i} x={x - 2} y="74" width="4" height="22" rx="0.5" fill="#94a3b8" />
    ))}
  </>
);

const BreadboardPreview = () => (
  <>
    <rect x="4" y="14" width="112" height="92" rx="4" fill="#f8fafc" />
    <rect x="4" y="14" width="112" height="92" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Power rails */}
    <rect x="4" y="22" width="112" height="8" rx="2" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5" opacity="0.6" />
    <rect x="4" y="30" width="112" height="8" rx="2" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" opacity="0.6" />
    <rect x="4" y="82" width="112" height="8" rx="2" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" opacity="0.6" />
    <rect x="4" y="90" width="112" height="8" rx="2" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5" opacity="0.6" />
    {/* Tie-point dots */}
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 14 }).map((_, c) => (
        <circle key={`${r}-${c}`} cx={10 + c * 7.5} cy={44 + r * 7} r="1.8" fill="#94a3b8" opacity="0.7" />
      ))
    )}
    {/* Power rail dots */}
    {Array.from({ length: 14 }).map((_, c) => (
      <React.Fragment key={c}>
        <circle cx={10 + c * 7.5} cy="26" r="1.5" fill="#ef4444" opacity="0.5" />
        <circle cx={10 + c * 7.5} cy="34" r="1.5" fill="#3b82f6" opacity="0.5" />
        <circle cx={10 + c * 7.5} cy="86" r="1.5" fill="#3b82f6" opacity="0.5" />
        <circle cx={10 + c * 7.5} cy="94" r="1.5" fill="#ef4444" opacity="0.5" />
      </React.Fragment>
    ))}
    {/* Center gap */}
    <rect x="4" y="69" width="112" height="5" rx="1" fill="#e2e8f0" />
  </>
);

const PushbuttonPreview = () => (
  <>
    <defs>
      <radialGradient id="btnGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="55" r="34" fill="url(#btnGlow)" />
    {/* Base */}
    <rect x="28" y="28" width="64" height="64" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
    {/* Button top */}
    <circle cx="60" cy="60" r="22" fill="#dc2626" stroke="#ef4444" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="14" fill="#ef4444" />
    {/* Highlight */}
    <ellipse cx="53" cy="52" rx="7" ry="5" fill="white" opacity="0.25" transform="rotate(-20 53 52)" />
    {/* Pins */}
    <rect x="20" y="38" width="8" height="6" rx="1" fill="#94a3b8" />
    <rect x="20" y="64" width="8" height="6" rx="1" fill="#94a3b8" />
    <rect x="92" y="38" width="8" height="6" rx="1" fill="#94a3b8" />
    <rect x="92" y="64" width="8" height="6" rx="1" fill="#94a3b8" />
  </>
);

const BuzzerPreview = () => (
  <>
    <defs>
      <radialGradient id="buzzerGrad" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
    </defs>
    {/* Body */}
    <circle cx="60" cy="54" r="34" fill="url(#buzzerGrad)" stroke="#334155" strokeWidth="1.5" />
    <circle cx="60" cy="54" r="18" fill="#111827" stroke="#1e293b" strokeWidth="1" />
    <circle cx="60" cy="54" r="6" fill="#334155" />
    {/* Vent holes */}
    {[0,1,2,3,4,5].map(i => {
      const angle = i * 60 * Math.PI / 180;
      return <circle key={i} cx={60 + 26 * Math.cos(angle)} cy={54 + 26 * Math.sin(angle)} r="3" fill="#0f172a" />;
    })}
    {/* Plus sign */}
    <text x="44" y="35" fill="#94a3b8" fontSize="14" fontWeight="700">+</text>
    {/* Sound waves */}
    <path d="M84 44 Q92 54 84 64" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
    <path d="M88 40 Q98 54 88 68" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
    {/* Leads */}
    <rect x="50" y="88" width="5" height="22" rx="1" fill="#94a3b8" />
    <rect x="65" y="88" width="5" height="18" rx="1" fill="#94a3b8" />
  </>
);

const KeypadPreview = () => (
  <>
    <rect x="16" y="6" width="88" height="108" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
    {[1,2,3,4].map(row =>
      [1,2,3,4].map(col => (
        <rect key={`${row}-${col}`}
          x={20 + (col-1) * 20}
          y={10 + (row-1) * 20}
          width={16} height={14} rx={3}
          fill={row === 1 ? "#334155" : "#1e293b"}
          stroke="#374151" strokeWidth={0.5}
        />
      ))
    )}
    {/* Key labels */}
    {["1","2","3","A","4","5","6","B","7","8","9","C","*","0","#","D"].map((k, i) => (
      <text key={i} x={28 + (i % 4) * 20} y={22 + Math.floor(i / 4) * 20}
        fill="#94a3b8" fontSize="7" fontWeight="700" textAnchor="middle">{k}</text>
    ))}
    {/* 8 pin ribbon */}
    <rect x="26" y="90" width="68" height="8" rx="2" fill="#cbd5e1" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={28 + i * 8} y="98" width="4" height="16" rx="0.5" fill="#94a3b8" />
    ))}
  </>
);

const NeopixelPreview = () => {
  const ring = Array.from({ length: 12 });
  const colors = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308","#22c55e"];
  return (
    <>
      <circle cx="60" cy="56" r="40" fill="#1e293b" />
      <circle cx="60" cy="56" r="24" fill="#0f172a" />
      {ring.map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 60 + 33 * Math.cos(angle);
        const y = 56 + 33 * Math.sin(angle);
        return (
          <React.Fragment key={i}>
            <circle cx={x} cy={y} r={5} fill={colors[i]} opacity={0.9} />
            <circle cx={x} cy={y} r={8} fill={colors[i]} opacity={0.15} />
          </React.Fragment>
        );
      })}
      {/* Center label */}
      <text x="60" y="60" fill="#94a3b8" fontSize="7" fontWeight="700" textAnchor="middle">WS2812B</text>
      {["5V","DIN","GND"].map((_, i) => (
        <rect key={i} x={36 + i * 18} y="100" width="10" height="12" rx="1" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
      ))}
    </>
  );
};

const createDipIcPreview = (label, pinsPerSide, accent = "#22d3ee") => () => (
  <>
    <rect x="28" y="18" width="64" height="84" rx="8" fill="#111827" stroke="#334155" strokeWidth="2" />
    {/* Notch */}
    <rect x="51" y="18" width="18" height="8" rx="8" fill="#374151" />
    {/* Chip label area */}
    <rect x="36" y="32" width="48" height="22" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
    {Array.from({ length: pinsPerSide }).map((_, i) => (
      <React.Fragment key={i}>
        <rect x="18" y={28 + i * (56 / Math.max(pinsPerSide - 1, 1))} width="10" height="4" rx="1" fill="#dbe4ef" />
        <rect x="92" y={28 + i * (56 / Math.max(pinsPerSide - 1, 1))} width="10" height="4" rx="1" fill="#dbe4ef" />
      </React.Fragment>
    ))}
    <text x="60" y="72" fill="#f8fafc" fontSize="11" fontWeight="700" textAnchor="middle">{label}</text>
    <text x="60" y="86" fill={accent} fontSize="8" fontWeight="700" textAnchor="middle">DIP IC</text>
  </>
);

const createTo92Preview = (label, accent) => () => (
  <>
    <defs>
      <linearGradient id={`to92_${label}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#1f2937" />
      </linearGradient>
    </defs>
    <path d="M34 34 C34 22, 44 16, 60 16 C76 16, 86 22, 86 34 V66 H34 Z"
      fill={`url(#to92_${label})`} stroke="#475569" strokeWidth="2" />
    <path d="M41 32 H79" stroke="#334155" strokeWidth="2" />
    <text x="60" y="46" fill="#f8fafc" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
    <text x="60" y="59" fill={accent} fontSize="9" fontWeight="600" textAnchor="middle">BJT</text>
    {/* Leads */}
    <rect x="46" y="66" width="6" height="38" rx="2" fill="#dbe4ef" />
    <rect x="57" y="66" width="6" height="42" rx="2" fill="#dbe4ef" />
    <rect x="68" y="66" width="6" height="38" rx="2" fill="#dbe4ef" />
    {/* Lead labels */}
    <text x="49" y="114" fill={accent} fontSize="6" textAnchor="middle">B</text>
    <text x="60" y="118" fill={accent} fontSize="6" textAnchor="middle">C</text>
    <text x="71" y="114" fill={accent} fontSize="6" textAnchor="middle">E</text>
    {/* Accent band */}
    <rect x="34" y="58" width="52" height="8" fill={accent} opacity="0.25" />
  </>
);

const SerialMonitorPreview = () => (
  <>
    <rect x="12" y="14" width="96" height="82" rx="10" fill="#07121f" stroke="#0ea5e9" strokeWidth="2" />
    <rect x="18" y="20" width="84" height="56" rx="6" fill="#020617" />
    {/* Text lines */}
    {[0, 1, 2, 3].map(i => (
      <React.Fragment key={i}>
        <rect x="22" y={28 + i * 11} width={i === 3 ? 36 : 72} height="7" rx="2" fill="#22d3ee" opacity={0.7 - i * 0.15} />
      </React.Fragment>
    ))}
    {/* Cursor */}
    <rect x="22" y="71" width="6" height="8" rx="1" fill="#22d3ee" opacity="0.8" />
    {/* Status bar */}
    <rect x="12" y="96" width="96" height="18" rx="6" fill="#0c2536" />
    <circle cx="28" cy="105" r="4" fill="#22c55e" />
    <text x="38" y="108" fill="#94a3b8" fontSize="7">9600 baud</text>
  </>
);

const LogicAnalyzerPreview = () => (
  <>
    <rect x="10" y="18" width="100" height="72" rx="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
    {/* Channel labels */}
    {["CH1","CH2","CH3"].map((ch, i) => (
      <text key={ch} x="20" y={33 + i * 17} fill="#8b5cf6" fontSize="6" fontWeight="700">{ch}</text>
    ))}
    {/* Waveforms */}
    <path d="M32 32 H42 V26 H52 V32 H62 V26 H72 V32 H82 V26 H92 V32 H100" stroke="#22d3ee" strokeWidth="2" fill="none" strokeLinecap="square" />
    <path d="M32 49 H47 V43 H57 V49 H77 V43 H87 V49 H100" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="square" />
    <path d="M32 66 H40 V60 H45 V66 H60 V60 H70 V66 H85 V60 H95 V66 H100" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="square" />
    {/* Pins */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={18 + i * 11} y="96" width="6" height="16" rx="1" fill="#cbd5e1" />
    ))}
  </>
);

const CustomChipPreview = () => (
  <>
    <rect x="22" y="18" width="76" height="84" rx="8" fill="#111827" stroke="#14b8a6" strokeWidth="2" />
    {Array.from({ length: 6 }).map((_, i) => (
      <React.Fragment key={i}>
        <rect x="12" y={28 + i * 11} width="10" height="5" rx="1" fill="#2dd4bf" />
        <rect x="98" y={28 + i * 11} width="10" height="5" rx="1" fill="#2dd4bf" />
      </React.Fragment>
    ))}
    <rect x="30" y="30" width="60" height="32" rx="4" fill="#0f172a" stroke="#134e4a" strokeWidth="1" />
    <path d="M36 42 H84 M36 54 H72 M36 66 H84" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <text x="60" y="85" fill="#99f6e4" fontSize="9" fontWeight="700" textAnchor="middle">VLAB</text>
    <text x="60" y="96" fill="#2dd4bf" fontSize="7" textAnchor="middle">Custom IC</text>
  </>
);

const WasmIcPreview = () => (
  <>
    <rect x="18" y="14" width="84" height="88" rx="10" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" />
    <path d="M34 30 L44 78 L60 48 L76 78 L86 30" stroke="#f8fafc" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <text x="60" y="96" fill="#f59e0b" fontSize="8" fontWeight="700" textAnchor="middle">WASM IC</text>
    <rect x="30" y="98" width="60" height="6" rx="3" fill="#374151" />
  </>
);

const MultimeterPreview = () => (
  <>
    <rect x="26" y="10" width="68" height="100" rx="12" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
    <rect x="34" y="20" width="52" height="28" rx="4" fill="#111827" />
    <text x="60" y="39" fill="#86efac" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="monospace">5.00V</text>
    {/* Selector dial */}
    <circle cx="60" cy="72" r="18" fill="#1f2937" stroke="#374151" strokeWidth="2" />
    {/* Dial tick marks */}
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <line key={i} x1={60 + 14 * Math.cos(a)} y1={72 + 14 * Math.sin(a)} x2={60 + 17 * Math.cos(a)} y2={72 + 17 * Math.sin(a)} stroke="#475569" strokeWidth="1.5" />;
    })}
    <line x1="60" y1="72" x2="70" y2="64" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="60" cy="72" r="4" fill="#374151" />
    <circle cx="42" cy="100" r="5" fill="#111827" stroke="#374151" strokeWidth="1.5" />
    <circle cx="78" cy="100" r="5" fill="#dc2626" stroke="#374151" strokeWidth="1.5" />
  </>
);

const JumperWiresPreview = () => (
  <>
    {[
      { from: [18,92], to: [54,20], color: "#ef4444" },
      { from: [28,96], to: [76,24], color: "#eab308" },
      { from: [42,100], to: [96,36], color: "#3b82f6" },
      { from: [56,98], to: [108,48], color: "#22c55e" },
    ].map(({ from, to, color }, i) => (
      <React.Fragment key={i}>
        <path d={`M ${from[0]} ${from[1]} C ${from[0]+10} ${(from[1]+to[1])/2}, ${to[0]-10} ${(from[1]+to[1])/2}, ${to[0]} ${to[1]}`}
          stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x={from[0]-5} y={from[1]-3} width="10" height="12" rx="2" fill="#e5e7eb" />
        <rect x={to[0]-5} y={to[1]-3} width="10" height="12" rx="2" fill="#e5e7eb" />
      </React.Fragment>
    ))}
  </>
);

const VccNodePreview = () => (
  <>
    <circle cx="60" cy="60" r="36" fill="#f59e0b" opacity="0.12" />
    <circle cx="60" cy="60" r="24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
    <path d="M60 36 V84 M44 60 H76" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
    <text x="60" y="108" fill="#fbbf24" fontSize="9" fontWeight="700" textAnchor="middle">VCC / 5V</text>
  </>
);

const GroundNodePreview = () => (
  <>
    <circle cx="60" cy="42" r="10" fill="#22d3ee" stroke="#0891b2" strokeWidth="1.5" />
    <path d="M60 52 V70" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
    <path d="M40 70 H80" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
    <path d="M46 80 H74" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
    <path d="M52 90 H68" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
    <text x="60" y="112" fill="#94a3b8" fontSize="9" fontWeight="700" textAnchor="middle">GND</text>
  </>
);

// Procedural sensor/module previews (used for less common components) ────────

const createSensorModulePreview = (label, color = "#0ea5e9", shortForm, iconType = "chip") => (props) => {
  const primaryLine = shortForm || label.split(" ")[0];
  const secondaryLine = shortForm ? label : label.split(" ").slice(1).join(" ");

  const renderIcon = () => {
    switch (iconType) {
      case 'mic': return (
        <g transform="translate(48, 26)">
          <rect width="24" height="28" rx="12" fill="#475569" />
          <rect x="4" y="4" width="16" height="20" rx="8" fill="#1e293b" />
          <path d="M12 0 L12 -6" stroke="#94a3b8" strokeWidth="2" />
          <path d="M6 2 Q0 2 0 8" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          <path d="M18 2 Q24 2 24 8" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        </g>
      );
      case 'flame': return (
        <g transform="translate(48, 24)">
          <path d="M12 2 C12 2, 4 10, 4 17 C4 21.5 7.6 24 12 24 C16.4 24 20 21.5 20 17 C20 10, 12 2, 12 2 Z" fill="#f97316" />
          <path d="M12 8 C12 8, 8 13, 8 17 C8 19.2 9.8 21 12 21 C14.2 21 16 19.2 16 17 C16 13, 12 8, 12 8 Z" fill="#fbbf24" />
          <circle cx="12" cy="19" r="2.5" fill="#fed7aa" />
        </g>
      );
      case 'heart': return (
        <g transform="translate(48, 26)">
          <path d="M12 22 L10 20 C4.8 15 1 11.6 1 7.5 C1 4.4 3.4 2 6.5 2 C8.2 2 9.9 2.8 11 4.1 L12 5.5 L13 4.1 C14.1 2.8 15.8 2 17.5 2 C20.6 2 23 4.4 23 7.5 C23 11.6 19.2 15 14 20 L12 22 Z" fill="#ef4444" />
          <path d="M2 12 H8 L10 8 L13 17 L15 12 H22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
        </g>
      );
      case 'gas': return (
        <g transform="translate(46, 24)">
          <circle cx="14" cy="14" r="14" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
          <rect x="8" y="8" width="12" height="12" rx="2" fill="#1e293b" />
          {[0,1,2,3].map(i => (
            <rect key={i} x={8} y={8 + i * 3.5} width="12" height="1.5" rx="0.5" fill="#475569" />
          ))}
        </g>
      );
      case 'imu': return (
        <g transform="translate(46, 26)">
          <rect x="2" y="2" width="24" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <path d="M4 14 H24 M14 4 V24" stroke="#0ea5e9" strokeWidth="2" opacity="0.8" />
          <circle cx="14" cy="14" r="3" fill="#0ea5e9" />
          <path d="M7 7 L11 11 M21 7 L17 11 M7 21 L11 17 M21 21 L17 17" stroke="#0ea5e9" strokeWidth="1" opacity="0.5" />
        </g>
      );
      default: return (
        <g transform="translate(46, 30)">
          <rect width="28" height="20" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          <path d="M4 6 H24 M4 10 H24 M4 14 H18" stroke={color} strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
        </g>
      );
    }
  };

  const boardColor = iconType === 'imu' ? "#1e3a8a" : iconType === 'gas' ? "#1e3a8a" : "#0f2d44";

  return (
    <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} {...props}>
      <rect x="18" y="10" width="84" height="100" rx="8" fill={boardColor} stroke={color} strokeWidth="1.8" />
      {/* Mounting holes */}
      <MountingHole cx={26} cy={18} />
      <MountingHole cx={94} cy={18} />
      <MountingHole cx={26} cy={102} />
      <MountingHole cx={94} cy={102} />
      {renderIcon()}
      <text x="60" y="76" fill="#f8fafc" fontSize="10.5" fontWeight="800" fontFamily="Inter, sans-serif" textAnchor="middle">{primaryLine}</text>
      {secondaryLine ? (
        <text x="60" y="88" fill="#94a3b8" fontSize="7" fontWeight="500" fontFamily="Inter, sans-serif" textAnchor="middle" opacity="0.9">{secondaryLine}</text>
      ) : null}
      {/* Pin header */}
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} x={36 + i * 10} y="106" width="6" height="14" rx="1" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
      ))}
    </svg>
  );
};

const createInputModulePreview = (label, color = "#14b8a6", shortForm, type = "switch") => (props) => {
  const primaryLine = shortForm || label.split(" ")[0];

  const renderInput = () => {
    switch (type) {
      case 'joy': return (
        <g transform="translate(44, 20)">
          <circle cx="16" cy="16" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" opacity="0.5" />
          <circle cx="16" cy="16" r="13" fill="#374151" />
          <circle cx="16" cy="16" r="6" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          <circle cx="16" cy="16" r="2.5" fill="#cbd5e1" />
          <rect x="14" y="2" width="4" height="8" rx="2" fill="#475569" />
        </g>
      );
      case 'enc': return (
        <g transform="translate(44, 20)">
          <rect x="4" y="4" width="24" height="24" rx="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          <circle cx="16" cy="16" r="9" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="4" fill="#374151" />
          <rect x="15" y="7" width="2" height="5" rx="1" fill="#1e293b" />
        </g>
      );
      case 'dip': return (
        <g transform="translate(38, 24)">
          <rect width="44" height="28" rx="3" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={i} x={5 + i * 10} y="5" width="6" height="18" rx="1.5" fill="#f8fafc" />
          ))}
          {[2, 3].map((i) => (
            <rect key={i} x={5 + i * 10} y="5" width="6" height="9" rx="1.5" fill="#dc2626" />
          ))}
        </g>
      );
      default: return (
        <g transform="translate(40, 26)">
          <rect width="40" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <rect x="22" y="4" width="14" height="12" rx="3" fill="#cbd5e1" />
          <rect x="4" y="4" width="14" height="12" rx="3" fill="#374151" />
        </g>
      );
    }
  };

  return (
    <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} {...props}>
      <rect x="18" y="12" width="84" height="96" rx="12" fill="#0c2233" stroke={color} strokeWidth="2" />
      <MountingHole cx={26} cy={20} />
      <MountingHole cx={94} cy={20} />
      {renderInput()}
      <text x="60" y="72" fill={color} fontSize="12" fontWeight="800" fontFamily="Inter, sans-serif" textAnchor="middle">{primaryLine}</text>
      <path d="M28 88 H92" stroke={color} strokeWidth="1" opacity="0.3" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={30 + i * 11} y="92" width="7" height="14" rx="1" fill="#d4a373" stroke="#92400e" strokeWidth="0.5" />
      ))}
    </svg>
  );
};

// ── Exports ──────────────────────────────────────────────────────────────────

export const NativeComponents = {
  "wokwi-arduino-uno":         createPreview(UnoPreview),
  "wokwi-arduino-mega":        createPreview(MegaPreview),
  "wokwi-esp32-devkit-v1":     createPreview(ESP32Preview),
  "wokwi-lcd1602":             createPreview(LCDPreview),
  "wokwi-lcd2004":             createPreview(LCDPreview),
  "wokwi-ssd1306":             createPreview(OLEDPreview),
  "wokwi-ili9341":             createPreview(ILI9341Preview),
  "wokwi-7segment":            createPreview(SevenSegmentPreview),
  "wokwi-dht22":               createPreview(DHT22Preview),
  "wokwi-pir-motion-sensor":   createPreview(PIRPreview),
  "wokwi-hc-sr04":             createPreview(HCSR04Preview),
  "wokwi-membrane-keypad":     createPreview(KeypadPreview),
  "wokwi-servo":               createPreview(ServoPreview),
  "wokwi-led":                 createPreview(LedPreview),
  "wokwi-rgb-led":             createPreview(LedPreview),
  "wokwi-resistor":            createPreview(ResistorPreview),
  "wokwi-capacitor":           createPreview(CapacitorPreview),
  "wokwi-potentiometer":       createPreview(PotentiometerPreview),
  "wokwi-slide-potentiometer": createPreview(PotentiometerPreview),
  "vlab-slide-potentiometer":  createPreview(SlidePotPreview),
  "wokwi-breadboard":          createPreview(BreadboardPreview),
  "wokwi-pushbutton":          createPreview(PushbuttonPreview),
  "wokwi-buzzer":              createPreview(BuzzerPreview),
  "wokwi-neopixel":            createPreview(NeopixelPreview),
  "wokwi-led-ring":            createPreview(NeopixelPreview),

  // DIP ICs
  "wokwi-555":              createPreview(createDipIcPreview("555", 4, "#8b5cf6")),
  "vlab-74hc595":           createPreview(createDipIcPreview("74HC595", 8, "#60a5fa")),
  "wokwi-npn-transistor":   createPreview(createTo92Preview("NPN", "#f59e0b")),
  "wokwi-pnp-transistor":   createPreview(createTo92Preview("PNP", "#fb7185")),

  // Tools
  "vlab-serial-monitor":       createPreview(SerialMonitorPreview),
  "vlab-logic-analyzer":       createPreview(LogicAnalyzerPreview),
  "vlab-custom-digital-chip":  createPreview(CustomChipPreview),
  "vlab-wasm-ic":              createPreview(WasmIcPreview),
  "vlab-multimeter":           createPreview(MultimeterPreview),
  "vlab-jumper-wires":         createPreview(JumperWiresPreview),
  "vlab-vcc-node":             createPreview(VccNodePreview),
  "vlab-ground-node":          createPreview(GroundNodePreview),

  // Procedural labeled modules
  "wokwi-analog-joystick":         createInputModulePreview("JOYSTICK",   "#ef4444", "JOY",   "joy"),
  "wokwi-big-sound-sensor":        createSensorModulePreview("SOUND",     "#10b981", "SOUND", "mic"),
  "wokwi-dip-switch-8":            createInputModulePreview("DIP SWITCH", "#6366f1", "DIP8",  "dip"),
  "wokwi-ds1307":                  createSensorModulePreview("RTC",       "#0ea5e9", "DS1307","chip"),
  "wokwi-epaper":                  createSensorModulePreview("E-PAPER",   "#cbd5e1", "E-INK", "chip"),
  "wokwi-flame-sensor":            createSensorModulePreview("FLAME",     "#f97316", "FLAME", "flame"),
  "wokwi-gas-sensor":              createSensorModulePreview("GAS MQ-2",  "#8b5cf6", "GAS",   "gas"),
  "wokwi-heart-beat-sensor":       createSensorModulePreview("HEARTBEAT", "#ef4444", "BPM",   "heart"),
  "wokwi-hx711":                   createSensorModulePreview("HX711",     "#10b981", "LOAD",  "chip"),
  "wokwi-ir-receiver":             createSensorModulePreview("IR RECV",   "#6366f1", "IR-RX", "chip"),
  "wokwi-ir-remote":               createInputModulePreview("IR REMOTE",  "#6366f1", "REMOTE","switch"),
  "wokwi-ky-040":                  createInputModulePreview("ENCODER",    "#14b8a6", "ENC",   "enc"),
  "wokwi-led-bar-graph":           createSensorModulePreview("LED BAR",   "#ef4444", "BAR",   "chip"),
  "wokwi-led-matrix":              createSensorModulePreview("8×8 MATRIX","#ef4444", "MTX",   "chip"),
  "wokwi-microsd-card":            createSensorModulePreview("SD CARD",   "#0ea5e9", "SD",    "chip"),
  "wokwi-mpu6050":                 createSensorModulePreview("IMU",       "#0ea5e9", "MPU6050","imu"),
  "wokwi-ntc-temperature-sensor":  createSensorModulePreview("THERMISTOR","#0ea5e9", "NTC",   "chip"),
  "wokwi-photoresistor-sensor":    createSensorModulePreview("PHOTOCELL", "#f59e0b", "LDR",   "chip"),
  "wokwi-rotary-dialer":           createInputModulePreview("ROTARY",     "#14b8a6", "DIAL",  "enc"),
  "wokwi-slide-switch":            createInputModulePreview("SLIDE SW",   "#94a3b8", "SW",    "switch"),
  "wokwi-stepper-motor":           createInputModulePreview("STEPPER",    "#f97316", "STEP",  "enc"),
  "wokwi-tv":                      createSensorModulePreview("TV OUT",    "#6366f1", "TV",    "chip"),
  "vlab-relay-module":             createSensorModulePreview("RELAY",     "#ef4444", "RLY",   "gas"),
  "wokwi-neopixel-matrix":         createSensorModulePreview("NEOPIXEL",  "#8b5cf6", "NxN",   "chip"),

  // Fallback
  "generic": createSensorModulePreview("COMPONENT", "#94a3b8", "IC"),
};
