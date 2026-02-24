import React, { useEffect, useState } from 'react';

const WiringCanvas = ({ items, activeWire }) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const updateLines = () => {
      const newLines = [];
      items.forEach(item => {
        // Fallback for legacy single-pin objects
        const pins = item.pins ? item.pins : (item.pin != null && item.pin !== "" ? { main: item.pin } : {});
        
        Object.entries(pins).forEach(([termId, pinVal]) => {
          if (pinVal !== "" && pinVal != null) {
            let compNode = document.getElementById(`comp-terminal-${item.id}-${termId}`);
            if (!compNode) compNode = document.getElementById(`comp-terminal-${item.id}-main`); // Legacy fallback
            if (!compNode) compNode = document.getElementById(`comp-terminal-${item.id}`);
            
            const pinNode = document.getElementById(`chip-pin-${pinVal}`);
            if (compNode && pinNode) {
              const compRect = compNode.getBoundingClientRect();
              const pinRect = pinNode.getBoundingClientRect();
              
              // For the pin side, target the tip of the pin
              let px = pinRect.left;
              if (pinRect.left > window.innerWidth / 2) px = pinRect.right;

              newLines.push({
                id: `${item.id}-${termId}`,
                x1: compRect.left + compRect.width / 2,
                y1: compRect.top + compRect.height / 2,
                x2: px,
                y2: pinRect.top + pinRect.height / 2,
                color: termId === 'r' ? '#ff3333' : termId === 'g' ? '#33ff33' : termId === 'b' ? '#3333ff' : item.type.includes('LED') ? '#ff4040' : '#4dabf7'
              });
            }
          }
        });
      });
      setLines(newLines);
    };

    updateLines();
    const interval = setInterval(updateLines, 16); // 60fps tracking for dragged components

    return () => clearInterval(interval);
  }, [items]);

  return (
    <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11 }}>
      {/* Existing Component Wires */}
      {lines.map(line => {
        const dx = Math.abs(line.x2 - line.x1);
        const cp1x = line.x1;
        const cp1y = line.y1 + dx * 0.3; // Curve downwards from component
        const cp2x = line.x2 + (line.x2 > line.x1 ? -dx * 0.4 : dx * 0.4);
        const cp2y = line.y2;
        const path = `M ${line.x1} ${line.y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${line.x2} ${line.y2}`;

        return (
          <path 
            key={line.id} 
            d={path} 
            fill="none" 
            stroke={line.color} 
            strokeWidth="4" 
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.6))" }}
          />
        );
      })}

      {/* Active Wires Being Dragged */}
      {activeWire && (
        <path 
          d={`M ${activeWire.startX} ${activeWire.startY} Q ${(activeWire.startX + activeWire.currentX)/2} ${activeWire.currentY}, ${activeWire.currentX} ${activeWire.currentY}`}
          fill="none"
          stroke="#00ff88"
          strokeWidth="4"
          strokeDasharray="8 4"
          style={{ filter: "drop-shadow(0 0 8px #00ff88)" }}
        />
      )}
    </svg>
  );
};

export default WiringCanvas;
