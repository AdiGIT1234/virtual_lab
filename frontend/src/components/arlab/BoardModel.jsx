import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const MODEL_URL = new URL("../../assets/models/arduino_uno_proper.glb", import.meta.url).href;

const TARGET_WIDTH = 1.80; // scene units — keeps pin coords & wire geometry intact

export default function BoardModel(props) {
  const { scene } = useGLTF(MODEL_URL);

  const { cloned, scale, pos } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((n) => {
      if (!n.isMesh) return;
      n.castShadow    = true;
      n.receiveShadow = true;
      // Non-raycastable: prevents the board's 3D geometry from blocking
      // breadboard hole clicks in the area where board and breadboard overlap.
      n.raycast = () => {};
    });

    // Bounding box in Three.js space BEFORE we apply our own rotation.
    // The GLB root matrix already handles the Sketchfab Z→Y-up flip, so the
    // model loads with its face pointing toward +Z (still "vertical" in the
    // Y-up world).  We correct that with an additional –90° X rotation.
    const box = new THREE.Box3().setFromObject(c);
    // X: board width (stays X after –90°X rotation)
    // Y: board face dimension → becomes depth (Z) after –90°X rotation
    // Z: board thickness → becomes height (Y) after –90°X rotation
    const xWidth = box.max.x - box.min.x;
    const yDepth = box.max.y - box.min.y; // becomes scene Z after rotation
    const sc = TARGET_WIDTH / Math.max(xWidth, yDepth);

    // After rotation(-PI/2, X):  world_x=x, world_y=z_inter, world_z=-y_inter
    // Sit board bottom at group-local Y=0, centre XZ at 0.
    const ox = -((box.min.x + box.max.x) / 2) * sc;
    const oy = -box.min.z * sc;                         // board bottom → Y=0
    const oz =  ((box.min.y + box.max.y) / 2) * sc;     // centre Z

    return { cloned: c, scale: sc, pos: [ox, oy, oz] };
  }, [scene]);

  return (
    <group {...props}>
      <primitive
        object={cloned}
        scale={scale}
        rotation={[-Math.PI / 2, 0, 0]}
        position={pos}
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
