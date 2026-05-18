import { useState } from "react";
import { getESP32PinColor, ESP32_TOP_PINS, ESP32_BOTTOM_PINS } from "../constants/esp32PinLayout";

const BW = 1000;
const BH = 551;

const TOP_PIN_Y = 28;
const BOTTOM_PIN_Y = 521;
// Starting X and spacing as determined by Python script
const START_X = 191;
const PIN_SPACING = 49.3;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPinState(registers, pin) {
  if (!registers || pin.gpio == null) return false;
  const pinId = pin.gpio;
  if (registers.PWM && registers.PWM[pinId] > 0 && registers.PWM[pinId] < 255) return "PWM";
  if (registers.PWM && registers.PWM[pinId] === 255) return true;
  if (registers.GPIO_OUT) return registers.GPIO_OUT[pinId] === 1;
  return false;
}

// ── Interactive pad ───────────────────────────────────────────────────────────
function ESP32Pad({ pin, index, y, state, onToggle, isTop }) {
  const [hovered, setHovered] = useState(false);
  const x = START_X + index * PIN_SPACING;
  
  const isPower = pin.power || pin.special === "reset";
  const hasGpio = pin.gpio != null;
  const isInteractive = !isPower && hasGpio;
  
  const activeColor = state === "PWM" ? "#00aaff" : state ? "#10b981" : null;
  const pinColor = getESP32PinColor(pin);
  const tooltipY = isTop ? y + 25 : y - 75;

  function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const pinIdentifier = hasGpio ? pin.gpio : pin.label;
    
    if (window.getActiveWire?.()) {
      window.onCompleteWire?.(pinIdentifier);
    } else {
      const r = e.target.getBoundingClientRect();
      window.onStartWire?.(`mcu::${pinIdentifier}`, null, r.left + r.width / 2, r.top + r.height / 2);
    }
  }

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isInteractive && onToggle?.(pin.gpio)}
      style={{ cursor: isInteractive ? "pointer" : "crosshair" }}
      data-chip-node="interactive"
    >
      {/* Invisible larger hit target for easier clicking/hovering */}
      <circle cx={x} cy={y} r={18} fill="transparent" />

      {/* Dynamic Pin Indicator / Glow */}
      <rect x={x - 12} y={y - 12} width={24} height={24} rx={4}
        fill={activeColor ? activeColor : (hovered ? pinColor : "transparent")}
        opacity={activeColor ? 0.8 : (hovered ? 0.3 : 0)}
        style={{ transition: "all 0.15s" }}
        pointerEvents="none"
      />

      {/* Wiring hit target */}
      <circle
        id={`chip-pin-tip-${hasGpio ? pin.gpio : pin.label}`}
        cx={x} cy={y} r={10}
        fill="transparent" stroke="transparent"
        onMouseDown={handleMouseDown}
        onClick={e => e.stopPropagation()}
        data-chip-node="interactive"
      />

      {/* Hover tooltip */}
      {hovered && (
        <g style={{ pointerEvents: "none" }}>
          <rect x={x - 60} y={tooltipY} width={120} height={50} rx={6}
            fill="#111" stroke={pinColor} strokeWidth={2} opacity={0.95} />
          
          <text x={x} y={tooltipY + 16} textAnchor="middle"
            fill={pinColor} fontSize={14} fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
            {pin.label}
          </text>
          
          <text x={x} y={tooltipY + 30} textAnchor="middle"
            fill="#ccc" fontSize={9} fontFamily="sans-serif">
            {pin.desc.split(" | ")[0]}
          </text>
          
          {isInteractive && (
             <text x={x} y={tooltipY + 44} textAnchor="middle"
               fill={activeColor || "#888"} fontSize={10} fontFamily="monospace" fontWeight="bold">
               {state === "PWM" ? "PWM Wave" : state ? "HIGH (3.3V)" : "LOW (0V)"}
             </text>
          )}
        </g>
      )}
    </g>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export default function ESP32Board({ registers, toggleInput }) {
  const isPowered = !!(registers?.GPIO_OUT || registers?.GPIO_DIR);

  return (
    <div id="esp32-board-container" style={{ position: "relative", width: BW, height: BH, userSelect: "none" }}>
      {/* Background Image */}
      <img 
        src="/esp32-board.png" 
        alt="ESP32 Board" 
        draggable={false}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", userSelect: "none", WebkitUserDrag: "none" }} 
      />
      
      {/* Power LED (Red) */}
      <div 
        style={{ 
          position: "absolute", 
          left: 450, 
          top: 360, 
          width: 25, 
          height: 12, 
          borderRadius: 2, 
          background: isPowered ? "#ef4444" : "rgba(50, 20, 20, 0.4)",
          boxShadow: isPowered ? "0 0 16px #ef4444" : "none",
          transition: "all 0.1s",
          zIndex: 5
        }}
        title="Power LED"
      />
      
      {/* Built-in LED Overlay (GPIO 2 - Blue) */}
      <div 
        style={{ 
          position: "absolute", 
          left: 450, 
          top: 335, 
          width: 25, 
          height: 12, 
          borderRadius: 2, 
          background: getPinState(registers, {gpio: 2}) ? "#3b82f6" : "rgba(30, 40, 50, 0.4)",
          boxShadow: getPinState(registers, {gpio: 2}) ? "0 0 20px #3b82f6, 0 0 8px #60a5fa" : "none",
          transition: "all 0.1s",
          zIndex: 5
        }}
        title="Built-in LED (GPIO 2)"
      />

      {/* SVG Overlay for Interactive Pads */}
      <svg
        viewBox={`0 0 ${BW} ${BH}`}
        width="100%" height="100%"
        style={{ position: "absolute", top: 0, left: 0, display: "block", overflow: "visible" }}
      >
        {ESP32_TOP_PINS.map((pin, index) => (
          <ESP32Pad
            key={`top-${index}`}
            pin={pin}
            index={index}
            y={TOP_PIN_Y}
            isTop={true}
            state={getPinState(registers, pin)}
            onToggle={toggleInput}
          />
        ))}

        {ESP32_BOTTOM_PINS.map((pin, index) => (
          <ESP32Pad
            key={`bot-${index}`}
            pin={pin}
            index={index}
            y={BOTTOM_PIN_Y}
            isTop={false}
            state={getPinState(registers, pin)}
            onToggle={toggleInput}
          />
        ))}
      </svg>
      
      {/* EN Button Overlay (Reset) */}
      <div 
        style={{ position: "absolute", left: 34, top: 78, width: 44, height: 44, cursor: "pointer", zIndex: 10 }}
        title="EN (Reset)"
        onMouseDown={(e) => {
          e.stopPropagation();
          console.log("ESP32 Reset Triggered");
        }}
      />

      {/* BOOT Button Overlay (GPIO 0 Strap) */}
      <div 
        style={{ position: "absolute", left: 34, top: 429, width: 44, height: 44, cursor: "pointer", zIndex: 10 }}
        title="BOOT (GPIO 0)"
        onMouseDown={(e) => {
          e.stopPropagation();
          toggleInput(0);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          toggleInput(0);
        }}
        onMouseLeave={(e) => {
          if (e.buttons > 0) toggleInput(0);
        }}
      />
    </div>
  );
}
