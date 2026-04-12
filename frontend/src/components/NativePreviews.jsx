/* eslint-disable react-refresh/only-export-components */
import React from "react";

const createPreview = (PreviewComponent) => (props) => (
  <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} {...props}>
    {React.createElement(PreviewComponent)}
  </svg>
);

// Breakout-board style previews for the components that don't have bespoke art yet.
const createTextPreview = (label, color = "#0ea5e9", shortForm) => (props) => {
  const primaryLine = shortForm || label.split(" ")[0];
  const secondaryLine = shortForm ? label : label.split(" ").slice(1).join(" ");

  return (
    <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }} {...props}>
      <rect x="22" y="12" width="76" height="96" rx="10" fill="#17324a" stroke={color} strokeWidth="2.2" />
      <circle cx="32" cy="22" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="88" cy="22" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <rect x="34" y="28" width="52" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <rect x="40" y="34" width="40" height="16" rx="3" fill="#020617" stroke="#1e293b" strokeWidth="1" />
      <path d="M32 68 H88 M32 76 H88" stroke="#32506b" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 60 L40 84 M54 60 L54 90 M68 60 L68 84 M82 60 L82 90" stroke="#4f6b84" strokeWidth="1.6" strokeLinecap="round" />
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          <rect x={31 + i * 9.5} y="94" width="5" height="12" rx="1" fill="#cbd5e1" />
          <circle cx={33.5 + i * 9.5} cy="90" r="2.4" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        </React.Fragment>
      ))}
      <text x="60" y="45" fill={color} fontSize="13" fontWeight="700" fontFamily="Inter, monospace" textAnchor="middle" letterSpacing="0.08em">
        {primaryLine}
      </text>
      {secondaryLine ? (
        <text x="60" y="68" fill="#cbd5e1" fontSize="7.5" fontWeight="600" fontFamily="Inter, monospace" textAnchor="middle" letterSpacing="0.1em">
          {secondaryLine}
        </text>
      ) : null}
    </svg>
  );
};

/* -- High Fidelity Custom SVGs -- */

const UnoPreview = () => (
  <>
    <rect x="10" y="20" width="100" height="80" rx="4" fill="#006468" />
    <rect x="15" y="30" width="15" height="15" fill="#facc15" />
    <rect x="35" y="30" width="40" height="15" fill="#1e293b" />
    <text x="55" y="70" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle" letterSpacing="2"> UNO </text>
    {Array.from({ length: 14 }).map((_, i) => (
      <rect key={`u-top-${i}`} x="20" y="15" width="4" height="5" fill="#e2e8f0" transform={`translate(${i * 6}, 0)`} />
    ))}
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={`u-bot-${i}`} x="60" y="100" width="4" height="5" fill="#e2e8f0" transform={`translate(${i * 6}, 0)`} />
    ))}
  </>
);

const MegaPreview = () => (
  <>
    <rect x="5" y="10" width="110" height="100" rx="4" fill="#006468" />
    <rect x="15" y="20" width="20" height="20" fill="#facc15" />
    <rect x="45" y="30" width="30" height="30" rx="4" fill="#1e293b" transform="rotate(45 60 45)" />
    <text x="60" y="90" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="2"> MEGA </text>
  </>
);

const ESP32Preview = () => (
  <>
    <rect x="25" y="10" width="70" height="100" rx="4" fill="#1e293b" />
    <rect x="35" y="20" width="50" height="30" fill="#cbd5e1" />
    <text x="60" y="70" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle"> ESP32-S3 </text>
    {Array.from({ length: 20 }).map((_, i) => (
      <React.Fragment key={`esp-${i}`}>
        <rect x="20" y={15 + i * 4} width="5" height="2" fill="#facc15" />
        <rect x="95" y={15 + i * 4} width="5" height="2" fill="#facc15" />
      </React.Fragment>
    ))}
  </>
);

const LCDPreview = () => (
  <>
    <rect x="5" y="30" width="110" height="60" rx="2" fill="#22c55e" />
    <rect x="15" y="40" width="90" height="40" rx="2" fill="#84cc16" opacity="0.8" />
    <text x="60" y="65" fill="#064e3b" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle"> 16x2 LCD </text>
    {Array.from({ length: 16 }).map((_, i) => (
      <circle key={`lcd-${i}`} cx={15 + i * 6} cy="25" r="1.5" fill="#e2e8f0" />
    ))}
  </>
);

const OLEDPreview = () => (
  <>
    <rect x="15" y="20" width="90" height="80" rx="2" fill="#1e293b" />
    <rect x="25" y="40" width="70" height="40" fill="#020617" />
    <text x="60" y="65" fill="#00f2ff" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle"> OLED </text>
    <circle cx="20" cy="25" r="2" fill="#e2e8f0" />
    <circle cx="100" cy="25" r="2" fill="#e2e8f0" />
    <circle cx="20" cy="95" r="2" fill="#e2e8f0" />
    <circle cx="100" cy="95" r="2" fill="#e2e8f0" />
    <rect x="45" y="15" width="4" height="5" fill="#facc15" />
    <rect x="55" y="15" width="4" height="5" fill="#facc15" />
    <rect x="65" y="15" width="4" height="5" fill="#facc15" />
    <rect x="75" y="15" width="4" height="5" fill="#facc15" />
  </>
);

const ILI9341Preview = () => (
  <>
    <rect x="10" y="10" width="100" height="100" rx="2" fill="#ef4444" />
    <rect x="20" y="20" width="80" height="70" fill="#0f172a" />
    <text x="60" y="60" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle"> TFT </text>
    {Array.from({ length: 9 }).map((_, i) => (
      <circle key={`tft-${i}`} cx="15" cy={20 + i * 8} r="1.5" fill="#facc15" />
    ))}
  </>
);

const SevenSegmentPreview = () => (
  <>
    <rect x="30" y="20" width="60" height="80" rx="4" fill="#1e293b" />
    <path d="M45,30 L75,30 L70,35 L50,35 Z" fill="#ef4444" />
    <path d="M76,32 L80,50 L75,53 L71,35 Z" fill="#ef4444" opacity="0.2" />
    <path d="M78,55 L74,74 L69,70 L73,52 Z" fill="#ef4444" />
    <path d="M72,76 L42,76 L47,71 L67,71 Z" fill="#ef4444" opacity="0.2" />
    <path d="M44,74 L40,55 L45,52 L49,70 Z" fill="#ef4444" opacity="0.2" />
    <path d="M42,52 L46,32 L51,35 L47,53 Z" fill="#ef4444" />
    <path d="M48,54 L71,54 L68,57 L45,57 Z" fill="#ef4444" />
    <circle cx="82" cy="74" r="3" fill="#ef4444" />
  </>
);

const DHT22Preview = () => (
  <>
    <rect x="35" y="20" width="50" height="60" rx="4" fill="#f8fafc" />
    {Array.from({ length: 5 }).map((_, i) => (
      <line key={`dht-${i}`} x1="40" y1={30 + i * 6} x2="80" y2={30 + i * 6} stroke="#cbd5e1" strokeWidth="2" />
    ))}
    <rect x="40" y="80" width="5" height="20" fill="#94a3b8" />
    <rect x="55" y="80" width="5" height="20" fill="#94a3b8" />
    <rect x="70" y="80" width="5" height="20" fill="#94a3b8" />
    <text x="60" y="50" fill="#0ea5e9" fontSize="16" fontWeight="bold" textAnchor="middle"> DHT22 </text>
  </>
);

const PIRPreview = () => (
  <>
    <rect x="25" y="30" width="70" height="60" rx="4" fill="#22c55e" />
    <circle cx="60" cy="60" r="25" fill="#f8fafc" />
    <circle cx="60" cy="60" r="15" fill="#e2e8f0" />
    <rect x="40" y="90" width="4" height="15" fill="#94a3b8" />
    <rect x="58" y="90" width="4" height="15" fill="#94a3b8" />
    <rect x="76" y="90" width="4" height="15" fill="#94a3b8" />
  </>
);

const HCSR04Preview = () => (
  <>
    <rect x="15" y="35" width="90" height="50" rx="2" fill="#3b82f6" />
    <circle cx="35" cy="60" r="18" fill="#e2e8f0" />
    <circle cx="35" cy="60" r="8" fill="#333" />
    <circle cx="85" cy="60" r="18" fill="#e2e8f0" />
    <circle cx="85" cy="60" r="8" fill="#333" />
    {Array.from({ length: 4 }).map((_, i) => (
      <rect key={`ping-${i}`} x={45 + i * 10} y="85" width="3" height="15" fill="#94a3b8" />
    ))}
  </>
);

const KeypadPreview = () => (
  <>
    <rect x="20" y="10" width="80" height="90" rx="4" fill="#0f172a" />
    {Array.from({ length: 4 }).map((_, row) => 
      Array.from({ length: 4 }).map((_, col) => (
        <rect key={`${row}-${col}`} x={25 + col * 18} y={15 + row * 18} width="14" height="14" rx="2" fill="#334155" />
      ))
    )}
    <rect x="40" y="100" width="40" height="15" fill="#cbd5e1" />
  </>
);

const ServoPreview = () => (
  <>
    <rect x="25" y="30" width="70" height="60" rx="4" fill="#2563eb" />
    <rect x="15" y="50" width="10" height="20" fill="#2563eb" />
    <rect x="95" y="50" width="10" height="20" fill="#2563eb" />
    <circle cx="60" cy="30" r="20" fill="#1e293b" />
    <path d="M50,15 L70,15 L60,5 Z" fill="#e2e8f0" />
    <rect x="55" y="15" width="10" height="25" fill="#e2e8f0" />
    <rect x="40" y="90" width="40" height="10" fill="#64748b" />
  </>
);

const LedPreview = () => (
  <>
    <path d="M40,55 A20,20 0 0,1 80,55 L80,70 L40,70 Z" fill="#ef4444" opacity="0.9" />
    <rect x="35" y="70" width="50" height="10" rx="2" fill="#7f1d1d" />
    <rect x="50" y="80" width="4" height="25" fill="#94a3b8" />
    <rect x="66" y="80" width="4" height="35" fill="#94a3b8" />
    <path d="M50,55 L65,40 M65,55 L75,45" stroke="#fecaca" strokeWidth="2" strokeLinecap="round" />
  </>
);

const ResistorPreview = () => (
  <>
    <rect x="20" y="55" width="80" height="10" rx="2" fill="#e2e8f0" />
    <path d="M35,60 L40,45 L45,75 L50,45 L55,75 L60,45 L65,75 L70,45 L75,60" fill="none" stroke="#b45309" strokeWidth="4" strokeLinejoin="round" />
    <rect x="30" y="50" width="60" height="20" rx="4" fill="#d97706" opacity="0.4" />
  </>
);

const CapacitorPreview = () => (
  <>
    <rect x="50" y="80" width="4" height="30" fill="#94a3b8" />
    <rect x="66" y="80" width="4" height="30" fill="#94a3b8" />
    <circle cx="60" cy="50" r="25" fill="#0284c7" />
    <path d="M60,25 A25,25 0 0,0 60,75" fill="#38bdf8" />
    <text x="60" y="55" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">10µF</text>
  </>
);

const PotentiometerPreview = () => (
  <>
    <rect x="35" y="30" width="50" height="50" rx="25" fill="#1e293b" />
    <circle cx="60" cy="55" r="15" fill="#94a3b8" />
    <path d="M60,55 L60,40" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" transform="rotate(-45 60 55)" />
    <rect x="42" y="80" width="4" height="20" fill="#cbd5e1" />
    <rect x="58" y="80" width="4" height="20" fill="#cbd5e1" />
    <rect x="74" y="80" width="4" height="20" fill="#cbd5e1" />
  </>
);

const SlidePotPreview = () => (
  <>
    <rect x="16" y="44" width="88" height="32" rx="10" fill="#111827" stroke="#475569" strokeWidth="2" />
    <rect x="26" y="57" width="68" height="6" rx="3" fill="#334155" />
    <rect x="48" y="35" width="24" height="50" rx="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
    <rect x="53" y="28" width="14" height="16" rx="3" fill="#94a3b8" />
    <rect x="28" y="76" width="4" height="18" fill="#cbd5e1" />
    <rect x="58" y="76" width="4" height="24" fill="#cbd5e1" />
    <rect x="88" y="76" width="4" height="18" fill="#cbd5e1" />
  </>
);

const BreadboardPreview = () => (
  <>
    <rect x="5" y="20" width="110" height="80" rx="4" fill="#f8fafc" />
    <rect x="5" y="30" width="110" height="2" fill="#ef4444" />
    <rect x="5" y="40" width="110" height="2" fill="#3b82f6" />
    <rect x="5" y="80" width="110" height="2" fill="#ef4444" />
    <rect x="5" y="90" width="110" height="2" fill="#3b82f6" />
    {Array.from({ length: 4 }).map((_, r) => 
      Array.from({ length: 14 }).map((_, c) => 
        <circle key={`bb-${r}-${c}`} cx={12 + c * 7.5} cy={50 + r * 6} r="1.5" fill="#cbd5e1" />
      )
    )}
  </>
);

const PushbuttonPreview = () => (
  <>
    <rect x="35" y="35" width="50" height="50" rx="4" fill="#1e293b" />
    <circle cx="60" cy="60" r="15" fill="#ef4444" />
    <rect x="25" y="45" width="10" height="5" fill="#94a3b8" />
    <rect x="25" y="70" width="10" height="5" fill="#94a3b8" />
    <rect x="85" y="45" width="10" height="5" fill="#94a3b8" />
    <rect x="85" y="70" width="10" height="5" fill="#94a3b8" />
  </>
);

const BuzzerPreview = () => (
  <>
    <circle cx="60" cy="55" r="30" fill="#0f172a" />
    <circle cx="60" cy="55" r="10" fill="#334155" />
    <rect x="45" y="85" width="4" height="20" fill="#cbd5e1" />
    <rect x="71" y="85" width="4" height="20" fill="#cbd5e1" />
    <text x="50" y="35" fill="white" fontSize="16">+</text>
  </>
);

const createDipIcPreview = (label, pinsPerSide, accent = "#22d3ee") => () => (
  <>
    <rect x="28" y="18" width="64" height="84" rx="8" fill="#111827" stroke="#334155" strokeWidth="2" />
    <rect x="51" y="18" width="18" height="8" rx="0 0 8 8" fill="#374151" />
    {Array.from({ length: pinsPerSide }).map((_, i) => (
      <React.Fragment key={i}>
        <rect x="18" y={28 + i * (56 / Math.max(pinsPerSide - 1, 1))} width="10" height="4" rx="1" fill="#dbe4ef" />
        <rect x="92" y={28 + i * (56 / Math.max(pinsPerSide - 1, 1))} width="10" height="4" rx="1" fill="#dbe4ef" />
      </React.Fragment>
    ))}
    <rect x="40" y="34" width="40" height="18" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
    <text x="60" y="70" fill="#f8fafc" fontSize="11" fontWeight="700" textAnchor="middle">{label}</text>
    <text x="60" y="86" fill={accent} fontSize="9" fontWeight="700" textAnchor="middle">DIP</text>
  </>
);

const createTo92Preview = (label, accent) => () => (
  <>
    <path d="M36 34 C36 24, 44 18, 60 18 C76 18, 84 24, 84 34 V64 H36 Z" fill="#1f2937" stroke="#475569" strokeWidth="2" />
    <path d="M43 32 H77" stroke="#334155" strokeWidth="2" />
    <text x="60" y="48" fill="#f8fafc" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
    <path d="M48 64 V102 M60 64 V106 M72 64 V102" stroke="#dbe4ef" strokeWidth="4" strokeLinecap="round" />
    <path d="M44 78 H76" stroke={accent} strokeWidth="2" opacity="0.7" />
  </>
);

const SerialMonitorPreview = () => (
  <>
    <rect x="18" y="20" width="84" height="72" rx="10" fill="#07121f" stroke="#0ea5e9" strokeWidth="2" />
    <rect x="24" y="26" width="72" height="48" rx="6" fill="#020617" />
    <path d="M30 40 H72 M30 52 H84 M30 64 H66" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <path d="M30 82 H90" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    <circle cx="44" cy="82" r="4" fill="#22c55e" />
    <circle cx="60" cy="82" r="4" fill="#f59e0b" />
    <circle cx="76" cy="82" r="4" fill="#ef4444" />
  </>
);

const LogicAnalyzerPreview = () => (
  <>
    <rect x="18" y="28" width="84" height="54" rx="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
    <path d="M26 62 H40 V44 H54 V68 H68 V36 H82 V56 H94" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={24 + i * 9} y="84" width="4" height="16" rx="1" fill="#cbd5e1" />
    ))}
  </>
);

const CustomChipPreview = () => (
  <>
    <rect x="28" y="26" width="64" height="68" rx="8" fill="#111827" stroke="#14b8a6" strokeWidth="2" />
    {Array.from({ length: 6 }).map((_, i) => (
      <React.Fragment key={i}>
        <rect x="18" y={34 + i * 10} width="10" height="4" rx="1" fill="#cbd5e1" />
        <rect x="92" y={34 + i * 10} width="10" height="4" rx="1" fill="#cbd5e1" />
      </React.Fragment>
    ))}
    <path d="M42 46 H78 M42 58 H68 M42 70 H78" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
    <text x="60" y="44" fill="#99f6e4" fontSize="9" fontWeight="700" textAnchor="middle">VLAB</text>
  </>
);

const WasmIcPreview = () => (
  <>
    <rect x="24" y="22" width="72" height="76" rx="10" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" />
    <path d="M38 38 L46 80 L60 52 L74 80 L82 38" stroke="#f8fafc" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="34" y="84" width="52" height="6" rx="3" fill="#374151" />
  </>
);

const MultimeterPreview = () => (
  <>
    <rect x="28" y="14" width="64" height="92" rx="12" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
    <rect x="38" y="24" width="44" height="24" rx="4" fill="#111827" />
    <text x="60" y="40" fill="#86efac" fontSize="12" fontWeight="700" textAnchor="middle">5.00</text>
    <circle cx="60" cy="68" r="14" fill="#1f2937" stroke="#475569" strokeWidth="3" />
    <path d="M60 68 L68 60" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
    <circle cx="46" cy="92" r="4" fill="#111827" />
    <circle cx="74" cy="92" r="4" fill="#dc2626" />
  </>
);

const JumperWiresPreview = () => (
  <>
    <path d="M20 86 C34 52, 40 44, 56 24" stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M30 92 C46 66, 56 58, 82 34" stroke="#facc15" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M44 98 C60 72, 72 64, 100 44" stroke="#3b82f6" strokeWidth="6" fill="none" strokeLinecap="round" />
    <rect x="16" y="82" width="10" height="12" rx="2" fill="#e5e7eb" />
    <rect x="26" y="88" width="10" height="12" rx="2" fill="#e5e7eb" />
    <rect x="40" y="94" width="10" height="12" rx="2" fill="#e5e7eb" />
    <rect x="52" y="18" width="10" height="12" rx="2" fill="#e5e7eb" />
    <rect x="78" y="28" width="10" height="12" rx="2" fill="#e5e7eb" />
    <rect x="96" y="38" width="10" height="12" rx="2" fill="#e5e7eb" />
  </>
);

const VccNodePreview = () => (
  <>
    <circle cx="60" cy="60" r="30" fill="#f59e0b" opacity="0.16" />
    <circle cx="60" cy="60" r="20" fill="#facc15" />
    <path d="M60 36 V84 M44 60 H76" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
  </>
);

const GroundNodePreview = () => (
  <>
    <circle cx="60" cy="44" r="8" fill="#22d3ee" />
    <path d="M60 52 V76" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
    <path d="M42 76 H78 M46 84 H74 M50 92 H70" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
  </>
);

export const NativeComponents = {
  // High fidelity vector components
  "wokwi-arduino-uno": createPreview(UnoPreview),
  "wokwi-arduino-mega": createPreview(MegaPreview),
  "wokwi-esp32-devkit-v1": createPreview(ESP32Preview),
  "wokwi-lcd1602": createPreview(LCDPreview),
  "wokwi-lcd2004": createPreview(LCDPreview),
  "wokwi-ssd1306": createPreview(OLEDPreview),
  "wokwi-ili9341": createPreview(ILI9341Preview),
  "wokwi-7segment": createPreview(SevenSegmentPreview),
  "wokwi-dht22": createPreview(DHT22Preview),
  "wokwi-pir-motion-sensor": createPreview(PIRPreview),
  "wokwi-hc-sr04": createPreview(HCSR04Preview),
  "wokwi-membrane-keypad": createPreview(KeypadPreview),
  "wokwi-servo": createPreview(ServoPreview),
  "wokwi-led": createPreview(LedPreview),
  "wokwi-rgb-led": createPreview(LedPreview),
  "wokwi-resistor": createPreview(ResistorPreview),
  "wokwi-capacitor": createPreview(CapacitorPreview),
  "wokwi-potentiometer": createPreview(PotentiometerPreview),
  "wokwi-slide-potentiometer": createPreview(PotentiometerPreview),
  "vlab-slide-potentiometer": createPreview(SlidePotPreview),
  "wokwi-breadboard": createPreview(BreadboardPreview),
  "wokwi-pushbutton": createPreview(PushbuttonPreview),
  "wokwi-buzzer": createPreview(BuzzerPreview),

  // Procedural labeled chips for specialized sensors
  "wokwi-555": createPreview(createDipIcPreview("555", 4, "#8b5cf6")),
  "wokwi-analog-joystick": createTextPreview("JOYSTICK", "#ef4444", "JOY"),
  "wokwi-big-sound-sensor": createTextPreview("SOUND SENSOR", "#10b981"),
  "wokwi-dip-switch-8": createTextPreview("DIP SWITCH", "#6366f1", "DIP8"),
  "wokwi-ds1307": createTextPreview("RTC CHIP", "#0ea5e9", "RTC"),
  "wokwi-epaper": createTextPreview("E-PAPER DISPLAY", "#cbd5e1", "E-INK"),
  "wokwi-flame-sensor": createTextPreview("FLAME SENSOR", "#f97316"),
  "wokwi-gas-sensor": createTextPreview("MQ2 GAS", "#8b5cf6"),
  "wokwi-heart-beat-sensor": createTextPreview("HEART RATE", "#ef4444", "BPM"),
  "wokwi-hx711": createTextPreview("HX711 AMP", "#10b981", "LOAD"),
  "wokwi-ir-receiver": createTextPreview("IR RECV", "#6366f1", "IR"),
  "wokwi-ir-remote": createTextPreview("REMOTE", "#6366f1"),
  "wokwi-ky-040": createTextPreview("ENCODER", "#14b8a6", "ENC"),
  "wokwi-led-bar-graph": createTextPreview("BAR GRAPH", "#ef4444", "BAR"),
  "wokwi-led-matrix": createTextPreview("LED MATRIX", "#ef4444", "MTX"),
  "wokwi-led-ring": createTextPreview("LED RING", "#8b5cf6", "RING"),
  "wokwi-microsd-card": createTextPreview("SD READER", "#0ea5e9", "SD"),
  "wokwi-mpu6050": createTextPreview("MPU6050 IMU", "#0ea5e9", "IMU"),
  "wokwi-neopixel": createTextPreview("NEOPIXEL", "#8b5cf6", "NEO"),
  "wokwi-npn-transistor": createPreview(createTo92Preview("NPN", "#f59e0b")),
  "wokwi-ntc-temperature-sensor": createTextPreview("THERMISTOR", "#0ea5e9", "NTC"),
  "wokwi-photoresistor-sensor": createTextPreview("PHOTO SENSOR", "#f59e0b", "LDR"),
  "wokwi-pnp-transistor": createPreview(createTo92Preview("PNP", "#fb7185")),
  "wokwi-rotary-dialer": createTextPreview("ROTARY DIAL", "#14b8a6", "DIAL"),
  "wokwi-slide-switch": createTextPreview("SWITCH", "#94a3b8", "SW"),
  "wokwi-stepper-motor": createTextPreview("STEPPER", "#f97316", "STEP"),
  "wokwi-tv": createTextPreview("TV OUT", "#6366f1", "TV"),
  "vlab-relay-module": createTextPreview("RELAY MOD", "#ef4444", "RLY"),
  "vlab-74hc595": createPreview(createDipIcPreview("74HC595", 8, "#60a5fa")),
  "vlab-serial-monitor": createPreview(SerialMonitorPreview),
  "vlab-logic-analyzer": createPreview(LogicAnalyzerPreview),
  "vlab-custom-digital-chip": createPreview(CustomChipPreview),
  "vlab-wasm-ic": createPreview(WasmIcPreview),
  "vlab-multimeter": createPreview(MultimeterPreview),
  "vlab-jumper-wires": createPreview(JumperWiresPreview),
  "vlab-vcc-node": createPreview(VccNodePreview),
  "vlab-ground-node": createPreview(GroundNodePreview),

  // Fallback
  "generic": createTextPreview("COMPONENT", "#94a3b8", "IC")
};
