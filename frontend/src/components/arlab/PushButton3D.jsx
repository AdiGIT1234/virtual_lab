import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 6mm × 6mm SMD tactile switch — through-hole variant with 4 bent pins
export default function PushButton3D({ position = [0, 0, 0], rotation = [0, 0, 0], isPressed = false, onClick, highlighted = false }) {
  const capRef = useRef();

  useFrame(() => {
    if (!capRef.current) return;
    const target = isPressed ? 0.042 : 0.062;
    capRef.current.position.y = THREE.MathUtils.lerp(capRef.current.position.y, target, 0.28);
  });

  const bodyColor   = highlighted ? "#4a4a4a" : "#2c2c2c";
  const capColor    = isPressed ? "#cc2244" : "#d8d8d8";
  const pinMat      = { color: "#b8c8d4", metalness: 0.92, roughness: 0.18 };

  // 4 pin positions: ±0.05 x, ±0.05 z (matches a 6mm² tactile switch footprint)
  const PIN_XZ = [
    [ 0.052,  0.052],
    [ 0.052, -0.052],
    [-0.052,  0.052],
    [-0.052, -0.052],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Housing body */}
      <mesh position={[0, 0.032, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.062, 0.13]} />
        <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.1} />
      </mesh>

      {/* Top face — slightly lighter to show a seam */}
      <mesh position={[0, 0.064, 0]}>
        <boxGeometry args={[0.124, 0.004, 0.124]} />
        <meshStandardMaterial color="#383838" roughness={0.7} />
      </mesh>

      {/* Actuator shaft */}
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.022, 0.024, 0.018, 12]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.8} />
      </mesh>

      {/* Pressable cap */}
      <mesh ref={capRef} position={[0, 0.062, 0]} castShadow
        onPointerDown={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerUp={(e) => { e.stopPropagation(); }}
      >
        <cylinderGeometry args={[0.038, 0.040, 0.028, 20]} />
        <meshStandardMaterial color={capColor} roughness={0.4} metalness={0.05}
          emissive={isPressed ? "#880022" : "#000000"}
          emissiveIntensity={isPressed ? 0.3 : 0}
        />
      </mesh>
      {/* Cap highlight dome */}
      <mesh ref={useRef()} position={[0, 0.072, 0]}>
        <sphereGeometry args={[0.028, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshPhysicalMaterial color={capColor} roughness={0.25} transmission={0.15} transparent opacity={0.9} />
      </mesh>

      {/* 4 × through-hole pins — horizontal leg + bent vertical stub */}
      {PIN_XZ.map(([px, pz], i) => (
        <group key={i}>
          {/* Horizontal leg from body edge to bend point */}
          <mesh position={[px * 0.5, 0.010, pz * 0.5]}
            rotation={[0, Math.atan2(px, pz), 0]}
          >
            <cylinderGeometry args={[0.007, 0.007, 0.055, 8]} />
            <meshStandardMaterial {...pinMat} />
          </mesh>
          {/* Bent vertical stub going down into breadboard hole */}
          <mesh position={[px, -0.028, pz]}>
            <cylinderGeometry args={[0.007, 0.007, 0.072, 8]} />
            <meshStandardMaterial {...pinMat} />
          </mesh>
        </group>
      ))}

      {/* Highlight wireframe when selected */}
      {highlighted && (
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.17, 0.14, 0.17]} />
          <meshBasicMaterial color="#00ffd5" wireframe transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}
