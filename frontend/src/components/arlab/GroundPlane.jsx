import { useMemo } from "react";
import * as THREE from "three";

export default function GroundPlane() {
  const gridTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#020509";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(0, 255, 204, 0.08)";
    ctx.lineWidth = 1;
    const step = 32;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        color="#04090f"
        roughness={0.8}
        metalness={0.1}
        map={gridTexture || undefined}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
