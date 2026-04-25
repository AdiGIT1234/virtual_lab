export default function SceneLighting() {
  return (
    <group>
      {/* Ambient — enough to read component colors clearly */}
      <ambientLight intensity={0.55} color="#c8d8f0" />

      {/* Main overhead lab light — broad warm-white, casts clean shadows */}
      <directionalLight
        position={[2, 8, 4]}
        intensity={1.8}
        color="#fff5e8"
        castShadow
        shadow-bias={-0.0002}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Secondary fill from the opposite side — reduces harsh shadows */}
      <directionalLight
        position={[-4, 5, -2]}
        intensity={0.9}
        color="#b0c8e8"
      />

      {/* Cyan accent rim — defines component edges from behind, feeds bloom */}
      <spotLight
        position={[-1, 5, -4]}
        angle={0.55}
        penumbra={0.85}
        intensity={3}
        color="#00e5ff"
      />

      {/* Warm PCB bounce — subtle green-teal reflected from the board surface */}
      <pointLight
        position={[-0.6, 0.15, 0]}
        intensity={0.6}
        color="#00c8a0"
        distance={2.5}
        decay={2}
      />

      {/* Front fill — reduces silhouetting when viewed from front/side */}
      <directionalLight
        position={[0, 3, 8]}
        intensity={0.5}
        color="#e8f0ff"
      />
    </group>
  );
}
