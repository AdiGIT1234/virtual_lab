/**
 * ESP32 DevKit V1 (38-pin board) — Usable Pin Layout
 *
 * This board has 38 physical header pins (19 per side), but 8 of those
 * are NOT available for general use:
 *
 *   ❌ GPIO  6 (CLK)  — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO  7 (SD0/D0) — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO  8 (SD1/D1) — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO  9 (SD2/D2) — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO 10 (SD3/D3) — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO 11 (CMD)  — hardwired to internal SPI flash, do NOT use
 *   ❌ GPIO 37         — exists in chip but NOT broken out on this package
 *   ❌ GPIO 38         — exists in chip but NOT broken out on this package
 *
 * The layout below reflects the ACTUAL board silkscreen exactly:
 *
 *   Top row    (left→right): VIN GND D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN
 *   Bottom row (left→right): 3V3 GND D15 D2  D4  RX2 TX2 D5  D18 D19 D21 RX0 TX0 D22 D23
 *
 * Pin categories:
 *   - inputOnly  : GPIO 34, 35, 36(VP), 39(VN) — no output driver
 *   - strapping  : GPIO 0, 2, 5, 12, 15 — affect boot mode
 *   - adc1       : ADC1 channels (work alongside WiFi)
 *   - adc2       : ADC2 channels (disabled when WiFi active)
 *   - dac        : true analog output (GPIO 25, 26)
 *   - touch      : capacitive touch sensing
 *   - uart       : serial ports
 */

// ── TOP ROW (left → right on physical board) ────────────────────────────────
// Corresponds to the top header. Index 0 = leftmost pin.
export const ESP32_TOP_PINS = [
  { label: "VIN",  power: true,                                    desc: "5V input (from USB or ext.)" },
  { label: "GND",  power: true,  ground: true,                     desc: "Ground" },
  { label: "D13",  gpio: 13,     touch: true,                      desc: "GPIO 13 | Touch4 | ADC2_CH4" },
  { label: "D12",  gpio: 12,     touch: true,  strapping: true,    desc: "GPIO 12 | Touch5 | ADC2_CH5 — boot strapping" },
  { label: "D14",  gpio: 14,     touch: true,                      desc: "GPIO 14 | Touch6 | ADC2_CH6" },
  { label: "D27",  gpio: 27,     touch: true,                      desc: "GPIO 27 | Touch7 | ADC2_CH7" },
  { label: "D26",  gpio: 26,     dac: true,                        desc: "GPIO 26 | DAC2 | ADC2_CH9" },
  { label: "D25",  gpio: 25,     dac: true,                        desc: "GPIO 25 | DAC1 | ADC2_CH8" },
  { label: "D33",  gpio: 33,     inputOnly: false,                 desc: "GPIO 33 | ADC1_CH5 | Touch8" },
  { label: "D32",  gpio: 32,     inputOnly: false,                 desc: "GPIO 32 | ADC1_CH4 | Touch9" },
  { label: "D35",  gpio: 35,     inputOnly: true,                  desc: "GPIO 35 | ADC1_CH7 — input only" },
  { label: "D34",  gpio: 34,     inputOnly: true,                  desc: "GPIO 34 | ADC1_CH6 — input only" },
  { label: "VN",   gpio: 39,     inputOnly: true,                  desc: "GPIO 39 (VN) | ADC1_CH3 — input only" },
  { label: "VP",   gpio: 36,     inputOnly: true,                  desc: "GPIO 36 (VP) | ADC1_CH0 — input only" },
  { label: "EN",   special: "reset",                               desc: "Chip enable (active-high reset)" },
];

// ── BOTTOM ROW (left → right on physical board) ──────────────────────────────
export const ESP32_BOTTOM_PINS = [
  { label: "3V3",  power: true,                                    desc: "3.3V regulated output" },
  { label: "GND",  power: true,  ground: true,                     desc: "Ground" },
  { label: "D15",  gpio: 15,     strapping: true,                  desc: "GPIO 15 | ADC2_CH3 | Touch3 — boot strapping" },
  { label: "D2",   gpio: 2,      strapping: true,                  desc: "GPIO 2 | ADC2_CH2 | Touch2 — boot strapping (built-in LED)" },
  { label: "D4",   gpio: 4,      touch: true,                      desc: "GPIO 4 | ADC2_CH0 | Touch0" },
  { label: "RX2",  gpio: 16,     uart: true,                       desc: "GPIO 16 | UART2 RX" },
  { label: "TX2",  gpio: 17,     uart: true,                       desc: "GPIO 17 | UART2 TX" },
  { label: "D5",   gpio: 5,      strapping: true,                  desc: "GPIO 5 | SPI SS — boot strapping" },
  { label: "D18",  gpio: 18,                                       desc: "GPIO 18 | SPI CLK" },
  { label: "D19",  gpio: 19,                                       desc: "GPIO 19 | SPI MISO" },
  { label: "D21",  gpio: 21,                                       desc: "GPIO 21 | I2C SDA" },
  { label: "RX0",  gpio: 3,      uart: true,                       desc: "GPIO 3 | UART0 RX — USB serial" },
  { label: "TX0",  gpio: 1,      uart: true,                       desc: "GPIO 1 | UART0 TX — USB serial" },
  { label: "D22",  gpio: 22,                                       desc: "GPIO 22 | I2C SCL" },
  { label: "D23",  gpio: 23,                                       desc: "GPIO 23 | SPI MOSI" },
];

/**
 * Flat list for legacy code that iterates all pins.
 * top side = "top", bottom side = "bottom".
 */
export const ESP32_PIN_LAYOUT = [
  ...ESP32_TOP_PINS.map((p, i) => ({ ...p, side: "top", sideIndex: i })),
  ...ESP32_BOTTOM_PINS.map((p, i) => ({ ...p, side: "bottom", sideIndex: i })),
];

/**
 * Function-based color scheme for ESP32 pins.
 */
export const ESP32_PIN_COLORS = {
  adc1:       "#10b981",  // emerald — ADC1 (WiFi-safe)
  adc2:       "#f59e0b",  // amber — ADC2 (disabled when WiFi active)
  dac:        "#8b5cf6",  // violet — true analog out
  touch:      "#06b6d4",  // cyan — capacitive touch
  spi:        "#3b82f6",  // blue — SPI bus
  i2c:        "#ec4899",  // pink — I2C bus
  uart:       "#f97316",  // orange — serial
  strapping:  "#ef4444",  // red — boot-critical
  inputOnly:  "#6b7280",  // gray — input-only (no output driver)
  general:    "#22d3ee",  // light cyan — general GPIO
  power:      "#fbbf24",  // gold — power/ground
};

/**
 * Get the dominant color for a pin based on its most important function.
 */
export function getESP32PinColor(pin) {
  if (pin.power)             return ESP32_PIN_COLORS.power;
  if (pin.special === "reset") return ESP32_PIN_COLORS.power;
  if (pin.inputOnly)         return ESP32_PIN_COLORS.inputOnly;
  if (pin.strapping)         return ESP32_PIN_COLORS.strapping;
  if (pin.dac)               return ESP32_PIN_COLORS.dac;
  if (pin.touch)             return ESP32_PIN_COLORS.touch;
  if (pin.uart)              return ESP32_PIN_COLORS.uart;
  if (pin.label === "D21" || pin.label === "D22") return ESP32_PIN_COLORS.i2c;
  if (pin.label === "D18" || pin.label === "D19" || pin.label === "D23" || pin.label === "D5")
    return ESP32_PIN_COLORS.spi;
  return ESP32_PIN_COLORS.general;
}
