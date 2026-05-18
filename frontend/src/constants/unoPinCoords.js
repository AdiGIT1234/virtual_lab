// Pin hole positions in board-group local space, derived from the actual
// arduino_uno_proper.glb mesh bounding boxes (node_id364 sub-meshes).
//
// Board lies flat:  X = width (−0.90 → +0.90),  Z = depth (−0.64 → +0.64),  Y = height (0 → 0.29)
// USB connector is at the LEFT (negative-X) short edge, toward the negative-Z long edge.
//
// Header geometry (measured from mesh bboxes after full transform):
//   Digital header  Z ≈ +0.565  (node_id364 Materials 226 + 228)
//   Analog  header  Z ≈ −0.578  (node_id364 Material  224)
//   Header-body top Y ≈  0.188
//
// PinHotspots.jsx adds +0.04 to Y, so base Y = 0.148 → hotspot at Y ≈ 0.188 (header top).
//
// Pin pitch = 2.54 mm; at scene scale (1.80 su = 68.58 mm) → 0.0667 su / pin.
// D13 is leftmost (nearest USB, X ≈ −0.096); D0 is rightmost (X ≈ +0.784).
// Two physical sockets have a ~1.6 mm gap between D6 (socket 1) and D5 (socket 2).
// A0 is rightmost (X ≈ +0.727); A5 is leftmost (X ≈ +0.394).

const PIN_Y = 0.148;   // base Y (PinHotspots adds 0.04 → 0.188, at header top surface)
const DIG_Z =  0.565;  // digital header center Z
const ANA_Z = -0.578;  // analog  header center Z
const P     =  0.0667; // 2.54 mm pitch at scene scale

// Socket 1: D13–D6 (8 pins), leftmost, nearest USB
const D13_X = -0.096;
// Socket 2: D5–D0 (6 pins), gap after socket 1
const D5_X  =  0.451;
// Analog: A5 (leftmost) → A0 (rightmost)
const A5_X  =  0.394;

const UNO_PIN_COORDS = {
  // ── Digital ──────────────────────────────────────────────────────────
  13: [D13_X + 0 * P, PIN_Y, DIG_Z],
  12: [D13_X + 1 * P, PIN_Y, DIG_Z],
  11: [D13_X + 2 * P, PIN_Y, DIG_Z],
  10: [D13_X + 3 * P, PIN_Y, DIG_Z],
   9: [D13_X + 4 * P, PIN_Y, DIG_Z],
   8: [D13_X + 5 * P, PIN_Y, DIG_Z],
   7: [D13_X + 6 * P, PIN_Y, DIG_Z],
   6: [D13_X + 7 * P, PIN_Y, DIG_Z],
   5: [D5_X  + 0 * P, PIN_Y, DIG_Z],
   4: [D5_X  + 1 * P, PIN_Y, DIG_Z],
   3: [D5_X  + 2 * P, PIN_Y, DIG_Z],
   2: [D5_X  + 3 * P, PIN_Y, DIG_Z],
   1: [D5_X  + 4 * P, PIN_Y, DIG_Z],
   0: [D5_X  + 5 * P, PIN_Y, DIG_Z],

  // ── Analog ───────────────────────────────────────────────────────────
  19: [A5_X + 0 * P, PIN_Y, ANA_Z],   // A5
  18: [A5_X + 1 * P, PIN_Y, ANA_Z],   // A4
  17: [A5_X + 2 * P, PIN_Y, ANA_Z],   // A3
  16: [A5_X + 3 * P, PIN_Y, ANA_Z],   // A2
  15: [A5_X + 4 * P, PIN_Y, ANA_Z],   // A1
  14: [A5_X + 5 * P, PIN_Y, ANA_Z],   // A0
};

export { UNO_PIN_COORDS };
export const getPinCoord = (pin) => UNO_PIN_COORDS[pin] || [0, PIN_Y, 0];
