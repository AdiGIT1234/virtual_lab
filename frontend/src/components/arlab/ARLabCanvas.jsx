import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

export default function ARLabCanvas({ highlightedId, componentStyles }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4.5, 0.2], fov: 45, near: 0.1, far: 50 }}
      dpr={[1, 1.8]}
    >
      <color attach="background" args={["#040810"]} />
      <fog attach="fog" args={["#040810", 3, 20]} />
      <Suspense fallback={null}>
        <CircuitScene highlightedComponentId={highlightedId} componentStyles={componentStyles} />
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={1.0} mipmapBlur />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Suspense>
      <OrbitControls
        enableDamping
        enablePan
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={0}
        minDistance={1.0}
        maxDistance={6.0}
      />
      {showStats && <Stats showPanel={0} className="arlab-stats" />}
    </Canvas>
  );
}
