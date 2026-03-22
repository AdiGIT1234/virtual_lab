import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * NPN/PNP BJT Transistor – TO-92 package style.
 * Renders a half-rounded body with three leads (E, B, C).
 * When active, a small glow ring shows collector current flow direction.
 */
export default function Transistor3D({
  type = "NPN",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  active = false,
  baseBias = 0,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const glowRef = useRef();

  const bodyColor = type === "PNP" ? "#1e3a5f" : "#1a1a1a";
  const labelColor = type === "PNP" ? "#7ec8e3" : "#e0e0e0";

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const targetIntensity = active ? 0.6 + baseBias * 0.4 : highlighted ? 0.15 : 0;
    glowRef.current.material.emissiveIntensity +=
      (targetIntensity - glowRef.current.material.emissiveIntensity) * delta * 5;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* TO-92 body (half-cylinder approximation) */}
      <mesh
        castShadow
        ref={glowRef}
        onPointerDown={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
      >
        <cylinderGeometry args={[0.035, 0.035, 0.12, 20, 1, false, 0, Math.PI]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.6}
          metalness={0.3}
          emissive={active ? "#00ff88" : "#ffffff"}
          emissiveIntensity={0}
        />
      </mesh>
      {/* Flat back */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.07, 0.12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Emitter lead */}
      <mesh position={[-0.02, -0.14, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#c8d0d8" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Base lead */}
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#c8d0d8" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Collector lead */}
      <mesh position={[0.02, -0.14, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#c8d0d8" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Active state indicator glow */}
      {active && (
        <mesh position={[0, -0.02, 0.02]}>
          <sphereGeometry args={[0.015, 14, 14]} />
          <meshBasicMaterial
            color={type === "PNP" ? "#ff4488" : "#00ff88"}
            opacity={0.45}
            transparent
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Highlighted outline */}
      {highlighted && !active && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ffffff" opacity={0.08} transparent />
        </mesh>
      )}

      {/* Info tooltip */}
      {showInfo && (
        <Html position={[0, 0.15, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.88)",
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${type === "PNP" ? "rgba(126,200,227,0.35)" : "rgba(0,255,136,0.3)"}`,
            color: labelColor,
            fontSize: "11px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
          }}>
            <div style={{ fontWeight: "bold", marginBottom: 2 }}>{type} BJT</div>
            <div style={{ fontSize: "9px", opacity: 0.7 }}>E ─ B ─ C</div>
          </div>
        </Html>
      )}
    </group>
  );
}
