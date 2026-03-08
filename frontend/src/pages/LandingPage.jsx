import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════
   CHIP INFO - Data that appears alongside the chip as it opens
   Future: This will become dynamic per-chip (ESP32, STM32, etc.)
   ═══════════════════════════════════════════════════════════ */
const LEFT_INFO = [
  { phase: 0.15, title: "8-bit AVR RISC Core", desc: "131 documented instructions, most completing in a single clock." },
  { phase: 0.25, title: "32 kB Flash Memory", desc: "Non-volatile program storage with a 10,000-cycle endurance rating." },
  { phase: 0.35, title: "2 kB SRAM", desc: "High-speed volatile memory for the stack and working registers." },
  { phase: 0.45, title: "1 kB EEPROM", desc: "Byte-addressable non-volatile data for calibration and user settings." },
  { phase: 0.55, title: "23 GPIO Pins", desc: "Ports B, C, and D expose configurable digital I/O for every pin." },
  { phase: 0.65, title: "6-channel 10-bit ADC", desc: "Analog inputs (ADC0–ADC5) with up to 15 kSPS throughput." },
];

const RIGHT_INFO = [
  { phase: 0.15, title: "Up to 20 MHz Clock", desc: "Runs at 16 MHz on Arduino Uno boards with optional 20 MHz crystal support." },
  { phase: 0.25, title: "3 Timer/Counters", desc: "Two 8-bit timers (0, 2) plus a 16-bit Timer1 with PWM outputs." },
  { phase: 0.35, title: "USART, SPI, TWI", desc: "Hardware UART, SPI master/slave, and I²C-compatible TWI peripherals." },
  { phase: 0.45, title: "External & Pin-change IRQs", desc: "INT0/INT1 plus 23 pin-change interrupts for responsive firmware." },
  { phase: 0.55, title: "Watchdog Timer", desc: "Dedicated 128 kHz oscillator supervises and recovers stalled firmware." },
  { phase: 0.65, title: "Power Management", desc: "Six sleep modes; power-down current is typically under 1 µA." },
];

const EXPERIMENTS = [
  { id: "exp01_led_blinking", title: "LED Blinking", difficulty: "Beginner", aim: "Blink an LED using GPIO and delay loops.", icon: "💡", color: "#00ff88" },
  { id: "exp02_push_button", title: "Push Button & Debouncing", difficulty: "Beginner", aim: "Read a button with internal pull-ups and debounce logic.", icon: "🔘", color: "#00ccff" },
  { id: "exp03_seven_segment", title: "7-Segment Display", difficulty: "Beginner", aim: "Drive a 7-segment display using look-up tables.", icon: "🔢", color: "#ff9900" },
  { id: "exp04_external_interrupts", title: "External Interrupts", difficulty: "Intermediate", aim: "Use INT0/INT1 to handle hardware events via ISRs.", icon: "⚡", color: "#ff3366" },
  { id: "exp05_timer0_normal", title: "Timer0 Normal Mode", difficulty: "Intermediate", aim: "Use Timer0 overflow interrupts for non-blocking LED blink.", icon: "⏱️", color: "#cc66ff" },
  { id: "exp06_timer1_ctc", title: "Timer1 CTC Mode", difficulty: "Intermediate", aim: "Generate precise 1Hz signals using CTC and OCR1A.", icon: "🎯", color: "#ffcc00" },
  { id: "exp07_pwm_fast", title: "Fast PWM & LED Fading", difficulty: "Intermediate", aim: "Fade an LED smoothly using Timer0 Fast PWM mode.", icon: "🌗", color: "#33cccc" },
  { id: "exp08_pwm_phase_correct", title: "Phase Correct PWM", difficulty: "Intermediate", aim: "Drive servos with symmetric Phase Correct PWM.", icon: "🔄", color: "#ff6633" },
  { id: "exp09_adc_polling", title: "ADC (Analog-to-Digital)", difficulty: "Intermediate", aim: "Read analog voltages from a potentiometer.", icon: "🎛️", color: "#66ff99" },
  { id: "exp10_uart_tx", title: "UART Serial Transmit", difficulty: "Intermediate", aim: "Configure USART and transmit data over serial.", icon: "📡", color: "#3399ff" },
  { id: "exp11_uart_rx_interrupts", title: "UART Receive Interrupts", difficulty: "Intermediate", aim: "Build an interrupt-driven UART receiver.", icon: "📥", color: "#ff66cc" },
  { id: "exp12_spi_master", title: "SPI Master", difficulty: "Advanced", aim: "Execute high-speed SPI data exchange.", icon: "🔗", color: "#99cc33" },
  { id: "exp13_i2c_master", title: "I2C / TWI Master", difficulty: "Advanced", aim: "Address I2C slave devices using TWI.", icon: "🔌", color: "#ff4444" },
  { id: "exp14_eeprom_rw", title: "EEPROM Read/Write", difficulty: "Advanced", aim: "Store persistent data through power cycles.", icon: "💾", color: "#44aaff" },
  { id: "exp15_watchdog_timer", title: "Watchdog Timer", difficulty: "Advanced", aim: "Auto-reset a crashed MCU using the WDT.", icon: "🐕", color: "#ffaa00" },
];

const FEATURES = [
  { icon: "⬡", title: "Real-Time Simulation", desc: "Watch register states update live as your C code executes." },
  { icon: "🔬", title: "15 Guided Experiments", desc: "Progress from blinking LEDs to Watchdog Timers." },
  { icon: "🤖", title: "AI Lab Assistant", desc: "Ask questions about registers, interrupts, or timers." },
  { icon: "🧩", title: "Drag & Drop Components", desc: "Wire LEDs, buttons, servos on the virtual breadboard." },
];

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const easeInOutCubic = (value) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [smoothScrollY, setSmoothScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [visibleCards, setVisibleCards] = useState(new Set());
  const pageRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Smooth scroll tracking with requestAnimationFrame
  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;
    
    let targetScrollY = 0;
    
    const handleScroll = () => {
      targetScrollY = container.scrollTop;
    };
    
    const updateSmoothScroll = () => {
      setSmoothScrollY(prev => {
        const diff = targetScrollY - prev;
        if (Math.abs(diff) < 0.5) return targetScrollY;
        return prev + diff * 0.12;
      });
      animationFrameRef.current = requestAnimationFrame(updateSmoothScroll);
    };
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    animationFrameRef.current = requestAnimationFrame(updateSmoothScroll);
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Sync video playback to smooth scroll position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const scrollRange = 2000;
    const progress = Math.min(smoothScrollY / scrollRange, 1);
    video.currentTime = progress * video.duration;
  }, [smoothScrollY]);

  // Video metadata load — pause autoplay so we control manually
  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  // Intersection observer for experiment card reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleCards((prev) => new Set([...prev, entry.target.dataset.idx]));
        }
      });
    }, { threshold: 0.1 });
    const cards = document.querySelectorAll("[data-idx]");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // Phase calculation: 0 = top, 1 = fully deconstructed
  const deconstructPhase = Math.min(smoothScrollY / 2000, 1);
  const videoFade = easeInOutCubic((deconstructPhase - 0.86) / 0.12);
  const videoOpacity = Math.max(1 - 0.75 * videoFade, 0.32);
  const contentReveal = easeInOutCubic((deconstructPhase - 0.62) / 0.28);
  const transitionBridge = easeInOutCubic((deconstructPhase - 0.55) / 0.35);

  return (
    <div ref={pageRef} style={styles.page}>
      {/* ════════════════════════════════════════════════════════
          FIXED CHIP VIDEO LAYER — Scroll-driven deconstruction
          ════════════════════════════════════════════════════════ */}
      <div style={{ ...styles.fixedVideoLayer, opacity: videoOpacity }}>
        {/* Video */}
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleVideoLoad}
          style={styles.chipVideo}
        />
        {/* Enhanced video with quality filters */}
        <div style={styles.videoQualityLayer} />
        {/* Dark overlay that increases as we scroll */}
        <div style={{ ...styles.videoOverlay, opacity: 0.1 + deconstructPhase * 0.25 }} />

        {/* Title overlay — fades out as scroll begins */}
        <div style={{ ...styles.titleOverlay, opacity: Math.max(0, 1 - deconstructPhase * 3) }}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            ATmega328P Microcontroller
          </div>
          <h1 style={styles.heroTitle}>
            Master Embedded<br />
            Programming <span style={styles.heroGradient}>Hands-On</span>
          </h1>
          <p style={styles.heroSub}>
            Scroll down to explore what's inside the chip
          </p>
          <div style={styles.scrollIndicator}>
            <div style={styles.scrollMouse}>
              <div style={styles.scrollWheel} />
            </div>
            <span style={{ color: "#555", fontSize: "12px", marginTop: "8px" }}>Scroll to deconstruct</span>
          </div>
        </div>

        {/* LEFT INFO PANEL — appears as chip opens */}
        <div style={styles.leftInfoPanel}>
          {LEFT_INFO.map((info, i) => {
            const itemOpacity = deconstructPhase > info.phase ? Math.min((deconstructPhase - info.phase) / 0.08, 1) : 0;
            const itemX = itemOpacity < 1 ? -30 * (1 - itemOpacity) : 0;
            return (
              <div key={i} style={{
                ...styles.infoItem,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}>
                <h4 style={styles.infoTitle}>{info.title}</h4>
                <p style={styles.infoDesc}>{info.desc}</p>
              </div>
            );
          })}
        </div>

        {/* RIGHT INFO PANEL — appears as chip opens */}
        <div style={styles.rightInfoPanel}>
          {RIGHT_INFO.map((info, i) => {
            const itemOpacity = deconstructPhase > info.phase ? Math.min((deconstructPhase - info.phase) / 0.08, 1) : 0;
            const itemX = itemOpacity < 1 ? 30 * (1 - itemOpacity) : 0;
            return (
              <div key={i} style={{
                ...styles.infoItem,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
                textAlign: "right",
              }}>
                <h4 style={styles.infoTitle}>{info.title}</h4>
                <p style={styles.infoDesc}>{info.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Center glow */}
        {deconstructPhase > 0.3 && (
          <div style={{
            ...styles.centerGlow,
            opacity: (deconstructPhase - 0.3) * 0.4,
            width: `${200 + deconstructPhase * 300}px`,
            height: `${200 + deconstructPhase * 300}px`,
          }} />
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          SCROLL SPACER — This creates the scrollable area for the video
          ════════════════════════════════════════════════════════ */}
      <div style={{ height: "2200px", position: "relative", zIndex: 0 }} />

      {/* ════════════════════════════════════════════════════════
          CONTENT SECTIONS — appear AFTER full deconstruction
          ════════════════════════════════════════════════════════ */}
      {/* Seamless transition bridge */}
      <div style={{
        ...styles.transitionBridge,
        opacity: transitionBridge,
        transform: `translateY(${(1 - transitionBridge) * 60}px)`,
      }} />

      <div style={{
        ...styles.contentWrapper,
        opacity: contentReveal > 0 ? contentReveal : 0,
        transform: `translateY(${(1 - contentReveal) * 60}px)`,
      }}>

        {/* NAV BAR — sticky after video phase */}
        <nav style={{
          ...styles.nav,
          opacity: contentReveal,
          transform: `translateY(${contentReveal < 1 ? -20 * (1 - contentReveal) : 0}px)`,
        }}>
          <div style={styles.navBrand}>
            <span style={styles.navLogo}>⬡</span>
            <span style={styles.navTitle}>ATmega328P <span style={styles.navAccent}>Virtual Lab</span></span>
          </div>
          <div style={styles.navLinks}>
            <a href="#experiments" style={styles.navLink}>Experiments</a>
            <a href="#features" style={styles.navLink}>Features</a>
            <button style={styles.navBtn} onClick={() => navigate("/sandbox")}>Open Sandbox →</button>
          </div>
        </nav>

        {/* CHIP SUMMARY */}
        <section style={styles.summarySection}>
          <h2 style={{ ...styles.sectionHeading, ...styles.heatHeading }}>
            ATMEGA<span style={styles.heatDigits}>328</span>P-PU
          </h2>
          <p style={styles.summaryText}>
            The heart of the Arduino UNO. A 28-pin, 8-bit AVR RISC microcontroller by Microchip Technology
            — running 131 instructions at up to 20 MHz with 32KB Flash, 2KB SRAM, and 1KB EEPROM.
          </p>
          <div style={styles.chipStatsRow}>
            {[
              { v: "32 kB", l: "Flash" }, { v: "2 kB", l: "SRAM" }, { v: "1 kB", l: "EEPROM" },
              { v: "23", l: "GPIO", unit: "pins" }, { v: "16 MHz", l: "System clock" }, { v: "6", l: "ADC channels" },
            ].map((s, i) => (
              <div key={i} style={styles.chipStat}>
                <span style={styles.chipStatVal}>{s.v}</span>
                <span style={styles.chipStatLabel}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={styles.heroBtns}>
            <button style={styles.primaryBtn} onClick={() => navigate("/sandbox")}>⚙️ Launch Sandbox</button>
            <button style={styles.secondaryBtn} onClick={() => document.getElementById("experiments")?.scrollIntoView({ behavior: "smooth" })}>📖 Browse Experiments</button>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={styles.featuresSection}>
          <h2 style={{ ...styles.sectionHeading, ...styles.heatHeading }}>Why Virtual Lab?</h2>
          <p style={styles.sectionSub}>Everything you need to learn embedded systems — zero hardware required.</p>
          <div style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EXPERIMENTS GRID */}
        <section id="experiments" style={styles.experimentsSection}>
          <h2 style={{ ...styles.sectionHeading, ...styles.heatHeading }}>
            <span style={styles.heatDigits}>15</span> Progressive Experiments
          </h2>
          <p style={styles.sectionSub}>From first blink to watchdog reset — each builds on the last.</p>
          <div style={styles.grid}>
            {EXPERIMENTS.map((exp, idx) => {
              const isVisible = visibleCards.has(String(idx));
              return (
                <div
                  key={exp.id}
                  data-idx={idx}
                  style={{
                    ...styles.expCard,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? (hoveredCard === exp.id ? "translateY(-8px) scale(1.02)" : "translateY(0)") : "translateY(30px)",
                    borderColor: hoveredCard === exp.id ? exp.color + "66" : "rgba(255,255,255,0.06)",
                    boxShadow: hoveredCard === exp.id ? `0 0 40px ${exp.color}15, 0 20px 40px rgba(0,0,0,0.3)` : "0 2px 20px rgba(0,0,0,0.2)",
                    transitionDelay: isVisible ? `${idx * 40}ms` : "0ms",
                  }}
                  onMouseEnter={() => setHoveredCard(exp.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(`/experiment/${exp.id}`)}
                >
                  <div style={styles.expCardTop}>
                    <span style={styles.expNum}>{String(idx + 1).padStart(2, "0")}</span>
                    <span style={{
                      ...styles.expBadge,
                      color: exp.difficulty === "Beginner" ? "#00ff88" : exp.difficulty === "Intermediate" ? "#ffcc00" : "#ff3366",
                      borderColor: exp.difficulty === "Beginner" ? "#00ff8833" : exp.difficulty === "Intermediate" ? "#ffcc0033" : "#ff336633",
                      background: exp.difficulty === "Beginner" ? "#00ff8810" : exp.difficulty === "Intermediate" ? "#ffcc0010" : "#ff336610",
                    }}>{exp.difficulty}</span>
                  </div>
                  <div style={{ ...styles.expIcon, color: exp.color }}>{exp.icon}</div>
                  <h3 style={styles.expTitle}>{exp.title}</h3>
                  <p style={styles.expAim}>{exp.aim}</p>
                  <div style={{ ...styles.expArrow, color: exp.color }}>Start Lab →</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={styles.ctaSection}>
          <div style={styles.ctaGlow} />
          <h2 style={styles.ctaTitle}>Ready to Build?</h2>
          <p style={styles.ctaSub}>Jump into the sandbox and write real AVR C code. No downloads. No setup.</p>
          <button style={styles.ctaBtn} onClick={() => navigate("/sandbox")}>⚙️ Launch Sandbox</button>
        </section>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <div style={styles.footerBrand}>
              <span style={{ color: "#00ffcc", fontSize: "24px" }}>⬡</span>
              <span style={{ fontWeight: 700 }}>ATmega328P Virtual Lab</span>
            </div>
            <p style={styles.footerText}>Built for students, by students. Open source, free forever.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const styles = {
  page: {
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#0d0d0d",
    color: "#fff",
    fontFamily: "'Times New Roman', Times, serif",
    position: "relative",
  },

  /* FIXED VIDEO LAYER */
  fixedVideoLayer: {
    position: "fixed",
    top: 0, left: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    pointerEvents: "none",
  },
  chipVideo: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    minWidth: "100%",
    minHeight: "100%",
    objectFit: "cover",
    willChange: "transform",
    backfaceVisibility: "hidden",
  },
  videoQualityLayer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)",
    pointerEvents: "none",
    mixBlendMode: "overlay",
  },
  videoOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "linear-gradient(180deg, rgba(13,13,13,0.4) 0%, rgba(13,13,13,0.7) 100%)",
    pointerEvents: "none",
  },

  /* TITLE OVERLAY */
  titleOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    zIndex: 5,
    transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(0,255,204,0.08)",
    border: "1px solid rgba(0,255,204,0.2)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#00ffcc",
    marginBottom: "24px",
    backdropFilter: "blur(8px)",
  },
  heroBadgeDot: {
    width: "6px", height: "6px",
    borderRadius: "50%",
    background: "#00ffcc",
    animation: "pulse 2s infinite",
  },
  heroTitle: {
    fontFamily: "'Heat Robox', 'Times New Roman', Times, serif",
    fontSize: "54px",
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-1.8px",
    fontFeatureSettings: "'liga' 0, 'dlig' 0",
    fontVariantLigatures: "none",
    margin: "0 0 20px 0",
    textShadow: "0 4px 30px rgba(0,0,0,0.6)",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #00ffcc, #00ff88, #00ccff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "18px",
    color: "#aaa",
    margin: "0 0 40px 0",
    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
  },
  scrollIndicator: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "float 2s ease-in-out infinite",
  },
  scrollMouse: {
    width: "24px", height: "38px",
    borderRadius: "12px",
    border: "2px solid rgba(255,255,255,0.3)",
    display: "flex",
    justifyContent: "center",
    paddingTop: "8px",
  },
  scrollWheel: {
    width: "3px", height: "8px",
    borderRadius: "2px",
    background: "#00ffcc",
    animation: "float 1.5s ease-in-out infinite",
  },

  /* INFO PANELS (flanking the chip video) */
  leftInfoPanel: {
    position: "absolute",
    left: "40px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "280px",
    zIndex: 10,
  },
  rightInfoPanel: {
    position: "absolute",
    right: "40px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "280px",
    zIndex: 10,
  },
  infoItem: {
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  infoTitle: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "14px",
    fontWeight: 700,
    color: "#00ffcc",
    margin: "0 0 4px 0",
    letterSpacing: "-0.3px",
  },
  infoDesc: {
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.5,
    margin: 0,
  },
  centerGlow: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    background: "radial-gradient(circle, rgba(0,255,204,0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },

  /* TRANSITION BRIDGE - Seamless gradient between video and content */
  transitionBridge: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    zIndex: 1,
    background: "linear-gradient(180deg, rgba(13,13,13,0.0) 0%, rgba(13,13,13,0.35) 25%, rgba(13,13,13,0.65) 55%, rgba(13,13,13,0.9) 100%)",
    pointerEvents: "none",
    transition: "opacity 0.1s linear, transform 0.1s linear",
  },

  /* CONTENT WRAPPER (everything after video) */
  contentWrapper: {
    position: "relative",
    zIndex: 2,
    background: "linear-gradient(180deg, rgba(13,13,13,0.25) 0%, rgba(13,13,13,0.45) 20%, rgba(13,13,13,0.7) 55%, rgba(13,13,13,0.92) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    marginTop: "-100vh",
    paddingTop: "100vh",
  },

  /* NAV */
  nav: {
    position: "sticky",
    top: 0,
    height: "64px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    zIndex: 100,
    background: "rgba(13,13,13,0.78)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  navBrand: { display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Times New Roman', Times, serif" },
  navLogo: { color: "#00ffcc", fontSize: "24px" },
  navTitle: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  navAccent: { color: "#00ffcc" },
  navLinks: { display: "flex", alignItems: "center", gap: "24px" },
  navLink: { color: "#888", fontSize: "14px", textDecoration: "none", fontWeight: 500 },
  navBtn: {
    background: "linear-gradient(135deg, #00ffcc, #00cc99)",
    color: "#000", border: "none",
    padding: "8px 20px", borderRadius: "8px",
    fontWeight: 700, fontSize: "13px", cursor: "pointer",
  },

  /* SUMMARY */
  summarySection: {
    textAlign: "center",
    padding: "80px 40px 60px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  sectionHeading: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "42px",
    fontWeight: 800,
    textAlign: "center",
    letterSpacing: "-1px",
    margin: "0 0 12px 0",
  },
  heatHeading: {
    fontFamily: "'Heat Robox', 'Times New Roman', Times, serif",
    letterSpacing: "-0.4px",
    fontFeatureSettings: "'liga' 0, 'dlig' 0",
    fontVariantLigatures: "none",
    fontSize: "36px",
  },
  heatDigits: {
    fontFamily: "'Cyber Alert Numbers', 'Heat Robox', 'Times New Roman', Times, serif",
    letterSpacing: "-0.2px",
    fontFeatureSettings: "'liga' 0, 'dlig' 0",
    fontVariantLigatures: "none",
    display: "inline-block",
  },
  summaryText: {
    fontSize: "17px", color: "#888",
    lineHeight: 1.7, margin: "0 0 40px 0",
    maxWidth: "600px", marginLeft: "auto", marginRight: "auto",
  },
  chipStatsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    flexWrap: "wrap",
    marginBottom: "40px",
  },
  chipStat: {
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  chipStatVal: {
    fontSize: "24px", fontWeight: 800, color: "#fff",
    fontFamily: "'Times New Roman', Times, serif",
  },
  chipStatLabel: {
    fontSize: "11px", color: "#555", fontWeight: 500,
    textTransform: "uppercase", letterSpacing: "1px",
  },
  heroBtns: {
    display: "flex", gap: "14px", justifyContent: "center",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #00ffcc, #00cc99)",
    color: "#000", border: "none",
    padding: "14px 28px", borderRadius: "12px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 0 30px rgba(0,255,204,0.2)",
  },
  secondaryBtn: {
    background: "transparent",
    color: "#00ffcc",
    border: "1px solid rgba(0,255,204,0.2)",
    padding: "14px 28px", borderRadius: "12px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
  },

  /* FEATURES */
  featuresSection: {
    padding: "80px 60px",
    maxWidth: "1200px", margin: "0 auto",
  },
  sectionSub: {
    fontSize: "16px", color: "#666",
    textAlign: "center", margin: "0 0 60px 0",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "32px 24px",
    textAlign: "center",
  },
  featureIcon: { fontSize: "36px", marginBottom: "16px" },
  featureTitle: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 10px 0",
    letterSpacing: "-0.03em",
  },
  featureDesc: { fontSize: "13px", color: "#888", lineHeight: 1.6, margin: 0 },

  /* EXPERIMENTS */
  experimentsSection: {
    padding: "80px 40px 100px",
    maxWidth: "1400px", margin: "0 auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: "18px",
  },
  expCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "28px 24px",
    cursor: "pointer",
    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  expCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  expNum: { fontFamily: "'Times New Roman', Times, serif", fontSize: "12px", color: "#333", fontWeight: 700 },
  expBadge: {
    fontSize: "10px", padding: "3px 10px",
    borderRadius: "20px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px",
    border: "1px solid",
  },
  expIcon: { fontSize: "32px", margin: "4px 0" },
  expTitle: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "22px",
    fontWeight: 700,
    margin: 0,
    color: "#eee",
    letterSpacing: "-0.025em",
  },
  expAim: { fontSize: "13px", color: "#666", lineHeight: 1.5, margin: 0, flex: 1 },
  expArrow: { fontSize: "13px", fontWeight: 700, marginTop: "8px" },

  /* CTA */
  ctaSection: {
    position: "relative", textAlign: "center",
    padding: "100px 40px", overflow: "hidden",
  },
  ctaGlow: {
    position: "absolute",
    top: "50%", left: "50%",
    width: "600px", height: "300px",
    background: "radial-gradient(ellipse, rgba(0,255,204,0.06) 0%, transparent 70%)",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  ctaTitle: {
    fontFamily: "'Heat Robox', 'Times New Roman', Times, serif",
    fontSize: "42px",
    fontWeight: 800,
    letterSpacing: "-1px",
    fontFeatureSettings: "'liga' 0, 'dlig' 0",
    fontVariantLigatures: "none",
    margin: "0 0 14px 0",
  },
  ctaSub: { fontSize: "17px", color: "#666", margin: "0 0 32px 0" },
  ctaBtn: {
    background: "linear-gradient(135deg, #00ffcc, #00cc99)",
    color: "#000", border: "none",
    padding: "16px 40px", borderRadius: "14px",
    fontSize: "17px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 0 40px rgba(0,255,204,0.25)",
  },

  /* FOOTER */
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "40px",
  },
  footerInner: {
    maxWidth: "1200px", margin: "0 auto",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  footerBrand: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" },
  footerText: { color: "#444", fontSize: "13px", margin: 0 },
};
