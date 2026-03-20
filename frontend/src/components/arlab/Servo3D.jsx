import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Servo3D({ position = [0, 0, 0], rotation = [0, 0, 0], angle = 0, highlighted = false }) {
  const hornRef = useRef();

  useFrame(() => {
    if (hornRef.current) {
      // Smoothly interpolate the angle (angle is expected in degrees, converting to radians)
      const targetRotation = (angle * Math.PI) / 180;
      hornRef.current.rotation.y = THREE.MathUtils.lerp(
        hornRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Servo Body */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color={highlighted ? "#333333" : "#1a1a1a"} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Mounting Tabs */}
      <mesh position={[0, 0.15, 0.22]} castShadow>
        <boxGeometry args={[0.2, 0.02, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.15, -0.22]} castShadow>
        <boxGeometry args={[0.2, 0.02, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Servo Motor Axle */}
      <mesh position={[0, 0.21, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Rotating Horn */}
      <group ref={hornRef} position={[0, 0.22, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.04, 0.02, 0.25]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 16]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.5} />
        </mesh>
      </group>

      {/* Highlight Box if selected */}
      {highlighted && (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.42]} />
          <meshBasicMaterial color="#00ffd5" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}
