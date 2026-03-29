import { useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

// Camera presets like withdiode.com
const CAMERA_PRESETS = {
  perspective: { pos: [2.5, 3.5, 3.5], target: [0.2, 0, 0], fov: 35 },
  front: { pos: [0, 1.5, 5], target: [0, 0, 0], fov: 35 },
  top: { pos: [0, 6, 0.01], target: [0, 0, 0], fov: 35 },
  side: { pos: [6, 1.5, 0], target: [0, 0, 0], fov: 35 },
};

export default function ARLabCanvas({ highlightedId, componentStyles, wires = [], onHoleClick, occupiedHoles }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [cameraView, setCameraView] = useState("perspective");

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Canvas
        shadows
        camera={{ position: [2.5, 3.5, 3.5], fov: 35, near: 0.01, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <CameraController view={cameraView} />
        
        {/* Clean white studio background */}
        <color attach="background" args={["#f0f0f0"]} />
        <fog attach="fog" args={["#f0f0f0", 8, 40]} />

        <Suspense fallback={null}>
          <CircuitScene
            highlightedComponentId={highlightedId}
            componentStyles={componentStyles}
            wires={wires}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onHoleClick={onHoleClick}
            occupiedHoles={occupiedHoles}
          />
          <EffectComposer disableNormalPass multisampling={4}>
            <Bloom
              luminanceThreshold={0.8}
              luminanceSmoothing={0.9}
              intensity={0.4}
              mipmapBlur
              radius={0.3}
            />
            <Vignette eskil={false} offset={0.15} darkness={0.3} />
          </EffectComposer>
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          enablePan={!isDragging}
          enabled={!isDragging}
          target={[0.2, 0, 0]}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.05}
          minDistance={0.5}
          maxDistance={15.0}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          panSpeed={0.8}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        {showStats && <Stats showPanel={0} className="arlab-stats" />}
      </Canvas>

      {/* Camera Control Buttons — matches withdiode.com style */}
      <div style={styles.cameraPanel}>
        <span style={styles.cameraPanelLabel}>Camera</span>
        <div style={styles.cameraButtons}>
          <button
            style={{ ...styles.cameraBtn, ...(cameraView === "perspective" ? styles.cameraBtnActive : {}) }}
            onClick={() => setCameraView("perspective")}
            title="Orbit View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </button>
          <button
            style={{ ...styles.cameraBtn, ...(cameraView === "front" ? styles.cameraBtnActive : {}) }}
            onClick={() => setCameraView("front")}
            title="Front View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
          <button
            style={{ ...styles.cameraBtn, ...(cameraView === "top" ? styles.cameraBtnActive : {}) }}
            onClick={() => setCameraView("top")}
            title="Top View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
          <button
            style={{ ...styles.cameraBtn, ...(cameraView === "side" ? styles.cameraBtnActive : {}) }}
            onClick={() => setCameraView("side")}
            title="Side View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v16H4z"/>
              <path d="M4 12h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Property Inspector */}
      {selectedId && (
        <PropertyInspectorHUD selectedId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function CameraController({ view }) {
  const { camera } = useThree();
  useEffect(() => {
    const preset = CAMERA_PRESETS[view] || CAMERA_PRESETS.perspective;
    // Smooth transition
    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(...preset.pos);
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out quad

      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(...preset.target);

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [view, camera]);
  return null;
}

function PropertyInspectorHUD({ selectedId, onClose }) {
  return (
    <div style={styles.inspector}>
      <div style={styles.inspectorHeader}>
        <span style={styles.inspectorTitle}>{selectedId}</span>
        <button onClick={onClose} style={styles.inspectorClose}>×</button>
      </div>
      <div style={styles.inspectorBody}>
        <div style={styles.inspectorRow}>
          <span style={styles.inspectorLabel}>ID</span>
          <span style={styles.inspectorValue}>{selectedId}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  cameraPanel: {
    position: "absolute",
    top: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  cameraPanelLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.05em",
  },
  cameraButtons: {
    display: "flex",
    gap: 4,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    padding: 4,
    border: "1px solid #e0e0e0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    backdropFilter: "blur(8px)",
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#666",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  cameraBtnActive: {
    background: "#333",
    color: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  },
  inspector: {
    position: "absolute",
    right: 16,
    top: 80,
    width: 240,
    background: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    border: "1px solid #e0e0e0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  inspectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
  },
  inspectorTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
  },
  inspectorClose: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#999",
    cursor: "pointer",
  },
  inspectorBody: {
    padding: "12px 16px",
  },
  inspectorRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  inspectorLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  inspectorValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: 600,
    fontFamily: "monospace",
  },
};
