import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EditorPanel from "../components/EditorPanel";
import Chip from "../components/Chip";
import SimulationControls from "../components/SimulationControls";
import LogicAnalyzer from "../components/LogicAnalyzer";
import SerialMonitor from "../components/SerialMonitor";
import ExternalLED from "../components/ExternalLED";
import Resistor from "../components/Resistor";
import PushButton from "../components/PushButton";
import Dial from "../components/Dial";
import Multimeter from "../components/Multimeter";
import RGB_LED from "../components/RGB_LED";
import Servo from "../components/Servo";
import SevenSegment from "../components/SevenSegment";
import DraggableWrapper from "../components/DraggableWrapper";
import WiringCanvas from "../components/WiringCanvas";
import HardwareConfigPanel from "../components/HardwareConfigPanel";
import ChatbotWidget from "../components/ChatbotWidget";
import GpioView from "../components/GpioView";
import GroundNode from "../components/GroundNode";
import VccNode from "../components/VccNode";
import ExecutionInspector from "../components/ExecutionInspector";
import MemoryViewer from "../components/MemoryViewer";
import ExecutionTrace from "../components/ExecutionTrace";
import { useAVR } from "../engine/useAVR";
import { MCUS, MCU_MAP, DEFAULT_MCU_ID } from "../constants/mcus";
import { useTheme } from "../context/ThemeContext";
import useMediaQuery from "../hooks/useMediaQuery";
import { useCircuitStore } from "../state/useCircuitStore";

const WORKSPACE_STORAGE_KEY = "vlab_workspace_v1";

export default function SandboxPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isCompact = useMediaQuery("(max-width: 1200px)");

  const [selectedMcuId, setSelectedMcuId] = useState(DEFAULT_MCU_ID);
  const selectedMcu = MCU_MAP[selectedMcuId];
  const isMcuSupported = selectedMcu?.supported;

  const [code, setCode] = useState(`void setup() {
}

void loop() {
}`);

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
  } = useAVR(selectedMcuId);

  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hexOutput, setHexOutput] = useState("");
  const [hexError, setHexError] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(true);

  const [activeWire, setActiveWire] = useState(null);
  const activeWireRef = useRef(null);

  const [wireColors, setWireColors] = useState({});
  const storedWorkspaceItems = useCircuitStore((state) => state.workspaceItems);
  const workspaceVersion = useCircuitStore((state) => state.workspaceVersion);
  const lastUpdatedBy = useCircuitStore((state) => state.lastUpdatedBy);
  const syncFromWorkspace = useCircuitStore((state) => state.syncFromWorkspace);
  const setOutputsFromRegisters = useCircuitStore((state) => state.setOutputsFromRegisters);
  const storeInputs = useCircuitStore((state) => state.inputs);
  const inputsVersion = useCircuitStore((state) => state.inputsVersion);
  const inputsSource = useCircuitStore((state) => state.lastInputsSource);
  const syncInputs = useCircuitStore((state) => state.syncInputs);

  const defaultWorkspace = useMemo(
    () => [
      { id: "led-1", type: "LED_RED", pin: 13, x: 200, y: 260 },
    ],
    [],
  );

  const [workspaceItems, internalSetWorkspaceItems] = useState(() =>
    storedWorkspaceItems && storedWorkspaceItems.length > 0 ? storedWorkspaceItems : defaultWorkspace,
  );

  const setWorkspaceItems = (updater, source = "sandbox") => {
    internalSetWorkspaceItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncFromWorkspace(next, source);
      return next;
    });
  };

  useEffect(() => {
    if (lastUpdatedBy && lastUpdatedBy !== "sandbox" && storedWorkspaceItems) {
      internalSetWorkspaceItems(storedWorkspaceItems);
    }
  }, [workspaceVersion, lastUpdatedBy, storedWorkspaceItems]);

  useEffect(() => {
    if (inputsSource && inputsSource !== "sandbox") {
      setInputsState(storeInputs || {});
    }
  }, [inputsVersion, inputsSource, storeInputs]);

  useEffect(() => {
    const registersSource = currentRegisters || manualRegisters;
    if (!registersSource) return;
    setOutputsFromRegisters(registersSource);
  }, [currentRegisters, manualRegisters, setOutputsFromRegisters]);
  const workspaceRef = useRef(null);
  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const panSessionRef = useRef(null);

  const [inputs, setInputsState] = useState(storeInputs || {});
  const setInputs = (updater, source = "sandbox") => {
    setInputsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncInputs(next, source);
      return next;
    });
  };
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
  });
  const manualMemoryRef = useRef(new Array(256).fill(0));

  const [breakpoints, setBreakpoints] = useState([]);
  const [breakpointHit, setBreakpointHit] = useState(null);

  const resistorMap = useMemo(() => {
    const map = {};
    workspaceItems.forEach((item) => {
      if (item.type === "RESISTOR" && item.pins?.main != null) {
        map[item.pins.main] = item.resistance || 330;
      }
    });
    return map;
  }, [workspaceItems]);

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
      const response = await fetch("http://127.0.0.1:8000/run-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inputs }),
      });

      const data = await response.json();

      if (data.hex) {
        startSimulation(data.hex);
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
    } catch (e) {
      console.error("Simulation failed:", e);
      setHexError("Simulation failed — check backend logs.");
    }
  };

  const addComponent = (type) => {
    let pins = { main: "" };
    if (type === "RGB_LED") pins = { r: "", g: "", b: "" };
    if (type === "SEVEN_SEG") pins = { a: "", b: "", c: "", d: "", e: "", f: "", g: "" };
    if (type === "RESISTOR") pins = { main: "" };

    const newItem = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      pins,
      x: 300,
      y: 360,
      ...(type === "RESISTOR" ? { resistance: 330 } : {}),
    };
    setWorkspaceItems((prev) => [...prev, newItem]);
  };

  const updateComponentSettings = (id, updates) => {
    setWorkspaceItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleComponentPinEffect = (item, prevPin, nextPin) => {
    if (!item) return;
    if (item.type === "GROUND_NODE" || item.type === "VCC_NODE") {
      setInputs((prev) => {
        const updated = { ...prev };
        if (prevPin != null) delete updated[prevPin];
        if (nextPin != null) updated[nextPin] = item.type === "GROUND_NODE" ? 0 : 1;
        return updated;
      });
    }
  };

  const updateComponentPin = (id, terminalId, newPin) => {
    setWorkspaceItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const pinInt = newPin == null || newPin === "" ? null : parseInt(newPin, 10);
      const prevPinValue = (item.pins && item.pins[terminalId]) ?? item.pin ?? null;
      const newPins = { ...(item.pins || { main: item.pin }) };
      newPins[terminalId] = pinInt;
      const updatedItem = { ...item, pins: newPins, pin: terminalId === "main" ? pinInt : item.pin };
      handleComponentPinEffect(updatedItem, prevPinValue, pinInt);
      return updatedItem;
    }));
  };

  const clearComponentTerminal = (id, terminalId) => updateComponentPin(id, terminalId, null);

  const deleteComponent = (id) => {
    setWorkspaceItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && (target.type === "GROUND_NODE" || target.type === "VCC_NODE")) {
        const existingPin = (target.pins && target.pins.main) ?? target.pin;
        if (existingPin != null) {
          setInputs((prevInputs) => {
            const updated = { ...prevInputs };
            delete updated[existingPin];
            return updated;
          });
        }
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleItemPositionChange = (id, pos) => {
    setWorkspaceItems((prev) => prev.map((item) => (item.id === id ? { ...item, x: pos.x, y: pos.y } : item)));
  };

  const startWire = (sourceId, termId, startX, startY) => {
    const newWire = { sourceId, termId, startX, startY, currentX: startX, currentY: startY };
    setActiveWire(newWire);
    activeWireRef.current = newWire;
  };

  useEffect(() => {
    window.onCompleteWire = (pin) => {
      if (activeWireRef.current && pin != null) {
        updateComponentPin(activeWireRef.current.sourceId, activeWireRef.current.termId || "main", pin);
      }
      setActiveWire(null);
      activeWireRef.current = null;
    };

    const handleGlobalMouseUp = () => {
      setTimeout(() => {
        if (activeWireRef.current) {
          setActiveWire(null);
          activeWireRef.current = null;
        }
      }, 10);
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

    return () => {
      window.onCompleteWire = null;
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, []);

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

  const handleWireColorChange = (wireId, color) => {
    setWireColors((prev) => ({ ...prev, [wireId]: color }));
  };

  const handleWireDelete = (wireId) => {
    if (!wireId) return;
    const [componentId, terminalId] = wireId.split("::");
    if (!componentId || !terminalId) return;
    clearComponentTerminal(componentId, terminalId);
    setWireColors((prev) => {
      const updated = { ...prev };
      delete updated[wireId];
      return updated;
    });
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

  const getPinLogic = (p) => {
    if (p === "" || isNaN(p) || p == null) return false;
    if (currentRegisters?.PWM?.[p] > 0 && currentRegisters?.PWM?.[p] < 255) return "PWM";
    if (p <= 7) return currentRegisters?.PORTD?.[p] === 1;
    if (p <= 13) return currentRegisters?.PORTB?.[p - 8] === 1;
    if (p >= 14 && p <= 19) return currentRegisters?.PORTC?.[p - 14] === 1;
    return false;
  };

  const getPinAnalog = (p) => {
    if (p === "" || isNaN(p) || p == null) return 0;
    const base = currentRegisters?.PWM?.[p] || (getPinLogic(p) ? 255 : 0);
    const factor = getResistorFactor(p);
    return Math.floor(base * factor);
  };

  const getResistorFactor = (pin) => {
    if (pin == null) return 1;
    const ohms = resistorMap[pin];
    if (!ohms) return 1;
    const ratio = 330 / Math.max(ohms, 1);
    return Math.min(1, Math.max(0.1, ratio));
  };

  const handleSaveWorkspace = () => {
    const payload = { items: workspaceItems, inputs, wireColors };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  };

  const handleLoadWorkspace = () => {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setWorkspaceItems(parsed.items || []);
      setInputs(parsed.inputs || {});
      setWireColors(parsed.wireColors || {});
    } catch (error) {
      console.error("Failed to load workspace", error);
    }
  };

  const handleExportWorkspace = () => {
    const data = JSON.stringify({ items: workspaceItems, inputs, wireColors }, null, 2);
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

  const handlePanStart = (e) => {
    if (!panMode) return;
    panSessionRef.current = { x: e.clientX, y: e.clientY, offset: { ...viewOffset } };
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);
  };

  const handlePanMove = (e) => {
    if (!panSessionRef.current) return;
    const dx = e.clientX - panSessionRef.current.x;
    const dy = e.clientY - panSessionRef.current.y;
    setViewOffset({
      x: panSessionRef.current.offset.x + dx,
      y: panSessionRef.current.offset.y + dy,
    });
  };

  const handlePanEnd = () => {
    panSessionRef.current = null;
    window.removeEventListener("mousemove", handlePanMove);
    window.removeEventListener("mouseup", handlePanEnd);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
    };
  }, []);

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
          <button style={styles.xrButton} onClick={() => navigate("/arlab?preset=blink")}>
            3D Lab Preview
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
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
          <option value="LED_RED">Red LED</option>
          <option value="LED_GREEN">Green LED</option>
          <option value="LED_YELLOW">Yellow LED</option>
          <option value="RESISTOR">Resistor</option>
          <option value="BUTTON">Push Button</option>
          <option value="DIAL">Potentiometer</option>
          <option value="MULTIMETER">Multimeter</option>
          <option value="RGB_LED">RGB LED</option>
          <option value="SERVO">Micro Servo</option>
          <option value="SEVEN_SEG">7-Segment Display</option>
          <option value="GROUND_NODE">Ground Node</option>
          <option value="VCC_NODE">VCC Node</option>
        </select>
        <div style={styles.workspaceActions}>
          <button onClick={handleSaveWorkspace}>💾 Save</button>
          <button onClick={handleLoadWorkspace}>↺ Load</button>
          <button onClick={handleExportWorkspace}>⤴ Export</button>
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
          <div
            ref={workspaceRef}
            style={{
              ...styles.workplane,
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewScale})`,
            }}
            onMouseDown={handlePanStart}
          >
            <div style={styles.chipAnchor}>
              <Chip registers={currentRegisters} toggleInput={toggleInput} mcu={selectedMcu} />
            </div>
            {workspaceItems.map((item) => {
              const itemPins = item.pins || { main: item.pin };
              const configState = getPinLogic(itemPins.main);
              const analogState = getPinAnalog(itemPins.main);
              const resistorFactor = getResistorFactor(itemPins.main);

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
              } else if (item.type === "GROUND_NODE") {
                terminals = [{ id: "main", label: "GND", color: "#00ffcc" }];
              } else if (item.type === "VCC_NODE") {
                terminals = [{ id: "main", label: "+5V", color: "#ffcf33" }];
              }

              const configPanel = item.type === "RESISTOR" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{item.resistance || 330}Ω</span>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="10"
                    value={item.resistance || 330}
                    onChange={(e) => updateComponentSettings(item.id, { resistance: parseInt(e.target.value, 10) })}
                    style={{ width: 80 }}
                  />
                </div>
              ) : null;

              return (
                <DraggableWrapper
                  key={item.id}
                  id={item.id}
                  initialX={item.x}
                  initialY={item.y}
                  terminals={terminals}
                  onStartWire={startWire}
                  onDelete={deleteComponent}
                  configPanel={configPanel}
                  workspaceRef={workspaceRef}
                  viewScale={viewScale}
                  onPositionChange={handleItemPositionChange}
                >
                  {item.type === "LED_RED" && (
                    <ExternalLED color="red" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} intensity={resistorFactor} />
                  )}
                  {item.type === "LED_GREEN" && (
                    <ExternalLED color="green" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} intensity={resistorFactor} />
                  )}
                  {item.type === "LED_YELLOW" && (
                    <ExternalLED color="yellow" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} intensity={resistorFactor} />
                  )}
                  {item.type === "RESISTOR" && <Resistor resistance={item.resistance || 330} />}
                  {item.type === "BUTTON" && (
                    <div onMouseDown={() => toggleInput(item.pin)}>
                      <PushButton state={inputs[item.pin] === 1} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />
                    </div>
                  )}
                  {item.type === "DIAL" && (
                    <Dial value={inputs[item.pin] || 0} onChange={(val) => setAnalogInput(item.pin, val)} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />
                  )}
                  {item.type === "MULTIMETER" && (
                    <Multimeter value={analogState > 0 ? (analogState / 255) * 1023 : 0} label={item.pin ? `Pin ${item.pin} Reading` : "Unwired"} />
                  )}
                  {item.type === "RGB_LED" && (
                    <RGB_LED rState={getPinLogic(itemPins.r)} gState={getPinLogic(itemPins.g)} bState={getPinLogic(itemPins.b)} />
                  )}
                  {item.type === "SERVO" && <Servo angle={analogState > 0 ? (analogState / 255) * 180 : 0} />}
                  {item.type === "SEVEN_SEG" && (
                    <SevenSegment
                      a={getPinLogic(itemPins.a)}
                      b={getPinLogic(itemPins.b)}
                      c={getPinLogic(itemPins.c)}
                      d={getPinLogic(itemPins.d)}
                      e={getPinLogic(itemPins.e)}
                      f={getPinLogic(itemPins.f)}
                      g={getPinLogic(itemPins.g)}
                    />
                  )}
                  {item.type === "GROUND_NODE" && <GroundNode />}
                  {item.type === "VCC_NODE" && <VccNode />}
                </DraggableWrapper>
              );
            })}
          </div>
        </div>

        <WiringCanvas
          items={workspaceItems}
          activeWire={activeWire}
          wireColors={wireColors}
          onWireColorChange={handleWireColorChange}
          onWireDelete={handleWireDelete}
        />

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
            <GpioView registers={currentRegisters} onInputChange={handleInputChange} />
          </div>

          {displayTimeline.length > 0 ? (
            <>
              <SimulationControls
                totalSteps={displayTimeline.length}
                currentStep={displayStep}
                onStepChange={liveMode ? () => {} : setCurrentStep}
                isPlaying={liveMode ? true : isPlaying}
                setIsPlaying={liveMode ? () => { stopSimulation(); setIsPlaying(false); } : setIsPlaying}
              />
              <SerialMonitor timeline={displayTimeline} currentStep={displayStep} />
              <LogicAnalyzer timeline={displayTimeline} currentStep={displayStep} initialPins={[13, 2]} />
              <MemoryViewer memory={currentMemory} />
              <ExecutionTrace timeline={displayTimeline} currentStep={displayStep} />
            </>
          ) : (
            <div style={styles.emptyState}>Run simulation to view outputs</div>
          )}
        </div>
      </div>
      <ChatbotWidget />
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
    componentSelect: {
      background: "var(--surface-0)",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
      padding: "6px 10px",
      borderRadius: 8,
      fontFamily: "monospace",
      minWidth: 200,
    },
    workspaceActions: {
      display: "flex",
      gap: 8,
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
      background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 60px)",
      borderRadius: 20,
      border: "1px solid var(--border)",
    },
    chipAnchor: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
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
      zIndex: 10,
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
  };
}
