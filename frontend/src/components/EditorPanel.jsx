import { useState } from "react";
import RegisterPanel from "./RegisterPanel";

function EditorPanel({ code, setCode, registers }) {
  const [showRegisters, setShowRegisters] = useState(false);
  return (
    <div style={styles.panel}>
      <h2>Code Editor</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        style={styles.textarea}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowRegisters(!showRegisters)} 
          style={{...styles.button, background: "#333", color: "#fff"}}
        >
          {showRegisters ? "Hide Registers" : "View Registers"}
        </button>
      </div>

      {showRegisters && registers && <RegisterPanel registers={registers} />}
    </div>
  );
}

const styles = {
  panel: {
    padding: 20,
    width: "100%",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1a1a1a",
    color: "#00ffcc",
    border: "1px solid #333",
    padding: 12,
    fontFamily: "monospace",
    marginBottom: 15
  },
  button: {
    padding: "10px 18px",
    background: "#00ff88",
    border: "none",
    cursor: "pointer",
    borderRadius: 6
  }
};

export default EditorPanel;
