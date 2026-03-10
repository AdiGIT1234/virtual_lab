import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

const MODEL_URL = new URL("../../assets/models/arduino_uno.gltf", import.meta.url).href;

export default function BoardModel(props) {
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);

  return <primitive object={cloned} {...props} />;
}

useGLTF.preload(MODEL_URL);
