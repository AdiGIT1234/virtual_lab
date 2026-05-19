import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCircuitStore } from "../../state/useCircuitStore";
import { getPinCoord } from "../../constants/unoPinCoords";
import { CIRCUIT_PRESETS } from "../../constants/circuitPresets";
import {
  holeCoords,
  midpoint,
  validateComponentPins,
} from "../../constants/breadboardHoles";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import SceneLighting from "./SceneLighting";
import BoardModel from "./BoardModel";
import Esp32BoardModel from "./Esp32BoardModel";
import BreadboardModel from "./BreadboardModel";
import PinHotspots from "./PinHotspots";
import { getEsp32PinCoord } from "../../constants/esp32PinCoords";
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
function pinToSceneCoords(pinNum, boardOff = { x: 0, z: 0 }, mcuId = "atmega328p") {
  let local;
  if (mcuId === "esp32") {
    // pinNum might be a string (e.g., "VIN") or a number (e.g., "13")
    local = getEsp32PinCoord(pinNum);
  } else {
    local = getPinCoord(Number(pinNum));
  }
  if (!local) return null;
  return [-0.6 + boardOff.x + local[0], 0.01 + local[1] + 0.04, boardOff.z + local[2]];
}

// Resolve a wire endpoint string like "mcu::13" or "res-1::t1" to scene-group [x,y,z]
function resolveEndpoint(str, posMap, boardOff = { x: 0, z: 0 }, mcuId = "atmega328p") {
  if (!str) return null;
  const [id, terminal] = str.split("::");

  if (id === "mcu") {
    return pinToSceneCoords(terminal, boardOff, mcuId);
  }

  const pos = posMap[id];
  if (!pos) return null;

  const [bx, by, bz] = pos;

  // Named terminal → [dx, dy, dz] offset from component centre.
  // All offsets are in scene-group units (1 unit ≈ 200 mm).
  // Components sit at y≈0.085; wires drop down from y≈0.085 so dy=0 here.
  const OFF = {
    // Resistor leads — ±0.100 = exactly 2 breadboard hole pitches (0.05 each)
    t1: [-0.100, 0, 0],  t2: [+0.100, 0, 0],
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

const PERP_EXIT = 0.18; // wire rises high above pins for realistic jumper-cable arc

// Board surface y in scene-group space (breadboard group y=0.01 + holes group y=0.025)
const BOARD_Y = 0.035;

// ── Breadboard snap ────────────────────────────────────────────────────────
// Returns the nearest hole's scene-group [x, z] to a dragged component.
// Snaps X to the nearest column (0.05 pitch) and Z to the nearest row.
const BB_ROWS = [
  { z: -0.265 }, { z: -0.215 }, { z: -0.165 }, { z: -0.115 }, { z: -0.065 }, // a-e
  { z:  0.065 }, { z:  0.115 }, { z:  0.165 }, { z:  0.215 }, { z:  0.265 }, // f-j
  { z: -0.350 }, { z: -0.400 }, // +T, -T
  { z:  0.350 }, { z:  0.400 }, // +B, -B
];
const BB_STEP = 0.05;
const BB_COL1_X = 1.2 - (63 * BB_STEP) / 2; // scene-group X of column 1 = -0.375

// Map a row Z (in breadboard-local space) to its row letter (a-j / +T / -T / +B / -B).
// Used by the snap-safety pass to compose hole IDs from snapped coordinates.
const BB_ROW_KEYS = ["a","b","c","d","e","f","g","h","i","j","+T","-T","+B","-B"];

function rowKeyForZ(localZ) {
  // Find the closest entry in BB_ROWS by Z and return its row letter.
  let bestIdx = 7;
  let minD = Infinity;
  for (let i = 0; i < BB_ROWS.length; i++) {
    const d = Math.abs(localZ - BB_ROWS[i].z);
    if (d < minD) { minD = d; bestIdx = i; }
  }
  return BB_ROW_KEYS[bestIdx];
}

/**
 * Snap a dragged component to the nearest breadboard hole.
 *
 * Two-pass behaviour:
 *   1. First pass — snap X to the nearest column, Z to the nearest row.
 *   2. Safety pass — if the caller provides a `leadOffsetsCols` array
 *      describing the component's leads as integer column offsets from the
 *      centre (e.g. resistor leads are [-2, +2], LED leads are [0, +1]),
 *      and a `componentType` for power-rail exemption, simulate where each
 *      lead would land and detect a short circuit. If shorted, shift the
 *      whole component one column at a time (alternating +/-) until safe
 *      or 6 attempts have been exhausted.
 *
 * The function does not validate against other components on the same node
 * — that is intentional: shorting two components together is sometimes the
 * user's goal (e.g. wiring two resistors in parallel). We only block the
 * "single component shorts itself" case here; cross-component shorts are
 * surfaced via the per-component violation badges in the scene.
 */
function snapToNearestHole(
  sceneX,
  sceneZ,
  bbOffsetX = 0,
  bbOffsetZ = 0,
  leadOffsetsCols = null,
  componentType = null,
) {
  // Only snap when within the breadboard's X/Z footprint (+1 hole margin)
  const xMin = BB_COL1_X + bbOffsetX - BB_STEP;
  const xMax = BB_COL1_X + bbOffsetX + 63 * BB_STEP;
  const zMin = -0.42 + bbOffsetZ;
  const zMax =  0.42 + bbOffsetZ;
  if (sceneX < xMin || sceneX > xMax || sceneZ < zMin || sceneZ > zMax) return null;

  // Nearest column
  const raw = (sceneX - BB_COL1_X - bbOffsetX) / BB_STEP;
  let col = Math.max(0, Math.min(62, Math.round(raw)));

  // Nearest row (find both Z value and the corresponding local row letter)
  let nearestZ = BB_ROWS[7].z + bbOffsetZ; // default to row h
  let nearestLocalZ = BB_ROWS[7].z;
  let minDist = Infinity;
  for (const row of BB_ROWS) {
    const d = Math.abs(sceneZ - (row.z + bbOffsetZ));
    if (d < minDist) {
      minDist = d;
      nearestZ = row.z + bbOffsetZ;
      nearestLocalZ = row.z;
    }
  }

  // ── Safety pass ──────────────────────────────────────────────────────────
  // If we know the component's lead layout in columns, verify the snapped
  // position doesn't put two leads onto the same electrical node. The check
  // mirrors validateComponentPins() but operates on hole IDs we synthesise
  // from (col + leadOffset, row).
  if (Array.isArray(leadOffsetsCols) && leadOffsetsCols.length >= 2) {
    const rowKey = rowKeyForZ(nearestLocalZ);
    const buildPins = (centreCol) => {
      const pins = {};
      leadOffsetsCols.forEach((dCol, i) => {
        const c = Math.max(1, Math.min(63, centreCol + dCol + 1)); // col is 0-indexed; holes are 1-indexed
        pins[`t${i + 1}`] = `${rowKey}${c}`;
      });
      return pins;
    };

    // Up to 6 attempts: 0, +1, -1, +2, -2, +3
    const trials = [0, 1, -1, 2, -2, 3];
    for (const shift of trials) {
      const trialCol = col + shift;
      if (trialCol < 0 || trialCol > 62) continue;
      const pins = buildPins(trialCol);
      const violations = validateComponentPins(pins, componentType);
      // Only the short-circuit case is grounds for shifting; rail misuse is
      // surfaced as a warning, not auto-corrected (the user may want it).
      const hasShort = violations.some((v) => v.type === "SHORT_CIRCUIT");
      if (!hasShort) {
        col = trialCol;
        break;
      }
    }
  }

  const snappedX = BB_COL1_X + bbOffsetX + col * BB_STEP;
  return { x: snappedX, z: nearestZ };
}

// Lead offsets (in breadboard columns) per component type, relative to the
// component's centre column. Used by the snap-safety pass and the
// component-violation check during dragging. These mirror the OFF[] table
// in resolveEndpoint above, but expressed in column-pitch units (0.05 = 1 col).
const LEAD_COLS_BY_TYPE = {
  RESISTOR: [-2, +2],            // ±0.100 = 2 column pitches
  LED:        [0, +1],           // leads 1 column apart
  LED_RED:    [0, +1],
  LED_GREEN:  [0, +1],
  LED_YELLOW: [0, +1],
  LED_BLUE:   [0, +1],
  RGB_LED:    [0, +1],
  CAPACITOR:  [-1, +1],
  NPN_TRANSISTOR: [-1, 0, +1],
  PNP_TRANSISTOR: [-1, 0, +1],
};

// Per-type y-lift: distance from BOARD_Y to model origin so body bottom sits at BOARD_Y.
// Derived from each model's geometry (body-center to body-bottom distance).
const COMP_Y = {
  LED: BOARD_Y + 0.090,          // cylinder h=0.18, half=0.09
  LED_RED: BOARD_Y + 0.090,
  LED_GREEN: BOARD_Y + 0.090,
  LED_YELLOW: BOARD_Y + 0.090,
  LED_BLUE: BOARD_Y + 0.090,
  RESISTOR: BOARD_Y + 0.048,     // body floats above surface; bent leads go into holes
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
  const mcuId        = useCircuitStore((s) => s.mcuId);
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
        const sp = setupPosRef.current;
        const localX = target.x - (-0.8 + sp.x);
        const localZ = target.z - sp.z;
        const comp = components.find(c => c.id === id);
        const compY = COMP_Y[comp?.type] ?? (BOARD_Y + 0.025);

        // Snap to nearest breadboard hole while hovering. If the dragged
        // component has a known lead layout we pass it through so the snap
        // helper can avoid placing both leads on the same node.
        const bb = bbOffsetRef.current;
        const leadCols = LEAD_COLS_BY_TYPE[comp?.type] || null;
        const snapped = snapToNearestHole(localX, localZ, bb.x, bb.z, leadCols, comp?.type);
        const finalX = snapped ? snapped.x : localX;
        const finalZ = snapped ? snapped.z : localZ;

        setLocalPosOverrides(prev => ({ ...prev, [id]: [finalX, compY, finalZ] }));
        // Visual cursor hint: grabbing-hand on breadboard, default elsewhere
        gl.domElement.style.cursor = snapped ? 'cell' : 'grabbing';
      }
    };

    const onUp = () => {
      // Commit snapped position — already applied in onMove, just clear drag state
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
        const y = COMP_Y[c.type] ?? (BOARD_Y + 0.025);
        // Manually placed components from the 3D sidebar store hole-encoded x/y coords
        if (c.manuallyPlaced && c.x != null && c.y != null) {
          map[c.id] = [(c.x - 450) * 0.005, y, (c.y - 300) * 0.005, c.type];
        } else {
          const col = sandboxColMap[c.id] ?? 3;
          map[c.id] = [startX + (col - 1) * 0.05, y, rowZ, c.type];
        }
      });
      return map;
    }

    // Preset mode: seed from explicit arlabPositions, offset by bbOffset so
    // components move with the breadboard when it is dragged.
    //
    // Two layout shapes are supported:
    //   - { pins: { t1: "h25", t2: "h29" } }  — hole-based; position is the
    //     centroid of all referenced breadboard holes. This is the preferred
    //     shape so leads land on real holes regardless of bbOffset.
    //   - { pos: [x, y, z] }                  — raw scene-group coordinates
    //     (legacy). bbOffset is added on top.
    Object.entries(arlabPositions).forEach(([id, layout]) => {
      const type = typeById[id] || null;
      const y = COMP_Y[type] ?? (BOARD_Y + 0.025);

      if (layout && layout.pins && typeof layout.pins === "object") {
        const coords = Object.values(layout.pins)
          .filter((h) => typeof h === "string" && h.length > 0)
          .map((h) => holeCoords(h, bbOffset));
        if (coords.length > 0) {
          const [cx, , cz] = midpoint(coords);
          map[id] = [cx, y, cz, type];
          return;
        }
      }

      if (layout && Array.isArray(layout.pos)) {
        map[id] = [layout.pos[0] + bbOffset.x, y, layout.pos[2] + bbOffset.z, type];
      }
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

  // Validate each component's pin assignments against breadboard topology
  // rules (short circuits, power-rail misuse). Returns:
  //   { [componentId]: Array<{ type, message, ... }> }
  // Components without an explicit `pins` map in arlabPositions, or whose
  // pins reference non-breadboard locations, contribute nothing.
  const componentViolations = useMemo(() => {
    const out = {};
    if (presetId === "__sandbox__") return out;
    const typeById = {};
    components.forEach((c) => { typeById[c.id] = c.type; });

    Object.entries(arlabPositions).forEach(([id, layout]) => {
      if (!layout || !layout.pins || typeof layout.pins !== "object") return;
      // Skip layouts that only carry a single { main: "..." } pin — those
      // describe components that sit on the board but don't have multiple
      // leads on the breadboard surface (servos, modules, IC bodies).
      const pinKeys = Object.keys(layout.pins);
      if (pinKeys.length < 2 && !(pinKeys[0] === "main" && typeById[id] === "VCC_NODE")) {
        // Single-pin layouts can still trigger POWER_RAIL_MISUSE for non-power
        // components, but the SHORT_CIRCUIT rule needs ≥2 pins. We still run
        // the validator for the rail check.
      }
      const v = validateComponentPins(layout.pins, typeById[id]);
      if (v.length > 0) out[id] = v;
    });
    return out;
  }, [arlabPositions, components, presetId]);

  // Resolve wires to 3D points.
  // Sandbox wires take precedence when the user has drawn connections in the 2D lab;
  // otherwise fall back to the preset's built-in wire definitions.
  const resolvedWires = useMemo(() => {
    const wires = sandboxWires.length > 0 ? sandboxWires : (preset.wires || []);
    return wires.flatMap((wire) => {
      if (!wire.source || !wire.target) return [];
      const p1 = resolveEndpoint(wire.source, posMap, boardOffset, mcuId);
      const p2 = resolveEndpoint(wire.target, posMap, boardOffset, mcuId);
      const pts = buildWirePoints(p1, p2);
      if (!pts) return [];
      return [{ ...wire, points: pts }];
    });
  }, [sandboxWires, preset.wires, posMap, boardOffset, mcuId]);

  // Build sceneComponents with final positions/rotations.
  // y is always derived from COMP_Y[type] so every component sits at the correct height
  // above the breadboard surface regardless of what arlabPositions.pos[1] says.
  const sceneComponents = useMemo(() => {
    return components.map((component) => {
      const layout = arlabPositions[component.id];
      // Always use posMap so bbOffset / boardOffset are already baked in.
      // localPosOverrides still take priority (user has dragged the component).
      const base = localPosOverrides[component.id] ?? (posMap[component.id] || [0, BOARD_Y, 0]);
      const y = COMP_Y[component.type] ?? (BOARD_Y + 0.025);
      const position = [base[0], y, base[2]];
      const rotation = layout ? (layout.rot || [0, 0, 0]) : [0, 0, 0];
      return { ...component, position, rotation };
    });
  }, [components, arlabPositions, posMap, localPosOverrides]);

  const powerBusWires = useMemo(() => {
    const bbVccRail = [-0.275 + bbOffset.x,   0.045, -0.35  + bbOffset.z];
    const bbGndRail = [-0.175 + bbOffset.x,   0.045, -0.40  + bbOffset.z];
    
    if (mcuId === "esp32") {
      const vccLocal = getEsp32PinCoord("3V3");
      const gndLocal = getEsp32PinCoord("GND"); // Gets the first GND
      if (!vccLocal || !gndLocal) return { vcc: null, gnd: null };
      
      const vccPin = [-0.6 + boardOffset.x + vccLocal[0], 0.188, boardOffset.z + vccLocal[2]];
      const gndPin = [-0.6 + boardOffset.x + gndLocal[0], 0.188, boardOffset.z + gndLocal[2]];
      return {
        vcc: buildWirePoints(vccPin, bbVccRail),
        gnd: buildWirePoints(gndPin, bbGndRail),
      };
    }

    const vccPin    = [-0.021 + boardOffset.x, 0.188, -0.570 + boardOffset.z];
    const gndPin    = [ 0.046 + boardOffset.x, 0.188, -0.570 + boardOffset.z];
    return {
      vcc: buildWirePoints(vccPin, bbVccRail),
      gnd: buildWirePoints(gndPin, bbGndRail),
    };
  }, [boardOffset.x, boardOffset.z, bbOffset.x, bbOffset.z, mcuId]);

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
      <Environment preset="warehouse" intensity={0.08} />

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
      {/* Board meshes are non-raycastable so they don't block breadboard clicks
          in the overlap zone. Dragging is handled by a dedicated invisible plane
          that covers only the left (clear-of-breadboard) portion of the board. */}
      <group position={[-0.6 + boardOffset.x, 0.01, boardOffset.z]}>
        {mcuId === "esp32" ? <Esp32BoardModel /> : <BoardModel />}
        <PinHotspots onPinClick={onPinClick} wiringFrom={wiringFrom} mcuId={mcuId} />
        {/* Drag handle — left 60% of board, stays clear of breadboard overlap */}
        <mesh
          position={[-0.34, 0.20, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={(e) => { if (draggingId === null && !isDraggingSetup) startBoardDrag('arduino', e); }}
          onPointerEnter={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = 'grab'; }}
          onPointerLeave={() => { if (draggingBoard === null && draggingId === null) gl.domElement.style.cursor = ''; }}
        >
          <planeGeometry args={[1.1, 1.28]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Breadboard — always shown, draggable */}
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
          element = <OledDisplay3D id={component.id} wiredPins={component.pins} position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "ILI9341_TFT") {
          element = <TftDisplay3D id={component.id} wiredPins={component.pins} position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
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
          element = <Lcd1602_3D id={component.id} wiredPins={component.pins} position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "EPAPER_BASIC") {
          element = <EpaperDisplay3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} />;
        } else if (component.type === "LED_MATRIX") {
          element = <LedMatrix3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
        } else if (component.type === "LED_BAR_GRAPH") {
          element = <LedBarGraph3D position={component.position} rotation={component.rotation} highlighted={isHighlighted} level={outputs[component.pin] ?? 0} />;
        } else if (component.type === "NEOPIXEL_RING" || component.type === "NEOPIXEL_RING_12" || component.type === "NEOPIXEL_RING_16" || component.type === "NEOPIXEL_RING_24") {
          element = <NeopixelRing3D id={component.id} type={component.type} wiredPins={{ din: component.pin }} position={component.position} rotation={component.rotation} highlighted={isHighlighted} active={(outputs[component.pin] ?? 0) > 0.1} />;
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
          const violations = componentViolations[component.id] || [];
          const hasShort = violations.some((v) => v.type === "SHORT_CIRCUIT");
          // Short circuits dominate the badge colour — they're the more
          // serious failure mode (current flows where it shouldn't).
          const badgeBg = hasShort ? "rgba(180,0,0,0.92)" : "rgba(200,110,0,0.92)";
          const badgeBorder = hasShort ? "#ff4444" : "#ffaa44";
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
              {violations.length > 0 && (
                <Html position={[0, 0.3, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
                  <div style={{
                    background: badgeBg,
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    border: `1px solid ${badgeBorder}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    lineHeight: 1.4,
                  }}>
                    {violations.map((v, vi) => (
                      <div key={vi}>{"⚠ "}{v.message}</div>
                    ))}
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

      {/* Power-bus jumpers — always visible, connect MCU power to breadboard rails */}
      {powerBusWires.vcc && <Wire3D points={powerBusWires.vcc} color="#dc2626" />}
      {powerBusWires.gnd && <Wire3D points={powerBusWires.gnd} color="#111111" />}
    </group>
  );
}
