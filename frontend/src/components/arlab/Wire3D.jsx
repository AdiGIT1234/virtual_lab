import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function Wire3D({ points = [], color = "#cc2200", glow = false, onClick }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;

    // Convert to Vector3 and deduplicate
    const vecs = points
      .map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      .filter((v, i, arr) => i === 0 || v.distanceTo(arr[i - 1]) > 1e-5);

    if (vecs.length < 2) return null;

    // Insert a mid-sag point between the two high waypoints for cable droop.
    // points layout from buildWirePoints: [pin1, top1, top2, pin2]
    // We inject a drooping midpoint between top1 and top2.
    let enriched = [...vecs];
    if (vecs.length === 4) {
      const top1 = vecs[1];
      const top2 = vecs[2];
      const mid = new THREE.Vector3(
        (top1.x + top2.x) / 2,
        Math.min(top1.y, top2.y) - 0.018, // sag below the exit height
        (top1.z + top2.z) / 2,
      );
      enriched = [vecs[0], top1, mid, top2, vecs[3]];
    }

    // CatmullRom gives smooth curves through all waypoints — no sharp corners
    const curve = new THREE.CatmullRomCurve3(enriched, false, "catmullrom", 0.5);
    const segments = Math.max(24, enriched.length * 8);
    return new THREE.TubeGeometry(curve, segments, 0.0145, 10, false);
  }, [points]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow onClick={onClick}>
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.05}
        emissive={glow ? color : "#000000"}
        emissiveIntensity={glow ? 0.8 : 0}
      />
    </mesh>
  );
}
