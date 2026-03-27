export default function SceneLighting() {
  return (
    <group>
      {/* Balanced neutral ambient fill */}
      <ambientLight intensity={0.7} color="#ffffff" />

      {/* Primary Key Light - Crisp and neutral */}
      <directionalLight
        position={[2, 10, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]}
      />

      {/* Secondary Fill - Softens shadows from the left */}
      <directionalLight
        position={[-5, 5, 2]}
        intensity={0.6}
        color="#f0f4ff"
      />

      {/* Rim/Accent Light - Adds definition to edges */}
      <spotLight
        position={[0, 8, -5]}
        angle={0.4}
        penumbra={1}
        intensity={2}
        color="#ffffff"
      />

      {/* Large soft box for uniform surface lighting */}
      <rectAreaLight
        width={10}
        height={10}
        color="#ffffff"
        intensity={2.5}
        position={[0, 6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}
