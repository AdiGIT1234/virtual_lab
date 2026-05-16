import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Led3D({ position = [0, 0, 0], rotation = [0, 0, 0], color = "#ff5555", level = 0, highlighted = false }) {
  const glowRef = useRef();
  const lensRef = useRef();
  const lightRef = useRef();

  useFrame((_, delta) => {
    if (!glowRef.current || !lensRef.current) return;
    const target = 0.15 + level * 0.9 + (highlighted ? 0.35 : 0);
    glowRef.current.material.emissiveIntensity += (target - glowRef.current.material.emissiveIntensity) * delta * 4;
    lensRef.current.material.opacity += ((0.25 + level * 0.4) - lensRef.current.material.opacity) * delta * 4;
    if (lightRef.current) {
      const targetIntensity = level > 0.1 ? level * 4.5 : 0;
      lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * delta * 5;
    }
  });

  // Realistic 5 mm LED at scene scale (1 unit ≈ 50 mm)
  // Body: r=0.048 (≈2.4 mm radius = 4.8 mm diam), h=0.18
  const R  = 0.048;
  const HH = 0.090; // half-height of cylinder

  return (
    <group position={position} rotation={rotation}>
      {/* Cylindrical body */}
      <mesh castShadow receiveShadow ref={glowRef}>
        <cylinderGeometry args={[R, R, HH * 2, 28]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.2}
          roughness={0.1} metalness={0.1} transparent opacity={0.88}
        />
      </mesh>

      {/* Flat bottom rim — polarity flat */}
      <mesh position={[0, -HH, 0]}>
        <cylinderGeometry args={[R + 0.005, R + 0.005, 0.016, 28]} />
        <meshStandardMaterial color={color} roughness={0.18} />
      </mesh>

      {/* Domed top */}
      <mesh position={[0, HH, 0]} ref={lensRef}>
        <sphereGeometry args={[R, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color} transparent opacity={0.62}
          roughness={0} transmission={0.88} thickness={0.06}
        />
      </mesh>

      {/* Internal die flag (visible through lens) */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.018, 0.065, 0.006]} />
        <meshStandardMaterial color="#dfe7ef" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Long lead (anode) */}
      <mesh position={[0.014, -HH - 0.125, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.25, 8]} />
        <meshStandardMaterial color="#d9e2e8" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Short lead (cathode) */}
      <mesh position={[-0.014, -HH - 0.105, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.21, 8]} />
        <meshStandardMaterial color="#929cab" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Point light — illuminates surroundings when LED is on */}
      <pointLight
        ref={lightRef}
        position={[0, 0.1, 0]}
        color={color}
        intensity={0}
        distance={1.2}
        decay={2}
      />

      {highlighted && (
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.085, 24, 24]} />
          <meshBasicMaterial color={color} opacity={0.15} transparent blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}
