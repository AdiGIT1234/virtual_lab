import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function PushButton3D({ position = [0, 0, 0], rotation = [0, 0, 0], isPressed = false, onClick, highlighted = false }) {
  const capRef = useRef();

  useFrame(() => {
    if (capRef.current) {
      const targetY = isPressed ? 0.05 : 0.08;
      capRef.current.position.y = THREE.MathUtils.lerp(
        capRef.current.position.y,
        targetY,
        0.3
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.05, 0.15]} />
        <meshStandardMaterial color={highlighted ? "#555" : "#333"} roughness={0.8} />
      </mesh>
      
      {/* Metallic Legs */}
      <mesh position={[0.08, 0.015, 0.06]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 0.015, -0.06]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.08, 0.015, 0.06]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.08, 0.015, -0.06]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Button Cap */}
      <mesh 
        ref={capRef} 
        position={[0, 0.08, 0]} 
        castShadow 
        onPointerDown={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerUp={(e) => { e.stopPropagation(); onClick && onClick(); }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
        <meshStandardMaterial color={isPressed ? "#ff3366" : "#e0e0e0"} roughness={0.5} />
      </mesh>

      {/* Highlight Box if selected */}
      {highlighted && (
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.18]} />
          <meshBasicMaterial color="#00ffd5" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}
