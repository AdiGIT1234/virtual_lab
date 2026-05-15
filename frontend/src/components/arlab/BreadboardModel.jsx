import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const COLS = 63;
const MAIN_ROWS = 5;
const HOLE_SPACING = 0.05;
const HOLE_RADIUS = 0.012;
const ROW_LABELS_TOP = ["a", "b", "c", "d", "e"];
const ROW_LABELS_BOT = ["f", "g", "h", "i", "j"];

const COLOR_DEFAULT  = new THREE.Color("#0f0f0f");
const COLOR_HOVER    = new THREE.Color("#ff6200");
const COLOR_OCCUPIED = new THREE.Color("#00cc55");
const COLOR_WIRING   = new THREE.Color("#00e5ff");

const holeGeo    = new THREE.CylinderGeometry(HOLE_RADIUS, HOLE_RADIUS * 0.8, 0.015, 8);
const holeMat    = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.1, vertexColors: true });
// Larger transparent cylinders used only for pointer hit-testing — makes hover forgiving
const holeHitGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.025, 8);
const holeHitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

export default function BreadboardModel({ occupiedHoles = new Set(), onHoleClick, onHoleHover: externalHover, wiringFromHole }) {
  const instancedRef    = useRef();
  const hitInstancedRef = useRef();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const holes = useMemo(() => {
    const result = [];
    const startX = -(COLS * HOLE_SPACING) / 2;
    const gapZ = 0.04;

    for (let col = 0; col < COLS; col++) {
      const x = startX + col * HOLE_SPACING;
      const colLabel = col + 1;

      for (let row = 0; row < MAIN_ROWS; row++) {
        const z = -(gapZ + MAIN_ROWS * HOLE_SPACING) + row * HOLE_SPACING + HOLE_SPACING / 2;
        result.push({ x, z, id: `${ROW_LABELS_TOP[row]}${colLabel}`, section: "main-top" });
      }
      for (let row = 0; row < MAIN_ROWS; row++) {
        const z = gapZ + row * HOLE_SPACING + HOLE_SPACING / 2;
        result.push({ x, z, id: `${ROW_LABELS_BOT[row]}${colLabel}`, section: "main-bot" });
      }

      const topPowerZ = -(gapZ + MAIN_ROWS * HOLE_SPACING + 0.06);
      result.push({ x, z: topPowerZ, id: `+T${colLabel}`, section: "power-top-pos" });
      result.push({ x, z: topPowerZ - HOLE_SPACING, id: `-T${colLabel}`, section: "power-top-neg" });

      const botPowerZ = gapZ + MAIN_ROWS * HOLE_SPACING + 0.06;
      result.push({ x, z: botPowerZ, id: `+B${colLabel}`, section: "power-bot-pos" });
      result.push({ x, z: botPowerZ + HOLE_SPACING, id: `-B${colLabel}`, section: "power-bot-neg" });
    }
    return result;
  }, []);

  // Update all instance matrices + colors whenever deps change
  useEffect(() => {
    const mesh    = instancedRef.current;
    const hitMesh = hitInstancedRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();

    holes.forEach((hole, i) => {
      dummy.position.set(hole.x, 0, hole.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (hitMesh) hitMesh.setMatrixAt(i, dummy.matrix);

      let col;
      if (hole.id === wiringFromHole) col = COLOR_WIRING;
      else if (occupiedHoles.has(hole.id)) col = COLOR_OCCUPIED;
      else if (i === hoveredIdx) col = COLOR_HOVER;
      else col = COLOR_DEFAULT;
      mesh.setColorAt(i, col);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (hitMesh) hitMesh.instanceMatrix.needsUpdate = true;
  }, [holes, occupiedHoles, hoveredIdx, wiringFromHole]);

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx == null) return;
    setHoveredIdx(idx);
    externalHover?.(holes[idx]?.id ?? null);
  }, [holes, externalHover]);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    setHoveredIdx(null);
    externalHover?.(null);
  }, [externalHover]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx == null) return;
    onHoleClick?.(holes[idx]?.id);
  }, [holes, onHoleClick]);

  const boardWidth = (COLS + 2) * HOLE_SPACING;
  const boardDepth = (MAIN_ROWS * 2 + 4 + 2) * HOLE_SPACING + 0.08;

  return (
    <group>
      {/* PCB Body — mid-tone warm gray, toned down in dark lab environment */}
      <mesh receiveShadow castShadow position={[0, -0.008, 0]}>
        <boxGeometry args={[boardWidth, 0.06, boardDepth]} />
        <meshStandardMaterial color="#9e9890" roughness={0.92} metalness={0.03} />
      </mesh>

      {/* Subtle rounded edge bevel */}
      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[boardWidth + 0.01, 0.058, boardDepth + 0.01]} />
        <meshStandardMaterial color="#8e8a82" roughness={0.92} metalness={0} transparent opacity={0.45} />
      </mesh>

      {/* Center channel divider */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[boardWidth - 0.08, 0.008, 0.05]} />
        <meshStandardMaterial color="#b8b4aa" roughness={0.9} />
      </mesh>

      {/* Power rail stripes */}
      {[
        { z: -(0.04 + MAIN_ROWS * HOLE_SPACING + 0.03), color: "#d42020" },
        { z: -(0.04 + MAIN_ROWS * HOLE_SPACING + 0.08), color: "#2040cc" },
        { z: 0.04 + MAIN_ROWS * HOLE_SPACING + 0.03,  color: "#d42020" },
        { z: 0.04 + MAIN_ROWS * HOLE_SPACING + 0.08,  color: "#2040cc" },
      ].map((stripe, i) => (
        <mesh key={i} position={[0, 0.023, stripe.z]}>
          <boxGeometry args={[boardWidth - 0.1, 0.003, 0.008]} />
          <meshStandardMaterial color={stripe.color} />
        </mesh>
      ))}

      {/* Column labels — every 5 cols */}
      <group position={[0, 0.025, 0]}>
        {Array.from({ length: Math.floor(COLS / 5) + 1 }).map((_, i) => {
          const col = i * 5 || 1;
          const x = -(COLS * HOLE_SPACING) / 2 + (col - 1) * HOLE_SPACING;
          return (
            <Html key={`col-${col}`} position={[x, 0.01, 0]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
              <span style={{ fontSize: "2px", color: "#777", fontWeight: 700, fontFamily: "Arial, sans-serif", userSelect: "none" }}>{col}</span>
            </Html>
          );
        })}
      </group>

      {/* Visual InstancedMesh — colored holes */}
      <group position={[0, 0.025, 0]}>
        <instancedMesh
          ref={instancedRef}
          args={[holeGeo, holeMat, holes.length]}
          frustumCulled={false}
        />
      </group>

      {/* Hit-area InstancedMesh — larger transparent cylinders for reliable hover */}
      <group position={[0, 0.026, 0]}>
        <instancedMesh
          ref={hitInstancedRef}
          args={[holeHitGeo, holeHitMat, holes.length]}
          frustumCulled={false}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      </group>

      {hoveredIdx != null && holes[hoveredIdx] && (
        <Html position={[holes[hoveredIdx].x, 0.12, holes[hoveredIdx].z]} center zIndexRange={[200, 0]}>
          <div style={{
            background: "rgba(13,17,23,0.9)",
            color: "#00e5ff",
            padding: "3px 9px",
            borderRadius: 5,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            border: "1px solid rgba(0,229,255,0.3)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}>
            {holes[hoveredIdx].id}
          </div>
        </Html>
      )}

      {/* Rubber pads — seat breadboard flush on workbench */}
      {[[-1.505, -0.045, -0.32], [1.505, -0.045, -0.32], [-1.505, -0.045, 0.32], [1.505, -0.045, 0.32]].map(([fx, fy, fz], i) => (
        <mesh key={`pad-${i}`} position={[fx, fy, fz]}>
          <boxGeometry args={[0.06, 0.014, 0.06]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.98} metalness={0.0} />
        </mesh>
      ))}
    </group>
  );
}
