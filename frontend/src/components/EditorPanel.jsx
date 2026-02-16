import RegisterPanel from "./RegisterPanel";

function EditorPanel({ code, setCode, runCode, registers }) {
  return (
    <div style={styles.panel}>
      <h2>Code Editor</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        style={styles.textarea}
      />

      <button onClick={runCode} style={styles.button}>
        Run Simulation
      </button>

      {registers && <RegisterPanel registers={registers} />}
    </div>
  );
}

const styles = {
  panel: {
    width: "35%",
    padding: 30,
    borderRight: "1px solid #222",
    background: "#0f0f0f",
    overflowY: "auto"
  },
  textarea: {
    width: "100%",
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
