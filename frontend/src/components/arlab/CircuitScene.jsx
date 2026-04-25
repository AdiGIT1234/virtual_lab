import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { Environment, ContactShadows, DragControls } from "@react-three/drei";
import SceneLighting from "./SceneLighting";
import BoardModel from "./BoardModel";
import BreadboardModel from "./BreadboardModel";
import PinHotspots from "./PinHotspots";
import Led3D from "./Led3D";
import PushButton3D from "./PushButton3D";
import Wire3D from "./Wire3D";
import Resistor3D from "./Resistor3D";
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
  onSelect,
  onHoleClick,
  occupiedHoles,
}) {
  const components = useCircuitStore((state) => state.components);
  const outputs = useCircuitStore((state) => state.outputs);
  const inputs = useCircuitStore((state) => state.inputs);
  const toggleInputPin = useCircuitStore((state) => state.toggleInputPin);

  const sceneComponents = useMemo(() => {
    return components.map((component) => {
      const position = [
        (component.x - 450) * 0.005, 
        0.08, 
        (component.y - 300) * 0.005
      ];
      const boardPin = component.pin != null ? getPinCoord(component.pin) : null;
      let wirePoints = null;
      if (boardPin) {
        const midPoint = [
          (boardPin[0] + position[0]) / 2,
          Math.max(boardPin[1], position[1]) + 0.12,
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
    <group position={[-0.8, 0, 0]}>
      <SceneLighting />
      
      {/* Workshop environment — slightly brighter to fill shadows */}
      <Environment preset="warehouse" intensity={0.22} />

      {/* Workbench base — dark matte desk surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.042, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#181f28" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* Subtle grid overlay — gives depth + scale reference */}
      <gridHelper
        args={[20, 40, "#1e2d3d", "#151e28"]}
        position={[0.2, -0.039, 0]}
      />

      {/* Soft contact shadows */}
      <ContactShadows
        opacity={0.7}
        blur={3}
        far={5}
        resolution={1024}
        color="#000820"
        position={[0.2, -0.04, 0]}
      />

      {/* Arduino Uno Board */}
      <group position={[-0.6, 0.01, 0]} rotation={[0, 0, 0]}>
        <BoardModel />
        <PinHotspots />
      </group>
      
      {/* Breadboard — positioned to the right of Arduino */}
      <group position={[1.2, 0.01, 0]} rotation={[0, 0, 0]}>
        <BreadboardModel 
          occupiedHoles={occupiedHoles || new Set()} 
          onHoleClick={onHoleClick}
        />
      </group>

      {/* Circuit Components */}
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
            >
              <group onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}>
                {element}
              </group>
            </DragControls>
          );
        }
        return null;
      })}

      {/* Wires */}
      {sceneComponents
        .filter((component) => component.wirePoints)
        .map((component) => (
          <Wire3D
            key={`${component.id}-wire`}
            points={component.wirePoints}
            color={component.id === highlightedComponentId ? "#ff4444" : component.type === "LED" ? "#cc0000" : "#333"}
            glow={component.id === highlightedComponentId}
          />
        ))}

      {wires.map((wire, idx) => {
        const p1 = [(wire.x1 - 450) * 0.005, 0.04, (wire.y1 - 300) * 0.005];
        const p2 = [(wire.x2 - 450) * 0.005, 0.04, (wire.y2 - 300) * 0.005];
        const mid = [(p1[0] + p2[0]) / 2, 0.15, (p1[2] + p2[2]) / 2];
        return (
          <Wire3D key={`wire-${idx}`} points={[p1, mid, p2]} color={wire.color || "#cc0000"} />
        );
      })}
    </group>
  );
}
