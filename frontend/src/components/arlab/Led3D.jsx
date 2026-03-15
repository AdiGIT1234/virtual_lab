import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Led3D({ position = [0, 0, 0], rotation = [0, 0, 0], color = "#ff5555", level = 0, highlighted = false }) {
  const glowRef = useRef();
  const lensRef = useRef();

  useFrame((_, delta) => {
    if (!glowRef.current || !lensRef.current) return;
    const target = 0.15 + level * 0.9 + (highlighted ? 0.35 : 0);
    glowRef.current.material.emissiveIntensity += (target - glowRef.current.material.emissiveIntensity) * delta * 4;
    lensRef.current.material.opacity += ((0.25 + level * 0.4) - lensRef.current.material.opacity) * delta * 4;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow ref={glowRef}>
        <cylinderGeometry args={[0.03, 0.03, 0.18, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} ref={lensRef}>
        <sphereGeometry args={[0.03, 24, 24]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.25}
          roughness={0}
          metalness={0}
          transmission={0.9}
          thickness={0.03}
        />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.18, 12]} />
        <meshStandardMaterial color="#d9e2e8" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.03, -0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.17, 12]} />
        <meshStandardMaterial color="#929cab" roughness={0.3} metalness={0.8} />
      </mesh>
      {highlighted && (
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.05, 24, 24]} />
          <meshBasicMaterial color={color} opacity={0.2} transparent blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}
