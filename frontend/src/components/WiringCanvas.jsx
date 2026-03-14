import React, { useEffect, useState } from 'react';

const WIRE_COLORS = [
  { name: "Blue", value: "#4dabf7" },
  { name: "Red", value: "#ff4040" },
  { name: "Green", value: "#00ff88" },
  { name: "Yellow", value: "#ffcc00" },
  { name: "Purple", value: "#cc66ff" },
  { name: "Orange", value: "#ff8800" },
  { name: "Pink", value: "#ff66cc" },
  { name: "White", value: "#cccccc" },
];

const WiringCanvas = ({ items, wires = [], activeWire, onWireDetach, onWireClick, wireColors = {}, onWireColorChange, onWireDelete, workspaceId, viewScale = 1, viewOffset = { x: 0, y: 0 } }) => {
  const [lines, setLines] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const updateLines = () => {
      const newLines = [];
      const workspaceNode = workspaceId ? document.getElementById(workspaceId) : null;
      const workspaceRect = workspaceNode?.getBoundingClientRect();
      if (!workspaceRect) return;

      const resolvePort = (portStr) => {
        if (!portStr) return null;
        if (portStr.startsWith("mcu::")) {
          const pinVal = portStr.split("::")[1];
          let node = document.getElementById(`chip-pin-tip-${pinVal}`);
          if (!node) node = document.getElementById(`chip-pin-${pinVal}`); // Fallback
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { 
             x: (rect.left + rect.width / 2 - workspaceRect.left - viewOffset.x) / viewScale, 
             y: (rect.top + rect.height / 2 - workspaceRect.top - viewOffset.y) / viewScale
          };
        } else {
          const [compId, termId] = portStr.split("::");
          let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
          if (!node) node = document.getElementById(`comp-terminal-${compId}`);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { 
             x: (rect.left + rect.width / 2 - workspaceRect.left - viewOffset.x) / viewScale, 
             y: (rect.top + rect.height / 2 - workspaceRect.top - viewOffset.y) / viewScale 
          };
        }
      };

      wires.forEach(wire => {
        const p1 = resolvePort(wire.source);
        const p2 = resolvePort(wire.target);
        if (p1 && p2) {
          newLines.push({
            id: wire.id,
            wire,
            sourcePos: p1,
            targetPos: p2,
            color: wire.color || "#4dabf7",
            bends: wire.bends || []
          });
        }
      });

      setLines(newLines);
    };

    updateLines();
    const interval = setInterval(updateLines, 16); 
    return () => clearInterval(interval);
  }, [wires, items, workspaceId, viewScale, viewOffset]);

  const getPolylinePath = (start, bends, end) => {
    if (!start || !end) return "";
    let d = `M ${start.x} ${start.y}`;
    (bends || []).forEach(b => {
      d += ` L ${b.x} ${b.y}`;
    });
    d += ` L ${end.x} ${end.y}`;
    return d;
  };

  const resolveActivePort = (portStr, fallbackX, fallbackY) => {
    const workspaceNode = workspaceId ? document.getElementById(workspaceId) : null;
    if (!portStr || !workspaceNode) return { x: fallbackX, y: fallbackY };
    const workspaceRect = workspaceNode.getBoundingClientRect();
    if (portStr.startsWith("mcu::")) {
      const pinVal = portStr.split("::")[1];
      let node = document.getElementById(`chip-pin-tip-${pinVal}`);
      if (!node) node = document.getElementById(`chip-pin-${pinVal}`); // Fallback
      if (!node) return { x: fallbackX, y: fallbackY };
      const rect = node.getBoundingClientRect();
      return { 
         x: (rect.left + rect.width / 2 - workspaceRect.left - viewOffset.x) / viewScale, 
         y: (rect.top + rect.height / 2 - workspaceRect.top - viewOffset.y) / viewScale 
      };
    } else {
      const [compId, termId] = portStr.split("::");
      let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
      if (!node) node = document.getElementById(`comp-terminal-${compId}`);
      if (!node) return { x: fallbackX, y: fallbackY };
      const rect = node.getBoundingClientRect();
      return { 
         x: (rect.left + rect.width / 2 - workspaceRect.left - viewOffset.x) / viewScale, 
         y: (rect.top + rect.height / 2 - workspaceRect.top - viewOffset.y) / viewScale 
      };
    }
  };

  const handleWireRightClick = (e, wireId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, wireId });
  };

  const handleColorSelect = (wireId, color) => {
    if (onWireColorChange) {
      onWireColorChange(wireId, color);
    }
    setContextMenu(null);
  };

  // Close context menu on any click
  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [contextMenu]);

  return (
    <>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11, overflow: 'visible' }}>
        {/* Existing Component Wires */}
        {lines.map(line => {
          const path = getPolylinePath(line.sourcePos, line.bends, line.targetPos);

          return (
            <g key={line.id} onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, wireId: line.id });
                if (onWireClick) onWireClick(line.id, e.clientX, e.clientY);
            }}>
              {/* Invisible thick hitbox for click/hover */}
              <path 
                d={path} 
                fill="none" 
                stroke="transparent" 
                strokeWidth="16" 
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
                onContextMenu={(e) => handleWireRightClick(e, line.id)}
              />
              {/* The visible wire */}
              <path 
                d={path} 
                fill="none" 
                stroke={line.color} 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.6))", pointerEvents: "none" }}
              />
              {/* Draggable Endpoints */}
              <circle
                cx={line.sourcePos.x}
                cy={line.sourcePos.y}
                r="6"
                fill={line.color}
                stroke="#222"
                strokeWidth="2"
                style={{ pointerEvents: "all", cursor: "grab", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.8))" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onWireDetach) onWireDetach(line.id, "source");
                }}
              />
              <circle
                cx={line.targetPos.x}
                cy={line.targetPos.y}
                r="6"
                fill={line.color}
                stroke="#222"
                strokeWidth="2"
                style={{ pointerEvents: "all", cursor: "grab", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.8))" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onWireDetach) onWireDetach(line.id, "target");
                }}
              />
              {line.bends.map((bend, i) => (
                <circle
                  key={i}
                  cx={bend.x}
                  cy={bend.y}
                  r="4"
                  fill="#ffffff"
                  stroke={line.color}
                  strokeWidth="2"
                  style={{ pointerEvents: "none", opacity: 0.6 }}
                />
              ))}
            </g>
          );
        })}

        {/* Active Wires Being Dragged */}
        {activeWire && workspaceId && (() => {
          const workspaceNode = document.getElementById(workspaceId);
          if (!workspaceNode) return null;
          const workspaceRect = workspaceNode.getBoundingClientRect();
          const startP = resolveActivePort(activeWire.source, activeWire.startX, activeWire.startY);
          
          // Current is raw viewport pixel, translate to local space
          const currentP = { 
             x: (activeWire.currentX - workspaceRect.left) / viewScale, 
             y: (activeWire.currentY - workspaceRect.top) / viewScale 
          };
          
          const path = getPolylinePath(startP, activeWire.bends, currentP);
          return (
            <path 
              d={path}
              fill="none"
              stroke="#00ff88"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 8px #00ff88)", pointerEvents: "none" }}
            />
          );
        })()}
      </svg>
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: "rgba(15,15,15,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "8px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ gridColumn: "1 / -1", padding: "4px 8px", fontSize: "11px", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            Wire Color
          </div>
          {WIRE_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => handleColorSelect(contextMenu.wireId, c.value)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: c.value,
                border: wireColors[contextMenu.wireId] === c.value ? "2px solid #fff" : "2px solid #333",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: wireColors[contextMenu.wireId] === c.value ? `0 0 10px ${c.value}` : "none",
              }}
            />
          ))}
          <button
            style={{ gridColumn: "1 / -1", marginTop: "6px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ff4444", background: "rgba(50,0,0,0.6)", color: "#fff", cursor: "pointer", fontSize: "11px" }}
            onClick={() => {
              if (onWireDelete) onWireDelete(contextMenu.wireId);
              setContextMenu(null);
            }}
          >
            Remove Wire
          </button>
        </div>
      )}
    </>
  );
};

export default WiringCanvas;
