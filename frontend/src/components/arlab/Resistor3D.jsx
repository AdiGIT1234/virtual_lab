export default function Resistor3D({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 12]} />
        <meshStandardMaterial color="#d4af8c" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.02, 0.002, 8, 24]} />
        <meshStandardMaterial color="#6c3f1f" />
      </mesh>
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.02, 0.002, 8, 24]} />
        <meshStandardMaterial color="#2f7b52" />
      </mesh>
    </group>
  );
}
