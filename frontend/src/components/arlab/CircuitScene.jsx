import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { Environment, Backdrop, ContactShadows, DragControls, Grid } from "@react-three/drei";
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
import SevenSegment3D from "./SevenSegment3D";

export default function CircuitScene({ 
  highlightedComponentId, 
  componentStyles = {}, 
  wires = [],
  onDragStart,
  onDragEnd,
  selectedId,
  onSelect
}) {
  const components = useCircuitStore((state) => state.components);
  const outputs = useCircuitStore((state) => state.outputs);
  const inputs = useCircuitStore((state) => state.inputs);
  const toggleInputPin = useCircuitStore((state) => state.toggleInputPin);

  const sceneComponents = useMemo(() => {
    return components.map((component) => {
      const position = [
        (component.x - 450) * 0.005, 
        0.05, 
        (component.y - 300) * 0.005
      ];
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
       
       <Backdrop floor={2} segments={30} receiveShadow position={[0, -0.02, -5]} scale={[80, 20, 10]}>
         <meshStandardMaterial color="#f0f0f0" roughness={1} />
       </Backdrop>
       
       <ContactShadows opacity={0.2} blur={2.5} far={5} resolution={1024} color="#000" position={[0, -0.01, 0]} />

      {/* Arduino Uno - Aligned to default 2D position (260, 180) */}
      <group position={[(260 - 450) * 0.005, 0.01, (180 - 300) * 0.005]} rotation={[0, 0, 0]}>
        <BoardModel />
        <PinHotspots />
      </group>
      
      {/* Breadboard - Aligned to common 2D workspace area (approx 600, 300) */}
      <group position={[0.75, 0.01, 0]} rotation={[0, 0, 0]}>
        <BreadboardModel />
      </group>

       {sceneComponents.map((component) => {
         const styleOverride = componentStyles[component.id] || {};
         const isHighlighted = component.id === highlightedComponentId || component.id === selectedId;
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
         } else if (component.type === "SEVEN_SEG") {
           element = (
             <SevenSegment3D
                position={component.position}
                rotation={component.rotation}
                highlighted={isHighlighted}
                a={outputs[component.pins?.a] === 1}
                b={outputs[component.pins?.b] === 1}
                c={outputs[component.pins?.c] === 1}
                d={outputs[component.pins?.d] === 1}
                e={outputs[component.pins?.e] === 1}
                f={outputs[component.pins?.f] === 1}
                g={outputs[component.pins?.g] === 1}
                dp={outputs[component.pins?.dp] === 1}
              />
           );
         }

         if (element) {
             return (
               <DragControls 
                 key={component.id}
                 onDragStart={onDragStart}
                 onDragEnd={onDragEnd}
                 onDrag={() => {
                    // Logic for snapping during drag can be complex with DragControls matrix
                 }}
               >
                 <group onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}>
                    {element}
                    {isHighlighted && (
                      <mesh scale={1.1}>
                        <boxGeometry args={[0.2, 0.2, 0.2]} />
                        <meshBasicMaterial color="#ff4444" wireframe transparent opacity={0.3} />
                      </mesh>
                    )}
                 </group>
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
              color={component.id === highlightedComponentId ? "#ff4444" : component.type === "LED" ? "#00ffd5" : "#6cc9ff"}
              glow={component.id === highlightedComponentId}
            />
         ))}

       {wires.map((wire, idx) => {
         const p1 = [(wire.x1 - 450) * 0.005, 0.04, (wire.y1 - 300) * 0.005];
         const p2 = [(wire.x2 - 450) * 0.005, 0.04, (wire.y2 - 300) * 0.005];
         const mid = [(p1[0] + p2[0]) / 2, 0.15, (p1[2] + p2[2]) / 2];
         return (
           <Wire3D key={`wire-${idx}`} points={[p1, mid, p2]} color={wire.color || "#00ffd5"} />
         );
       })}
    </group>
  );
}
