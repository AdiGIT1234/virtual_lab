import * as THREE from "three";

export default function BreadboardModel(props) {
  // Deep dark premium breadboard styling to match diode.com vibe
  return (
    <group {...props}>
      {/* Main Base */}
      <mesh receiveShadow castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[1.65, 0.1, 0.55]} />
        <meshStandardMaterial color="#b2b5ba" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Grooves / Split */}
      <mesh receiveShadow castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[1.5, 0.015, 0.04]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.6} />
      </mesh>

      {/* Red/Blue Rails Indicators */}
      <mesh receiveShadow castShadow position={[0, 0.005, -0.21]}>
        <boxGeometry args={[1.5, 0.005, 0.005]} />
        <meshStandardMaterial color="#ff3366" roughness={0.6} emissive="#ff3366" emissiveIntensity={0.2} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 0.005, -0.26]}>
        <boxGeometry args={[1.5, 0.005, 0.005]} />
        <meshStandardMaterial color="#33ccff" roughness={0.6} emissive="#33ccff" emissiveIntensity={0.2} />
      </mesh>
      
      <mesh receiveShadow castShadow position={[0, 0.005, 0.21]}>
        <boxGeometry args={[1.5, 0.005, 0.005]} />
        <meshStandardMaterial color="#ff3366" roughness={0.6} emissive="#ff3366" emissiveIntensity={0.2} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, 0.005, 0.26]}>
        <boxGeometry args={[1.5, 0.005, 0.005]} />
        <meshStandardMaterial color="#33ccff" roughness={0.6} emissive="#33ccff" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
