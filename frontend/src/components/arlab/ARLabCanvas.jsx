import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

export default function ARLabCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [2.4, 1.5, 2.4], fov: 45, near: 0.1, far: 40 }}
      dpr={[1, 1.8]}
    >
      <color attach="background" args={["#010307"]} />
      <fog attach="fog" args={["#010307", 5, 18]} />
      <Suspense fallback={null}>
        <CircuitScene />
      </Suspense>
      <OrbitControls
        enableDamping
        enablePan
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={Math.PI / 6}
        minDistance={1.1}
        maxDistance={4.5}
      />
      {showStats && <Stats showPanel={0} className="arlab-stats" />}
    </Canvas>
  );
}
