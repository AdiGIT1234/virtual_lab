import { useState } from "react";
import { Html } from "@react-three/drei";

/**
 * Generic DIP IC placeholder – renders an N-pin dual inline package.
 * Used for shift registers, custom digital ICs, and any DIP-packaged chip.
 */
export default function DipIC3D({
  label = "IC",
  pinCount = 16,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  pinLabels = [],
}) {
  const [showInfo, setShowInfo] = useState(false);

  const pinsPerSide = Math.ceil(pinCount / 2);
  const bodyLength = Math.max(0.12, pinsPerSide * 0.025 + 0.02);
  const pinSpacing = bodyLength / (pinsPerSide + 1);

  return (
    <group position={position} rotation={rotation}>
      {/* IC body */}
      <mesh
        castShadow
        onPointerDown={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
      >
        <boxGeometry args={[bodyLength, 0.035, 0.06]} />
        <meshStandardMaterial
          color={highlighted ? "#2c2c2c" : "#111111"}
          roughness={0.75}
          metalness={0.12}
          emissive={highlighted ? "#444444" : "#000000"}
          emissiveIntensity={highlighted ? 0.06 : 0}
        />
      </mesh>

      {/* Notch */}
      <mesh position={[-bodyLength / 2 + 0.015, 0.019, 0]}>
        <sphereGeometry args={[0.006, 10, 10, 0, Math.PI]} />
        <meshStandardMaterial color="#080808" />
      </mesh>

      {/* Pins – bottom side */}
      {Array.from({ length: pinsPerSide }).map((_, i) => (
        <mesh key={`bpin-${i}`} position={[-bodyLength / 2 + pinSpacing * (i + 1), -0.014, -0.035]}>
          <boxGeometry args={[0.007, 0.005, 0.018]} />
          <meshStandardMaterial color="#b8b8b8" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      {/* Pins – top side */}
      {Array.from({ length: pinsPerSide }).map((_, i) => (
        <mesh key={`tpin-${i}`} position={[-bodyLength / 2 + pinSpacing * (i + 1), -0.014, 0.035]}>
          <boxGeometry args={[0.007, 0.005, 0.018]} />
          <meshStandardMaterial color="#b8b8b8" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      {/* Surface label */}
      <Html position={[0, 0.022, 0]} center>
        <div style={{
          fontSize: "5px",
          fontFamily: "monospace",
          color: "#777",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          letterSpacing: "0.5px",
        }}>
          {label}
        </div>
      </Html>

      {/* Pin info */}
      {showInfo && (
        <Html position={[0, 0.1, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.9)",
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid rgba(180,180,255,0.2)",
            color: "#d0d4ff",
            fontSize: "10px",
            fontFamily: "monospace",
            minWidth: "100px",
          }}>
            <div style={{ fontWeight: "bold", marginBottom: 3, color: "#fff" }}>{label}</div>
            <div style={{ fontSize: "9px", opacity: 0.7 }}>{pinCount}-pin DIP</div>
            {pinLabels.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1px 6px",
                fontSize: "7px",
                marginTop: 3,
                opacity: 0.65,
              }}>
                {pinLabels.map((lbl, idx) => (
                  <span key={idx}>{idx + 1}─{lbl}</span>
                ))}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
