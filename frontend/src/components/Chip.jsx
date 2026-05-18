import Pin from "./Pin";
import { PIN_LAYOUT } from "../constants/pinLayout";
import ArduinoUnoBoard from "./ArduinoUnoBoard";
import ESP32Board from "./ESP32Board";

function Chip({ registers, toggleInput, mcu }) {
  if (!mcu || mcu.id === "atmega328p") {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ArduinoUnoBoard registers={registers} toggleInput={toggleInput} mcu={mcu} />
      </div>
    );
  }

  const isESP32 = mcu?.chipStyle === "module";
  if (isESP32) {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div>
          <ESP32Board registers={registers} toggleInput={toggleInput} mcu={mcu} />
        </div>
      </div>
    );
  }

  // Fallback for other chips (ATMEGA DIP style)
  const layout = mcu?.pinLayout || PIN_LAYOUT;
  const half = Math.floor(layout.length / 2);
  const leftPins = layout.slice(0, half);
  const rightPins = layout.slice(half).reverse();

  const getPinState = (pin) => {
    if (!registers || pin == null) return false;
    if (registers.PWM && registers.PWM[pin] > 0 && registers.PWM[pin] < 255) return "PWM";
    if (registers.PWM && registers.PWM[pin] === 255) return true;
    if (pin <= 7) return registers.PORTD?.[pin] === 1;
    if (pin <= 13) return registers.PORTB?.[pin - 8] === 1;
    if (pin >= 14 && pin <= 19) return registers.PORTC?.[pin - 14] === 1;
    return false;
  };

  const isPowered = registers && (registers.PORTB || registers.PORTC || registers.PORTD);
  const builtinLedPin = 13;

  if (!layout || layout.length === 0) {
    return (
      <div style={styles.unsupported}>
        <p>Pin visualization coming soon for {mcu?.name || "this MCU"}.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.fullWidthContainer}>
        <div id="atmega-chip" style={styles.chip}>
          <div style={styles.notch} />
          <div style={styles.engravedMain}>{mcu?.name || "ATMEGA328P-PU"}</div>
          <div style={styles.engravedSub}>
            {mcu?.package || "Microchip Technology"}
          </div>

          {isPowered && <div style={styles.powerLed} />}
          {getPinState(builtinLedPin) && <div style={styles.d13Led} />}

          {leftPins.map((pin, i) => (
            <Pin
              key={pin.num}
              pin={pin}
              index={i}
              side="left"
              getPinState={getPinState}
              toggleInput={toggleInput}
              portColors={mcu?.portColors}
              voltage={mcu?.voltage || 5}
            />
          ))}

          {rightPins.map((pin, i) => (
            <Pin
              key={pin.num}
              pin={pin}
              index={i}
              side="right"
              getPinState={getPinState}
              toggleInput={toggleInput}
              portColors={mcu?.portColors}
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

export default Chip;
