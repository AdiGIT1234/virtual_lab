import { useState, useMemo, useRef, useEffect } from "react";
import EditorPanel from "./components/EditorPanel";
import Chip from "./components/Chip";
import SimulationControls from "./components/SimulationControls";
import LogicAnalyzer from "./components/LogicAnalyzer";
import SerialMonitor from "./components/SerialMonitor";
import ExternalLED from "./components/ExternalLED";
import Resistor from "./components/Resistor";
import PushButton from "./components/PushButton";
import Dial from "./components/Dial";
import Multimeter from "./components/Multimeter";
import DraggableWrapper from "./components/DraggableWrapper";
import WiringCanvas from "./components/WiringCanvas";

function App() {
  const [code, setCode] = useState(`Serial.begin(9600);
Serial.println("System starting...");
delay(500);
pinMode(13, OUTPUT);
digitalWrite(13, HIGH);
Serial.println("LED is ON");
delay(500);
digitalWrite(13, LOW);
Serial.println("LED is OFF");`);

  // State for timeline playback
  const [timeline, setTimeline] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
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

  // Inputs remain separate for now (static per run)
  const [inputs, setInputs] = useState({});

  // Derived state: current registers based on timeline step
  const currentRegisters = useMemo(() => {
    if (!timeline || timeline.length === 0) return null;
    // ensure step is within bounds
    const step = Math.min(Math.max(0, currentStep), timeline.length - 1);
    return timeline[step]?.registers || null;
  }, [timeline, currentStep]);

  const runCode = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/run-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inputs })
      });

      const data = await response.json();
      
      if (data.timeline && data.timeline.length > 0) {
        setTimeline(data.timeline);
        setCurrentStep(0);
        setIsPlaying(true); // Auto-play when simulation starts
        setIsAnalyzerOpen(true); // Auto-open the results pane
      } else {
        // Fallback if no timeline (shouldn't happen with new backend)
        setTimeline([]);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    }
  };

  const addComponent = (type) => {
    const newItem = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      pin: "",
      x: window.innerWidth / 2 - 30, // Center approx
      y: window.innerHeight / 2 - 50
    };
    setWorkspaceItems([...workspaceItems, newItem]);
  };

  const updateComponentPin = (id, newPin) => {
    setWorkspaceItems(prev => prev.map(item => 
      item.id === id ? { ...item, pin: parseInt(newPin, 10) } : item
    ));
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
        updateComponentPin(activeWireRef.current.sourceId, pin);
      }
      setActiveWire(null);
      activeWireRef.current = null;
    };

    const handleGlobalMouseUp = () => {
      // Small timeout allows pin drop handler to fire first
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

  return (
    <div style={styles.app}>

      {/* TOP NAVIGATION BAR */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <select 
            style={styles.dropdown}
            onChange={(e) => {
              if (e.target.value) {
                addComponent(e.target.value);
                e.target.value = ""; // reset
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
          </select>
        </div>
        
        <button style={styles.runButton} onClick={runCode}>
          ▶ RUN SIMULATION
        </button>
        
        <div style={{ width: '150px' }}></div> {/* Spacer for symmetry */}
      </div>

      {/* Slide Toggle for Editor */}
      <button 
        style={{ ...styles.floatingBtn, left: isEditorOpen ? 360 : 10 }}
        onClick={() => setIsEditorOpen(!isEditorOpen)}
      >
        {isEditorOpen ? "◀" : "Code Editor ▶"}
      </button>

      {/* Slide Toggle for Analyzer */}
      <button 
        style={{ ...styles.floatingBtn, right: isAnalyzerOpen ? 460 : 10 }}
        onClick={() => setIsAnalyzerOpen(!isAnalyzerOpen)}
      >
        {isAnalyzerOpen ? "▶" : "◀ Output"}
      </button>

      <div style={{...styles.leftColumn, marginLeft: isEditorOpen ? 0 : "-350px"}}>
        <EditorPanel
          code={code}
          setCode={setCode}
          runCode={runCode}
          registers={currentRegisters}
        />
      </div>

      <div style={styles.chipColumn}>
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Chip
            registers={currentRegisters}
            toggleInput={toggleInput}
          />
          
          {/* Workspace Area: External Components */}
          {workspaceItems.map(item => {
            let configState = false;
            // Digital pins are mapped 0-7 -> PORTD, 8-13 -> PORTB, 14-19 -> PORTC
            if (item.pin !== "" && !isNaN(item.pin)) {
              const p = item.pin;
              if (p <= 7) configState = currentRegisters?.PORTD?.[p] === 1;
              else if (p <= 13) configState = currentRegisters?.PORTB?.[p - 8] === 1;
              else if (p >= 14 && p <= 19) configState = currentRegisters?.PORTC?.[p - 14] === 1;
            }

            return (
              <DraggableWrapper 
                key={item.id} 
                id={item.id}
                initialX={item.x} 
                initialY={item.y}
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
                    value={configState ? 1023 : 0} 
                    label={item.pin ? `Pin ${item.pin} Reading` : "Unwired"} 
                  />
                )}
              </DraggableWrapper>
            );
          })}
        </div>
      </div>
        
      <WiringCanvas items={workspaceItems} activeWire={activeWire} />

      <div style={{...styles.analyzerColumn, marginRight: isAnalyzerOpen ? 0 : "-450px"}}>
        {timeline.length > 0 ? (
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
  );
}

const styles = {
  app: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    width: "100vw",
    background: "#000",
    color: "white",
    overflow: "hidden",
    paddingTop: "60px", // Accommodate TopBar
    boxSizing: "border-box"
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "60px",
    background: "#111",
    borderBottom: "1px solid #222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    zIndex: 50,
  },
  dropdown: {
    background: "#222",
    color: "#00ffcc",
    border: "1px solid #333",
    padding: "8px 12px",
    borderRadius: "6px",
    fontFamily: "monospace",
    cursor: "pointer",
    outline: "none",
    fontWeight: "bold"
  },
  runButton: {
    padding: "10px 24px",
    background: "#00ff88",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0, 255, 136, 0.4)",
    transition: "all 0.2s"
  },
  leftColumn: {
    width: "350px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    background: "#0f0f0f",
    borderRight: "1px solid #222",
    boxSizing: "border-box",
    overflowY: "auto",
    transition: "margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 10
  },
  chipColumn: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflowY: "auto",
    padding: "20px"
  },
  analyzerColumn: {
    width: "450px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "20px",
    background: "#080808",
    borderLeft: "1px solid #222",
    overflowY: "auto",
    overflowX: "hidden",
    transition: "margin-right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 10
  },
  floatingBtn: {
    position: "absolute",
    top: 80, // Moved down to avoid overlapping the 60px TopBar
    zIndex: 20,
    background: "#00ff88",
    color: "#000",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "monospace",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    boxShadow: "0 4px 10px rgba(0, 255, 136, 0.3)"
  }
};

export default App;
