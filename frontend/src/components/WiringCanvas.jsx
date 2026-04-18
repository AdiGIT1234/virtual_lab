import React, { useEffect, useState } from 'react';

const WIRE_COLORS = [
  { name: "Blue",   value: "#4dabf7" },
  { name: "Red",    value: "#ff4040" },
  { name: "Green",  value: "#00ff88" },
  { name: "Yellow", value: "#ffcc00" },
  { name: "Purple", value: "#cc66ff" },
  { name: "Orange", value: "#ff8800" },
  { name: "Pink",   value: "#ff66cc" },
  { name: "White",  value: "#cccccc" },
];

function getChipRect(workspaceRect, viewScale, viewOffset) {
  const chipNode = document.getElementById('atmega-chip');
  if (!chipNode || !workspaceRect) return null;
  const r = chipNode.getBoundingClientRect();
  return {
    left:   (r.left   - workspaceRect.left - viewOffset.x) / viewScale,
    right:  (r.right  - workspaceRect.left - viewOffset.x) / viewScale,
    top:    (r.top    - workspaceRect.top  - viewOffset.y) / viewScale,
    bottom: (r.bottom - workspaceRect.top  - viewOffset.y) / viewScale,
  };
}

function hSegOverlaps(x1, x2, fy, chip, pad) {
  if (!chip) return false;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  return (
    fy > chip.top - pad && fy < chip.bottom + pad &&
    maxX > chip.left - pad && minX < chip.right + pad
  );
}

function vSegOverlaps(y1, y2, fx, chip, pad) {
  if (!chip) return false;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return (
    fx > chip.left - pad && fx < chip.right + pad &&
    maxY > chip.top - pad && minY < chip.bottom + pad
  );
}

function buildOrthogonalPath(sx, sy, ex, ey, chip) {
  const PAD = 20; 
  const DROP = 18; // Vertical lead drop for standard components
  const EXT = 35;  // Horizontal lead extension for MCU edge pins

  const toPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
        if (Math.abs(pts[i].x - pts[i-1].x) > 0.1 || Math.abs(pts[i].y - pts[i-1].y) > 0.1) {
          d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }
    }
    return d;
  };

  if (!chip) {
    const midX = sx + (ex - sx) / 2;
    return toPath([
      { x: sx, y: sy },
      { x: sx, y: sy + DROP },
      { x: midX, y: sy + DROP },
      { x: midX, y: ey },
      { x: ex, y: ey }
    ]);
  }

  // Determine Safe Start Point (extracting outward if it's a chip pin)
  const isSourceLeft = Math.abs(sx - chip.left) < 50 && sy >= chip.top - 10 && sy <= chip.bottom + 10;
  const isSourceRight = Math.abs(sx - chip.right) < 50 && sy >= chip.top - 10 && sy <= chip.bottom + 10;
  const sExtX = isSourceLeft ? sx - EXT : (isSourceRight ? sx + EXT : sx);
  const sExtY = (isSourceLeft || isSourceRight) ? sy : sy + DROP;

  // Determine Safe End Point
  const isTargetLeft = Math.abs(ex - chip.left) < 50 && ey >= chip.top - 10 && ey <= chip.bottom + 10;
  const isTargetRight = Math.abs(ex - chip.right) < 50 && ey >= chip.top - 10 && ey <= chip.bottom + 10;
  const eExtX = isTargetLeft ? ex - EXT : (isTargetRight ? ex + EXT : ex);
  const eExtY = ey;

  let midX = sExtX + (eExtX - sExtX) / 2;

  let pts = [
    { x: sx, y: sy },
    { x: sExtX, y: sExtY },
    { x: midX, y: sExtY },
    { x: midX, y: eExtY },
    { x: eExtX, y: eExtY },
    { x: ex, y: ey }
  ];

  const checkPtsOverlap = (p) => {
    for (let i = 0; i < p.length - 1; i++) {
      if (Math.abs(p[i].y - p[i+1].y) < 0.1) {
         if (hSegOverlaps(p[i].x, p[i+1].x, p[i].y, chip, PAD)) return true;
      }
      if (Math.abs(p[i].x - p[i+1].x) < 0.1) {
         if (vSegOverlaps(p[i].y, p[i+1].y, p[i].x, chip, PAD)) return true;
      }
    }
    return false;
  };

  if (!checkPtsOverlap(pts)) return toPath(pts);

  // Fallback: Bypass directly around the bottom of the chip if direct route is colliding
  const bypassY = chip.bottom + PAD + 10;
  
  return toPath([
    { x: sx, y: sy },
    { x: sExtX, y: sExtY },
    { x: sExtX, y: bypassY },
    { x: eExtX, y: bypassY },
    { x: eExtX, y: eExtY },
    { x: ex, y: ey }
  ]);
}

const WiringCanvas = ({
  items,
  wires = [],
  activeWire,
  selectedWireId,
  onWireDetach,
  onWireClick,
  wireColors = {},
  onWireColorChange,
  onWireDelete,
  workspaceId,
  viewScale = 1,
  viewOffset = { x: 0, y: 0 },
}) => {
  const [lines, setLines] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const updateLines = () => {
      const newLines = [];
      const workspaceNode = workspaceId ? document.getElementById(workspaceId) : null;
      const workspaceRect = workspaceNode?.getBoundingClientRect();
      if (!workspaceRect) return;

      const chip = getChipRect(workspaceRect, viewScale, viewOffset);

      const resolvePort = (portStr) => {
        if (!portStr) return null;
        if (portStr.startsWith('mcu::')) {
          const pinVal = portStr.split('::')[1];
          let node = document.getElementById(`chip-pin-tip-${pinVal}`);
          if (!node) node = document.getElementById(`chip-pin-${pinVal}`);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            x: (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
            y: (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
          };
        } else {
          const [compId, termId] = portStr.split('::');
          let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
          if (!node) node = document.getElementById(`comp-terminal-${compId}`);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            x: (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
            y: (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
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
            color: wire.color || '#4dabf7',
            chip,
          });
        }
      });

      setLines(newLines);
    };

    updateLines();
    const interval = setInterval(updateLines, 16);
    return () => clearInterval(interval);
  }, [wires, items, workspaceId, viewScale, viewOffset]);

  const handleWireRightClick = (e, wireId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, wireId });
    if (onWireClick) onWireClick(wireId, e.clientX, e.clientY);
  };

  const handleColorSelect = (wireId, color) => {
    if (onWireColorChange) onWireColorChange(wireId, color);
    setContextMenu(null);
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [contextMenu]);

  const renderActiveWire = () => {
    if (!activeWire || !workspaceId) return null;
    const workspaceNode = document.getElementById(workspaceId);
    if (!workspaceNode) return null;
    const workspaceRect = workspaceNode.getBoundingClientRect();
    const chip = getChipRect(workspaceRect, viewScale, viewOffset);

    const resolveStart = (portStr, fallbackX, fallbackY) => {
      if (!portStr || !workspaceNode) return { x: fallbackX, y: fallbackY };
      if (portStr.startsWith('mcu::')) {
        const pinVal = portStr.split('::')[1];
        let node = document.getElementById(`chip-pin-tip-${pinVal}`);
        if (!node) node = document.getElementById(`chip-pin-${pinVal}`);
        if (!node) return { x: fallbackX, y: fallbackY };
        const rect = node.getBoundingClientRect();
        return {
          x: (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
          y: (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
        };
      } else {
        const [compId, termId] = portStr.split('::');
        let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
        if (!node) node = document.getElementById(`comp-terminal-${compId}`);
        if (!node) return { x: fallbackX, y: fallbackY };
        const rect = node.getBoundingClientRect();
        return {
          x: (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
          y: (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
        };
      }
    };

    const startP = resolveStart(activeWire.source, activeWire.startX, activeWire.startY);
    const curP = {
      x: (activeWire.currentX - workspaceRect.left) / viewScale,
      y: (activeWire.currentY - workspaceRect.top)  / viewScale,
    };

    const path = buildOrthogonalPath(startP.x, startP.y, curP.x, curP.y, chip);
    return (
      <path
        d={path}
        fill="none"
        stroke="#00ff88"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        style={{ filter: 'drop-shadow(0 0 8px #00ff88)', pointerEvents: 'none' }}
      />
    );
  };

  return (
    <>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11, overflow: 'visible' }}>
        {lines.map(line => {
          const path = buildOrthogonalPath(
            line.sourcePos.x, line.sourcePos.y,
            line.targetPos.x, line.targetPos.y,
            line.chip,
          );
          const isSelected = selectedWireId === line.id;

          return (
            <g
              key={line.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onWireClick) onWireClick(line.id, e.clientX, e.clientY);
              }}
            >
              {isSelected && (
                <path
                  d={path}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  style={{ filter: 'blur(4px)', pointerEvents: 'none' }}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onContextMenu={(e) => handleWireRightClick(e, line.id)}
              />
              <path
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ 
                  filter: isSelected ? `drop-shadow(0 0 10px ${line.color})` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', 
                  transition: 'all 0.2s',
                  pointerEvents: 'none' 
                }}
              />
              <circle
                cx={line.sourcePos.x}
                cy={line.sourcePos.y}
                r={isSelected ? "7" : "5"}
                fill={line.color}
                stroke={isSelected ? "#fff" : "#222"}
                strokeWidth="2"
                style={{ pointerEvents: 'all', cursor: 'grab', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onWireDetach) onWireDetach(line.id, 'source');
                }}
              />
              <circle
                cx={line.targetPos.x}
                cy={line.targetPos.y}
                r={isSelected ? "7" : "5"}
                fill={line.color}
                stroke={isSelected ? "#fff" : "#222"}
                strokeWidth="2"
                style={{ pointerEvents: 'all', cursor: 'grab', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onWireDetach) onWireDetach(line.id, 'target');
                }}
              />
            </g>
          );
        })}
        {renderActiveWire()}
      </svg>

      {(contextMenu || selectedWireId) && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu ? contextMenu.x : "50%",
            top: contextMenu ? contextMenu.y : "80%",
            transform: !contextMenu ? 'translateX(-50%)' : 'none',
            zIndex: 9999,
            background: 'rgba(15,15,15,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>Wire Style</span>
            {selectedWireId && <span style={{ color: '#00f2ff' }}>Selected</span>}
          </div>
          {WIRE_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => handleColorSelect(contextMenu?.wireId || selectedWireId, c.value)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: c.value,
                border: (wireColors[contextMenu?.wireId || selectedWireId] || '#4dabf7') === c.value ? '2px solid #fff' : '2px solid #333',
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
            />
          ))}
          <button
            style={{ 
              gridColumn: '1 / -1', 
              marginTop: '6px', 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ff4444', 
              background: 'rgba(80,0,0,0.4)', 
              color: '#ff8888', 
              cursor: 'pointer', 
              fontSize: '11px',
              fontWeight: 600,
            }}
            onClick={() => {
              if (onWireDelete) onWireDelete(contextMenu?.wireId || selectedWireId);
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
