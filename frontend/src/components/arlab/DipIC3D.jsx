import { useState } from "react";
import { Html } from "@react-three/drei";

export default function DipIC3D({
  label = "74HC595",
  pinCount = 16,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  pinLabels = [],
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [hoveredPin, setHoveredPin] = useState(null);

  const pinsPerSide = Math.ceil(pinCount / 2);
  const bodyLength = Math.max(0.15, pinsPerSide * 0.025 + 0.03);
  const pinSpacing = 0.025;

  return (
    <group position={position} rotation={rotation}>
      {/* IC body */}
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
        <div style={{ fontSize: "2px", fontFamily: "'JetBrains Mono', monospace", color: "#aaa", padding: "2px 4px", userSelect: "none", textAlign: "center" }}>
          {label}
        </div>
      </Html>

      {/* Pins — left side (pins 1..pinsPerSide) and right side (pins N..pinsPerSide+1) */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const x = -bodyLength / 2 + 0.025 + i * pinSpacing;
        const leftPinNum  = i + 1;
        const rightPinNum = pinCount - i;
        const leftLabel   = pinLabels[leftPinNum  - 1] || `${leftPinNum}`;
        const rightLabel  = pinLabels[rightPinNum - 1] || `${rightPinNum}`;

        return (
          <group key={`pinset-${i}`} position={[x, -0.01, 0]}>
            {/* Left pin */}
            <group position={[0, -0.01, -0.04]}>
              <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHoveredPin(`L${i}`); }}
                onPointerOut={(e)  => { e.stopPropagation(); setHoveredPin(null); }}
              >
                <boxGeometry args={[0.012, 0.035, 0.018]} />
                <meshStandardMaterial transparent opacity={0} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.008, 0.035, 0.015]} />
                <meshStandardMaterial
                  color={hoveredPin === `L${i}` ? "#00e5ff" : "#b0b5c0"}
                  metalness={0.9} roughness={0.1}
                  emissive={hoveredPin === `L${i}` ? "#00e5ff" : "#000"}
                  emissiveIntensity={hoveredPin === `L${i}` ? 0.8 : 0}
                />
              </mesh>
              {hoveredPin === `L${i}` && (
                <Html position={[0, 0.025, -0.02]} center zIndexRange={[200, 0]}>
                  <div style={{ background: "rgba(13,17,23,0.92)", color: "#00e5ff", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap", border: "1px solid rgba(0,229,255,0.4)", pointerEvents: "none" }}>
                    {leftLabel}
                  </div>
                </Html>
              )}
            </group>

            {/* Right pin */}
            <group position={[0, -0.01, 0.04]}>
              <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHoveredPin(`R${i}`); }}
                onPointerOut={(e)  => { e.stopPropagation(); setHoveredPin(null); }}
              >
                <boxGeometry args={[0.012, 0.035, 0.018]} />
                <meshStandardMaterial transparent opacity={0} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.008, 0.035, 0.015]} />
                <meshStandardMaterial
                  color={hoveredPin === `R${i}` ? "#00e5ff" : "#b0b5c0"}
                  metalness={0.9} roughness={0.1}
                  emissive={hoveredPin === `R${i}` ? "#00e5ff" : "#000"}
                  emissiveIntensity={hoveredPin === `R${i}` ? 0.8 : 0}
                />
              </mesh>
              {hoveredPin === `R${i}` && (
                <Html position={[0, 0.025, 0.02]} center zIndexRange={[200, 0]}>
                  <div style={{ background: "rgba(13,17,23,0.92)", color: "#00e5ff", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap", border: "1px solid rgba(0,229,255,0.4)", pointerEvents: "none" }}>
                    {rightLabel}
                  </div>
                </Html>
              )}
            </group>
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
