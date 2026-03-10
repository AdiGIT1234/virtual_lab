export default function SceneLighting() {
  return (
    <group>
      <ambientLight intensity={0.35} color="#9fd5ff" />
      <directionalLight
        position={[3, 4, 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={15}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <spotLight
        position={[-3, 5, -2]}
        angle={0.5}
        penumbra={0.4}
        intensity={0.6}
        color="#00ffc6"
      />
      <hemisphereLight skyColor="#74c0ff" groundColor="#050910" intensity={0.3} />
    </group>
  );
}
