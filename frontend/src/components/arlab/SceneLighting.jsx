export default function SceneLighting() {
  return (
    <group>
      {/* Strong ambient — breadboard white needs good base illumination */}
      <ambientLight intensity={0.72} color="#f5f0e8" />

      {/* Main overhead — primary shadow caster, warm neutral */}
      <directionalLight
        position={[1.5, 9, 3]}
        intensity={2.8}
        color="#fff8f2"
        castShadow
        shadow-bias={-0.0003}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Cool fill — opposite side, softens shadows */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={0.9}
        color="#d0e4f8"
      />

      {/* Front softbox — prevents silhouetting */}
      <directionalLight
        position={[0, 2, 9]}
        intensity={0.55}
        color="#eef4ff"
      />

      {/* Breadboard area fill — white breadboard needs bright overhead */}
      <pointLight
        position={[1.2, 1.2, 0]}
        intensity={1.2}
        color="#fff8f0"
        distance={3.5}
        decay={2}
      />

      {/* Arduino board warm bounce */}
      <pointLight
        position={[-0.6, 0.25, 0]}
        intensity={0.6}
        color="#b8e8d0"
        distance={2.2}
        decay={2}
      />
    </group>
  );
}
