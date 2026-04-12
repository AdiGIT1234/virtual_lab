import { useCallback, useRef, useState } from "react";
import HardwarePreview from "./HardwarePreview";

const resolvePinStyle = ({ palette, isConnected, isHovered }) => ({
  ...styles.pinLead,
  background: isConnected ? palette.pinColor : isHovered ? "#dbe4ef" : "#a8b4c7",
  boxShadow: isConnected ? `0 0 10px ${palette.pinColor}55` : isHovered ? "0 0 6px rgba(255,255,255,0.25)" : "none",
  borderColor: isConnected ? `${palette.pinColor}aa` : "rgba(255,255,255,0.16)",
});

export default function ComponentPlaceholder({
  id,
  status = "visual",
  wokwiTag,
  imageUrl,
  terminals = [],
  pins = {},
  onTerminalClick,
  onTerminalDragStart,
  highlighted = false,
}) {
  const [hoveredPin, setHoveredPin] = useState(null);
  const containerRef = useRef(null);

  const palette =
    status === "simulated"
      ? { pinColor: "#22c55e" }
      : status === "tool"
      ? { pinColor: "#3b82f6" }
      : { pinColor: "#22d3ee" };

  const normalizedTerminals = terminals.map((terminal) =>
    typeof terminal === "string" ? { id: terminal, label: terminal } : terminal
  );

  const halfCount = Math.ceil(normalizedTerminals.length / 2);
  const leftPins = normalizedTerminals.slice(0, halfCount);
  const rightPins = normalizedTerminals.slice(halfCount).reverse();
  const previewAvailable = Boolean(wokwiTag || imageUrl);

  const handlePinMouseDown = useCallback(
    (event, termId) => {
      event.stopPropagation();
      event.preventDefault();

      if (window.getActiveWire && window.getActiveWire()) {
        if (window.onCompleteComponentWire) {
          window.onCompleteComponentWire(id, termId);
        }
        return;
      }

      if (onTerminalDragStart) {
        const rect = event.currentTarget.getBoundingClientRect();
        onTerminalDragStart(id, termId, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else if (onTerminalClick) {
        onTerminalClick(id, termId);
      }
    },
    [id, onTerminalClick, onTerminalDragStart]
  );

  const handlePinMouseUp = useCallback(
    (event, termId) => {
      event.stopPropagation();
      if (window.onCompleteComponentWire) {
        window.onCompleteComponentWire(id, termId);
      }
    },
    [id]
  );

  const isConnectedPin = (termId) => pins[termId] != null && pins[termId] !== "";

  const renderPinRow = (term, visualIndex, side) => {
    const isRight = side === "right";
    const pinKey = `${side}-${visualIndex}`;
    const isHovered = hoveredPin === pinKey;
    const isConnected = isConnectedPin(term.id);
    const pinNumber = isRight ? normalizedTerminals.length - visualIndex : visualIndex + 1;

    return (
      <div
        key={`${side}-${term.id || visualIndex}`}
        style={{ ...styles.pinRow, flexDirection: isRight ? "row-reverse" : "row" }}
        onMouseEnter={() => setHoveredPin(pinKey)}
        onMouseLeave={() => setHoveredPin(null)}
      >
        <div
          id={`comp-terminal-${id}-${term.id}`}
          data-type="terminal"
          data-comp-id={id}
          data-term-id={term.id}
          title={term.label || term.id}
          data-chip-node="interactive"
          style={resolvePinStyle({ palette, isConnected, isHovered })}
          onMouseDown={(event) => handlePinMouseDown(event, term.id)}
          onMouseUp={(event) => handlePinMouseUp(event, term.id)}
        />
        <span style={{ ...styles.pinLabel, textAlign: isRight ? "right" : "left", color: isConnected ? palette.pinColor : isHovered ? "#eef4fb" : "#8ea0b7" }}>
          {term.label || term.id}
        </span>
        <span style={styles.pinNumber}>{pinNumber}</span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.wrapper,
        boxShadow: highlighted ? `0 0 0 1px ${palette.pinColor}55, 0 16px 30px rgba(0,0,0,0.3)` : "0 14px 28px rgba(0,0,0,0.26)",
      }}
    >
      <div style={styles.chipBody}>
        <div style={styles.notch} />

        <div style={styles.pinColumn}>
          {leftPins.map((term, index) => renderPinRow(term, index, "left"))}
        </div>

        <div
          style={{
            ...styles.centerBody,
            borderColor: highlighted ? `${palette.pinColor}55` : "rgba(255,255,255,0.06)",
          }}
        >
          {previewAvailable ? (
            <HardwarePreview tag={wokwiTag} imageUrl={imageUrl} size="small" style={styles.preview} />
          ) : (
            <div style={styles.previewFallback} />
          )}
        </div>

        <div style={styles.pinColumn}>
          {rightPins.map((term, index) => renderPinRow(term, index, "right"))}
        </div>
      </div>

      {hoveredPin != null ? <div style={styles.tooltip}>Drag from pin to wire</div> : null}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    overflow: "visible",
  },
  chipBody: {
    position: "relative",
    minWidth: 260,
    minHeight: 180,
    display: "flex",
    alignItems: "stretch",
    gap: 10,
    padding: "14px 12px 12px",
    borderRadius: 20,
    background: "linear-gradient(145deg, #1b2230, #0c121b)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 48,
    height: 14,
    background: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  pinColumn: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    minWidth: 64,
  },
  pinRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minHeight: 20,
  },
  pinLead: {
    width: 22,
    height: 10,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "crosshair",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  pinLabel: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.15,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    overflowWrap: "anywhere",
    userSelect: "none",
  },
  pinNumber: {
    width: 12,
    fontSize: 8,
    color: "#5b6b80",
    textAlign: "center",
    flexShrink: 0,
  },
  centerBody: {
    width: 132,
    minHeight: 154,
    borderRadius: 18,
    background: "linear-gradient(145deg, #161d2a, #0d131d)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    boxShadow: "inset 0 8px 16px rgba(255,255,255,0.03), inset 0 -12px 20px rgba(0,0,0,0.4)",
  },
  preview: {
    width: "100%",
    height: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
  },
  previewFallback: {
    width: 84,
    height: 84,
    borderRadius: 14,
    background: "linear-gradient(180deg, #243041, #121926)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  tooltip: {
    position: "absolute",
    left: "50%",
    bottom: -28,
    transform: "translateX(-50%)",
    borderRadius: 999,
    background: "rgba(2,6,23,0.98)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "5px 10px",
    fontSize: 9,
    color: "#cbd5e1",
    whiteSpace: "nowrap",
    zIndex: 20,
    pointerEvents: "none",
  },
};
