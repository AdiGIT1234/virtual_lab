import * as THREE from "three";

export default function BoardModel(props) {
  // Scaled up procedural Arduino to match the accurate unoPinCoords coordinates
  return (
    <group {...props}>
      {/* PCB Base */}
      <mesh receiveShadow castShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[1.8, 0.03, 1.1]} />
        <meshStandardMaterial color="#0A3A40" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* ATmega Chip */}
      <mesh receiveShadow castShadow position={[0.1, 0.04, -0.1]}>
        <boxGeometry args={[0.7, 0.04, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Top Headers (Digital) aligned to Z=0.45 */}
      <mesh receiveShadow castShadow position={[-0.1, 0.045, 0.45]}>
        <boxGeometry args={[1.4, 0.06, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Bottom Headers (Analog/Power) aligned to Z=-0.45 */}
      <mesh receiveShadow castShadow position={[0.55, 0.045, -0.45]}>
        <boxGeometry args={[0.6, 0.06, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh receiveShadow castShadow position={[-0.2, 0.045, -0.45]}>
        <boxGeometry args={[0.6, 0.06, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      
      {/* USB Port */}
      <mesh receiveShadow castShadow position={[-0.8, 0.08, -0.3]}>
        <boxGeometry args={[0.3, 0.15, 0.25]} />
        <meshStandardMaterial color="#c0c5ce" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Power Jack */}
      <mesh receiveShadow castShadow position={[-0.8, 0.07, 0.3]}>
        <boxGeometry args={[0.25, 0.14, 0.2]} />
        <meshStandardMaterial color="#050505" roughness={0.8} />
      </mesh>
    </group>
  );
}
