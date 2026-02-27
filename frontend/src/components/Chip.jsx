import Pin from "./Pin";
import { PIN_LAYOUT } from "../constants/pinLayout";

function Chip({ registers, toggleInput }) {
  const leftPins = PIN_LAYOUT.slice(0, 14);
  const rightPins = PIN_LAYOUT.slice(14).reverse();

  const getPinState = (arduinoPin) => {
    if (!registers || arduinoPin == null) return false;
    if (registers.PWM && registers.PWM[arduinoPin] > 0 && registers.PWM[arduinoPin] < 255) return "PWM";
    if (registers.PWM && registers.PWM[arduinoPin] === 255) return true;
    if (arduinoPin <= 7) return registers.PORTD?.[arduinoPin] === 1;
    if (arduinoPin <= 13) return registers.PORTB?.[arduinoPin - 8] === 1;
    if (arduinoPin >= 14 && arduinoPin <= 19) return registers.PORTC?.[arduinoPin - 14] === 1;
    return false;
  };

  const isPowered =
    registers &&
    (registers.PORTB || registers.PORTC || registers.PORTD);

  return (
    <div style={styles.wrapper}>
      <div style={styles.fullWidthContainer}>
        <div id="atmega-chip" style={styles.chip}>
          <div style={styles.notch} />
          <div style={styles.engravedMain}>ATMEGA328P-PU</div>
          <div style={styles.engravedSub}>Microchip Technology</div>

          {isPowered && <div style={styles.powerLed} />}
          {getPinState(13) && <div style={styles.d13Led} />}

          {leftPins.map((pin, i) => (
            <Pin
              key={pin.num}
              pin={pin}
              index={i}
              side="left"
              getPinState={getPinState}
              toggleInput={toggleInput}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
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
