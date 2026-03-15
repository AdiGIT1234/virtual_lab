export default function Resistor3D({ position = [0, 0, 0], rotation = [0, 0, 0], highlighted = false }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 18]} />
        <meshStandardMaterial
          color={highlighted ? "#ffe3b5" : "#d4af8c"}
          roughness={0.4}
          metalness={0.25}
          emissive={highlighted ? "#ffc48a" : "#000000"}
          emissiveIntensity={highlighted ? 0.08 : 0}
        />
      </mesh>
      {["#6c3f1f", "#2f7b52", "#2f3f7b"].map((bandColor, idx) => (
        <mesh key={bandColor} position={[0, 0.06 - idx * 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.02, 0.0025, 12, 32]} />
          <meshStandardMaterial color={bandColor} />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.26, 12]} />
        <meshStandardMaterial color="#dfe7ef" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.26, 12]} />
        <meshStandardMaterial color="#aab1bb" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}
