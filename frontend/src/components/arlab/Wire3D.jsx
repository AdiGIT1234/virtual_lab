import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function Wire3D({ points = [], color = "#cc2200", glow = false, onClick }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;

    const vecs = points
      .map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      .filter((v, i, arr) => i === 0 || v.distanceTo(arr[i - 1]) > 1e-5);

    if (vecs.length < 2) return null;

    // Build a smooth parabolic arc like real jumper wires.
    // For a 4-point [start, exitA, exitB, end] layout:
    //   - compute the natural arc apex well above the two exit points
    //   - insert quarter-points on each side for a gentle S-free curve
    let curve;
    if (vecs.length === 4) {
      const [p0, p1, p2, p3] = vecs;

      // Apex sits above the midpoint of the horizontal run, arcing naturally
      const midX = (p1.x + p2.x) / 2;
      const midY = Math.max(p1.y, p2.y) + 0.14;   // high parabolic apex
      const midZ = (p1.z + p2.z) / 2;
      const apex = new THREE.Vector3(midX, midY, midZ);

      // Quarter-arc waypoints for smooth shoulder shape
      const q1 = new THREE.Vector3(
        (p1.x + midX) / 2, (p1.y + midY) / 2, (p1.z + midZ) / 2
      );
      const q2 = new THREE.Vector3(
        (p2.x + midX) / 2, (p2.y + midY) / 2, (p2.z + midZ) / 2
      );

      curve = new THREE.CatmullRomCurve3(
        [p0, p1, q1, apex, q2, p2, p3],
        false, "catmullrom", 0.5
      );
    } else {
      // Fallback for simple 2-point wires
      const p0 = vecs[0], p1 = vecs[vecs.length - 1];
      const mid = new THREE.Vector3(
        (p0.x + p1.x) / 2,
        Math.max(p0.y, p1.y) + 0.12,
        (p0.z + p1.z) / 2,
      );
      curve = new THREE.CatmullRomCurve3([p0, mid, p1], false, "catmullrom", 0.5);
    }

    const segments = 48;
    // Jumper wire: 0.028 radius ≈ 2.8mm diameter — matches real 22AWG jumper cable
    return new THREE.TubeGeometry(curve, segments, 0.028, 10, false);
  }, [points]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow onClick={onClick}>
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.0}
        emissive={glow ? color : "#000000"}
        emissiveIntensity={glow ? 0.6 : 0}
      />
    </mesh>
  );
}
