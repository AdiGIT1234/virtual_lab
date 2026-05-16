import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { CIRCUIT_PRESETS } from "../../constants/circuitPresets";
import { Environment, ContactShadows, Html } from "@react-three/drei";
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
import {
  AaBattery3D, BenchPsu3D, BuckConverter3D, Lm7805Reg3D,
  FunctionGenerator3D, UsbConnector3D, BarrelJack3D, ScrewTerminal3D,
  Lcd1602_3D, EpaperDisplay3D, LedMatrix3D, LedBarGraph3D,
  NeopixelRing3D, NeopixelMatrix3D, NeopixelPixel3D,
  NtcSensor3D, Photoresistor3D, PirSensor3D, Mpu6050_3D,
  HcSr04_3D, FlameSensor3D, GasSensor3D, HeartbeatSensor3D,
  SoundSensor3D, Hx711_3D, RainSensor3D, Ttp223Touch3D, Sw420Vibration3D,
  RotaryEncoder3D, AnalogJoystick3D, DipSwitch3D, SlideSwitch3D,
  MembraneKeypad3D, IrReceiver3D, IrRemote3D,
  StepperMotor3D, RelayModule3D,
  Ds1307Rtc3D, MicroSdModule3D,
  LogicGate3D, MosfetTransistor3D, OptocouplerIC3D,
} from "./ExtraComponents3D";

// Convert Arduino pin number to scene-group coordinates
function pinToSceneCoords(pinNum, boardOff = { x: 0, z: 0 }) {
  const local = getPinCoord(Number(pinNum));
  return [-0.6 + boardOff.x + local[0], 0.01 + local[1] + 0.04, boardOff.z + local[2]];
}

// Resolve a wire endpoint string like "mcu::13" or "res-1::t1" to scene-group [x,y,z]
function resolveEndpoint(str, posMap, boardOff = { x: 0, z: 0 }) {
  if (!str) return null;
  const [id, terminal] = str.split("::");

  if (id === "mcu") {
    const pinNum = Number(terminal);
    if (!isNaN(pinNum)) return pinToSceneCoords(pinNum, boardOff);
    return null;
  }

  const pos = posMap[id];
  if (!pos) return null;

  const [bx, by, bz] = pos;

  // Named terminal → [dx, dy, dz] offset from component centre.
  // All offsets are in scene-group units (1 unit ≈ 200 mm).
  // Components sit at y≈0.085; wires drop down from y≈0.085 so dy=0 here.
  const OFF = {
    // Resistor leads — match new HL=0.090 + bent-lead offset ≈ 0.115
    t1: [-0.115, 0, 0],  t2: [+0.115, 0, 0],
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
    a:  [-0.035, 0, 0.044],  seg_b: [-0.025, 0, 0.044],
    seg_c: [-0.015, 0, 0.044],  d: [-0.005, 0, 0.044],
    seg_e: [+0.005, 0, 0.044],  f: [+0.015, 0, 0.044],
    g:  [+0.025, 0, 0.044],  dp: [+0.035, 0, 0.044],
    // NPN/PNP transistor leads (base/collector/emitter) — no collision with seg b/c/e
    b: [-0.015, 0, +0.030],  c: [0, 0, -0.030],  e: [+0.015, 0, +0.030],
  };

  // 7-segment b/c/e segments use their own offsets — check component type
  const typeHint = posMap[id]?.[3]; // 4th element is optional type hint
  if (typeHint === "SEVEN_SEG") {
    const segMap = { b: OFF.seg_b, c: OFF.seg_c, e: OFF.seg_e };
    if (segMap[terminal]) {
      const o = segMap[terminal];
      return [bx + o[0], by + o[1], bz + o[2]];
    }
  }

  const o = OFF[terminal];
  if (o) return [bx + o[0], by + o[1], bz + o[2]];
  return [bx, by, bz];
}

const PERP_EXIT = 0.04; // how far the wire rises above the highest pin before routing

// Board surface y in scene-group space (breadboard group y=0.01 + holes group y=0.025)
const BOARD_Y = 0.035;

// Per-type y-lift: distance from BOARD_Y to model origin so body bottom sits at BOARD_Y.
// Derived from each model's geometry (body-center to body-bottom distance).
const COMP_Y = {
  LED: BOARD_Y + 0.090,          // cylinder h=0.18, half=0.09
  LED_RED: BOARD_Y + 0.090,
  LED_GREEN: BOARD_Y + 0.090,
  LED_YELLOW: BOARD_Y + 0.090,
  LED_BLUE: BOARD_Y + 0.090,
  RESISTOR: BOARD_Y + 0.032,     // horizontal cylinder radius 0.032
  BUTTON: BOARD_Y + 0.000,       // body bottom already at y=0 in group
  BUZZER: BOARD_Y + 0.015,       // disk bottom at y=-0.015
  CAPACITOR: BOARD_Y + 0.013,    // disk bottom at y=-0.013
  NPN_TRANSISTOR: BOARD_Y + 0.060, // TO-92 body h=0.12, half=0.06
  PNP_TRANSISTOR: BOARD_Y + 0.060,
  TIMER_555: BOARD_Y + 0.018,    // DIP body h=0.035, half=0.018
  SHIFT_REGISTER: BOARD_Y + 0.018,
  CUSTOM_DIGITAL_IC: BOARD_Y + 0.018,
  WASM_IC: BOARD_Y + 0.018,
  SERVO: BOARD_Y + 0.000,        // body bottom at group y=0
  SEVEN_SEG: BOARD_Y + 0.085,    // display body h=0.17, half=0.085
  OLED_SSD1306: BOARD_Y + 0.025,
  DHT22: BOARD_Y + 0.025,
  ILI9341_TFT: BOARD_Y + 0.025,
  DIAL: BOARD_Y + 0.025,
  DC_MOTOR: BOARD_Y + 0.050,
  L298N_DRIVER: BOARD_Y + 0.025,
  HC05_BLUETOOTH: BOARD_Y + 0.025,
  RC522_RFID: BOARD_Y + 0.025,
  MAX30102_PULSE: BOARD_Y + 0.025,
  TCS34725_COLOR: BOARD_Y + 0.025,
  VCC_NODE: 0.010,   // stakes placed near workbench
  GROUND_NODE: 0.010,
  // Displays
  LCD1602: BOARD_Y + 0.015,
  LCD2004: BOARD_Y + 0.015,
  EPAPER_BASIC: BOARD_Y + 0.010,
  LED_MATRIX: BOARD_Y + 0.010,
  LED_BAR_GRAPH: BOARD_Y + 0.010,
  NEOPIXEL_RING: BOARD_Y + 0.006,
  NEOPIXEL_RING_12: BOARD_Y + 0.006,
  NEOPIXEL_RING_16: BOARD_Y + 0.006,
  NEOPIXEL_RING_24: BOARD_Y + 0.006,
  NEOPIXEL_MATRIX: BOARD_Y + 0.010,
  NEOPIXEL_PIXEL: BOARD_Y + 0.010,
  // Sensors
  NTC_SENSOR: BOARD_Y + 0.009,
  PHOTORESISTOR: BOARD_Y + 0.004,
  PIR_SENSOR: BOARD_Y + 0.010,
  MPU6050: BOARD_Y + 0.010,
  HC_SR04: BOARD_Y + 0.010,
  FLAME_SENSOR: BOARD_Y + 0.010,
  GAS_SENSOR: BOARD_Y + 0.010,
  HEARTBEAT_SENSOR: BOARD_Y + 0.010,
  SOUND_SENSOR: BOARD_Y + 0.010,
  HX711_LOAD_CELL: BOARD_Y + 0.010,
  HX711_MODULE: BOARD_Y + 0.010,
  RAIN_SENSOR: BOARD_Y + 0.010,
  TTP223_TOUCH: BOARD_Y + 0.010,
  SW420_VIBRATION: BOARD_Y + 0.010,
  // Input
  ROTARY_ENCODER: BOARD_Y + 0.010,
  ANALOG_JOYSTICK: BOARD_Y + 0.010,
  DIP_SWITCH_8: BOARD_Y + 0.013,
  SLIDE_SWITCH: BOARD_Y + 0.010,
  MEMBRANE_KEYPAD: BOARD_Y + 0.005,
  IR_RECEIVER: BOARD_Y + 0.010,
  IR_REMOTE: BOARD_Y + 0.008,
  // Motor
  STEPPER_MOTOR: BOARD_Y + 0.040,
  RELAY_MODULE: BOARD_Y + 0.010,
  // Comms
  DS1307_RTC: BOARD_Y + 0.010,
  MICROSD_MODULE: BOARD_Y + 0.010,
  // Logic ICs
  LOGIC_AND: BOARD_Y + 0.013,
  LOGIC_OR: BOARD_Y + 0.013,
  LOGIC_NOT: BOARD_Y + 0.013,
  LOGIC_NAND: BOARD_Y + 0.013,
  LOGIC_NOR: BOARD_Y + 0.013,
  LOGIC_XOR: BOARD_Y + 0.013,
  LOGIC_DFLIPFLOP: BOARD_Y + 0.013,
  NMOSFET: BOARD_Y + 0.060,
  PMOSFET: BOARD_Y + 0.060,
  OPTOCOUPLER: BOARD_Y + 0.013,
  // Power
  AA_BATTERY: BOARD_Y + 0.090,
  BENCH_PSU: BOARD_Y + 0.020,
  BUCK_CONVERTER: BOARD_Y + 0.015,
  LM7805_REG: BOARD_Y + 0.040,
  FUNCTION_GENERATOR: BOARD_Y + 0.020,
  USB_CONNECTOR: BOARD_Y + 0.013,
  BARREL_JACK: BOARD_Y + 0.020,
  SCREW_TERMINAL_2: BOARD_Y + 0.010,
  SCREW_TERMINAL_3: BOARD_Y + 0.010,
  RGB_LED: BOARD_Y + 0.090,
};

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

// Build a human-readable tooltip label for a component
function compTooltip(comp) {
  const t = comp.type || "";
  const pin = comp.pin != null ? ` → D${comp.pin}` : "";
  if (t.startsWith("LED_")) return `LED (${t.slice(4).charAt(0) + t.slice(5).toLowerCase()})${pin}`;
  if (t === "RESISTOR")   return comp.resistance != null ? `Resistor (${comp.resistance}Ω)${pin}` : `Resistor${pin}`;
  if (t === "BUTTON")     return `Push Button${pin}`;
  if (t === "SERVO")      return `Servo Motor${pin}`;
  if (t === "CAPACITOR")  return comp.metadata?.capacitance != null ? `Capacitor (${comp.metadata.capacitance}${comp.metadata.unit || "nF"})${pin}` : `Capacitor${pin}`;
  if (t === "BUZZER")     return `Buzzer${pin}`;
  if (t === "SEVEN_SEG")  return `7-Segment Display`;
  if (t === "TIMER_555")  return `555 Timer`;
  if (t === "DHT22")      return `DHT22 Temp/Humidity`;
  if (t === "HC_SR04")    return `HC-SR04 Ultrasonic`;
  if (t === "PIR_SENSOR") return `PIR Motion Sensor`;
  if (t === "OLED_SSD1306") return `OLED Display (128×64)`;
  if (t === "NPN_TRANSISTOR") return `NPN Transistor${pin}`;
  if (t === "PNP_TRANSISTOR") return `PNP Transistor${pin}`;
  // Generic fallback: "LOGIC_AND" → "Logic And"
  return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + pin;
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
  onComponentMove,
  onDragStart,
  onDragEnd,
  setupPos = { x: 0, z: 0 },
  onSetupMove,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const draggingIdRef = useRef(null);
  const [hoveredCompId, setHoveredCompId] = useState(null);
  const setupPosRef = useRef(setupPos);
  useEffect(() => { setupPosRef.current = setupPos; }, [setupPos]);

  const [localPosOverrides, setLocalPosOverrides] = useState({});
  const [isDraggingSetup, setIsDraggingSetup] = useState(false);
  const isDraggingSetupRef = useRef(false);
  const setupDragOriginRef = useRef({ x: 0, z: 0 });
  const setupStartRef = useRef({ x: 0, z: 0 });

  // Per-board position offsets (scene-group local space)
  const [boardOffset, setBoardOffset] = useState({ x: 0, z: 0 });
  const [bbOffset, setBbOffset] = useState({ x: 0, z: 0 });
  const boardOffsetRef = useRef({ x: 0, z: 0 });
  const bbOffsetRef = useRef({ x: 0, z: 0 });
  const [draggingBoard, setDraggingBoard] = useState(null); // 'arduino' | 'breadboard' | null
  const draggingBoardRef = useRef(null);
  const boardDragOriginRef = useRef({ x: 0, z: 0 });
  const boardDragStartRef = useRef({ x: 0, z: 0 });
  const { camera, gl } = useThree();

  const components   = useCircuitStore((s) => s.components);
  const outputs      = useCircuitStore((s) => s.outputs);
  const inputs       = useCircuitStore((s) => s.inputs);
  const toggleInputPin = useCircuitStore((s) => s.toggleInputPin);
  const presetId     = useCircuitStore((s) => s.presetId);
  const sandboxWires = useCircuitStore((s) => s.sandboxWires);
  const sandboxColMap = useCircuitStore((s) => s.sandboxColMap);

  const preset = CIRCUIT_PRESETS[presetId] || {};
  const arlabPositions = preset.arlabPositions || {};

  // Keep refs in sync so DOM event closures always see the latest values
  useEffect(() => { draggingIdRef.current = draggingId; }, [draggingId]);
  useEffect(() => { isDraggingSetupRef.current = isDraggingSetup; }, [isDraggingSetup]);
  useEffect(() => { draggingBoardRef.current = draggingBoard; }, [draggingBoard]);
  useEffect(() => { boardOffsetRef.current = boardOffset; }, [boardOffset]);
  useEffect(() => { bbOffsetRef.current = bbOffset; }, [bbOffset]);

  // Reset board positions when preset changes
  useEffect(() => { setBoardOffset({ x: 0, z: 0 }); setBbOffset({ x: 0, z: 0 }); }, [presetId]);

  // Clear local position overrides when the preset changes
  useEffect(() => { setLocalPosOverrides({}); }, [presetId]);

  // DOM-level drag: bypasses Three.js raycasting so component meshes don't block it
  useEffect(() => {
    if (draggingId === null) return;
    const domEl = gl.domElement;
    // Drag plane sits at world y = 0.10 (mid-height across component types)
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.10);
    const raycaster  = new THREE.Raycaster();
    const target     = new THREE.Vector3();

    const onMove = (e) => {
      const id = draggingIdRef.current;
      if (!id) return;
      const rect = domEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: nx, y: ny }, camera);
      if (raycaster.ray.intersectPlane(dragPlane, target)) {
        // target is world-space; scene group origin is (-0.8 + setupPos.x, 0, setupPos.z)
        const sp = setupPosRef.current;
        const localX = target.x - (-0.8 + sp.x);
        const localZ = target.z - sp.z;
        const comp = components.find(c => c.id === id);
        const compY = COMP_Y[comp?.type] ?? (BOARD_Y + 0.025);
        setLocalPosOverrides(prev => ({ ...prev, [id]: [localX, compY, localZ] }));
      }
    };

    const onUp = () => {
      setDraggingId(null);
      gl.domElement.style.cursor = '';
      onDragEnd?.();
    };

    domEl.addEventListener('pointermove', onMove);
    domEl.addEventListener('pointerup',   onUp);
    return () => {
      domEl.removeEventListener('pointermove', onMove);
      domEl.removeEventListener('pointerup',   onUp);
    };
  }, [draggingId, camera, gl, onDragEnd, components]);

  // Setup drag (whole scene translates on workbench plane)
  useEffect(() => {
    if (!isDraggingSetup) return;
    const domEl = gl.domElement;
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();

    const onMove = (e) => {
      if (!isDraggingSetupRef.current) return;
      const rect = domEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: nx, y: ny }, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hit)) {
        const dx = hit.x - setupDragOriginRef.current.x;
        const dz = hit.z - setupDragOriginRef.current.z;
        onSetupMove?.(setupStartRef.current.x + dx, setupStartRef.current.z + dz);
      }
    };

    const onUp = () => {
      setIsDraggingSetup(false);
      isDraggingSetupRef.current = false;
      domEl.style.cursor = '';
      onDragEnd?.();
    };

    domEl.addEventListener('pointermove', onMove);
    domEl.addEventListener('pointerup', onUp);
    return () => {
      domEl.removeEventListener('pointermove', onMove);
      domEl.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingSetup, camera, gl, onSetupMove, onDragEnd]);

  // Board drag — moves the Arduino or breadboard independently on the workbench plane
  useEffect(() => {
    if (!draggingBoard) return;
    const domEl = gl.domElement;
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();

    const onMove = (e) => {
      if (!draggingBoardRef.current) return;
      const rect = domEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: nx, y: ny }, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hit)) {
        const dx = hit.x - boardDragOriginRef.current.x;
        const dz = hit.z - boardDragOriginRef.current.z;
        if (draggingBoardRef.current === 'arduino') {
          setBoardOffset({ x: boardDragStartRef.current.x + dx, z: boardDragStartRef.current.z + dz });
        } else {
          setBbOffset({ x: boardDragStartRef.current.x + dx, z: boardDragStartRef.current.z + dz });
        }
      }
    };

    const onUp = () => {
      setDraggingBoard(null);
      draggingBoardRef.current = null;
      domEl.style.cursor = '';
      onDragEnd?.();
    };

    domEl.addEventListener('pointermove', onMove);
    domEl.addEventListener('pointerup', onUp);
    return () => {
      domEl.removeEventListener('pointermove', onMove);
      domEl.removeEventListener('pointerup', onUp);
    };
  }, [draggingBoard, camera, gl, onDragEnd]);

  const startBoardDrag = useCallback((boardId, e) => {
    e.stopPropagation();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();
    const rect = gl.domElement.getBoundingClientRect();
    const nx = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    if (raycaster.ray.intersectPlane(dragPlane, hit)) {
      boardDragOriginRef.current = { x: hit.x, z: hit.z };
      boardDragStartRef.current = boardId === 'arduino'
        ? { ...boardOffsetRef.current }
        : { ...bbOffsetRef.current };
      setDraggingBoard(boardId);
      draggingBoardRef.current = boardId;
      gl.domElement.style.cursor = 'grabbing';
      onDragStart?.();
    }
  }, [camera, gl, onDragStart]);

  // Build a position map: component id -> scene-group [x,y,z]
  const posMap = useMemo(() => {
    const map = {};
    const typeById = {};
    components.forEach(c => { typeById[c.id] = c.type; });

    // Sandbox mode: use the stable per-component column assignments from the store
    // so positions don't shift when other components are added or removed.
    if (presetId === '__sandbox__') {
      // Breadboard group is at scene-group x = 1.2 + bbOffset.x; components follow it.
      // Z = 0.165 places components in the lower main rows (f-j, near row h) — the center
      // channel at z=0 has no holes and is just the plastic divider.
      const startX = 1.2 + bbOffset.x - (63 * 0.05) / 2;
      const rowZ   = bbOffset.z + 0.165;
      components.forEach((c) => {
        const col = sandboxColMap[c.id] ?? 3;
        const y = COMP_Y[c.type] ?? (BOARD_Y + 0.025);
        map[c.id] = [startX + (col - 1) * 0.05, y, rowZ, c.type];
      });
      return map;
    }

    // Preset mode: seed from explicit arlabPositions first
    Object.entries(arlabPositions).forEach(([id, layout]) => {
      const type = typeById[id] || null;
      const y = COMP_Y[type] ?? (BOARD_Y + 0.025);
      map[id] = [layout.pos[0], y, layout.pos[2], type];
    });
    // Fallback for components without an explicit layout entry.
    // manuallyPlaced components store their position as encoded scene coords;
    // other un-positioned components use raw 2D coords as a best-effort fallback.
    components.forEach((c) => {
      if (!map[c.id]) {
        const y = COMP_Y[c.type] ?? (BOARD_Y + 0.025);
        map[c.id] = [
          (c.x - 450) * 0.005,
          y,
          (c.y - 300) * 0.005,
          c.type,
        ];
      }
    });
    // Apply any session-level drag overrides (for both preset and sandbox components)
    Object.entries(localPosOverrides).forEach(([id, pos]) => {
      map[id] = [...pos, map[id]?.[3] ?? null];
    });
    return map;
  }, [components, arlabPositions, presetId, sandboxColMap, localPosOverrides, bbOffset]);

  // Resolve wires to 3D points.
  // Sandbox wires take precedence when the user has drawn connections in the 2D lab;
  // otherwise fall back to the preset's built-in wire definitions.
  const resolvedWires = useMemo(() => {
    const wires = sandboxWires.length > 0 ? sandboxWires : (preset.wires || []);
    return wires.flatMap((wire) => {
      if (!wire.source || !wire.target) return [];
      const p1 = resolveEndpoint(wire.source, posMap, boardOffset);
      const p2 = resolveEndpoint(wire.target, posMap, boardOffset);
      const pts = buildWirePoints(p1, p2);
      if (!pts) return [];
      return [{ ...wire, points: pts }];
    });
  }, [sandboxWires, preset.wires, posMap, boardOffset]);

  // Build sceneComponents with final positions/rotations.
  // y is always derived from COMP_Y[type] so every component sits at the correct height
  // above the breadboard surface regardless of what arlabPositions.pos[1] says.
  const sceneComponents = useMemo(() => {
    return components.map((component) => {
      const layout = arlabPositions[component.id];
      const base = localPosOverrides[component.id] ?? (layout ? layout.pos : (posMap[component.id] || [0, BOARD_Y, 0]));
      const y = COMP_Y[component.type] ?? (BOARD_Y + 0.025);
      const position = [base[0], y, base[2]];
      const rotation = layout ? (layout.rot || [0, 0, 0]) : [0, 0, 0];
      return { ...component, position, rotation };
    });
  }, [components, arlabPositions, posMap, localPosOverrides]);

  // ── Power-bus jumper wires ─────────────────────────────────────────────────
  // Arduino power header sits at board-local [x, 0.075, -0.52].
  // Pin order (left→right): IOREF RST 3V3 5V GND GND VIN
  //   5V  → local x = 0.35  → scene-group x = -0.25 + boardOffset.x
  //   GND → local x = 0.45  → scene-group x = -0.15 + boardOffset.x
  // Breadboard top rails (local): +rail z=-0.35, -rail z=-0.40
  //   column 3 x ≈ -0.275, column 5 x ≈ -0.175 (aligns visually with above pins)
  const powerBusWires = useMemo(() => {
    const vccPin    = [-0.25 + boardOffset.x, 0.085, -0.52 + boardOffset.z];
    const gndPin    = [-0.15 + boardOffset.x, 0.085, -0.52 + boardOffset.z];
    const bbVccRail = [-0.275 + bbOffset.x,   0.045, -0.35  + bbOffset.z];
    const bbGndRail = [-0.175 + bbOffset.x,   0.045, -0.40  + bbOffset.z];
    return {
      vcc: buildWirePoints(vccPin, bbVccRail),
      gnd: buildWirePoints(gndPin, bbGndRail),
    };
  }, [boardOffset.x, boardOffset.z, bbOffset.x, bbOffset.z]);

  return (
    <group position={[-0.8 + setupPos.x, 0, setupPos.z]}>
      {/* Invisible workbench grab-surface — pointer-down here starts setup drag */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.2, -0.041, 0]}
        renderOrder={-1}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (draggingId !== null) return;
          const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const raycaster = new THREE.Raycaster();
          const hit = new THREE.Vector3();
          const rect = gl.domElement.getBoundingClientRect();
          const nx = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera({ x: nx, y: ny }, camera);
          if (raycaster.ray.intersectPlane(dragPlane, hit)) {
            setupDragOriginRef.current = { x: hit.x, z: hit.z };
            setupStartRef.current = { x: setupPosRef.current.x, z: setupPosRef.current.z };
            setIsDraggingSetup(true);
            isDraggingSetupRef.current = true;
            gl.domElement.style.cursor = 'grabbing';
            onDragStart?.();
          }
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Drag is handled via DOM pointermove/pointerup in the useEffect above — no plane mesh needed */}
      <SceneLighting />
      <Environment preset="warehouse" intensity={0.22} />

      {/* ── Workbench ──────────────────────────────────────────────────────── */}
      {/* Top surface — receives shadows, provides the lit deck appearance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.042, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#181f28" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* Solid body — hides all component leads that extend below the surface.
          Box top face sits flush with the surface plane at y = -0.042.
          Extends 2 m downward so no lead geometry is ever visible from any
          allowed camera angle (maxPolarAngle = π/2.05 ≈ 87.8°). */}
      <mesh position={[0.2, -1.042, 0]} receiveShadow castShadow>
        <boxGeometry args={[2000, 2.0, 2000]} />
        <meshStandardMaterial color="#111720" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Front edge highlight strip — gives the bench a visible, chamfered edge */}
      <mesh position={[0.2, -0.052, 6.0]}>
        <boxGeometry args={[2000, 0.02, 0.012]} />
        <meshStandardMaterial color="#22304a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[2000, 500, "#1a2535", "#111820"]} position={[0.2, -0.039, 0]} />
      <ContactShadows opacity={0.7} blur={3} far={5} resolution={1024} color="#000820" position={[0.2, -0.04, 0]} />

      {/* Arduino Uno — draggable board */}
      <group
        position={[-0.6 + boardOffset.x, 0.01, boardOffset.z]}
        onPointerDown={(e) => { if (draggingId === null && !isDraggingSetup) startBoardDrag('arduino', e); }}
        onPointerEnter={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = 'grab'; }}
        onPointerLeave={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = ''; }}
      >
        <BoardModel />
        <PinHotspots onPinClick={onPinClick} wiringFrom={wiringFrom} />
      </group>

      {/* Breadboard — draggable board */}
      <group
        position={[1.2 + bbOffset.x, 0.01, bbOffset.z]}
        onPointerDown={(e) => { if (draggingId === null && !isDraggingSetup) startBoardDrag('breadboard', e); }}
        onPointerEnter={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = 'grab'; }}
        onPointerLeave={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = ''; }}
      >
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
          const l298Active = component.pins
            ? [component.pins.in1, component.pins.in2, component.pins.in3, component.pins.in4].some(p => p != null && (outputs[p] ?? 0) > 0.1)
            : (outputs[component.pin] ?? 0) > 0.1;
          element = <L298nDriver3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={l298Active} />;
        } else if (component.type === "HC05_BLUETOOTH" || component.type === "BLUETOOTH_MODULE") {
          element = <Hc05_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "RC522_RFID" || component.type === "RFID_MODULE") {
          element = <Rc522_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        // Displays
        } else if (component.type === "LCD1602" || component.type === "LCD2004") {
          element = <Lcd1602_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "EPAPER_BASIC") {
          element = <EpaperDisplay3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "LED_MATRIX") {
          element = <LedMatrix3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "LED_BAR_GRAPH") {
          element = <LedBarGraph3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} level={outputs[component.pin] ?? 0} />;
        } else if (component.type === "NEOPIXEL_RING" || component.type === "NEOPIXEL_RING_12" || component.type === "NEOPIXEL_RING_16" || component.type === "NEOPIXEL_RING_24") {
          element = <NeopixelRing3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "NEOPIXEL_MATRIX") {
          element = <NeopixelMatrix3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "NEOPIXEL_PIXEL") {
          element = <NeopixelPixel3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        // Sensors
        } else if (component.type === "NTC_SENSOR") {
          element = <NtcSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "PHOTORESISTOR") {
          element = <Photoresistor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "PIR_SENSOR") {
          element = <PirSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "MPU6050") {
          element = <Mpu6050_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "HC_SR04") {
          element = <HcSr04_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pins?.echo ?? component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "FLAME_SENSOR") {
          element = <FlameSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "GAS_SENSOR") {
          element = <GasSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "HEARTBEAT_SENSOR") {
          element = <HeartbeatSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "SOUND_SENSOR") {
          element = <SoundSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "HX711_LOAD_CELL" || component.type === "HX711_MODULE") {
          element = <Hx711_3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "RAIN_SENSOR") {
          element = <RainSensor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "TTP223_TOUCH") {
          element = <Ttp223Touch3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(inputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "SW420_VIBRATION") {
          element = <Sw420Vibration3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        // Input
        } else if (component.type === "ROTARY_ENCODER") {
          element = <RotaryEncoder3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "ANALOG_JOYSTICK") {
          element = <AnalogJoystick3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "DIP_SWITCH_8") {
          element = <DipSwitch3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "SLIDE_SWITCH") {
          element = <SlideSwitch3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "MEMBRANE_KEYPAD") {
          element = <MembraneKeypad3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "IR_RECEIVER") {
          element = <IrReceiver3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "IR_REMOTE") {
          element = <IrRemote3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        // Motor
        } else if (component.type === "STEPPER_MOTOR") {
          const stepperActive = component.pins
            ? Object.values(component.pins).some(p => p != null && (outputs[p] ?? 0) > 0.1)
            : (outputs[component.pin] ?? 0) > 0.1;
          element = <StepperMotor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={stepperActive} />;
        } else if (component.type === "RELAY_MODULE") {
          element = <RelayModule3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        // Comms / Memory
        } else if (component.type === "DS1307_RTC") {
          element = <Ds1307Rtc3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "MICROSD_MODULE") {
          element = <MicroSdModule3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        // Logic ICs
        } else if (component.type === "LOGIC_AND" || component.type === "LOGIC_OR" || component.type === "LOGIC_NAND" || component.type === "LOGIC_NOR" || component.type === "LOGIC_XOR") {
          element = <LogicGate3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} gateType={component.type.replace("LOGIC_","")} active={(outputs[component.pins?.out ?? component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "LOGIC_NOT") {
          element = <LogicGate3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} gateType="NOT" active={(outputs[component.pins?.out ?? component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "LOGIC_DFLIPFLOP") {
          element = <LogicGate3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} gateType="DFF" active={(outputs[component.pins?.q ?? component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "NMOSFET" || component.type === "PMOSFET") {
          element = <MosfetTransistor3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} type={component.type === "PMOSFET" ? "P" : "N"} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "OPTOCOUPLER") {
          element = <OptocouplerIC3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        // Power / Connectors
        } else if (component.type === "AA_BATTERY") {
          element = <AaBattery3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "BENCH_PSU") {
          element = <BenchPsu3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "BUCK_CONVERTER") {
          element = <BuckConverter3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "LM7805_REG") {
          element = <Lm7805Reg3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "FUNCTION_GENERATOR") {
          element = <FunctionGenerator3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "USB_CONNECTOR") {
          element = <UsbConnector3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "BARREL_JACK") {
          element = <BarrelJack3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "SCREW_TERMINAL_2") {
          element = <ScrewTerminal3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} pinCount={2} />;
        } else if (component.type === "SCREW_TERMINAL_3") {
          element = <ScrewTerminal3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} pinCount={3} />;
        } else if (component.type === "RGB_LED") {
          element = <Led3D position={component.position} rotation={component.rotation} color="#ff44ff" level={(outputs[component.pin] ?? 0)} highlighted={isHighlighted} />;
        }

        if (element) {
          const tooltipLabel = compTooltip(component);
          const [cx, cy, cz] = component.position || [0, 0, 0];
          return (
            <group
              key={component.id}
              onClick={(e) => { e.stopPropagation(); if (draggingId === null) onSelect?.(component.id); }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingId(component.id);
                setHoveredCompId(null);
                onDragStart?.();
                gl.domElement.style.cursor = 'grabbing';
              }}
              onPointerEnter={() => {
                if (draggingId === null) {
                  gl.domElement.style.cursor = 'grab';
                  setHoveredCompId(component.id);
                }
              }}
              onPointerLeave={() => {
                if (draggingId === null) gl.domElement.style.cursor = '';
                setHoveredCompId(null);
              }}
            >
              {element}
              {hoveredCompId === component.id && tooltipLabel && (
                <Html position={[0, 0.28, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
                  <div style={{
                    background: "rgba(10,12,16,0.92)",
                    color: "#e6edf3",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                  }}>
                    {tooltipLabel}
                  </div>
                </Html>
              )}
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

      {/* Power-bus jumpers — always visible, connect Arduino 5V/GND to breadboard rails */}
      <Wire3D points={powerBusWires.vcc} color="#dc2626" />
      <Wire3D points={powerBusWires.gnd} color="#111111" />
    </group>
  );
}
