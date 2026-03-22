import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";

export default function GroundPlane() {
  const gridTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Dark base
    ctx.fillStyle = "#040810";
    ctx.fillRect(0, 0, size, size);

    // Major grid lines – cyan glow
    ctx.strokeStyle = "rgba(0, 210, 255, 0.12)";
    ctx.lineWidth = 1.5;
    const majorStep = 64;
    for (let i = 0; i <= size; i += majorStep) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Minor grid lines – subtle
    ctx.strokeStyle = "rgba(0, 210, 255, 0.04)";
    ctx.lineWidth = 0.5;
    const minorStep = 16;
    for (let i = 0; i <= size; i += minorStep) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Center crosshair accent
    ctx.strokeStyle = "rgba(0, 255, 136, 0.15)";
    ctx.lineWidth = 2;
    const mid = size / 2;
    ctx.beginPath();
    ctx.moveTo(mid, 0);
    ctx.lineTo(mid, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(size, mid);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    texture.anisotropy = 16;
    return texture;
  }, []);

  return (
    <group>
      {/* Main reflective ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={0.9}
          mixStrength={2.0}
          roughness={0.65}
          depthScale={1.0}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.5}
          color="#060c18"
          metalness={0.85}
          map={gridTexture || undefined}
          mirror={0.5}
        />
      </mesh>

      {/* Subtle radial glow under the scene center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.005, 0]}>
        <circleGeometry args={[3, 48]} />
        <meshBasicMaterial
          color="#00d4ff"
          opacity={0.03}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
