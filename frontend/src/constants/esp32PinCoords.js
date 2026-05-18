import { ESP32_TOP_PINS, ESP32_BOTTOM_PINS } from "./esp32PinLayout";

const PIN_Y = 0.148;
const P = 0.0667;     // 2.54 mm pitch at scene scale
const ROW_X = 0.3335; // 25.4 mm (1 inch) between rows -> +/- 0.3335 from center

// Center of the 15 pin row is pin index 7.
// The pins run along the Z axis (length of the board).

const ESP32_PIN_COORDS = {};

// We assume Top pins (VIN, GND, etc) are on the left (-X) or right (+X)?
// If the board is oriented with USB at +Z (bottom), 
// Top row (VIN, GND...) is on the left (-X).
// Bottom row (3V3, GND...) is on the right (+X).
// Let's place TOP on -X, BOTTOM on +X.
// Pin index 0 (VIN or 3V3) is near the top edge (-Z) or bottom edge (+Z)?
// If USB is at +Z, then VIN/3V3 are at -Z.
// So Z ranges from -7*P to +7*P.

ESP32_TOP_PINS.forEach((pin, i) => {
  const z = (-7 + i) * P;
  ESP32_PIN_COORDS[pin.gpio != null ? pin.gpio : pin.label] = [-ROW_X, PIN_Y, z];
});

ESP32_BOTTOM_PINS.forEach((pin, i) => {
  const z = (-7 + i) * P;
  ESP32_PIN_COORDS[pin.gpio != null ? pin.gpio : pin.label] = [ROW_X, PIN_Y, z];
});

export { ESP32_PIN_COORDS };
export const getEsp32PinCoord = (pinId) => ESP32_PIN_COORDS[pinId] || [0, PIN_Y, 0];
