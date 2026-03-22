import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Piezo buzzer 3D component.
 * Shows a cylindrical buzzer body with a resonator top that pulses when active.
 */
export default function Buzzer3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  highlighted = false,
  active = false,
}) {
  const pulseRef = useRef();

  useFrame((state) => {
    if (!pulseRef.current) return;
    if (active) {
      // Vibrate effect at ~30 Hz visual
      const t = state.clock.getElapsedTime();
      pulseRef.current.scale.y = 1 + Math.sin(t * 60) * 0.04;
      pulseRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 30) * 0.15;
    } else {
      pulseRef.current.scale.y = 1;
      pulseRef.current.material.emissiveIntensity = highlighted ? 0.08 : 0;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Resonator dome */}
      <mesh position={[0, 0.025, 0]} ref={pulseRef} castShadow>
        <sphereGeometry args={[0.045, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={highlighted ? "#3a3a3a" : "#222222"}
          roughness={0.5}
          metalness={0.3}
          emissive={active ? "#ff8800" : "#555555"}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Sound hole ring */}
      <mesh position={[0, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.02, 0.002, 8, 20]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Lead + (signal) */}
      <mesh position={[-0.015, -0.12, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#cc3333" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Lead – (ground) */}
      <mesh position={[0.015, -0.12, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Active glow */}
      {active && (
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.04, 14, 14]} />
          <meshBasicMaterial
            color="#ff8800"
            opacity={0.12}
            transparent
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
