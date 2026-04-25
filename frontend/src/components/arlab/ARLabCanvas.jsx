import { useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import CircuitScene from "./CircuitScene";

const showStats = import.meta.env.DEV;

// Center of scene: midpoint of Arduino (world -1.4) and breadboard (world 0.4)
const SCENE_CENTER = [-0.3, 0, 0];
const CAMERA_PRESETS = {
  perspective: { pos: [0.8, 2.8, 2.4], target: SCENE_CENTER, fov: 58 },
  front:       { pos: [-0.3, 1.0, 5.0], target: SCENE_CENTER, fov: 48 },
  top:         { pos: [-0.3, 6.0, 0.01], target: SCENE_CENTER, fov: 55 },
  side:        { pos: [5.0, 1.2, 0], target: SCENE_CENTER, fov: 48 },
};

const VIEW_KEYS = { "1": "perspective", "2": "front", "3": "top", "4": "side" };

export default function ARLabCanvas({ highlightedId, componentStyles, wires = [], onHoleClick, occupiedHoles }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [cameraView, setCameraView] = useState("perspective");

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  // Keyboard shortcuts: 1-4 to switch camera views
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
      const view = VIEW_KEYS[e.key];
      if (view) setCameraView(view);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Canvas
        shadows
        camera={{ position: [0.8, 2.8, 2.4], fov: 58, near: 0.01, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      >
        <CameraController view={cameraView} />
        
        {/* Dark lab atmosphere */}
        <color attach="background" args={["#0d1117"]} />
        <fog attach="fog" args={["#0d1117", 10, 40]} />

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
              luminanceThreshold={0.45}
              luminanceSmoothing={0.8}
              intensity={0.9}
              mipmapBlur
              radius={0.4}
            />
            <Vignette eskil={false} offset={0.25} darkness={0.45} />
          </EffectComposer>
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          enablePan={!isDragging}
          enabled={!isDragging}
          target={[-0.3, 0, 0]}
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

      {/* Camera Control Buttons */}
      <div style={styles.cameraPanel} role="toolbar" aria-label="Camera views">
        <span style={styles.cameraPanelLabel} aria-hidden="true">VIEW</span>
        <div style={styles.cameraButtons}>
          {[
            { view: "perspective", label: "Orbit view (1)", key: "1", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            )},
            { view: "front", label: "Front view (2)", key: "2", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            )},
            { view: "top", label: "Top view (3)", key: "3", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>
              </svg>
            )},
            { view: "side", label: "Side view (4)", key: "4", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
              </svg>
            )},
          ].map(({ view, label, icon }) => (
            <button
              key={view}
              style={{ ...styles.cameraBtn, ...(cameraView === view ? styles.cameraBtnActive : {}) }}
              onClick={() => setCameraView(view)}
              aria-label={label}
              aria-pressed={cameraView === view}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Controls hint — bottom-left */}
      <div style={styles.hintsBar} aria-label="Navigation controls">
        <span style={styles.hint}><kbd style={styles.kbd}>Drag</kbd> Rotate</span>
        <span style={styles.hint}><kbd style={styles.kbd}>Scroll</kbd> Zoom</span>
        <span style={styles.hint}><kbd style={styles.kbd}>Right-drag</kbd> Pan</span>
        <span style={styles.hint}><kbd style={styles.kbd}>1–4</kbd> Views</span>
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
  hintsBar: {
    position: "absolute",
    bottom: 14,
    left: 14,
    display: "flex",
    gap: 14,
    alignItems: "center",
    background: "rgba(13,17,23,0.75)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(48,54,61,0.7)",
    borderRadius: 8,
    padding: "5px 12px",
    pointerEvents: "none",
  },
  hint: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#6e7681",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
  },
  kbd: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#8b949e",
    background: "rgba(48,54,61,0.8)",
    border: "1px solid #444c56",
    borderRadius: 4,
    padding: "1px 5px",
    fontWeight: 600,
  },
};
