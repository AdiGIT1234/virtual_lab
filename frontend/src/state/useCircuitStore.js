import { create } from "zustand";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";

const LED_COLORS = {
  LED_RED: "#ff5b5b",
  LED_GREEN: "#5bff95",
  LED_YELLOW: "#f6d96b",
  LED: "#ff5b5b",
};

const cloneWorkspace = (items = []) => items.map((item) => ({
  ...item,
  pins: item.pins ? { ...item.pins } : undefined,
}));

const deriveComponents = (workspaceItems = []) => {
  return workspaceItems
    .filter((item) => ["LED_RED", "LED_GREEN", "LED_YELLOW", "LED", "RESISTOR", "BUTTON", "RGB_LED"].includes(item.type))
    .map((item, index) => {
      const pin = item.pins?.main ?? item.pin ?? null;
      const componentType = item.type.startsWith("LED") ? "LED" : item.type;
      const base = {
        id: item.id,
        type: componentType,
        pin,
        metadata: {
          color: LED_COLORS[item.type] || LED_COLORS["LED"],
          index,
        },
      };

      if (item.type === "RGB_LED") {
        return {
          ...base,
          pins: { r: item.pins?.r ?? null, g: item.pins?.g ?? null, b: item.pins?.b ?? null },
          metadata: { ...base.metadata, color: undefined },
        };
      }

      return base;
    });
};

const defaultPreset = CIRCUIT_PRESETS.blink;
const defaultWorkspace = cloneWorkspace(defaultPreset.workspace || []);

export const useCircuitStore = create((set, get) => ({
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
    }));
  },
  syncFromWorkspace: (workspaceItems, source = "sandbox") => {
    const cloned = cloneWorkspace(workspaceItems);
    set((state) => ({
      workspaceItems: cloned,
      workspaceVersion: state.workspaceVersion + 1,
      lastUpdatedBy: source,
      components: deriveComponents(cloned),
    }));
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
}));
