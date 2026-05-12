import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ──────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────────────

// A small reusable PCB body. Body sits with bottom face at y=0.
function Pcb({ w, d, h = 0.02, color = "#0f5132", emissive = "#000", emissiveIntensity = 0 }) {
  return (
    <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        roughness={0.6}
        metalness={0.1}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

// A pin lead — vertical cylinder going from PCB bottom down to y=-len.
function PinLead({ x = 0, z = 0, len = 0.05, color = "#c0a830", radius = 0.003 }) {
  return (
    <mesh position={[x, -len / 2, z]}>
      <cylinderGeometry args={[radius, radius, len, 6]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

// Generate `count` lead positions evenly spaced along the X axis at given Z.
function rowLeads({ count, span, z, len = 0.05, color = "#c0a830", radius = 0.003 }) {
  const out = [];
  if (count <= 0) return out;
  const start = -span / 2;
  const step = count > 1 ? span / (count - 1) : 0;
  for (let i = 0; i < count; i += 1) {
    out.push(
      <PinLead key={i} x={start + step * i} z={z} len={len} color={color} radius={radius} />
    );
  }
  return out;
}

const RAINBOW = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#5ac8fa", "#007aff", "#5856d6", "#af52de", "#ff2d55", "#ff9f0a", "#30d158", "#64d2ff"];

// ──────────────────────────────────────────────────────────────────────────────
// Power / Connectors
// ──────────────────────────────────────────────────────────────────────────────

export function AaBattery3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Battery body — lying on its side along X (so leads can drop down) */}
      <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* + cap (yellow) */}
      <mesh position={[0.092, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.020, 0.020, 0.012, 16]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* + nipple */}
      <mesh position={[0.100, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.006, 12]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* - cap */}
      <mesh position={[-0.092, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.020, 0.020, 0.008, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Leads (red on +, black on -) */}
      <mesh position={[0.08, -0.04, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[-0.08, -0.04, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

export function BenchPsu3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.020, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3} emissive={emissive} emissiveIntensity={0.15} />
      </mesh>
      {/* Display window */}
      <mesh position={[-0.04, 0.041, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 0.025]} />
        <meshStandardMaterial color="#020617" emissive="#22d3ee" emissiveIntensity={highlighted ? 0.6 : 0.3} />
      </mesh>
      {/* Binding posts: red, black, black */}
      {[
        { x: 0.05, color: "#ef4444" },
        { x: 0.07, color: "#111827" },
        { x: -0.07, color: "#111827" },
      ].map((p, i) => (
        <mesh key={i} position={[p.x, 0.050, -0.03]}>
          <cylinderGeometry args={[0.008, 0.010, 0.020, 16]} />
          <meshStandardMaterial color={p.color} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Leads */}
      <PinLead x={0.05} z={-0.03} len={0.05} color="#ef4444" />
      <PinLead x={-0.07} z={-0.03} len={0.05} color="#111827" />
    </group>
  );
}

export function BuckConverter3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.10} h={0.030} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.15} />
      {/* Toroidal coil */}
      <mesh position={[0, 0.046, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.010, 10, 22]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Adjustment pot (blue square) */}
      <mesh position={[-0.045, 0.040, -0.030]}>
        <boxGeometry args={[0.018, 0.020, 0.018]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Capacitor */}
      <mesh position={[0.045, 0.038, 0.030]}>
        <cylinderGeometry args={[0.010, 0.010, 0.022, 14]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* 4 corner terminals */}
      <PinLead x={-0.060} z={-0.040} />
      <PinLead x={0.060} z={-0.040} />
      <PinLead x={-0.060} z={0.040} />
      <PinLead x={0.060} z={0.040} />
    </group>
  );
}

export function Lm7805Reg3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* TO-220 plastic body */}
      <mesh castShadow position={[0, 0.040, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.025]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Heatsink tab (metal) */}
      <mesh position={[0, 0.070, -0.014]}>
        <boxGeometry args={[0.05, 0.025, 0.002]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Hole in heatsink */}
      <mesh position={[0, 0.072, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.005, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* 3 silver leads */}
      {[-0.018, 0, 0.018].map((x, i) => (
        <mesh key={i} position={[x, -0.020, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.04, 8]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function FunctionGenerator3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.16} d={0.11} h={0.030} color="#1f2937" emissive={emissive} emissiveIntensity={0.18} />
      {/* Display */}
      <mesh position={[-0.030, 0.046, 0.020]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 0.035]} />
        <meshStandardMaterial color="#020617" emissive="#22d3ee" emissiveIntensity={highlighted ? 0.7 : 0.35} />
      </mesh>
      {/* Dial */}
      <mesh position={[0.050, 0.040, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.020, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* 2 output BNC-style terminals */}
      {[-0.060, -0.040].map((x, i) => (
        <mesh key={i} position={[x, 0.040, -0.040]}>
          <cylinderGeometry args={[0.008, 0.008, 0.020, 14]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      <PinLead x={-0.060} z={-0.040} />
      <PinLead x={-0.040} z={-0.040} />
    </group>
  );
}

export function UsbConnector3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Silver shroud */}
      <mesh castShadow position={[0, 0.013, 0]}>
        <boxGeometry args={[0.07, 0.025, 0.03]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} emissive={emissive} emissiveIntensity={0.25} />
      </mesh>
      {/* Gold inner contacts */}
      <mesh position={[0.025, 0.013, 0]}>
        <boxGeometry args={[0.022, 0.012, 0.020]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* 4 corner leads */}
      <PinLead x={-0.030} z={-0.012} />
      <PinLead x={0.030} z={-0.012} />
      <PinLead x={-0.030} z={0.012} />
      <PinLead x={0.030} z={0.012} />
    </group>
  );
}

export function BarrelJack3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Barrel body — cylinder oriented along X */}
      <mesh castShadow position={[0, 0.020, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 20]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.6} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Inner conductor */}
      <mesh position={[0.022, 0.020, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.010, 0.010, 0.020, 14]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Pin leads */}
      <PinLead x={-0.012} z={0} />
      <PinLead x={0.012} z={0} />
    </group>
  );
}

export function ScrewTerminal3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false, pinCount = 2 }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  const pitch = 0.024;
  const width = Math.max(0.04, pinCount * pitch + 0.010);
  return (
    <group position={position} rotation={rotation}>
      {/* Green terminal block body */}
      <mesh castShadow position={[0, 0.014, 0]}>
        <boxGeometry args={[width, 0.028, 0.024]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} metalness={0.15} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Top screw heads */}
      {Array.from({ length: pinCount }, (_, i) => {
        const x = -((pinCount - 1) / 2) * pitch + i * pitch;
        return (
          <group key={i}>
            <mesh position={[x, 0.030, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.007, 0.007, 0.003, 12]} />
              <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.85} />
            </mesh>
            {/* Slot in screw */}
            <mesh position={[x, 0.032, 0]}>
              <boxGeometry args={[0.010, 0.001, 0.002]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
            <PinLead x={x} z={0} />
          </group>
        );
      })}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Display / Output
// ──────────────────────────────────────────────────────────────────────────────

export function Lcd1602_3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#15803d" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.22} d={0.14} h={0.030} color="#15803d" emissive={emissive} emissiveIntensity={highlighted ? 0.4 : 0.1} />
      {/* Display window — dark teal */}
      <mesh position={[0, 0.040, 0.005]}>
        <boxGeometry args={[0.16, 0.020, 0.060]} />
        <meshStandardMaterial color="#134e4a" roughness={0.4} metalness={0.1} emissive={highlighted ? "#0ea5a4" : "#022c22"} emissiveIntensity={highlighted ? 0.6 : 0.2} />
      </mesh>
      {/* 16 pin header gold pads */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = -0.075 + i * 0.010;
        return (
          <mesh key={i} position={[x, 0.031, -0.060]}>
            <cylinderGeometry args={[0.003, 0.003, 0.001, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Pin leads (just first 4 — most-used) */}
      {[-0.075, -0.065, -0.055, -0.045].map((x, i) => (
        <PinLead key={i} x={x} z={-0.060} />
      ))}
      {highlighted && <pointLight color="#22c55e" intensity={0.4} distance={0.6} decay={2} position={[0, 0.05, 0]} />}
    </group>
  );
}

export function EpaperDisplay3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.20} d={0.12} h={0.020} color="#f9fafb" emissive={emissive} emissiveIntensity={0.15} />
      {/* Off-white display surface */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.10]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.9} metalness={0} />
      </mesh>
      {/* Faint text-like stripes */}
      {[-0.030, -0.015, 0, 0.015, 0.030].map((z, i) => (
        <mesh key={i} position={[0, 0.023, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.14 - i * 0.005, 0.003]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      ))}
      {/* 8 pin leads along one edge */}
      {rowLeads({ count: 8, span: 0.08, z: -0.054 })}
    </group>
  );
}

export function LedMatrix3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#ef4444" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.12} h={0.020} color="#0f172a" emissive={emissive} emissiveIntensity={0.15} />
      {/* 8x8 grid */}
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => {
          const x = -0.042 + c * 0.012;
          const z = -0.042 + r * 0.012;
          const lit = highlighted && ((r + c) % 3 === 0);
          return (
            <mesh key={`${r}-${c}`} position={[x, 0.022, z]}>
              <sphereGeometry args={[0.004, 6, 6]} />
              <meshStandardMaterial
                color={lit ? "#ff3030" : "#5b1717"}
                emissive={lit ? "#ff3030" : "#1a0606"}
                emissiveIntensity={lit ? 0.9 : 0.1}
                roughness={0.4}
              />
            </mesh>
          );
        })
      )}
      {rowLeads({ count: 8, span: 0.10, z: -0.054 })}
    </group>
  );
}

export function LedBarGraph3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22c55e" : "#000000";
  // Green→yellow→red gradient
  const colors = ["#22c55e", "#34d399", "#84cc16", "#a3e635", "#facc15", "#fcd34d", "#fb923c", "#f87171", "#ef4444", "#dc2626"];
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.18} d={0.04} h={0.020} color="#1f2937" emissive={emissive} emissiveIntensity={0.15} />
      {Array.from({ length: 10 }, (_, i) => {
        const x = -0.072 + i * 0.016;
        return (
          <mesh key={i} position={[x, 0.030, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.020, 12]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={highlighted ? colors[i] : "#000"}
              emissiveIntensity={highlighted ? 0.7 : 0.15}
              roughness={0.4}
            />
          </mesh>
        );
      })}
      {rowLeads({ count: 10, span: 0.144, z: -0.014 })}
    </group>
  );
}

export function NeopixelRing3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#a855f7" : "#000000";
  const ledCount = 12;
  const ringR = 0.06;
  return (
    <group position={position} rotation={rotation}>
      {/* PCB ring (torus) */}
      <mesh position={[0, 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringR, 0.012, 8, 32]} />
        <meshStandardMaterial color="#064e3b" roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* LEDs around ring */}
      {Array.from({ length: ledCount }, (_, i) => {
        const ang = (i / ledCount) * Math.PI * 2;
        const x = Math.cos(ang) * ringR;
        const z = Math.sin(ang) * ringR;
        const c = RAINBOW[i % RAINBOW.length];
        return (
          <mesh key={i} position={[x, 0.018, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.012, 10]} />
            <meshStandardMaterial
              color={highlighted ? c : "#222"}
              emissive={highlighted ? c : "#000"}
              emissiveIntensity={highlighted ? 0.9 : 0.1}
              roughness={0.4}
            />
          </mesh>
        );
      })}
      {/* 4 pin leads on south side */}
      {rowLeads({ count: 4, span: 0.030, z: -ringR - 0.012 })}
    </group>
  );
}

export function NeopixelMatrix3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#a855f7" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} h={0.020} color="#111827" emissive={emissive} emissiveIntensity={0.18} />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => {
          const x = -0.030 + c * 0.020;
          const z = -0.030 + r * 0.020;
          const color = RAINBOW[(r * 4 + c) % RAINBOW.length];
          return (
            <mesh key={`${r}-${c}`} position={[x, 0.024, z]}>
              <cylinderGeometry args={[0.008, 0.008, 0.008, 10]} />
              <meshStandardMaterial
                color={highlighted ? color : "#222"}
                emissive={highlighted ? color : "#000"}
                emissiveIntensity={highlighted ? 0.9 : 0.1}
                roughness={0.4}
              />
            </mesh>
          );
        })
      )}
      {rowLeads({ count: 4, span: 0.040, z: -0.044 })}
    </group>
  );
}

export function NeopixelPixel3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const [t, setT] = useState(0);
  useFrame((_, dt) => { if (highlighted) setT((v) => v + dt); });
  const hue = (t * 0.5) % 1;
  const color = new THREE.Color().setHSL(hue, 1, 0.55);
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.05} d={0.05} h={0.020} color="#f3f4f6" emissive={highlighted ? "#a855f7" : "#000"} emissiveIntensity={0.2} />
      {/* Central LED */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.020, 16]} />
        <meshStandardMaterial
          color={highlighted ? `#${color.getHexString()}` : "#1f2937"}
          emissive={highlighted ? `#${color.getHexString()}` : "#000"}
          emissiveIntensity={highlighted ? 0.9 : 0.1}
          roughness={0.3}
        />
      </mesh>
      {rowLeads({ count: 4, span: 0.035, z: -0.020 })}
      {highlighted && <pointLight color={`#${color.getHexString()}`} intensity={0.5} distance={0.4} decay={2} position={[0, 0.04, 0]} />}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sensors
// ──────────────────────────────────────────────────────────────────────────────

export function NtcSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Tiny bead */}
      <mesh position={[0, 0.018, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.25} />
      </mesh>
      {/* 2 angled leads */}
      <mesh position={[-0.010, -0.020, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.05, 6]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.010, -0.020, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.05, 6]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function Photoresistor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#facc15" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Disc */}
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.008, 20]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} metalness={0.1} emissive={emissive} emissiveIntensity={0.3} />
      </mesh>
      {/* Zigzag band on top */}
      <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.030, 0.005]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <PinLead x={-0.010} z={0} />
      <PinLead x={0.010} z={0} />
    </group>
  );
}

export function PirSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.08} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* White dome (Fresnel lens) */}
      <mesh position={[0, 0.020, 0]}>
        <sphereGeometry args={[0.035, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f9fafb" roughness={0.5} metalness={0.1} transparent opacity={0.92} />
      </mesh>
      {rowLeads({ count: 3, span: 0.030, z: -0.034 })}
    </group>
  );
}

export function Mpu6050_3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* IC chip in center */}
      <mesh position={[0, 0.024, 0]}>
        <boxGeometry args={[0.015, 0.008, 0.015]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Marking dot */}
      <mesh position={[-0.005, 0.029, -0.005]}>
        <cylinderGeometry args={[0.001, 0.001, 0.001, 6]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {rowLeads({ count: 4, span: 0.040, z: -0.034 })}
    </group>
  );
}

export function HcSr04_3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.06} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Two transducer eyes */}
      {[-0.035, 0.035].map((x, i) => (
        <group key={i} position={[x, 0.020, 0]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.018, 0.025, 18]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Inner mesh grille (dark) */}
          <mesh position={[0, 0.013, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.002, 18]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      ))}
      {/* Small crystal between eyes */}
      <mesh position={[0, 0.014, -0.012]}>
        <boxGeometry args={[0.020, 0.008, 0.008]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} />
      </mesh>
      {rowLeads({ count: 4, span: 0.040, z: -0.024 })}
    </group>
  );
}

export function FlameSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#fb923c" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.09} d={0.07} color="#7c2d92" emissive={emissive} emissiveIntensity={0.22} />
      {/* IR LED head */}
      <mesh position={[-0.025, 0.024, 0]}>
        <sphereGeometry args={[0.010, 12, 10]} />
        <meshStandardMaterial
          color={highlighted ? "#fb923c" : "#1f2937"}
          emissive={highlighted ? "#fb923c" : "#000"}
          emissiveIntensity={highlighted ? 0.9 : 0.1}
        />
      </mesh>
      {/* Sensor head */}
      <mesh position={[0.025, 0.024, 0]}>
        <sphereGeometry args={[0.010, 12, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Comparator IC */}
      <mesh position={[0, 0.022, -0.022]}>
        <boxGeometry args={[0.020, 0.006, 0.014]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {rowLeads({ count: 4, span: 0.040, z: -0.030 })}
    </group>
  );
}

export function GasSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#fb923c" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Metal can */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.030, 20]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Mesh top */}
      <mesh position={[0, 0.051, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.003, 20]} />
        <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.6} />
      </mesh>
      {rowLeads({ count: 4, span: 0.050, z: -0.044 })}
    </group>
  );
}

export function HeartbeatSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const pulseRef = useRef(0);
  useFrame((_, dt) => { pulseRef.current += dt * 4; });
  const beat = highlighted ? 0.5 + 0.5 * Math.abs(Math.sin(pulseRef.current)) : 0.1;
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.06} color="#7f1d1d" emissive={highlighted ? "#ef4444" : "#000"} emissiveIntensity={0.25} />
      {/* Heart: two overlapping spheres + bottom box */}
      <mesh position={[-0.008, 0.024, 0.004]}>
        <sphereGeometry args={[0.010, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={beat} roughness={0.4} />
      </mesh>
      <mesh position={[0.008, 0.024, 0.004]}>
        <sphereGeometry args={[0.010, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={beat} roughness={0.4} />
      </mesh>
      {/* Indicator LED */}
      <mesh position={[0.020, 0.024, -0.020]}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={beat * 0.8} />
      </mesh>
      {rowLeads({ count: 3, span: 0.030, z: -0.024 })}
    </group>
  );
}

export function SoundSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Microphone capsule */}
      <mesh position={[-0.025, 0.026, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.012, 18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Top mesh */}
      <mesh position={[-0.025, 0.033, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.002, 18]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Pot for sensitivity */}
      <mesh position={[0.025, 0.026, 0]}>
        <boxGeometry args={[0.014, 0.014, 0.014]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.4} metalness={0.3} />
      </mesh>
      {rowLeads({ count: 4, span: 0.040, z: -0.034 })}
    </group>
  );
}

export function HcSr04Alt3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  return <HcSr04_3D position={position} rotation={rotation} highlighted={highlighted} />;
}

export function Hx711_3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* IC chip */}
      <mesh position={[0, 0.024, 0]}>
        <boxGeometry args={[0.040, 0.008, 0.014]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Capacitors */}
      {[-0.020, 0.020].map((x, i) => (
        <mesh key={i} position={[x, 0.024, 0.024]}>
          <cylinderGeometry args={[0.005, 0.005, 0.012, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
      {rowLeads({ count: 4, span: 0.040, z: -0.044 })}
      {rowLeads({ count: 4, span: 0.040, z: 0.044 })}
    </group>
  );
}

export function RainSensor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Parallel copper traces */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = -0.050 + i * 0.009;
        return (
          <mesh key={i} position={[x, 0.022, 0]}>
            <boxGeometry args={[0.003, 0.002, 0.080]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.3} />
          </mesh>
        );
      })}
      {rowLeads({ count: 4, span: 0.040, z: -0.044 })}
    </group>
  );
}

export function Ttp223Touch3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.07} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* Touch pad */}
      <mesh position={[0, 0.022, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.004, 20]} />
        <meshStandardMaterial
          color={highlighted ? "#22d3ee" : "#94a3b8"}
          emissive={highlighted ? "#22d3ee" : "#000"}
          emissiveIntensity={highlighted ? 0.7 : 0.1}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      {rowLeads({ count: 3, span: 0.024, z: -0.030 })}
    </group>
  );
}

export function Sw420Vibration3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.07} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Vibration tube (ball-in-cylinder) */}
      <mesh position={[0, 0.024, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.030, 12]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Indicator LED */}
      <mesh position={[0.020, 0.024, -0.020]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshStandardMaterial
          color={highlighted ? "#22d3ee" : "#1f2937"}
          emissive={highlighted ? "#22d3ee" : "#000"}
          emissiveIntensity={highlighted ? 0.8 : 0.1}
        />
      </mesh>
      {rowLeads({ count: 3, span: 0.024, z: -0.030 })}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Input / Control
// ──────────────────────────────────────────────────────────────────────────────

export function RotaryEncoder3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.09} d={0.09} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* Knob body */}
      <mesh position={[0, 0.040, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.040, 18]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Shaft stub */}
      <mesh position={[0, 0.067, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.015, 12]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Index notch */}
      <mesh position={[0, 0.060, 0.020]}>
        <boxGeometry args={[0.003, 0.005, 0.005]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {rowLeads({ count: 5, span: 0.050, z: -0.040 })}
    </group>
  );
}

export function AnalogJoystick3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* Joystick base */}
      <mesh position={[0, 0.024, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.025, 18]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Stick (tilted slightly) */}
      <mesh position={[0.005, 0.058, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.008, 0.008, 0.040, 14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Cap */}
      <mesh position={[0.009, 0.078, 0]}>
        <sphereGeometry args={[0.013, 14, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.2} />
      </mesh>
      {rowLeads({ count: 5, span: 0.060, z: -0.044 })}
    </group>
  );
}

export function DipSwitch3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Red body */}
      <mesh castShadow position={[0, 0.013, 0]}>
        <boxGeometry args={[0.14, 0.025, 0.06]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* 8 toggles on top */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -0.058 + i * 0.0166;
        return (
          <mesh key={i} position={[x, 0.028, 0]}>
            <boxGeometry args={[0.010, 0.004, 0.012]} />
            <meshStandardMaterial color="#f9fafb" roughness={0.6} metalness={0.1} />
          </mesh>
        );
      })}
      {/* 8 leads each side */}
      {rowLeads({ count: 8, span: 0.112, z: -0.028 })}
      {rowLeads({ count: 8, span: 0.112, z: 0.028 })}
    </group>
  );
}

export function SlideSwitch3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.07} d={0.05} color="#374151" emissive={emissive} emissiveIntensity={0.2} />
      {/* Slider track */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.040, 0.012, 0.018]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Slider knob */}
      <mesh position={[0.008, 0.034, 0]}>
        <boxGeometry args={[0.012, 0.008, 0.010]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4} />
      </mesh>
      {rowLeads({ count: 3, span: 0.024, z: -0.020 })}
    </group>
  );
}

export function MembraneKeypad3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.14} h={0.010} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} />
      {/* 4x4 button grid */}
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => {
          const x = -0.045 + c * 0.030;
          const z = -0.045 + r * 0.030;
          return (
            <mesh key={`${r}-${c}`} position={[x, 0.013, z]}>
              <boxGeometry args={[0.024, 0.006, 0.024]} />
              <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.1} />
            </mesh>
          );
        })
      )}
      {/* 8 ribbon pins on one side */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -0.035 + i * 0.010;
        return <PinLead key={i} x={x} z={-0.064} len={0.05} radius={0.0022} />;
      })}
    </group>
  );
}

export function IrReceiver3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Small PCB stub */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.030, 0.010, 0.020]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.013, 0]}>
        <sphereGeometry args={[0.018, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.2} />
      </mesh>
      {rowLeads({ count: 3, span: 0.018, z: -0.008 })}
    </group>
  );
}

export function IrRemote3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Remote shell */}
      <mesh castShadow position={[0, 0.008, 0]}>
        <boxGeometry args={[0.08, 0.015, 0.16]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* IR LED dome at top */}
      <mesh position={[0, 0.016, -0.072]}>
        <sphereGeometry args={[0.006, 10, 10]} />
        <meshStandardMaterial
          color={highlighted ? "#fb923c" : "#7f1d1d"}
          emissive={highlighted ? "#fb923c" : "#000"}
          emissiveIntensity={highlighted ? 0.8 : 0.1}
        />
      </mesh>
      {/* Button grid */}
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 3 }, (_, c) => {
          const x = -0.022 + c * 0.022;
          const z = -0.040 + r * 0.018;
          return (
            <mesh key={`${r}-${c}`} position={[x, 0.017, z]}>
              <cylinderGeometry args={[0.007, 0.007, 0.002, 12]} />
              <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.1} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Power / Mechatronic
// ──────────────────────────────────────────────────────────────────────────────

export function StepperMotor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const spinRef = useRef(0);
  useFrame((_, dt) => { if (highlighted) spinRef.current += dt * 2; });
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* Motor body cylinder */}
      <mesh castShadow position={[0, 0.040, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.080, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.85} emissive={emissive} emissiveIntensity={0.15} />
      </mesh>
      {/* Top face slightly darker */}
      <mesh position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Output shaft */}
      <mesh position={[0, 0.095, 0]} rotation={[0, spinRef.current, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.025, 14]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Flat on shaft */}
      <mesh position={[0.004, 0.100, 0]} rotation={[0, spinRef.current, 0]}>
        <boxGeometry args={[0.003, 0.018, 0.008]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* 4 colored wires */}
      {[
        { x: -0.012, c: "#ef4444" },
        { x: -0.004, c: "#f59e0b" },
        { x: 0.004, c: "#22c55e" },
        { x: 0.012, c: "#3b82f6" },
      ].map((w, i) => (
        <mesh key={i} position={[w.x, -0.020, -0.040]}>
          <cylinderGeometry args={[0.0025, 0.0025, 0.060, 6]} />
          <meshStandardMaterial color={w.c} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function RelayModule3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* Relay coil box */}
      <mesh castShadow position={[-0.020, 0.030, 0]}>
        <boxGeometry args={[0.050, 0.040, 0.040]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Relay logo strip */}
      <mesh position={[-0.020, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.040, 0.012]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>
      {/* Terminal block (3 screw posts) */}
      <mesh position={[0.040, 0.018, 0]}>
        <boxGeometry args={[0.022, 0.020, 0.060]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} metalness={0.2} />
      </mesh>
      {[-0.020, 0, 0.020].map((z, i) => (
        <mesh key={i} position={[0.040, 0.029, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.002, 12]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* Indicator LED */}
      <mesh position={[0.010, 0.024, -0.030]}>
        <cylinderGeometry args={[0.004, 0.004, 0.006, 10]} />
        <meshStandardMaterial
          color={highlighted ? "#ef4444" : "#7f1d1d"}
          emissive={highlighted ? "#ef4444" : "#000"}
          emissiveIntensity={highlighted ? 0.8 : 0.1}
        />
      </mesh>
      {rowLeads({ count: 6, span: 0.060, z: 0.044 })}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Comms / Memory
// ──────────────────────────────────────────────────────────────────────────────

export function Ds1307Rtc3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} />
      {/* Coin battery */}
      <mesh position={[-0.025, 0.024, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.006, 22]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Battery embossed plus */}
      <mesh position={[-0.025, 0.028, 0]}>
        <boxGeometry args={[0.010, 0.001, 0.002]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.025, 0.028, 0]}>
        <boxGeometry args={[0.002, 0.001, 0.010]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* IC chip */}
      <mesh position={[0.025, 0.024, 0]}>
        <boxGeometry args={[0.020, 0.008, 0.014]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Crystal */}
      <mesh position={[0.025, 0.024, -0.025]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.014, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.3} />
      </mesh>
      {rowLeads({ count: 4, span: 0.040, z: -0.044 })}
    </group>
  );
}

export function MicroSdModule3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} />
      {/* SD card slot */}
      <mesh castShadow position={[0, 0.024, 0.012]}>
        <boxGeometry args={[0.060, 0.014, 0.040]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Slot opening (dark) */}
      <mesh position={[0, 0.026, 0.032]}>
        <boxGeometry args={[0.054, 0.008, 0.002]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Level shifter IC */}
      <mesh position={[0.040, 0.022, -0.020]}>
        <boxGeometry args={[0.020, 0.006, 0.010]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {rowLeads({ count: 6, span: 0.060, z: -0.034 })}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Logic / Analog ICs
// ──────────────────────────────────────────────────────────────────────────────

export function LogicGate3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false, gateType = "AND" }) {
  const emissive = highlighted ? "#22d3ee" : "#000000";
  const dotColor = {
    AND: "#22c55e", OR: "#3b82f6", NOT: "#ef4444",
    NAND: "#a855f7", NOR: "#f59e0b", XOR: "#06b6d4",
    DFF: "#ec4899",
  }[gateType] || "#cbd5e1";
  return (
    <group position={position} rotation={rotation}>
      {/* DIP IC body */}
      <mesh castShadow position={[0, 0.013, 0]}>
        <boxGeometry args={[0.08, 0.025, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Notch (pin 1 indicator) */}
      <mesh position={[-0.034, 0.026, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.001, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      {/* Color dot indicating gate type */}
      <mesh position={[0.020, 0.027, -0.012]}>
        <cylinderGeometry args={[0.005, 0.005, 0.001, 12]} />
        <meshStandardMaterial color={dotColor} emissive={dotColor} emissiveIntensity={highlighted ? 0.8 : 0.3} />
      </mesh>
      {/* 4 leads each side */}
      {rowLeads({ count: 4, span: 0.050, z: -0.024, radius: 0.0025 })}
      {rowLeads({ count: 4, span: 0.050, z: 0.024, radius: 0.0025 })}
    </group>
  );
}

export function MosfetTransistor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false, type = "N" }) {
  const bodyColor = type === "P" ? "#1d4ed8" : "#1f2937";
  const emissive = highlighted ? "#22d3ee" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* TO-220 plastic body */}
      <mesh castShadow position={[0, 0.060, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.025]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Heatsink tab */}
      <mesh position={[0, 0.110, -0.014]}>
        <boxGeometry args={[0.05, 0.040, 0.002]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Mount hole */}
      <mesh position={[0, 0.118, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.004, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* 3 leads (G D S) */}
      {[-0.020, 0, 0.020].map((x, i) => (
        <mesh key={i} position={[x, -0.020, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.04, 8]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function OptocouplerIC3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const emissive = highlighted ? "#facc15" : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* DIP-4 body */}
      <mesh castShadow position={[0, 0.013, 0]}>
        <boxGeometry args={[0.06, 0.025, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Yellow strip indicating LED side */}
      <mesh position={[-0.015, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.020, 0.030]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={highlighted ? 0.5 : 0.15} />
      </mesh>
      {/* 2 leads each side */}
      {rowLeads({ count: 2, span: 0.024, z: -0.020, radius: 0.0025 })}
      {rowLeads({ count: 2, span: 0.024, z: 0.020, radius: 0.0025 })}
    </group>
  );
}
