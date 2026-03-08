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
import { useAVR } from "../engine/useAVR";

export default function SandboxPage() {
  const navigate = useNavigate();
  
  const [code, setCode] = useState(`void setup() {
}

void loop() {
}`);

  // Live WASM AVR Execution Engine hook
  const { startSimulation, stopSimulation, isRunning, cpuRegisters, liveTimeline } = useAVR();
  
  // State for timeline playback (fallback)
  const [timeline, setTimeline] = useState([]); 
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Compilation Output
  const [hexOutput, setHexOutput] = useState("");
  const [hexError, setHexError] = useState("");

  // States for sliding panels
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  // Wire Dragging States
  const [activeWire, setActiveWire] = useState(null);
  const activeWireRef = useRef(null);

  // States for workspace components
  const [workspaceItems, setWorkspaceItems] = useState([
    { id: "led-1", type: "LED_RED", pin: 13, x: 200, y: 300 }
  ]);

  // Inputs (buttons, dials mapping dynamically to components)
  const [inputs, setInputs] = useState({});

  // Manual override registers when not simulating
  const [manualRegisters, setManualRegisters] = useState({
    DDRB: [0,0,0,0,0,0,0,0], DDRC: [0,0,0,0,0,0,0,0], DDRD: [0,0,0,0,0,0,0,0],
    PORTB: [0,0,0,0,0,0,0,0], PORTC: [0,0,0,0,0,0,0,0], PORTD: [0,0,0,0,0,0,0,0],
    PINB: [0,0,0,0,0,0,0,0], PINC: [0,0,0,0,0,0,0,0], PIND: [0,0,0,0,0,0,0,0],
    PWM: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  });

  // Derived state: current registers based on timeline step, OR manual if none
  const currentRegisters = useMemo(() => {
    if (isRunning && cpuRegisters) return cpuRegisters;
    
    // Fallback back to recorded history if paused
    if (timeline && timeline.length > 0) {
      const step = Math.min(Math.max(0, currentStep), timeline.length - 1);
      return timeline[step]?.registers || manualRegisters;
    }
    
    return manualRegisters;
  }, [isRunning, cpuRegisters, timeline, currentStep, manualRegisters]);

  const runCode = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/run-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inputs })
      });

      const data = await response.json();
      
      if (data.hex) {
        startSimulation(data.hex);
        setHexOutput(data.hex);
        setHexError(data.hex_error || "");
        setIsAnalyzerOpen(true);
        setIsPlaying(true);
        setTimeline([]);
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
    }
  };

  const addComponent = (type) => {
    let pins = { main: "" };
    if (type === "RGB_LED") pins = { r: "", g: "", b: "" };
    if (type === "SEVEN_SEG") pins = { a: "", b: "", c: "", d: "", e: "", f: "", g: "" };
    
    const newItem = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      pins,
      x: 300,
      y: 300
    };
    setWorkspaceItems([...workspaceItems, newItem]);
  };

  const updateComponentPin = (id, terminalId, newPin) => {
    setWorkspaceItems(prev => prev.map(item => {
      if (item.id === id) {
        const pinInt = parseInt(newPin, 10);
        const newPins = { ...(item.pins || { main: item.pin }), [terminalId]: pinInt };
        return { ...item, pins: newPins, pin: terminalId === 'main' ? pinInt : item.pin };
      }
      return item;
    }));
  };

  const deleteComponent = (id) => {
    setWorkspaceItems(prev => prev.filter(item => item.id !== id));
  };

  const startWire = (sourceId, startX, startY) => {
    const newWire = { sourceId, startX, startY, currentX: startX, currentY: startY };
    setActiveWire(newWire);
    activeWireRef.current = newWire;
  };

  useEffect(() => {
    window.onCompleteWire = (pin) => {
      if (activeWireRef.current && pin != null) {
        updateComponentPin(activeWireRef.current.sourceId, activeWireRef.current.termId || 'main', pin);
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
          currentY: e.clientY
        };
        setActiveWire(nextWire);
        activeWireRef.current = nextWire;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.onCompleteWire = null;
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const toggleInput = (pin) => {
    if (pin == null) return;
    setInputs(prev => ({
      ...prev,
      [pin]: prev[pin] ? 0 : 1
    }));
  };

  const setAnalogInput = (pin, value) => {
    if (pin == null) return;
    setInputs(prev => ({
      ...prev,
      [pin]: value
    }));
  };

  const handleToggleBit = (regName, bitIndex) => {
    if (timeline && timeline.length > 0) return;

    setManualRegisters(prev => {
      const newRegs = { ...prev };
      const arr = [...newRegs[regName]];
      arr[bitIndex] = arr[bitIndex] === 1 ? 0 : 1;
      
      if (regName.startsWith('PORT')) {
          const pinName = 'PIN' + regName.charAt(regName.length - 1);
          newRegs[pinName] = [...arr];
      }
      if (regName.startsWith('PIN')) {
          const portName = 'PORT' + regName.charAt(regName.length - 1);
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
    return currentRegisters?.PWM?.[p] || (getPinLogic(p) ? 255 : 0);
  };

  return (
    <div style={styles.app}>
      {/* TOP NAVIGATION BAR */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button style={styles.backBtn} onClick={() => navigate("/")}>
            ← Labs
          </button>
          <select 
            style={styles.dropdown}
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
          </select>
        </div>
        
        <div style={styles.titleBlock}>
          <span style={styles.titleIcon}>⬡</span>
          <span style={styles.titleLabel}>ATmega328P Sandbox</span>
        </div>

        <button style={styles.runButton} onClick={runCode}>
          ▶ RUN
        </button>
      </div>

      {/* BODY LAYOUT */}
      <div style={styles.body}>
        {/* Slide Toggle for Editor */}
        <button 
          style={{ ...styles.floatingBtn, left: isEditorOpen ? 360 : 10 }}
          onClick={() => setIsEditorOpen(!isEditorOpen)}
        >
          {isEditorOpen ? "◀" : "Code ▶"}
        </button>

        {/* Slide Toggle for Analyzer */}
        <button 
          style={{ ...styles.floatingBtn, right: isAnalyzerOpen ? 460 : 10, left: "auto" }}
          onClick={() => setIsAnalyzerOpen(!isAnalyzerOpen)}
        >
          {isAnalyzerOpen ? "▶" : "◀ Output"}
        </button>

        {/* LEFT: Editor Panel */}
        <div style={{...styles.leftColumn, marginLeft: isEditorOpen ? 0 : "-350px"}}>
          <EditorPanel
            code={code}
            setCode={setCode}
            registers={currentRegisters}
            onToggleBit={handleToggleBit}
            hexOutput={hexOutput}
            hexError={hexError}
          />
          <HardwareConfigPanel 
            manualRegisters={manualRegisters} 
            setManualRegisters={setManualRegisters} 
          />
        </div>

        {/* CENTER: Chip + Workspace — contained so it doesn't overlap */}
        <div style={styles.chipColumn}>
          <div style={styles.chipContainer}>
            <Chip
              registers={currentRegisters}
              toggleInput={toggleInput}
            />
            
            {/* Workspace Area: External Components */}
            {workspaceItems.map(item => {
              const itemPins = item.pins || { main: item.pin };
              const configState = getPinLogic(itemPins.main);
              const analogState = getPinAnalog(itemPins.main);

              let terminals = [{ id: "main", label: "PIN" }];
              if (item.type === "RGB_LED") {
                  terminals = [
                      { id: "r", label: "R", color: "#ff3333" },
                      { id: "g", label: "G", color: "#33ff33" },
                      { id: "b", label: "B", color: "#3333ff" }
                  ];
              } else if (item.type === "SEVEN_SEG") {
                  terminals = [
                    { id: "a", label: "A", color: "#ff6666" },
                    { id: "b", label: "B", color: "#ff9966" },
                    { id: "c", label: "C", color: "#ffcc66" },
                    { id: "d", label: "D", color: "#ffff66" },
                    { id: "e", label: "E", color: "#ccff66" },
                    { id: "f", label: "F", color: "#99ff66" },
                    { id: "g", label: "G", color: "#66ff66" }
                  ];
              } else if (item.type === "SERVO") {
                  terminals = [{ id: "main", label: "SIG", color: "#ff6600"}];
              }

              return (
                <DraggableWrapper 
                  key={item.id} 
                  id={item.id}
                  initialX={item.x} 
                  initialY={item.y}
                  terminals={terminals}
                  onStartWire={startWire}
                  onDelete={deleteComponent}
                >
                  {item.type === "LED_RED" && <ExternalLED color="red" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />}
                  {item.type === "LED_GREEN" && <ExternalLED color="green" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />}
                  {item.type === "LED_YELLOW" && <ExternalLED color="yellow" state={configState} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />}
                  {item.type === "RESISTOR" && <Resistor />}
                  {item.type === "BUTTON" && (
                    <div onMouseDown={() => toggleInput(item.pin)}>
                      <PushButton state={inputs[item.pin] === 1} label={item.pin ? `Pin ${item.pin}` : "Unwired"} />
                    </div>
                  )}
                  {item.type === "DIAL" && (
                    <Dial 
                      value={inputs[item.pin] || 0} 
                      onChange={(val) => setAnalogInput(item.pin, val)} 
                      label={item.pin ? `Pin ${item.pin}` : "Unwired"} 
                    />
                  )}
                  {item.type === "MULTIMETER" && (
                    <Multimeter 
                      value={analogState > 0 ? (analogState/255)*1023 : 0} 
                      label={item.pin ? `Pin ${item.pin} Reading` : "Unwired"} 
                    />
                  )}
                  {item.type === "RGB_LED" && (
                    <RGB_LED 
                      rState={getPinLogic(itemPins.r)} 
                      gState={getPinLogic(itemPins.g)} 
                      bState={getPinLogic(itemPins.b)} 
                    />
                  )}
                  {item.type === "SERVO" && (
                    <Servo 
                      angle={analogState > 0 ? (analogState / 255) * 180 : 0} 
                    />
                  )}
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
                </DraggableWrapper>
              );
            })}
          </div>
        </div>
          
        <WiringCanvas items={workspaceItems} activeWire={activeWire} />

        {/* RIGHT: Analysis Panel */}
        <div style={{...styles.analyzerColumn, marginRight: isAnalyzerOpen ? 0 : "-450px"}}>
          {hexError && (
            <div style={{ color: "#ff3333", background: "#330000", padding: "10px", fontFamily: "monospace", fontSize: 13, marginBottom: 10, borderRadius: "5px", border: "1px solid #ff3333" }}>
               <strong>COMPILATION FAILED:</strong><br/>
               {hexError}
            </div>
          )}
          
          {(isRunning && liveTimeline.length > 0) ? (
            <>
               <div style={{ color: "#00ffcc", fontFamily: "monospace", fontSize: 13, marginBottom: 10 }}>
                 LIVE: CPU RUNNING AT 16 MHz 
                 <span style={{color: "#888", marginLeft: "10px"}}>(HEX Size: {hexOutput.length} bytes)</span>
               </div>
               <SimulationControls
                 totalSteps={liveTimeline.length}
                 currentStep={liveTimeline.length - 1}
                 onStepChange={() => {}}
                 isPlaying={true}
                 setIsPlaying={() => {
                   stopSimulation();
                   setIsPlaying(false);
                 }}
               />
               <SerialMonitor timeline={liveTimeline} currentStep={liveTimeline.length - 1} />
               <LogicAnalyzer timeline={liveTimeline} currentStep={liveTimeline.length - 1} initialPins={[13, 2]} />
            </>
          ) : timeline.length > 0 ? (
            <>
              <SimulationControls
                totalSteps={timeline.length}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
              />
              <SerialMonitor timeline={timeline} currentStep={currentStep} />
              <LogicAnalyzer timeline={timeline} currentStep={currentStep} initialPins={[13, 2]} />
            </>
          ) : (
            <div style={{ color: "#555", margin: "auto", fontFamily: "monospace" }}>Run simulation to view outputs</div>
          )}
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    background: "#000",
    color: "white",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  topBar: {
    width: "100%",
    height: "56px",
    flexShrink: 0,
    background: "#0a0a0a",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    zIndex: 150,
  },
  backBtn: {
    background: "none",
    border: "1px solid #333",
    color: "#888",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
  },
  titleBlock: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  titleIcon: {
    color: "#00ffcc",
    fontSize: "20px",
  },
  titleLabel: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    letterSpacing: "-0.3px",
  },
  dropdown: {
    background: "#111",
    color: "#00ffcc",
    border: "1px solid #222",
    padding: "7px 12px",
    borderRadius: "6px",
    fontFamily: "monospace",
    cursor: "pointer",
    outline: "none",
    fontWeight: "bold",
    fontSize: "12px",
  },
  runButton: {
    padding: "8px 20px",
    background: "linear-gradient(135deg, #00ff88, #00ccaa)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0, 255, 136, 0.3)",
  },
  body: {
    flex: 1,
    display: "flex",
    position: "relative",
    overflow: "hidden",
  },
  leftColumn: {
    width: "350px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    background: "#0a0a0a",
    borderRight: "1px solid #1a1a1a",
    boxSizing: "border-box",
    overflowY: "auto",
    transition: "margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 100,
  },
  chipColumn: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  chipContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    /* Prevent chip from bleeding outside this container */
    overflow: "hidden",
  },
  analyzerColumn: {
    width: "450px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "20px",
    background: "#050505",
    borderLeft: "1px solid #1a1a1a",
    overflowY: "auto",
    overflowX: "hidden",
    transition: "margin-right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 100,
  },
  floatingBtn: {
    position: "absolute",
    top: 16,
    zIndex: 120,
    background: "#00ffcc",
    color: "#000",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "monospace",
    fontSize: "12px",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    boxShadow: "0 4px 10px rgba(0, 255, 136, 0.3)",
  },
};
