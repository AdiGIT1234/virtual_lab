import Pin from "./Pin";
import { PIN_LAYOUT } from "../constants/pinLayout";
import ArduinoUnoBoard from "./ArduinoUnoBoard";

function Chip({ registers, toggleInput, mcu }) {
  if (!mcu || mcu.id === "atmega328p") {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ArduinoUnoBoard registers={registers} toggleInput={toggleInput} mcu={mcu} />
      </div>
    );
  }

  const layout = mcu?.pinLayout || PIN_LAYOUT;
  const isESP32 = mcu?.chipStyle === "module";
  const half = Math.floor(layout.length / 2);
  const leftPins = layout.slice(0, half);
  const rightPins = layout.slice(half).reverse();

  const getPinState = (pin) => {
    if (!registers || pin == null) return false;

    // ESP32: flat GPIO model
    if (isESP32) {
      if (registers.PWM && registers.PWM[pin] > 0 && registers.PWM[pin] < 255) return "PWM";
      if (registers.PWM && registers.PWM[pin] === 255) return true;
      if (registers.GPIO_OUT) return registers.GPIO_OUT[pin] === 1;
      return false;
    }

    // ATmega328P: port-based model
    if (registers.PWM && registers.PWM[pin] > 0 && registers.PWM[pin] < 255) return "PWM";
    if (registers.PWM && registers.PWM[pin] === 255) return true;
    if (pin <= 7) return registers.PORTD?.[pin] === 1;
    if (pin <= 13) return registers.PORTB?.[pin - 8] === 1;
    if (pin >= 14 && pin <= 19) return registers.PORTC?.[pin - 14] === 1;
    return false;
  };

  const isPowered = registers && (
    isESP32
      ? (registers.GPIO_OUT || registers.GPIO_DIR)
      : (registers.PORTB || registers.PORTC || registers.PORTD)
  );

  // Built-in LED pin: GPIO2 for ESP32, D13 for ATmega
  const builtinLedPin = isESP32 ? 2 : 13;

  if (!layout || layout.length === 0) {
    return (
      <div style={styles.unsupported}>
        <p>Pin visualization coming soon for {mcu?.name || "this MCU"}.</p>
      </div>
    );
  }

  const chipStyles = isESP32 ? esp32Styles : styles;

  return (
    <div style={chipStyles.wrapper}>
      <div style={chipStyles.fullWidthContainer}>
        <div id={isESP32 ? "esp32-chip" : "atmega-chip"} style={chipStyles.chip}>
          {/* Sub-components inside chip bounds */}
          {isESP32 ? (
            <>
              <img 
                src="/board.svg" 
                alt="ESP32 Board" 
                draggable={false}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", userSelect: "none", WebkitUserDrag: "none" }} 
              />
              
              {/* EN Button Overlay (Reset) */}
              <div 
                style={{ position: "absolute", left: 52, top: 495, width: 26, height: 26, cursor: "pointer", zIndex: 10 }}
                title="EN (Reset)"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // A full reset simulation mechanism could be hooked here
                  console.log("ESP32 Reset Triggered");
                }}
              />

              {/* BOOT Button Overlay (GPIO 0 Strap) */}
              <div 
                style={{ position: "absolute", right: 60, top: 495, width: 26, height: 26, cursor: "pointer", zIndex: 10 }}
                title="BOOT (GPIO 0)"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  toggleInput(0); // Pulls GPIO 0 LOW
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  toggleInput(0); // Releases GPIO 0
                }}
                onMouseLeave={(e) => {
                  // Ensure it releases if mouse dragged away
                  if (e.buttons > 0) toggleInput(0);
                }}
              />

              {/* Built-in LED Overlay (GPIO 2) */}
              <div 
                style={{ 
                  position: "absolute", 
                  left: 130, 
                  top: 505, 
                  width: 8, 
                  height: 12, 
                  borderRadius: 2, 
                  background: getPinState(2) ? "#3b82f6" : "rgba(30, 40, 50, 0.4)",
                  boxShadow: getPinState(2) ? "0 0 16px #3b82f6, 0 0 4px #60a5fa" : "none",
                  transition: "all 0.1s",
                  zIndex: 5
                }}
                title="Built-in LED (GPIO 2)"
              />
              
              {/* Power LED (Red) */}
              <div 
                style={{ 
                  position: "absolute", 
                  left: 145, 
                  top: 505, 
                  width: 8, 
                  height: 12, 
                  borderRadius: 2, 
                  background: isPowered ? "#ef4444" : "rgba(50, 20, 20, 0.4)",
                  boxShadow: isPowered ? "0 0 12px #ef4444" : "none",
                  transition: "all 0.1s",
                  zIndex: 5
                }}
                title="Power LED"
              />
            </>
          ) : (
            <>
              <div style={styles.notch} />
              <div style={chipStyles.engravedMain}>{mcu?.name || "ATMEGA328P-PU"}</div>
              <div style={chipStyles.engravedSub}>
                {mcu?.package || "Microchip Technology"}
              </div>
            </>
          )}

          {/* Power LED */}
          {isPowered && <div style={chipStyles.powerLed} />}
          {/* Built-in LED */}
          {getPinState(builtinLedPin) && <div style={chipStyles.d13Led} />}

          {/* Left pins */}
          {leftPins.map((pin, i) => (
            <Pin
              key={pin.num}
              pin={pin}
              index={i}
              side="left"
              getPinState={getPinState}
              toggleInput={toggleInput}
              portColors={mcu?.portColors}
              isESP32={isESP32}
              voltage={mcu?.voltage || 5}
            />
          ))}

          {/* Right pins */}
          {rightPins.map((pin, i) => (
            <Pin
              key={pin.num}
              pin={pin}
              index={i}
              side="right"
              getPinState={getPinState}
              toggleInput={toggleInput}
              portColors={mcu?.portColors}
              isESP32={isESP32}
              voltage={mcu?.voltage || 5}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──── ATmega328P styles (original) ────
const styles = {
  unsupported: {
    width: "100%",
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
    border: "1px dashed var(--border)",
    borderRadius: 12,
    color: "var(--text-secondary)",
  },
  wrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  fullWidthContainer: {
    position: "relative",
    width: "100%",
    minWidth: 640,
    height: 700,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  chip: {
    position: "relative",
    width: 320,
    height: 600,
    borderRadius: 18,
    background: "linear-gradient(145deg, #1b1b1b, #0c0c0c)",
    boxShadow:
      "inset 0 8px 16px rgba(255,255,255,0.05), inset 0 -12px 20px rgba(0,0,0,0.9)"
  },

  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 80,
    height: 30,
    backgroundColor: "#0c0c0c",
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70
  },

  engravedMain: {
    position: "absolute",
    top: 60,
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 3,
    color: "#d4af37",
    textShadow:
      "1px 1px 1px rgba(255,215,0,0.1), -1px -1px 1px rgba(0,0,0,0.9)"
  },

  engravedSub: {
    position: "absolute",
    top: 85,
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 2,
    color: "#b8860b",
    textShadow:
      "1px 1px 1px rgba(255,215,0,0.1), -1px -1px 1px rgba(0,0,0,0.9)"
  },

  powerLed: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 15px #00ff88"
  },

  d13Led: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#00ff88",
    boxShadow: "0 0 25px #00ff88"
  }
};

// ──── ESP32 module styles ────
const esp32Styles = {
  ...styles,
  fullWidthContainer: {
    ...styles.fullWidthContainer,
    minWidth: 700,
    height: 800,
  },
  chip: {
    position: "relative",
    width: 320,
    height: 650, 
    borderRadius: 8,
    background: "transparent",
    border: "none",
    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
    userSelect: "none",
    WebkitUserSelect: "none"
  },
  powerLed: {
    position: "absolute",
    top: 230, // move to SMD cluster area
    right: 40,
    width: 6,
    height: 6,
    background: "#ef4444",
    boxShadow: "0 0 10px #ef4444"
  },
  d13Led: {
    position: "absolute",
    top: 240, // Built in LED next to power
    right: 40,
    width: 6,
    height: 6,
    background: "#3b82f6",
    boxShadow: "0 0 10px #3b82f6"
  }
};

export default Chip;
