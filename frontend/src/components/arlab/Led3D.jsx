import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Led3D({ position = [0, 0, 0], rotation = [0, 0, 0], color = "#ff5555", level = 0 }) {
  const glowRef = useRef();

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const target = 0.2 + level * 0.8;
    glowRef.current.material.emissiveIntensity += (target - glowRef.current.material.emissiveIntensity) * delta * 6;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow ref={glowRef}>
        <cylinderGeometry args={[0.03, 0.03, 0.18, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.18, 6]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.03, -0.1, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
        <meshStandardMaterial color="#808080" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}
