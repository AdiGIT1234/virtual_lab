import { Html } from "@react-three/drei";

export default function BreadboardModel(props) {
  // Deep dark premium breadboard styling to match diode.com vibe
  const rows = 30; // 30 columns of holes
  const cols = 5;  // 5 holes per side per column

  return (
    <group {...props}>
      {/* Main Base */}
      <mesh receiveShadow castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[1.6, 0.1, 0.5]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.7} metalness={0.05} />
      </mesh>
      
      {/* Central Groove */}
      <mesh receiveShadow castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[1.5, 0.015, 0.04]} />
        <meshStandardMaterial color="#dcdcdc" roughness={0.6} />
      </mesh>

      {/* Numerical Labels for columns */}
      <group position={[-0.725, 0.055, 0]}>
         {Array.from({ length: 6 }).map((_, i) => (
           <Html key={`lbl-${i}`} position={[i * 0.25, 0, 0]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.5px", color: "#888", fontWeight: 700, fontFamily: "monospace" }}>{(i * 5) + 1}</span>
           </Html>
         ))}
      </group>

      {/* ABCDE Labels */}
      <group position={[-0.78, 0.055, -0.05]}>
         {["A", "B", "C", "D", "E"].map((letter, i) => (
           <Html key={`let-top-${i}`} position={[0, 0, -i * 0.035]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.2px", color: "#888", fontWeight: 700, fontFamily: "monospace" }}>{letter}</span>
           </Html>
         ))}
      </group>
      <group position={[-0.78, 0.055, 0.05]}>
         {["F", "G", "H", "I", "J"].map((letter, i) => (
           <Html key={`let-bot-${i}`} position={[0, 0, i * 0.035]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.2px", color: "#888", fontWeight: 700, fontFamily: "monospace" }}>{letter}</span>
           </Html>
         ))}
      </group>

      {/* Holes Grid */}
      <group position={[-0.725, 0.005, 0]}>
        {Array.from({ length: rows }).map((_, r) => (
          <group key={`row-${r}`} position={[r * 0.05, 0, 0]}>
            {/* Top 5 holes */}
            {Array.from({ length: cols }).map((_, c) => (
              <mesh key={`top-hole-${c}`} position={[0, 0, -0.05 - c * 0.035]}>
                <boxGeometry args={[0.02, 0.005, 0.02]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            ))}
            {/* Bottom 5 holes */}
            {Array.from({ length: cols }).map((_, c) => (
              <mesh key={`bot-hole-${c}`} position={[0, 0, 0.05 + c * 0.035]}>
                <boxGeometry args={[0.02, 0.005, 0.02]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Power Rails Holes */}
      <group position={[-0.725, 0.005, 0]}>
        {Array.from({ length: rows }).map((_, r) => (
          <group key={`rail-${r}`} position={[r * 0.05, 0, 0]}>
            {/* Far Top Rails */}
            <mesh position={[0, 0, -0.21]}>
              <boxGeometry args={[0.02, 0.005, 0.02]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0, -0.24]}>
              <boxGeometry args={[0.02, 0.005, 0.02]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            {/* Far Bottom Rails */}
            <mesh position={[0, 0, 0.21]}>
              <boxGeometry args={[0.02, 0.005, 0.02]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0, 0.24]}>
              <boxGeometry args={[0.02, 0.005, 0.02]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Red/Blue Rails Indicators */}
      <mesh receiveShadow castShadow position={[0, 0, -0.19]}>
        <boxGeometry args={[1.5, 0.005, 0.004]} />
        <meshStandardMaterial color="#ff3366" roughness={0.6} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 0, -0.26]}>
        <boxGeometry args={[1.5, 0.005, 0.004]} />
        <meshStandardMaterial color="#33ccff" roughness={0.6} />
      </mesh>
      
      <mesh receiveShadow castShadow position={[0, 0, 0.19]}>
        <boxGeometry args={[1.5, 0.005, 0.004]} />
        <meshStandardMaterial color="#ff3366" roughness={0.6} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 0, 0.26]}>
        <boxGeometry args={[1.5, 0.005, 0.004]} />
        <meshStandardMaterial color="#33ccff" roughness={0.6} />
      </mesh>
    </group>
  );
}
