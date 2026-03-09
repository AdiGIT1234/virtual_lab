import { PIN_LAYOUT } from "./pinLayout";

const PORT_COLORS = {
  B: "#4da6ff",
  C: "#66ff99",
  D: "#ff6666",
};

export const MCUS = [
  {
    id: "atmega328p",
    name: "ATmega328P",
    package: "DIP-28",
    description: "Arduino Uno classic with 32KB Flash and tri-port GPIO.",
    supported: true,
    portColors: PORT_COLORS,
    pinLayout: PIN_LAYOUT,
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
  },
  {
    id: "esp32s3",
    name: "ESP32-S3",
    package: "QFN-48",
    description: "Dual-core Xtensa with Wi-Fi/BLE for future labs.",
    supported: false,
    portColors: {
      GPIO: "#10b981",
    },
    pinLayout: null,
  },
];

export const MCU_MAP = MCUS.reduce((acc, mcu) => {
  acc[mcu.id] = mcu;
  return acc;
}, {});

export const DEFAULT_MCU_ID = MCUS[0].id;
