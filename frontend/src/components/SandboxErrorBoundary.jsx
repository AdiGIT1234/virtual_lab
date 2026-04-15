import React from "react";

class SandboxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Sandbox Crash Detected:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#0a0a14',
          color: '#ff4444',
          fontFamily: 'monospace',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>⚠️ System Fault Detected</h2>
          <p style={{ color: '#888', maxWidth: '500px', marginBottom: '30px' }}>
            A simulation component crashed. This usually happens when an invalid memory address is accessed or a hardware register is misconfigured.
          </p>
          <pre style={{ 
            background: '#000', 
            padding: '20px', 
            borderRadius: '8px', 
            fontSize: '11px',
            textAlign: 'left',
            maxWidth: '90vw',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px',
              padding: '12px 24px',
              background: '#00F2FF',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reboot Simulation
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SandboxErrorBoundary;
