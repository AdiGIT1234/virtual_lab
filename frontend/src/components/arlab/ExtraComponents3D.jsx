import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PeripheralSimulator } from "../../engine/PeripheralSimulator";

// ──────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────────────

// PCB body + optional silkscreen label. Bottom face sits at y=0.
function Pcb({ w, d, h = 0.02, color = "#0f5132", emissive = "#000", emissiveIntensity = 0, label }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.12}
          emissive={emissive} emissiveIntensity={emissiveIntensity} />
      </mesh>
      {label && (
        <Text position={[0, h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.009} color="#a3e635" anchorX="center" anchorY="middle" maxWidth={w * 0.9}>
          {label}
        </Text>
      )}
    </group>
  );
}

// Vertical pin lead.
function PinLead({ x = 0, z = 0, len = 0.05, color = "#c0a830", radius = 0.003 }) {
  return (
    <mesh position={[x, -len / 2, z]}>
      <cylinderGeometry args={[radius, radius, len, 6]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
    </mesh>
  );
}

// Row of evenly-spaced leads.
function rowLeads({ count, span, z, len = 0.05, color = "#c0a830", radius = 0.003 }) {
  const out = [];
  if (count <= 0) return out;
  const start = -span / 2;
  const step = count > 1 ? span / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    out.push(<PinLead key={i} x={start + step * i} z={z} len={len} color={color} radius={radius} />);
  }
  return out;
}

// Small indicator LED
function IndicatorLed({ position, color, active }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.004, 0.004, 0.006, 10]} />
      <meshStandardMaterial color={active ? color : "#1f2937"}
        emissive={active ? color : "#000"} emissiveIntensity={active ? 1.0 : 0.05} roughness={0.4} />
    </mesh>
  );
}

const RAINBOW = ["#ff3b30","#ff9500","#ffcc00","#34c759","#5ac8fa","#007aff","#5856d6","#af52de","#ff2d55","#ff9f0a","#30d158","#64d2ff"];

// ──────────────────────────────────────────────────────────────────────────────
// Power / Connectors
// ──────────────────────────────────────────────────────────────────────────────

export function AaBattery3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.025,0.025,0.18,20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0.092,0,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.020,0.020,0.012,16]}/>
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.3}/>
      </mesh>
      <mesh position={[0.100,0,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.008,0.008,0.006,12]}/>
        <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.3}/>
      </mesh>
      <mesh position={[-0.092,0,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.020,0.020,0.008,16]}/>
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4}/>
      </mesh>
      <mesh position={[0.08,-0.04,0]}>
        <cylinderGeometry args={[0.003,0.003,0.08,6]}/>
        <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.2}/>
      </mesh>
      <mesh position={[-0.08,-0.04,0]}>
        <cylinderGeometry args={[0.003,0.003,0.08,6]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.2}/>
      </mesh>
      <Text position={[0,0.032,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.010} color="#a3e635" anchorX="center" anchorY="middle">AA 1.5V</Text>
    </group>
  );
}

export function BenchPsu3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.020,0]}>
        <boxGeometry args={[0.18,0.04,0.12]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3} emissive={emissive} emissiveIntensity={0.15}/>
      </mesh>
      <mesh position={[-0.04,0.041,0.04]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.06,0.025]}/>
        <meshStandardMaterial color="#020617" emissive="#22d3ee" emissiveIntensity={highlighted ? 0.6 : 0.3}/>
      </mesh>
      {[{x:0.05,color:"#ef4444"},{x:0.07,color:"#111827"},{x:-0.07,color:"#111827"}].map((p,i)=>(
        <mesh key={i} position={[p.x,0.050,-0.03]}>
          <cylinderGeometry args={[0.008,0.010,0.020,16]}/>
          <meshStandardMaterial color={p.color} roughness={0.4} metalness={0.6}/>
        </mesh>
      ))}
      <PinLead x={0.05} z={-0.03} len={0.05} color="#ef4444"/>
      <PinLead x={-0.07} z={-0.03} len={0.05} color="#111827"/>
      <Text position={[0,0.042,-0.04]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#a3e635" anchorX="center" anchorY="middle">BENCH PSU</Text>
    </group>
  );
}

export function BuckConverter3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.10} h={0.030} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.15} label="BUCK CONV"/>
      <mesh position={[0,0.046,0]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[0.022,0.010,10,22]}/>
        <meshStandardMaterial color="#7c2d12" roughness={0.7} metalness={0.2}/>
      </mesh>
      <mesh position={[-0.045,0.040,-0.030]}>
        <boxGeometry args={[0.018,0.020,0.018]}/>
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} metalness={0.2}/>
      </mesh>
      <mesh position={[0.045,0.038,0.030]}>
        <cylinderGeometry args={[0.010,0.010,0.022,14]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.4}/>
      </mesh>
      <PinLead x={-0.060} z={-0.040}/><PinLead x={0.060} z={-0.040}/>
      <PinLead x={-0.060} z={0.040}/><PinLead x={0.060} z={0.040}/>
    </group>
  );
}

export function Lm7805Reg3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.040,0]}>
        <boxGeometry args={[0.06,0.08,0.025]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0,0.070,-0.014]}>
        <boxGeometry args={[0.05,0.025,0.002]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.85}/>
      </mesh>
      {[-0.018,0,0.018].map((x,i)=>(
        <mesh key={i} position={[x,-0.020,0]}>
          <cylinderGeometry args={[0.003,0.003,0.04,8]}/>
          <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2}/>
        </mesh>
      ))}
      <Text position={[0,0.082,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#a3e635" anchorX="center" anchorY="middle">LM7805</Text>
    </group>
  );
}

export function FunctionGenerator3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.16} d={0.11} h={0.030} color="#1f2937" emissive={emissive} emissiveIntensity={0.18} label="FUNC GEN"/>
      <mesh position={[-0.030,0.046,0.020]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.07,0.035]}/>
        <meshStandardMaterial color="#020617" emissive="#22d3ee" emissiveIntensity={highlighted ? 0.7 : 0.35}/>
      </mesh>
      <mesh position={[0.050,0.040,0]}>
        <cylinderGeometry args={[0.014,0.014,0.020,16]}/>
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.3}/>
      </mesh>
      {[-0.060,-0.040].map((x,i)=>(
        <mesh key={i} position={[x,0.040,-0.040]}>
          <cylinderGeometry args={[0.008,0.008,0.020,14]}/>
          <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.7}/>
        </mesh>
      ))}
      <PinLead x={-0.060} z={-0.040}/><PinLead x={-0.040} z={-0.040}/>
    </group>
  );
}

export function UsbConnector3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.013,0]}>
        <boxGeometry args={[0.07,0.025,0.03]}/>
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85} emissive={emissive} emissiveIntensity={0.25}/>
      </mesh>
      <mesh position={[0.025,0.013,0]}>
        <boxGeometry args={[0.022,0.012,0.020]}/>
        <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.4}/>
      </mesh>
      <PinLead x={-0.030} z={-0.012}/><PinLead x={0.030} z={-0.012}/>
      <PinLead x={-0.030} z={0.012}/><PinLead x={0.030} z={0.012}/>
      <Text position={[0,0.030,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">USB</Text>
    </group>
  );
}

export function BarrelJack3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.020,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.025,0.025,0.04,20]}/>
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.6} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0.022,0.020,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.010,0.010,0.020,14]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.4}/>
      </mesh>
      <PinLead x={-0.012} z={0}/><PinLead x={0.012} z={0}/>
      <Text position={[0,0.050,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">DC JACK</Text>
    </group>
  );
}

export function ScrewTerminal3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, pinCount = 2 }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  const pitch = 0.024;
  const width = Math.max(0.04, pinCount * pitch + 0.010);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.014,0]}>
        <boxGeometry args={[width,0.028,0.024]}/>
        <meshStandardMaterial color="#15803d" roughness={0.6} metalness={0.15} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      {Array.from({length:pinCount},(_,i)=>{
        const x = -((pinCount-1)/2)*pitch + i*pitch;
        return (
          <group key={i}>
            <mesh position={[x,0.030,0]} rotation={[Math.PI/2,0,0]}>
              <cylinderGeometry args={[0.007,0.007,0.003,12]}/>
              <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.85}/>
            </mesh>
            <mesh position={[x,0.032,0]}>
              <boxGeometry args={[0.010,0.001,0.002]}/>
              <meshStandardMaterial color="#1f2937"/>
            </mesh>
            <PinLead x={x} z={0}/>
          </group>
        );
      })}
      <Text position={[0,0.032,0.014]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">{pinCount}P TERM</Text>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Display / Output
// ──────────────────────────────────────────────────────────────────────────────

export function Lcd1602_3D({ id, wiredPins, position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const [buffer, setBuffer] = useState(new Array(32).fill(" "));
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    PeripheralSimulator.registerComponent(id, 'LCD1602', {
      pins: {
        rs: wiredPins?.rs,
        e: wiredPins?.e,
        d4: wiredPins?.d4,
        d5: wiredPins?.d5,
        d6: wiredPins?.d6,
        d7: wiredPins?.d7,
      },
      onRenderTarget: (newBuffer) => {
        setBuffer([...newBuffer]);
        setIsActive(true);
      },
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const on = active || highlighted || isActive;
  const emissive = on ? "#15803d" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.22} d={0.14} h={0.030} color="#15803d" emissive={emissive} emissiveIntensity={on ? 0.4 : 0.1} label="LCD 16x2"/>
      {/* Display window */}
      <mesh position={[0,0.040,0.005]}>
        <boxGeometry args={[0.16,0.020,0.060]}/>
        <meshStandardMaterial color={on ? "#1a6b5a" : "#134e4a"} roughness={0.4} metalness={0.1}
          emissive={on ? "#0ea5a4" : "#022c22"} emissiveIntensity={on ? 0.7 : 0.15}/>
      </mesh>
      
      {/* Character display */}
      <Text position={[-0.076, 0.052, -0.008]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.016} color={on?"#064e3b":"#1a3a1a"} anchorX="left" anchorY="middle" fontFamily="monospace">
        {buffer.slice(0,16).join("")}
      </Text>
      <Text position={[-0.076, 0.052, 0.014]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.016} color={on?"#064e3b":"#1a3a1a"} anchorX="left" anchorY="middle" fontFamily="monospace">
        {buffer.slice(16,32).join("")}
      </Text>

      {[-0.075,-0.065,-0.055,-0.045].map((x,i)=>(
        <PinLead key={i} x={x} z={-0.060}/>
      ))}
      {on && <pointLight color="#22c55e" intensity={0.4} distance={0.6} decay={2} position={[0,0.06,0]}/>}
    </group>
  );
}

export function EpaperDisplay3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.20} d={0.12} h={0.020} color="#f9fafb" emissive={emissive} emissiveIntensity={0.15} label="E-PAPER"/>
      <mesh position={[0,0.022,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.18,0.10]}/>
        <meshStandardMaterial color="#f5f5dc" roughness={0.9} metalness={0}/>
      </mesh>
      {[-0.030,-0.015,0,0.015,0.030].map((z,i)=>(
        <mesh key={i} position={[0,0.023,z]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[0.14-i*0.005,0.003]}/>
          <meshStandardMaterial color="#9ca3af"/>
        </mesh>
      ))}
      {rowLeads({count:8,span:0.08,z:-0.054})}
    </group>
  );
}

export function LedMatrix3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const t = useRef(0);
  useFrame((_,dt) => { if (active) t.current += dt; });
  const emissive = highlighted ? "#ef4444" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.12} h={0.020} color="#0f172a" emissive={emissive} emissiveIntensity={0.15} label="8x8 LED"/>
      {Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{
        const x = -0.042+c*0.012, z = -0.042+r*0.012;
        // scrolling column pattern when active, checkerboard when highlighted
        const scrollCol = Math.floor(t.current * 6) % 8;
        const lit = active ? (c === scrollCol || c === (scrollCol+1)%8)
                  : (highlighted && ((r+c)%3===0));
        return (
          <mesh key={`${r}-${c}`} position={[x,0.022,z]}>
            <sphereGeometry args={[0.004,6,6]}/>
            <meshStandardMaterial color={lit?"#ff3030":"#5b1717"}
              emissive={lit?"#ff3030":"#1a0606"} emissiveIntensity={lit?0.9:0.1} roughness={0.4}/>
          </mesh>
        );
      }))}
      {rowLeads({count:8,span:0.10,z:-0.054})}
      {active && <pointLight color="#ff3030" intensity={0.2} distance={0.3} decay={2} position={[0,0.04,0]}/>}
    </group>
  );
}

export function LedBarGraph3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, level = 0 }) {
  const emissive = highlighted ? "#22c55e" : "#000";
  const colors = ["#22c55e","#34d399","#84cc16","#a3e635","#facc15","#fcd34d","#fb923c","#f87171","#ef4444","#dc2626"];
  // level 0–1 drives how many bars are lit (0 = none, 1 = all 10)
  const litCount = highlighted ? 10 : Math.round(level * 10);
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.18} d={0.04} h={0.020} color="#1f2937" emissive={emissive} emissiveIntensity={0.15} label="LED BAR"/>
      {Array.from({length:10},(_,i)=>{
        const x = -0.072+i*0.016;
        const lit = i < litCount;
        return (
          <mesh key={i} position={[x,0.030,0]}>
            <cylinderGeometry args={[0.006,0.006,0.020,12]}/>
            <meshStandardMaterial color={lit?colors[i]:"#2d1010"}
              emissive={lit?colors[i]:"#000"} emissiveIntensity={lit?0.85:0} roughness={0.4}/>
          </mesh>
        );
      })}
      {rowLeads({count:10,span:0.144,z:-0.014})}
    </group>
  );
}

export function NeopixelRing3D({ id, type, wiredPins, position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const ringSize = type === 'NEOPIXEL_RING_24' ? 24 : type === 'NEOPIXEL_RING_16' ? 16 : 12;
  const OFF = '#0d1f0d';
  const [colors, setColors] = useState(new Array(ringSize).fill(OFF));

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
          c.push(r === 0 && g === 0 && b === 0 ? OFF : `rgb(${r},${g},${b})`);
        }
        setColors(c);
      },
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins, ringSize]);

  const emissive = (highlighted||active) ? "#a855f7" : "#000";
  const ringR = 0.06;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0,0.006,0]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[ringR,0.012,8,32]}/>
        <meshStandardMaterial color="#064e3b" roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      {Array.from({length:ringSize},(_,i)=>{
        const ang = (i/ringSize)*Math.PI*2;
        const x = Math.cos(ang)*ringR, z = Math.sin(ang)*ringR;
        const litColor = colors[i] !== OFF ? colors[i] : null;
        const lit = litColor !== null || highlighted;
        const c = litColor || RAINBOW[i%RAINBOW.length];
        return (
          <mesh key={i} position={[x,0.018,z]}>
            <cylinderGeometry args={[0.008,0.008,0.012,10]}/>
            <meshStandardMaterial color={lit?c:"#222"}
              emissive={lit?c:"#000"} emissiveIntensity={litColor ? 1.0 : highlighted ? 0.3 : 0.05} roughness={0.4}/>
          </mesh>
        );
      })}
      {rowLeads({count:4,span:0.030,z:-ringR-0.012})}
      <Text position={[0,0.022,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#a3e635" anchorX="center" anchorY="middle">NEOPIXEL</Text>
      {active && <pointLight color="#a855f7" intensity={0.4} distance={0.5} decay={2} position={[0,0.05,0]}/>}
    </group>
  );
}

export function NeopixelMatrix3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#a855f7" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} h={0.020} color="#111827" emissive={emissive} emissiveIntensity={0.18} label="NP 4x4"/>
      {Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>{
        const x = -0.030+c*0.020, z = -0.030+r*0.020;
        const color = RAINBOW[(r*4+c)%RAINBOW.length];
        return (
          <mesh key={`${r}-${c}`} position={[x,0.024,z]}>
            <cylinderGeometry args={[0.008,0.008,0.008,10]}/>
            <meshStandardMaterial color={highlighted?color:"#222"}
              emissive={highlighted?color:"#000"} emissiveIntensity={highlighted?0.9:0.1} roughness={0.4}/>
          </mesh>
        );
      }))}
      {rowLeads({count:4,span:0.040,z:-0.044})}
    </group>
  );
}

export function NeopixelPixel3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const [t,setT] = useState(0);
  useFrame((_,dt)=>{if(highlighted) setT(v=>v+dt);});
  const hue = (t*0.5)%1;
  const color = new THREE.Color().setHSL(hue,1,0.55);
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.05} d={0.05} h={0.020} color="#f3f4f6"
        emissive={highlighted?"#a855f7":"#000"} emissiveIntensity={0.2} label="WS2812"/>
      <mesh position={[0,0.025,0]}>
        <cylinderGeometry args={[0.018,0.018,0.020,16]}/>
        <meshStandardMaterial color={highlighted?`#${color.getHexString()}`:"#1f2937"}
          emissive={highlighted?`#${color.getHexString()}`:"#000"}
          emissiveIntensity={highlighted?0.9:0.1} roughness={0.3}/>
      </mesh>
      {rowLeads({count:4,span:0.035,z:-0.020})}
      {highlighted && <pointLight color={`#${color.getHexString()}`} intensity={0.5} distance={0.4} decay={2} position={[0,0.04,0]}/>}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sensors
// ──────────────────────────────────────────────────────────────────────────────

export function NtcSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0,0.018,0]}>
        <sphereGeometry args={[0.018,12,12]}/>
        <meshStandardMaterial color={highlighted?"#2563eb":"#1d4ed8"} roughness={0.5} metalness={0.2}
          emissive={emissive} emissiveIntensity={0.25}/>
      </mesh>
      <mesh position={[-0.010,-0.020,0]} rotation={[0,0,0.15]}>
        <cylinderGeometry args={[0.0025,0.0025,0.05,6]}/>
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2}/>
      </mesh>
      <mesh position={[0.010,-0.020,0]} rotation={[0,0,-0.15]}>
        <cylinderGeometry args={[0.0025,0.0025,0.05,6]}/>
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2}/>
      </mesh>
      <Text position={[0,0.040,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.009} color="#a3e635" anchorX="center" anchorY="middle">NTC</Text>
    </group>
  );
}

export function Photoresistor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#facc15" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0,0.004,0]}>
        <cylinderGeometry args={[0.018,0.018,0.008,20]}/>
        <meshStandardMaterial color="#f97316" roughness={0.5} metalness={0.1} emissive={emissive} emissiveIntensity={0.3}/>
      </mesh>
      <mesh position={[0,0.009,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.030,0.005]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      <PinLead x={-0.010} z={0}/><PinLead x={0.010} z={0}/>
      <Text position={[0,0.016,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">LDR</Text>
    </group>
  );
}

export function PirSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  const domeGlow = active || highlighted;
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.08} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="PIR HC-SR501"/>
      <mesh position={[0,0.020,0]}>
        <sphereGeometry args={[0.035,16,12,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial color={domeGlow?"#fef3c7":"#f9fafb"} roughness={0.5} metalness={0.1}
          transparent opacity={0.92}
          emissive={domeGlow?"#fef3c7":"#000"} emissiveIntensity={domeGlow?0.4:0}/>
      </mesh>
      <IndicatorLed position={[0.025,0.024,-0.028]} color="#22c55e" active={active}/>
      {rowLeads({count:3,span:0.030,z:-0.034})}
      {active && <pointLight color="#facc15" intensity={0.3} distance={0.5} decay={2} position={[0,0.06,0]}/>}
    </group>
  );
}

export function Mpu6050_3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="MPU-6050"/>
      <mesh position={[0,0.024,0]}>
        <boxGeometry args={[0.020,0.010,0.020]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.05}/>
      </mesh>
      {/* Axis labels on chip */}
      <mesh position={[-0.005,0.029,-0.005]}>
        <cylinderGeometry args={[0.001,0.001,0.001,6]}/>
        <meshStandardMaterial color="#fff"/>
      </mesh>
      {rowLeads({count:4,span:0.040,z:-0.034})}
    </group>
  );
}

export function HcSr04_3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.06} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="HC-SR04"/>
      {[-0.035,0.035].map((x,i)=>(
        <group key={i} position={[x,0.020,0]}>
          <mesh>
            <cylinderGeometry args={[0.018,0.018,0.025,18]}/>
            <meshStandardMaterial color={active?"#60a5fa":"#9ca3af"} roughness={0.4} metalness={0.7}
              emissive={active?"#3b82f6":"#000"} emissiveIntensity={active?0.4:0}/>
          </mesh>
          <mesh position={[0,0.013,0]}>
            <cylinderGeometry args={[0.013,0.013,0.002,18]}/>
            <meshStandardMaterial color="#1f2937"/>
          </mesh>
        </group>
      ))}
      <mesh position={[0,0.014,-0.012]}>
        <boxGeometry args={[0.020,0.008,0.008]}/>
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85}/>
      </mesh>
      {rowLeads({count:4,span:0.040,z:-0.024})}
      {active && <pointLight color="#3b82f6" intensity={0.2} distance={0.4} decay={2} position={[0,0.04,0]}/>}
    </group>
  );
}

export function FlameSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#fb923c" : "#000";
  const flameColor = active ? "#fb923c" : "#1f2937";
  const flameGlow = active ? "#fb923c" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.09} d={0.07} color="#7c2d92" emissive={emissive} emissiveIntensity={0.22} label="FLAME"/>
      <mesh position={[-0.025,0.024,0]}>
        <sphereGeometry args={[0.010,12,10]}/>
        <meshStandardMaterial color={flameColor} emissive={flameGlow} emissiveIntensity={active?1.0:0.1}/>
      </mesh>
      <mesh position={[0.025,0.024,0]}>
        <sphereGeometry args={[0.010,12,10]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.4}/>
      </mesh>
      <mesh position={[0,0.022,-0.022]}>
        <boxGeometry args={[0.020,0.006,0.014]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      <IndicatorLed position={[0.030,0.022,-0.025]} color="#ef4444" active={active}/>
      {rowLeads({count:4,span:0.040,z:-0.030})}
      {active && <pointLight color="#fb923c" intensity={0.5} distance={0.5} decay={2} position={[0,0.05,0]}/>}
    </group>
  );
}

export function GasSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#fb923c" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} label="MQ GAS"/>
      <mesh position={[0,0.035,0]}>
        <cylinderGeometry args={[0.025,0.025,0.030,20]}/>
        <meshStandardMaterial color={active?"#fbbf24":"#9ca3af"} roughness={0.3} metalness={0.9}
          emissive={active?"#f59e0b":"#000"} emissiveIntensity={active?0.3:0}/>
      </mesh>
      <mesh position={[0,0.051,0]}>
        <cylinderGeometry args={[0.022,0.022,0.003,20]}/>
        <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.6}/>
      </mesh>
      <IndicatorLed position={[0.030,0.022,-0.040]} color="#22c55e" active={active}/>
      {rowLeads({count:4,span:0.050,z:-0.044})}
      {active && <pointLight color="#f59e0b" intensity={0.4} distance={0.5} decay={2} position={[0,0.07,0]}/>}
    </group>
  );
}

export function HeartbeatSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const pulseRef = useRef(0);
  useFrame((_,dt)=>{pulseRef.current += dt*4;});
  const beat = (active||highlighted) ? 0.5+0.5*Math.abs(Math.sin(pulseRef.current)) : 0.1;
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.06} color="#7f1d1d"
        emissive={(highlighted||active)?"#ef4444":"#000"} emissiveIntensity={0.25} label="HEARTBEAT"/>
      <mesh position={[-0.008,0.024,0.004]}>
        <sphereGeometry args={[0.010,10,10]}/>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={beat} roughness={0.4}/>
      </mesh>
      <mesh position={[0.008,0.024,0.004]}>
        <sphereGeometry args={[0.010,10,10]}/>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={beat} roughness={0.4}/>
      </mesh>
      <IndicatorLed position={[0.020,0.024,-0.020]} color="#ef4444" active={active||highlighted}/>
      {rowLeads({count:3,span:0.030,z:-0.024})}
    </group>
  );
}

export function SoundSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="SOUND"/>
      <mesh position={[-0.025,0.026,0]}>
        <cylinderGeometry args={[0.015,0.015,0.012,18]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.4}/>
      </mesh>
      <mesh position={[-0.025,0.033,0]}>
        <cylinderGeometry args={[0.013,0.013,0.002,18]}/>
        <meshStandardMaterial color="#475569"/>
      </mesh>
      <mesh position={[0.025,0.026,0]}>
        <boxGeometry args={[0.014,0.014,0.014]}/>
        <meshStandardMaterial color="#0ea5e9" roughness={0.4} metalness={0.3}/>
      </mesh>
      <IndicatorLed position={[0.035,0.022,-0.030]} color="#22d3ee" active={active}/>
      {rowLeads({count:4,span:0.040,z:-0.034})}
    </group>
  );
}

export function Hx711_3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="HX711"/>
      <mesh position={[0,0.024,0]}>
        <boxGeometry args={[0.040,0.008,0.014]}/>
        <meshStandardMaterial color="#0f172a"/>
      </mesh>
      {[-0.020,0.020].map((x,i)=>(
        <mesh key={i} position={[x,0.024,0.024]}>
          <cylinderGeometry args={[0.005,0.005,0.012,12]}/>
          <meshStandardMaterial color="#1f2937"/>
        </mesh>
      ))}
      {rowLeads({count:4,span:0.040,z:-0.044})}
      {rowLeads({count:4,span:0.040,z:0.044})}
    </group>
  );
}

export function RainSensor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="RAIN"/>
      {Array.from({length:12},(_,i)=>{
        const x = -0.050+i*0.009;
        return (
          <mesh key={i} position={[x,0.022,0]}>
            <boxGeometry args={[0.003,0.002,0.080]}/>
            <meshStandardMaterial color={active?"#60a5fa":"#fbbf24"} metalness={0.85} roughness={0.3}
              emissive={active?"#3b82f6":"#000"} emissiveIntensity={active?0.3:0}/>
          </mesh>
        );
      })}
      <IndicatorLed position={[0.040,0.022,-0.040]} color="#3b82f6" active={active}/>
      {rowLeads({count:4,span:0.040,z:-0.044})}
    </group>
  );
}

export function Ttp223Touch3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.07} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="TTP223"/>
      <mesh position={[0,0.022,0]}>
        <cylinderGeometry args={[0.025,0.025,0.004,20]}/>
        <meshStandardMaterial color={(active||highlighted)?"#22d3ee":"#94a3b8"}
          emissive={(active||highlighted)?"#22d3ee":"#000"}
          emissiveIntensity={(active||highlighted)?0.7:0.1} roughness={0.4} metalness={0.7}/>
      </mesh>
      {rowLeads({count:3,span:0.024,z:-0.030})}
    </group>
  );
}

export function Sw420Vibration3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.08} d={0.07} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} label="SW-420"/>
      <mesh position={[0,0.024,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.005,0.005,0.030,12]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7}/>
      </mesh>
      <IndicatorLed position={[0.020,0.024,-0.020]} color="#22d3ee" active={active}/>
      {rowLeads({count:3,span:0.024,z:-0.030})}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Input / Control
// ──────────────────────────────────────────────────────────────────────────────

export function RotaryEncoder3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.09} d={0.09} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="ENCODER"/>
      <mesh position={[0,0.040,0]}>
        <cylinderGeometry args={[0.022,0.022,0.040,18]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7}/>
      </mesh>
      <mesh position={[0,0.067,0]}>
        <cylinderGeometry args={[0.006,0.006,0.015,12]}/>
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.4}/>
      </mesh>
      <mesh position={[0,0.060,0.020]}>
        <boxGeometry args={[0.003,0.005,0.005]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      {rowLeads({count:5,span:0.050,z:-0.040})}
    </group>
  );
}

export function AnalogJoystick3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.10} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="JOYSTICK"/>
      <mesh position={[0,0.024,0]}>
        <cylinderGeometry args={[0.022,0.022,0.025,18]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3}/>
      </mesh>
      <mesh position={[0.005,0.058,0]} rotation={[0,0,-0.1]}>
        <cylinderGeometry args={[0.008,0.008,0.040,14]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.2}/>
      </mesh>
      <mesh position={[0.009,0.078,0]}>
        <sphereGeometry args={[0.013,14,12]}/>
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.2}/>
      </mesh>
      {rowLeads({count:5,span:0.060,z:-0.044})}
    </group>
  );
}

export function DipSwitch3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.013,0]}>
        <boxGeometry args={[0.14,0.025,0.06]}/>
        <meshStandardMaterial color="#b91c1c" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      {Array.from({length:8},(_,i)=>{
        const x = -0.058+i*0.0166;
        return (
          <mesh key={i} position={[x,0.028,0]}>
            <boxGeometry args={[0.010,0.004,0.012]}/>
            <meshStandardMaterial color="#f9fafb" roughness={0.6} metalness={0.1}/>
          </mesh>
        );
      })}
      {rowLeads({count:8,span:0.112,z:-0.028})}
      {rowLeads({count:8,span:0.112,z:0.028})}
      <Text position={[0,0.028,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#fff" anchorX="center" anchorY="middle">DIP-8</Text>
    </group>
  );
}

export function SlideSwitch3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.07} d={0.05} color="#374151" emissive={emissive} emissiveIntensity={0.2} label="SLIDE SW"/>
      <mesh position={[0,0.025,0]}>
        <boxGeometry args={[0.040,0.012,0.018]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.7}/>
      </mesh>
      <mesh position={[0.008,0.034,0]}>
        <boxGeometry args={[0.012,0.008,0.010]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4}/>
      </mesh>
      {rowLeads({count:3,span:0.024,z:-0.020})}
    </group>
  );
}

export function MembraneKeypad3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  const keyLabels = ["1","2","3","A","4","5","6","B","7","8","9","C","*","0","#","D"];
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.14} d={0.14} h={0.010} color="#0f172a" emissive={emissive} emissiveIntensity={0.2} label="4x4 KEYPAD"/>
      {Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>{
        const x = -0.045+c*0.030, z = -0.045+r*0.030;
        return (
          <group key={`${r}-${c}`}>
            <mesh position={[x,0.013,z]}>
              <boxGeometry args={[0.024,0.006,0.024]}/>
              <meshStandardMaterial color={highlighted?"#1e3a5f":"#374151"} roughness={0.7} metalness={0.1}/>
            </mesh>
            <Text position={[x,0.020,z]} rotation={[-Math.PI/2,0,0]} fontSize={0.007}
              color={highlighted?"#60a5fa":"#9ca3af"} anchorX="center" anchorY="middle">
              {keyLabels[r*4+c]}
            </Text>
          </group>
        );
      }))}
      {Array.from({length:8},(_,i)=>(
        <PinLead key={i} x={-0.035+i*0.010} z={-0.064} len={0.05} radius={0.0022}/>
      ))}
    </group>
  );
}

export function IrReceiver3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.005,0]}>
        <boxGeometry args={[0.030,0.010,0.020]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0,0.013,0]}>
        <sphereGeometry args={[0.018,14,12,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial color={active?"#7c3aed":"#1a1a1a"} roughness={0.4} metalness={0.2}
          emissive={active?"#7c3aed":"#000"} emissiveIntensity={active?0.5:0}/>
      </mesh>
      {rowLeads({count:3,span:0.018,z:-0.008})}
      <Text position={[0,0.018,0.012]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">IR RX</Text>
    </group>
  );
}

export function IrRemote3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.008,0]}>
        <boxGeometry args={[0.08,0.015,0.16]}/>
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.2} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0,0.016,-0.072]}>
        <sphereGeometry args={[0.006,10,10]}/>
        <meshStandardMaterial color={highlighted?"#fb923c":"#7f1d1d"}
          emissive={highlighted?"#fb923c":"#000"} emissiveIntensity={highlighted?0.8:0.1}/>
      </mesh>
      {Array.from({length:6},(_,r)=>Array.from({length:3},(_,c)=>{
        const x = -0.022+c*0.022, z = -0.040+r*0.018;
        return (
          <mesh key={`${r}-${c}`} position={[x,0.017,z]}>
            <cylinderGeometry args={[0.007,0.007,0.002,12]}/>
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.1}/>
          </mesh>
        );
      }))}
      <Text position={[0,0.020,-0.060]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#a3e635" anchorX="center" anchorY="middle">IR REMOTE</Text>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Motor / Mechatronic
// ──────────────────────────────────────────────────────────────────────────────

export function StepperMotor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const spinRef = useRef(0);
  useFrame((_,dt)=>{ if(active||highlighted) spinRef.current += dt*(active?3:1.5); });
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.040,0]}>
        <cylinderGeometry args={[0.055,0.055,0.080,24]}/>
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.85} emissive={emissive} emissiveIntensity={0.15}/>
      </mesh>
      <mesh position={[0,0.081,0]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[0.055,24]}/>
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.7}/>
      </mesh>
      <mesh position={[0,0.095,0]} rotation={[0,spinRef.current,0]}>
        <cylinderGeometry args={[0.008,0.008,0.025,14]}/>
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6}/>
      </mesh>
      <mesh position={[0.004,0.100,0]} rotation={[0,spinRef.current,0]}>
        <boxGeometry args={[0.003,0.018,0.008]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      {[{x:-0.012,c:"#ef4444"},{x:-0.004,c:"#f59e0b"},{x:0.004,c:"#22c55e"},{x:0.012,c:"#3b82f6"}].map((w,i)=>(
        <mesh key={i} position={[w.x,-0.020,-0.040]}>
          <cylinderGeometry args={[0.0025,0.0025,0.060,6]}/>
          <meshStandardMaterial color={w.c} roughness={0.5} metalness={0.2}/>
        </mesh>
      ))}
      <Text position={[0,0.085,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#a3e635" anchorX="center" anchorY="middle">28BYJ-48</Text>
    </group>
  );
}

export function RelayModule3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  const coilEnergized = active;
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="RELAY MODULE"/>
      {/* Relay coil box */}
      <mesh castShadow position={[-0.020,0.030,0]}>
        <boxGeometry args={[0.050,0.040,0.040]}/>
        <meshStandardMaterial color={coilEnergized?"#1e3a8a":"#0f172a"} roughness={0.5} metalness={0.2}
          emissive={coilEnergized?"#3b82f6":"#000"} emissiveIntensity={coilEnergized?0.4:0}/>
      </mesh>
      {/* Logo strip */}
      <mesh position={[-0.020,0.051,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.040,0.012]}/>
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={coilEnergized?0.5:0.2}/>
      </mesh>
      {/* Terminal block */}
      <mesh position={[0.040,0.018,0]}>
        <boxGeometry args={[0.022,0.020,0.060]}/>
        <meshStandardMaterial color="#0ea5e9" roughness={0.5} metalness={0.2}/>
      </mesh>
      {[-0.020,0,0.020].map((z,i)=>(
        <mesh key={i} position={[0.040,0.029,z]} rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.005,0.005,0.002,12]}/>
          <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.3}/>
        </mesh>
      ))}
      {/* Indicator LED */}
      <IndicatorLed position={[0.010,0.024,-0.030]} color="#ef4444" active={coilEnergized}/>
      {rowLeads({count:6,span:0.060,z:0.044})}
      {coilEnergized && <pointLight color="#3b82f6" intensity={0.3} distance={0.5} decay={2} position={[0,0.06,0]}/>}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Comms / Memory
// ──────────────────────────────────────────────────────────────────────────────

export function Ds1307Rtc3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.10} color="#15803d" emissive={emissive} emissiveIntensity={0.2} label="DS1307 RTC"/>
      <mesh position={[-0.025,0.024,0]}>
        <cylinderGeometry args={[0.018,0.018,0.006,22]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.9}/>
      </mesh>
      <mesh position={[-0.025,0.028,0]}>
        <boxGeometry args={[0.010,0.001,0.002]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      <mesh position={[-0.025,0.028,0]}>
        <boxGeometry args={[0.002,0.001,0.010]}/>
        <meshStandardMaterial color="#1f2937"/>
      </mesh>
      <mesh position={[0.025,0.024,0]}>
        <boxGeometry args={[0.020,0.008,0.014]}/>
        <meshStandardMaterial color="#0f172a"/>
      </mesh>
      <mesh position={[0.025,0.024,-0.025]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.005,0.005,0.014,12]}/>
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.3}/>
      </mesh>
      {rowLeads({count:4,span:0.040,z:-0.044})}
    </group>
  );
}

export function MicroSdModule3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <Pcb w={0.12} d={0.08} color="#1e3a8a" emissive={emissive} emissiveIntensity={0.2} label="MicroSD"/>
      <mesh castShadow position={[0,0.024,0.012]}>
        <boxGeometry args={[0.060,0.014,0.040]}/>
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.85}/>
      </mesh>
      <mesh position={[0,0.026,0.032]}>
        <boxGeometry args={[0.054,0.008,0.002]}/>
        <meshStandardMaterial color="#0f172a"/>
      </mesh>
      <mesh position={[0.040,0.022,-0.020]}>
        <boxGeometry args={[0.020,0.006,0.010]}/>
        <meshStandardMaterial color="#0f172a"/>
      </mesh>
      {rowLeads({count:6,span:0.060,z:-0.034})}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Logic / Analog ICs
// ──────────────────────────────────────────────────────────────────────────────

export function LogicGate3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, gateType = "AND", active = false }) {
  const emissive = highlighted ? "#22d3ee" : "#000";
  const dotColorMap = {
    AND:"#22c55e", OR:"#3b82f6", NOT:"#ef4444",
    NAND:"#a855f7", NOR:"#f59e0b", XOR:"#06b6d4", DFF:"#ec4899",
  };
  const dotColor = dotColorMap[gateType] || "#cbd5e1";
  const labelMap = { AND:"74HC08",OR:"74HC32",NOT:"74HC04",NAND:"74HC00",NOR:"74HC02",XOR:"74HC86",DFF:"74HC74" };
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.013,0]}>
        <boxGeometry args={[0.08,0.025,0.05]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      {/* Notch */}
      <mesh position={[-0.034,0.026,0]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.004,0.004,0.001,12,1,false,0,Math.PI]}/>
        <meshStandardMaterial color="#020617"/>
      </mesh>
      {/* Gate-type color dot */}
      <mesh position={[0.020,0.027,-0.012]}>
        <cylinderGeometry args={[0.005,0.005,0.001,12]}/>
        <meshStandardMaterial color={dotColor} emissive={dotColor} emissiveIntensity={highlighted?0.8:0.3}/>
      </mesh>
      {/* Output indicator */}
      <IndicatorLed position={[0.030,0.026,0.014]} color={dotColor} active={active}/>
      {/* IC label */}
      <Text position={[0,0.027,0.010]} rotation={[-Math.PI/2,0,0]} fontSize={0.007}
        color="#94a3b8" anchorX="center" anchorY="middle">{labelMap[gateType]||"74HC"}</Text>
      {rowLeads({count:4,span:0.050,z:-0.024,radius:0.0025})}
      {rowLeads({count:4,span:0.050,z:0.024,radius:0.0025})}
    </group>
  );
}

export function MosfetTransistor3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, type = "N", active = false }) {
  const bodyColor = type === "P" ? "#1d4ed8" : "#1f2937";
  const emissive = (highlighted||active) ? "#22d3ee" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.060,0]}>
        <boxGeometry args={[0.06,0.12,0.025]}/>
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} emissive={emissive} emissiveIntensity={active?0.4:0.2}/>
      </mesh>
      <mesh position={[0,0.110,-0.014]}>
        <boxGeometry args={[0.05,0.040,0.002]}/>
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.85}/>
      </mesh>
      {[-0.020,0,0.020].map((x,i)=>(
        <mesh key={i} position={[x,-0.020,0]}>
          <cylinderGeometry args={[0.003,0.003,0.04,8]}/>
          <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2}/>
        </mesh>
      ))}
      <Text position={[0,0.122,0]} rotation={[-Math.PI/2,0,0]} fontSize={0.008} color="#a3e635" anchorX="center" anchorY="middle">{type}-MOSFET</Text>
      {active && <pointLight color="#22d3ee" intensity={0.2} distance={0.4} decay={2} position={[0,0.08,0]}/>}
    </group>
  );
}

export function OptocouplerIC3D({ position = [0,0,0], rotation = [0,0,0], highlighted = false, active = false }) {
  const emissive = (highlighted||active) ? "#facc15" : "#000";
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0,0.013,0]}>
        <boxGeometry args={[0.06,0.025,0.04]}/>
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.1} emissive={emissive} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[-0.015,0.026,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.020,0.030]}/>
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={(active||highlighted)?0.8:0.15}/>
      </mesh>
      <Text position={[0,0.027,0.010]} rotation={[-Math.PI/2,0,0]} fontSize={0.007} color="#94a3b8" anchorX="center" anchorY="middle">4N35</Text>
      {rowLeads({count:2,span:0.024,z:-0.020,radius:0.0025})}
      {rowLeads({count:2,span:0.024,z:0.020,radius:0.0025})}
    </group>
  );
}
