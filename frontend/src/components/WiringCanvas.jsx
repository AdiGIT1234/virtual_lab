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

  const getOrthogonalPath = (x1, y1, x2, y2) => {
    // 1. Always drop down from component terminal to prevent wire from crossing over the component body
    const dropY = y1 + 25; 
    
    // 2. The chip pin is at x2. Safe vertical corridor outside the chip pins
    const isRightSide = x2 > window.innerWidth / 2;
    const extendX = isRightSide ? x2 + 30 : x2 - 30;
    
    // 3. Default horizontal lane
    let routeY = dropY;
    
    const chipNode = document.getElementById('atmega-chip');
    if (chipNode) {
      const chipRect = chipNode.getBoundingClientRect();
      const margin = 40; 
      
      const minX = Math.min(x1, extendX);
      const maxX = Math.max(x1, extendX);
      
      // Check if horizontal lane intersects chip
      const hzCrosses = (minX < chipRect.right + 20 && maxX > chipRect.left - 20);
      const vtCrosses = (routeY > chipRect.top - 20 && routeY < chipRect.bottom + 20);
      
      if (hzCrosses && vtCrosses) {
         const routeTopY = chipRect.top - margin;
         const routeBottomY = chipRect.bottom + margin;
         
         const distTop = Math.abs(routeY - chipRect.top);
         const distBottom = Math.abs(routeY - chipRect.bottom);
         
         routeY = distTop < distBottom ? routeTopY : routeBottomY;
      }
    }

    // Path generation: M(start) -> L(drop from comp) -> L(if routeY changed, move to safe lane) -> L(over to safe column) -> L(up/down to pin) -> L(hook into pin)
    return `M ${x1} ${y1} L ${x1} ${dropY} L ${x1} ${routeY} L ${extendX} ${routeY} L ${extendX} ${y2} L ${x2} ${y2}`;
  };

  return (
    <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11 }}>
      {/* Existing Component Wires */}
      {lines.map(line => {
        const path = getOrthogonalPath(line.x1, line.y1, line.x2, line.y2);

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
      {activeWire && (() => {
        const path = getOrthogonalPath(activeWire.startX, activeWire.startY, activeWire.currentX, activeWire.currentY);
        return (
          <path 
            d={path}
            fill="none"
            stroke="#00ff88"
            strokeWidth="4"
            strokeDasharray="8 4"
            style={{ filter: "drop-shadow(0 0 8px #00ff88)" }}
          />
        );
      })()}
    </svg>
  );
};

export default WiringCanvas;
