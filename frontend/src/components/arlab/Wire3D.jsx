import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function Wire3D({ points = [], color = "#cc2200", glow = false }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const path = new THREE.CurvePath();
    for (let i = 0; i < vecs.length - 1; i++) {
      path.add(new THREE.LineCurve3(vecs[i], vecs[i + 1]));
    }
    // segments proportional to number of straight pieces for clean geometry
    return new THREE.TubeGeometry(path, (vecs.length - 1) * 4, 0.013, 10, false);
  }, [points]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.78}
        metalness={0}
        emissive={glow ? color : "black"}
        emissiveIntensity={glow ? 0.5 : 0}
      />
    </mesh>
  );
}
