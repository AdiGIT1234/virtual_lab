import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const EXPERIMENTS_PLACEHOLDER = [
  { id: "exp01_led_blinking", title: "LED Blinking", difficulty: "Beginner", aim: "Blink an LED using GPIO and delay loops.", icon: "💡", color: "#00ff88" },
  { id: "exp02_push_button", title: "Push Button & Debouncing", difficulty: "Beginner", aim: "Read a button with internal pull-ups and debounce logic.", icon: "🔘", color: "#00ccff" },
  { id: "exp03_seven_segment", title: "7-Segment Display", difficulty: "Beginner", aim: "Drive a 7-segment display using look-up tables.", icon: "🔢", color: "#ff9900" },
  { id: "exp04_external_interrupts", title: "External Interrupts (INT0 & INT1)", difficulty: "Intermediate", aim: "Use INT0/INT1 to handle hardware events via ISRs.", icon: "⚡", color: "#ff3366" },
  { id: "exp05_timer0_normal", title: "Timer0 Normal Mode", difficulty: "Intermediate", aim: "Use Timer0 overflow interrupts for non-blocking LED blink.", icon: "⏱️", color: "#cc66ff" },
  { id: "exp06_timer1_ctc", title: "Timer1 CTC Mode", difficulty: "Intermediate", aim: "Generate precise 1Hz signals using CTC and OCR1A.", icon: "🎯", color: "#ffcc00" },
  { id: "exp07_pwm_fast", title: "Fast PWM & LED Fading", difficulty: "Intermediate", aim: "Fade an LED smoothly using Timer0 Fast PWM mode.", icon: "🌗", color: "#33cccc" },
  { id: "exp08_pwm_phase_correct", title: "Phase Correct PWM", difficulty: "Intermediate", aim: "Drive servo motors with symmetric Phase Correct PWM.", icon: "🔄", color: "#ff6633" },
  { id: "exp09_adc_polling", title: "ADC (Analog-to-Digital)", difficulty: "Intermediate", aim: "Read analog voltages from a potentiometer using the ADC.", icon: "🎛️", color: "#66ff99" },
  { id: "exp10_uart_tx", title: "UART Serial Transmit", difficulty: "Intermediate", aim: "Configure USART and transmit 'Hello World' over serial.", icon: "📡", color: "#3399ff" },
  { id: "exp11_uart_rx_interrupts", title: "UART Receive Interrupts", difficulty: "Intermediate", aim: "Build an interrupt-driven UART receiver with echo.", icon: "📥", color: "#ff66cc" },
  { id: "exp12_spi_master", title: "SPI Master Communication", difficulty: "Advanced", aim: "Execute high-speed SPI data exchange as bus master.", icon: "🔗", color: "#99cc33" },
  { id: "exp13_i2c_master", title: "I2C / TWI Master", difficulty: "Advanced", aim: "Address I2C slave devices using TWI registers.", icon: "🔌", color: "#ff4444" },
  { id: "exp14_eeprom_rw", title: "EEPROM Read/Write", difficulty: "Advanced", aim: "Store and retrieve persistent data through power cycles.", icon: "💾", color: "#44aaff" },
  { id: "exp15_watchdog_timer", title: "Watchdog Timer", difficulty: "Advanced", aim: "Auto-reset a crashed microcontroller using the WDT.", icon: "🐕", color: "#ffaa00" },
];

const difficultyColors = {
  "Beginner": "#00ff88",
  "Intermediate": "#ffcc00",
  "Advanced": "#ff3366",
};

// Pin labels for the chip halves
const LEFT_PINS = ["PC6","PD0","PD1","PD2","PD3","PD4","VCC","GND","PB6","PB7","PD5","PD6","PD7","PB0"];
const RIGHT_PINS = ["PC5","PC4","PC3","PC2","PC1","PC0","GND","AREF","AVCC","PB5","PB4","PB3","PB2","PB1"];

export default function LandingPage() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState(EXPERIMENTS_PLACEHOLDER);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const pageRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/experiments")
      .then(res => res.json())
      .then(data => {
        if (data.experiments && data.experiments.length > 0) {
          const merged = EXPERIMENTS_PLACEHOLDER.map(placeholder => {
            const match = data.experiments.find(e => e.id === placeholder.id);
            return match ? { ...placeholder, ...match } : placeholder;
          });
          setExperiments(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setScrollY(container.scrollTop);
    };
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate chip split based on scroll position
  // Chip starts closed at scrollY=0, fully opens by scrollY=600
  const splitProgress = Math.min(scrollY / 600, 1);
  const splitOffset = splitProgress * 280; // max horizontal offset in px
  const chipOpacity = 1 - splitProgress * 0.3; // fade slightly as it opens
  const chipScale = 1 + splitProgress * 0.1; // grow slightly

  return (
    <div ref={pageRef} style={styles.page}>

      {/* FIXED CHIP BACKGROUND — splits on scroll */}
      <div style={styles.chipBgContainer}>
        {/* LEFT HALF */}
        <div style={{
          ...styles.chipHalf,
          transform: `translateX(-${splitOffset}px) scale(${chipScale})`,
          opacity: chipOpacity,
          borderRadius: "12px 0 0 12px",
          borderRight: splitProgress > 0.05 ? "2px solid #00ffcc22" : "none",
        }}>
          <div style={styles.chipNotchLeft} />
          <div style={styles.chipLabel}>
            <span style={styles.chipLabelText}>ATMEGA</span>
          </div>
          {LEFT_PINS.map((pin, i) => (
            <div key={i} style={styles.pinRow}>
              <div style={styles.pinStub} />
              <span style={styles.pinLabel}>{pin}</span>
            </div>
          ))}
        </div>

        {/* RIGHT HALF */}
        <div style={{
          ...styles.chipHalf,
          transform: `translateX(${splitOffset}px) scale(${chipScale})`,
          opacity: chipOpacity,
          borderRadius: "0 12px 12px 0",
          borderLeft: splitProgress > 0.05 ? "2px solid #00ffcc22" : "none",
        }}>
          <div style={styles.chipLabel}>
            <span style={styles.chipLabelText}>328P</span>
          </div>
          {RIGHT_PINS.map((pin, i) => (
            <div key={i} style={{ ...styles.pinRow, flexDirection: "row-reverse" }}>
              <div style={styles.pinStub} />
              <span style={styles.pinLabel}>{pin}</span>
            </div>
          ))}
        </div>

        {/* CENTER GLOW — appears as chip opens */}
        {splitProgress > 0.1 && (
          <div style={{
            position: "absolute",
            width: `${splitOffset * 1.5}px`,
            height: "300px",
            background: `radial-gradient(ellipse, rgba(0,255,204,${0.08 * splitProgress}) 0%, transparent 70%)`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* HERO SECTION */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          {/* VIDEO */}
          <div style={styles.videoContainer}>
            <video
              src="/hero-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={styles.heroVideo}
            />
            <div style={styles.videoOverlay} />
          </div>

          <div style={styles.heroTextBlock}>
            <h1 style={styles.heroTitle}>
              ATmega328P <span style={styles.heroAccent}>Virtual Lab</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Master microcontroller programming through interactive, guided experiments.
              <br />From blinking LEDs to PID control — all in your browser.
            </p>
            <div style={styles.heroBtnRow}>
              <button style={styles.heroBtn} onClick={() => navigate("/sandbox")}>
                ⚙️ Free Play Sandbox
              </button>
              <button style={styles.heroBtnOutline} onClick={() => {
                document.getElementById("experiments-section")?.scrollIntoView({ behavior: "smooth" });
              }}>
                📖 Guided Experiments ↓
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={styles.scrollIndicator}>
            <div style={styles.scrollDot} />
            <span style={{ color: "#555", fontSize: "12px", marginTop: "8px" }}>Scroll to explore</span>
          </div>
        </div>
      </header>

      {/* EXPERIMENTS GRID */}
      <section id="experiments-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>Guided Experiments</h2>
        <p style={styles.sectionSubtitle}>15 progressive experiments — from beginner to expert level</p>

        <div style={styles.grid}>
          {experiments.map((exp, idx) => (
            <div
              key={exp.id}
              style={{
                ...styles.card,
                borderColor: hoveredCard === exp.id ? exp.color : "#1a1a1a",
                boxShadow: hoveredCard === exp.id ? `0 0 30px ${exp.color}22, 0 8px 32px rgba(0,0,0,0.4)` : "0 2px 10px rgba(0,0,0,0.3)",
                transform: hoveredCard === exp.id ? "translateY(-6px) scale(1.02)" : "none",
              }}
              onMouseEnter={() => setHoveredCard(exp.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(`/experiment/${exp.id}`)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardNumber}>{String(idx + 1).padStart(2, "0")}</span>
                <span style={{...styles.cardBadge, background: `${difficultyColors[exp.difficulty] || "#555"}15`, color: difficultyColors[exp.difficulty] || "#555", border: `1px solid ${difficultyColors[exp.difficulty] || "#555"}33`}}>
                  {exp.difficulty}
                </span>
              </div>
              <div style={{...styles.cardIcon, color: exp.color}}>{exp.icon}</div>
              <h3 style={styles.cardTitle}>{exp.title}</h3>
              <p style={styles.cardAim}>{exp.aim}</p>
              <div style={{...styles.cardArrow, color: exp.color}}>Start Lab →</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>ATmega328P Virtual Lab • Built for Learning</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#000",
    color: "#fff",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: "relative",
  },

  /* CHIP BACKGROUND */
  chipBgContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 0,
  },
  chipHalf: {
    width: "140px",
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 8px",
    gap: "6px",
    transition: "transform 0.05s linear, opacity 0.05s linear",
    position: "relative",
  },
  chipNotchLeft: {
    position: "absolute",
    top: "50%",
    right: "-1px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "1px solid #333",
    background: "#000",
    transform: "translateY(-50%) translateX(50%)",
  },
  chipLabel: {
    marginBottom: "8px",
  },
  chipLabelText: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#00ffcc",
    letterSpacing: "2px",
    fontWeight: "700",
  },
  pinRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "100%",
    justifyContent: "flex-start",
  },
  pinStub: {
    width: "18px",
    height: "3px",
    background: "#333",
    borderRadius: "1px",
    flexShrink: 0,
  },
  pinLabel: {
    fontFamily: "monospace",
    fontSize: "8px",
    color: "#444",
    whiteSpace: "nowrap",
  },

  /* HERO */
  hero: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    zIndex: 1,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    maxWidth: "800px",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    justifyContent: "center",
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "640px",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "40px",
    boxShadow: "0 0 60px rgba(0,255,136,0.1), 0 20px 60px rgba(0,0,0,0.6)",
    border: "1px solid #1a1a1a",
  },
  heroVideo: {
    width: "100%",
    display: "block",
    borderRadius: "16px",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80px",
    background: "linear-gradient(transparent, #000)",
    pointerEvents: "none",
  },
  heroTextBlock: {
    position: "relative",
  },
  heroTitle: {
    fontSize: "52px",
    fontWeight: "800",
    margin: "0 0 16px 0",
    letterSpacing: "-1.5px",
    lineHeight: "1.1",
  },
  heroAccent: {
    background: "linear-gradient(135deg, #00ffcc, #00ff88)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "18px",
    color: "#777",
    lineHeight: "1.7",
    margin: "0 0 40px 0",
  },
  heroBtnRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  heroBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #00ff88, #00ccaa)",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(0,255,136,0.25)",
    transition: "all 0.3s",
  },
  heroBtnOutline: {
    padding: "14px 32px",
    background: "transparent",
    color: "#00ffcc",
    border: "2px solid #00ffcc44",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  scrollIndicator: {
    position: "absolute",
    bottom: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "float 2s ease-in-out infinite",
  },
  scrollDot: {
    width: "20px",
    height: "32px",
    borderRadius: "10px",
    border: "2px solid #333",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    paddingTop: "6px",
  },

  /* SECTION */
  section: {
    position: "relative",
    zIndex: 1,
    padding: "100px 40px 80px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "linear-gradient(180deg, transparent 0%, #000 5%)",
  },
  sectionTitle: {
    fontSize: "40px",
    fontWeight: "800",
    textAlign: "center",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  sectionSubtitle: {
    fontSize: "16px",
    color: "#555",
    textAlign: "center",
    margin: "0 0 60px 0",
  },

  /* GRID */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#080808",
    border: "1px solid #1a1a1a",
    borderRadius: "16px",
    padding: "28px 24px",
    cursor: "pointer",
    transition: "all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    fontSize: "13px",
    color: "#333",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  cardBadge: {
    fontSize: "10px",
    padding: "3px 10px",
    borderRadius: "20px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardIcon: {
    fontSize: "36px",
    margin: "6px 0",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0",
    color: "#eee",
  },
  cardAim: {
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.6",
    margin: "0",
    flex: 1,
  },
  cardArrow: {
    fontSize: "13px",
    fontWeight: "700",
    marginTop: "8px",
  },

  /* FOOTER */
  footer: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    padding: "40px 20px",
    borderTop: "1px solid #111",
    color: "#333",
    fontSize: "14px",
  },
};
