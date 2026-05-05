import { useMemo } from "react";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { CIRCUIT_PRESETS } from "../../constants/circuitPresets";
import { Environment, ContactShadows } from "@react-three/drei";
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
import { Dht22_3D, OledDisplay3D, TftDisplay3D, Potentiometer3D, Max30102_3D, Tcs34725_3D, SensorModule3D, DcMotor3D, L298nDriver3D, Hc05_3D, Rc522_3D } from "./SensorModule3D";

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

  // Named terminal → [dx, dy, dz] offset from component centre.
  // All offsets are in scene-group units (1 unit ≈ 200 mm).
  // Components sit at y≈0.085; wires drop down from y≈0.085 so dy=0 here.
  const OFF = {
    // Resistor leads (horizontal)
    t1: [-0.025, 0, 0],  t2: [+0.025, 0, 0],
    // Generic
    main:[0,0,0], sig:[+0.05,0,0], out:[+0.05,0,0],
    // Power (four-pin row: VCC GND SCL SDA or VCC GND SDA SCL)
    vcc: [-0.015, 0, -0.044],  gnd: [-0.005, 0, -0.044],
    scl: [+0.005, 0, -0.044],  sda: [+0.015, 0, -0.044],
    // SPI five-pin row
    cs:  [-0.020, 0, -0.044],  dc:  [-0.010, 0, -0.044],
    rst: [+0.000, 0, -0.044],  mosi:[+0.010, 0, -0.044],
    sck: [+0.020, 0, -0.044],
    // UART (HC-05 six-pin row)
    rxd: [+0.005, 0, -0.044],  txd: [+0.015, 0, -0.044],
    en:  [+0.025, 0, -0.044],  state:[+0.035,0,-0.044],
    // DHT22 / single data pin
    data:[0, 0, -0.044],
    // L298N H-bridge: control pins on -X side, motor outputs on +X side
    ena: [-0.065, 0, -0.025],
    in1: [-0.065, 0, -0.010],  in2: [-0.065, 0, +0.005],
    in3: [-0.065, 0, +0.020],  in4: [-0.065, 0, +0.035],
    enb: [-0.065, 0, +0.050],
    out1:[+0.055, 0, -0.020],  out2:[+0.055, 0, +0.020],
    // DC Motor leads (bottom of cylinder body)
    "m+":[-0.05, 0, +0.015],   "m-":[-0.05, 0, -0.015],
    // 7-segment: 8 pin stubs along +Z bottom edge
    a: [-0.035, 0, 0.044],  b: [-0.025, 0, 0.044],
    c: [-0.015, 0, 0.044],  d: [-0.005, 0, 0.044],
    e: [+0.005, 0, 0.044],  f: [+0.015, 0, 0.044],
    g: [+0.025, 0, 0.044],  dp:[+0.035, 0, 0.044],
    // NPN/PNP transistor leads (b/c/e at base-collector-emitter)
    b: [-0.015, 0, +0.030],  c: [0, 0, -0.030],  e: [+0.015, 0, +0.030],
  };

  const o = OFF[terminal];
  if (o) return [bx + o[0], by + o[1], bz + o[2]];
  return [bx, by, bz];
}

const PERP_EXIT = 0.10; // how far the wire rises perpendicular from the pin before routing

function buildWirePoints(p1, p2) {
  if (!p1 || !p2) return null;
  // Rise perpendicular from p1, travel straight to above p2, drop to p2
  const exitY = Math.max(p1[1], p2[1]) + PERP_EXIT;
  return [
    p1,
    [p1[0], exitY, p1[2]],   // straight up from pin (perpendicular to chip surface)
    [p2[0], exitY, p2[2]],   // horizontal travel at fixed height
    p2,                        // drop straight down to destination
  ];
}

export default function CircuitScene({
  highlightedComponentId,
  componentStyles = {},
  selectedId,
  onSelect,
  onHoleClick,
  occupiedHoles,
  onPinClick,
  wiringFrom,
  wiringFromHole,
  drawnWires = [],
  selectedWireIdx = null,
  onWireSelect,
}) {
  const components  = useCircuitStore((s) => s.components);
  const outputs     = useCircuitStore((s) => s.outputs);
  const inputs      = useCircuitStore((s) => s.inputs);
  const toggleInputPin = useCircuitStore((s) => s.toggleInputPin);
  const presetId    = useCircuitStore((s) => s.presetId);
  const sandboxWires = useCircuitStore((s) => s.sandboxWires);

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

  // Resolve wires to 3D points.
  // Sandbox wires take precedence when the user has drawn connections in the 2D lab;
  // otherwise fall back to the preset's built-in wire definitions.
  const resolvedWires = useMemo(() => {
    const wires = sandboxWires.length > 0 ? sandboxWires : (preset.wires || []);
    return wires.flatMap((wire) => {
      if (!wire.source || !wire.target) return [];
      const p1 = resolveEndpoint(wire.source, posMap);
      const p2 = resolveEndpoint(wire.target, posMap);
      const pts = buildWirePoints(p1, p2);
      if (!pts) return [];
      return [{ ...wire, points: pts }];
    });
  }, [sandboxWires, preset.wires, posMap]);

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

      {/* ── Workbench ──────────────────────────────────────────────────────── */}
      {/* Top surface — receives shadows, provides the lit deck appearance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.042, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#181f28" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* Solid body — hides all component leads that extend below the surface.
          Box top face sits flush with the surface plane at y = -0.042.
          Extends 2 m downward so no lead geometry is ever visible from any
          allowed camera angle (maxPolarAngle = π/2.05 ≈ 87.8°). */}
      <mesh position={[0.2, -1.042, 0]} receiveShadow castShadow>
        <boxGeometry args={[24, 2.0, 24]} />
        <meshStandardMaterial color="#111720" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Front edge highlight strip — gives the bench a visible, chamfered edge */}
      <mesh position={[0.2, -0.052, 6.0]}>
        <boxGeometry args={[24, 0.02, 0.012]} />
        <meshStandardMaterial color="#22304a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[20, 40, "#1e2d3d", "#151e28"]} position={[0.2, -0.039, 0]} />
      <ContactShadows opacity={0.7} blur={3} far={5} resolution={1024} color="#000820" position={[0.2, -0.04, 0]} />

      {/* Arduino Uno */}
      <group position={[-0.6, 0.01, 0]}>
        <BoardModel />
        <PinHotspots onPinClick={onPinClick} wiringFrom={wiringFrom} />
      </group>

      {/* Breadboard */}
      <group position={[1.2, 0.01, 0]}>
        <BreadboardModel occupiedHoles={occupiedHoles || new Set()} onHoleClick={onHoleClick} wiringFromHole={wiringFromHole} />
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
        } else if (component.type === "GROUND_NODE") {
          element = (
            <group position={component.position} rotation={component.rotation}>
              {/* Stake body */}
              <mesh castShadow>
                <cylinderGeometry args={[0.018, 0.012, 0.06, 8]} />
                <meshStandardMaterial color="#1a2a1a" roughness={0.8} metalness={0.1} />
              </mesh>
              {/* GND symbol — 3 horizontal bars */}
              {[0, 0.018, 0.034].map((offset, i) => (
                <mesh key={i} position={[0, 0.045 - offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.04 - i * 0.01, 0.004]} />
                  <meshStandardMaterial color="#00cc44" emissive="#00cc44" emissiveIntensity={0.4} />
                </mesh>
              ))}
              {/* Glow point */}
              <pointLight color="#00cc44" intensity={0.3} distance={0.4} decay={2} />
            </group>
          );
        } else if (component.type === "VCC_NODE") {
          element = (
            <group position={component.position} rotation={component.rotation}>
              {/* Stake body */}
              <mesh castShadow>
                <cylinderGeometry args={[0.018, 0.012, 0.06, 8]} />
                <meshStandardMaterial color="#2a1a0a" roughness={0.8} metalness={0.1} />
              </mesh>
              {/* VCC symbol — upward arrow bar */}
              <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.036, 0.004]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.024, 0.004]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
              </mesh>
              {/* Glow point */}
              <pointLight color="#facc15" intensity={0.3} distance={0.4} decay={2} />
            </group>
          );
        } else if (component.type === "DHT22") {
          element = <Dht22_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "OLED_SSD1306") {
          element = <OledDisplay3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "ILI9341_TFT") {
          element = <TftDisplay3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "DIAL" || component.type === "POTENTIOMETER") {
          const val = inputs[component.pin] ?? 0.5;
          element = <Potentiometer3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} value={val} />;
        } else if (component.type === "MAX30102" || component.type === "MAX30102_PULSE" || component.type === "PULSE_SENSOR") {
          element = <Max30102_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "TCS34725" || component.type === "TCS34725_COLOR" || component.type === "COLOR_SENSOR") {
          element = <Tcs34725_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "DC_MOTOR") {
          const speed = outputs[component.pins?.ena ?? component.pin] ?? 0;
          element = <DcMotor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} speed={speed} />;
        } else if (component.type === "L298N_DRIVER") {
          element = <L298nDriver3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "HC05_BLUETOOTH" || component.type === "BLUETOOTH_MODULE") {
          element = <Hc05_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "RC522_RFID" || component.type === "RFID_MODULE") {
          element = <Rc522_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        }

        if (element) {
          return (
            <group key={component.id} onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}>
              {element}
            </group>
          );
        }
        return null;
      })}

      {/* Preset wires — resolved from wire definitions */}
      {resolvedWires.map((wire, i) => (
        <Wire3D key={`preset-wire-${i}`} points={wire.points} color={wire.color || "#888"} />
      ))}

      {/* User-drawn wires — rendered here so they share scene-group coordinate space */}
      {drawnWires.map((wire, i) => (
        <Wire3D
          key={`drawn-${i}`}
          points={wire.points}
          color={wire.color || "#00e5ff"}
          glow={i === selectedWireIdx}
          onClick={(e) => { e.stopPropagation(); onWireSelect?.(i === selectedWireIdx ? null : i); }}
        />
      ))}
    </group>
  );
}
