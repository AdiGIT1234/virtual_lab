import { useState, useRef, useCallback } from "react";
import HardwarePreview from "./HardwarePreview";

/**
 * Functional Component — replaces visual-only placeholders.
 * Every terminal/pin is visible, named, and accessible for wiring.
 */
export default function ComponentPlaceholder({
  id,
  label,
  status = "visual",
  // eslint-disable-next-line no-unused-vars
  description,
  category,
  wokwiTag,
  docSlug,
  imageUrl,
  terminals = [],
  pins = {},
  onTerminalClick,
  onTerminalDragStart,
  highlighted = false,
}) {
  const [hoveredPin, setHoveredPin] = useState(null);
  const containerRef = useRef(null);

  const statusText =
    status === "simulated"
      ? "Active"
      : status === "tool"
      ? "Built-in"
      : "Functional";

  const palette =
    status === "simulated"
      ? { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.5)", text: "#22c55e", pinColor: "#22c55e" }
      : status === "tool"
      ? { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#3b82f6", pinColor: "#3b82f6" }
      : { bg: "rgba(0,242,255,0.15)", border: "rgba(0,242,255,0.4)", text: "#00F2FF", pinColor: "#00F2FF" };

  // Normalize terminals to array of { id, label }
  const normalizedTerminals = terminals.map((t) =>
    typeof t === "string" ? { id: t, label: t } : t
  );

  const halfCount = Math.ceil(normalizedTerminals.length / 2);
  const leftPins = normalizedTerminals.slice(0, halfCount);
  const rightPins = normalizedTerminals.slice(halfCount);

  const handlePinMouseDown = useCallback(
    (e, termId) => {
      e.stopPropagation();
      e.preventDefault();
      if (onTerminalDragStart) {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        onTerminalDragStart(id, termId, cx, cy);
      } else if (onTerminalClick) {
        onTerminalClick(id, termId);
      }
    },
    [id, onTerminalDragStart, onTerminalClick]
  );

  const handlePinMouseUp = useCallback(
    (e, termId) => {
      e.stopPropagation();
      // Complete wire to this component's terminal
      if (window.onCompleteComponentWire) {
        window.onCompleteComponentWire(id, termId);
      }
    },
    [id]
  );

  const connectedPin = (termId) => {
    const val = pins[termId];
    if (val != null && val !== "" && val !== undefined) return true;
    return false;
  };

  const hasPins = normalizedTerminals.length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.shell,
        borderColor: highlighted ? palette.pinColor : "var(--border, #333)",
        borderStyle: "solid",
        boxShadow: highlighted ? `0 0 12px ${palette.pinColor}30` : "none",
      }}
    >
      {/* Header row */}
      <div style={styles.headerRow}>
        <div style={styles.titleArea}>
          <div style={styles.title}>{label || "Component"}</div>
          {category && <div style={styles.category}>{category}</div>}
        </div>
        <div
          style={{
            ...styles.badge,
            background: palette.bg,
            borderColor: palette.border,
            color: palette.text,
          }}
        >
          {statusText}
        </div>
      </div>

      {/* Preview (if available) */}
      {(wokwiTag || imageUrl || docSlug) && (
        <HardwarePreview
          tag={wokwiTag}
          docSlug={docSlug}
          imageUrl={imageUrl}
          size="medium"
          style={styles.preview}
        />
      )}

      {/* IC-style pin layout */}
      {hasPins && (
        <div style={styles.icBody}>
          {/* Notch indicator */}
          <div style={styles.notch} />

          {/* Left-side pins */}
          <div style={styles.pinColumnLeft}>
            {leftPins.map((term, idx) => {
              const isConnected = connectedPin(term.id);
              const isHovered = hoveredPin === `L-${idx}`;
              return (
                <div
                  key={`L-${idx}`}
                  style={styles.pinRow}
                  onMouseEnter={() => setHoveredPin(`L-${idx}`)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Pin lead */}
                  <div
                    data-chip-node="interactive"
                    style={{
                      ...styles.pinLead,
                      background: isConnected
                        ? palette.pinColor
                        : isHovered
                        ? "#aaa"
                        : "#666",
                      boxShadow: isConnected
                        ? `0 0 6px ${palette.pinColor}`
                        : isHovered
                        ? "0 0 4px #aaa"
                        : "none",
                    }}
                    onMouseDown={(e) => handlePinMouseDown(e, term.id)}
                    onMouseUp={(e) => handlePinMouseUp(e, term.id)}
                  />
                  {/* Pin label */}
                  <span
                    style={{
                      ...styles.pinLabel,
                      color: isConnected ? palette.pinColor : isHovered ? "#ddd" : "#888",
                      fontWeight: isConnected ? 700 : 400,
                    }}
                  >
                    {term.label || term.id}
                  </span>
                  {/* Pin number */}
                  <span style={styles.pinNumber}>{idx + 1}</span>
                </div>
              );
            })}
          </div>

          {/* IC chip body center */}
          <div style={styles.icCenter}>
            <span style={styles.icLabel}>{label || "IC"}</span>
          </div>

          {/* Right-side pins */}
          <div style={styles.pinColumnRight}>
            {rightPins.map((term, idx) => {
              const isConnected = connectedPin(term.id);
              const isHovered = hoveredPin === `R-${idx}`;
              return (
                <div
                  key={`R-${idx}`}
                  style={{ ...styles.pinRow, flexDirection: "row-reverse" }}
                  onMouseEnter={() => setHoveredPin(`R-${idx}`)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Pin lead */}
                  <div
                    data-chip-node="interactive"
                    style={{
                      ...styles.pinLead,
                      background: isConnected
                        ? palette.pinColor
                        : isHovered
                        ? "#aaa"
                        : "#666",
                      boxShadow: isConnected
                        ? `0 0 6px ${palette.pinColor}`
                        : isHovered
                        ? "0 0 4px #aaa"
                        : "none",
                    }}
                    onMouseDown={(e) => handlePinMouseDown(e, term.id)}
                    onMouseUp={(e) => handlePinMouseUp(e, term.id)}
                  />
                  {/* Pin label */}
                  <span
                    style={{
                      ...styles.pinLabel,
                      color: isConnected ? palette.pinColor : isHovered ? "#ddd" : "#888",
                      fontWeight: isConnected ? 700 : 400,
                      textAlign: "right",
                    }}
                  >
                    {term.label || term.id}
                  </span>
                  {/* Pin number */}
                  <span style={styles.pinNumber}>{normalizedTerminals.length - idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tooltip for hovered pin */}
      {hoveredPin != null && (
        <div style={styles.tooltip}>
          Click and drag to wire this pin
        </div>
      )}
    </div>
  );
}

const styles = {
  shell: {
    minWidth: 200,
    borderRadius: 8,
    border: "1px solid var(--border, #333)",
    padding: 0,
    background: "rgba(10,10,10,0.95)",
    display: "flex",
    flexDirection: "column",
    color: "var(--text-primary, #f7f7f7)",
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    overflow: "hidden",
    position: "relative",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "10px 12px 6px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  category: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "var(--text-muted, #666)",
    letterSpacing: "0.1em",
  },
  badge: {
    flexShrink: 0,
    borderRadius: 999,
    border: "1px solid",
    padding: "2px 8px",
    fontSize: 9,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  preview: {
    width: "100%",
    height: 80,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  icBody: {
    display: "flex",
    padding: "8px 4px",
    gap: 4,
    position: "relative",
  },
  notch: {
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    width: 12,
    height: 6,
    borderRadius: "0 0 6px 6px",
    background: "rgba(255,255,255,0.08)",
  },
  pinColumnLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    flex: 1,
  },
  pinColumnRight: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    flex: 1,
  },
  icCenter: {
    width: 50,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.02)",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  icLabel: {
    fontSize: 7,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    writingMode: "vertical-rl",
    textOrientation: "mixed",
  },
  pinRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 4px",
    borderRadius: 3,
    cursor: "crosshair",
    transition: "background 0.15s",
  },
  pinLead: {
    width: 16,
    height: 8,
    borderRadius: 2,
    flexShrink: 0,
    cursor: "crosshair",
    transition: "all 0.15s ease",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  pinLabel: {
    fontSize: 9,
    letterSpacing: "0.05em",
    flex: 1,
    transition: "color 0.15s",
    userSelect: "none",
  },
  pinNumber: {
    fontSize: 8,
    color: "#444",
    width: 14,
    textAlign: "center",
    flexShrink: 0,
  },
  tooltip: {
    position: "absolute",
    bottom: -24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#000",
    border: "1px solid #333",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 9,
    color: "#aaa",
    whiteSpace: "nowrap",
    zIndex: 10,
    pointerEvents: "none",
  },
};
