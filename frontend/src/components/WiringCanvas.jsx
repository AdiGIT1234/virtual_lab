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
  const chipNode = document.getElementById('atmega-chip')
                || document.getElementById('esp32-chip')
                || document.getElementById('arduino-uno-board');
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

// Detect which side of a component a terminal sits on by comparing screen positions.
// Returns 'top' | 'bottom' | 'left' | 'right', defaulting to 'bottom'.
function detectTerminalSide(termNode) {
  const compRoot = termNode?.parentElement?.parentElement;
  if (!compRoot) return 'bottom';
  const cr = compRoot.getBoundingClientRect();
  if (cr.width < 20 || cr.height < 20) return 'bottom';
  const tr = termNode.getBoundingClientRect();
  const tx = tr.left + tr.width  / 2;
  const ty = tr.top  + tr.height / 2;
  const dTop    = Math.abs(ty - cr.top);
  const dBottom = Math.abs(ty - cr.bottom);
  const dLeft   = Math.abs(tx - cr.left);
  const dRight  = Math.abs(tx - cr.right);
  const minD = Math.min(dTop, dBottom, dLeft, dRight);
  if (minD === dTop)    return 'top';
  if (minD === dLeft)   return 'left';
  if (minD === dRight)  return 'right';
  return 'bottom';
}

// Build an orthogonal SVG path where wires exit each port perpendicularly.
// srcSide / tgtSide: 'top' | 'bottom' | 'left' | 'right' | null
// When null the function falls back to chip-edge detection (MCU pins), then 'bottom'.
function buildOrthogonalPath(sx, sy, ex, ey, chip, srcSide, tgtSide) {
  const PAD  = 20;
  const STUB = 32; // perpendicular exit length in px

  const toPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      if (Math.abs(curr.x - prev.x) < 0.1 && Math.abs(curr.y - prev.y) < 0.1) continue;
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const sag = Math.min(len * 0.04, 6);
      const ox = -dy / (len || 1) * sag;
      const oy =  dx / (len || 1) * sag;
      d += ` Q ${(mx + ox).toFixed(1)} ${(my + oy).toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    return d;
  };

  // Resolve side — if not provided use chip-edge detection (handles MCU pins), else 'bottom'.
  function resolveSide(x, y, given) {
    if (given) return given;
    if (chip) {
      if (Math.abs(x - chip.left)   < 50 && y >= chip.top - 10 && y <= chip.bottom + 10) return 'left';
      if (Math.abs(x - chip.right)  < 50 && y >= chip.top - 10 && y <= chip.bottom + 10) return 'right';
      if (Math.abs(y - chip.top)    < 50 && x >= chip.left - 10 && x <= chip.right + 10) return 'top';
      if (Math.abs(y - chip.bottom) < 50 && x >= chip.left - 10 && x <= chip.right + 10) return 'bottom';
    }
    return 'bottom';
  }

  const rSrc = resolveSide(sx, sy, srcSide);
  // tgtSide == null means free target (active wire cursor) — no entry stub
  const rTgt = tgtSide != null ? resolveSide(ex, ey, tgtSide) : null;

  function stubPt(x, y, side) {
    if (side === 'top')    return { x,        y: y - STUB };
    if (side === 'bottom') return { x,        y: y + STUB };
    if (side === 'left')   return { x: x - STUB, y };
    /* right */            return { x: x + STUB, y };
  }

  const sExt = stubPt(sx, sy, rSrc);
  const eExt = rTgt ? stubPt(ex, ey, rTgt) : { x: ex, y: ey };

  const srcHoriz = rSrc === 'left' || rSrc === 'right';
  const tgtHoriz = rTgt === 'left' || rTgt === 'right';

  let pts;

  if (srcHoriz && (!rTgt || tgtHoriz)) {
    // Both exits horizontal: Z-path through midY
    const midY = (sExt.y + eExt.y) / 2;
    pts = [
      { x: sx,     y: sy },
      sExt,
      { x: sExt.x, y: midY },
      { x: eExt.x, y: midY },
      eExt,
    ];
  } else if (!srcHoriz && (!rTgt || !tgtHoriz)) {
    // Both exits vertical: Z-path through midX
    const midX = (sExt.x + eExt.x) / 2;
    pts = [
      { x: sx, y: sy },
      sExt,
      { x: midX, y: sExt.y },
      { x: midX, y: eExt.y },
      eExt,
    ];
  } else if (srcHoriz && rTgt && !tgtHoriz) {
    // Horizontal source → vertical target: go vertical first from stub, then horizontal
    pts = [
      { x: sx,     y: sy },
      sExt,
      { x: sExt.x, y: eExt.y },
      eExt,
    ];
  } else {
    // Vertical source → horizontal target: go horizontal first from stub, then vertical
    pts = [
      { x: sx, y: sy },
      sExt,
      { x: eExt.x, y: sExt.y },
      eExt,
    ];
  }

  if (rTgt) pts.push({ x: ex, y: ey });

  const checkOverlap = (p) => {
    if (!chip) return false;
    for (let i = 0; i < p.length - 1; i++) {
      if (Math.abs(p[i].y - p[i+1].y) < 0.1 && hSegOverlaps(p[i].x, p[i+1].x, p[i].y, chip, PAD)) return true;
      if (Math.abs(p[i].x - p[i+1].x) < 0.1 && vSegOverlaps(p[i].y, p[i+1].y, p[i].x, chip, PAD)) return true;
    }
    return false;
  };

  // For left/right exits the pin→stub segment always clips the chip edge — that is
  // expected. Only bypass if the PATH BODY (everything after the stub) still passes
  // through the chip, which happens when the target is on the opposite side.
  const needsBypass = chip && (
    (rSrc === 'left' || rSrc === 'right')
      ? checkOverlap(pts.slice(1))   // ignore the stub clip, check body only
      : checkOverlap(pts)            // top/bottom/default: check full path
  );

  if (needsBypass) {
    const bypassY = rSrc === 'top'
      ? chip.top - PAD - 10
      : chip.bottom + PAD + 10;
    pts = [
      { x: sx,     y: sy },
      sExt,
      { x: sExt.x, y: bypassY },
      { x: eExt.x, y: bypassY },
      eExt,
    ];
    if (rTgt) pts.push({ x: ex, y: ey });
  }

  return toPath(pts);
}

function getMcuPin(portStr) {
  if (!portStr) return null;
  if (portStr.startsWith('mcu::')) {
    const n = parseInt(portStr.split('::')[1], 10);
    return isNaN(n) ? null : n;   // named pins (5V, GND…) have no register index
  }
  return null;
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
  outputs = {},
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
            x:    (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
            y:    (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
            side: null, // MCU pins: detected inside buildOrthogonalPath via chip bounds
          };
        } else {
          const [compId, termId] = portStr.split('::');
          let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
          if (!node) node = document.getElementById(`comp-terminal-${compId}`);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            x:    (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
            y:    (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
            side: detectTerminalSide(node),
          };
        }
      };

      wires.forEach(wire => {
        const p1 = resolvePort(wire.source);
        const p2 = resolvePort(wire.target);
        if (p1 && p2) {
          const srcPin = getMcuPin(wire.source);
          const tgtPin = getMcuPin(wire.target);
          let logicLevel = 0;
          if (srcPin !== null) logicLevel = outputs[srcPin] ?? 0;
          if (tgtPin !== null && !logicLevel) logicLevel = outputs[tgtPin] ?? 0;

          newLines.push({
            id: wire.id,
            wire,
            sourcePos: p1,
            targetPos: p2,
            color: wire.color || '#4dabf7',
            logicLevel,
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
      if (!portStr || !workspaceNode) return { x: fallbackX, y: fallbackY, side: null };
      if (portStr.startsWith('mcu::')) {
        const pinVal = portStr.split('::')[1];
        let node = document.getElementById(`chip-pin-tip-${pinVal}`);
        if (!node) node = document.getElementById(`chip-pin-${pinVal}`);
        if (!node) return { x: fallbackX, y: fallbackY, side: null };
        const rect = node.getBoundingClientRect();
        return {
          x:    (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
          y:    (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
          side: null,
        };
      } else {
        const [compId, termId] = portStr.split('::');
        let node = document.getElementById(`comp-terminal-${compId}-${termId}`);
        if (!node) node = document.getElementById(`comp-terminal-${compId}`);
        if (!node) return { x: fallbackX, y: fallbackY, side: null };
        const rect = node.getBoundingClientRect();
        return {
          x:    (rect.left + rect.width  / 2 - workspaceRect.left - viewOffset.x) / viewScale,
          y:    (rect.top  + rect.height / 2 - workspaceRect.top  - viewOffset.y) / viewScale,
          side: detectTerminalSide(node),
        };
      }
    };

    const startP = resolveStart(activeWire.source, activeWire.startX, activeWire.startY);
    const curP = {
      x: (activeWire.currentX - workspaceRect.left) / viewScale,
      y: (activeWire.currentY - workspaceRect.top)  / viewScale,
    };

    // tgtSide = null → no entry stub for the free cursor end
    const path = buildOrthogonalPath(startP.x, startP.y, curP.x, curP.y, chip, startP.side, null);
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
        <defs>
          <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines.map(line => {
          const path = buildOrthogonalPath(
            line.sourcePos.x, line.sourcePos.y,
            line.targetPos.x, line.targetPos.y,
            line.chip,
            line.sourcePos.side,
            line.targetPos.side,
          );
          const isSelected = selectedWireId === line.id;
          const isActive   = (line.logicLevel ?? 0) > 0;
          const wireStroke = isActive ? line.color : 'rgba(120,120,120,0.45)';
          const wireWidth  = isActive ? 3 : 2;

          return (
            <g
              key={line.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onWireClick) onWireClick(line.id, e.clientX, e.clientY);
              }}
            >
              {/* Glow halo for HIGH wires */}
              {isActive && (
                <path
                  d={path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.25"
                  style={{ filter: 'url(#wire-glow)', pointerEvents: 'none' }}
                />
              )}
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
                stroke={wireStroke}
                strokeWidth={wireWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: isSelected
                    ? `drop-shadow(0 0 10px ${line.color})`
                    : isActive
                      ? `drop-shadow(0 0 5px ${line.color})`
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  transition: 'stroke 0.3s, filter 0.3s',
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
