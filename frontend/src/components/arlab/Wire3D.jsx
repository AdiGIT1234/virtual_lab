import { useEffect, useMemo } from "react";
import * as THREE from "three";

// ── Female Dupont connector housing ──────────────────────────────────────────
// Renders as a rectangular black plastic shell that slides DOWN over the male
// header pin (banana-peel over banana). The connector is oriented so its open
// end faces -Y (downward) to swallow the pin coming up from the PCB.
//
//  Cross-section (side view):
//    ┌───────┐   ← closed top  (+Y)
//    │       │
//    │  [ ] │   ← gold contact socket inside
//    │       │
//    └──   ──┘   ← open bottom (-Y) — slides over the pin
//
const CONN_W  = 0.038;   // housing width  ≈ 2.54 mm pitch block
const CONN_D  = 0.038;   // housing depth
const CONN_H  = 0.055;   // housing height ≈ 5.5 mm real
const WALL_T  = 0.006;   // plastic wall thickness
const SOCKET_R = 0.007;  // inner gold contact radius

function DupontConnector({ position, color }) {
  // The connector sits so its open end is at Y=0 of this group,
  // and the body extends upward (+Y). Place the group at the wire endpoint
  // then shift it up by half its height so it straddles the pin tip.
  const bodyY  = CONN_H / 2;
  const wallColor = "#1a1a22";

  return (
    <group position={position}>
      {/* ── Outer plastic housing — 4 walls + closed top ── */}

      {/* Front wall */}
      <mesh position={[0, bodyY, CONN_D / 2 - WALL_T / 2]}>
        <boxGeometry args={[CONN_W, CONN_H, WALL_T]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, bodyY, -(CONN_D / 2 - WALL_T / 2)]}>
        <boxGeometry args={[CONN_W, CONN_H, WALL_T]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-(CONN_W / 2 - WALL_T / 2), bodyY, 0]}>
        <boxGeometry args={[WALL_T, CONN_H, CONN_D]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Right wall */}
      <mesh position={[(CONN_W / 2 - WALL_T / 2), bodyY, 0]}>
        <boxGeometry args={[WALL_T, CONN_H, CONN_D]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Closed top cap */}
      <mesh position={[0, CONN_H, 0]}>
        <boxGeometry args={[CONN_W, WALL_T * 1.5, CONN_D]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.05} />
      </mesh>

      {/* ── Wire-coloured stripe on the housing ── */}
      <mesh position={[0, bodyY, CONN_D / 2 - WALL_T / 2 + 0.001]}>
        <boxGeometry args={[CONN_W * 0.55, CONN_H * 0.45, 0.001]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1}
          emissive={color} emissiveIntensity={0.25} />
      </mesh>

      {/* ── Gold contact socket inside (visible through open bottom) ── */}
      <mesh position={[0, CONN_H * 0.35, 0]}>
        <cylinderGeometry args={[SOCKET_R, SOCKET_R, CONN_H * 0.5, 8]} />
        <meshStandardMaterial color="#c8a820" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ── Tiny retention clip nub on one side ── */}
      <mesh position={[CONN_W / 2, CONN_H * 0.62, 0]}>
        <boxGeometry args={[WALL_T * 0.8, CONN_H * 0.18, CONN_D * 0.4]} />
        <meshStandardMaterial color="#111118" roughness={0.85} metalness={0.0} />
      </mesh>
    </group>
  );
}

// ── Main Wire3D component ─────────────────────────────────────────────────────
export default function Wire3D({ points = [], color = "#cc2200", glow = false, onClick, showConnectors = true }) {
  const { geometry, startPt, endPt } = useMemo(() => {
    if (points.length < 2) return { geometry: null, startPt: null, endPt: null };

    const vecs = points
      .map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      .filter((v, i, arr) => i === 0 || v.distanceTo(arr[i - 1]) > 1e-5);

    if (vecs.length < 2) return { geometry: null, startPt: null, endPt: null };

    let curve;
    if (vecs.length === 4) {
      const [p0, p1, p2, p3] = vecs;
      const midX = (p1.x + p2.x) / 2;
      const midY = Math.max(p1.y, p2.y) + 0.14;
      const midZ = (p1.z + p2.z) / 2;
      const apex = new THREE.Vector3(midX, midY, midZ);
      const q1 = new THREE.Vector3((p1.x + midX) / 2, (p1.y + midY) / 2, (p1.z + midZ) / 2);
      const q2 = new THREE.Vector3((p2.x + midX) / 2, (p2.y + midY) / 2, (p2.z + midZ) / 2);
      curve = new THREE.CatmullRomCurve3([p0, p1, q1, apex, q2, p2, p3], false, "catmullrom", 0.5);
    } else {
      const p0 = vecs[0], p1 = vecs[vecs.length - 1];
      const mid = new THREE.Vector3((p0.x + p1.x) / 2, Math.max(p0.y, p1.y) + 0.12, (p0.z + p1.z) / 2);
      curve = new THREE.CatmullRomCurve3([p0, mid, p1], false, "catmullrom", 0.5);
    }

    const geo = new THREE.TubeGeometry(curve, 48, 0.028, 10, false);
    return {
      geometry: geo,
      startPt: vecs[0].toArray(),
      endPt: vecs[vecs.length - 1].toArray(),
    };
  }, [points]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;

  return (
    <group>
      {/* Wire tube */}
      <mesh geometry={geometry} castShadow onClick={onClick}>
        <meshStandardMaterial
          color={color}
          roughness={0.55}
          metalness={0.0}
          emissive={glow ? color : "#000000"}
          emissiveIntensity={glow ? 0.6 : 0}
        />
      </mesh>

      {/* Female dupont connectors at each end */}
      {showConnectors && startPt && (
        <DupontConnector position={startPt} color={color} />
      )}
      {showConnectors && endPt && (
        <DupontConnector position={endPt} color={color} />
      )}
    </group>
  );
}
