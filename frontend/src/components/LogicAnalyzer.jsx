import React, { useState } from "react";

const getPinState = (registers, arduinoPin) => {
  if (!registers || arduinoPin == null) return false;
  if (arduinoPin <= 7) return registers.PORTD?.[arduinoPin] === 1;
  if (arduinoPin <= 13) return registers.PORTB?.[arduinoPin - 8] === 1;
  if (arduinoPin >= 14 && arduinoPin <= 19) return registers.PORTC?.[arduinoPin - 14] === 1;
  return false;
};

const LogicAnalyzer = ({ timeline, currentStep, initialPins = [13, 2] }) => {
  const [selectedPins, setSelectedPins] = useState(initialPins);

  if (!timeline || timeline.length === 0) return null;

  // Colors for logic analyzer tracks
  const TRACK_COLORS = [
    "#00ff88", "#00d2ff", "#ff007f", "#ffff00", 
    "#ff6600", "#b500ff", "#00ffcc", "#ff3333"
  ];

  const togglePin = (pin) => {
    setSelectedPins((prev) => 
      prev.includes(pin) ? prev.filter(p => p !== pin) : [...prev, pin].sort((a,b) => a-b)
    );
  };

  // We are using a fixed SVG layout, responsive could be added later
  const SVG_WIDTH = 700;
  const SVG_HEIGHT = Math.max(120, 60 + (selectedPins.length * 50)); // increased height per track
  const MARGIN_X = 80;
  const MARGIN_Y = 30;

  const trackHeight = selectedPins.length > 0 ? (SVG_HEIGHT - 2 * MARGIN_Y) / selectedPins.length : 0;
  const steps = timeline.length;
  // Handle edge case of 1 step
  const stepWidth = steps > 1 ? (SVG_WIDTH - 2 * MARGIN_X) / (steps - 1) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Logic Analyzer (Oscilloscope)</h3>
      </div>
      
      <div style={styles.pinSelector}>
        <span style={styles.selectorLabel}>Channels:</span>
        {[...Array(20)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => togglePin(i)}
            style={{
              ...styles.pinButton, 
              backgroundColor: selectedPins.includes(i) ? "#00ff88" : "transparent",
              color: selectedPins.includes(i) ? "#000" : "#888",
              borderColor: selectedPins.includes(i) ? "#00ff88" : "#444"
            }}
          >
            {i < 14 ? `D${i}` : `A${i-14}`}
          </button>
        ))}
      </div>

      <div style={styles.scrollWrapper}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={styles.svg}>
          
          {/* Timeline Grid (Vertical lines per step) */}
          {timeline.map((snapshot, i) => (
            <g key={`grid-${i}`}>
               <line 
                x1={MARGIN_X + i * stepWidth} 
                y1={MARGIN_Y} 
                x2={MARGIN_X + i * stepWidth} 
                y2={SVG_HEIGHT - MARGIN_Y} 
                stroke="#333" 
                strokeWidth="1" 
                strokeDasharray="2,2"
              />
              <text 
                x={MARGIN_X + i * stepWidth} 
                y={SVG_HEIGHT - 5} 
                fill="#666" 
                fontSize="10" 
                fontFamily="monospace"
                textAnchor="middle"
              >
                t={Math.round(snapshot.time)}
              </text>
            </g>
          ))}

          {/* Current Step Playhead */}
          {currentStep !== undefined && (
            <g>
              <line 
                x1={MARGIN_X + currentStep * stepWidth} 
                y1={10} 
                x2={MARGIN_X + currentStep * stepWidth} 
                y2={SVG_HEIGHT - 10} 
                stroke="#ff3333" 
                strokeWidth="2" 
              />
              <polygon 
                points={`
                  ${MARGIN_X + currentStep * stepWidth - 5},10 
                  ${MARGIN_X + currentStep * stepWidth + 5},10 
                  ${MARGIN_X + currentStep * stepWidth},20
                `} 
                fill="#ff3333" 
              />
            </g>
          )}

          {/* Signal Tracks */}
          {selectedPins.length === 0 && (
            <text x={SVG_WIDTH/2} y={SVG_HEIGHT/2} fill="#666" textAnchor="middle" fontFamily="monospace">
              Select a pin block above to view waveform
            </text>
          )}

          {selectedPins.map((pin, trackIdx) => {
            const trackTop = MARGIN_Y + trackIdx * trackHeight + 10;
            const trackBottom = trackTop + trackHeight - 25; // Padding between tracks
            const amplitude = trackBottom - trackTop;
            const color = TRACK_COLORS[trackIdx % TRACK_COLORS.length];

            let pathData = "";
            let prevY = null;

            timeline.forEach((snapshot, i) => {
              const isHigh = getPinState(snapshot.registers, pin);
              const x = MARGIN_X + i * stepWidth;
              const y = isHigh ? trackTop : trackBottom;

              if (i === 0) {
                pathData += `M ${x} ${y}`;
              } else {
                // To make a square wave, we hold the previous Y until the current X
                if (y !== prevY) {
                  pathData += ` L ${x} ${prevY}`;
                }
                pathData += ` L ${x} ${y}`;
              }
              prevY = y;
            });

            return (
              <g key={`track-${pin}`}>
                <text 
                  x="10" 
                  y={trackTop + amplitude / 2 + 4} 
                  fill={color} 
                  fontSize="12" 
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  PIN {pin}
                </text>
                
                {/* Y-Axis Labels */}
                <text x={MARGIN_X - 6} y={trackTop + 3} fill="#888" fontSize="9" fontFamily="monospace" textAnchor="end">1</text>
                <text x={MARGIN_X - 6} y={trackBottom + 3} fill="#888" fontSize="9" fontFamily="monospace" textAnchor="end">0</text>

                {/* Horizontal guide lines for HIGH/LOW */}
                <line x1={MARGIN_X} y1={trackTop} x2={SVG_WIDTH - 10} y2={trackTop} stroke="#1a1a1a" strokeWidth="1" />
                <line x1={MARGIN_X} y1={trackBottom} x2={SVG_WIDTH - 10} y2={trackBottom} stroke="#1a1a1a" strokeWidth="1" />

                {/* Render Event Markers (e.g. circles on state changes) */}
                {timeline.map((snapshot, i) => {
                  const x = MARGIN_X + i * stepWidth;
                  // Look at the previous state to see if there was a transition
                  const prevHigh = i > 0 ? getPinState(timeline[i-1].registers, pin) : false;
                  const isHigh = getPinState(snapshot.registers, pin);
                  if (i > 0 && prevHigh !== isHigh) {
                     return (
                       <circle key={`change-${pin}-${i}`} cx={x} cy={isHigh ? trackTop : trackBottom} r="3" fill="#fff" />
                     )
                  }
                  return null;
                })}

                {/* The Waveform */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2" 
                  strokeLinejoin="round" 
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "#121212",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    marginTop: "1rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.5)"
  },
  title: {
    margin: "0",
    fontSize: "1rem",
    color: "#fff",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  },
  pinSelector: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginBottom: "1rem",
    alignItems: "center"
  },
  selectorLabel: {
    color: "#aaa",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    marginRight: "8px"
  },
  pinButton: {
    padding: "4px 8px",
    borderRadius: "12px",
    border: "1px solid",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s"
  },
  scrollWrapper: {
    overflowX: "auto",
    overflowY: "hidden",
    borderRadius: "8px",
    background: "#0a0a0a",
  },
  svg: {
    display: "block",
  }
};

export default LogicAnalyzer;
