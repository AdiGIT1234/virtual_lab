import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import SceneLighting from "./SceneLighting";
import BoardModel from "./BoardModel";
import BreadboardModel from "./BreadboardModel";
import PinHotspots from "./PinHotspots";
import Led3D from "./Led3D";
import Wire3D from "./Wire3D";
import Resistor3D from "./Resistor3D";
import GroundPlane from "./GroundPlane";

const getComponentPosition = (index) => {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = 0.65 + column * 0.2;
  const z = -0.4 + row * 0.32;
  const y = 0.12;
  return [x, y, z];
};

export default function CircuitScene() {
  const components = useCircuitStore((state) => state.components);
  const outputs = useCircuitStore((state) => state.outputs);

  const sceneComponents = useMemo(() => {
    return components.map((component, index) => {
      const position = getComponentPosition(index);
      const boardPin = component.pin != null ? getPinCoord(component.pin) : null;
      let wirePoints = null;
      if (boardPin) {
        const midPoint = [
          (boardPin[0] + position[0]) / 2,
          Math.max(boardPin[1], position[1]) + 0.15,
          (boardPin[2] + position[2]) / 2,
        ];
        wirePoints = [boardPin, midPoint, position];
      }
      return {
        ...component,
        position,
        rotation: [0, 0, 0],
        wirePoints,
      };
    });
  }, [components]);

  return (
    <group position={[0, -0.35, 0]}>
      <SceneLighting />
      <GroundPlane />
      <group position={[0, 0, 0]} rotation={[-0.35, 0.3, 0]}>
        <BoardModel />
        <PinHotspots />
      </group>
      <group position={[0.4, -0.02, 0.55]} rotation={[-Math.PI / 2, 0.4, 0]}>
        <BreadboardModel scale={0.8} />
      </group>

      {sceneComponents.map((component) => {
        if (component.type === "LED") {
          return (
            <Led3D
              key={component.id}
              position={component.position}
              rotation={component.rotation}
              color={component.metadata?.color}
              level={outputs[component.pin] ?? 0}
            />
          );
        }
        if (component.type === "RESISTOR") {
          return <Resistor3D key={component.id} position={component.position} rotation={component.rotation} />;
        }
        return null;
      })}

      {sceneComponents
        .filter((component) => component.wirePoints)
        .map((component) => (
          <Wire3D key={`${component.id}-wire`} points={component.wirePoints} color={component.type === "LED" ? "#00ffd5" : "#6cc9ff"} />
        ))}
    </group>
  );
}
