import { PIN_LAYOUT } from "./pinLayout";
import { ESP32_PIN_LAYOUT, ESP32_PIN_COLORS } from "./esp32PinLayout";

const PORT_COLORS = {
  B: "#4da6ff",
  C: "#66ff99",
  D: "#ff6666",
};

export const MCUS = [
  {
    id: "atmega328p",
    name: "Arduino Uno",
    package: "DIP-28",
    description: "Classic 8-bit AVR MCU powering the Arduino Uno. 32KB Flash, 14 digital I/O pins.",
    supported: true,
    portColors: PORT_COLORS,
    pinLayout: PIN_LAYOUT,
    docSlug: "wokwi-arduino-uno",
    wokwiTag: "wokwi-arduino-uno",
    voltage: 5,
    adcBits: 10,
    features: [
      "14 digital I/O (6 PWM)",
      "6 analog inputs",
      "16 MHz clock / 5V logic",
    ],
  },
  {
    id: "esp32",
    name: "ESP32",
    package: "Module-30",
    description: "Dual-core Xtensa with Wi-Fi/BLE, 520KB SRAM, 3.3V logic.",
    supported: true,
    portColors: ESP32_PIN_COLORS,
    pinLayout: ESP32_PIN_LAYOUT,
    docSlug: "wokwi-esp32-devkit-v1",
    wokwiTag: "wokwi-esp32-devkit-v1",
    voltage: 3.3,
    adcBits: 12,
    chipStyle: "module",  // wider module shape vs DIP
    features: [
      "Dual-core 240 MHz Wi-Fi + BLE",
      "16-ch LEDC PWM / 2 DAC / 10 Touch",
      "18 ADC inputs (12-bit) / 3.3V logic",
    ],
  },
  {
    id: "atmega2560",
    name: "ATmega2560",
    package: "TQFP-100",
    description: "Mega-class MCU with 256KB Flash and 54 digital pins.",
    supported: false,
    portColors: {
      A: "#22d3ee",
      B: "#818cf8",
      C: "#f97316",
      D: "#f472b6",
      E: "#facc15",
    },
    pinLayout: null,
    docSlug: "wokwi-arduino-mega",
    wokwiTag: "wokwi-arduino-mega",
    voltage: 5,
    adcBits: 10,
    features: [
      "54 digital I/O (15 PWM)",
      "16 analog inputs (A0-A15)",
      "4 UART, I2C, SPI buses",
    ],
  },
];

export const MCU_MAP = MCUS.reduce((acc, mcu) => {
  acc[mcu.id] = mcu;
  return acc;
}, {});

export const DEFAULT_MCU_ID = MCUS[0].id;
