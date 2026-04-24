import { useState } from "react";
import { Html } from "@react-three/drei";
import { useCircuitStore } from "../../state/useCircuitStore";

// IEC resistor color code tables
const DIGIT_COLORS = ["#000000","#8B4513","#cc0000","#ff6600","#ffcc00","#00aa00","#0000cc","#880088","#888888","#ffffff"];
const MULTIPLIER_COLORS = ["#000000","#8B4513","#cc0000","#ff6600","#ffcc00","#00aa00","#0000cc","#880088","#888888","#ffffff","#ffd700","#c0c0c0"];

function getResistorBands(ohms) {
  if (!ohms || ohms <= 0) return ["#000000", "#000000", "#000000", "#ffd700"];
  const log = Math.floor(Math.log10(ohms));
  const mult = log - 1;
  const norm = Math.round(ohms / Math.pow(10, Math.max(mult, 0)));
  const d1 = Math.floor(norm / 10) % 10;
  const d2 = norm % 10;
  const multClamped = Math.max(0, Math.min(mult, MULTIPLIER_COLORS.length - 1));
  return [
    DIGIT_COLORS[d1] ?? "#000000",
    DIGIT_COLORS[d2] ?? "#000000",
    MULTIPLIER_COLORS[multClamped],
    "#ffd700", // gold = ±5% tolerance
  ];
}

export default function Resistor3D({ id, resistance = 330, position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  const [editing, setEditing] = useState(false);
  const updateComponent = useCircuitStore((state) => state.updateComponent);
  const bands = getResistorBands(resistance);

  const handleResistanceChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) updateComponent(id, { resistance: val });
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Lay resistor horizontally (rotate 90° around Z) */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Body */}
        <mesh castShadow onPointerDown={(e) => { e.stopPropagation(); setEditing(!editing); }}>
          <cylinderGeometry args={[0.022, 0.022, 0.16, 24]} />
          <meshStandardMaterial
            color={highlighted ? "#e8d0a0" : "#d4c088"}
            roughness={0.45}
            metalness={0.08}
            emissive={highlighted ? "#ffcc99" : "#000000"}
            emissiveIntensity={highlighted ? 0.15 : 0}
          />
        </mesh>

        {/* End caps */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.024, 0.022, 0.018, 24]} />
          <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d4c088"} />
        </mesh>
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[0.022, 0.024, 0.018, 24]} />
          <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d4c088"} />
        </mesh>

        {/* Dynamic 4-band color code */}
        {bands.map((bandColor, i) => {
          const positions = [0.042, 0.016, -0.010, -0.045];
          return (
            <mesh key={i} position={[0, positions[i], 0]}>
              <cylinderGeometry args={[0.0228, 0.0228, 0.011, 24]} />
              <meshStandardMaterial
                color={bandColor}
                metalness={i === 3 ? 0.7 : 0.05}
                roughness={i === 3 ? 0.25 : 0.6}
              />
            </mesh>
          );
        })}

        {/* Leads */}
        <mesh position={[0, 0.185, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
          <meshStandardMaterial color="#b0bbc5" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.185, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
          <meshStandardMaterial color="#b0bbc5" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>

      {editing && (
        <Html position={[0, 0.22, 0]} center>
          <div style={{
            background: "rgba(13,17,23,0.92)",
            padding: "5px 10px",
            borderRadius: 7,
            border: "1px solid rgba(0,229,255,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}>
            <input
              type="number"
              value={resistance}
              onChange={handleResistanceChange}
              style={{ width: "68px", background: "transparent", color: "#e6edf3", border: "none", outline: "none", fontSize: "12px", fontFamily: "monospace" }}
              autoFocus
            />
            <span style={{ color: "#8b949e", fontSize: "12px" }}>Ω</span>
          </div>
        </Html>
      )}
    </group>
  );
}
