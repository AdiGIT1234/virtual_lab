import { useState, useEffect } from "react";
import GpioView from "./components/GpioView";

function App() {
  const [code, setCode] = useState(`pinMode(13, OUTPUT);
digitalWrite(13, HIGH);`);

  // Backend truth
  const [ledMode, setLedMode] = useState("OFF");
  const [validation, setValidation] = useState(null);
  const [experiment, setExperiment] = useState(null);

  // Visual state
  const [ledOn, setLedOn] = useState(false);

  // Input pin values: { pin: 0|1 }. Includes GPIO 2 button and GpioView toggles.
  const [inputs, setInputs] = useState({ 2: 0 });
  const [buttonValue, setButtonValue] = useState(null);

  const [registers, setRegisters] = useState(null);

  const handleInputChange = (pin, value) => {
    setInputs((prev) => ({ ...prev, [pin]: value }));
  };

  const runCode = async () => {
    const response = await fetch("http://127.0.0.1:8000/run-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        inputs,
      }),
    });

    const data = await response.json();

    setExperiment(data.experiment);
    setLedMode(data.led);
    setValidation(data.validation);
    setButtonValue(data.button ?? null);
    setRegisters(data.registers ?? null);

    if (data.led === "ON") {
      setLedOn(true);
    } else {
      setLedOn(false);
    }
  };

  // Blinking animation (future-ready)
  useEffect(() => {
    let interval = null;

    if (ledMode === "BLINKING") {
      interval = setInterval(() => {
        setLedOn((prev) => !prev);
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ledMode]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Virtual Lab</h1>

      {/* Experiment Info */}
      {experiment && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2>{experiment.title}</h2>
          <p style={{ color: "#555" }}>{experiment.description}</p>
        </div>
      )}

      {/* Code Editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={8}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <br /><br />

      <button onClick={runCode}>Run</button>

      {/* Button Input */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => handleInputChange(2, inputs[2] ? 0 : 1)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: inputs[2] ? "#4caf50" : "#ccc",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          GPIO 2 Button: {inputs[2] ? "Pressed" : "Released"}
        </button>

        {buttonValue && (
          <span style={{ marginLeft: "0.5rem" }}>→ {buttonValue}</span>
        )}
      </div>

      {/* LED */}
      <div style={{ marginTop: "2rem" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: ledOn ? "red" : "#333",
          }}
        />
        <p>LED Mode: {ledMode}</p>
      </div>

      {/* GPIO Registers */}
      {registers && (
        <div style={{ marginTop: "2rem" }}>
          <h3>GPIO Registers</h3>
          <GpioView registers={registers} onInputChange={handleInputChange} />
        </div>
      )}

      {/* Validation Result */}
      {validation && (
        <div style={{ marginTop: "2rem" }}>
          <h3>
            Result:{" "}
            <span style={{ color: validation.passed ? "green" : "red" }}>
              {validation.passed ? "PASS" : "FAIL"}
            </span>
          </h3>

          {!validation.passed && validation.feedback?.length > 0 && (
            <ul>
              {validation.feedback.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
