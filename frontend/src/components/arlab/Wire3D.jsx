import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function Wire3D({ points = [], color = "#cc2200", glow = false }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), [points]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.013, 10, false), [curve]);

  useEffect(() => () => geometry.dispose(), [geometry]);

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
