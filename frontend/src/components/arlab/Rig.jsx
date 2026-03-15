import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Rig() {
  const group = useRef();

  useFrame(({ camera }, delta) => {
    const t = performance.now() * 0.00015;
    const radius = 0.1;
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
    }
    camera.position.x += Math.sin(t) * radius;
    camera.position.z += Math.cos(t) * radius;
    camera.lookAt(0, 0, 0);
  });

  return <group ref={group} />;
}
