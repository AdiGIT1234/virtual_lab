import React, { useState, useEffect, useRef } from 'react';

const DraggableWrapper = ({
  id,
  initialX,
  initialY,
  scale = 1,
  onScaleChange,
  onStartWire,
  onDelete,
  terminals,
  configPanel,
  children,
  workspaceRef,
  viewScale = 1,
  onPositionChange,
}) => {
  const wrapperRef = useRef(null);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showConfig, setShowConfig] = useState(false);

  const termList = terminals || [{ id: "main" }];

  const handleMouseDown = (e) => {
    // Avoid dragging if clicking terminal or delete button
    if (e.target.dataset.type === 'terminal' || e.target.tagName.toLowerCase() === 'button') {
      return;
    }
    setIsDragging(true);
    const rect = workspaceRef?.current?.getBoundingClientRect();
    const offsetX = rect ? (e.clientX - rect.left) / viewScale : e.clientX;
    const offsetY = rect ? (e.clientY - rect.top) / viewScale : e.clientY;
    setDragOffset({
      x: offsetX - position.x,
      y: offsetY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const rect = workspaceRef?.current?.getBoundingClientRect();
        const pointerX = rect ? (e.clientX - rect.left) / viewScale : e.clientX;
        const pointerY = rect ? (e.clientY - rect.top) / viewScale : e.clientY;
        setPosition({
          x: pointerX - dragOffset.x,
          y: pointerY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        const chipNode = document.getElementById('atmega-chip');
        if (chipNode && wrapperRef.current) {
          const chipRect = chipNode.getBoundingClientRect();
          const compRect = wrapperRef.current.getBoundingClientRect();
          
          const overlap = !(
            compRect.right < chipRect.left || 
            compRect.left > chipRect.right || 
            compRect.bottom < chipRect.top || 
            compRect.top > chipRect.bottom
          );
          
          if (overlap) {
            // Push component out to the left or right whichever is closer
            const distLeft = compRect.right - chipRect.left;
            const distRight = chipRect.right - compRect.left;
            let finalPos = position;
            
            if (distLeft < distRight) {
               const adjust = (distLeft + 20) / viewScale;
               finalPos = { ...position, x: position.x - adjust };
               setPosition(finalPos);
            } else {
               const adjust = (distRight + 20) / viewScale;
               finalPos = { ...position, x: position.x + adjust };
               setPosition(finalPos);
            }

            onPositionChange?.(id, finalPos);
          }
        } else {
            onPositionChange?.(id, position);
        }

        // Auto-connect feature: test for nearest MCU pin or Component terminal
        const compRect = wrapperRef.current.getBoundingClientRect();
        const myX = compRect.left + compRect.width / 2;
        const myY = compRect.top + compRect.height / 2;

        let closestDist = 80; // snap threshold in px
        let closestTarget = null;
        
        // Check Chip Pins
        document.querySelectorAll('[id^="chip-pin-"]').forEach(node => {
          const rect = node.getBoundingClientRect();
          const nx = rect.left + rect.width / 2;
          const ny = rect.top + rect.height / 2;
          const dist = Math.hypot(nx - myX, ny - myY);
          if (dist < closestDist) {
            closestDist = dist;
            closestTarget = node.id.replace('chip-pin-', ''); // standard mcu pin string
          }
        });

        // Check Component Terminals
        document.querySelectorAll('[data-type="terminal"]').forEach(node => {
          const compId = node.getAttribute('data-comp-id');
          const termId = node.getAttribute('data-term-id');
          if (compId === id) return; // skip self
          const rect = node.getBoundingClientRect();
          const nx = rect.left + rect.width / 2;
          const ny = rect.top + rect.height / 2;
          const dist = Math.hypot(nx - myX, ny - myY);
          if (dist < closestDist) {
            closestDist = dist;
            closestTarget = `${compId}::${termId}`; // nested representation
          }
        });

        if (closestTarget && window.onAutoConnectWire) {
           const myFirstTerm = termList[0]?.id || "main";
           window.onAutoConnectWire(id, myFirstTerm, closestTarget);
        }

      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragOffset, workspaceRef, viewScale, position, id, onPositionChange]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY * -0.002;
      const newScale = Math.min(Math.max(0.5, scale + delta), 3);
      if (onScaleChange) onScaleChange(id, newScale);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, onScaleChange, id]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 8, // lower than wiring canvas
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowConfig(true)}
      onMouseLeave={() => setShowConfig(false)}
    >
      
      {/* Config Overlay for Wiring */}
      <div style={{
        position: 'absolute',
        top: -30,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20,20,20,0.95)',
        padding: '4px 6px',
        borderRadius: '8px',
        display: showConfig ? 'flex' : 'none',
        gap: '6px',
        border: '1px solid #444',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        alignItems: 'center',
        zIndex: 50
      }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {configPanel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {configPanel}
          </div>
        )}
        <button 
          onClick={() => onDelete && onDelete(id)}
          style={{ 
            background: '#ff3333', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '10px', 
            padding: '4px 6px',
            fontWeight: 'bold'
          }}
        >
          ✕ Delete
        </button>
      </div>

      {/* Actual Component Graphics */}
      <div style={{ pointerEvents: 'none' }}>
        {children}
      </div>

      {/* Wire Terminal Nodes */}
      <div style={{
          position: 'absolute',
          bottom: -15, // Below the component
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 60
      }}>
        {termList.map(term => (
          <div key={term.id} style={styles.terminalWrapper}>
            <div
              id={`comp-terminal-${id}-${term.id}`}
              data-type="terminal"
              data-comp-id={id}
              data-term-id={term.id}
              title={term.label || term.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (window.getActiveWire && window.getActiveWire()) {
                  if (window.onCompleteComponentWire) {
                    window.onCompleteComponentWire(id, term.id);
                  }
                } else if (onStartWire) {
                  const rect = e.target.getBoundingClientRect();
                  onStartWire(id, term.id, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
              }}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: term.color || '#222',
                border: `2px solid ${term.color || '#aaa'}`,
                cursor: 'crosshair',
                boxShadow: showConfig ? `0 0 10px ${term.color || '#00ffcc'}` : "none",
                transition: "all 0.2s"
              }}
            />
            <span style={styles.terminalLabel}>{term.label || term.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  terminalWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 30,
  },
  terminalLabel: {
    fontSize: 9,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary, #a0a0a0)',
    pointerEvents: 'none',
    fontFamily: 'monospace'
  }
};
export default DraggableWrapper;
