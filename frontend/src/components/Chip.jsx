import Pin from "./Pin";
import { PIN_LAYOUT } from "../constants/pinLayout";
import { getESP32PinColor } from "../constants/esp32PinLayout";

function Chip({ registers, toggleInput, mcu }) {
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
          {/* Notch / antenna */}
          {isESP32 ? (
            <div style={esp32Styles.antenna}>
              <div style={esp32Styles.antennaZigzag} />
              <div style={esp32Styles.antennaLabel}>ANT</div>
            </div>
          ) : (
            <div style={styles.notch} />
          )}

          {/* Chip label */}
          <div style={chipStyles.engravedMain}>{mcu?.name || "ATMEGA328P-PU"}</div>
          <div style={chipStyles.engravedSub}>
            {isESP32 ? "Espressif Systems" : (mcu?.package || "Microchip Technology")}
          </div>

          {/* ESP32 extra info */}
          {isESP32 && (
            <>
              <div style={esp32Styles.voltageLabel}>3.3V Logic</div>
              <div style={esp32Styles.wifiBadge}>Wi-Fi + BLE</div>
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
    height: 750,
  },

  chip: {
    position: "relative",
    width: 360,
    height: 680,
    borderRadius: 14,
    background: "linear-gradient(145deg, #0a2e1a, #061a0f)",
    border: "2px solid #1a5c35",
    boxShadow:
      "inset 0 4px 12px rgba(16,185,129,0.06), inset 0 -8px 16px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.08)"
  },

  antenna: {
    position: "absolute",
    top: -2,
    left: "50%",
    transform: "translateX(-50%)",
    width: 120,
    height: 45,
    background: "linear-gradient(to bottom, #1a5c35 0%, #0a2e1a 100%)",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottom: "2px solid #2d8a55",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  antennaZigzag: {
    width: 60,
    height: 16,
    backgroundImage: `repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 4px,
      #2d8a55 4px,
      #2d8a55 5px
    )`,
    opacity: 0.6,
  },

  antennaLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#2d8a55",
    fontWeight: "bold",
    marginTop: 2,
  },

  engravedMain: {
    position: "absolute",
    top: 65,
    width: "100%",
    textAlign: "center",
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: 700,
    color: "#10b981",
    textShadow:
      "0 0 8px rgba(16,185,129,0.3), 1px 1px 1px rgba(0,0,0,0.9)",
  },

  engravedSub: {
    position: "absolute",
    top: 92,
    width: "100%",
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 2,
    color: "#059669",
    textShadow:
      "1px 1px 1px rgba(0,0,0,0.9)",
  },

  voltageLabel: {
    position: "absolute",
    top: 115,
    width: "100%",
    textAlign: "center",
    fontSize: 9,
    letterSpacing: 1,
    color: "#f59e0b",
    opacity: 0.7,
  },

  wifiBadge: {
    position: "absolute",
    top: 135,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "2px 10px",
    borderRadius: 8,
    border: "1px solid rgba(16,185,129,0.3)",
    background: "rgba(16,185,129,0.08)",
    fontSize: 9,
    letterSpacing: 1,
    color: "#10b981",
  },

  powerLed: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 12px #10b981"
  },

  d13Led: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#06b6d4",
    boxShadow: "0 0 20px #06b6d4"
  }
};

export default Chip;
