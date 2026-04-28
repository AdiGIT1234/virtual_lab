import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { CIRCUIT_PRESETS } from "../../constants/circuitPresets";
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

// Convert Arduino pin number to scene-group coordinates
function pinToSceneCoords(pinNum) {
  const local = getPinCoord(Number(pinNum));
  return [-0.6 + local[0], 0.01 + local[1] + 0.04, local[2]];
}

// Resolve a wire endpoint string like "mcu::13" or "res-1::t1" to scene-group [x,y,z]
function resolveEndpoint(str, posMap) {
  if (!str) return null;
  const [id, terminal] = str.split("::");

  if (id === "mcu") {
    const pinNum = Number(terminal);
    if (!isNaN(pinNum)) return pinToSceneCoords(pinNum);
    return null;
  }

  const pos = posMap[id];
  if (!pos) return null;

  const [bx, by, bz] = pos;
  switch (terminal) {
    case "t1":   return [bx - 0.285, by, bz];   // left lead of horizontal resistor
    case "t2":   return [bx + 0.285, by, bz];   // right lead
    case "main": return [bx, by, bz];
    case "sig":  return [bx + 0.05, by, bz];
    case "gnd":  return [bx - 0.05, by, bz];
    default:     return [bx, by, bz];            // b, c, e, out, vcc, etc.
  }
}

function buildWirePoints(p1, p2) {
  if (!p1 || !p2) return null;
  const midX = (p1[0] + p2[0]) / 2;
  const midZ = (p1[2] + p2[2]) / 2;
  const midY = Math.max(p1[1], p2[1]) + 0.14;
  return [p1, [midX, midY, midZ], p2];
}

export default function CircuitScene({
  highlightedComponentId,
  componentStyles = {},
  onDragStart,
  onDragEnd,
  selectedId,
  onSelect,
  onHoleClick,
  occupiedHoles,
  onPinClick,
  wiringFrom,
}) {
  const components  = useCircuitStore((s) => s.components);
  const outputs     = useCircuitStore((s) => s.outputs);
  const inputs      = useCircuitStore((s) => s.inputs);
  const toggleInputPin = useCircuitStore((s) => s.toggleInputPin);
  const presetId    = useCircuitStore((s) => s.presetId);

  const preset = CIRCUIT_PRESETS[presetId] || {};
  const arlabPositions = preset.arlabPositions || {};

  // Build a position map: component id -> scene-group [x,y,z]
  // Seed ALL arlabPositions first (covers VCC_NODE / GROUND_NODE which are non-renderable)
  const posMap = useMemo(() => {
    const map = {};
    Object.entries(arlabPositions).forEach(([id, layout]) => {
      map[id] = layout.pos;
    });
    components.forEach((c) => {
      if (!map[c.id]) {
        map[c.id] = [
          (c.x - 450) * 0.005,
          0.085,
          (c.y - 300) * 0.005,
        ];
      }
    });
    return map;
  }, [components, arlabPositions]);

  // Resolve preset wires to 3D points
  const resolvedWires = useMemo(() => {
    const wires = preset.wires || [];
    return wires.flatMap((wire) => {
      const p1 = resolveEndpoint(wire.source, posMap);
      const p2 = resolveEndpoint(wire.target, posMap);
      const pts = buildWirePoints(p1, p2);
      if (!pts) return [];
      return [{ ...wire, points: pts }];
    });
  }, [preset.wires, posMap]);

  // Build sceneComponents with final positions/rotations
  const sceneComponents = useMemo(() => {
    return components.map((component) => {
      const layout = arlabPositions[component.id];
      const position = layout ? layout.pos : posMap[component.id] || [0, 0.085, 0];
      const rotation = layout ? (layout.rot || [0, 0, 0]) : [0, 0, 0];
      return { ...component, position, rotation };
    });
  }, [components, arlabPositions, posMap]);

  return (
    <group position={[-0.8, 0, 0]}>
      <SceneLighting />
      <Environment preset="warehouse" intensity={0.22} />

      {/* Workbench surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.042, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#181f28" roughness={0.92} metalness={0.04} />
      </mesh>
      <gridHelper args={[20, 40, "#1e2d3d", "#151e28"]} position={[0.2, -0.039, 0]} />
      <ContactShadows opacity={0.7} blur={3} far={5} resolution={1024} color="#000820" position={[0.2, -0.04, 0]} />

      {/* Arduino Uno */}
      <group position={[-0.6, 0.01, 0]}>
        <BoardModel />
        <PinHotspots onPinClick={onPinClick} wiringFrom={wiringFrom} />
      </group>

      {/* Breadboard */}
      <group position={[1.2, 0.01, 0]}>
        <BreadboardModel occupiedHoles={occupiedHoles || new Set()} onHoleClick={onHoleClick} />
      </group>

      {/* Components */}
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
              onClick={() => { if (component.pin != null) toggleInputPin(component.pin); }}
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
          element = (
            <Transistor3D
              id={component.id}
              type={component.type === "PNP_TRANSISTOR" ? "PNP" : "NPN"}
              position={component.position}
              rotation={component.rotation}
              highlighted={isHighlighted}
              active={(outputs[component.pin] ?? 0) > 0.1}
              baseBias={outputs[component.pin] ?? 0}
            />
          );
        } else if (component.type === "TIMER_555") {
          element = (
            <Timer555_3D
              id={component.id}
              position={component.position}
              rotation={component.rotation}
              highlighted={isHighlighted}
              outputActive={(outputs[component.pin] ?? 0) > 0.1}
            />
          );
        } else if (component.type === "SHIFT_REGISTER" || component.type === "CUSTOM_DIGITAL_IC" || component.type === "WASM_IC") {
          const icLabels = { SHIFT_REGISTER: "74HC595", CUSTOM_DIGITAL_IC: "Custom IC", WASM_IC: "WASM IC" };
          const icPinCount = { SHIFT_REGISTER: 16, CUSTOM_DIGITAL_IC: 14, WASM_IC: 8 };
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
          element = (
            <Buzzer3D
              position={component.position}
              rotation={component.rotation}
              highlighted={isHighlighted}
              active={(outputs[component.pin] ?? 0) > 0.1}
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
            <DragControls key={component.id} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <group onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}>
                {element}
              </group>
            </DragControls>
          );
        }
        return null;
      })}

      {/* Preset wires — resolved from wire definitions */}
      {resolvedWires.map((wire, i) => (
        <Wire3D key={`preset-wire-${i}`} points={wire.points} color={wire.color || "#888"} />
      ))}
    </group>
  );
}
