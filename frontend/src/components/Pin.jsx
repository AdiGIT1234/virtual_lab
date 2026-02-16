import { useState } from "react";

function Pin({ pin, index, side, getPinState, toggleInput }) {
  const [hovered, setHovered] = useState(false);

  const PIN_SPACING = 28;
  const START_Y = 100;

  const y = START_Y + index * PIN_SPACING;
  const active = getPinState(pin.arduino);

  const getPortColor = (port) => {
    if (port === "B") return "#4da6ff";
    if (port === "C") return "#66ff99";
    if (port === "D") return "#ff6666";
    return "#aaa";
  };

  const leadStyle = {
    position: "absolute",
    top: y,
    width: 22,
    height: 8,
    background: active
      ? "linear-gradient(to bottom, #00ff88, #00cc66)"
      : "linear-gradient(to bottom, #d9d9d9, #888)",
    boxShadow: hovered
      ? "0 0 6px rgba(255,255,255,0.6)"
      : "inset 0 1px 2px rgba(255,255,255,0.6)",
    cursor: pin.arduino != null ? "pointer" : "default",
    transition: "all 0.2s ease"
  };

  const labelStyle = {
    position: "absolute",
    top: y - 6,
    width: 130,
    fontSize: 12,
    fontWeight: 500,
    color: getPortColor(pin.port),
    textAlign: side === "left" ? "right" : "left"
  };

  if (side === "left") {
    leadStyle.left = -28;
    leadStyle.borderTopLeftRadius = 3;
    leadStyle.borderBottomLeftRadius = 3;
    labelStyle.left = -180;
  } else {
    leadStyle.right = -28;
    leadStyle.borderTopRightRadius = 3;
    leadStyle.borderBottomRightRadius = 3;
    labelStyle.right = -180;
  }

  return (
    <>
      <div
        style={leadStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => toggleInput(pin.arduino)}
      />
      <div style={labelStyle}>{pin.label}</div>
    </>
  );
}

export default Pin;
