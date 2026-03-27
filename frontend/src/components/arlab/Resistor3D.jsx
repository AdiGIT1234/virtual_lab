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
      {/* Resistor Body with subtle beveling/curving */}
      <mesh castShadow onPointerDown={(e) => { e.stopPropagation(); setEditing(!editing); }}>
        <cylinderGeometry args={[0.022, 0.022, 0.16, 24]} />
        <meshStandardMaterial
          color={highlighted ? "#e8d0a0" : "#d8c090"}
          roughness={0.4}
          metalness={0.1}
          emissive={highlighted ? "#ffcc99" : "#000000"}
          emissiveIntensity={highlighted ? 0.12 : 0}
        />
      </mesh>
      
      {/* End caps */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.024, 0.022, 0.02, 24]} />
        <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d8c090"} />
      </mesh>
      <mesh position={[0, -0.075, 0]}>
        <cylinderGeometry args={[0.022, 0.024, 0.02, 24]} />
        <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d8c090"} />
      </mesh>

      {/* Color Bands (Standard 4-band for 330 ohm: Orange, Orange, Brown, Gold) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.0225, 0.0225, 0.012, 24]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.0225, 0.0225, 0.012, 24]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.0225, 0.0225, 0.012, 24]} />
        <meshStandardMaterial color="#663300" />
      </mesh>
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.0225, 0.0225, 0.012, 24]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Leads */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
        <meshStandardMaterial color="#aab1bb" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
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
