export default function SceneLighting() {
  return (
    <group>
      {/* Soft ambient fill – slightly blue-tinted for lab atmosphere */}
      <ambientLight intensity={0.25} color="#a0c0ff" />

      {/* Key light – warm directional from upper-right */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        color="#ffe8d6"
        castShadow
        shadow-bias={-0.0002}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill light – cool blue from left */}
      <directionalLight
        position={[-4, 5, -2]}
        intensity={0.5}
        color="#88ccff"
      />

      {/* Rim light – cyan accent from behind for edge highlights */}
      <spotLight
        position={[-3, 4, -5]}
        angle={0.5}
        penumbra={0.9}
        intensity={6}
        color="#00d4ff"
        castShadow
        shadow-bias={-0.001}
      />

      {/* Overhead area light – studio-style soft box */}
      <rectAreaLight
        width={6}
        height={6}
        color="#ffffff"
        intensity={1.8}
        position={[0, 5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Low accent light – green tech glow from ground level */}
      <pointLight
        position={[2, 0.1, 1]}
        intensity={1.5}
        color="#00ff88"
        distance={4}
        decay={2}
      />

      {/* Secondary accent – purple tech glow */}
      <pointLight
        position={[-1, 0.1, -2]}
        intensity={1.0}
        color="#7000ff"
        distance={3}
        decay={2}
      />
    </group>
  );
}
