import { useState, useCallback, useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * High-fidelity breadboard with individually interactive holes.
 * Each hole has its own identity (row + column), is hoverable/clickable,
 * and supports component placement snapping.
 */

const COLS = 63;            // Standard 830-point breadboard
const MAIN_ROWS = 5;        // Rows a-e and f-j on each side
const POWER_ROWS = 2;       // +/- rails on each side
const HOLE_SPACING = 0.05;  // 2.54mm pitch scaled
const HOLE_RADIUS = 0.012;
const ROW_LABELS_TOP = ["a", "b", "c", "d", "e"];
const ROW_LABELS_BOT = ["f", "g", "h", "i", "j"];

// Memoized hole material cache
const holeMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9, metalness: 0.1 });
const holeHoverMat = new THREE.MeshStandardMaterial({ color: "#ff6600", roughness: 0.5, metalness: 0.3, emissive: "#ff6600", emissiveIntensity: 0.3 });
const holeOccupiedMat = new THREE.MeshStandardMaterial({ color: "#00cc66", roughness: 0.5, metalness: 0.3, emissive: "#00cc66", emissiveIntensity: 0.2 });

// Single hole component — optimized with instancing awareness
function BreadboardHole({ position, holeId, isOccupied, onHoleClick, onHoleHover, isHovered }) {
  const material = isOccupied ? holeOccupiedMat : isHovered ? holeHoverMat : holeMat;

  return (
    <mesh
      position={position}
      material={material}
      onPointerOver={(e) => { e.stopPropagation(); onHoleHover?.(holeId); }}
      onPointerOut={(e) => { e.stopPropagation(); onHoleHover?.(null); }}
      onClick={(e) => { e.stopPropagation(); onHoleClick?.(holeId); }}
    >
      <cylinderGeometry args={[HOLE_RADIUS, HOLE_RADIUS * 0.8, 0.015, 8]} />
    </mesh>
  );
}

export default function BreadboardModel({ occupiedHoles = new Set(), onHoleClick, onHoleHover: externalHover }) {
  const [hoveredHole, setHoveredHole] = useState(null);
  
  const handleHoleHover = useCallback((id) => {
    setHoveredHole(id);
    externalHover?.(id);
  }, [externalHover]);

  // Pre-compute all hole positions
  const holes = useMemo(() => {
    const result = [];
    const startX = -(COLS * HOLE_SPACING) / 2;
    const gapZ = 0.04; // Center divider gap

    for (let col = 0; col < COLS; col++) {
      const x = startX + col * HOLE_SPACING;
      const colLabel = col + 1;

      // Top main rows (a-e)
      for (let row = 0; row < MAIN_ROWS; row++) {
        const z = -(gapZ + MAIN_ROWS * HOLE_SPACING) + row * HOLE_SPACING + HOLE_SPACING / 2;
        const id = `${ROW_LABELS_TOP[row]}${colLabel}`;
        result.push({ x, z, id, section: "main-top" });
      }

      // Bottom main rows (f-j)
      for (let row = 0; row < MAIN_ROWS; row++) {
        const z = gapZ + row * HOLE_SPACING + HOLE_SPACING / 2;
        const id = `${ROW_LABELS_BOT[row]}${colLabel}`;
        result.push({ x, z, id, section: "main-bot" });
      }

      // Power rails — top side (+ and -)
      const topPowerZ = -(gapZ + MAIN_ROWS * HOLE_SPACING + 0.06);
      result.push({ x, z: topPowerZ, id: `+T${colLabel}`, section: "power-top-pos" });
      result.push({ x, z: topPowerZ - HOLE_SPACING, id: `-T${colLabel}`, section: "power-top-neg" });

      // Power rails — bottom side (+ and -)
      const botPowerZ = gapZ + MAIN_ROWS * HOLE_SPACING + 0.06;
      result.push({ x, z: botPowerZ, id: `+B${colLabel}`, section: "power-bot-pos" });
      result.push({ x, z: botPowerZ + HOLE_SPACING, id: `-B${colLabel}`, section: "power-bot-neg" });
    }
    return result;
  }, []);

  const boardWidth = (COLS + 2) * HOLE_SPACING;
  const boardDepth = (MAIN_ROWS * 2 + POWER_ROWS * 2 + 4) * HOLE_SPACING + 0.08;

  return (
    <group>
      {/* Main PCB Body — white matte plastic */}
      <mesh receiveShadow castShadow position={[0, -0.008, 0]}>
        <boxGeometry args={[boardWidth, 0.06, boardDepth]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Rounded edge strips */}
      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[boardWidth + 0.01, 0.058, boardDepth + 0.01]} />
        <meshStandardMaterial color="#e8e6e0" roughness={0.9} metalness={0} transparent opacity={0.5} />
      </mesh>

      {/* Center Channel Divider */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[boardWidth - 0.08, 0.008, 0.05]} />
        <meshStandardMaterial color="#dddbd5" roughness={0.9} />
      </mesh>

      {/* Power Rail Marking Lines */}
      {/* Top positive (red) */}
      <mesh position={[0, 0.023, -(0.04 + MAIN_ROWS * HOLE_SPACING + 0.03)]}>
        <boxGeometry args={[boardWidth - 0.1, 0.003, 0.008]} />
        <meshStandardMaterial color="#e03030" />
      </mesh>
      {/* Top negative (blue) */}
      <mesh position={[0, 0.023, -(0.04 + MAIN_ROWS * HOLE_SPACING + 0.08)]}>
        <boxGeometry args={[boardWidth - 0.1, 0.003, 0.008]} />
        <meshStandardMaterial color="#3060e0" />
      </mesh>
      {/* Bottom positive (red) */}
      <mesh position={[0, 0.023, 0.04 + MAIN_ROWS * HOLE_SPACING + 0.03]}>
        <boxGeometry args={[boardWidth - 0.1, 0.003, 0.008]} />
        <meshStandardMaterial color="#e03030" />
      </mesh>
      {/* Bottom negative (blue) */}
      <mesh position={[0, 0.023, 0.04 + MAIN_ROWS * HOLE_SPACING + 0.08]}>
        <boxGeometry args={[boardWidth - 0.1, 0.003, 0.008]} />
        <meshStandardMaterial color="#3060e0" />
      </mesh>

      {/* Column number labels — every 5 columns */}
      <group position={[0, 0.025, 0]}>
        {Array.from({ length: Math.floor(COLS / 5) + 1 }).map((_, i) => {
          const col = i * 5 || 1;
          const x = -(COLS * HOLE_SPACING) / 2 + (col - 1) * HOLE_SPACING;
          return (
            <Html key={`col-${col}`} position={[x, 0.01, 0]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
              <span style={{ fontSize: "2px", color: "#888", fontWeight: 700, fontFamily: "Arial, sans-serif", userSelect: "none" }}>{col}</span>
            </Html>
          );
        })}
      </group>

      {/* Row labels (a-e left) */}
      <group position={[-(COLS * HOLE_SPACING) / 2 - 0.04, 0.025, 0]}>
        {ROW_LABELS_TOP.map((letter, i) => {
          const z = -(0.04 + MAIN_ROWS * HOLE_SPACING) + i * HOLE_SPACING + HOLE_SPACING / 2;
          return (
            <Html key={`rt-${letter}`} position={[0, 0.01, z]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
              <span style={{ fontSize: "2px", color: "#888", fontWeight: 700, fontFamily: "Arial, sans-serif", userSelect: "none" }}>{letter}</span>
            </Html>
          );
        })}
        {ROW_LABELS_BOT.map((letter, i) => {
          const z = 0.04 + i * HOLE_SPACING + HOLE_SPACING / 2;
          return (
            <Html key={`rb-${letter}`} position={[0, 0.01, z]} transform occlude center rotation={[-Math.PI / 2, 0, 0]}>
              <span style={{ fontSize: "2px", color: "#888", fontWeight: 700, fontFamily: "Arial, sans-serif", userSelect: "none" }}>{letter}</span>
            </Html>
          );
        })}
      </group>

      {/* All interactive holes */}
      <group position={[0, 0.025, 0]}>
        {holes.map((hole) => (
          <BreadboardHole
            key={hole.id}
            position={[hole.x, 0, hole.z]}
            holeId={hole.id}
            isOccupied={occupiedHoles.has(hole.id)}
            isHovered={hoveredHole === hole.id}
            onHoleClick={onHoleClick}
            onHoleHover={handleHoleHover}
          />
        ))}
      </group>

      {/* Hover tooltip */}
      {hoveredHole && (
        <Html position={[0, 0.12, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            Hole {hoveredHole}
          </div>
        </Html>
      )}
    </group>
  );
}
