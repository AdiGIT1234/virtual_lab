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

  return (
    <group position={position} rotation={rotation}>
      {/* LED Main Lens/Body */}
      <mesh castShadow receiveShadow ref={glowRef}>
        <cylinderGeometry args={[0.032, 0.032, 0.16, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Flat bottom rim (Anode/Cathode indicator) */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.015, 28]} />
        <meshStandardMaterial color={color} roughness={0.2} />
      </mesh>

      {/* Domed Top */}
      <mesh position={[0, 0.08, 0]} ref={lensRef}>
        <sphereGeometry args={[0.032, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0}
          transmission={0.9}
          thickness={0.05}
        />
      </mesh>

      {/* LED internal structure (Cathode/Anode flags) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.015, 0.06, 0.005]} />
        <meshStandardMaterial color="#dfe7ef" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Long Lead (Anode) — trimmed to realistic breadboard insertion depth */}
      <mesh position={[0.012, -0.115, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.19, 8]} />
        <meshStandardMaterial color="#d9e2e8" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Short Lead (Cathode) */}
      <mesh position={[-0.012, -0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 8]} />
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
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshBasicMaterial color={color} opacity={0.15} transparent blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}
