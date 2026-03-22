import { useState } from "react";
import { Html } from "@react-three/drei";

export default function Capacitor3D({ capacitance = 100, unit = "nF", position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const [showLabel, setShowLabel] = useState(false);

  return (
    <group position={position} rotation={rotation}>
      {/* Body – ceramic disc capacitor */}
      <mesh
        castShadow
        onPointerDown={(e) => { e.stopPropagation(); setShowLabel(!showLabel); }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 28]} />
        <meshStandardMaterial
          color={highlighted ? "#ffb74d" : "#c2884a"}
          roughness={0.5}
          metalness={0.15}
          emissive={highlighted ? "#ff9800" : "#000000"}
          emissiveIntensity={highlighted ? 0.1 : 0}
        />
      </mesh>

      {/* Top label ring */}
      <mesh position={[0, 0.013, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.03, 0.002, 10, 28]} />
        <meshStandardMaterial color="#8d6e3f" />
      </mesh>

      {/* Lead 1 (left) */}
      <mesh position={[-0.015, -0.12, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 10]} />
        <meshStandardMaterial color="#c0c8d4" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Lead 2 (right) */}
      <mesh position={[0.015, -0.12, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 10]} />
        <meshStandardMaterial color="#a0aab4" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Label */}
      {showLabel && (
        <Html position={[0, 0.12, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.85)",
            padding: "3px 8px",
            borderRadius: 5,
            border: "1px solid rgba(255,200,80,0.3)",
            color: "#ffd580",
            fontSize: "11px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
          }}>
            {capacitance} {unit}
          </div>
        </Html>
      )}
    </group>
  );
}
