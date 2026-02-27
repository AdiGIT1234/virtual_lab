import { useState } from "react";
import RegisterPanel from "./RegisterPanel";

function EditorPanel({ code, setCode, registers, onToggleBit, hexOutput, hexError }) {
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

      {showRegisters && registers && <RegisterPanel registers={registers} onToggleBit={onToggleBit} />}

      {(hexOutput || hexError) && (
        <div style={styles.hexPanel}>
          <h4 style={styles.hexHeader}>AVR-GCC Compilation Status</h4>
          {hexError ? (
            <pre style={styles.errorText}>{hexError}</pre>
          ) : (
            <div>
              <div style={{ color: "#00ff88", fontSize: "12px", marginBottom: "8px" }}>Compiled to Intel HEX Successfully!</div>
              <textarea readOnly value={hexOutput} style={styles.hexArea} rows={6} />
            </div>
          )}
        </div>
      )}
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
  },
  hexPanel: {
    marginTop: 15,
    background: "#121212",
    padding: 12,
    borderRadius: 6,
    border: "1px solid #333"
  },
  hexHeader: {
    margin: "0 0 10px 0",
    color: "#00ccff",
    fontSize: "14px",
    fontFamily: "monospace"
  },
  hexArea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#050505",
    color: "#aaa",
    border: "1px solid #222",
    padding: 8,
    fontFamily: "monospace",
    fontSize: "10px"
  },
  errorText: {
    color: "#ff3333",
    fontSize: "11px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap"
  }
};

export default EditorPanel;
