/**
 * ESP32 DevKit V1 (30-pin) — Pin Layout
 *
 * Physical pin numbering 1-30 with GPIO assignments.
 * Left side:  pins 1-15  (top to bottom)
 * Right side: pins 16-30 (bottom to top, reversed for chip rendering)
 *
 * Pin categories:
 *   - inputOnly: GPIO 34, 35, 36, 39 — no output driver
 *   - strapping: GPIO 0, 2, 5, 12, 15 — affect boot mode
 *   - adc1: works alongside WiFi
 *   - adc2: disabled when WiFi active
 *   - dac: true analog output (GPIO 25, 26)
 *   - touch: capacitive touch sensing
 */

export const ESP32_PIN_LAYOUT = [
  // ──── LEFT SIDE (pins 1-19, top to bottom) ────
  { num: 1,  label: "3V3", power: true },
  { num: 2,  label: "EN", special: "reset" },
  { num: 3,  label: "VP", gpio: 36, inputOnly: true, functions: ["ADC1_CH0"] },
  { num: 4,  label: "VN", gpio: 39, inputOnly: true, functions: ["ADC1_CH3"] },
  { num: 5,  label: "34", gpio: 34, inputOnly: true, functions: ["ADC1_CH6"] },
  { num: 6,  label: "35", gpio: 35, inputOnly: true, functions: ["ADC1_CH7"] },
  { num: 7,  label: "32", gpio: 32 },
  { num: 8,  label: "33", gpio: 33 },
  { num: 9,  label: "25", gpio: 25, dac: true },
  { num: 10, label: "26", gpio: 26, dac: true },
  { num: 11, label: "27", gpio: 27 },
  { num: 12, label: "14", gpio: 14 },
  { num: 13, label: "12", gpio: 12 },
  { num: 14, label: "GND", power: true },
  { num: 15, label: "13", gpio: 13 },
  { num: 16, label: "D2", gpio: 9 },
  { num: 17, label: "D3", gpio: 10 },
  { num: 18, label: "CMD", gpio: 11 },
  { num: 19, label: "5V", power: true },

  // ──── RIGHT SIDE (pins 20-38, bottom to top) ────
  { num: 20, label: "CLK", gpio: 6 },
  { num: 21, label: "D0", gpio: 7 },
  { num: 22, label: "D1", gpio: 8 },
  { num: 23, label: "15", gpio: 15 },
  { num: 24, label: "2", gpio: 2 },
  { num: 25, label: "0", gpio: 0, strapping: true },
  { num: 26, label: "4", gpio: 4 },
  { num: 27, label: "16", gpio: 16 },
  { num: 28, label: "17", gpio: 17 },
  { num: 29, label: "5", gpio: 5 },
  { num: 30, label: "18", gpio: 18 },
  { num: 31, label: "19", gpio: 19 },
  { num: 32, label: "GND", power: true },
  { num: 33, label: "21", gpio: 21 },
  { num: 34, label: "RX", gpio: 3 },
  { num: 35, label: "TX", gpio: 1 },
  { num: 36, label: "22", gpio: 22 },
  { num: 37, label: "23", gpio: 23 },
  { num: 38, label: "GND", power: true },
];

/**
 * Function-based color scheme for ESP32 pins.
 * Unlike ATmega's port-based colors, ESP32 uses functional groupings.
 */
export const ESP32_PIN_COLORS = {
  adc1:      "#10b981",  // emerald — safe analog
  adc2:      "#f59e0b",  // amber — WiFi-conflicting analog
  dac:       "#8b5cf6",  // violet — true analog out
  touch:     "#06b6d4",  // cyan — capacitive
  spi:       "#3b82f6",  // blue — SPI bus
  i2c:       "#ec4899",  // pink — I2C bus
  uart:      "#f97316",  // orange — serial
  strapping: "#ef4444",  // red — boot-critical
  inputOnly: "#6b7280",  // gray — input-only
  general:   "#22d3ee",  // light cyan — general GPIO
  power:     "#fbbf24",  // gold — power/ground
};

/**
 * Get the dominant color for a pin based on its most important function.
 */
export function getESP32PinColor(pin) {
  if (pin.power) return ESP32_PIN_COLORS.power;
  if (pin.special === "reset") return ESP32_PIN_COLORS.power;
  if (pin.inputOnly) return ESP32_PIN_COLORS.inputOnly;
  if (pin.strapping) return ESP32_PIN_COLORS.strapping;
  if (pin.dac) return ESP32_PIN_COLORS.dac;
  if (pin.touch) return ESP32_PIN_COLORS.touch;
  if (pin.functions?.some(f => f.startsWith("I2C"))) return ESP32_PIN_COLORS.i2c;
  if (pin.functions?.some(f => f.includes("SPI"))) return ESP32_PIN_COLORS.spi;
  if (pin.functions?.some(f => f.startsWith("UART"))) return ESP32_PIN_COLORS.uart;
  if (pin.adc === "adc1") return ESP32_PIN_COLORS.adc1;
  if (pin.adc === "adc2") return ESP32_PIN_COLORS.adc2;
  return ESP32_PIN_COLORS.general;
}
