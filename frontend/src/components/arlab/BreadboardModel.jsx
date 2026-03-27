import { Html } from "@react-three/drei";

export default function BreadboardModel(props) {
  // Advanced Breadboard Model with full withdiode.com parity
  return (
    <group {...props}>
      {/* Main Body - White matte plastic with slight bevel */}
      <mesh receiveShadow castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[3.2, 0.1, 1.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.02} />
      </mesh>
      
      {/* Central Divider Groove */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[3.1, 0.015, 0.08]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* Power Rails (Red/Blue Lines) */}
      <group position={[0, 0.052, 0.48]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.0, 0.005, 0.01]} />
          <meshStandardMaterial color="#df4040" /> {/* Positive Rail */}
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[3.0, 0.005, 0.01]} />
          <meshStandardMaterial color="#4040df" /> {/* Negative Rail */}
        </mesh>
      </group>
      <group position={[0, 0.052, -0.48]}>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[3.0, 0.005, 0.01]} />
          <meshStandardMaterial color="#df4040" /> 
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.0, 0.005, 0.01]} />
          <meshStandardMaterial color="#4040df" />
        </mesh>
      </group>

      {/* Column Labels (1, 5, 10... 60) */}
      <group position={[-1.5, 0.055, 0]}>
         {Array.from({ length: 13 }).map((_, i) => (
           <Html key={`lbl-${i}`} position={[i * 0.25, 0, 0]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.4px", color: "#555", fontWeight: 700, fontFamily: "sans-serif", opacity: 0.8 }}>{(i * 5) || 1}</span>
           </Html>
         ))}
      </group>

      {/* Row Labels (A-J) */}
      <group position={[-1.56, 0.055, -0.15]}>
         {["A", "B", "C", "D", "E"].map((letter, i) => (
           <Html key={`row-t-${i}`} position={[0, 0, -i * 0.06]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.2px", color: "#555", fontWeight: 700 }}>{letter}</span>
           </Html>
         ))}
      </group>
      <group position={[-1.56, 0.055, 0.15]}>
         {["F", "G", "H", "I", "J"].map((letter, i) => (
           <Html key={`row-b-${i}`} position={[0, 0, i * 0.06]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
             <span style={{ fontSize: "1.2px", color: "#555", fontWeight: 700 }}>{letter}</span>
           </Html>
         ))}
      </group>

      {/* Holes Grid - Precise placement */}
      <group position={[-1.47, 0.005, 0]}>
        {Array.from({ length: 60 }).map((_, r) => (
          <group key={`col-${r}`} position={[r * 0.05, 0, 0]}>
             {/* Main logic holes */}
             {Array.from({ length: 5 }).map((_, c) => (
               <group key={`grp-${c}`}>
                  <mesh position={[0, 0, -0.15 - c * 0.06]}>
                    <boxGeometry args={[0.025, 0.005, 0.025]} />
                    <meshStandardMaterial color="#111" roughness={0.9} />
                  </mesh>
                  <mesh position={[0, 0, 0.15 + c * 0.06]}>
                    <boxGeometry args={[0.025, 0.005, 0.025]} />
                    <meshStandardMaterial color="#111" roughness={0.9} />
                  </mesh>
               </group>
             ))}
             {/* Power rail holes */}
             <mesh position={[0, 0, 0.42]}>
               <boxGeometry args={[0.02, 0.005, 0.02]} />
               <meshStandardMaterial color="#111" />
             </mesh>
             <mesh position={[0, 0, 0.51]}>
               <boxGeometry args={[0.02, 0.005, 0.02]} />
               <meshStandardMaterial color="#111" />
             </mesh>
             <mesh position={[0, 0, -0.42]}>
               <boxGeometry args={[0.02, 0.005, 0.02]} />
               <meshStandardMaterial color="#111" />
             </mesh>
             <mesh position={[0, 0, -0.51]}>
               <boxGeometry args={[0.02, 0.005, 0.02]} />
               <meshStandardMaterial color="#111" />
             </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
