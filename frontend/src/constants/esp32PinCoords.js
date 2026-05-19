/**
 * ESP32 DevKit V1 (30-pin) — Pin header scene-space coordinates
 *
 * Extracted deterministically from esp32_30pin.glb by:
 *   1. Isolating Pin_Metal (material 10) and Pin_Metal.001 (material 12) primitives
 *   2. Clustering 720 vertices per row into 15 pin groups along Y axis
 *   3. Computing top-center of each pin cluster: [meanX, maxZ, meanY] in GLB space
 *   4. Transforming through Esp32BoardModel pipeline:
 *      scale(0.02626), rotation([-PI/2,0,0]), translate([0.0016, 0.3234, 0.6238])
 *
 * Pin row geometry (scene space):
 *   Left  row X = -0.3339  (Pin_Metal,     15 pins, 48 verts each)
 *   Right row X =  0.3392  (Pin_Metal.001, 15 pins, 48 verts each)
 *   Pin top Y ≈ 0.550      (max Z in GLB = 8.657mm, after transform)
 *   Pin spacing = 0.0664   (2.528mm pitch at scale)
 *   Pin 0 (nearest USB) at Z ≈ +0.251, Pin 14 (far end) at Z ≈ -0.678
 *
 * Pin assignment uses esp32PinLayout.js:
 *   Left  row = ESP32_TOP_PINS:    VIN, GND, D13, D12, D14, D27, D26, D25, D33, D32, D35, D34, VN, VP, EN
 *   Right row = ESP32_BOTTOM_PINS: 3V3, GND, D15, D2,  D4,  RX2, TX2, D5,  D18, D19, D21, RX0, TX0, D22, D23
 */

import { ESP32_TOP_PINS, ESP32_BOTTOM_PINS } from "./esp32PinLayout";

// ── Left row (Pin_Metal): X = -0.3339, Y = 0.5507 ──────────────────────────
const LEFT_POSITIONS = [
  [-0.333919, 0.550722,  0.250979],   // L0  (nearest USB)
  [-0.333919, 0.550722,  0.184594],   // L1
  [-0.333919, 0.550722,  0.118208],   // L2
  [-0.333919, 0.550722,  0.051823],   // L3
  [-0.333919, 0.550722, -0.014562],   // L4
  [-0.333919, 0.550722, -0.080947],   // L5
  [-0.333919, 0.550722, -0.147333],   // L6
  [-0.333919, 0.550722, -0.213718],   // L7
  [-0.333919, 0.550722, -0.280103],   // L8
  [-0.333919, 0.550722, -0.346489],   // L9
  [-0.333919, 0.550722, -0.412874],   // L10
  [-0.333919, 0.550722, -0.479259],   // L11
  [-0.333919, 0.550722, -0.545644],   // L12
  [-0.333919, 0.550722, -0.612030],   // L13
  [-0.333919, 0.550722, -0.678415],   // L14 (far from USB)
];

// ── Right row (Pin_Metal.001): X = 0.3392, Y = 0.5493 ──────────────────────
const RIGHT_POSITIONS = [
  [0.339214, 0.549302,  0.254750],   // R0  (nearest USB)
  [0.339214, 0.549302,  0.188365],   // R1
  [0.339214, 0.549302,  0.121979],   // R2
  [0.339214, 0.549302,  0.055594],   // R3
  [0.339214, 0.549302, -0.010791],   // R4
  [0.339214, 0.549302, -0.077177],   // R5
  [0.339214, 0.549302, -0.143562],   // R6
  [0.339214, 0.549302, -0.209947],   // R7
  [0.339214, 0.549302, -0.276332],   // R8
  [0.339214, 0.549302, -0.342718],   // R9
  [0.339214, 0.549302, -0.409103],   // R10
  [0.339214, 0.549302, -0.475488],   // R11
  [0.339214, 0.549302, -0.541874],   // R12
  [0.339214, 0.549302, -0.608259],   // R13
  [0.339214, 0.549302, -0.674644],   // R14 (far from USB)
];

// ── Build coordinate map ────────────────────────────────────────────────────
const ESP32_PIN_COORDS = {};

// Left row = TOP_PINS from esp32PinLayout.js
ESP32_TOP_PINS.forEach((pin, i) => {
  const key = pin.gpio != null ? pin.gpio : pin.label;
  ESP32_PIN_COORDS[key] = LEFT_POSITIONS[i];
});

// Right row = BOTTOM_PINS from esp32PinLayout.js
ESP32_BOTTOM_PINS.forEach((pin, i) => {
  const key = pin.gpio != null ? pin.gpio : pin.label;
  ESP32_PIN_COORDS[key] = RIGHT_POSITIONS[i];
});

export { ESP32_PIN_COORDS };
export const getEsp32PinCoord = (pinId) => ESP32_PIN_COORDS[pinId] || [0, 0.55, 0];
