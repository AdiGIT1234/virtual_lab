import React, { useEffect, useRef } from "react";

function SerialMonitor({ timeline, currentStep }) {
  const containerRef = useRef(null);

  // We only want to show serial events that have occurred UP TO the current step
  // timeline looks like [{ time, type: "SERIAL_PRINT", message: "..." }, ...]
  
  const serialEvents = [];
  
  for (let i = 0; i <= currentStep; i++) {
    const event = timeline[i];
    if (event && (event.type === "SERIAL_PRINT" || event.type === "SERIAL_BEGIN")) {
      serialEvents.push({ ...event, index: i });
    }
  }

  // Auto-scroll to bottom like a real terminal
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [serialEvents.length]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Serial Monitor</h3>
        <span style={styles.baud}>COM3 • 9600 baud</span>
      </div>
      
      <div style={styles.terminal} ref={containerRef}>
        {serialEvents.length === 0 ? (
          <div style={styles.placeholder}>No serial data...</div>
        ) : (
          serialEvents.map((evt) => (
            <React.Fragment key={evt.index}>
              {evt.type === "SERIAL_BEGIN" && (
                <div style={styles.systemMsg}>
                  [System] Serial Port Opened at {evt.baud} baud
                </div>
              )}
              {evt.type === "SERIAL_PRINT" && (
                <span style={styles.logText}>
                  {/* Keep text continuous, only break on actual newlines if we want to mimic print vs println. The msg already has \n if println was used. */}
                  {evt.message}
                </span>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "200px",
    background: "#121212",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.5)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 15px",
    background: "#1a1a1a",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#fff",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  baud: {
    fontSize: "0.8rem",
    color: "#888",
    fontFamily: "sans-serif",
  },
  terminal: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#00ffcc",
    lineHeight: "1.4",
    whiteSpace: "pre-wrap", // Respects \n natively
    wordWrap: "break-word"
  },
  placeholder: {
    color: "#555",
    fontStyle: "italic",
  },
  systemMsg: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: "5px",
  },
  logText: {
    // nothing special needed, inherits color and generic monospace config
  }
};

export default SerialMonitor;
