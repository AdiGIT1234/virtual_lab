import { useState } from "react";
import { Html } from "@react-three/drei";

/**
 * Generic DIP IC placeholder – renders an N-pin dual inline package.
 * Used for shift registers, custom digital ICs, and any DIP-packaged chip.
 */
export default function DipIC3D({
  label = "74HC595",
  pinCount = 16,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  pinLabels = [],
}) {
  const [showInfo, setShowInfo] = useState(false);

  const pinsPerSide = Math.ceil(pinCount / 2);
  const bodyLength = Math.max(0.15, pinsPerSide * 0.025 + 0.03);
  const pinSpacing = 0.025; // Standard 0.1" spacing in scale? Assume roughly that.

  return (
    <group position={position} rotation={rotation}>
      {/* IC body with beveled top */}
      <mesh
        castShadow
        onPointerDown={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
      >
        <boxGeometry args={[bodyLength, 0.035, 0.065]} />
        <meshStandardMaterial
          color={highlighted ? "#2a2a2a" : "#1a1a1a"}
          roughness={0.7}
          metalness={0.15}
          emissive={highlighted ? "#333" : "#000"}
          emissiveIntensity={highlighted ? 0.05 : 0}
        />
      </mesh>

      {/* Notch indicator */}
      <mesh position={[-bodyLength / 2 + 0.012, 0.016, 0]}>
        <cylinderGeometry args={[0.01, 0.008, 0.01, 16, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Surface label */}
      <Html position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} transform occlude="blending" center>
        <div style={{
          fontSize: "2px",
          fontFamily: "'JetBrains Mono', monospace",
          color: "#aaa",
          padding: "2px 4px",
          userSelect: "none",
          textAlign: "center"
        }}>
          {label}
        </div>
      </Html>

      {/* Pins */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const x = -bodyLength / 2 + 0.025 + i * pinSpacing;
        return (
          <group key={`pinset-${i}`} position={[x, -0.01, 0]}>
            {/* Left side pin */}
            <mesh position={[0, -0.01, -0.04]}>
              <boxGeometry args={[0.008, 0.035, 0.015]} />
              <meshStandardMaterial color="#b0b5c0" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Right side pin */}
            <mesh position={[0, -0.01, 0.04]}>
              <boxGeometry args={[0.008, 0.035, 0.015]} />
              <meshStandardMaterial color="#b0b5c0" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        );
      })}

      {highlighted && (
        <mesh>
          <boxGeometry args={[bodyLength + 0.02, 0.05, 0.09]} />
          <meshBasicMaterial color="#00ffd5" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
