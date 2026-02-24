import React from 'react';

const SevenSegment = ({ a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, dp = 0, label = "7-Segment" }) => {
  const S_WIDTH = 50;
  const S_HEIGHT = 80;
  
  // Basic segment shapes
  const renderHoriz = (cx, cy, on) => (
    <polygon
      points={`${cx-12},${cy} ${cx-8},${cy-4} ${cx+8},${cy-4} ${cx+12},${cy} ${cx+8},${cy+4} ${cx-8},${cy+4}`}
      fill={on ? "#ff0000" : "#3a0000"}
      style={{ filter: on ? "drop-shadow(0 0 5px #ff0000)" : "none" }}
    />
  );
  
  const renderVert = (cx, cy, on) => (
    <polygon
      points={`${cx},${cy-12} ${cx-4},${cy-8} ${cx-4},${cy+8} ${cx},${cy+12} ${cx+4},${cy+8} ${cx+4},${cy-8}`}
      fill={on ? "#ff0000" : "#3a0000"}
      style={{ filter: on ? "drop-shadow(0 0 5px #ff0000)" : "none" }}
    />
  );

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
      <div style={{
        width: S_WIDTH,
        height: S_HEIGHT,
        background: "#0a0a0a",
        border: "2px solid #222",
        borderRadius: 4,
        position: "relative",
        boxShadow: "0 4px 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.05)"
      }}>
        <svg width={S_WIDTH} height={S_HEIGHT} viewBox={`0 0 ${S_WIDTH} ${S_HEIGHT}`}>
          {renderHoriz(25, 12, a)}      {/* A (Top) */}
          {renderVert(40, 27, b)}       {/* B (Top Right) */}
          {renderVert(40, 53, c)}       {/* C (Bot Right) */}
          {renderHoriz(25, 68, d)}      {/* D (Bot) */}
          {renderVert(10, 53, e)}       {/* E (Bot Left) */}
          {renderVert(10, 27, f)}       {/* F (Top Left) */}
          {renderHoriz(25, 40, g)}      {/* G (Middle) */}
          
          {/* Decimal Point */}
          <circle cx="42" cy="72" r="3" fill={dp ? "#ff0000" : "#3a0000"} style={{ filter: dp ? "drop-shadow(0 0 5px #ff0000)" : "none" }} />
        </svg>
      </div>
    </div>
  );
};

export default SevenSegment;
