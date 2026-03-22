import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * 555 Timer IC – 8-pin DIP representation.
 * Shows the classic notch, pin 1 dot, and status LED for output activity.
 */
export default function Timer555_3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  outputActive = false,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const statusRef = useRef();

  useFrame((_, delta) => {
    if (!statusRef.current) return;
    const target = outputActive ? 1.2 : 0;
    statusRef.current.material.emissiveIntensity +=
      (target - statusRef.current.material.emissiveIntensity) * delta * 6;
  });

  const PIN_LABELS = ["GND", "TRIG", "OUT", "RESET", "CTRL", "THRES", "DISCH", "VCC"];
  const pinSpacing = 0.025;

  return (
    <group position={position} rotation={rotation}>
      {/* IC body */}
      <mesh
        castShadow
        onPointerDown={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
      >
        <boxGeometry args={[0.12, 0.04, 0.06]} />
        <meshStandardMaterial
          color={highlighted ? "#2a2a2a" : "#1a1a1a"}
          roughness={0.7}
          metalness={0.15}
          emissive={highlighted ? "#333333" : "#000000"}
          emissiveIntensity={highlighted ? 0.08 : 0}
        />
      </mesh>

      {/* Notch/dimple (pin 1 indicator) */}
      <mesh position={[-0.055, 0.021, 0]}>
        <sphereGeometry args={[0.008, 12, 12, 0, Math.PI]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Pin 1 dot */}
      <mesh position={[-0.045, 0.021, -0.02]}>
        <circleGeometry args={[0.004, 12]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Status LED on output (pin 3) – small embedded LED */}
      <mesh position={[0.01, 0.022, 0]} ref={statusRef}>
        <sphereGeometry args={[0.005, 10, 10]} />
        <meshStandardMaterial
          color="#00ff66"
          emissive="#00ff66"
          emissiveIntensity={0}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* IC label text */}
      <Html position={[0, 0.025, 0]} center>
        <div style={{
          fontSize: "6px",
          fontFamily: "monospace",
          color: "#888",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          letterSpacing: "1px",
        }}>
          NE555
        </div>
      </Html>

      {/* Pins – left side (1-4) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`lpin-${i}`} position={[-0.04 + i * pinSpacing, -0.016, -0.035]}>
          <boxGeometry args={[0.008, 0.006, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      {/* Pins – right side (5-8) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`rpin-${i}`} position={[-0.04 + i * pinSpacing, -0.016, 0.035]}>
          <boxGeometry args={[0.008, 0.006, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      {/* Active glow */}
      {outputActive && (
        <mesh position={[0.01, 0.04, 0]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color="#00ff66" opacity={0.15} transparent blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {/* Info card */}
      {showInfo && (
        <Html position={[0, 0.12, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.9)",
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid rgba(0,255,100,0.25)",
            color: "#c8ffc8",
            fontSize: "10px",
            fontFamily: "monospace",
            minWidth: "120px",
          }}>
            <div style={{ fontWeight: "bold", marginBottom: 3, color: "#fff" }}>NE555 Timer</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 8px", fontSize: "8px", opacity: 0.75 }}>
              {PIN_LABELS.map((label, idx) => (
                <span key={idx}>{idx+1}─{label}</span>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
