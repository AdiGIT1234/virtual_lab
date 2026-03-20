export default function SceneLighting() {
  return (
    <group>
      <ambientLight intensity={0.15} color="#4f6e8c" />
      <rectAreaLight
        width={4}
        height={4}
        color="#ffffff"
        intensity={2.5}
        position={[-2, 3, 2]}
        lookAt={[0, 0, 0]}
      />
      <directionalLight
        position={[4, 6, 2]}
        intensity={0.9}
        color="#aaddff"
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight
        position={[-4, 3, -4]}
        angle={0.6}
        penumbra={0.8}
        intensity={4}
        color="#3bc2ff"
        castShadow
      />
    </group>
  );
}
