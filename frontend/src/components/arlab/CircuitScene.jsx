import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { Environment, Backdrop, ContactShadows, DragControls } from "@react-three/drei";
import SceneLighting from "./SceneLighting";
import BoardModel from "./BoardModel";
import BreadboardModel from "./BreadboardModel";
import PinHotspots from "./PinHotspots";
import Led3D from "./Led3D";
import PushButton3D from "./PushButton3D";
import Wire3D from "./Wire3D";
import Resistor3D from "./Resistor3D";
import GroundPlane from "./GroundPlane";
import Servo3D from "./Servo3D";

const getComponentPosition = (component, index) => {
  if (component.x != null && component.y != null) {
      // Scale 2D workspace coordinates precisely to 3D. 350px = 1.8 units -> scale = ~0.005
      return [
        (component.x - 100) * 0.005, 
        0.05, 
        (component.y - 200) * 0.005 - 0.1
      ];
  }
  const column = index % 3;
  const row = Math.floor(index / 3);
  return [-0.5 + column * 0.4, 0.05, -0.6 + row * 0.4];
};

export default function CircuitScene({ highlightedComponentId, componentStyles = {} }) {
  const components = useCircuitStore((state) => state.components);
  const outputs = useCircuitStore((state) => state.outputs);
  const inputs = useCircuitStore((state) => state.inputs);
  const toggleInputPin = useCircuitStore((state) => state.toggleInputPin);

  const sceneComponents = useMemo(() => {
    return components.map((component, index) => {
      const position = getComponentPosition(component, index);
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
    <group position={[-1.0, -0.05, 0]}>
       <SceneLighting />
       <Environment preset="city" intensity={0.5} />
       <Backdrop floor={2} segments={30} receiveShadow position={[0, -0.02, -2]} scale={[50, 10, 10]}>
         <meshStandardMaterial color="#080e1a" roughness={1} />
       </Backdrop>
       <GroundPlane />
       <ContactShadows opacity={0.5} blur={2.5} far={8} resolution={1024} color="#0f1b22" position={[0, -0.015, 0]} />
      <group position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
        <BoardModel />
        <PinHotspots />
      </group>
      <group position={[2.2, 0.01, -0.08]} rotation={[0, 0, 0]}>
        <BreadboardModel scale={1.2} />
      </group>

       {sceneComponents.map((component) => {
         const styleOverride = componentStyles[component.id] || {};
         const isHighlighted = component.id === highlightedComponentId;
         let element = null;

         if (component.type === "LED") {
           element = (
             <Led3D
                position={component.position}
                rotation={component.rotation}
                color={styleOverride.color || component.metadata?.color}
                level={styleOverride.level ?? outputs[component.pin] ?? 0}
                highlighted={isHighlighted}
              />
           );
         } else if (component.type === "RESISTOR") {
           element = (
             <Resistor3D
               id={component.id}
               resistance={component.resistance || 330}
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
             />
           );
         } else if (component.type === "SERVO") {
           const level = styleOverride.level ?? outputs[component.pin] ?? 0;
           element = (
             <Servo3D
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
               angle={(level * 180) - 90}
             />
           );
         } else if (component.type === "BUTTON") {
           const isPressed = inputs[component.pin] === 1;
           element = (
             <PushButton3D
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
               isPressed={isPressed}
               onClick={() => {
                 if (component.pin != null) {
                   toggleInputPin(component.pin);
                 }
               }}
             />
           );
         }

         if (element) {
             return (
               <DragControls key={component.id}>
                 {element}
               </DragControls>
             );
         }
         return null;
       })}

       {sceneComponents
         .filter((component) => component.wirePoints)
         .map((component) => (
           <Wire3D
             key={`${component.id}-wire`}
             points={component.wirePoints}
             color={component.id === highlightedComponentId ? "#4dfdff" : component.type === "LED" ? "#00ffd5" : "#6cc9ff"}
             glow={component.id === highlightedComponentId}
           />
         ))}
    </group>
  );
}
