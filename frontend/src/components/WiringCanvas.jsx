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

// ─────────────────────────────────────────────────────────────────────────────
// Orthogonal (Manhattan) path builder with chip obstacle avoidance
//
// Strategy:
//   1. Try a simple 3-segment L-shape (H then V then H, or V then H then V).
//   2. If either route segment passes through the chip bounding box, add a
//      detour segment that routes around the chip (padding = 30px in workspace
//      coords).
//   3. All segments are axis-aligned (0° or 90° only).
// ─────────────────────────────────────────────────────────────────────────────
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

/**
 * Returns true if the horizontal segment (y=fy, x from x1 to x2) overlaps
 * the chip rect (with padding).
 */
function hSegOverlaps(x1, x2, fy, chip, pad) {
  if (!chip) return false;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  return (
    fy > chip.top - pad && fy < chip.bottom + pad &&
    maxX > chip.left - pad && minX < chip.right + pad
  );
}

/**
 * Returns true if the vertical segment (x=fx, y from y1 to y2) overlaps
 * the chip rect (with padding).
 */
function vSegOverlaps(y1, y2, fx, chip, pad) {
  if (!chip) return false;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return (
    fx > chip.left - pad && fx < chip.right + pad &&
    maxY > chip.top - pad && minY < chip.bottom + pad
  );
}

/**
 * Build an orthogonal SVG path from (sx,sy) to (ex,ey) avoiding chip rect.
 *
 * Routing algorithm:
 *  - Try routing: right/left → down/up → right/left  (horizontal-first)
 *  - Midpoint on the horizontal axis is the vertical jog
 *  - If any segment cuts through chip, reroute around chip edge
 */
function buildOrthogonalPath(sx, sy, ex, ey, chip) {
  const PAD = 30; // pixels in workspace coords

  // ── Helper: emit SVG path string from an array of {x,y} waypoints ──
  const toPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  // ── Simple 3-segment routes ──
  // Route A: H→V→H  (horizontal, then vertical, then horizontal)
  //   S → midH → midH,ey → E
  const midX_A = sx + (ex - sx) / 2;
  const ptsA = [
    { x: sx,    y: sy },
    { x: midX_A, y: sy },
    { x: midX_A, y: ey },
    { x: ex,    y: ey },
  ];

  // Route B: V→H→V  (vertical, then horizontal, then vertical)
  //   S → sx,midY → ex,midY → E
  const midY_B = sy + (ey - sy) / 2;
  const ptsB = [
    { x: sx, y: sy },
    { x: sx, y: midY_B },
    { x: ex, y: midY_B },
    { x: ex, y: ey },
  ];

  // ── Check if a route is clear of chip ──
  const routeAClear = () => {
    if (!chip) return true;
    // seg1: horizontal sy from sx→midX_A
    if (hSegOverlaps(sx, midX_A, sy, chip, PAD)) return false;
    // seg2: vertical midX_A from sy→ey
    if (vSegOverlaps(sy, ey, midX_A, chip, PAD)) return false;
    // seg3: horizontal ey from midX_A→ex
    if (hSegOverlaps(midX_A, ex, ey, chip, PAD)) return false;
    return true;
  };

  const routeBClear = () => {
    if (!chip) return true;
    // seg1: vertical sx from sy→midY_B
    if (vSegOverlaps(sy, midY_B, sx, chip, PAD)) return false;
    // seg2: horizontal midY_B from sx→ex
    if (hSegOverlaps(sx, ex, midY_B, chip, PAD)) return false;
    // seg3: vertical ex from midY_B→ey
    if (vSegOverlaps(midY_B, ey, ex, chip, PAD)) return false;
    return true;
  };

  if (routeAClear()) return toPath(ptsA);
  if (routeBClear()) return toPath(ptsB);

  // ── Both simple routes are blocked → route around chip ──
  if (!chip) return toPath(ptsA); // no chip to avoid

  // Decide which side of the chip to go around
  // Compare distances to left edge vs right edge
  const distLeft  = Math.abs(((sx + ex) / 2) - chip.left);
  const distRight = Math.abs(((sx + ex) / 2) - chip.right);

  let bypassX;
  if (distLeft <= distRight) {
    // Route around left side
    bypassX = chip.left - PAD;
  } else {
    // Route around right side
    bypassX = chip.right + PAD;
  }

  // 5-segment path: H to bypassX → V to sy → V all the way → H to ex
  // S(sx,sy) → (bypassX, sy) → (bypassX, ey) → (ex, ey)
  const ptsAround = [
    { x: sx,      y: sy },
    { x: bypassX, y: sy },
    { x: bypassX, y: ey },
    { x: ex,      y: ey },
  ];
  return toPath(ptsAround);
}

// ─────────────────────────────────────────────────────────────────────────────
// WiringCanvas
// ─────────────────────────────────────────────────────────────────────────────
const WiringCanvas = ({
  items,
  wires = [],
  activeWire,
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

  // Active wire: render as orthogonal line from source to mouse cursor
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
        {/* Completed wires — orthogonal routed */}
        {lines.map(line => {
          const path = buildOrthogonalPath(
            line.sourcePos.x, line.sourcePos.y,
            line.targetPos.x, line.targetPos.y,
            line.chip,
          );

          return (
            <g
              key={line.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, wireId: line.id });
                if (onWireClick) onWireClick(line.id, e.clientX, e.clientY);
              }}
            >
              {/* Wide invisible hit target */}
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
              {/* Visible wire */}
              <path
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))', pointerEvents: 'none' }}
              />
              {/* Draggable source endpoint */}
              <circle
                cx={line.sourcePos.x}
                cy={line.sourcePos.y}
                r="5"
                fill={line.color}
                stroke="#222"
                strokeWidth="2"
                style={{ pointerEvents: 'all', cursor: 'grab', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onWireDetach) onWireDetach(line.id, 'source');
                }}
              />
              {/* Draggable target endpoint */}
              <circle
                cx={line.targetPos.x}
                cy={line.targetPos.y}
                r="5"
                fill={line.color}
                stroke="#222"
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

        {/* Active wire being dragged */}
        {renderActiveWire()}
      </svg>

      {/* Context menu for wire colour / delete */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: 'rgba(15,15,15,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ gridColumn: '1 / -1', padding: '4px 8px', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Wire Color
          </div>
          {WIRE_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => handleColorSelect(contextMenu.wireId, c.value)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: c.value,
                border: wireColors[contextMenu.wireId] === c.value ? '2px solid #fff' : '2px solid #333',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: wireColors[contextMenu.wireId] === c.value ? `0 0 10px ${c.value}` : 'none',
              }}
            />
          ))}
          <button
            style={{ gridColumn: '1 / -1', marginTop: '6px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ff4444', background: 'rgba(50,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: '11px' }}
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
