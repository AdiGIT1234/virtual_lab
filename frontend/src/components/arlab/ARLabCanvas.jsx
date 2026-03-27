import { useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

export default function ARLabCanvas({ highlightedId, componentStyles, wires = [] }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [view, setView] = useState("perspective");

  // Monitor the Command key for Mac users
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) setIsRotating(true);
    };
    const handleKeyUp = (e) => {
      if (!e.metaKey && !e.ctrlKey) setIsRotating(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Canvas
      shadows
      camera={{ position: [1.0, 2.2, 2.2], fov: 40, near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <CameraHandler view={view} />
      <color attach="background" args={["#f5f5f5"]} />
      <fog attach="fog" args={["#f5f5f5", 5, 30]} />

      <Suspense fallback={null}>
        <CircuitScene 
          highlightedComponentId={highlightedId} 
          componentStyles={componentStyles} 
          wires={wires}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <EffectComposer disableNormalPass multisampling={8}>
          <Bloom
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            intensity={0.8}
            mipmapBlur
            radius={0.4}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0002, 0.0002]}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.5} />
        </EffectComposer>
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={!isDragging}
        enabled={!isDragging}
        target={[0.2, 0, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.1}
        minDistance={0.8}
        maxDistance={12.0}
        rotateSpeed={0.8}
        zoomSpeed={1.0}
        mouseButtons={{
          LEFT: isRotating ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />
      {showStats && <Stats showPanel={0} className="arlab-stats" />}
    </Canvas>

    {/* HUD: Property Inspector */}
    {selectedId && (
      <PropertyInspector 
        selectedId={selectedId} 
        onClose={() => setSelectedId(null)} 
        onOpenCode={() => setShowCode(true)}
      />
    )}

    {/* HUD: Camera Controls */}
    <div style={{
      position: "absolute",
      right: "20px",
      bottom: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    }}>
      <button 
        onClick={() => setView("top")}
        style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        title="Top View"
      >
        🔝
      </button>
      <button 
        onClick={() => setView("perspective")}
        style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        title="Orbit View"
      >
        🔄
      </button>
    </div>

    {/* Integrated Code Editor Pane */}
    {showCode && (
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "450px",
        height: "100%",
        backgroundColor: "#1e1e1e",
        zIndex: 2000,
        boxShadow: "10px 0 30px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.3s ease-out"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <span style={{ fontWeight: 700 }}>Arduino Code Editor</span>
          <button onClick={() => setShowCode(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>
        <div style={{ flex: 1, padding: "20px", color: "#888", fontSize: "14px", fontFamily: "monospace" }}>
          {`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`}
        </div>
      </div>
    )}

    <style>{`
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `}</style>
    </div>
  );
}

function CameraHandler({ view }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === "top") {
      camera.position.set(0, 5, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(1.0, 2.2, 2.2);
      camera.lookAt(0.2, 0, 0);
    }
  }, [view, camera]);
  return null;
}
