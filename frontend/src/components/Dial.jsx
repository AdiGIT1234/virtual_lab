import React from 'react';

const Dial = ({ value = 0, onChange, label = "Potentiometer" }) => {
  // value expected to be 0 to 1023
  
  // Calculate rotation angle (0 to 1023 -> -135deg to +135deg)
  const angle = (value / 1023) * 270 - 135;

  const handleDrag = () => {
    const updateDial = (moveEvent) => {
      // In a real app we'd calculate atan2 based on the center of the dial.
      // For simplicity, let's just use vertical mouse movement to adjust value.
      let deltaY = moveEvent.movementY;
      let newValue = value - deltaY * 10;
      newValue = Math.max(0, Math.min(1023, newValue));
      if (onChange) onChange(newValue);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', updateDial);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', updateDial);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        color: "#ccc",
        fontFamily: "monospace",
        fontSize: "10px",
        marginBottom: "4px",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 6px",
        borderRadius: "4px"
      }}>
        {label}
      </div>
      
      {/* Container for Dial */}
      <div 
        onMouseDown={handleDrag}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #333, #111)",
          boxShadow: "0 8px 15px rgba(0,0,0,0.8), inset 0 2px 2px rgba(255,255,255,0.1)",
          position: "relative",
          cursor: "ns-resize",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "2px solid #000"
        }}
      >
        {/* Outer Ring Ticks */}
        <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px dashed #444", boxSizing: "border-box", opacity: 0.5 }}></div>
        
        {/* Inner Knob */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #444, #222)",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 6px rgba(0,0,0,0.6)",
          position: "relative",
          transform: `rotate(${angle}deg)`,
          transition: "transform 0.05s"
        }}>
           {/* Indicator line on the knob */}
           <div style={{
             position: "absolute",
             top: 4,
             left: 20,
             width: 4,
             height: 12,
             background: "#00ffcc",
             borderRadius: 2,
             boxShadow: "0 0 5px #00ffcc"
           }} />
        </div>
      </div>
      
      {/* Readout */}
      <div style={{
        marginTop: "8px",
        color: "#00ffcc",
        fontFamily: "monospace",
        fontSize: "12px",
        background: "#000",
        border: "1px solid #333",
        padding: "2px 8px",
        borderRadius: "4px",
        fontWeight: "bold"
      }}>
        {Math.round(value)}
      </div>
    </div>
  );
};

export default Dial;
