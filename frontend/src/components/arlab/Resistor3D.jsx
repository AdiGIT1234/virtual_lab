import { useState } from "react";
import { Html } from "@react-three/drei";
import { useCircuitStore } from "../../state/useCircuitStore";

export default function Resistor3D({ id, resistance = 330, position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const [editing, setEditing] = useState(false);
  const updateComponent = useCircuitStore((state) => state.updateComponent);

  const handleResistanceChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      updateComponent(id, { resistance: val });
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        castShadow 
        onPointerDown={(e) => { e.stopPropagation(); setEditing(!editing); }}
      >
        <cylinderGeometry args={[0.015, 0.015, 0.24, 18]} />
        <meshStandardMaterial
          color={highlighted ? "#ffe3b5" : "#d4af8c"}
          roughness={0.4}
          metalness={0.25}
          emissive={highlighted ? "#ffc48a" : "#000000"}
          emissiveIntensity={highlighted ? 0.08 : 0}
        />
      </mesh>
      {["#6c3f1f", "#2f7b52", "#2f3f7b"].map((bandColor, idx) => (
        <mesh key={bandColor} position={[0, 0.06 - idx * 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.02, 0.0025, 12, 32]} />
          <meshStandardMaterial color={bandColor} />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.26, 12]} />
        <meshStandardMaterial color="#dfe7ef" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.26, 12]} />
        <meshStandardMaterial color="#aab1bb" roughness={0.3} metalness={0.9} />
      </mesh>
      {editing && (
        <Html position={[0, 0.25, 0]} center>
          <div style={{ background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
            <input 
              type="number" 
              value={resistance} 
              onChange={handleResistanceChange}
              style={{ width: "60px", background: "transparent", color: "#fff", border: "none", outline: "none", fontSize: "12px" }}
              autoFocus
            />
            <span style={{ color: "#aaa", fontSize: "12px" }}>Ω</span>
          </div>
        </Html>
      )}
    </group>
  );
}
