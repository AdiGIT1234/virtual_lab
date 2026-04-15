import React from 'react';

const Dial = ({ 
  value = 0, 
  onChange, 
  label = "Precision Rotary", 
  min = 0, 
  max = 10000, 
  unit = "Ω" 
}) => {
  const dialRef = React.useRef(null);
  
  // Angle: -135deg to +135deg
  const angle = ((value - min) / (max - min)) * 270 - 135;

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const updateValue = (moveEvent) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      
      // Calculate angle in degrees
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;
      
      // Map 225-360 and 0-135 to -135 to 135 range
      let normalizedAngle;
      if (deg >= 225) {
        normalizedAngle = deg - 360; 
      } else if (deg <= 135) {
        normalizedAngle = deg;
      } else {
        // Dead zone
        return;
      }

      // Map -135..135 to 0..1
      const percent = (normalizedAngle + 135) / 270;
      const newValue = min + percent * (max - min);
      onChange?.(Math.round(newValue));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', updateValue);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', updateValue);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>{label}</div>
      
      <div 
        ref={dialRef}
        onMouseDown={handleMouseDown}
        style={styles.dialContainer}
      >
        {/* Ticks */}
        <div style={styles.ticks} />
        
        {/* Knob */}
        <div style={{
          ...styles.knob,
          transform: `rotate(${angle}deg)`,
        }}>
           <div style={styles.pointer} />
           <div style={styles.knobHighlight} />
        </div>
      </div>
      
      <div style={styles.readout}>
        {Math.round(value).toLocaleString()} <span style={styles.unit}>{unit}</span>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
    gap: "8px",
    padding: "16px",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "20px",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  label: {
    color: "#64748b",
    fontFamily: "Inter, sans-serif",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: "600",
  },
  dialContainer: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    background: "#0f172a",
    boxShadow: "0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.05)",
    position: "relative",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  ticks: {
    position: "absolute",
    width: "85%",
    height: "85%",
    borderRadius: "50%",
    border: "2px dotted rgba(255,255,255,0.15)",
    boxSizing: "border-box",
  },
  knob: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #1e293b, #0f172a)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
    position: "relative",
    transition: "transform 0.1s ease-out",
    border: "1px solid rgba(0,0,0,0.5)",
  },
  pointer: {
    position: "absolute",
    top: 6,
    left: "50%",
    transform: "translateX(-50%)",
    width: 3,
    height: 10,
    background: "#22d3ee",
    borderRadius: 99,
    boxShadow: "0 0 10px rgba(34, 211, 238, 0.6)"
  },
  knobHighlight: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 70%)",
  },
  readout: {
    color: "#22d3ee",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    background: "#020617",
    border: "1px solid rgba(103,232,249,0.2)",
    padding: "4px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
  },
  unit: {
    fontSize: "10px",
    color: "#64748b",
    marginLeft: "2px",
  }
};

export default Dial;
