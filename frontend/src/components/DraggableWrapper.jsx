import React, { useState, useEffect, useRef } from 'react';

const DraggableWrapper = ({ id, initialX, initialY, onStartWire, onDelete, terminals, children }) => {
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
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
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
            
            if (distLeft < distRight) {
               setPosition(prev => ({ ...prev, x: chipRect.left - compRect.width - 20 }));
            } else {
               setPosition(prev => ({ ...prev, x: chipRect.right + 20 }));
            }
          }
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
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
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
      }}>
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
          <div
            key={term.id}
            id={`comp-terminal-${id}-${term.id}`}
            data-type="terminal"
            title={term.label || term.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onStartWire) {
                const rect = e.target.getBoundingClientRect();
                onStartWire(id, term.id, rect.left + rect.width / 2, rect.top + rect.height / 2);
              }
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
        ))}
      </div>
    </div>
  );
};
export default DraggableWrapper;
