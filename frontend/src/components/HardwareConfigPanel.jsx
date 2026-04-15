import React, { useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Timer mode and prescaler look-up tables per datasheet
// ─────────────────────────────────────────────────────────────────────────────
const TIMER0_2_MODES = [
  { label: "Normal (overflow at 0xFF)",          wgm: [0,0,0] },
  { label: "PWM, Phase Correct (TOP=0xFF)",       wgm: [1,0,0] },
  { label: "CTC (Clear Timer on Compare OCR0A)", wgm: [0,1,0] },
  { label: "Fast PWM (TOP=0xFF)",                 wgm: [1,1,0] },
  { label: "PWM, Phase Correct (TOP=OCR0A)",     wgm: [1,0,1] },
  { label: "Fast PWM (TOP=OCR0A)",               wgm: [1,1,1] },
];

const TIMER0_PRESCALERS = [
  { label: "No clock (Timer stopped)",    cs: [0,0,0], div: null     },
  { label: "clk/1   (No prescaling)",     cs: [1,0,0], div: 1        },
  { label: "clk/8",                       cs: [0,1,0], div: 8        },
  { label: "clk/64",                      cs: [1,1,0], div: 64       },
  { label: "clk/256",                     cs: [0,0,1], div: 256      },
  { label: "clk/1024",                    cs: [1,0,1], div: 1024     },
];

const TIMER1_MODES = [
  { label: "Normal (overflow at 0xFFFF)",          wgm: [0,0,0,0] },
  { label: "PWM, Phase Correct 8-bit (TOP=0xFF)", wgm: [0,1,0,0] },
  { label: "PWM, Phase Correct 9-bit",             wgm: [0,0,1,0] },
  { label: "PWM, Phase Correct 10-bit",            wgm: [0,1,1,0] },
  { label: "CTC (TOP=OCR1A)",                      wgm: [0,0,0,1] },
  { label: "Fast PWM 8-bit",                       wgm: [0,1,0,1] },
  { label: "Fast PWM 9-bit",                       wgm: [0,0,1,1] },
  { label: "Fast PWM 10-bit",                      wgm: [0,1,1,1] },
  { label: "Phase & Freq Correct (TOP=ICR1)",      wgm: [0,0,0,0] },
  { label: "Phase & Freq Correct (TOP=OCR1A)",     wgm: [0,0,0,0] },
  { label: "Phase Correct PWM (TOP=ICR1)",         wgm: [0,0,0,0] },
  { label: "Phase Correct PWM (TOP=OCR1A)",        wgm: [0,0,0,0] },
  { label: "CTC (TOP=ICR1)",                       wgm: [0,0,1,1] },
  { label: "Fast PWM (TOP=ICR1)",                  wgm: [0,1,0,1] },
  { label: "Fast PWM (TOP=OCR1A)",                 wgm: [0,1,1,1] },
];

const TIMER1_PRESCALERS = [
  { label: "No clock (Timer stopped)",    cs: [0,0,0], div: null  },
  { label: "clk/1   (No prescaling)",     cs: [1,0,0], div: 1     },
  { label: "clk/8",                       cs: [0,1,0], div: 8     },
  { label: "clk/64",                      cs: [1,1,0], div: 64    },
  { label: "clk/256",                     cs: [0,0,1], div: 256   },
  { label: "clk/1024",                    cs: [1,0,1], div: 1024  },
  { label: "External T1 falling edge",    cs: [0,1,1], div: null  },
  { label: "External T1 rising edge",     cs: [1,1,1], div: null  },
];

const INT_SENSE = [
  { label: "Low level",      isc: [0,0] },
  { label: "Any change",     isc: [1,0] },
  { label: "Falling edge",   isc: [0,1] },
  { label: "Rising edge",    isc: [1,1] },
];

const SLEEP_MODES = [
  { label: "Idle",                    sm: [0,0,0] },
  { label: "ADC Noise Reduction",     sm: [0,0,1] },
  { label: "Power-down",              sm: [0,1,0] },
  { label: "Power-save",              sm: [0,1,1] },
  { label: "Standby",                 sm: [1,1,0] },
  { label: "Extended Standby",        sm: [1,1,1] },
];

const F_CPU = 16_000_000;

function calcOvfFreq(prescDiv, bits) {
  if (!prescDiv) return null;
  const top = bits === 16 ? 65536 : 256;
  return F_CPU / (prescDiv * top);
}



// ─────────────────────────────────────────────────────────────────────────────
// HardwareConfigPanel
// ─────────────────────────────────────────────────────────────────────────────
function HardwareConfigPanel({ setManualRegisters }) {
  const [activeTab, setActiveTab] = useState('TIMERS');

  // ── local UI state ──
  const [t0Mode, setT0Mode] = useState(0);
  const [t0Presc, setT0Presc] = useState(0);
  const [ocr0a, setOcr0a] = useState(0);
  const [ocr0b, setOcr0b] = useState(0);

  const [t1Mode, setT1Mode] = useState(0);
  const [t1Presc, setT1Presc] = useState(0);
  const [ocr1a, setOcr1a] = useState(0);
  const [ocr1b, setOcr1b] = useState(0);
  const [icr1, setIcr1] = useState(0);

  const [t2Mode, setT2Mode] = useState(0);
  const [t2Presc, setT2Presc] = useState(0);
  const [ocr2a, setOcr2a] = useState(0);

  const [int0En, setInt0En]  = useState(false);
  const [int0Sense, setInt0Sense] = useState(2); // falling edge default
  const [int1En, setInt1En]  = useState(false);
  const [int1Sense, setInt1Sense] = useState(2);
  const [pcie0, setPcie0] = useState(false);
  const [pcie1, setPcie1] = useState(false);
  const [pcie2, setPcie2] = useState(false);
  const [globalIrq, setGlobalIrq] = useState(false);

  const [sleepMode, setSleepMode] = useState(0);
  const [sleepEn, setSleepEn] = useState(false);
  const [wdtEn, setWdtEn] = useState(false);

  // ── register writer helper ──
  const setReg = useCallback((updates) => {
    if (!setManualRegisters) return;
    setManualRegisters(prev => {
      const next = { ...prev };
      for (const [reg, bits] of Object.entries(updates)) {
        if (!next[reg]) next[reg] = Array(8).fill(0);
        const arr = [...next[reg]];
        for (const [pos, val] of Object.entries(bits)) {
          arr[Number(pos)] = val;
        }
        next[reg] = arr;
      }
      return next;
    });
  }, [setManualRegisters]);

  // ── Timer 0 handlers ──
  const applyTimer0Mode = useCallback((idx) => {
    setT0Mode(idx);
    const wgm = TIMER0_2_MODES[idx].wgm;
    setReg({
      TCCR0A: { 0: wgm[0], 1: wgm[1] },  // WGM00, WGM01
      TCCR0B: { 3: wgm[2] }              // WGM02
    });
  }, [setReg]);

  const applyTimer0Prescaler = useCallback((idx) => {
    setT0Presc(idx);
    const cs = TIMER0_PRESCALERS[idx].cs;
    setReg({ TCCR0B: { 0: cs[0], 1: cs[1], 2: cs[2] } });
  }, [setReg]);

  const applyOCR0A = useCallback((val) => {
    const v = Math.max(0, Math.min(255, Number(val)));
    setOcr0a(v);
    // OCR0A is an 8-bit value — store it in a flat register key
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, OCR0A: v }));
  }, [setManualRegisters]);

  const applyOCR0B = useCallback((val) => {
    const v = Math.max(0, Math.min(255, Number(val)));
    setOcr0b(v);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, OCR0B: v }));
  }, [setManualRegisters]);

  // ── Timer 1 handlers ──
  const applyTimer1Mode = useCallback((idx) => {
    setT1Mode(idx);
    const wgm = TIMER1_MODES[idx].wgm; // [WGM10, WGM11, WGM12, WGM13]
    setReg({
      TCCR1A: { 0: wgm[0], 1: wgm[1] },
      TCCR1B: { 3: wgm[2], 4: wgm[3] }
    });
  }, [setReg]);

  const applyTimer1Prescaler = useCallback((idx) => {
    setT1Presc(idx);
    const cs = TIMER1_PRESCALERS[idx].cs;
    setReg({ TCCR1B: { 0: cs[0], 1: cs[1], 2: cs[2] } });
  }, [setReg]);

  const applyOCR1A = useCallback((val) => {
    const v = Math.max(0, Math.min(65535, Number(val)));
    setOcr1a(v);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, OCR1A: v }));
  }, [setManualRegisters]);

  const applyOCR1B = useCallback((val) => {
    const v = Math.max(0, Math.min(65535, Number(val)));
    setOcr1b(v);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, OCR1B: v }));
  }, [setManualRegisters]);

  const applyICR1 = useCallback((val) => {
    const v = Math.max(0, Math.min(65535, Number(val)));
    setIcr1(v);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, ICR1: v }));
  }, [setManualRegisters]);

  // ── Timer 2 handlers ──
  const applyTimer2Mode = useCallback((idx) => {
    setT2Mode(idx);
    const wgm = TIMER0_2_MODES[idx].wgm;
    setReg({
      TCCR2A: { 0: wgm[0], 1: wgm[1] },
      TCCR2B: { 3: wgm[2] }
    });
  }, [setReg]);

  const applyTimer2Prescaler = useCallback((idx) => {
    setT2Presc(idx);
    const cs = TIMER0_PRESCALERS[idx].cs;
    setReg({ TCCR2B: { 0: cs[0], 1: cs[1], 2: cs[2] } });
  }, [setReg]);

  const applyOCR2A = useCallback((val) => {
    const v = Math.max(0, Math.min(255, Number(val)));
    setOcr2a(v);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, OCR2A: v }));
  }, [setManualRegisters]);

  // ── Interrupt handlers ──
  const applyInt0 = useCallback((enabled) => {
    setInt0En(enabled);
    setReg({ EIMSK: { 0: enabled ? 1 : 0 } });
  }, [setReg]);

  const applyInt0Sense = useCallback((idx) => {
    setInt0Sense(idx);
    const isc = INT_SENSE[idx].isc;
    setReg({ EICRA: { 0: isc[0], 1: isc[1] } });
  }, [setReg]);

  const applyInt1 = useCallback((enabled) => {
    setInt1En(enabled);
    setReg({ EIMSK: { 1: enabled ? 1 : 0 } });
  }, [setReg]);

  const applyInt1Sense = useCallback((idx) => {
    setInt1Sense(idx);
    const isc = INT_SENSE[idx].isc;
    setReg({ EICRA: { 2: isc[0], 3: isc[1] } });
  }, [setReg]);

  const applyPCIE = useCallback((bit, val) => {
    if (bit === 0) setPcie0(val);
    if (bit === 1) setPcie1(val);
    if (bit === 2) setPcie2(val);
    setReg({ PCICR: { [bit]: val ? 1 : 0 } });
  }, [setReg]);

  const applyGlobalIRQ = useCallback((val) => {
    setGlobalIrq(val);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, SREG_I: val ? 1 : 0 }));
  }, [setManualRegisters]);

  // ── Sleep / WDT handlers ──
  const applySleepMode = useCallback((idx) => {
    setSleepMode(idx);
    const sm = SLEEP_MODES[idx].sm;
    setReg({ SMCR: { 1: sm[0], 2: sm[1], 3: sm[2] } });
  }, [setReg]);

  const applySleepEnable = useCallback((val) => {
    setSleepEn(val);
    setReg({ SMCR: { 0: val ? 1 : 0 } });
  }, [setReg]);

  const applyWDT = useCallback((val) => {
    setWdtEn(val);
    if (!setManualRegisters) return;
    setManualRegisters(prev => ({ ...prev, WDTCSR_WDE: val ? 1 : 0 }));
  }, [setManualRegisters]);

  // ── Computed display values ──
  const t0OvfFreq = calcOvfFreq(TIMER0_PRESCALERS[t0Presc].div, 8);
  const t1OvfFreq = calcOvfFreq(TIMER1_PRESCALERS[t1Presc].div, 16);
  const ctcFreq   = TIMER0_PRESCALERS[t0Presc].div
    ? F_CPU / (2 * TIMER0_PRESCALERS[t0Presc].div * (ocr0a + 1))
    : null;

  function fmtHz(hz) {
    if (hz == null || isNaN(hz)) return '—';
    if (hz >= 1000000) return `${(hz/1000000).toFixed(2)} MHz`;
    if (hz >= 1000) return `${(hz/1000).toFixed(2)} kHz`;
    return `${hz.toFixed(2)} Hz`;
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.header}>AVR Peripheral Configuration</h3>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {['TIMERS','INTERRUPTS','CLK_PWR'].map(tab => (
          <button
            key={tab}
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'TIMERS' ? 'Timers & PWM' : tab === 'INTERRUPTS' ? 'Interrupts' : 'Clock & Power'}
          </button>
        ))}
      </div>

      <div style={styles.content}>

        {/* ── TIMERS TAB ── */}
        {activeTab === 'TIMERS' && (
          <div>
            {/* ───── Timer 0 ───── */}
            <div style={styles.sectionHeader}>Timer/Counter 0 (8-bit) — TCCR0A / TCCR0B</div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Waveform Mode (WGM0):</label>
              <select style={styles.select} value={t0Mode}
                onChange={e => applyTimer0Mode(Number(e.target.value))}>
                {TIMER0_2_MODES.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Prescaler (CS0):</label>
              <select style={styles.select} value={t0Presc}
                onChange={e => applyTimer0Prescaler(Number(e.target.value))}>
                {TIMER0_PRESCALERS.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>OCR0A (Compare A / duty):</label>
              <input type="number" min="0" max="255" value={ocr0a} style={styles.input}
                onChange={e => applyOCR0A(e.target.value)} />
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>OCR0B (Compare B):</label>
              <input type="number" min="0" max="255" value={ocr0b} style={styles.input}
                onChange={e => applyOCR0B(e.target.value)} />
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Overflow freq:</span>
              <span style={styles.infoVal}>{fmtHz(t0OvfFreq)}</span>
              <span style={styles.infoSep}>|</span>
              <span style={styles.infoLabel}>CTC freq (OCR0A):</span>
              <span style={styles.infoVal}>{fmtHz(ctcFreq)}</span>
              <span style={styles.infoSep}>|</span>
              <span style={styles.infoLabel}>PWM duty:</span>
              <span style={styles.infoVal}>{ocr0a > 0 ? `${((ocr0a/255)*100).toFixed(1)}%` : '0%'}</span>
            </div>

            {/* ───── Timer 1 ───── */}
            <div style={styles.sectionHeader}>Timer/Counter 1 (16-bit) — TCCR1A / TCCR1B</div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Waveform Mode (WGM1):</label>
              <select style={styles.select} value={t1Mode}
                onChange={e => applyTimer1Mode(Number(e.target.value))}>
                {TIMER1_MODES.map((opt, i) => <option key={i} value={i}>{i}: {opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Prescaler (CS1):</label>
              <select style={styles.select} value={t1Presc}
                onChange={e => applyTimer1Prescaler(Number(e.target.value))}>
                {TIMER1_PRESCALERS.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>OCR1A (0–65535):</label>
              <input type="number" min="0" max="65535" value={ocr1a} style={{...styles.input, width:'70px'}}
                onChange={e => applyOCR1A(e.target.value)} />
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>OCR1B (0–65535):</label>
              <input type="number" min="0" max="65535" value={ocr1b} style={{...styles.input, width:'70px'}}
                onChange={e => applyOCR1B(e.target.value)} />
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>ICR1 – TOP for modes 8/10/12/14 (0–65535):</label>
              <input type="number" min="0" max="65535" value={icr1} style={{...styles.input, width:'70px'}}
                onChange={e => applyICR1(e.target.value)} />
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Overflow freq:</span>
              <span style={styles.infoVal}>{fmtHz(t1OvfFreq)}</span>
              <span style={styles.infoSep}>|</span>
              <span style={styles.infoLabel}>CTC (OCR1A):</span>
              <span style={styles.infoVal}>{
                TIMER1_PRESCALERS[t1Presc].div && ocr1a > 0
                  ? fmtHz(F_CPU / (2 * TIMER1_PRESCALERS[t1Presc].div * (ocr1a + 1)))
                  : '—'
              }</span>
            </div>

            {/* ───── Timer 2 ───── */}
            <div style={styles.sectionHeader}>Timer/Counter 2 (8-bit Async) — TCCR2A / TCCR2B</div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Waveform Mode (WGM2):</label>
              <select style={styles.select} value={t2Mode}
                onChange={e => applyTimer2Mode(Number(e.target.value))}>
                {TIMER0_2_MODES.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Prescaler (CS2):</label>
              <select style={styles.select} value={t2Presc}
                onChange={e => applyTimer2Prescaler(Number(e.target.value))}>
                {TIMER0_PRESCALERS.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.controlRow}>
              <label style={styles.label}>OCR2A (0–255):</label>
              <input type="number" min="0" max="255" value={ocr2a} style={styles.input}
                onChange={e => applyOCR2A(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── INTERRUPTS TAB ── */}
        {activeTab === 'INTERRUPTS' && (
          <div>
            <div style={styles.sectionHeader}>External Interrupts — EICRA / EIMSK</div>

            <div style={styles.intRow}>
              <label style={styles.checkboxLine}>
                <input type="checkbox" checked={int0En}
                  onChange={e => applyInt0(e.target.checked)} />
                Enable INT0 (PD2 / Arduino Pin 2)
              </label>
              {int0En && (
                <select style={{...styles.select, marginLeft:'12px'}} value={int0Sense}
                  onChange={e => applyInt0Sense(Number(e.target.value))}>
                  {INT_SENSE.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              )}
            </div>

            <div style={styles.intRow}>
              <label style={styles.checkboxLine}>
                <input type="checkbox" checked={int1En}
                  onChange={e => applyInt1(e.target.checked)} />
                Enable INT1 (PD3 / Arduino Pin 3)
              </label>
              {int1En && (
                <select style={{...styles.select, marginLeft:'12px'}} value={int1Sense}
                  onChange={e => applyInt1Sense(Number(e.target.value))}>
                  {INT_SENSE.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              )}
            </div>

            <div style={styles.sectionHeader}>Pin Change Interrupts — PCICR</div>
            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={pcie0} onChange={e => applyPCIE(0, e.target.checked)} />
              PCIE0 — PCINT0–7 (Port B)
            </label>
            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={pcie1} onChange={e => applyPCIE(1, e.target.checked)} />
              PCIE1 — PCINT8–14 (Port C)
            </label>
            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={pcie2} onChange={e => applyPCIE(2, e.target.checked)} />
              PCIE2 — PCINT16–23 (Port D)
            </label>

            <div style={styles.sectionHeader}>Global Interrupts — SREG (I-bit)</div>
            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={globalIrq}
                onChange={e => applyGlobalIRQ(e.target.checked)} />
              Set I-bit in SREG — <code style={{color:'#00ccff'}}>sei()</code>
            </label>
            {globalIrq && <div style={styles.infoBox}>Global interrupts ENABLED. All unmasked interrupt vectors will fire.</div>}
          </div>
        )}

        {/* ── CLOCK & POWER TAB ── */}
        {activeTab === 'CLK_PWR' && (
          <div>
            <div style={styles.sectionHeader}>Sleep Mode — SMCR</div>

            <div style={styles.controlRow}>
              <label style={styles.label}>Sleep Mode (SM2:SM0):</label>
              <select style={styles.select} value={sleepMode}
                onChange={e => applySleepMode(Number(e.target.value))}>
                {SLEEP_MODES.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>

            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={sleepEn}
                onChange={e => applySleepEnable(e.target.checked)} />
              Sleep Enable (SE bit) — <code style={{color:'#00ccff'}}>sleep_mode()</code>
            </label>

            {sleepEn && (
              <div style={styles.infoBox}>
                {`SMCR = SM[${SLEEP_MODES[sleepMode].sm.join('')}] | SE=1 → ${SLEEP_MODES[sleepMode].label} mode armed`}
              </div>
            )}

            <div style={styles.sectionHeader}>Watchdog Timer — WDTCSR</div>
            <label style={styles.checkboxLine}>
              <input type="checkbox" checked={wdtEn}
                onChange={e => applyWDT(e.target.checked)} />
              Enable WDT System Reset (WDE bit)
            </label>
            {wdtEn && (
              <div style={styles.infoBox}>
                WDT reset enabled. Firmware must call <code style={{color:'#00ff88'}}>wdt_reset()</code> within the timeout period.
              </div>
            )}

            <div style={styles.sectionHeader}>Clock Information</div>
            <div style={styles.infoBox}>
              System clock: <span style={{color:'#00ff88'}}>16 MHz</span> (external crystal) &nbsp;|&nbsp;
              Instruction cycle: <span style={{color:'#00ff88'}}>62.5 ns</span> &nbsp;|&nbsp;
              CLKDIV8 fuse: determined at programming time
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    padding: '15px',
    background: '#0d0d14',
    border: '1px solid #1a1a2e',
    borderRadius: '8px',
    marginTop: '20px',
    color: '#e0e0e0',
  },
  header: {
    marginTop: 0,
    marginBottom: '15px',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    color: '#00ccff',
    letterSpacing: '0.12em',
  },
  tabRow: {
    display: 'flex',
    gap: '5px',
    marginBottom: '15px',
    borderBottom: '1px solid #222',
    paddingBottom: '10px',
    flexWrap: 'wrap',
  },
  tab: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#666',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'monospace',
    transition: 'all 0.15s',
  },
  activeTab: {
    background: 'rgba(0,204,255,0.15)',
    border: '1px solid #00ccff',
    color: '#00ccff',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  content: {
    minHeight: '220px',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#00ff88',
    borderBottom: '1px dashed #222',
    paddingBottom: '5px',
    marginBottom: '10px',
    marginTop: '18px',
    letterSpacing: '0.06em',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
  },
  intRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#aaa',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  select: {
    background: '#141420',
    border: '1px solid #333',
    color: '#e0e0e0',
    padding: '4px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    outline: 'none',
    maxWidth: '260px',
  },
  input: {
    background: '#141420',
    border: '1px solid #333',
    color: '#00ff88',
    padding: '4px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    width: '60px',
    textAlign: 'right',
    outline: 'none',
  },
  checkboxLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#bbb',
    marginBottom: '8px',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  infoBox: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#888',
    background: '#0a0a14',
    border: '1px solid #1a1a2e',
    borderRadius: '4px',
    padding: '6px 10px',
    marginTop: '8px',
    marginBottom: '4px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  },
  infoLabel: { color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  infoVal:   { color: '#00ff88', fontWeight: 'bold' },
  infoSep:   { color: '#333' },
};

export default HardwareConfigPanel;
