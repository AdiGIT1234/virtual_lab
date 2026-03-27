import * as THREE from "three";

import { Html } from "@react-three/drei";

export default function BoardModel(props) {
  return (
    <group {...props}>
      {/* PCB Base with beveled edge and rich color */}
      <mesh receiveShadow castShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[1.8, 0.04, 1.1]} />
        <meshStandardMaterial color="#0b3d66" roughness={0.4} metalness={0.1} />
      </mesh>
      
      {/* Silk Screen Marking (Board Name) */}
      <Html position={[0.2, 0.04, 0.3]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
        <div style={{ fontSize: "3px", color: "#fff", opacity: 0.6, fontWeight: 800, fontFamily: "sans-serif", userSelect: "none" }}>UNO R3</div>
      </Html>

      {/* ATmega328P Chip with notch and labels */}
      <group position={[0.1, 0.045, -0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.04, 0.18]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        <mesh position={[-0.3, 0.01, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.015, 12]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      </group>
      
      {/* Top Header Rail - Digital Pins 0 to 13, GND, AREF */}
      <group position={[-0.1, 0.06, 0.46]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.08, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Hole simulations / Pins */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={`pinh-${i}`} position={[-0.65 + i * 0.09, 0.005, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.04]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
        {/* Silk labels */}
        <Html position={[0, 0.045, 0.06]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "5.5px", fontSize: "1.2px", color: "#fff", opacity: 0.4, fontWeight: 700, fontFamily: "monospace" }}>
            <span>AREF</span><span>GND</span><span>13</span><span>12</span><span>~11</span><span>~10</span><span>~9</span><span>8</span><span>7</span><span>~6</span><span>~5</span><span>4</span><span>~3</span><span>2</span><span>TX1</span><span>RX0</span>
          </div>
        </Html>
      </group>

      {/* Bottom Header Rail - Power / Analog */}
      <group position={[0.2, 0.06, -0.46]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Labels for Power */}
        <Html position={[0, 0.045, -0.06]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "6px", fontSize: "1.2px", color: "#fff", opacity: 0.4, fontWeight: 700, fontFamily: "monospace" }}>
             <span>IOR</span><span>RES</span><span>3V</span><span>5V</span><span>GND</span><span>GND</span><span>VIN</span>
          </div>
        </Html>
      </group>

      <group position={[-0.6, 0.06, -0.46]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Labels for Analog */}
        <Html position={[0, 0.045, -0.06]} rotation={[-Math.PI / 2, 0, 0]} transform occlude center>
          <div style={{ display: "flex", gap: "6px", fontSize: "1.2px", color: "#fff", opacity: 0.4, fontWeight: 700, fontFamily: "monospace" }}>
             <span>A0</span><span>A1</span><span>A2</span><span>A3</span><span>A4</span><span>A5</span>
          </div>
        </Html>
      </group>
      
      {/* USB Port (Detailed Metal Housing) */}
      <group position={[-0.8, 0.1, -0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.18, 0.3]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0.2, -0.02, 0]}>
          <boxGeometry args={[0.02, 0.14, 0.26]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Power Jack (Detailed Housing) */}
      <group position={[-0.8, 0.08, 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.16, 0.25]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
      </group>

      {/* Crystal Oscillator */}
      <mesh position={[-0.2, 0.04, -0.15]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.06]} />
        <meshStandardMaterial color="#c0c5ce" metalness={1} roughness={0.1} />
      </mesh>

      {/* ICSP Header Pins */}
      <group position={[0.7, 0.08, 0]}>
         {Array.from({ length: 6 }).map((_, i) => (
           <mesh key={`icsp-${i}`} position={[(i % 2) * 0.08 - 0.04, 0, Math.floor(i / 2) * 0.08 - 0.08]}>
             <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
             <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
           </mesh>
         ))}
      </group>
    </group>
  );
}
