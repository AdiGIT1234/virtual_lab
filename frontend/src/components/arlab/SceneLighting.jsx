export default function SceneLighting() {
  return (
    <group>
      {/* Soft ambient — gives readable base illumination */}
      <ambientLight intensity={0.45} color="#b8cce0" />

      {/* Main overhead lab fluorescent — primary shadow caster */}
      <directionalLight
        position={[1.5, 9, 3]}
        intensity={2.0}
        color="#fff8f0"
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

      {/* Cool fill — opposite side, reduces black shadows */}
      <directionalLight
        position={[-5, 4, -3]}
        intensity={0.75}
        color="#a0c0e8"
      />

      {/* Front softbox — prevents silhouetting from front/side views */}
      <directionalLight
        position={[0, 2, 9]}
        intensity={0.4}
        color="#e8f0ff"
      />

      {/* Cyan rim accent — strong enough to feed Bloom on component edges */}
      <spotLight
        position={[-0.8, 6, -5]}
        angle={0.5}
        penumbra={0.9}
        intensity={4}
        color="#00e5ff"
        castShadow={false}
      />

      {/* Warm PCB bounce — subtle green-teal reflected upward from the board */}
      <pointLight
        position={[-0.6, 0.18, 0]}
        intensity={0.5}
        color="#00c8a0"
        distance={2.2}
        decay={2}
      />

      {/* Breadboard area fill — prevents breadboard from looking dark */}
      <pointLight
        position={[1.2, 0.4, 0]}
        intensity={0.35}
        color="#ffe8d0"
        distance={2.5}
        decay={2}
      />

      {/* Under-bench ambient bounce — simulates light bouncing off the workbench edge */}
      <pointLight
        position={[0.2, -0.03, 0]}
        intensity={0.18}
        color="#112030"
        distance={3}
        decay={2}
      />
    </group>
  );
}
