export default function SceneLighting() {
  return (
    <group>
      {/* Low ambient — dark lab feel */}
      <ambientLight intensity={0.18} color="#1a2035" />

      {/* Warm key light — main workbench illumination from upper-right */}
      <directionalLight
        position={[3, 9, 5]}
        intensity={3.2}
        color="#ffd4a0"
        castShadow
        shadow-bias={-0.0002}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Cool fill — blue-purple from left, softens harsh shadows */}
      <directionalLight
        position={[-6, 4, 2]}
        intensity={0.8}
        color="#8ab4f8"
      />

      {/* Cyan rim light — defines component edges from behind */}
      <spotLight
        position={[-1, 6, -5]}
        angle={0.5}
        penumbra={0.8}
        intensity={4}
        color="#00e5ff"
      />

      {/* Subtle warm under-bounce from PCB surface */}
      <pointLight
        position={[0, 0.1, 0]}
        intensity={0.4}
        color="#ffaa55"
        distance={3}
        decay={2}
      />
    </group>
  );
}
