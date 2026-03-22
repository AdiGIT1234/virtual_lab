/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";
import { useAuth } from "../context/useAuth";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useInView,
} from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const LEFT_SPECS = [
  { phase: 0.12, title: "8-bit AVR RISC Core", desc: "131 documented instructions, most completing in a single clock cycle.", hex: "0x0E 0xAA" },
  { phase: 0.22, title: "32 kB Flash Memory", desc: "Non-volatile program storage with 10,000-cycle endurance rating.", hex: "0x7FFF" },
  { phase: 0.32, title: "2 kB SRAM", desc: "High-speed volatile memory for the stack and working registers.", hex: "0x08FF" },
  { phase: 0.42, title: "1 kB EEPROM", desc: "Byte-addressable non-volatile data for calibration and user settings.", hex: "0x03FF" },
  { phase: 0.52, title: "23 GPIO Pins", desc: "Ports B, C, and D expose configurable digital I/O for every pin.", hex: "0xDDRB" },
  { phase: 0.62, title: "6-ch 10-bit ADC", desc: "Analog inputs (ADC0–ADC5) with up to 15 kSPS throughput.", hex: "0xADMUX" },
];

const RIGHT_SPECS = [
  { phase: 0.12, title: "Up to 20 MHz Clock", desc: "Runs at 16 MHz on Arduino Uno boards with optional 20 MHz crystal.", hex: "0xCLKPR" },
  { phase: 0.22, title: "3 Timer/Counters", desc: "Two 8-bit timers (0, 2) plus a 16-bit Timer1 with PWM outputs.", hex: "0xTCCR" },
  { phase: 0.32, title: "USART, SPI, TWI", desc: "Hardware UART, SPI master/slave, and I²C-compatible TWI peripherals.", hex: "0xUCSR" },
  { phase: 0.42, title: "External & Pin IRQs", desc: "INT0/INT1 plus 23 pin-change interrupts for responsive firmware.", hex: "0xEICRA" },
  { phase: 0.52, title: "Watchdog Timer", desc: "Dedicated 128 kHz oscillator supervises and recovers stalled firmware.", hex: "0xWDTCSR" },
  { phase: 0.62, title: "Power Management", desc: "Six sleep modes; power-down current is typically under 1 µA.", hex: "0xSMCR" },
];

const EXPERIMENTS = [
  { id: "exp01_led_blinking", title: "LED Blinking", difficulty: "Core", aim: "Blink an LED using GPIO and delay loops.", icon: "💡", color: "#00F2FF", wave: "▁▃▅▇▅▃▁▃▅▇" },
  { id: "exp02_push_button", title: "Push Button & Debouncing", difficulty: "Core", aim: "Read a button with internal pull-ups and debounce logic.", icon: "🔘", color: "#00F2FF", wave: "▇▁▇▁▇▁▇▁▇▁" },
  { id: "exp03_seven_segment", title: "7-Segment Display", difficulty: "Core", aim: "Drive a 7-segment display using look-up tables.", icon: "🔢", color: "#00F2FF", wave: "▁▁▇▇▁▁▇▇▁▁" },
  { id: "exp04_external_interrupts", title: "External Interrupts", difficulty: "System", aim: "Use INT0/INT1 to handle hardware events via ISRs.", icon: "⚡", color: "#7000FF", wave: "▁▁▁▇▁▁▁▇▁▁" },
  { id: "exp05_timer0_normal", title: "Timer0 Normal Mode", difficulty: "System", aim: "Use Timer0 overflow interrupts for non-blocking LED blink.", icon: "⏱️", color: "#7000FF", wave: "▁▃▅▇▁▃▅▇▁▃" },
  { id: "exp06_timer1_ctc", title: "Timer1 CTC Mode", difficulty: "System", aim: "Generate precise 1Hz signals using CTC and OCR1A.", icon: "🎯", color: "#7000FF", wave: "▁▁▇▁▁▇▁▁▇▁" },
  { id: "exp07_pwm_fast", title: "Fast PWM & LED Fading", difficulty: "System", aim: "Fade an LED smoothly using Timer0 Fast PWM mode.", icon: "🌗", color: "#7000FF", wave: "▁▂▃▄▅▆▇▆▅▄" },
  { id: "exp08_pwm_phase_correct", title: "Phase Correct PWM", difficulty: "System", aim: "Drive servos with symmetric Phase Correct PWM.", icon: "🔄", color: "#7000FF", wave: "▁▃▅▇▅▃▁▃▅▇" },
  { id: "exp09_adc_polling", title: "ADC (Analog-to-Digital)", difficulty: "System", aim: "Read analog voltages from a potentiometer.", icon: "🎛️", color: "#7000FF", wave: "▃▄▅▆▇▆▅▄▃▂" },
  { id: "exp10_uart_tx", title: "UART Serial Transmit", difficulty: "System", aim: "Configure USART and transmit data over serial.", icon: "📡", color: "#7000FF", wave: "▇▁▇▇▁▇▁▁▇▁" },
  { id: "exp11_uart_rx_interrupts", title: "UART Receive Interrupts", difficulty: "System", aim: "Build an interrupt-driven UART receiver.", icon: "📥", color: "#7000FF", wave: "▁▇▁▁▇▁▇▇▁▇" },
  { id: "exp12_spi_master", title: "SPI Master", difficulty: "Kernel", aim: "Execute high-speed SPI data exchange.", icon: "🔗", color: "#ff3366", wave: "▇▁▇▁▇▇▁▇▁▇" },
  { id: "exp13_i2c_master", title: "I2C / TWI Master", difficulty: "Kernel", aim: "Address I2C slave devices using TWI.", icon: "🔌", color: "#ff3366", wave: "▁▇▇▁▁▇▇▁▁▇" },
  { id: "exp14_eeprom_rw", title: "EEPROM Read/Write", difficulty: "Kernel", aim: "Store persistent data through power cycles.", icon: "💾", color: "#ff3366", wave: "▁▃▇▃▁▃▇▃▁▃" },
  { id: "exp15_watchdog_timer", title: "Watchdog Timer", difficulty: "Kernel", aim: "Auto-reset a crashed MCU using the WDT.", icon: "🐕", color: "#ff3366", wave: "▁▁▁▁▇▁▁▁▁▇" },
];

const FEATURES = [
  { icon: "⬡", title: "Real-Time Simulation", desc: "Watch register states update live as your C code executes on the emulated AVR core." },
  { icon: "🔬", title: "15 Guided Experiments", desc: "Progress from blinking LEDs to building Watchdog Timer recovery systems." },
  { icon: "🤖", title: "AI Lab Assistant", desc: "Ask questions about registers, interrupts, or timers — get instant context-aware answers." },
  { icon: "🧩", title: "Drag & Drop Components", desc: "Wire LEDs, buttons, servos, and sensors directly on the virtual breadboard." },
];

const CHIP_STATS = [
  { value: 32, suffix: "kB", label: "FLASH" },
  { value: 2, suffix: "kB", label: "SRAM" },
  { value: 1, suffix: "kB", label: "EEPROM" },
  { value: 23, suffix: "", label: "GPIO PINS" },
  { value: 16, suffix: "MHz", label: "CLOCK" },
  { value: 6, suffix: "", label: "ADC CH" },
];

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Scanline Overlay ── */
function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-9999 opacity-[0.03]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
      }}
    />
  );
}

/* ── HUD Info Panel Item ── */
function HudInfoItem({ info, phase, side, index }) {
  const isLeft = side === "left";
  const visible = phase > info.phase;
  const itemProgress = visible ? Math.min((phase - info.phase) / 0.08, 1) : 0;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: itemProgress,
        x: isLeft ? (itemProgress < 1 ? -40 * (1 - itemProgress) : 0) : (itemProgress < 1 ? 40 * (1 - itemProgress) : 0),
      }}
      transition={{ duration: 0.1 }}
      className={`relative flex items-start gap-3 ${isLeft ? "" : "flex-row-reverse"}`}
    >
      {/* Leader line */}
      <div className={`shrink-0 flex items-center gap-1.5 ${isLeft ? "" : "flex-row-reverse"}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_8px_#00F2FF]" />
        <div
          className="h-px bg-linear-to-r from-[#00F2FF] to-transparent"
          style={{ width: `${30 + index * 8}px`, opacity: itemProgress }}
        />
      </div>
      {/* Info content */}
      <div className={`${isLeft ? "text-left" : "text-right"}`}>
        <div className="flex items-center gap-2 mb-0.5" style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}>
          <span className="text-[#00F2FF] text-xs font-bold tracking-wider font-mono uppercase">
            {info.title}
          </span>
        </div>
        <p className="text-(--lp-text-low) text-[11px] leading-relaxed max-w-[240px] font-light">
          {info.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Animated Counter ── */
function AnimatedCounter({ value, suffix, inView }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      hasAnimated.current = true;
      let start = 0;
      const duration = 1200;
      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(start + (value - start) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [inView, value]);

  return (
    <span className="text-[#00F2FF] text-2xl md:text-3xl font-black tracking-tighter" style={{ fontFamily: "'Cyber Alert Numbers', 'JetBrains Mono', monospace" }}>
      {count}
      <span className="text-lg ml-0.5 text-[#00F2FF]/70" style={{ fontFamily: "'Heat Robox', sans-serif" }}>{suffix}</span>
    </span>
  );
}

/* ── Feature Card with 3D tilt ── */
function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  }, []);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        ref={cardRef}
        className="relative group cursor-default"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: "800px",
        }}
      >
        <div
          className="relative overflow-hidden p-8 border border-(--lp-border) transition-all duration-300"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            background: isHovered
              ? "linear-gradient(135deg, rgba(0,242,255,0.06) 0%, rgba(112,0,255,0.04) 100%)"
              : "var(--lp-card-base)",
          }}
        >
          {/* Circuit trace glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 48%, rgba(0,242,255,0.04) 49%, rgba(0,242,255,0.04) 51%, transparent 52%),
                linear-gradient(0deg, transparent 48%, rgba(0,242,255,0.04) 49%, rgba(0,242,255,0.04) 51%, transparent 52%)
              `,
              backgroundSize: "30px 30px",
            }}
          />

          {/* Clip corner accents */}
          <div className="absolute top-0 right-0 w-5 h-5">
            <div className="absolute top-0 right-0 w-px h-5 bg-linear-to-b from-[#00F2FF]/50 to-transparent" />
            <div className="absolute top-0 right-0 h-px w-5 bg-linear-to-l from-[#00F2FF]/50 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 w-5 h-5">
            <div className="absolute bottom-0 left-0 w-px h-5 bg-linear-to-t from-[#00F2FF]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 h-px w-5 bg-linear-to-r from-[#00F2FF]/50 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="text-4xl mb-5 transition-transform duration-300 group-hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="text-(--lp-text-main) text-lg font-bold mb-2 tracking-tight">
              {feature.title}
            </h3>
            <p className="text-(--lp-text-low) text-sm leading-relaxed">
              {feature.desc}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Auth Dock ── */
function AuthDock() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", institute: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Password requirement checks
  const pw = form.password;
  const pwChecks = [
    { label: "Use 8 or more characters", ok: pw.length >= 8 },
    { label: "Use an upper case letter", ok: /[A-Z]/.test(pw) },
    { label: "Use a lower case letter", ok: /[a-z]/.test(pw) },
    { label: "Use a number", ok: /[0-9]/.test(pw) },
    { label: "Use a symbol (e.g., $@!%*?&)", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const allPwValid = pwChecks.every((c) => c.ok);
  const passwordsMatch = pw.length > 0 && form.confirmPassword.length > 0 && pw === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password || (mode === "signup" && !form.name)) {
      setError("Fill all required fields");
      return;
    }
    if (mode === "signup") {
      if (!allPwValid) {
        setError("Password does not meet all requirements");
        return;
      }
      if (!passwordsMatch) {
        setError("Passwords do not match");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup({
          email: form.email,
          password: form.password,
          name: form.name,
          institute: form.institute,
        });
        // Stay on page
      } else {
        await login({ email: form.email, password: form.password });
        // Stay on page
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border border-(--lp-border) px-4 py-3 text-sm text-(--lp-text-main) placeholder-[#64748B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF]";

  return (
    <motion.div
      id="auth-dock"
      className="w-full max-w-sm border border-(--lp-border) bg-(--lp-auth-bg) backdrop-blur-xl p-6 sm:p-7"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))" }}
    >
      <div className="flex items-center gap-2 mb-4 text-[11px] tracking-[0.2em] font-mono text-(--lp-text-low) uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] shadow-[0_0_8px_#00F2FF]" />
        <span>{mode === "login" ? "Secure Access" : "Create Access"}</span>
      </div>

      <div className="flex mb-6 border border-(--lp-border)">
        {["login", "signup"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-[0.2em] ${mode === tab ? "text-[#050505]" : "text-(--lp-text-mid)"}`}
            style={{
              background: mode === tab ? "linear-gradient(135deg, #00F2FF, #7000FF)" : "transparent",
              transition: "all 0.2s ease",
            }}
            onClick={() => setMode(tab)}
          >
            {tab === "login" ? "Login" : "Signup"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <div>
              <label className="text-xs uppercase text-(--lp-text-mid) tracking-[0.2em] mb-1 block">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Aditya Singh" />
            </div>
            <div>
              <label className="text-xs uppercase text-(--lp-text-mid) tracking-[0.2em] mb-1 block">Institute</label>
              <input name="institute" value={form.institute} onChange={handleChange} className={inputClass} placeholder="IIT Bombay" />
            </div>
          </>
        )}
        <div>
          <label className="text-xs uppercase text-(--lp-text-mid) tracking-[0.2em] mb-1 block">Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="aditya@lab.ai" />
        </div>
        <div>
          <label className="text-xs uppercase text-(--lp-text-mid) tracking-[0.2em] mb-1 block">Password *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
        </div>

        {/* Password requirements checklist (signup only) */}
        {mode === "signup" && pw.length > 0 && (
          <div className="space-y-1 pl-1">
            {pwChecks.map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-[11px] font-mono">
                <span style={{ color: check.ok ? "#00F2FF" : "#64748B", fontSize: "12px", lineHeight: 1 }}>
                  {check.ok ? "✓" : "○"}
                </span>
                <span style={{ color: check.ok ? "#00F2FF" : "#94A3B8" }}>{check.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Password confirmation (signup only) */}
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase text-(--lp-text-mid) tracking-[0.2em] mb-1 block">Password Confirmation</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className={inputClass} placeholder="••••••••" />
            {form.confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                <span style={{ color: passwordsMatch ? "#00FFB2" : "#ff3366", fontSize: "12px" }}>
                  {passwordsMatch ? "✓" : "✗"}
                </span>
                <span style={{ color: passwordsMatch ? "#00FFB2" : "#ff3366" }}>
                  {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-[11px] text-[#ff3366] font-mono tracking-wider">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-xs font-black tracking-[0.25em] uppercase border-0 text-[#050505] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          {loading ? "Initializing…" : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>

      <div className="mt-4 text-[11px] text-(--lp-text-low) font-mono tracking-widest">
        {mode === "login" ? "New here? Toggle to signup." : "Have credentials? Toggle to login."}
      </div>
    </motion.div>
  );
}

/* ── Experiment Card ── */
function ExperimentCard({ exp, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const diffColors = {
    Core: { bg: "rgba(0,242,255,0.08)", border: "rgba(0,242,255,0.25)", text: "#00F2FF" },
    System: { bg: "rgba(112,0,255,0.08)", border: "rgba(112,0,255,0.25)", text: "#A855F7" },
    Kernel: { bg: "rgba(255,51,102,0.08)", border: "rgba(255,51,102,0.25)", text: "#ff3366" },
  };
  const dc = diffColors[exp.difficulty];

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 5) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative group text-left w-full cursor-pointer border border-(--lp-border) rounded-none overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      onClick={() => navigate(`/experiment/${exp.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered
          ? `linear-gradient(135deg, ${exp.color}08 0%, transparent 100%)`
          : "var(--lp-card-base)",
        borderColor: isHovered ? `${exp.color}33` : "var(--lp-border)",
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
      }}
    >
      {/* Background waveform pattern */}
      <div className="absolute bottom-0 right-0 opacity-[0.04] group-hover:opacity-[0.08] text-[40px] font-mono leading-none tracking-widest pointer-events-none transition-opacity duration-500 p-3" style={{ color: exp.color }}>
        {exp.wave}
      </div>

      <div className="relative z-10 p-6">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-(--lp-text-inverse-muted) text-xs font-mono font-bold">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className="text-[10px] px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-widest border"
            style={{ background: dc.bg, borderColor: dc.border, color: dc.text }}
          >
            {exp.difficulty}
          </span>
        </div>

        {/* Icon */}
        <div
          className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ filter: isHovered ? `drop-shadow(0 0 8px ${exp.color}60)` : "none" }}
        >
          {exp.icon}
        </div>

        {/* Title & aim */}
        <h3 className="text-(--lp-text-main) text-sm font-bold mb-1.5 tracking-tight">
          {exp.title}
        </h3>
        <p className="text-(--lp-text-low) text-xs leading-relaxed mb-4">
          {exp.aim}
        </p>

        {/* Start lab arrow */}
        <div
          className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0"
          style={{ color: exp.color }}
        >
          Start Lab →
        </div>
      </div>
    </motion.button>
  );
}

/* ── Charging Launch Button ── */
function ChargingButton() {
  const navigate = useNavigate();
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);

  const handleClick = () => {
    if (isCharging) return;
    setIsCharging(true);
    setChargeProgress(0);
    const startTime = Date.now();
    const duration = 500;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setChargeProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => navigate("/sandbox"), 80);
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCharging}
      className="w-full sm:w-auto relative cursor-pointer group px-6 py-4 md:px-12 md:py-5 text-base md:text-lg font-bold tracking-wider uppercase border-2 border-[#00F2FF]/30 bg-transparent text-[#00F2FF] transition-all duration-300 overflow-hidden hover:border-[#00F2FF]/60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF]"
      style={{
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
      }}
    >
      {/* Charging fill bar */}
      <div
        className="absolute inset-0 bg-linear-to-r from-[#00F2FF] via-[#7000FF] to-[#00F2FF] transition-none"
        style={{
          transform: `scaleX(${chargeProgress})`,
          transformOrigin: "left",
          opacity: isCharging ? 0.2 : 0,
        }}
      />
      {/* Border charging animation */}
      {isCharging && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, #00F2FF ${chargeProgress * 100}%, transparent ${chargeProgress * 100}%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "2px",
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {isCharging ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
            INITIALIZING...
          </>
        ) : (
          <>⚙️ Launch Sandbox</>
        )}
      </span>
    </button>
  );
}

/* ── Terminal Footer ── */
function TerminalFooter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [lines, setLines] = useState([]);
  const fullLines = [
    { prefix: "[SYS]", text: "ATmega328P Virtual Lab v2.0.0" },
    { prefix: "[OK!]", text: "All 15 experiments loaded" },
    { prefix: "[OK!]", text: "AVR RISC emulator online" },
    { prefix: "[LOG]", text: "Built for students, by students" },
    { prefix: "[SYS]", text: "Open source. Free forever." },
  ];
  const hasStarted = useRef(false);

  useEffect(() => {
    if (isInView && !hasStarted.current) {
      hasStarted.current = true;
      fullLines.forEach((line, i) => {
        setTimeout(() => {
          setLines((prev) => [...prev, line]);
        }, i * 350);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <footer ref={ref} className="relative border-t border-(--lp-border-faint) bg-(--lp-footer-bg)">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="font-mono text-xs space-y-1.5">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2"
            >
              <span className={`${line.prefix === "[OK!]" ? "text-[#00F2FF]" : line.prefix === "[SYS]" ? "text-[#7000FF]" : "text-(--lp-text-low)"} font-bold`}>
                {line.prefix}
              </span>
              <span className="text-(--lp-text-low)">{line.text}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
            transition={{ delay: fullLines.length * 0.35 + 0.3 }}
            className="flex gap-2 items-center mt-3"
          >
            <span className="text-[#00F2FF] font-bold">&gt;_</span>
            <span className="w-2 h-4 bg-[#00F2FF] animate-pulse" />
          </motion.div>
        </div>

        <div className="mt-8 pt-6 border-t border-(--lp-border-faint) flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#00F2FF] text-xl">⬡</span>
            <span className="text-(--lp-text-main) font-bold text-sm">ATmega328P Virtual Lab</span>
          </div>
          <p className="text-(--lp-text-low) text-xs">
            © {new Date().getFullYear()} · Open Source · Free Forever
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  /* ── Scroll-linked values ── */

  /* Deconstruction phase (hero section) */
  const heroRef = useRef(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const [deconstructPhase, setDeconstructPhase] = useState(0);
  useMotionValueEvent(heroScrollProgress, "change", (v) => {
    setDeconstructPhase(v);
  });

  /* Hero text fade */
  const heroTextOpacity = useTransform(heroScrollProgress, [0, 0.15], [1, 0]);
  const heroTextY = useTransform(heroScrollProgress, [0, 0.15], [0, -40]);

  /* Sync video to scroll */
  useMotionValueEvent(heroScrollProgress, "change", (v) => {
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = v * video.duration;
    }
  });

  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  /* Video overlay opacity */
  const videoOverlayOpacity = useTransform(heroScrollProgress, [0, 0.8], [0.1, 0.55]);

  return (
    <div ref={containerRef} className="relative bg-(--lp-bg) text-(--lp-text-main) transition-colors duration-500" style={{ 
        fontFamily: "'Inter', system-ui, sans-serif",
        "--lp-bg": theme === "light" ? "#FAF9F6" : "#050505",
        "--lp-nav-bg": theme === "light" ? "rgba(250,249,246,0.8)" : "rgba(5,5,5,0.7)",
        "--lp-video-fade1": theme === "light" ? "rgba(250,249,246,0)" : "rgba(5,5,5,0)",
        "--lp-video-fade2": theme === "light" ? "rgba(250,249,246,0.3)" : "rgba(5,5,5,0.15)",
        "--lp-video-fade3": theme === "light" ? "rgba(250,249,246,0.8)" : "rgba(5,5,5,0.5)",
        "--lp-video-overlay-start": theme === "light" ? "rgba(250,249,246,0.6)" : "rgba(5,5,5,0.4)",
        "--lp-video-overlay-end": theme === "light" ? "rgba(250,249,246,0.95)" : "rgba(5,5,5,0.85)",
        "--lp-text-main": theme === "light" ? "#1E293B" : "#E2E8F0",
        "--lp-text-mid": theme === "light" ? "#475569" : "#94A3B8",
        "--lp-text-low": theme === "light" ? "#64748B" : "#64748B",
        "--lp-text-inverse-muted": theme === "light" ? "#CBD5E1" : "#333",
        "--lp-border": theme === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)",
        "--lp-border-faint": theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)",
        "--lp-auth-bg": theme === "light" ? "rgba(240,238,230,0.7)" : "rgba(0,0,0,0.6)",
        "--lp-footer-bg": theme === "light" ? "#EAE8DF" : "#030303",
        "--lp-toggle-bg": theme === "light" ? "#E2E8F0" : "#0A0A0A",
        "--lp-card-base": theme === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.015)"
      }}>
      {/* Scanline overlay */}
      <ScanlineOverlay />

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ════════════════ HERO SECTION ════════════════ */}
      <div ref={heroRef} className="relative" style={{ height: "300vh" }}>
        {/* Sticky container */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Video background */}
          <video
            ref={videoRef}
            src="/hero-video.mp4"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleVideoLoad}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ willChange: "transform" }}
          />

          {/* Video quality overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, var(--lp-video-fade1) 0%, var(--lp-video-fade2) 60%, var(--lp-video-fade3) 100%)",
            }}
          />

          {/* Dark overlay driven by scroll */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: videoOverlayOpacity,
              background: "linear-gradient(180deg, var(--lp-video-overlay-start) 0%, var(--lp-video-overlay-end) 100%)",
            }}
          />

          {/* ── Hero Text (fades on scroll) ── */}
          <motion.div
            className="absolute inset-0 z-10 px-6"
            style={{ opacity: heroTextOpacity, y: heroTextY }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 lg:gap-16">
                <div className="text-center lg:text-left max-w-3xl">
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 border border-[#00F2FF]/20 rounded-full bg-[#00F2FF]/6 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F2FF] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F2FF]" />
                    </span>
                    <span className="text-[#00F2FF] text-xs font-semibold tracking-[0.15em] uppercase font-mono">
                      Live Status — ATmega328P
                    </span>
                  </div>

                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-normal mb-6"
                    style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif", fontFeatureSettings: "'liga' 0, 'dlig' 0", fontVariantLigatures: "none" }}
                  >
                    Master Embedded
                    <br />
                    Programming{" "}
                    <span className="bg-linear-to-r from-[#00F2FF] via-[#00FFB2] to-[#7000FF] bg-clip-text text-transparent">
                      Hands-On
                    </span>
                  </h1>

                  <p className="text-white/80 text-lg md:text-xl mb-10 font-light leading-relaxed max-w-xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>
                    Scroll down to deconstruct the chip and explore its architecture
                  </p>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start mb-6 w-full sm:w-auto relative z-20">
                    <button
                      onClick={() => navigate("/sandbox")}
                      className="w-full sm:w-auto group relative px-6 py-3 md:px-8 md:py-3.5 font-bold text-sm tracking-wider uppercase overflow-hidden cursor-pointer border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF]"
                      style={{
                        background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
                        color: "#050505",
                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                      }}
                    >
                      Launch Sandbox ↗
                    </button>
                    <button
                      onClick={() => navigate("/reference")}
                      className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3.5 font-semibold text-sm tracking-wider border border-(--lp-border) bg-(--lp-card-base) backdrop-blur-md text-(--lp-text-main) hover:border-(--lp-border) transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF]"
                      style={{
                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                      }}
                    >
                      Browse Hardware Library
                    </button>
                  </div>

                  <button
                    className="text-[10px] tracking-[0.2em] uppercase font-mono text-(--lp-text-low) underline decoration-dotted"
                    onClick={() => document.getElementById("auth-dock")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    type="button"
                  >
                    Need credentials? Access below
                  </button>

                  <div className="flex flex-col items-center lg:items-start gap-2 mt-8 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                      <div className="w-1 h-2 rounded-full bg-[#00F2FF] animate-pulse" />
                    </div>
                    <span className="text-(--lp-text-low) text-[10px] tracking-[0.2em] uppercase font-mono">
                      Scroll to deconstruct
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-sm">
                  {!isAuthenticated ? (
                    <AuthDock />
                  ) : (
                    <div className="border border-(--lp-border) bg-(--lp-auth-bg) backdrop-blur-xl p-8 text-center" style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))" }}>
                      <span className="text-[#00F2FF] text-lg font-bold mb-4 block tracking-wider uppercase font-mono">Access Granted</span>
                      <p className="text-(--lp-text-mid) text-sm mb-6">Welcome back. Your session is active.</p>
                      <button onClick={() => navigate("/dashboard")} className="w-full py-3.5 text-xs font-black tracking-[0.25em] uppercase border-0 text-[#050505]" style={{ background: "linear-gradient(135deg, #00F2FF, #00FFB2)", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}>
                        Enter Dashboard →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── LEFT HUD PANEL ── */}
          <div className="absolute left-4 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-5 max-w-[300px]">
            {LEFT_SPECS.map((info, i) => (
              <HudInfoItem key={i} info={info} phase={deconstructPhase} side="left" index={i} />
            ))}
          </div>

          {/* ── RIGHT HUD PANEL ── */}
          <div className="absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-5 max-w-[300px]">
            {RIGHT_SPECS.map((info, i) => (
              <HudInfoItem key={i} info={info} phase={deconstructPhase} side="right" index={i} />
            ))}
          </div>

          {/* ── MOBILE HUD (stacked at bottom) ── */}
          <div className="absolute bottom-24 left-0 right-0 z-10 md:hidden px-6">
            <div className="grid grid-cols-2 gap-3">
              {[...LEFT_SPECS.slice(0, 3), ...RIGHT_SPECS.slice(0, 3)].map((info, i) => {
                const visible = deconstructPhase > info.phase;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
                    className="bg-(--lp-auth-bg) backdrop-blur-md border border-(--lp-border) p-2.5 rounded-sm"
                  >
                    <span className="text-[#00F2FF] text-[10px] font-bold font-mono block truncate">
                      {info.title}
                    </span>
                    <span className="text-(--lp-text-low) text-[9px] line-clamp-2">{info.desc}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Center glow */}
          {deconstructPhase > 0.2 && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-2 transition-all duration-300"
              style={{
                width: `${150 + deconstructPhase * 350}px`,
                height: `${150 + deconstructPhase * 350}px`,
                opacity: (deconstructPhase - 0.2) * 0.3,
                background: "radial-gradient(circle, rgba(0,242,255,0.1) 0%, rgba(112,0,255,0.05) 40%, transparent 70%)",
              }}
            />
          )}
        </div>
      </div>

      {/* ════════════════ STICKY NAV ════════════════ */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 border-b border-(--lp-border-faint) transition-colors duration-500"
        style={{
          backdropFilter: `blur(20px)`,
          WebkitBackdropFilter: `blur(20px)`,
          background: "var(--lp-nav-bg)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[#00F2FF] text-xl">⬡</span>
          <span className="font-bold text-sm tracking-tight">
            ATmega328P <span className="text-[#00F2FF]">Virtual Lab</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#experiments" className="hidden md:inline text-(--lp-text-mid) text-sm hover:text-(--lp-text-main) transition-colors">
            Experiments
          </a>
          <a href="#features" className="hidden md:inline text-(--lp-text-mid) text-sm hover:text-(--lp-text-main) transition-colors">
            Features
          </a>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden md:inline text-(--lp-text-mid) text-xs tracking-[0.2em] uppercase hover:text-(--lp-text-main)"
              type="button"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => document.getElementById("auth-dock")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="hidden md:inline text-(--lp-text-mid) text-xs tracking-[0.2em] uppercase hover:text-(--lp-text-main)"
              type="button"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => navigate("/sandbox")}
            className="hidden sm:block px-5 py-2 text-xs font-bold tracking-wider uppercase cursor-pointer border-0 focus:outline-none"
            style={{
              background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
              color: "#050505",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Open Sandbox →
          </button>
          {/* Tactical theme toggle switch */}
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-sm border border-(--lp-border) bg-(--lp-toggle-bg) cursor-pointer overflow-hidden transition-all duration-300 focus:outline-none group"
            aria-label="Toggle theme"
          >
            <div
              className="absolute top-0.5 w-6 h-[22px] rounded-sm transition-all duration-300 flex items-center justify-center text-[10px]"
              style={{
                left: theme === "dark" ? "calc(100% - 26px)" : "2px",
                background: theme === "dark" ? "linear-gradient(135deg, #00F2FF, #7000FF)" : "linear-gradient(135deg, #FFA500, #FFD700)",
                boxShadow: theme === "dark" ? "0 0 10px rgba(0,242,255,0.4)" : "0 0 10px rgba(255,165,0,0.4)",
              }}
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </div>
          </button>
        </div>
      </motion.nav>

      {/* ════════════════ CHIP SUMMARY & DIGITAL READOUT ════════════════ */}
      <section className="relative py-24 md:py-32 px-6">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,242,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,242,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Tactical folder container */}
          <div
            className="relative border border-(--lp-border) bg-(--lp-card-base) p-8 md:p-14"
            style={{
              clipPath: "polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)",
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8">
              <div className="absolute top-0 left-6 w-px h-6 bg-[#00F2FF]/40" />
              <div className="absolute top-6 left-0 h-px w-6 bg-[#00F2FF]/40" />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8">
              <div className="absolute bottom-6 right-0 w-px h-6 bg-[#00F2FF]/40" />
              <div className="absolute bottom-0 right-6 h-px w-6 bg-[#00F2FF]/40" />
            </div>

            {/* Classification tag */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7000FF] shadow-[0_0_6px_#7000FF]" />
              <span className="text-[#7000FF] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                Microcontroller Overview
              </span>
            </div>

            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.03em] mb-4"
              style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif", fontFeatureSettings: "'liga' 0, 'dlig' 0", fontVariantLigatures: "none" }}
            >
              ATMEGA
              <span className="bg-linear-to-r from-[#00F2FF] to-[#7000FF] bg-clip-text text-transparent" style={{ fontFamily: "'Cyber Alert Numbers', 'Heat Robox', monospace" }}>328</span>
              P-PU
            </h2>
            <p className="text-(--lp-text-low) text-base md:text-lg leading-relaxed max-w-2xl mb-12 font-light">
              The heart of the Arduino UNO. A 28-pin, 8-bit AVR RISC microcontroller by Microchip Technology
              — running 131 instructions at up to 20 MHz with 32KB Flash, 2KB SRAM, and 1KB EEPROM.
            </p>

            {/* Stats digital readout */}
            <div ref={statsRef} className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 mb-10">
              {CHIP_STATS.map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={statsInView} />
                  <span className="text-[10px] text-(--lp-text-low) font-mono font-bold tracking-[0.15em] uppercase mt-1.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/sandbox")}
                className="px-8 py-3.5 font-bold text-sm tracking-wider uppercase cursor-pointer border-0 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] focus:outline-none"
                style={{
                  background: "linear-gradient(135deg, #00F2FF, #00FFB2)",
                  color: "#050505",
                  clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                ⚙️ Launch Sandbox
              </button>
              <button
                onClick={() => document.getElementById("experiments")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 font-semibold text-sm tracking-wider border border-[#00F2FF]/20 bg-transparent text-[#00F2FF] hover:border-[#00F2FF]/40 hover:bg-[#00F2FF]/4 transition-all duration-300 cursor-pointer focus:outline-none"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                📖 Browse Experiments
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES GRID ════════════════ */}
      <section id="features" className="relative py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-[#00F2FF]/40" />
              <span className="text-[#00F2FF] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                Platform Capabilities
              </span>
              <div className="h-px w-12 bg-linear-to-l from-transparent to-[#00F2FF]/40" />
            </div>
            <h2
              className="text-2xl md:text-4xl font-black tracking-[-0.03em] mb-4"
              style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif", fontFeatureSettings: "'liga' 0, 'dlig' 0", fontVariantLigatures: "none" }}
            >
              Why{" "}
              <span className="bg-linear-to-r from-[#00F2FF] to-[#7000FF] bg-clip-text text-transparent">
                Virtual Lab
              </span>
              ?
            </h2>
            <p className="text-(--lp-text-low) text-base md:text-lg max-w-xl mx-auto font-light">
              Everything you need to learn embedded systems — zero hardware required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ EXPERIMENTS MASTERY GRID ════════════════ */}
      <section id="experiments" className="relative py-20 md:py-28 px-6">
        {/* Subtle background accent */}
        <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full bg-[#7000FF]/3 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-[#00F2FF]/3 blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-[#7000FF]/40" />
              <span className="text-[#7000FF] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                Mastery Path
              </span>
              <div className="h-px w-12 bg-linear-to-l from-transparent to-[#7000FF]/40" />
            </div>
            <h2
              className="text-2xl md:text-4xl font-black tracking-[-0.03em] mb-4"
              style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif", fontFeatureSettings: "'liga' 0, 'dlig' 0", fontVariantLigatures: "none" }}
            >
              <span className="bg-linear-to-r from-[#00F2FF] to-[#7000FF] bg-clip-text text-transparent" style={{ fontFamily: "'Cyber Alert Numbers', 'Heat Robox', monospace" }}>
                15
              </span>{" "}
              Progressive Experiments
            </h2>
            <p className="text-(--lp-text-low) text-base md:text-lg max-w-xl mx-auto font-light">
              From first blink to watchdog reset — each experiment builds on the last.
            </p>
          </motion.div>

          {/* Category indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {[
              { label: "Core", color: "#00F2FF", desc: "Beginner" },
              { label: "System", color: "#A855F7", desc: "Intermediate" },
              { label: "Kernel", color: "#ff3366", desc: "Advanced" },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cat.color, boxShadow: `0 0 8px ${cat.color}40` }} />
                <span className="text-xs font-mono text-(--lp-text-mid)">
                  <span className="font-bold" style={{ color: cat.color }}>{cat.label}</span>
                  {" "}· {cat.desc}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {EXPERIMENTS.map((exp, idx) => (
              <ExperimentCard key={exp.id} exp={exp} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ SANDBOX CTA ════════════════ */}
      <section className="relative py-32 md:py-40 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00F2FF]/3 blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#7000FF]/4 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-16 bg-linear-to-r from-transparent to-[#00F2FF]/30" />
            <span className="text-[#00F2FF] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
              System Ready
            </span>
            <div className="h-px w-16 bg-linear-to-l from-transparent to-[#00F2FF]/30" />
          </div>

          <h2
            className="text-3xl md:text-5xl font-black tracking-[-0.03em] mb-6"
            style={{ fontFamily: "'Heat Robox', 'Inter', sans-serif", fontFeatureSettings: "'liga' 0, 'dlig' 0", fontVariantLigatures: "none" }}
          >
            Ready to{" "}
            <span className="bg-linear-to-r from-[#00F2FF] to-[#7000FF] bg-clip-text text-transparent">
              Build
            </span>
            ?
          </h2>
          <p className="text-(--lp-text-low) text-lg md:text-xl mb-12 font-light leading-relaxed max-w-lg mx-auto">
            Jump into the sandbox and write real AVR C code.
            <br />
            No downloads. No setup. Just code.
          </p>

          <ChargingButton />

          <p className="text-(--lp-text-low) text-xs font-mono mt-8 tracking-wider">
            &gt; SYSTEM INIT COMPLETE — AWAITING USER INPUT_
          </p>
        </motion.div>
      </section>

      {/* ════════════════ TERMINAL FOOTER ════════════════ */}
      <TerminalFooter />

      {/* Inline CSS for font-family override on this page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');

        .font-mono {
          font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace !important;
        }
        .font-heat {
          font-family: 'Heat Robox', 'Inter', sans-serif !important;
          font-feature-settings: 'liga' 0, 'dlig' 0;
          font-variant-ligatures: none;
        }
        .font-cyber {
          font-family: 'Cyber Alert Numbers', 'Heat Robox', monospace !important;
          font-feature-settings: 'liga' 0, 'dlig' 0;
          font-variant-ligatures: none;
        }
      `}</style>
    </div>
  );
}
