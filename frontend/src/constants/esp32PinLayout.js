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
  // ──── LEFT SIDE (pins 1-15, top to bottom) ────
  { num: 1,  label: "3V3",     power: true },
  { num: 2,  label: "EN",      special: "reset" },
  { num: 3,  label: "GPIO36",  gpio: 36, functions: ["ADC1_CH0", "SVP"],     inputOnly: true,  adc: "adc1" },
  { num: 4,  label: "GPIO39",  gpio: 39, functions: ["ADC1_CH3", "SVN"],     inputOnly: true,  adc: "adc1" },
  { num: 5,  label: "GPIO34",  gpio: 34, functions: ["ADC1_CH6"],            inputOnly: true,  adc: "adc1" },
  { num: 6,  label: "GPIO35",  gpio: 35, functions: ["ADC1_CH7"],            inputOnly: true,  adc: "adc1" },
  { num: 7,  label: "GPIO32",  gpio: 32, functions: ["ADC1_CH4", "TOUCH9"],  adc: "adc1", touch: true },
  { num: 8,  label: "GPIO33",  gpio: 33, functions: ["ADC1_CH5", "TOUCH8"],  adc: "adc1", touch: true },
  { num: 9,  label: "GPIO25",  gpio: 25, functions: ["ADC2_CH8", "DAC1"],    adc: "adc2", dac: true },
  { num: 10, label: "GPIO26",  gpio: 26, functions: ["ADC2_CH9", "DAC2"],    adc: "adc2", dac: true },
  { num: 11, label: "GPIO27",  gpio: 27, functions: ["ADC2_CH7", "TOUCH7"],  adc: "adc2", touch: true },
  { num: 12, label: "GPIO14",  gpio: 14, functions: ["ADC2_CH6", "TOUCH6", "HSPI_CLK"], adc: "adc2", touch: true },
  { num: 13, label: "GPIO12",  gpio: 12, functions: ["ADC2_CH5", "TOUCH5", "HSPI_MISO"], adc: "adc2", touch: true, strapping: true },
  { num: 14, label: "GND",     power: true },
  { num: 15, label: "GPIO13",  gpio: 13, functions: ["ADC2_CH4", "TOUCH4", "HSPI_MOSI"], adc: "adc2", touch: true },

  // ──── RIGHT SIDE (pins 16-30, bottom to top) ────
  { num: 16, label: "GPIO2",   gpio: 2,  functions: ["ADC2_CH2", "TOUCH2", "LED"], adc: "adc2", touch: true, strapping: true },
  { num: 17, label: "GPIO0",   gpio: 0,  functions: ["ADC2_CH1", "TOUCH1", "Boot"], adc: "adc2", touch: true, strapping: true },
  { num: 18, label: "GPIO4",   gpio: 4,  functions: ["ADC2_CH0", "TOUCH0"],  adc: "adc2", touch: true },
  { num: 19, label: "GPIO16",  gpio: 16, functions: ["UART2_RX"] },
  { num: 20, label: "GPIO17",  gpio: 17, functions: ["UART2_TX"] },
  { num: 21, label: "GPIO5",   gpio: 5,  functions: ["VSPI_CS"],  strapping: true },
  { num: 22, label: "GPIO18",  gpio: 18, functions: ["VSPI_CLK"] },
  { num: 23, label: "GPIO19",  gpio: 19, functions: ["VSPI_MISO"] },
  { num: 24, label: "GND",     power: true },
  { num: 25, label: "GPIO21",  gpio: 21, functions: ["I2C_SDA"] },
  { num: 26, label: "GPIO3",   gpio: 3,  functions: ["UART0_RX", "RX0"] },
  { num: 27, label: "GPIO1",   gpio: 1,  functions: ["UART0_TX", "TX0"] },
  { num: 28, label: "GPIO22",  gpio: 22, functions: ["I2C_SCL"] },
  { num: 29, label: "GPIO23",  gpio: 23, functions: ["VSPI_MOSI"] },
  { num: 30, label: "GND",     power: true },
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
