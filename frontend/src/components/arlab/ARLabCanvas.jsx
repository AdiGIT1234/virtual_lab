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
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}
      >
        <CameraController view={cameraView} />
        
        {/* Dark lab atmosphere */}
        <color attach="background" args={["#0d1117"]} />
        <fog attach="fog" args={["#0d1117", 6, 28]} />

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
              luminanceThreshold={0.25}
              luminanceSmoothing={0.7}
              intensity={1.8}
              mipmapBlur
              radius={0.5}
            />
            <Vignette eskil={false} offset={0.2} darkness={0.65} />
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
        <span style={styles.cameraPanelLabel}>VIEW</span>
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
    fontSize: 10,
    color: "#8b949e",
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.12em",
  },
  cameraButtons: {
    display: "flex",
    gap: 3,
    background: "rgba(13,17,23,0.85)",
    borderRadius: 10,
    padding: 4,
    border: "1px solid rgba(48,54,61,0.9)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    backdropFilter: "blur(12px)",
  },
  cameraBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    border: "none",
    background: "transparent",
    color: "#8b949e",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  cameraBtnActive: {
    background: "rgba(0,229,255,0.15)",
    color: "#00e5ff",
    boxShadow: "0 0 8px rgba(0,229,255,0.25)",
  },
  inspector: {
    position: "absolute",
    right: 16,
    top: 80,
    width: 240,
    background: "rgba(13,17,23,0.92)",
    borderRadius: 12,
    border: "1px solid #30363d",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    backdropFilter: "blur(16px)",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  inspectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #30363d",
  },
  inspectorTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e6edf3",
  },
  inspectorClose: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#8b949e",
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
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  inspectorValue: {
    fontSize: 12,
    color: "#79c0ff",
    fontWeight: 600,
    fontFamily: "monospace",
  },
};
