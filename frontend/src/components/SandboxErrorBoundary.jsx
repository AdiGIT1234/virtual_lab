import React from "react";

class SandboxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Sandbox Crash Detected:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Attempt soft recovery — only reset error boundary state, not the whole page
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorText = [
        this.state.error?.toString(),
        this.state.errorInfo?.componentStack,
      ]
        .filter(Boolean)
        .join("\n\n");

      return (
        <div style={{
          padding: "40px",
          background: "#0a0a14",
          color: "#ff4444",
          fontFamily: "monospace",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>⚠️ System Fault Detected</h2>
          <p style={{ color: "#aaa", maxWidth: "520px", marginBottom: "8px", lineHeight: 1.5 }}>
            A simulation component crashed. This can happen when invalid register
            values are written, memory is overflowed, or an unsupported opcode is
            executed. Your circuit is still intact — try resetting below.
          </p>
          <pre style={{
            background: "#000",
            padding: "16px 20px",
            borderRadius: "8px",
            fontSize: "11px",
            textAlign: "left",
            maxWidth: "90vw",
            maxHeight: "200px",
            overflow: "auto",
            border: "1px solid #333",
            marginBottom: "24px",
            userSelect: "text",
          }}>
            {errorText}
          </pre>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "12px 24px",
                background: "#00F2FF",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ↺ Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "#888",
                border: "1px solid #444",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Full Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SandboxErrorBoundary;
