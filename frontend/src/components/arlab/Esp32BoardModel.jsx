import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const MODEL_URL = new URL("../../assets/models/esp32_30pin.glb", import.meta.url).href;

// Pin pitch is 2.54mm. We want it to be 0.0667 scene units.
const SCALE_FACTOR = 0.0667 / 2.54; 

export default function Esp32BoardModel(props) {
  const { scene } = useGLTF(MODEL_URL);

  const { cloned, scale, pos } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((n) => {
      if (!n.isMesh) return;
      n.castShadow = true;
      n.receiveShadow = true;
      n.raycast = () => {};
    });

    const box = new THREE.Box3().setFromObject(c);
    
    // Scale down from mm to scene units
    const sc = SCALE_FACTOR; 
    
    // Center the model in X and Z, and place bottom on Y=0
    // After rotation(-PI/2, X): world_x=x, world_y=z_inter, world_z=-y_inter
    const ox = -((box.min.x + box.max.x) / 2) * sc;
    const oy = -box.min.z * sc; 
    const oz =  ((box.min.y + box.max.y) / 2) * sc; 

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
