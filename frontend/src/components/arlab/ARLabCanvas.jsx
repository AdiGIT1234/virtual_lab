import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

export default function ARLabCanvas({ highlightedId, componentStyles }) {
  return (
    <Canvas
      shadows
      camera={{ position: [1.5, 3.5, 3.5], fov: 42, near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#020408"]} />
      <fog attach="fog" args={["#020408", 6, 25]} />

      {/* Starfield background for depth */}
      <Stars radius={20} depth={40} count={1500} factor={3} saturation={0.2} fade speed={0.5} />

      <Suspense fallback={null}>
        <CircuitScene highlightedComponentId={highlightedId} componentStyles={componentStyles} />
        <EffectComposer disableNormalPass multisampling={8}>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.85}
            intensity={1.4}
            mipmapBlur
            radius={0.8}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0003, 0.0003]}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.9} />
        </EffectComposer>
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan
        target={[0.5, 0, 0]}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={0.15}
        minDistance={1.5}
        maxDistance={8.0}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />
      {showStats && <Stats showPanel={0} className="arlab-stats" />}
    </Canvas>
  );
}
