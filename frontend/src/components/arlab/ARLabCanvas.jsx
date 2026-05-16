import { useState, useEffect, useRef, Suspense, Component } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import CircuitScene from "./CircuitScene";
import { useCircuitStore } from "../../state/useCircuitStore";

class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#080808", color: "#8b949e", fontSize: 13, fontFamily: "Inter, sans-serif", flexDirection: "column", gap: 8 }}>
          <span>3D view encountered an error.</span>
          <button onClick={() => this.setState({ error: null })} style={{ padding: "4px 12px", background: "#21262d", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", cursor: "pointer", fontSize: 12 }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const showStats = import.meta.env.DEV;

const SCENE_CENTER = [-0.5, 0, 0];
const CAMERA_PRESETS = {
  perspective: { pos: [0.4, 2.0, 3.2], target: SCENE_CENTER, fov: 52 },
  front:       { pos: [-0.2, 0.8, 5.0], target: SCENE_CENTER, fov: 44 },
  top:         { pos: [-0.2, 6.0, 0.01], target: SCENE_CENTER, fov: 52 },
  side:        { pos: [4.5, 1.0, 0.1], target: SCENE_CENTER, fov: 44 },
};

// Base camera distance at 100% zoom (perspective preset)
const BASE_DIST = Math.sqrt(
  (0.4 - SCENE_CENTER[0]) ** 2 +
  (2.0 - SCENE_CENTER[1]) ** 2 +
  (3.2 - SCENE_CENTER[2]) ** 2
);

function SetupOrbitSync({ sp, cr }) {
  useEffect(() => {
    if (!cr?.current) return;
    cr.current.target.set(-0.5 + sp.x, 0, sp.z);
    cr.current.update();
  }, [sp, cr]);
  return null;
}

// Fires onZoomChange(pct) whenever the camera distance changes
function ZoomTracker({ controlsRef, onZoomChange }) {
  const { camera } = useThree();
  const lastPct = useRef(null);
  useFrame(() => {
    if (!controlsRef?.current) return;
    const dist = camera.position.distanceTo(controlsRef.current.target);
    const pct = Math.round((BASE_DIST / dist) * 100);
    if (pct !== lastPct.current) {
      lastPct.current = pct;
      onZoomChange?.(pct);
    }
  });
  return null;
}

export default function ARLabCanvas({
  highlightedId, componentStyles, wires = [],
  onHoleClick, occupiedHoles, onPinClick,
  wiringFrom, wiringFromHole,
  drawnWires = [], selectedWireIdx, onWireSelect,
  onRemoveComponent, onComponentMove,
  compact = false,
  // Controlled from parent
  cameraView = "perspective", onCameraViewChange,
  onZoomChange,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [setupPos, setSetupPos] = useState({ x: 0, z: 0 });
  const controlsRef = useRef(null);

  // Keyboard shortcuts 1-4
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
      const map = { "1": "perspective", "2": "front", "3": "top", "4": "side" };
      if (map[e.key]) onCameraViewChange?.(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCameraViewChange]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }} onContextMenu={(e) => e.preventDefault()}>
      <CanvasErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0.4, 2.0, 3.2], fov: 52, near: 0.01, far: 600 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        >
          <CameraController view={cameraView} controlsRef={controlsRef} />

          <color attach="background" args={["#080808"]} />
          <fog attach="fog" args={["#080808", 60, 300]} />

          <Suspense fallback={null}>
            <CircuitScene
              highlightedComponentId={highlightedId}
              componentStyles={componentStyles}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onHoleClick={onHoleClick}
              occupiedHoles={occupiedHoles}
              onPinClick={onPinClick}
              wiringFrom={wiringFrom}
              wiringFromHole={wiringFromHole}
              drawnWires={drawnWires}
              selectedWireIdx={selectedWireIdx}
              onWireSelect={onWireSelect}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onComponentMove={onComponentMove}
              setupPos={setupPos}
              onSetupMove={(x, z) => setSetupPos({ x, z })}
            />
            <SetupOrbitSync sp={setupPos} cr={controlsRef} />
            <ZoomTracker controlsRef={controlsRef} onZoomChange={onZoomChange} />
            <EffectComposer disableNormalPass multisampling={4}>
              <Bloom intensity={0.35} luminanceThreshold={0.82} luminanceSmoothing={0.06} />
              <Vignette eskil={false} offset={0.3} darkness={0.6} />
            </EffectComposer>
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={!isDragging}
            enableDamping
            dampingFactor={0.1}
            enablePan
            target={[-0.2, 0, 0.1]}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={0.05}
            minDistance={0.5}
            maxDistance={120.0}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
            panSpeed={0.8}
            mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          />
          {showStats && <Stats showPanel={0} className="arlab-stats" />}
        </Canvas>
      </CanvasErrorBoundary>

      {/* Property Inspector — top-right, shown on component click */}
      {selectedId && (
        <PropertyInspectorHUD
          selectedId={selectedId}
          onClose={() => setSelectedId(null)}
          onRemove={onRemoveComponent}
        />
      )}
    </div>
  );
}

function CameraController({ view, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    const preset = CAMERA_PRESETS[view] || CAMERA_PRESETS.perspective;
    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(...preset.pos);
    const duration = 520;
    const startTime = Date.now();
    const animate = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(...preset.target);
      if (controlsRef?.current) {
        controlsRef.current.target.set(...preset.target);
        controlsRef.current.update();
      }
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [view, camera, controlsRef]);
  return null;
}

function PropertyInspectorHUD({ selectedId, onClose, onRemove }) {
  const components = useCircuitStore((s) => s.components);
  const outputs    = useCircuitStore((s) => s.outputs);
  const component  = components.find((c) => c.id === selectedId);
  if (!component) return null;

  const level = outputs[component.pin] ?? 0;
  const rows = [
    { label: "Type",  value: component.type },
    component.pin != null && { label: "Pin",   value: `D${component.pin}` },
    component.resistance != null && { label: "Value", value: `${component.resistance} Ω` },
    component.metadata?.capacitance != null && { label: "Value", value: `${component.metadata.capacitance} ${component.metadata.unit || "nF"}` },
    component.pin != null && { label: "State", value: level > 0.5 ? "HIGH" : level > 0 ? `PWM ${Math.round(level * 100)}%` : "LOW" },
  ].filter(Boolean);

  return (
    <div style={s.inspector}>
      <div style={s.inspectorHeader}>
        <span style={s.inspectorTitle}>{component.type}</span>
        <button onClick={onClose} style={s.inspectorClose} aria-label="Close">×</button>
      </div>
      <div style={s.inspectorBody}>
        <div style={{ ...s.inspectorRow, borderBottom: "1px solid #21262d", paddingBottom: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "#6e7681", fontFamily: "monospace" }}>{selectedId}</span>
        </div>
        {rows.map((row) => (
          <div key={row.label} style={s.inspectorRow}>
            <span style={s.inspectorLabel}>{row.label}</span>
            <span style={{ ...s.inspectorValue, color: row.label === "State" && level > 0.5 ? "#4ac26b" : row.label === "State" ? "#8b949e" : "#79c0ff" }}>
              {row.value}
            </span>
          </div>
        ))}
        {component.manuallyPlaced && onRemove && (
          <button style={s.removeBtn} onClick={() => { onRemove(selectedId); onClose(); }}>
            Remove Component
          </button>
        )}
      </div>
    </div>
  );
}

const s = {
  inspector: {
    position: "absolute", right: 16, top: 16,
    width: 232,
    background: "rgba(10,12,16,0.94)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
    backdropFilter: "blur(16px)",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    zIndex: 20,
  },
  inspectorHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  inspectorTitle: { fontSize: 12, fontWeight: 700, color: "#e6edf3", textTransform: "uppercase", letterSpacing: "0.06em" },
  inspectorClose: { background: "none", border: "none", fontSize: 18, color: "#6e7681", cursor: "pointer", lineHeight: 1 },
  inspectorBody: { padding: "10px 14px" },
  inspectorRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" },
  inspectorLabel: { fontSize: 10, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.08em" },
  inspectorValue: { fontSize: 12, color: "#79c0ff", fontWeight: 600, fontFamily: "monospace" },
  removeBtn: {
    marginTop: 10, width: "100%", padding: "6px 0", fontSize: 11, fontWeight: 600,
    border: "1px solid rgba(248,113,113,0.35)", borderRadius: 6,
    background: "rgba(248,113,113,0.07)", color: "#f87171", cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
};
