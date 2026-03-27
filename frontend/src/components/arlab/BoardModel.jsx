import { Html } from "@react-three/drei";

export default function BoardModel(props) {
  // Ultra-detailed Arduino Uno for withdiode.com parity
  return (
    <group {...props}>
      {/* PCB Base - High-quality Teal Blue (#00979C) */}
      <mesh receiveShadow castShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[1.8, 0.045, 1.2]} />
        <meshStandardMaterial color="#008184" roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Silk Screen Markings - Labels, Logos, etc. */}
      <group position={[0, 0.045, 0]}>
        <Html position={[0.4, 0, 0.15]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ fontSize: "1.8px", color: "#fff", opacity: 0.7, fontWeight: 900, fontFamily: "sans-serif" }}>ARDUINO</div>
        </Html>
        <Html position={[0.4, 0, 0.35]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ fontSize: "2.4px", color: "#fff", opacity: 0.8, fontWeight: 800 }}>UNO</div>
        </Html>
      </group>

      {/* Main Microcontroller ATmega328P */}
      <group position={[0.1, 0.045, -0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.05, 0.18]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Pin indicators along the chip legs */}
        {Array.from({ length: 14 }).map((_, i) => (
          <group key={`chip-leg-${i}`} position={[-0.3 + i * 0.046, -0.01, 0.1]}>
             <mesh><boxGeometry args={[0.01, 0.03, 0.02]} /><meshStandardMaterial color="#c0c0c0" /></mesh>
             <mesh position={[0, 0, -0.2]}><boxGeometry args={[0.01, 0.03, 0.02]} /><meshStandardMaterial color="#c0c0c0" /></mesh>
          </group>
        ))}
      </group>
      
      {/* ── DIGITAL HEADER (Top) ── */}
      <group position={[-0.15, 0.065, 0.52]}>
        <mesh castShadow>
          <boxGeometry args={[1.45, 0.1, 0.12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Labels for Digital Pins */}
        <Html position={[0, 0.055, 0.08]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "2.5px", fontSize: "1.4px", color: "#fff", opacity: 0.5, fontWeight: 700, fontFamily: "monospace" }}>
            <span>AREF</span><span>GND</span><span>13</span><span>12</span><span>~11</span><span>~10</span><span>~9</span><span>8</span><span>|</span><span>7</span><span>~6</span><span>~5</span><span>4</span><span>~3</span><span>2</span><span>TX1</span><span>RX0</span>
          </div>
        </Html>
      </group>

      {/* ── POWER / ANALOG HEADERS (Bottom) ── */}
      <group position={[0.35, 0.065, -0.52]}>
        <mesh castShadow><boxGeometry args={[0.7, 0.1, 0.12]} /><meshStandardMaterial color="#111" /></mesh>
        <Html position={[0, 0.055, -0.08]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "4px", fontSize: "1.4px", color: "#fff", opacity: 0.5, fontWeight: 700 }}>
             <span>IO</span><span>RE</span><span>3V</span><span>5V</span><span>GND</span><span>GND</span><span>VIN</span>
          </div>
        </Html>
      </group>
      <group position={[-0.45, 0.065, -0.52]}>
        <mesh castShadow><boxGeometry args={[0.6, 0.1, 0.12]} /><meshStandardMaterial color="#111" /></mesh>
        <Html position={[0, 0.055, -0.08]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "6px", fontSize: "1.4px", color: "#fff", opacity: 0.5, fontWeight: 700 }}>
             <span>A0</span><span>A1</span><span>A2</span><span>A3</span><span>A4</span><span>A5</span>
          </div>
        </Html>
      </group>
      
      {/* Components with depth */}
      <group position={[-0.8, 0.12, -0.35]}>
        <mesh castShadow><boxGeometry args={[0.45, 0.2, 0.35]} /><meshStandardMaterial color="#c0c5ce" metalness={1} roughness={0.1} /></mesh>
        <mesh position={[0.22, -0.02, 0]}><boxGeometry args={[0.02, 0.14, 0.25]} /><meshStandardMaterial color="#111" /></mesh>
      </group>

      <group position={[-0.8, 0.1, 0.35]}>
        <mesh castShadow><boxGeometry args={[0.35, 0.18, 0.3]} /><meshStandardMaterial color="#111" roughness={0.8} /></mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 0.02, 20]} /><meshStandardMaterial color="#222" /></mesh>
      </group>

      {/* Silver OSC Crystal */}
      <mesh position={[-0.2, 0.04, -0.1]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.15, 0.04, 0.08]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ICSP pins gold */}
      <group position={[0.75, 0.1, 0]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`icsp-${i}`} position={[(i % 2) * 0.1 - 0.05, 0, Math.floor(i / 2) * 0.1 - 0.1]}>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
