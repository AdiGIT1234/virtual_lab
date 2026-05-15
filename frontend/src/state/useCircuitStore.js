import { create } from "zustand";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";

const LED_COLORS = {
  LED_RED: "#ff5b5b",
  LED_GREEN: "#5bff95",
  LED_YELLOW: "#f6d96b",
  LED_BLUE: "#5b9fff",
  LED: "#ff5b5b",
};

const cloneWorkspace = (items = []) => items.map((item) => ({
  ...item,
  pins: item.pins ? { ...item.pins } : undefined,
}));

const RENDERABLE_TYPES = new Set([
  // Basic passives / actives
  "LED", "LED_RED", "LED_GREEN", "LED_YELLOW", "LED_BLUE", "RGB_LED",
  "RESISTOR", "BUTTON", "SERVO", "SEVEN_SEG",
  "CAPACITOR", "NPN_TRANSISTOR", "PNP_TRANSISTOR",
  "TIMER_555", "SHIFT_REGISTER", "CUSTOM_DIGITAL_IC", "WASM_IC",
  "BUZZER",
  // Power / utility markers
  "GROUND_NODE", "VCC_NODE",
  // Power / Connectors
  "AA_BATTERY", "BENCH_PSU", "BUCK_CONVERTER", "LM7805_REG",
  "FUNCTION_GENERATOR", "USB_CONNECTOR", "BARREL_JACK",
  "SCREW_TERMINAL_2", "SCREW_TERMINAL_3",
  // Displays
  "OLED_SSD1306", "ILI9341_TFT",
  "LCD1602", "LCD2004", "EPAPER_BASIC",
  "LED_MATRIX", "LED_BAR_GRAPH",
  "NEOPIXEL_RING", "NEOPIXEL_RING_12", "NEOPIXEL_RING_16", "NEOPIXEL_RING_24",
  "NEOPIXEL_MATRIX", "NEOPIXEL_PIXEL",
  // Sensors
  "DHT22",
  "DIAL", "POTENTIOMETER",
  "MAX30102", "MAX30102_PULSE", "PULSE_SENSOR",
  "TCS34725", "TCS34725_COLOR", "COLOR_SENSOR",
  "NTC_SENSOR", "PHOTORESISTOR", "PIR_SENSOR", "MPU6050",
  "HC_SR04", "FLAME_SENSOR", "GAS_SENSOR", "HEARTBEAT_SENSOR",
  "SOUND_SENSOR", "HX711_LOAD_CELL", "HX711_MODULE",
  "RAIN_SENSOR", "TTP223_TOUCH", "SW420_VIBRATION",
  // Input / Control
  "ROTARY_ENCODER", "ANALOG_JOYSTICK", "DIP_SWITCH_8", "SLIDE_SWITCH",
  "MEMBRANE_KEYPAD", "IR_RECEIVER", "IR_REMOTE",
  // Motors
  "DC_MOTOR", "L298N_DRIVER", "STEPPER_MOTOR", "RELAY_MODULE",
  // Comms / Memory
  "HC05_BLUETOOTH", "BLUETOOTH_MODULE",
  "RC522_RFID", "RFID_MODULE",
  "DS1307_RTC", "MICROSD_MODULE",
  // Logic / Analog ICs
  "LOGIC_AND", "LOGIC_OR", "LOGIC_NOT", "LOGIC_NAND", "LOGIC_NOR", "LOGIC_XOR", "LOGIC_DFLIPFLOP",
  "NMOSFET", "PMOSFET", "OPTOCOUPLER",
]);

// Only the LED color variants map to the generic "LED" renderer
const LED_COLOR_VARIANTS = new Set(["LED", "LED_RED", "LED_GREEN", "LED_YELLOW", "LED_BLUE"]);

const deriveComponents = (workspaceItems = []) => {
  return workspaceItems
    .filter((item) => RENDERABLE_TYPES.has(item.type))
    .map((item, index) => {
      const pin = item.pins?.main ?? item.pin ?? null;
      const componentType = LED_COLOR_VARIANTS.has(item.type) ? "LED" : item.type;
      const base = {
        id: item.id,
        type: componentType,
        pin,
        pins: item.pins ? { ...item.pins } : undefined,
        metadata: {
          color: LED_COLORS[item.type] || LED_COLORS["LED"],
          index,
          ...(item.metadata || {}),
        },
        resistance: item.resistance,
        x: item.x,
        y: item.y,
      };

      if (item.type === "RGB_LED") {
        return {
          ...base,
          pins: { r: item.pins?.r ?? null, g: item.pins?.g ?? null, b: item.pins?.b ?? null },
          metadata: { ...base.metadata, color: undefined },
        };
      }

      return { ...base, manuallyPlaced: item.manuallyPlaced || false };
    });
};

const defaultPreset = CIRCUIT_PRESETS.blink;
const defaultWorkspace = cloneWorkspace(defaultPreset.workspace || []);

export const useCircuitStore = create((set) => ({
  presetId: defaultPreset.id,
  presetMeta: { name: defaultPreset.name, description: defaultPreset.description },
  workspaceItems: defaultWorkspace,
  workspaceVersion: 0,
  lastUpdatedBy: null,
  components: deriveComponents(defaultWorkspace),
  outputs: { ...(defaultPreset.outputs || {}) },
  inputs: { ...(defaultPreset.inputs || {}) },
  inputsVersion: 0,
  lastInputsSource: null,
  // Wires drawn in the 2D sandbox — synced here so the 3D lab can read them
  sandboxWires: [],
  // Stable breadboard column assignments for sandbox components (id → col number)
  sandboxColMap: {},
  syncWires: (wires) => set(() => ({ sandboxWires: wires })),
  enterSandboxMode: () => set((state) => {
    // Assign a fixed breadboard column to every current component.
    // These won't change as components are added/removed later.
    const colMap = {};
    let col = 3;
    state.components.forEach((c) => {
      colMap[c.id] = col;
      col += 4;
    });
    return {
      presetId: '__sandbox__',
      presetMeta: { name: 'Custom Circuit', description: 'Your sandbox circuit in 3D' },
      sandboxColMap: colMap,
    };
  }),
  loadPreset: (presetId) => {
    const preset = CIRCUIT_PRESETS[presetId] || defaultPreset;
    const workspaceItems = cloneWorkspace(preset.workspace || []);
    const nextInputs = { ...(preset.inputs || {}) };
    set((state) => ({
      presetId: preset.id,
      presetMeta: { name: preset.name, description: preset.description },
      workspaceItems,
      workspaceVersion: state.workspaceVersion + 1,
      lastUpdatedBy: "arlab",
      components: deriveComponents(workspaceItems),
      outputs: { ...(preset.outputs || {}) },
      inputs: nextInputs,
      inputsVersion: state.inputsVersion + 1,
      lastInputsSource: "arlab",
      sandboxWires: [], // clear sandbox wires so 3D lab shows preset wires on fresh load
    }));
  },
  syncFromWorkspace: (workspaceItems, source = "sandbox") => {
    const cloned = cloneWorkspace(workspaceItems);
    set((state) => {
      let sandboxColMap = state.sandboxColMap;
      if (state.presetId === '__sandbox__') {
        const usedCols = new Set(Object.values(sandboxColMap));
        const nextFreeCol = () => {
          let c = 3;
          while (usedCols.has(c)) c += 4;
          usedCols.add(c);
          return c;
        };
        const derived = deriveComponents(cloned);
        derived.forEach((comp) => {
          if (sandboxColMap[comp.id] == null) {
            sandboxColMap = { ...sandboxColMap, [comp.id]: nextFreeCol() };
          }
        });
      }
      return {
        workspaceItems: cloned,
        workspaceVersion: state.workspaceVersion + 1,
        lastUpdatedBy: source,
        components: deriveComponents(cloned),
        sandboxColMap,
      };
    });
  },
  setOutputLevel: (pin, value) => {
    set((state) => ({
      outputs: { ...state.outputs, [pin]: Math.max(0, Math.min(1, value)) },
    }));
  },
  setOutputsFromRegisters: (registers) => {
    if (!registers) return;
    set(() => {
      const pwm = registers.PWM || [];

      // ESP32: flat GPIO model
      if (registers.GPIO_OUT) {
        const gpioOut = registers.GPIO_OUT;
        const outputs = {};
        for (let pin = 0; pin < gpioOut.length; pin++) {
          const pwmVal = pwm[pin];
          if (typeof pwmVal === "number" && pwmVal > 0 && pwmVal < 255) {
            outputs[pin] = Math.max(0, Math.min(1, pwmVal / 255));
          } else if (pwmVal === 255) {
            outputs[pin] = 1;
          } else {
            outputs[pin] = gpioOut[pin] ? 1 : 0;
          }
        }
        return { outputs };
      }

      // ATmega328P: port-based model
      const portB = registers.PORTB || [];
      const portC = registers.PORTC || [];
      const portD = registers.PORTD || [];

      const toLevel = (pin, digitalVal) => {
        const pwmVal = pwm[pin];
        if (typeof pwmVal === "number" && pwmVal > 0 && pwmVal < 255) {
          return Math.max(0, Math.min(1, pwmVal / 255));
        }
        if (pwmVal === 255) return 1;
        if (pwmVal === 0 && digitalVal == null) return 0;
        return digitalVal ? 1 : 0;
      };

      const outputs = {};
      for (let pin = 0; pin <= 7; pin += 1) {
        outputs[pin] = toLevel(pin, portD[pin]);
      }
      for (let pin = 8; pin <= 13; pin += 1) {
        const idx = pin - 8;
        outputs[pin] = toLevel(pin, portB[idx]);
      }
      for (let pin = 14; pin <= 19; pin += 1) {
        const idx = pin - 14;
        outputs[pin] = toLevel(pin, portC[idx]);
      }

      return { outputs };
    });
  },
  syncInputs: (inputs, source = "sandbox") => {
    set((state) => ({
      inputs: { ...inputs },
      inputsVersion: state.inputsVersion + 1,
      lastInputsSource: source,
    }));
  },
  toggleInputPin: (pin, source = "arlab") => {
    set((state) => {
      const next = { ...state.inputs };
      const current = next[pin] ?? 0;
      if (current) {
        delete next[pin];
      } else {
        next[pin] = 1;
      }
      return {
        inputs: next,
        inputsVersion: state.inputsVersion + 1,
        lastInputsSource: source,
      };
    });
  },
  updateComponent: (id, updates, source = "arlab") => {
    set((state) => {
      const nextItems = state.workspaceItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      return {
        workspaceItems: nextItems,
        workspaceVersion: state.workspaceVersion + 1,
        lastUpdatedBy: source,
        components: deriveComponents(nextItems),
      };
    });
  },
  addComponent: (component, source = "arlab") => {
    set((state) => {
      const nextItems = [...state.workspaceItems, component];
      return {
        workspaceItems: nextItems,
        workspaceVersion: state.workspaceVersion + 1,
        lastUpdatedBy: source,
        components: deriveComponents(nextItems),
      };
    });
  },
  removeComponent: (id, source = "arlab") => {
    set((state) => {
      const nextItems = state.workspaceItems.filter((item) => item.id !== id);
      return {
        workspaceItems: nextItems,
        workspaceVersion: state.workspaceVersion + 1,
        lastUpdatedBy: source,
        components: deriveComponents(nextItems),
      };
    });
  },
}));
