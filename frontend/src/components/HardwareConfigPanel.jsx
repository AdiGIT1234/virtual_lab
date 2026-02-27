import React, { useState } from 'react';

function HardwareConfigPanel({ setManualRegisters }) {
  const [activeTab, setActiveTab] = useState('TIMERS'); // TIMERS, INTERRUPTS, CLK_PWR

  // Helper to safely toggle bits in the 8-bit array payload string
  const updateBit = (reg, bitPos, val) => {
    if (!setManualRegisters) return;
    setManualRegisters(prev => {
      const next = { ...prev };
      const arr = [...next[reg]];
      arr[bitPos] = val;
      next[reg] = arr;
      return next;
    });
  };

  const timerModeOptions = [
    { label: "Normal", wgm: [0,0,0] },
    { label: "PWM, Phase Correct", wgm: [1,0,0] },
    { label: "CTC", wgm: [0,1,0] },
    { label: "Fast PWM", wgm: [1,1,0] }
  ];

  const prescalerOptions = [
    { label: "No clock (stopped)", cs: [0,0,0] },
    { label: "clk_I/O / 1 (No prescaling)", cs: [1,0,0] },
    { label: "clk_I/O / 8", cs: [0,1,0] },
    { label: "clk_I/O / 64", cs: [1,1,0] },
    { label: "clk_I/O / 256", cs: [0,0,1] },
    { label: "clk_I/O / 1024", cs: [1,0,1] }
  ];

  const handleTimer0Mode = (e) => {
    const WGM = timerModeOptions[e.target.value].wgm;
    updateBit("TCCR0A", 0, WGM[0]); // WGM00
    updateBit("TCCR0A", 1, WGM[1]); // WGM01
    updateBit("TCCR0B", 3, WGM[2]); // WGM02
  };

  const handleTimer0Prescaler = (e) => {
    const CS = prescalerOptions[e.target.value].cs;
    updateBit("TCCR0B", 0, CS[0]); // CS00
    updateBit("TCCR0B", 1, CS[1]); // CS01
    updateBit("TCCR0B", 2, CS[2]); // CS02
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.header}>AVR Peripheral Configuration</h3>
      
      {/* Tabs */}
      <div style={styles.tabRow}>
        <button style={activeTab === 'TIMERS' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('TIMERS')}>Timers & PWM</button>
        <button style={activeTab === 'INTERRUPTS' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('INTERRUPTS')}>Interrupts</button>
        <button style={activeTab === 'CLK_PWR' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('CLK_PWR')}>Clock & Power</button>
      </div>

      <div style={styles.content}>
        {activeTab === 'TIMERS' && (
          <div>
            <div style={styles.sectionHeader}>Timer/Counter 0 (8-bit)</div>
            <div style={styles.controlRow}>
              <label style={styles.label}>Mode (WGM0):</label>
              <select style={styles.select} onChange={handleTimer0Mode} defaultValue="0">
                {timerModeOptions.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>
            <div style={styles.controlRow}>
              <label style={styles.label}>Prescaler (CS0):</label>
              <select style={styles.select} onChange={handleTimer0Prescaler} defaultValue="0">
                {prescalerOptions.map((opt, i) => <option key={i} value={i}>{opt.label}</option>)}
              </select>
            </div>
            <div style={styles.controlRow}>
              <label style={styles.label}>Output Compare Register A (OCR0A):</label>
              <input type="number" min="0" max="255" defaultValue="0" style={styles.input} />
            </div>

            <div style={styles.sectionHeader}>Timer/Counter 1 (16-bit)</div>
            <div style={styles.controlRow}>
              <span style={{color: "#888", fontSize: "12px"}}>16-bit Timer layout mirrored to Timer 0 syntax for brevity in this UI</span>
            </div>
            
            <div style={styles.sectionHeader}>Timer/Counter 2 (8-bit)</div>
            <div style={styles.controlRow}>
              <span style={{color: "#888", fontSize: "12px"}}>8-bit Asynchronous Timer</span>
            </div>
          </div>
        )}

        {activeTab === 'INTERRUPTS' && (
          <div>
            <div style={styles.sectionHeader}>External Interrupts</div>
            <label style={styles.checkboxLine}><input type="checkbox" /> Enable INT0 (PD2)</label>
            <label style={styles.checkboxLine}><input type="checkbox" /> Enable INT1 (PD3)</label>

            <div style={styles.sectionHeader}>Pin Change Interrupts</div>
            <label style={styles.checkboxLine}><input type="checkbox" /> PCIE0 (PCINT0-7)</label>
            <label style={styles.checkboxLine}><input type="checkbox" /> PCIE1 (PCINT8-14)</label>
            <label style={styles.checkboxLine}><input type="checkbox" /> PCIE2 (PCINT16-23)</label>

            <div style={styles.sectionHeader}>Global Interrupts</div>
            <label style={styles.checkboxLine}>
              <input type="checkbox" /> Set I-bit in SREG <code>sei()</code>
            </label>
          </div>
        )}

        {activeTab === 'CLK_PWR' && (
          <div>
             <div style={styles.sectionHeader}>Clock Source Selection</div>
             <div style={styles.controlRow}>
               <label style={styles.label}>Source:</label>
               <select style={styles.select}>
                 <option>Internal 8 MHz RC</option>
                 <option>128 kHz RC</option>
                 <option>External Crystal / Resonator</option>
               </select>
             </div>
             <label style={styles.checkboxLine}><input type="checkbox" defaultChecked /> Enable CKDIV8 Fuse (Divide by 8)</label>

             <div style={styles.sectionHeader}>Sleep Modes</div>
             <div style={styles.controlRow}>
               <label style={styles.label}>SMCR Mode:</label>
               <select style={styles.select}>
                 <option>Idle</option>
                 <option>ADC Noise Reduction</option>
                 <option>Power-down</option>
                 <option>Power-save</option>
                 <option>Standby</option>
                 <option>Extended Standby</option>
               </select>
             </div>
             
             <div style={styles.sectionHeader}>Brown-Out Detection (BOD)</div>
             <label style={styles.checkboxLine}><input type="checkbox" /> Enable BODLEVEL (2.7V)</label>
             
             <div style={styles.sectionHeader}>Watchdog Timer</div>
             <label style={styles.checkboxLine}><input type="checkbox" /> Enable WDT (WDTON)</label>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    padding: "15px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: "8px",
    marginTop: "20px",
    color: "#e0e0e0"
  },
  header: {
    marginTop: 0,
    marginBottom: "15px",
    fontFamily: "monospace",
    textTransform: "uppercase",
    fontSize: "0.95rem",
    color: "#00ccff"
  },
  tabRow: {
    display: "flex",
    gap: "5px",
    marginBottom: "15px",
    borderBottom: "1px solid #333",
    paddingBottom: "10px"
  },
  tab: {
    background: "transparent",
    border: "1px solid #444",
    color: "#888",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "monospace"
  },
  activeTab: {
    background: "#00ccff",
    border: "1px solid #00ccff",
    color: "#111",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold"
  },
  content: {
    minHeight: "220px"
  },
  sectionHeader: {
    fontSize: "12px",
    fontWeight: "bold",
    fontFamily: "monospace",
    color: "#00ff88",
    borderBottom: "1px dashed #333",
    paddingBottom: "5px",
    marginBottom: "10px",
    marginTop: "15px"
  },
  controlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  label: {
    fontSize: "12px",
    color: "#aaa",
    fontFamily: "sans-serif"
  },
  select: {
    background: "#222",
    border: "1px solid #444",
    color: "#fff",
    padding: "4px",
    borderRadius: "4px",
    fontSize: "11px",
    fontFamily: "monospace"
  },
  input: {
    background: "#222",
    border: "1px solid #444",
    color: "#fff",
    padding: "4px",
    borderRadius: "4px",
    fontSize: "11px",
    fontFamily: "monospace",
    width: "50px",
    textAlign: "right"
  },
  checkboxLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#bbb",
    marginBottom: "8px",
    fontFamily: "monospace",
    cursor: "pointer"
  }
};

export default HardwareConfigPanel;
