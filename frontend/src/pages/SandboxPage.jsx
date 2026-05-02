import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EditorPanel from "../components/EditorPanel";
import Chip from "../components/Chip";
import SimulationControls from "../components/SimulationControls";
import LogicAnalyzer from "../components/LogicAnalyzer";
import SerialMonitor from "../components/SerialMonitor";
import ExternalLED from "../components/ExternalLED";
import Resistor from "../components/Resistor";
import Capacitor from "../components/Capacitor";
import NPNTransistor from "../components/NPNTransistor";
import PNPTransistor from "../components/PNPTransistor";
import Timer555 from "../components/Timer555";
import PushButton from "../components/PushButton";
import Dial from "../components/Dial";
import SlidePotentiometer from "../components/SlidePotentiometer";
import Multimeter from "../components/Multimeter";
import RGB_LED from "../components/RGB_LED";
import Servo from "../components/Servo";
import SevenSegment from "../components/SevenSegment";
import DraggableWrapper from "../components/DraggableWrapper";
import { LIBRARY_COMPONENTS_MAP, LIBRARY_TERMINAL_LAYOUTS } from "../constants/LibraryComponentLayouts";
import WiringCanvas from "../components/WiringCanvas";
import HardwareConfigPanel from "../components/HardwareConfigPanel";
import ChatbotWidget from "../components/ChatbotWidget";
import GpioView from "../components/GpioView";
import GroundNode from "../components/GroundNode";
import VccNode from "../components/VccNode";
import ExecutionInspector from "../components/ExecutionInspector";
import MemoryViewer from "../components/MemoryViewer";
import ExecutionTrace from "../components/ExecutionTrace";
import ComponentCatalogPanel from "../components/ComponentCatalogPanel";
import ComponentPlaceholder from "../components/ComponentPlaceholder";
import McuPreviewPanel from "../components/McuPreviewPanel";
import ARLabCanvas from "../components/arlab/ARLabCanvas";
import SandboxErrorBoundary from "../components/SandboxErrorBoundary";
import HardwarePreview from "../components/HardwarePreview";
import { useAVR } from "../engine/useAVR";
import { useESP32 } from "../engine/useESP32";
import { MCUS, MCU_MAP, DEFAULT_MCU_ID } from "../constants/mcus";
import { COMPONENT_CATEGORIES, COMPONENT_TYPE_MAP, SUPPORTED_COMPONENTS } from "../constants/componentCatalog";
import { useTheme } from "../context/useTheme";
import useMediaQuery from "../hooks/useMediaQuery";
import { API_BASE_URL } from "../lib/api";
import { useCircuitStore } from "../state/useCircuitStore";
import { useAuth } from "../context/useAuth";
import ProtectedFeature from "../components/ProtectedFeature";
import { CIRCUIT_PRESETS } from "../constants/circuitPresets";
import { EXPERIMENT_PRESETS } from "../constants/experimentPresets";

const WORKSPACE_STORAGE_KEY = "vlab_workspace_v1";

const normalizeTerminals = (terminals = []) => {
  if (!terminals || terminals.length === 0) {
    return [{ id: "main", label: "PIN" }];
  }
  return terminals.map((terminal) => (
    typeof terminal === "string"
      ? { id: terminal, label: terminal.toUpperCase() }
      : terminal
  ));
};

export default function SandboxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { saveExperiment } = useAuth();
  const isCompact = useMediaQuery("(max-width: 1200px)");

  const [selectedMcuId, setSelectedMcuId] = useState(DEFAULT_MCU_ID);
  const selectedMcu = MCU_MAP[selectedMcuId];
  const isMcuSupported = selectedMcu?.supported;
  const isESP32 = selectedMcuId === "esp32";

  const [code, setCode] = useState(`void setup() {
}

void loop() {
}`);

  // Both hooks are called unconditionally (React rules), active one selected by MCU
  const avr = useAVR(selectedMcuId);
  const esp32 = useESP32(selectedMcuId);
  const activeEngine = isESP32 ? esp32 : avr;

  const {
    startSimulation,
    stopSimulation,
    isRunning,
    cpuState,
    liveTimeline,
    speedMultiplier,
    setSpeedMultiplier,
    setBreakpoints: syncBreakpoints,
    setBreakpointHandler,
  } = activeEngine;

  // Stop BOTH engines when the user switches MCU to prevent orphaned rAF loops
  useEffect(() => {
    avr.stopSimulation();
    esp32.stopSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMcuId]);

  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hexOutput, setHexOutput] = useState("");
  const [hexError, setHexError] = useState("");

  const [wires, setWires] = useState([]);
  const [selectedWireId, setSelectedWireId] = useState(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("waveforms");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  const [activeWire, setActiveWire] = useState(null);
  const activeWireRef = useRef(null);
  const workplaneRef = useRef(null);

  const [wireColors, setWireColors] = useState({});
  const storedWorkspaceItems = useCircuitStore((state) => state.workspaceItems);
  const workspaceVersion = useCircuitStore((state) => state.workspaceVersion);
  const lastUpdatedBy = useCircuitStore((state) => state.lastUpdatedBy);
  const syncFromWorkspace = useCircuitStore((state) => state.syncFromWorkspace);
  const setOutputsFromRegisters = useCircuitStore((state) => state.setOutputsFromRegisters);
  const storeOutputs = useCircuitStore((state) => state.outputs);
  const storeInputs = useCircuitStore((state) => state.inputs);
  const inputsVersion = useCircuitStore((state) => state.inputsVersion);
  const inputsSource = useCircuitStore((state) => state.lastInputsSource);
  const syncInputs = useCircuitStore((state) => state.syncInputs);
  const loadPreset = useCircuitStore((state) => state.loadPreset);

  const defaultWorkspace = useMemo(() => [], []);

  const [workspaceItems, internalSetWorkspaceItems] = useState(() => defaultWorkspace);
  const [experimentLoaded, setExperimentLoaded] = useState(null);

  const setWorkspaceItems = useCallback((updater, source = "sandbox") => {
    internalSetWorkspaceItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      queueMicrotask(() => {
        syncFromWorkspace(next, source);
      });
      return next;
    });
  }, [syncFromWorkspace]);

  useEffect(() => {
    if (lastUpdatedBy && lastUpdatedBy !== "sandbox" && storedWorkspaceItems) {
      internalSetWorkspaceItems(storedWorkspaceItems);
    }
  }, [workspaceVersion, lastUpdatedBy, storedWorkspaceItems]);

  // Auto-load experiment preset from URL query param
  useEffect(() => {
    const expId = searchParams.get("experiment");
    if (expId && expId !== experimentLoaded && EXPERIMENT_PRESETS[expId]) {
      const preset = EXPERIMENT_PRESETS[expId];
      setExperimentLoaded(expId);
      // Load workspace components
      if (preset.workspace) {
        setWorkspaceItems(preset.workspace, "experiment");
      }
      // Load starter code
      if (preset.code) {
        setCode(preset.code);
      }
      // Open the code editor so they can see the pre-loaded code
      setIsEditorOpen(true);
    }
  }, [searchParams, experimentLoaded, setWorkspaceItems]);

  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const panSessionRef = useRef(null);
  const [chipTransform, setChipTransform] = useState({ x: 60, y: 80, scale: 0.9 });
  const chipDragDataRef = useRef(null);
  const [isChipDragging, setIsChipDragging] = useState(false);

  const [inputs, setInputsState] = useState(storeInputs || {});
  const setInputs = useCallback((updater, source = "sandbox") => {
    setInputsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      queueMicrotask(() => {
        syncInputs(next, source);
      });
      return next;
    });
  }, [syncInputs]);

  useEffect(() => {
    if (inputsSource && inputsSource !== "sandbox") {
      setInputsState(storeInputs || {});
    }
  }, [inputsVersion, inputsSource, storeInputs]);
  const [manualRegisters, setManualRegisters] = useState({
    DDRB: Array(8).fill(0),
    DDRC: Array(8).fill(0),
    DDRD: Array(8).fill(0),
    PORTB: Array(8).fill(0),
    PORTC: Array(8).fill(0),
    PORTD: Array(8).fill(0),
    PINB: Array(8).fill(0),
    PINC: Array(8).fill(0),
    PIND: Array(8).fill(0),
    PWM: Array(20).fill(0),
    // Timer 0
    TCCR0A: Array(8).fill(0),
    TCCR0B: Array(8).fill(0),
    OCR0A: 0,
    OCR0B: 0,
    // Timer 1
    TCCR1A: Array(8).fill(0),
    TCCR1B: Array(8).fill(0),
    OCR1A: 0,
    OCR1B: 0,
    ICR1: 0,
    // Timer 2
    TCCR2A: Array(8).fill(0),
    TCCR2B: Array(8).fill(0),
    OCR2A: 0,
    // Interrupts & Sleep
    EICRA: Array(8).fill(0),
    EIMSK: Array(8).fill(0),
    PCICR: Array(8).fill(0),
    SMCR: Array(8).fill(0),
    SREG_I: 0,
    WDTCSR_WDE: 0,
  });
  const manualMemoryRef = useRef(new Array(256).fill(0));

  const [breakpoints, setBreakpoints] = useState([]);
  const [breakpointHit, setBreakpointHit] = useState(null);

  const currentRegisters = useMemo(() => {
    if (isRunning && cpuState?.registers) {
      return cpuState.registers;
    }
    if (timeline.length > 0) {
      const step = Math.min(Math.max(0, currentStep), timeline.length - 1);
      return timeline[step]?.registers || manualRegisters;
    }
    return manualRegisters;
  }, [isRunning, cpuState, timeline, currentStep, manualRegisters]);

  const currentPC = isRunning
    ? cpuState?.pc ?? null
    : timeline[currentStep]?.pc ?? null;

  const currentMemory = cpuState?.memory || manualMemoryRef.current;

  const liveMode = isRunning && liveTimeline.length > 0;

  useEffect(() => {
    const registersSource = currentRegisters || manualRegisters;
    if (!registersSource) return;
    setOutputsFromRegisters(registersSource);
  }, [currentRegisters, manualRegisters, setOutputsFromRegisters]);

  useEffect(() => {
    syncBreakpoints(breakpoints);
  }, [breakpoints, syncBreakpoints]);

  useEffect(() => {
    setBreakpointHandler((pc) => setBreakpointHit(pc));
    return () => setBreakpointHandler(null);
  }, [setBreakpointHandler]);

  const runCode = async () => {
    if (!isMcuSupported) {
      setHexError(`${selectedMcu?.name || "MCU"} simulation is coming soon.`);
      return;
    }

    try {
      setHexError("");

      if (isESP32) {
        // ESP32: quantum JS runtime (handles backend fallback internally)
        setTimeline([]);
        setIsAnalyzerOpen(true);
        setIsPlaying(true);
        await startSimulation(code, manualRegisters, inputs, code);
      } else {
        // Arduino Uno: compile to hex + avr8js WASM execution
        const response = await fetch(`${API_BASE_URL}/run-experiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, inputs }),
        });

        const data = await response.json();

        if (data.hex) {
          startSimulation(data.hex, manualRegisters);
          setHexOutput(data.hex);
          setHexError(data.hex_error || "");
          setIsAnalyzerOpen(true);
          setIsPlaying(true);
          setTimeline([]);
          setBreakpointHit(null);
        } else if (data.timeline && data.timeline.length > 0) {
          setTimeline(data.timeline);
          setHexOutput(data.hex || "");
          setHexError(data.hex_error || "");
          setCurrentStep(0);
          setIsPlaying(true);
          setIsAnalyzerOpen(true);
        } else {
          setTimeline([]);
        }
      }
    } catch (e) {
      console.error("Simulation failed:", e);
      setHexError("Simulation failed — check backend logs.");
    }
  };

  const addComponent = (type, componentMeta) => {
    if (!type) return;
    const catalogMeta = COMPONENT_TYPE_MAP[type] || componentMeta;
    const normalizedTerms = catalogMeta?.terminals ? normalizeTerminals(catalogMeta.terminals) : null;

    let pins = { main: "" };
    if (type === "RGB_LED") pins = { r: "", g: "", b: "" };
    if (type === "SEVEN_SEG") pins = { a: "", b: "", c: "", d: "", e: "", f: "", g: "" };
    if (type === "RESISTOR") pins = { t1: "", t2: "" };
    if (type === "CAPACITOR") pins = { t1: "", t2: "" };
    if (type === "NPN_TRANSISTOR") pins = { e: "", b: "", c: "" };
    if (type === "PNP_TRANSISTOR") pins = { e: "", b: "", c: "" };
    if (type === "TIMER_555") pins = { gnd: "", trig: "", out: "", reset: "", ctrl: "", thres: "", disch: "", vcc: "" };
    if (type === "MULTIMETER") pins = { v: "", a: "", r: "", com: "" };
    if (type === "WIRE_NODE") pins = { main: "" };
    const explicitTypes = ["RGB_LED", "SEVEN_SEG", "RESISTOR", "CAPACITOR", "NPN_TRANSISTOR", "PNP_TRANSISTOR", "TIMER_555", "MULTIMETER", "WIRE_NODE"];
    if (!explicitTypes.includes(type) && normalizedTerms) {
      pins = normalizedTerms.reduce((acc, terminal) => {
        acc[terminal.id] = "";
        return acc;
      }, {});
    }

    const newItem = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      pins,
      x: 80 + Math.random() * 50,
      y: 150 + Math.random() * 100,
      scale: 1,
      ...(type === "RESISTOR"   ? { resistance: 330, resMultiplier: 1 } : {}),
      ...(type === "CAPACITOR"  ? { capacitance: 10, capUnit: "μF" } : {}),
      ...(type === "VCC_NODE"   ? { value: 5 } : {}),
      ...(type === "SLIDE_POT" ? { value: 512 } : {}),
      ...(type === "DIAL"      ? { value: 0 } : {}),
          metadata: catalogMeta
        ? {
            label: catalogMeta.label,
            status: catalogMeta.status,
            category: catalogMeta.category,
            description: catalogMeta.description,
            summary: catalogMeta.summary,
            wokwiTag: catalogMeta.wokwiTag,
            docSlug: catalogMeta.docSlug,
            imageUrl: catalogMeta.imageUrl,
            datasheet: catalogMeta.datasheet,
          }
        : undefined,
    };
    setWorkspaceItems((prev) => [...prev, newItem]);
  };

  const updateComponentSettings = (id, updates) => {
    setWorkspaceItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleComponentPinEffect = useCallback((item, prevPin, nextPin) => {
    if (!item) return;
    if (item.type === "GROUND_NODE" || item.type === "VCC_NODE") {
      setInputs((prev) => {
        const updated = { ...prev };
        // Clean up previous MCU pin if it was direct
        if (prevPin != null && !String(prevPin).includes("::")) delete updated[prevPin];
        // Set new MCU pin if it's direct
        if (nextPin != null && !String(nextPin).includes("::")) {
           updated[nextPin] = item.type === "GROUND_NODE" ? 0 : 1;
        }
        return updated;
      });
    }
  }, [setInputs]);

  const updateComponentPin = useCallback((id, terminalId, newPin) => {
    setWorkspaceItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const pinInt = newPin == null || newPin === "" ? null : parseInt(newPin, 10);
      const prevPinValue = (item.pins && item.pins[terminalId]) ?? item.pin ?? null;
      const newPins = { ...(item.pins || { main: item.pin }) };
      newPins[terminalId] = pinInt;
      const updatedItem = { ...item, pins: newPins, pin: terminalId === "main" ? pinInt : item.pin };
      
      queueMicrotask(() => {
         handleComponentPinEffect(updatedItem, prevPinValue, pinInt);
      });
      return updatedItem;
    }));
  }, [handleComponentPinEffect, setWorkspaceItems]);

  const deleteComponent = (id) => {
    setWorkspaceItems((prev) => {
      // Remove all wires touching this component
      setWires(currentWires => currentWires.filter(w => !w.source.startsWith(`${id}::`) && !w.target?.startsWith(`${id}::`)));

      const target = prev.find((item) => item.id === id);
      if (target && (target.type === "GROUND_NODE" || target.type === "VCC_NODE")) {
        // Evaluate if cleanup needed for mcu direct hooks, largely obsolete under new wire arrays but safe keeping
        setInputs((prevInputs) => {
          const updated = { ...prevInputs };
          return updated;
        });
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleItemPositionChange = (id, pos) => {
    setWorkspaceItems((prev) => prev.map((item) => (item.id === id ? { ...item, x: pos.x, y: pos.y } : item)));
  };

  const handleItemScaleChange = (id, newScale) => {
    setWorkspaceItems((prev) => prev.map((item) => (item.id === id ? { ...item, scale: newScale } : item)));
  };
  // ------ WIRING SYSTEM ------
  const startWire = (sourceId, termId, startX, startY) => {
    const sourceStr = termId ? `${sourceId}::${termId}` : sourceId;
    const newWire = { source: sourceStr, bends: [], startX, startY, currentX: startX, currentY: startY };
    setActiveWire(newWire);
    activeWireRef.current = newWire;
  };

  useEffect(() => {
    window.onStartWire = startWire;
    window.getActiveWire = () => activeWireRef.current;
    window.onCompleteWire = (pin) => {
      if (activeWireRef.current && pin != null) {
        completeActiveWire(`mcu::${pin}`);
      }
    };
    window.onCompleteComponentWire = (targetId, targetTermId) => {
      if (activeWireRef.current) {
        const targetStr = `${targetId}::${targetTermId}`;
        completeActiveWire(targetStr);
      }
    };
    return () => {
      delete window.onStartWire;
      delete window.getActiveWire;
      delete window.onCompleteWire;
      delete window.onCompleteComponentWire;
    };
  }, []);

  const completeActiveWire = (targetStr) => {
     if (!activeWireRef.current) return;
     if (activeWireRef.current.source === targetStr) {
        // If clicking on the same pin, keep drawing
        return;
     }
     const newWire = { 
        id: `wire-${Date.now()}-${Math.random()}`,
        source: activeWireRef.current.source,
        target: targetStr,
        bends: activeWireRef.current.bends || [],
        color: activeWireRef.current.color || "#4dabf7"
     };
     setWires(prev => [...prev.filter(w => !(w.source === newWire.source && w.target === newWire.target)), newWire]);
     setActiveWire(null);
     activeWireRef.current = null;
  };



  const handleWireDelete = useCallback((wireId) => {
    if (!wireId) return;
    setWires(prev => prev.filter(w => w.id !== wireId));
    if (selectedWireId === wireId) setSelectedWireId(null);
    setWireColors((prev) => {
      const updated = { ...prev };
      delete updated[wireId];
      return updated;
    });
  }, [selectedWireId]);

  useEffect(() => {
    window.onAutoConnectWire = (sourceId, termId, targetPinId) => {
      // Prevents overwriting if they explicitly don't want to
      updateComponentPin(sourceId, termId, targetPinId);
    };

    const handleGlobalMouseUp = () => {
       setTimeout(() => {
         if (activeWireRef.current) {
           setActiveWire(null);
           activeWireRef.current = null;
         }
       }, 50);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activeWireRef.current) {
        setActiveWire(null);
        activeWireRef.current = null;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedWireId) {
        // Don't delete if user is typing in an input
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
        handleWireDelete(selectedWireId);
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (activeWireRef.current) {
        const nextWire = {
          ...activeWireRef.current,
          currentX: e.clientX,
          currentY: e.clientY,
        };
        setActiveWire(nextWire);
        activeWireRef.current = nextWire;
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [updateComponentPin, selectedWireId, handleWireDelete]);

  const toggleInput = (pin) => {
    if (pin == null) return;
    setInputs((prev) => ({
      ...prev,
      [pin]: prev[pin] ? 0 : 1,
    }));
  };

  const handleInputChange = (pin, value) => {
    if (pin == null) return;
    setInputs((prev) => ({
      ...prev,
      [pin]: value ? 1 : 0,
    }));
  };

  const setAnalogInput = (pin, value) => {
    if (pin == null) return;
    setInputs((prev) => ({
      ...prev,
      [pin]: value,
    }));
  };

  const handleWireColorChange = useCallback((wireId, color) => {
    setWireColors((prev) => ({ ...prev, [wireId]: color }));
    setWires(prev => prev.map(w => w.id === wireId ? { ...w, color } : w));
  }, []);

  const handleWireDetach = (wireId, endType) => {
    if (!wireId) return;
    const wire = wires.find(w => w.id === wireId);
    if (!wire) return;
    
    // Remove wire from fixed arrays
    setWires(prev => prev.filter(w => w.id !== wireId));

    let newActive;
    if (endType === "target") {
       // Started from Source, we are detaching Target
       newActive = { source: wire.source, bends: wire.bends, startX: 0, startY: 0, currentX: 0, currentY: 0, color: wire.color || "#4dabf7" };
    } else {
       // Detaching source, so new active wire starts from old Target, going backwards
       // Bend points reverse
       newActive = { source: wire.target, bends: [...wire.bends].reverse(), startX: 0, startY: 0, currentX: 0, currentY: 0, color: wire.color || "#4dabf7" };
    }

    setActiveWire(newActive);
    activeWireRef.current = newActive;
  };

  const handleToggleBit = (regName, bitIndex) => {
    if (timeline.length > 0) return;
    setManualRegisters((prev) => {
      const newRegs = { ...prev };
      const arr = [...newRegs[regName]];
      arr[bitIndex] = arr[bitIndex] === 1 ? 0 : 1;
      if (regName.startsWith("PORT")) {
        const pinName = "PIN" + regName.charAt(regName.length - 1);
        newRegs[pinName] = [...arr];
      }
      if (regName.startsWith("PIN")) {
        const portName = "PORT" + regName.charAt(regName.length - 1);
        newRegs[portName] = [...arr];
      }
      newRegs[regName] = arr;
      return newRegs;
    });
  };

  const getPinLogic = useCallback((p) => {
    if (p === "" || isNaN(p) || p == null) return false;
    if (currentRegisters?.PWM?.[p] > 0 && currentRegisters?.PWM?.[p] < 255) return "PWM";
    if (isESP32) return currentRegisters?.GPIO_OUT?.[p] === 1;
    if (p <= 7) return currentRegisters?.PORTD?.[p] === 1;
    if (p <= 13) return currentRegisters?.PORTB?.[p - 8] === 1;
    if (p >= 14 && p <= 19) return currentRegisters?.PORTC?.[p - 14] === 1;
    return false;
  }, [currentRegisters, isESP32]);

  const getPinAnalog = (p, totalRes = 0) => {
    if (p === "" || isNaN(p) || p == null) return 0;
    const base = currentRegisters?.PWM?.[p] || (getPinLogic(p) ? 255 : 0);
    if (totalRes === 0) return base;
    const ratio = 330 / Math.max(totalRes, 1);
    const factor = Math.min(1, Math.max(0.1, ratio));
    return Math.floor(base * factor);
  };

  const getResistorFactor = (totalRes) => {
    if (totalRes === 0) return 1;
    const ratio = 330 / Math.max(totalRes, 1);
    return Math.min(1, Math.max(0.1, ratio));
  };

  const GATE_FN_MAP = {
    LOGIC_AND:  (a, b) => a && b,
    LOGIC_OR:   (a, b) => a || b,
    LOGIC_NAND: (a, b) => !(a && b),
    LOGIC_NOR:  (a, b) => !(a || b),
    LOGIC_XOR:  (a, b) => Boolean(a) !== Boolean(b),
    LOGIC_NOT:  (a)    => !a,
  };

  const resolveConnection = useCallback((compId, termId, visited = new Set(), currentResistance = 0) => {
    const key = `${compId}::${termId}`;
    if (visited.has(key)) return { pin: null, resistance: currentResistance };
    visited.add(key);

    const item = workspaceItems.find(i => i.id === compId);
    if (!item) return { pin: null, resistance: currentResistance };

    // VCC / GND short-circuit
    if (item.type === "VCC_NODE") return { pin: null, resistance: currentResistance, logicValue: true };
    if (item.type === "GROUND_NODE") return { pin: null, resistance: currentResistance, logicValue: false };

    // 1. Traverse all wires touching this terminal
    const touchingWires = wires.filter(w => w.source === key || w.target === key);
    for (const wire of touchingWires) {
      const otherEnd = wire.source === key ? wire.target : wire.source;
      if (!otherEnd) continue;
      if (otherEnd.startsWith("mcu::")) {
        return { pin: parseInt(otherEnd.split("::")[1], 10), resistance: currentResistance };
      }
      const [oComp, oTerm] = otherEnd.split("::");
      const result = resolveConnection(oComp, oTerm, visited, currentResistance);
      if (result.pin != null || result.logicValue !== undefined) return result;
    }

    // 2. Cross resistor
    if (item.type === "RESISTOR") {
      const otherTerm = termId === "t1" ? "t2" : "t1";
      const rVal = (item.resistance || 330) * (item.resMultiplier || 1);
      const result = resolveConnection(compId, otherTerm, visited, currentResistance + rVal);
      if (result.pin != null || result.logicValue !== undefined) return result;
    }

    // 3. Logic gate output propagation
    if (termId === "out" && GATE_FN_MAP[item.type]) {
      const ra = resolveConnection(compId, "in1", visited);
      const a = ra.pin != null ? getPinLogic(ra.pin) : (ra.logicValue ?? false);
      if (item.type === "LOGIC_NOT") {
        return { pin: null, resistance: currentResistance, logicValue: GATE_FN_MAP[item.type](!!a) };
      }
      const rb = resolveConnection(compId, "in2", visited);
      const b = rb.pin != null ? getPinLogic(rb.pin) : (rb.logicValue ?? false);
      return { pin: null, resistance: currentResistance, logicValue: GATE_FN_MAP[item.type](!!a, !!b) };
    }
    if (item.type === "LOGIC_DFLIPFLOP" && (termId === "q" || termId === "qn")) {
      const rd = resolveConnection(compId, "d", visited);
      const d = rd.pin != null ? getPinLogic(rd.pin) : (rd.logicValue ?? false);
      return { pin: null, resistance: currentResistance, logicValue: termId === "q" ? !!d : !d };
    }

    // 4. MOSFET switching: D-S conducts when gate threshold met
    if ((item.type === "NMOSFET" || item.type === "PMOSFET") &&
        (termId === "d" || termId === "s")) {
      const gConn = resolveConnection(compId, "g", visited);
      const gateHigh = gConn.pin != null ? !!getPinLogic(gConn.pin) : (gConn.logicValue ?? false);
      const conducting = item.type === "NMOSFET" ? gateHigh : !gateHigh;
      if (conducting) {
        const otherTerm = termId === "d" ? "s" : "d";
        const result = resolveConnection(compId, otherTerm, visited, currentResistance);
        if (result.pin != null || result.logicValue !== undefined) return result;
      }
    }

    // 5. Optocoupler isolation switching: C-E conducts when LED is on
    if (item.type === "OPTOCOUPLER" && (termId === "col" || termId === "emit")) {
      const aConn = resolveConnection(compId, "ano", visited);
      const ledOn = aConn.pin != null ? !!getPinLogic(aConn.pin) : (aConn.logicValue ?? false);
      if (ledOn) {
        const otherTerm = termId === "col" ? "emit" : "col";
        const result = resolveConnection(compId, otherTerm, visited, currentResistance);
        if (result.pin != null || result.logicValue !== undefined) return result;
      }
    }

    return { pin: null, resistance: currentResistance };
  }, [workspaceItems, wires, getPinLogic]);

  const handleSaveWorkspace = async () => {
    const payload = { items: workspaceItems, inputs, wireColors, wires };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    
    // Also save to Supabase if the function exists
    if (saveExperiment) {
      try {
        await saveExperiment({
          experimentId: `sandbox-${selectedMcuId}`,
          title: `Sandbox (${selectedMcuId})`,
          code: code,
          resultJson: payload
        });
        console.log("Workspace saved securely to your account!");
      } catch (err) {
        console.error("Cloud save failed:", err);
      }
    } else {
      console.log("Workspace saved to local storage!");
    }
  };

  const handleLoadWorkspace = () => {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      console.warn("No saved workspace found.");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      // Load Workspace
      setWorkspaceItems(parsed.items || []);
      setInputs(parsed.inputs || {});
      setWireColors(parsed.wireColors || {});
      
      let loadedWires = parsed.wires;
      if (!loadedWires && parsed.items) {
          // Migration from old inferred pins format
          loadedWires = [];
          parsed.items.forEach(item => {
             if (item.pins) {
                Object.entries(item.pins).forEach(([termId, targetStr]) => {
                   if (targetStr != null && targetStr !== "") {
                      loadedWires.push({
                         id: `wire-${Date.now()}-${Math.random()}`,
                         source: `${item.id}::${termId}`,
                         target: typeof targetStr === "string" && targetStr.includes("::") ? targetStr : `mcu::${targetStr}`,
                         bends: [],
                         color: parsed.wireColors?.[`${item.id}::${termId}`] || "#4dabf7"
                      });
                   }
                });
             }
          });
      }
      setWires(loadedWires || []);
      console.log("Workspace loaded successfully!");
    } catch (e) {
      console.warn("Failed to parse workspace JSON", e);
    }
  };

  const handleExportWorkspace = () => {
    const data = JSON.stringify({ items: workspaceItems, inputs, wireColors, wires }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZoom = (direction) => {
    setViewScale((prev) => {
      const next = direction === "in" ? prev + 0.1 : prev - 0.1;
      return Math.min(2, Math.max(0.5, parseFloat(next.toFixed(2))));
    });
  };

  const handleResetView = () => {
    setViewScale(1);
    setViewOffset({ x: 0, y: 0 });
  };

  const handleChipMouseDown = useCallback((e) => {
    if (e.target.closest('[data-chip-node="interactive"]')) return;
    e.preventDefault();
    const rect = workplaneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = (e.clientX - rect.left) / viewScale;
    const pointerY = (e.clientY - rect.top) / viewScale;
    chipDragDataRef.current = {
      offsetX: pointerX - chipTransform.x,
      offsetY: pointerY - chipTransform.y,
    };
    setIsChipDragging(true);
  }, [viewScale, chipTransform.x, chipTransform.y]);

  const handleChipWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = -e.deltaY * 0.0015;
    setChipTransform((prev) => {
      const nextScale = Math.min(2.5, Math.max(0.6, parseFloat((prev.scale + zoomDelta).toFixed(2))));
      return { ...prev, scale: nextScale };
    });
  }, []);

  const resetChipTransform = useCallback(() => {
    setChipTransform({ x: 260, y: 100, scale: 1.2 });
  }, []);

  const handlePanMove = useCallback((e) => {
    if (!panSessionRef.current) return;
    const dx = e.clientX - panSessionRef.current.x;
    const dy = e.clientY - panSessionRef.current.y;
    setViewOffset({
      x: panSessionRef.current.offset.x + dx,
      y: panSessionRef.current.offset.y + dy,
    });
  }, []);

  const handlePanEnd = useCallback(function handlePanEndCallback() {
    panSessionRef.current = null;
    window.removeEventListener("mousemove", handlePanMove);
    window.removeEventListener("mouseup", handlePanEndCallback);
  }, [handlePanMove]);

  const handlePanStart = useCallback((e) => {
    if (panMode) {
      panSessionRef.current = { x: e.clientX, y: e.clientY, offset: { ...viewOffset } };
      window.addEventListener("mousemove", handlePanMove);
      window.addEventListener("mouseup", handlePanEnd);
      return;
    }
    
    // Not panning: if a wire is currently active, we drop a point.
    if (activeWireRef.current) {
      const workspaceNode = document.getElementById("workplane-container");
      if (!workspaceNode) return;
      const workspaceRect = workspaceNode.getBoundingClientRect();
      const rx = (e.clientX - workspaceRect.left) / viewScale;
      const ry = (e.clientY - workspaceRect.top) / viewScale;
      
      setActiveWire((prev) => {
         if (!prev) return null;
         const newWire = { ...prev, bends: [...prev.bends, { x: rx, y: ry }] };
         activeWireRef.current = newWire;
         return newWire;
      });
    }
  }, [panMode, viewOffset, handlePanMove, handlePanEnd, viewScale]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
    };
  }, [handlePanMove, handlePanEnd]);

  useEffect(() => {
    if (!isChipDragging) return;
    const handleMove = (e) => {
      const rect = workplaneRef.current?.getBoundingClientRect();
      if (!rect || !chipDragDataRef.current) return;
      const pointerX = (e.clientX - rect.left) / viewScale;
      const pointerY = (e.clientY - rect.top) / viewScale;
      setChipTransform((prev) => ({
        ...prev,
        x: pointerX - chipDragDataRef.current.offsetX,
        y: pointerY - chipDragDataRef.current.offsetY,
      }));
    };
    const handleUp = () => {
      setIsChipDragging(false);
      chipDragDataRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isChipDragging, viewScale]);

  const handleAddBreakpoint = (address) => {
    setBreakpoints((prev) => (prev.includes(address) ? prev : [...prev, address]));
  };

  const handleRemoveBreakpoint = (address) => {
    setBreakpoints((prev) => prev.filter((bp) => bp !== address));
  };

  const displayTimeline = liveMode ? liveTimeline : timeline;
  const displayStep = liveMode ? liveTimeline.length - 1 : currentStep;

  const styles = getStyles(theme, isCompact);

  return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <div style={styles.topGroup}>
          <button style={styles.backBtn} onClick={() => navigate("/")}>
            ← Labs
          </button>
          <select
            value={selectedMcuId}
            onChange={(e) => setSelectedMcuId(e.target.value)}
            style={styles.mcuSelect}
          >
            {MCUS.map((mcu) => (
              <option key={mcu.id} value={mcu.id}>
                {mcu.name}
              </option>
            ))}
          </select>
          <button style={styles.themeBtn} onClick={toggleTheme}>
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
        <div style={styles.titleBlock}>
          <span style={styles.titleIcon}>⬡</span>
          <span style={styles.titleLabel}>{selectedMcu?.name || "Sandbox"}</span>
        </div>
        <div style={styles.topGroup}>
          <button style={styles.runButton} onClick={runCode} disabled={!isMcuSupported}>
            ▶ Run
          </button>
          <button style={styles.xrButton} onClick={() => setIs3DMode(!is3DMode)}>
            {is3DMode ? "2D Workbench" : "3D Lab Preview"}
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.componentPicker}>
          <select
            style={styles.componentSelect}
            onChange={(e) => {
              if (e.target.value) {
                addComponent(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">+ Add Component</option>
            {SUPPORTED_COMPONENTS.map((component) => (
              <option key={component.workspaceType} value={component.workspaceType}>
                {component.label}
              </option>
            ))}
          </select>
          <button style={styles.libraryBtn} onClick={() => setIsCatalogOpen(true)}>
            Browse Library
          </button>
        </div>
        <div style={styles.workspaceActions}>
          <ProtectedFeature compact action="save your workspace">
            <button style={styles.actionBtn} onClick={handleSaveWorkspace}>💾 Save</button>
          </ProtectedFeature>
          <button style={styles.actionBtn} onClick={handleLoadWorkspace}>↺ Load</button>
          <ProtectedFeature compact action="export workspaces">
            <button style={styles.actionBtn} onClick={handleExportWorkspace}>⤴ Export</button>
          </ProtectedFeature>
          <select
            style={{...styles.componentSelect, marginLeft: "10px", width: "140px"}}
            onChange={(e) => {
              const key = e.target.value;
              if (!key) return;
              e.target.value = "";
              const preset = CIRCUIT_PRESETS[key];
              if (!preset) return;

              stopSimulation();
              loadPreset(key);

              // Wires
              setWires(preset.wires || []);

              // Code
              if (preset.starterCode) setCode(preset.starterCode);

              // MCU (switch board if preset targets a different MCU)
              if (preset.mcu) setSelectedMcuId(preset.mcu);

              // Open editor so the code is visible
              setIsEditorOpen(true);
            }}
          >
            <option value="">Load Preset...</option>
            {Object.keys(CIRCUIT_PRESETS).map(key => (
              <option key={key} value={key}>{CIRCUIT_PRESETS[key].name}</option>
            ))}
          </select>
        </div>
        <div style={styles.zoomControls}>
          <button onClick={() => handleZoom("out")}>−</button>
          <span>{Math.round(viewScale * 100)}%</span>
          <button onClick={() => handleZoom("in")}>＋</button>
          <button onClick={handleResetView}>Reset</button>
          <button
            onClick={() => setPanMode((prev) => !prev)}
            style={panMode ? styles.panActive : undefined}
          >
            {panMode ? "Panning" : "Pan Mode"}
          </button>
        </div>
      </div>

      <div style={{ ...styles.body, flexDirection: isCompact ? "column" : "row" }}>
        <button
          style={{ ...styles.floatingBtn, left: isEditorOpen ? 360 : 10 }}
          onClick={() => setIsEditorOpen(!isEditorOpen)}
        >
          {isEditorOpen ? "◀" : "Code ▶"}
        </button>

        <button
          style={{ ...styles.floatingBtn, right: isAnalyzerOpen ? 460 : 10, left: "auto" }}
          onClick={() => setIsAnalyzerOpen(!isAnalyzerOpen)}
        >
          {isAnalyzerOpen ? "▶" : "◀ Output"}
        </button>

        <div style={{ ...styles.leftColumn, marginLeft: isEditorOpen ? 0 : -360 }}>
          <EditorPanel
            code={code}
            setCode={setCode}
            registers={currentRegisters}
            onToggleBit={handleToggleBit}
            hexOutput={hexOutput}
            hexError={hexError}
          />
          <HardwareConfigPanel manualRegisters={manualRegisters} setManualRegisters={setManualRegisters} />
        </div>

        <div style={styles.chipColumn}>
          {is3DMode ? (
            <div 
              style={{
                flex: 1, position: "absolute", inset: 0, width: "100%", height: "100%",
                borderRadius: 14, overflow: "hidden",
                border: "1px solid rgba(0,210,255,0.15)",
                background: "linear-gradient(135deg, #010307 0%, #020810 100%)",
                boxShadow: "inset 0 0 60px rgba(0,210,255,0.03), 0 0 40px rgba(0,0,0,0.5)",
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              <ARLabCanvas highlightedId={null} componentStyles={{}} wires={wires} />

              {/* Bottom-left status badge */}
              <div style={{
                position: "absolute", bottom: 20, left: 20, zIndex: 10,
                padding: "10px 18px", borderRadius: 10,
                background: "rgba(0,8,20,0.85)", backdropFilter: "blur(16px)",
                border: `1px solid ${isRunning || liveMode ? "rgba(0,242,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: isRunning || liveMode ? "0 0 20px rgba(0,242,255,0.1)" : "none",
              }}>
                {isRunning || liveMode ? (
                   <><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f2ff", boxShadow: "0 0 12px #00f2ff, 0 0 4px #00f2ff", animation: "pulse 1.5s infinite" }}></div><span style={{ color: "#00f2ff", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", fontFamily: "monospace" }}>LIVE MCU</span></>
                ) : (
                   <><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#333", boxShadow: "0 0 4px #222" }}></div><span style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", fontFamily: "monospace" }}>IDLE</span></>
                )}
              </div>

              {/* Top-right port state HUD */}
              <div style={{
                position: "absolute", top: 20, right: 20, zIndex: 10,
                padding: "14px 18px", borderRadius: 10,
                background: "rgba(0,8,20,0.88)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(0,210,255,0.12)",
                display: "flex", flexDirection: "column", gap: 7,
                minWidth: 175, boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00f2ff", boxShadow: "0 0 6px #00f2ff" }} />
                  <span style={{ color: "#00f2ff", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace" }}>Port Register State</span>
                </div>
                {["PORTB", "PORTC", "PORTD"].map((portName) => {
                  const arr = currentRegisters?.[portName] || Array(8).fill(0);
                  const hexHex = parseInt([...arr].reverse().join(""), 2).toString(16).toUpperCase().padStart(2, "0");
                  return (
                    <div key={portName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                      <span style={{ color: "#6090b0" }}>{portName}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[...arr].reverse().map((bit, bi) => (
                          <div key={bi} style={{
                            width: 7, height: 7,
                            background: bit ? "#00f2ff" : "#1a2030",
                            borderRadius: 1,
                            boxShadow: bit ? "0 0 4px #00f2ff" : "none",
                            transition: "all 0.2s",
                          }} />
                        ))}
                        <span style={{ color: "#e0e8f0", fontWeight: 700, marginLeft: 6, fontSize: 11 }}>0x{hexHex}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom-right hint */}
              <div style={{
                position: "absolute", bottom: 20, right: 20, zIndex: 10,
                padding: "8px 14px", borderRadius: 8,
                background: "rgba(0,8,20,0.7)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: "#506070", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em" }}>
                  🖱 Orbit · Scroll Zoom · Drag Pan
                </span>
              </div>
            </div>
          ) : (
          <div
            id="workplane-container"
            ref={workplaneRef}
            style={{
              ...styles.workplane,
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewScale})`,
            }}
            onMouseDown={handlePanStart}
          >
            <div
              style={{
                ...styles.chipDraggable,
                left: chipTransform.x,
                top: chipTransform.y,
                transform: `scale(${chipTransform.scale})`,
                cursor: isChipDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleChipMouseDown}
              onWheel={handleChipWheel}
            >
            <div style={styles.chipControls}>
                <span style={styles.chipLabel}>Drag chip • Scroll to zoom</span>
                <button
                  style={styles.resetChipBtn}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetChipTransform();
                  }}
                >
                  Reset
                </button>
              </div>
              {selectedMcu?.supported ? (
                <Chip registers={currentRegisters} toggleInput={toggleInput} mcu={selectedMcu} />
              ) : (
                <McuPreviewPanel mcu={selectedMcu} />
              )}
            </div>
            {workspaceItems.map((item) => {
              const componentMeta = COMPONENT_TYPE_MAP[item.type] || item.metadata;

              // Resolve multi-pin endpoints properly based on component
              const resolvedMain = resolveConnection(item.id, "main");
              const configState = getPinLogic(resolvedMain.pin);
              const analogState = getPinAnalog(resolvedMain.pin, resolvedMain.resistance);
              const resistorFactor = getResistorFactor(resolvedMain.resistance);

              let terminals = [{ id: "main", label: "PIN" }];
              if (item.type === "RGB_LED") {
                terminals = [
                  { id: "r", label: "R", color: "#ff3333" },
                  { id: "g", label: "G", color: "#33ff33" },
                  { id: "b", label: "B", color: "#3333ff" },
                ];
              } else if (item.type === "SEVEN_SEG") {
                terminals = [
                  { id: "a", label: "A", color: "#ff6666" },
                  { id: "b", label: "B", color: "#ff9966" },
                  { id: "c", label: "C", color: "#ffcc66" },
                  { id: "d", label: "D", color: "#ffff66" },
                  { id: "e", label: "E", color: "#ccff66" },
                  { id: "f", label: "F", color: "#99ff66" },
                  { id: "g", label: "G", color: "#66ff66" },
                ];
              } else if (item.type === "SERVO") {
                terminals = [{ id: "main", label: "SIG", color: "#ff6600" }];
              } else if (item.type === "RESISTOR") {
                terminals = [
                  { id: "t1", label: "T1", color: "#999" },
                  { id: "t2", label: "T2", color: "#999" }
                ];
              } else if (item.type === "CAPACITOR") {
                terminals = [
                  { id: "t1", label: "+", color: "#38bdf8" },
                  { id: "t2", label: "−", color: "#666" },
                ];
              } else if (item.type === "NPN_TRANSISTOR" || item.type === "PNP_TRANSISTOR") {
                terminals = [
                  { id: "c", label: "C", color: "#666" },
                  { id: "b", label: "B", color: "#666" },
                  { id: "e", label: "E", color: "#666" },
                ];
              } else if (item.type === "NMOSFET" || item.type === "PMOSFET") {
                terminals = [
                  { id: "g", label: "G", color: "#facc15" },
                  { id: "d", label: "D", color: "#666" },
                  { id: "s", label: "S", color: "#666" },
                ];
              } else if (item.type === "OPTOCOUPLER") {
                terminals = [
                  { id: "ano",  label: "A",  color: "#f97316" },
                  { id: "cat",  label: "K",  color: "#666" },
                  { id: "col",  label: "C",  color: "#22d3ee" },
                  { id: "emit", label: "E",  color: "#666" },
                ];
              } else if (item.type === "DC_MOTOR") {
                terminals = [
                  { id: "m+", label: "M+", color: "#f97316" },
                  { id: "m-", label: "M−", color: "#666" },
                ];
              } else if (item.type === "L298N_DRIVER") {
                terminals = [
                  { id: "ena", label: "ENA", color: "#22c55e" },
                  { id: "in1", label: "IN1", color: "#94a3b8" },
                  { id: "in2", label: "IN2", color: "#94a3b8" },
                  { id: "in3", label: "IN3", color: "#94a3b8" },
                  { id: "in4", label: "IN4", color: "#94a3b8" },
                  { id: "enb", label: "ENB", color: "#22c55e" },
                  { id: "vcc", label: "VCC", color: "#facc15" },
                  { id: "gnd", label: "GND", color: "#555" },
                ];
              } else if (item.type === "TIMER_555") {
                terminals = [
                  { id: "gnd", label: "1 (GND)", color: "#111" },
                  { id: "trig", label: "2 (TRIG)", color: "#666" },
                  { id: "out", label: "3 (OUT)", color: "#22d3ee" },
                  { id: "reset", label: "4 (RESET)", color: "#ff4444" },
                  { id: "ctrl", label: "5 (CTRL)", color: "#666" },
                  { id: "thres", label: "6 (THRES)", color: "#666" },
                  { id: "disch", label: "7 (DISCH)", color: "#666" },
                  { id: "vcc", label: "8 (VCC)", color: "#ffcf33" },
                ];
              } else if (item.type === "MULTIMETER") {
                terminals = [
                  { id: "v", label: "V", color: "#ff3333" },
                  { id: "a", label: "A", color: "#ffcc00" },
                  { id: "r", label: "Ω", color: "#33ff33" },
                  { id: "com", label: "COM", color: "#111" },
                ];
              } else if (item.type === "GROUND_NODE") {
                terminals = [{ id: "main", label: "GND", color: "#00ffcc" }];
              } else if (item.type === "VCC_NODE") {
                terminals = [{ id: "main", label: "VCC", color: "#ffcf33" }];
              } else if (item.type === "WIRE_NODE") {
                terminals = [{ id: "main", label: "Tie Point", color: "#4dabf7" }];
              } else if (componentMeta?.terminals) {
                terminals = normalizeTerminals(componentMeta.terminals);
              }

              let configPanel = null;
              if (item.type === "RESISTOR") {
                configPanel = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input 
                      type="number" 
                      value={item.resistance || 220} 
                      onChange={(e) => updateComponentSettings(item.id, { resistance: Number(e.target.value) })}
                      style={{ width: '50px', background: '#000', border: '1px solid #444', color: '#0f0', fontSize: '10px' }}
                    />
                    <select 
                      value={item.resMultiplier || 1}
                      onChange={(e) => updateComponentSettings(item.id, { resMultiplier: Number(e.target.value) })}
                      style={{ background: '#222', color: '#fff', fontSize: '10px', border: '1px solid #444' }}
                    >
                      <option value={1}>Ω</option>
                      <option value={1000}>kΩ</option>
                      <option value={1000000}>MΩ</option>
                    </select>
                  </div>
                );
              } else if (item.type === "CAPACITOR") {
                 configPanel = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input 
                      type="number" 
                      value={item.capacitance || 10} 
                      onChange={(e) => updateComponentSettings(item.id, { capacitance: Number(e.target.value) })}
                      style={{ width: '40px', background: '#000', border: '1px solid #444', color: '#0ea5e9', fontSize: '10px' }}
                    />
                    <select 
                      value={item.capUnit || "μF"}
                      onChange={(e) => updateComponentSettings(item.id, { capUnit: e.target.value })}
                      style={{ background: '#222', color: '#fff', fontSize: '10px', border: '1px solid #444' }}
                    >
                      <option value="pF">pF</option>
                      <option value="nF">nF</option>
                      <option value="μF">μF</option>
                      <option value="mF">mF</option>
                    </select>
                  </div>
                );
              } else if (item.type === "VCC_NODE") {
                 configPanel = (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <span style={{ fontSize: '9px', color: '#facc15' }}>VCC</span>
                     <input 
                       type="number" 
                       min="1" max="24"
                       value={item.value || 5} 
                       onChange={(e) => updateComponentSettings(item.id, { value: Number(e.target.value) })}
                       style={{ width: '40px', background: '#000', border: '1px solid #444', color: '#facc15', fontSize: '10px' }}
                     />
                   </div>
                 );
              } else if (item.type === "SLIDE_POT" || item.type === "DIAL") {
                 configPanel = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#888' }}>MAXΩ</span>
                    <input 
                      type="number" 
                      value={item.maxValue || 1023} 
                      onChange={(e) => updateComponentSettings(item.id, { maxValue: Number(e.target.value) })}
                      style={{ width: '50px', background: '#000', border: '1px solid #444', color: '#fff', fontSize: '10px' }}
                    />
                  </div>
                 );
                 // We defer setInputs to an effect to avoid the React state update during render crash.
                 const wiperConnection = resolveConnection(item.id, "WIPER");
                 if (wiperConnection.pin != null) {
                    const effectiveVal = Math.floor(
                      (item.value / (item.type === 'SLIDE_POT' ? 1023 : 100)) * 255
                    );
                    if (inputs[wiperConnection.pin] !== effectiveVal) {
                       setTimeout(() => {
                         setInputs(prev => ({ ...prev, [wiperConnection.pin]: effectiveVal }));
                       }, 0);
                    }
                 }
              }

              let usesEmbeddedTerminals = true;
              let renderedContent = null;
              if (item.type === "LED_RED") {
                usesEmbeddedTerminals = false;
                renderedContent = <ExternalLED color="red" state={configState} label={resolvedMain.pin != null ? `Pin ${resolvedMain.pin}` : "Unwired"} intensity={resistorFactor} />;
              } else if (item.type === "LED_GREEN") {
                usesEmbeddedTerminals = false;
                renderedContent = <ExternalLED color="green" state={configState} label={resolvedMain.pin != null ? `Pin ${resolvedMain.pin}` : "Unwired"} intensity={resistorFactor} />;
              } else if (item.type === "LED_YELLOW") {
                usesEmbeddedTerminals = false;
                renderedContent = <ExternalLED color="yellow" state={configState} label={resolvedMain.pin != null ? `Pin ${resolvedMain.pin}` : "Unwired"} intensity={resistorFactor} />;
              } else if (item.type === "RESISTOR") {
                usesEmbeddedTerminals = false;
                renderedContent = <Resistor resistance={(item.resistance || 330) * (item.resMultiplier || 1)} />;
              } else if (item.type === "CAPACITOR") {
                usesEmbeddedTerminals = false;
                renderedContent = <Capacitor capacitance={item.capacitance || 10} unit={item.capUnit || "μF"} />;
              } else if (item.type === "BUTTON") {
                usesEmbeddedTerminals = false;
                renderedContent = (
                  <div onMouseDown={() => toggleInput(resolvedMain.pin)}>
                    <PushButton state={inputs[resolvedMain.pin] === 1} label={resolvedMain.pin != null ? `Pin ${resolvedMain.pin}` : "Unwired"} />
                  </div>
                );
              } else if (item.type === "DIAL") {
                usesEmbeddedTerminals = false;
                renderedContent = (
                  <Dial 
                    value={item.value ?? 0} 
                    onChange={(val) => {
                      updateComponentSettings(item.id, { value: val });
                      if (resolvedMain.pin != null) setAnalogInput(resolvedMain.pin, val);
                    }} 
                    label={resolvedMain.pin != null ? `Pin ${resolvedMain.pin}` : "Unwired"} 
                  />
                );
              } else if (item.type === "SLIDE_POT") {
                usesEmbeddedTerminals = false;
                const wiperConnection = resolveConnection(item.id, "WIPER");
                renderedContent = (
                  <SlidePotentiometer
                    value={item.value ?? 512}
                    onChange={(val) => {
                      updateComponentSettings(item.id, { value: val });
                      if (wiperConnection.pin != null) {
                        setAnalogInput(wiperConnection.pin, val);
                      }
                    }}
                    label={wiperConnection.pin != null ? `Pin ${wiperConnection.pin}` : "Unwired"}
                  />
                );
              } else if (item.type === "MULTIMETER") {
                usesEmbeddedTerminals = false;
                const mode = item.mode || "V";
                const portId = mode.toLowerCase();
                const portConn = resolveConnection(item.id, portId);
                const measuredAnalog = getPinAnalog(portConn.pin, portConn.resistance);
                
                renderedContent = (
                  <Multimeter 
                    value={measuredAnalog > 0 ? (measuredAnalog / 255) * 1023 : 0} 
                    label={item.id} 
                    mode={mode}
                    onModeChange={(newMode) => updateComponentSettings(item.id, { mode: newMode })}
                  />
                );
              } else if (item.type === "NPN_TRANSISTOR") {
                usesEmbeddedTerminals = false; 
                renderedContent = <NPNTransistor />;
              } else if (item.type === "PNP_TRANSISTOR") {
                usesEmbeddedTerminals = false; 
                renderedContent = <PNPTransistor />;
              } else if (item.type === "TIMER_555") {
                usesEmbeddedTerminals = false; 
                renderedContent = <Timer555 />;
              } else if (item.type === "RGB_LED") {
                usesEmbeddedTerminals = false;
                renderedContent = (
                  <RGB_LED
                    rState={getPinLogic(resolveConnection(item.id, "r").pin)}
                    gState={getPinLogic(resolveConnection(item.id, "g").pin)}
                    bState={getPinLogic(resolveConnection(item.id, "b").pin)}
                  />
                );
              } else if (item.type === "SERVO") {
                usesEmbeddedTerminals = false;
                renderedContent = <Servo angle={analogState > 0 ? (analogState / 255) * 180 : 0} />;
              } else if (item.type === "SEVEN_SEG") {
                usesEmbeddedTerminals = false;
                renderedContent = (
                  <SevenSegment
                    a={getPinLogic(resolveConnection(item.id, "a").pin)}
                    b={getPinLogic(resolveConnection(item.id, "b").pin)}
                    c={getPinLogic(resolveConnection(item.id, "c").pin)}
                    d={getPinLogic(resolveConnection(item.id, "d").pin)}
                    e={getPinLogic(resolveConnection(item.id, "e").pin)}
                    f={getPinLogic(resolveConnection(item.id, "f").pin)}
                    g={getPinLogic(resolveConnection(item.id, "g").pin)}
                  />
                );
              } else if (item.type === "GROUND_NODE") {
                usesEmbeddedTerminals = false;
                renderedContent = <GroundNode />;
              } else if (item.type === "VCC_NODE") {
                usesEmbeddedTerminals = false;
                renderedContent = (
                  <VccNode 
                    value={item.value || 5} 
                    onChange={(newVal) => updateComponentSettings(item.id, { value: newVal })}
                  />
                );
              } else if (item.type === "WIRE_NODE") {
                usesEmbeddedTerminals = false;
                renderedContent = <div style={{ width: 12, height: 12, borderRadius: 6, background: "#4dabf7", boxShadow: "0 0 8px #4dabf7" }} />;
              }

              if (!renderedContent && LIBRARY_COMPONENTS_MAP[item.type]) {
                const CustomLibComp = LIBRARY_COMPONENTS_MAP[item.type];
                usesEmbeddedTerminals = false;
                
                const pinStates = {};
                const analogStates = {};
                const wiredPins = {};
                const layout = LIBRARY_TERMINAL_LAYOUTS[item.type] || [];
                layout.forEach(tl => {
                  const conn = resolveConnection(item.id, tl.id);
                  const signal = conn.pin != null ? getPinLogic(conn.pin) : (conn.logicValue ?? false);
                  pinStates[tl.id] = signal;
                  analogStates[tl.id] = conn.pin != null ? getPinAnalog(conn.pin, conn.resistance) : 0;
                  wiredPins[tl.id] = conn.pin;
                });

                renderedContent = <CustomLibComp id={item.id} type={item.type} pinStates={pinStates} analogStates={analogStates} wiredPins={wiredPins} />;
              }

              if (!renderedContent) {
                usesEmbeddedTerminals = true;
                renderedContent = (
                  <ComponentPlaceholder
                    id={item.id}
                    status={componentMeta?.status || "visual"}
                    wokwiTag={componentMeta?.wokwiTag || item.metadata?.wokwiTag}
                    imageUrl={componentMeta?.imageUrl || item.metadata?.imageUrl}
                    terminals={terminals}
                    pins={item.pins || {}}
                    onTerminalDragStart={startWire}
                  />
                );
              }

              // Pin terminal positions (relative to DraggableWrapper origin):
              //   Timer555:  TOTAL_W=92, H=104 — tips at x=0 (left) and x=92 (right), y=17/43/69/95
              //   NPN/PNP:   60×80 SVG — three leads at (15,65),(30,65),(45,65)
              //   Capacitor: 48×80 SVG — leads at (24,0) and (24,80)
              //   Resistor:  120×60 SVG — leads at (0,36) and (120,36)
              const terminalLayout =
                item.type === "TIMER_555"
                  ? [
                      { id: "gnd",   x: 0,  y: 17 },
                      { id: "trig",  x: 0,  y: 43 },
                      { id: "out",   x: 0,  y: 69 },
                      { id: "reset", x: 0,  y: 95 },
                      { id: "vcc",   x: 92, y: 17 },
                      { id: "disch", x: 92, y: 43 },
                      { id: "thres", x: 92, y: 69 },
                      { id: "ctrl",  x: 92, y: 95 },
                    ]
                  : item.type === "NPN_TRANSISTOR" || item.type === "PNP_TRANSISTOR"
                  ? [
                      { id: "e", x: 15, y: 65 },
                      { id: "b", x: 30, y: 65 },
                      { id: "c", x: 45, y: 65 },
                    ]
                  : item.type === "CAPACITOR"
                  ? [
                      { id: "t1", x: 24, y: 0  },
                      { id: "t2", x: 24, y: 80 },
                    ]
                  : item.type === "RESISTOR"
                  ? [
                      { id: "t1", x: 0,   y: 36 },
                      { id: "t2", x: 120, y: 36 },
                    ]
                  : item.type === "MULTIMETER"
                  ? [
                       { id: "v",   x: 26,  y: 195 },
                       { id: "a",   x: 55,  y: 195 },
                       { id: "r",   x: 84,  y: 195 },
                       { id: "com", x: 113, y: 195 },
                    ]
                  : LIBRARY_TERMINAL_LAYOUTS[item.type]
                  ? LIBRARY_TERMINAL_LAYOUTS[item.type]
                  : undefined;

              return (
                <DraggableWrapper
                  key={item.id}
                  id={item.id}
                  initialX={item.x}
                  initialY={item.y}
                  scale={item.scale || 1}
                  terminals={terminals}
                  terminalLayout={terminalLayout}
                  renderExternalTerminals={!usesEmbeddedTerminals}
                  onStartWire={startWire}
                  onDelete={deleteComponent}
                  configPanel={configPanel}
                  workspaceId="workplane-container"
                  workspaceRef={workplaneRef}
                  viewScale={viewScale}
                  onPositionChange={handleItemPositionChange}
                  onScaleChange={handleItemScaleChange}
                >
                  <SandboxErrorBoundary>
                    {renderedContent}
                  </SandboxErrorBoundary>
                </DraggableWrapper>
              );

            })}

            <WiringCanvas
              items={workspaceItems}
              wires={wires}
              activeWire={activeWire}
              selectedWireId={selectedWireId}
              wireColors={wireColors}
              onWireColorChange={handleWireColorChange}
              onWireDelete={handleWireDelete}
              onWireDetach={handleWireDetach}
              onWireClick={(id) => setSelectedWireId(id)}
              workspaceId="workplane-container"
              viewScale={viewScale}
              viewOffset={viewOffset}
              outputs={storeOutputs}
            />
          </div>
          )}
        </div>

        <div style={{ ...styles.analyzerColumn, marginRight: isAnalyzerOpen ? 0 : -460 }}>
          {hexError && (
            <div style={styles.errorBanner}>
              <strong>Compilation Failed:</strong>
              <div>{hexError}</div>
            </div>
          )}

          <ExecutionInspector
            currentPC={currentPC}
            speedMultiplier={speedMultiplier}
            onSpeedChange={setSpeedMultiplier}
            breakpoints={breakpoints}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            breakpointHit={breakpointHit}
          />

          <div style={styles.gpioPanel}>
            <div style={styles.gpioHeader}>GPIO View</div>
            <GpioView registers={currentRegisters} onInputChange={handleInputChange} mcu={selectedMcu} />
          </div>

          {displayTimeline.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SimulationControls
                totalSteps={displayTimeline.length}
                currentStep={displayStep}
                onStepChange={liveMode ? () => {} : setCurrentStep}
                isPlaying={liveMode ? true : isPlaying}
                setIsPlaying={liveMode ? () => { stopSimulation(); setIsPlaying(false); } : setIsPlaying}
              />
              <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', borderBottom: '1px solid #333' }}>
                  <button 
                    onClick={() => setActiveOutputTab('waveforms')} 
                    style={{ ...styles.tabBtn, opacity: activeOutputTab === 'waveforms' ? 1 : 0.5, borderBottom: activeOutputTab === 'waveforms' ? '2px solid #00F2FF' : 'none', color: activeOutputTab === 'waveforms' ? '#00F2FF' : '#fff' }}>
                    Waveforms (DSO)
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('serial')} 
                    style={{ ...styles.tabBtn, opacity: activeOutputTab === 'serial' ? 1 : 0.5, borderBottom: activeOutputTab === 'serial' ? '2px solid #00F2FF' : 'none', color: activeOutputTab === 'serial' ? '#00F2FF' : '#fff' }}>
                    Serial Monitor
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('memory')} 
                    style={{ ...styles.tabBtn, opacity: activeOutputTab === 'memory' ? 1 : 0.5, borderBottom: activeOutputTab === 'memory' ? '2px solid #00F2FF' : 'none', color: activeOutputTab === 'memory' ? '#00F2FF' : '#fff' }}>
                    Memory
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('trace')} 
                    style={{ ...styles.tabBtn, opacity: activeOutputTab === 'trace' ? 1 : 0.5, borderBottom: activeOutputTab === 'trace' ? '2px solid #00F2FF' : 'none', color: activeOutputTab === 'trace' ? '#00F2FF' : '#fff' }}>
                    Trace
                  </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
                {activeOutputTab === 'waveforms' && <LogicAnalyzer timeline={displayTimeline} currentStep={displayStep} initialPins={[13, 2]} />}
                {activeOutputTab === 'serial' && <SerialMonitor timeline={displayTimeline} currentStep={displayStep} />}
                {activeOutputTab === 'memory' && <MemoryViewer memory={currentMemory} />}
                {activeOutputTab === 'trace' && <ExecutionTrace timeline={displayTimeline} currentStep={displayStep} />}
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>Run simulation to view outputs</div>
          )}
        </div>
      </div>
      <ChatbotWidget />
      {isCatalogOpen && (
        <ComponentCatalogPanel
          categories={COMPONENT_CATEGORIES}
          onAdd={(workspaceType, component) => {
            addComponent(workspaceType, component);
            setIsCatalogOpen(false);
          }}
          onClose={() => setIsCatalogOpen(false)}
        />
      )}
    </div>
  );
}

function getStyles(theme, isCompact) {
  return {
    app: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "var(--surface-0)",
      color: "var(--text-primary)",
      overflow: "hidden",
    },
    topBar: {
      width: "100%",
      height: 64,
      background: "var(--surface-1)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px",
      gap: 12,
    },
    topGroup: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    backBtn: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--text-secondary)",
      padding: "6px 12px",
      borderRadius: 8,
      cursor: "pointer",
    },
    mcuSelect: {
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
      padding: "6px 10px",
      borderRadius: 8,
      fontFamily: "monospace",
    },
    themeBtn: {
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "50%",
      width: 36,
      height: 36,
      cursor: "pointer",
    },
    titleBlock: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    titleIcon: {
      color: "var(--accent)",
      fontSize: 20,
    },
    titleLabel: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: -0.3,
    },
    runButton: {
      padding: "10px 22px",
      background: "var(--accent)",
      color: theme === "dark" ? "#000" : "#fff",
      border: "none",
      borderRadius: 10,
      fontWeight: 700,
      cursor: "pointer",
    },
    xrButton: {
      padding: "9px 18px",
      background: "transparent",
      border: "1px solid var(--accent)",
      color: "var(--accent)",
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
    },
    toolbar: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
      padding: "10px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface-2)",
    },
    componentPicker: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    componentSelect: {
      background: "var(--surface-0)",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
      padding: "6px 10px",
      borderRadius: 8,
      fontFamily: "monospace",
      minWidth: 200,
    },
    libraryBtn: {
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "transparent",
      color: "var(--text-primary)",
      padding: "6px 14px",
      cursor: "pointer",
      fontFamily: "monospace",
    },
    workspaceActions: {
      display: "flex",
      gap: 8,
    },
    actionBtn: {
      background: "rgba(0, 242, 255, 0.08)",
      color: "#00F2FF",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      borderRadius: 8,
      padding: "6px 14px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.2s ease"
    },
    zoomControls: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginLeft: "auto",
    },
    panActive: {
      borderColor: "var(--accent)",
      color: "var(--accent)",
    },
    body: {
      flex: 1,
      display: "flex",
      position: "relative",
      overflow: "hidden",
    },
    leftColumn: {
      width: isCompact ? "100%" : 360,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      background: "var(--surface-1)",
      borderRight: isCompact ? "none" : "1px solid var(--border)",
      boxSizing: "border-box",
      overflowY: "auto",
      transition: "margin-left 0.4s",
      padding: 12,
      position: "relative",
      zIndex: 20,
    },
    chipColumn: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
      background: "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent)",
    },
    workplane: {
      position: "relative",
      width: 1400,
      height: 900,
      backgroundColor: "#e2e8f0", // slate-200, greyish
      backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 60px)",
      borderRadius: 20,
      border: "1px solid #cbd5e1",
    },
    chipDraggable: {
      position: "absolute",
      pointerEvents: "auto",
      transformOrigin: "top left",
      transition: "box-shadow 0.2s",
      zIndex: 15,
    },
    chipControls: {
      position: "absolute",
      top: -42,
      left: "50%",
      transform: "translateX(-50%)",
      padding: "6px 14px",
      borderRadius: 999,
      background: "rgba(0,0,0,0.65)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: "var(--text-secondary)",
      fontSize: 11,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      fontFamily: "monospace",
      pointerEvents: "auto",
    },
    chipLabel: {
      color: "var(--text-secondary)",
      fontFamily: "monospace",
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    resetChipBtn: {
      border: "1px solid var(--border)",
      borderRadius: 999,
      background: "transparent",
      color: "var(--text-primary)",
      fontSize: 10,
      padding: "4px 10px",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    analyzerColumn: {
      width: isCompact ? "100%" : 460,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      padding: 20,
      gap: 16,
      background: "var(--surface-1)",
      borderLeft: "1px solid var(--border)",
      overflowY: "auto",
      transition: "margin-right 0.4s",
      position: "relative",
      zIndex: 20,
    },
    gpioPanel: {
      background: "var(--surface-0)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 16,
    },
    gpioHeader: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 12,
      color: "var(--accent)",
    },
    floatingBtn: {
      position: "absolute",
      top: 76,
      zIndex: 30,
      background: "var(--accent)",
      color: theme === "dark" ? "#000" : "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: "bold",
      letterSpacing: "0.05em",
    },
    errorBanner: {
      color: "#ef4444",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.4)",
      borderRadius: 10,
      padding: 12,
      fontFamily: "monospace",
    },
    emptyState: {
      color: "var(--text-muted)",
      fontFamily: "monospace",
      textAlign: "center",
      padding: 20,
    },
    tabBtn: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "bold",
      paddingBottom: "6px",
      transition: "all 0.2s",
    },
  };
}
