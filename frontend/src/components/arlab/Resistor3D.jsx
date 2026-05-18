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

  // Realistic ¼W resistor: body 3 mm diam × 9 mm long at scene scale
  // (1 unit ≈ 50 mm → body r=0.032, half-length=0.090)
  const R = 0.032;   // body radius
  const HL = 0.090;  // body half-length
  const LR = 0.007;  // lead wire radius

  return (
    <group position={position} rotation={rotation}>
      {/* Lay resistor horizontally (rotate 90° around Z) */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Body */}
        <mesh castShadow onPointerDown={(e) => { e.stopPropagation(); setEditing(!editing); }}>
          <cylinderGeometry args={[R, R, HL * 2, 24]} />
          <meshStandardMaterial
            color={highlighted ? "#e8d0a0" : "#d4c088"}
            roughness={0.45} metalness={0.08}
            emissive={highlighted ? "#ffcc99" : "#000000"}
            emissiveIntensity={highlighted ? 0.15 : 0}
          />
        </mesh>

        {/* End caps */}
        <mesh position={[0,  HL + 0.008, 0]}>
          <cylinderGeometry args={[R + 0.003, R, 0.018, 24]} />
          <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d4c088"} />
        </mesh>
        <mesh position={[0, -HL - 0.008, 0]}>
          <cylinderGeometry args={[R, R + 0.003, 0.018, 24]} />
          <meshStandardMaterial color={highlighted ? "#e8d0a0" : "#d4c088"} />
        </mesh>

        {/* Dynamic 4-band color code — spaced proportionally on body */}
        {bands.map((bandColor, i) => {
          const pos = [ HL*0.52, HL*0.20, -HL*0.10, -HL*0.48 ][i];
          return (
            <mesh key={i} position={[0, pos, 0]}>
              <cylinderGeometry args={[R + 0.001, R + 0.001, 0.015, 24]} />
              <meshStandardMaterial
                color={bandColor}
                metalness={i === 3 ? 0.70 : 0.05}
                roughness={i === 3 ? 0.25 : 0.60}
              />
            </mesh>
          );
        })}

        {/* Axial leads — from body end to bend point at ±0.100 outer x */}
        <mesh position={[0,  HL + 0.005, 0]}>
          <cylinderGeometry args={[LR, LR, 0.010, 8]} />
          <meshStandardMaterial color="#b0bbc5" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, -HL - 0.005, 0]}>
          <cylinderGeometry args={[LR, LR, 0.010, 8]} />
          <meshStandardMaterial color="#b0bbc5" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>

      {/* Bent leads — vertical, ±0.100 = 2 hole pitches so leads land in real holes.
          Center at -0.060 with height 0.12 → top at y=0 (body level),
          bottom at y=-0.12 (deep inside breadboard body). */}
      {[0.100, -0.100].map((lx) => (
        <mesh key={lx} position={[lx, -0.060, 0]}>
          <cylinderGeometry args={[LR, LR, 0.12, 8]} />
          <meshStandardMaterial color="#b0bbc5" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

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
