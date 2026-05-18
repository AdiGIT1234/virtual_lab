export default function SceneLighting() {
  return (
    <group>
      <ambientLight intensity={0.45} color="#f0eeea" />

      {/* Primary overhead — casts shadows */}
      <directionalLight
        position={[1.5, 9, 3]}
        intensity={1.2}
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

      {/* Cool fill from left — softens shadows */}
      <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#d0e4f8" />

      {/* Gentle front softbox */}
      <directionalLight position={[0, 2, 9]} intensity={0.25} color="#eef4ff" />

      {/* Breadboard area fill */}
      <pointLight position={[1.2, 1.2, 0]} intensity={0.6} color="#fff8f0" distance={3.5} decay={2} />

      {/* Arduino board fill — subtle, not overpowering */}
      <pointLight position={[-0.6, 0.8, 0.5]} intensity={0.5} color="#e0f4ff" distance={2.5} decay={2} />
    </group>
  );
}
