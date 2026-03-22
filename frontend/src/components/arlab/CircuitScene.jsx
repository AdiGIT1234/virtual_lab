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
import Capacitor3D from "./Capacitor3D";
import Transistor3D from "./Transistor3D";
import Timer555_3D from "./Timer555_3D";
import DipIC3D from "./DipIC3D";
import Buzzer3D from "./Buzzer3D";

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
         } else if (component.type === "CAPACITOR") {
           element = (
             <Capacitor3D
               id={component.id}
               capacitance={component.metadata?.capacitance || 100}
               unit={component.metadata?.unit || "nF"}
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
             />
           );
         } else if (component.type === "NPN_TRANSISTOR" || component.type === "PNP_TRANSISTOR") {
           const pinLevel = outputs[component.pin] ?? 0;
           element = (
             <Transistor3D
               id={component.id}
               type={component.type === "PNP_TRANSISTOR" ? "PNP" : "NPN"}
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
               active={pinLevel > 0.1}
               baseBias={pinLevel}
             />
           );
         } else if (component.type === "TIMER_555") {
           const outLevel = outputs[component.pin] ?? 0;
           element = (
             <Timer555_3D
               id={component.id}
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
               outputActive={outLevel > 0.1}
             />
           );
         } else if (component.type === "SHIFT_REGISTER" || component.type === "CUSTOM_DIGITAL_IC" || component.type === "WASM_IC") {
           const icLabels = {
             SHIFT_REGISTER: "74HC595",
             CUSTOM_DIGITAL_IC: "Custom IC",
             WASM_IC: "WASM IC",
           };
           const icPinCount = {
             SHIFT_REGISTER: 16,
             CUSTOM_DIGITAL_IC: 14,
             WASM_IC: 8,
           };
           element = (
             <DipIC3D
               id={component.id}
               label={icLabels[component.type] || "IC"}
               pinCount={icPinCount[component.type] || 14}
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
             />
           );
         } else if (component.type === "BUZZER") {
           const buzzerLevel = outputs[component.pin] ?? 0;
           element = (
             <Buzzer3D
               position={component.position}
               rotation={component.rotation}
               highlighted={isHighlighted}
               active={buzzerLevel > 0.1}
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
