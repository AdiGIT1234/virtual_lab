import { useState } from "react";
import EditorPanel from "./components/EditorPanel";
import Chip from "./components/Chip";

function App() {
  const [code, setCode] = useState(`pinMode(13, OUTPUT);
digitalWrite(13, HIGH);`);

  const [registers, setRegisters] = useState(null);
  const [inputs, setInputs] = useState({});

  const runCode = async () => {
    const response = await fetch("http://127.0.0.1:8000/run-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, inputs })
    });

    const data = await response.json();
    setRegisters(data.registers);
  };

  const toggleInput = (pin) => {
    if (pin == null) return;
    setInputs(prev => ({
      ...prev,
      [pin]: prev[pin] ? 0 : 1
    }));
  };

  return (
    <div style={styles.app}>
      <EditorPanel
        code={code}
        setCode={setCode}
        runCode={runCode}
        registers={registers}
      />

      <Chip
        registers={registers}
        toggleInput={toggleInput}
      />
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#000",
    color: "white"
  }
};

export default App;
