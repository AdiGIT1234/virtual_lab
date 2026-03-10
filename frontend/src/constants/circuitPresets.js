export const CIRCUIT_PRESETS = {
  blink: {
    id: "blink",
    name: "Blink LED",
    description: "Classic Arduino Uno blink on digital pin 13 with series resistor.",
    workspace: [
      {
        id: "led-1",
        type: "LED_RED",
        pin: 13,
        pins: { main: 13 },
        x: 220,
        y: 260,
      },
      {
        id: "res-1",
        type: "RESISTOR",
        pin: 13,
        pins: { main: 13 },
        resistance: 330,
        x: 140,
        y: 260,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 80,
        y: 360,
      },
      {
        id: "vcc-1",
        type: "VCC_NODE",
        pin: 19,
        pins: { main: 19 },
        x: 80,
        y: 200,
      },
    ],
    outputs: {
      13: 1,
    },
  },
};
