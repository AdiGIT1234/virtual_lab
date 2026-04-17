import React from 'react';

// Helper for consistent pin markers (static, DraggableWrapper handles interaction)
const Pin = ({ x, y, label, color = '#22d3ee' }) => (
  <g>
    <circle cx={x} cy={y} r={3.5} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
    {label && <text x={x} y={y + 10} fill="#64748b" fontSize={7} textAnchor="middle" fontFamily="monospace">{label}</text>}
  </g>
);

/* ── Displays & Actuators ── */
export const Buzzer = () => (
  <svg width={80} height={90} viewBox="0 0 80 90" style={{ display: 'block' }}>
    <rect x={10} y={10} width={60} height={60} rx={30} fill="#0f172a" stroke="#22c55e" strokeWidth={2} />
    <circle cx={40} cy={40} r={10} fill="#334155" />
    <text x={30} y={25} fill="white" fontSize={14}>+</text>
    <Pin x={20} y={82} label="SIG" />
    <Pin x={56} y={82} label="GND" />
    <line x1={20} y1={70} x2={20} y2={82} stroke="#94a3b8" strokeWidth={2} />
    <line x1={56} y1={70} x2={56} y2={82} stroke="#94a3b8" strokeWidth={2} />
  </svg>
);

export const Lcd1602 = () => (
  <svg width={200} height={105} viewBox="0 0 200 105" style={{ display: 'block' }}>
    <rect x={0} y={0} width={200} height={85} rx={4} fill="#166534" />
    <rect x={20} y={15} width={160} height={55} rx={2} fill="#84cc16" opacity={0.8} />
    <text x={100} y={45} fill="#064e3b" fontSize={20} fontFamily="monospace" fontWeight="bold" textAnchor="middle">16x2 LCD</text>
    <g transform="translate(0, 95)">
      {["VSS","VDD","RS","E","D4","D5","D6","D7","LED+","LED-"].map((l, i) => (
        <Pin key={i} x={9 + i * 12} y={5} label={l} color={i<2||i>7 ? '#facc15' : '#22d3ee'} />
      ))}
    </g>
  </svg>
);

export const OledSSD1306 = () => (
  <svg width={80} height={100} viewBox="0 0 80 100" style={{ display: 'block' }}>
    <rect x={0} y={0} width={80} height={80} rx={4} fill="#1e3a8a" />
    <rect x={10} y={20} width={60} height={40} fill="#020617" />
    <text x={40} y={45} fill="#00f2ff" fontSize={12} fontFamily="monospace" fontWeight="bold" textAnchor="middle">OLED</text>
    {["VCC","GND","SCL","SDA"].map((l, i) => (
      <Pin key={i} x={15 + i*16} y={95} label={l} />
    ))}
  </svg>
);

export const Ili9341Tft = () => (
  <svg width={110} height={150} viewBox="0 0 110 150" style={{ display: 'block' }}>
    <rect x={0} y={0} width={110} height={130} rx={4} fill="#b91c1c" />
    <rect x={10} y={15} width={90} height={100} fill="#0f172a" />
    <text x={55} y={70} fill="white" fontSize={16} fontWeight="bold" textAnchor="middle">TFT</text>
    {["VCC","GND","CS","RST","DC","MOSI","SCK","LED"].map((l, i) => (
      <Pin key={i} x={10 + i*13} y={142} label={l} />
    ))}
  </svg>
);

/* ── Sensors ── */
export const Dht22 = () => (
  <svg width={65} height={90} viewBox="0 0 65 90" style={{ display: 'block' }}>
    <rect x={5} y={5} width={55} height={70} rx={4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
    {[20,30,40,50,60].map(y => <line key={y} x1={15} x2={50} y1={y} y2={y} stroke="#cbd5e1" strokeWidth={2} />)}
    <text x={32} y={16} fill="#0ea5e9" fontSize={10} fontWeight="bold" textAnchor="middle">DHT22</text>
    {["VCC","DATA","GND"].map((l, i) => <Pin key={i} x={13 + i*20} y={84} label={l} />)}
  </svg>
);

export const NtcSensor = () => (
  <svg width={50} height={80} viewBox="0 0 50 80" style={{ display: 'block' }}>
    <circle cx={25} cy={40} r={12} fill="#0ea5e9" opacity={0.9} />
    <Pin x={15} y={74} label="T1" />
    <Pin x={35} y={74} label="T2" />
    <path d="M15 74 Q 15 52 20 45" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <path d="M35 74 Q 35 52 30 45" stroke="#94a3b8" strokeWidth={2} fill="none" />
  </svg>
);

export const Photoresistor = () => (
  <svg width={50} height={80} viewBox="0 0 50 80" style={{ display: 'block' }}>
    <rect x={10} y={30} width={30} height={20" rx={8} fill="#f59e0b" opacity={0.9} />
    <path d="M15 40 L20 35 L25 45 L30 35 L35 40" stroke="#b45309" strokeWidth={2} fill="none" />
    <Pin x={15} y={74} label="L1" />
    <Pin x={35} y={74} label="L2" />
    <path d="M15 74 C 15 60 15 50 20 50" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <path d="M35 74 C 35 60 35 50 30 50" stroke="#94a3b8" strokeWidth={2} fill="none" />
  </svg>
);

export const PirSensor = () => (
  <svg width={75} height={90} viewBox="0 0 75 90" style={{ display: 'block' }}>
    <rect x={5} y={15} width={65} height={60} rx={4} fill="#22c55e" />
    <circle cx={37.5} cy={45} r={25} fill="#f8fafc" />
    <circle cx={37.5} cy={45} r={15} fill="#e2e8f0" />
    {["VCC","OUT","GND"].map((l, i) => <Pin key={i} x={14 + i*24} y={84} label={l} />)}
  </svg>
);

export const Mpu6050 = () => (
  <svg width={85} height={65} viewBox="0 0 85 65" style={{ display: 'block' }}>
    <rect x={0} y={0} width={85} height={50} rx={4} fill="#1e3a8a" />
    <rect x={40} y={15} width={20} height={20} rx={2} fill="#0f172a" />
    <text x={20} y={30} fill="white" fontSize={10} fontWeight="bold">MPU</text>
    {["VCC","GND","SCL","SDA"].map((l, i) => <Pin key={i} x={10 + i*21} y={60} label={l} />)}
  </svg>
);

export const HcSr04 = () => (
  <svg width={110} height={65} viewBox="0 0 110 65" style={{ display: 'block' }}>
    <rect x={0} y={0} width={110} height={50} rx={4} fill="#2563eb" />
    <circle cx={30} cy={25} r={18} fill="#e2e8f0" />
    <circle cx={30} cy={25} r={8} fill="#333" />
    <circle cx={80} cy={25} r={18} fill="#e2e8f0" />
    <circle cx={80} cy={25} r={8} fill="#333" />
    {["VCC","TRIG","ECHO","GND"].map((l, i) => <Pin key={i} x={20 + i*23} y={60} label={l} />)}
  </svg>
);

export const FlameSensor = () => (
  <svg width={70} height={90} viewBox="0 0 70 90" style={{ display: 'block' }}>
    <rect x={0} y={20} width={70} height={55} rx={4} fill="#7e22ce" />
    <circle cx={55} cy={15} r={6} fill="#0f172a" />
    <text x={35} y={50} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">FLAME</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*16} y={84} label={l} />)}
  </svg>
);

export const GasSensor = () => (
  <svg width={80} height={100} viewBox="0 0 80 100" style={{ display: 'block' }}>
    <rect x={0} y={30} width={80} height={55} rx={4} fill="#1e293b" />
    <rect x={20} y={5} width={40} height={25} fill="#475569" />
    <path d="M20 10 H60 M20 15 H60 M20 20 H60 M25 5 V30 M35 5 V30 M45 5 V30 M55 5 V30" stroke="#94a3b8" />
    <text x={40} y={65} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle">MQ-2</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*20} y={94} label={l} />)}
  </svg>
);

export const HeartbeatSensor = () => (
  <svg width={70} height={90} viewBox="0 0 70 90" style={{ display: 'block' }}>
    <rect x={0} y={15} width={70} height={60} rx={35} fill="#b91c1c" />
    <ellipse cx={35} cy={45} rx={15} ry={10} fill="#fca5a5" />
    {["VCC","SIG","GND"].map((l, i) => <Pin key={i} x={12 + i*23} y={84} label={l} />)}
  </svg>
);

export const SoundSensor = () => (
  <svg width={75} height={90} viewBox="0 0 75 90" style={{ display: 'block' }}>
    <rect x={0} y={20} width={75} height={55} rx={4} fill="#2563eb" />
    <circle cx={15} cy={15} r={10} fill="#94a3b8" />
    <circle cx={15} cy={15} r={6} fill="#475569" />
    <text x={45} y={50} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">MIC</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*18} y={84} label={l} />)}
  </svg>
);

export const LoadCellHx711 = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block' }}>
    <rect x={0} y={0} width={90} height={70} rx={4} fill="#166534" />
    <rect x={35} y={25} width={20} height={20} rx={2} fill="#0f172a" />
    {["E+","E-","A+","A-","DT","SCK","VCC","GND"].map((l, i) => <Pin key={i} x={9 + i*11} y={84} label={l} color={i<4?"#f87171":"#22d3ee"} />)}
  </svg>
);

/* ── Inputs ── */
export const MembraneKeypad = () => (
  <svg width={90} height={120} viewBox="0 0 90 120" style={{ display: 'block' }}>
    <rect x={0} y={0} width={70} height={120} rx={4} fill="#0f172a" />
    {[1,2,3,4].map(r => [1,2,3,4].map(c => <rect key={`${r}${c}`} x={4+c*14} y={5+r*20} width={10} height={14} rx={2} fill="#334155" />))}
    {[1,2,3,4,5,6,7,8].map(i => <Pin key={i} x={84} y={15 + i*13} label={`P${i}`} />)}
  </svg>
);

export const RotaryEncoder = () => (
  <svg width={65} height={90} viewBox="0 0 65 90" style={{ display: 'block' }}>
    <rect x={5} y={25} width={55} height={50} rx={4} fill="#334155" />
    <circle cx={32.5} cy={20} r={15} fill="#94a3b8" />
    <path d="M 32.5 5 V 35 M 17.5 20 H 47.5" stroke="#475569" strokeWidth={2} />
    {["CLK","DT","SW","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*11} y={84} label={l} />)}
  </svg>
);

export const AnalogJoystick = () => (
  <svg width={85} height={95} viewBox="0 0 85 95" style={{ display: 'block' }}>
    <rect x={0} y={15} width={85} height={65} rx={4} fill="#166534" />
    <circle cx={42.5} cy={45} r={25} fill="#0f172a" opacity={0.6} />
    <circle cx={42.5} cy={45} r={15} fill="#475569" />
    {["VRX","VRY","SW","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*16} y={90} label={l} />)}
  </svg>
);

export const DipSwitch8 = () => (
  <svg width={115} height={65} viewBox="0 0 115 65" style={{ display: 'block' }}>
    <rect x={0} y={0} width={115} height={45} rx={4} fill="#dc2626" />
    {[1,2,3,4,5,6,7,8].map(i => <rect key={i} x={0 + i*11} y={10} width={6} height={16} rx={1} fill="#f8fafc" />)}
    {[1,2,3,4,5,6,7,8].map(i => <Pin key={i} x={3 + i*11} y={58} label={i} />)}
    <Pin x={105} y={58} label="COM" color="#f59e0b" />
  </svg>
);

export const SlideSwitch = () => (
  <svg width={55} height={55} viewBox="0 0 55 55" style={{ display: 'block' }}>
    <rect x={5} y={10} width={45} height={30} rx={4} fill="#64748b" />
    <rect x={10} y={15} width={10} height={20} rx={2} fill="#0f172a" />
    <Pin x={12} y={50} label="1" />
    <Pin x={27} y={50} label="2" />
    <Pin x={43} y={50} label="3" />
  </svg>
);

export const NeopixelRing = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block' }}>
    <circle cx={45} cy={45} r={40} fill="#1e293b" />
    <circle cx={45} cy={45} r={25} fill="#0f172a" />
    {[...Array(12)].map((_, i) => (
      <circle key={i} cx={45 + 32*Math.cos(i*Math.PI/6)} cy={45 + 32*Math.sin(i*Math.PI/6)} r={3} fill="#a855f7" />
    ))}
    {["5V","DIN","GND"].map((l, i) => <Pin key={i} x={25 + i*20} y={84} label={l} />)}
  </svg>
);

/* ── Motors & Individual Outputs ── */
export const StepperMotor = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block' }}>
    <circle cx={45} cy={40} r={35} fill="#cbd5e1" />
    <circle cx={45} cy={40} r={10} fill="#f8fafc" />
    <circle cx={45} cy={40} r={3} fill="#334155" />
    <rect x={15} y={75} width={60} height={5} fill="#0ea5e9" />
    {["A+","A-","B+","B-"].map((l, i) => <Pin key={i} x={20 + i*16} y={84} label={l} color="#f59e0b" />)}
  </svg>
);

export const NeopixelPixel = () => (
  <svg width={50} height={55} viewBox="0 0 50 55" style={{ display: 'block' }}>
    <rect x={10} y={10} width={30} height={30} rx={2} fill="#f8fafc" />
    <circle cx={25} cy={25} r={10} fill="#a855f7" />
    {["5V","DIN","GND"].map((l, i) => <Pin key={i} x={10 + i*15} y={50} label={l} />)}
  </svg>
);

/* ── Comms & ICs ── */
export const IrReceiver = () => (
  <svg width={50} height={70} viewBox="0 0 50 70" style={{ display: 'block' }}>
    <rect x={10} y={15} width={30} height={40} rx={15} fill="#111827" />
    <circle cx={25} cy={30} r={8} fill="#334155" />
    {["OUT","VCC","GND"].map((l, i) => <Pin key={i} x={12 + i*13} y={64} label={l} />)}
  </svg>
);

export const IrRemote = () => (
  <svg width={75} height={130} viewBox="0 0 75 130" style={{ display: 'block' }}>
    <rect x={5} y={5} width={65} height={120} rx={10} fill="#111827" />
    <circle cx={37.5} cy={20} r={6} fill="#ef4444" />
    {[35, 55, 75, 95].map(y => [20, 37.5, 55].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill="#334155" />))}
  </svg>
);

export const Ds1307Rtc = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block' }}>
    <rect x={0} y={0} width={90} height={75} rx={4} fill="#166534" />
    <circle cx={25} cy={35} r={20} fill="#e2e8f0" />
    <text x={25} y={40} fill="#64748b" fontSize={10} textAnchor="middle">CR2032</text>
    <rect x={55} y={20} width={20" height={30} rx={2} fill="#0f172a" />
    {["VCC","GND","SCL","SDA"].map((l, i) => <Pin key={i} x={15 + i*20} y={84} label={l} />)}
  </svg>
);

export const MicroSdModule = () => (
  <svg width={80} height={75} viewBox="0 0 80 75" style={{ display: 'block' }}>
    <rect x={0} y={0} width={80} height={60} rx={4} fill="#2563eb" />
    <rect x={15} y={5} width={50} height={40} fill="#e2e8f0" />
    <rect x={20} y={10} width={40} height={30} fill="#0f172a" />
    {["VCC","GND","MISO","MOSI","SCK","CS"].map((l, i) => <Pin key={i} x={8 + i*13} y={70} label={l} />)}
  </svg>
);

export const ShiftRegister = () => (
  <svg width={100} height={110} viewBox="0 0 100 110" style={{ display: 'block' }}>
    <rect x={20} y={10} width={60} height={90} rx={4} fill="#0f172a" />
    <text x={50} y={60} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" transform="rotate(-90 50 60)">74HC595</text>
    {[18,34,50,66,82,98].map(y => {
       /* Dummy map */
    })}
    {/* Explicit Left Pins */}
    {["VCC","Q0","DS","OE","STCP","SHCP","MR","Q7'"].map((l, i) => <Pin key={i} x={10} y={15 + i*11} label={l} color={i===0?"#facc15":"#22d3ee"} />)}
    {/* Explicit Right Pins */}
    {["Q7","Q6","Q5","Q4","Q3","Q2","Q1","GND"].map((l, i) => <Pin key={i} x={90} y={15 + i*11} label={l} color={i===7?"#facc15":"#22d3ee"} />)}
  </svg>
);

export const RelayModule = () => (
  <svg width={90} height={100} viewBox="0 0 90 100" style={{ display: 'block' }}>
    <rect x={0} y={0} width={90} height={80} rx={4} fill="#2563eb" />
    <rect x={10} y={10} width={40} height={60} fill="#3b82f6" />
    <text x={30} y={45} fill="white" fontSize={12} textAnchor="middle">RELAY</text>
    {["IN","VCC","GND"].map((l, i) => <Pin key={i} x={15 + i*16} y={94} label={l} />)}
    {["COM","NO","NC"].map((l, i) => <Pin key={i} x={60 + i*12} y={94} label={l} color="#f59e0b" />)}
  </svg>
);

export const LedMatrix8x8 = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block' }}>
    <rect x={0} y={15} width={90} height={60} rx={4} fill="#111827" />
    {[1,2,3,4,5,6,7,8].map(r => [1,2,3,4,5,6,7,8].map(c => <circle key={`${r}${c}`} cx={5+c*9} cy={16+r*7} r={2} fill="#ef4444" opacity={0.3} />))}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`T${i}`} x={12 + i*9} y={5} label={`C${i}`} />)}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`B${i}`} x={12 + i*9} y={85} label={`R${i}`} />)}
  </svg>
);
