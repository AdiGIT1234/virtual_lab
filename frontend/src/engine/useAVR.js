import { useState, useRef, useCallback } from 'react';
import {
  CPU,
  avrInstruction,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRUSART,
  usart0Config,
  AVRSPI,
  spiConfig,
  AVRTWI,
  twiConfig,
  AVRADC,
  adcConfig,
  atmega328Channels,
  AVREEPROM,
  EEPROMMemoryBackend,
  eepromConfig,
  AVRWatchdog,
  watchdogConfig,
} from 'avr8js';

// Parses Intel Hex format directly into a Uint8Array
function loadHex(source, target) {
  for (const line of source.split('\n')) {
    if (line[0] === ':' && line.substr(7, 2) === '00') {
      const bytes = parseInt(line.substr(1, 2), 16);
      const addr = parseInt(line.substr(3, 4), 16);
      for (let i = 0; i < bytes; i++) {
        target[addr + i] = parseInt(line.substr(9 + i * 2, 2), 16);
      }
    }
  }
}

// Helper to convert byte to binary array representation (LSB to MSB)
const toBits = (val) => {
  return [
    (val >> 0) & 1, (val >> 1) & 1, (val >> 2) & 1, (val >> 3) & 1,
    (val >> 4) & 1, (val >> 5) & 1, (val >> 6) & 1, (val >> 7) & 1
  ];
};

const SUPPORTED_MCUS = new Set(["atmega328p"]);

export function useAVR(activeMcuId = "atmega328p") {
  const [cpuState, setCpuState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liveTimeline, setLiveTimeline] = useState([]);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const [activeBreakpoints, setActiveBreakpoints] = useState([]);

  const cpuRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  const toneFreqRef = useRef(-1);
  const timelineBufferRef = useRef([]);
  const snapshotTimerRef = useRef(0);
  const speedRef = useRef(1);
  const breakpointsRef = useRef(new Set());
  const breakpointHandlerRef = useRef(() => {});

  const runExecutionLoop = useCallback(function tick(time) {
    if (!cpuRef.current) return;
    const { cpu, portB, portC, portD } = cpuRef.current;

    // Calculate how many CPU cycles to execute this frame to maintain 16MHz
    const delta = Math.min(time - lastTimeRef.current, 100); 
    lastTimeRef.current = time;
    
    const cyclesToRun = Math.floor(16000000 * (delta / 1000) * speedRef.current);
    const targetCycle = cpu.cycles + cyclesToRun;

    try {
      let runLimit = 2000000; // Safeguard browser thread from absolute freezing
      while (cpu.cycles < targetCycle && runLimit > 0) {
        avrInstruction(cpu); // Execute one AVR instruction (advances pc + cycles)
        cpu.tick();          // Handle clock events & interrupts
        runLimit--;
      }
      if (runLimit === 0) {
          console.warn("AVR execution hit runLimit! CPU cycles:", cpu.cycles, "Target:", targetCycle);
      }

      // Snapshot the memory state at the end of the frame
      const data = cpu.data;
      
      const ddrb = data[0x24], portb_reg = data[0x25];
      const ddrc = data[0x27], portc_reg = data[0x28];
      const ddrd = data[0x2A], portd_reg = data[0x2B];

      // Map AVR Output Compare Registers to Arduino PWM pins (0-255)
      const pwmMap = new Array(20).fill(0);
      pwmMap[3] = data[0xB4]; // OCR2B (PD3)
      pwmMap[5] = data[0x48]; // OCR0B (PD5)
      pwmMap[6] = data[0x47]; // OCR0A (PD6)
      pwmMap[9] = data[0x88]; // OCR1AL (PB1)
      pwmMap[10] = data[0x8A]; // OCR1BL (PB2)
      pwmMap[11] = data[0xB3]; // OCR2A (PB3)

      /* 
         avr8js handles actual pin states depending on Pull-Ups and DDR values via portB.pinState
         We map this over to our Virtual Lab generic register format
      */
      const currentRegState = {
        DDRB: toBits(ddrb), PORTB: toBits(portb_reg), PINB: toBits(portB.pinState),
        DDRC: toBits(ddrc), PORTC: toBits(portc_reg), PINC: toBits(portC.pinState),
        DDRD: toBits(ddrd), PORTD: toBits(portd_reg), PIND: toBits(portD.pinState),
        PWM: pwmMap
      };

      const memorySnapshot = Array.from(cpu.data.slice(0, 256));
      setCpuState({
        registers: currentRegState,
        pc: cpu.pc,
        cycles: cpu.cycles,
        memory: memorySnapshot,
        sp: cpu.data[0x5d] || 0,
      });

      // Detect Timer2 CTC tone on pin 11 (OC2A = PB3)
      // tone() sets: WGM21 (bit3 of TCCR2A) + COM2A0 (bit6 of TCCR2A) + CS2 bits in TCCR2B
      const tccr2a = data[0xB0], tccr2b = data[0xB1], ocr2a = data[0xB3];
      const isCTC2 = !!(tccr2a & (1 << 3));
      const isToggle2 = !!(tccr2a & (1 << 6));
      const cs2 = tccr2b & 0x07;
      const PRESC2 = [0, 1, 8, 32, 64, 128, 256, 1024];
      const toneFreq = (isCTC2 && isToggle2 && cs2 > 0)
        ? Math.round(16000000 / (2 * PRESC2[cs2] * (ocr2a + 1)))
        : 0;
      if (toneFreq !== toneFreqRef.current) {
        toneFreqRef.current = toneFreq;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('avr-tone-change', {
            detail: { pin: 11, freq: toneFreq, active: toneFreq > 0 }
          }));
        }
      }

      // Save to logic analyzer timeline roughly every 16ms (60 FPS) for smooth UI. Buffer handles SVG limit.
      snapshotTimerRef.current += delta;
      
      // If there's serial output, inject it now!
      if (cpuRef.current.serialBuffer) {
          timelineBufferRef.current.push({
            time: cpu.cycles,
            registers: currentRegState,
            type: "SERIAL_PRINT",
            message: cpuRef.current.serialBuffer,
            pc: cpu.pc,
          });
          cpuRef.current.serialBuffer = "";
      }

      if (snapshotTimerRef.current >= 16) {
        snapshotTimerRef.current = 0;

        // Push a standard logic analyzer snapshot
        timelineBufferRef.current.push({
          time: cpu.cycles,
          registers: currentRegState,
          pc: cpu.pc,
        });

        // Throttle memory array length strictly to prevent SVG DOM explosion
        if (timelineBufferRef.current.length > 200) {
          // Remove from start, but we shouldn't lose serial events too aggressively if we can help it.
          // For now, simple shift is fine to keep browser running smoothly.
          timelineBufferRef.current.shift();
        }

        // Push buffer to state for React rendering
        setLiveTimeline([...timelineBufferRef.current]);
      }

      if (breakpointsRef.current.has(cpu.pc)) {
        setIsRunning(false);
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        breakpointHandlerRef.current(cpu.pc);
        return;
      }

      // Keep Looping
      requestRef.current = requestAnimationFrame(tick);

    } catch (e) {
      console.error("Virtual CPU execution panicked:", e);
      setIsRunning(false);
    }
  }, []);

  const startSimulation = useCallback((hexString, initialRegisters = {}) => {
    if (!SUPPORTED_MCUS.has(activeMcuId)) {
      throw new Error("Simulator support coming soon for this MCU.");
    }

    console.log("Starting simulation with HEX size:", hexString.length);
    // 0. Terminate any previously running simulation ghost loops
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    // 1. Initialize CPU
    const cpu = new CPU(new Uint16Array(16384));
    
    // 2. Load Intel Hex into Program Memory
    loadHex(hexString, new Uint8Array(cpu.progBytes.buffer));

    // 3. Mount Hardware Peripherals
    const portB = new AVRIOPort(cpu, portBConfig);
    const portC = new AVRIOPort(cpu, portCConfig);
    const portD = new AVRIOPort(cpu, portDConfig);
    
    portB.addListener((val, oldVal) => { if (typeof window !== 'undefined' && window.onPortChange) window.onPortChange('B', val, oldVal, cpu.cycles); });
    portC.addListener((val, oldVal) => { if (typeof window !== 'undefined' && window.onPortChange) window.onPortChange('C', val, oldVal, cpu.cycles); });
    portD.addListener((val, oldVal) => { if (typeof window !== 'undefined' && window.onPortChange) window.onPortChange('D', val, oldVal, cpu.cycles); });
    
    // Initialize timers to attach them to CPU hardware interrupts
    new AVRTimer(cpu, timer0Config);
    new AVRTimer(cpu, timer1Config);
    new AVRTimer(cpu, timer2Config);

    // Mount USART (Serial output)
    const usart = new AVRUSART(cpu, usart0Config, 16000000);
    
    // Mount SPI
    const spi = new AVRSPI(cpu, spiConfig, 16000000);
    spi.onByte = (value) => {
      // Simulate typical fast SPI transfer completion
      spi.completeTransfer(0x00);
      if (typeof window !== 'undefined' && window.onSPIByte) {
        window.onSPIByte(value, cpu.cycles);
      }
    };

    // Mount I2C (TWI)
    const twi = new AVRTWI(cpu, twiConfig, 16000000);
    
    // Inject global external pin actuator for interactive components map
    if (typeof window !== 'undefined') {
       window.setExternalPin = (pinStr, isHigh) => {
          let port;
          let bit;
          // Map Arduino generic strings like "13" -> B5, "A0" -> C0
          let pinNum = parseInt(pinStr);
          if (isNaN(pinNum)) {
            if (pinStr.startsWith("A") || pinStr.startsWith("a")) {
               pinNum = 14 + parseInt(pinStr.substring(1));
            }
          }
          if (pinNum >= 0 && pinNum <= 7) { port = portD; bit = pinNum; }
          else if (pinNum >= 8 && pinNum <= 13) { port = portB; bit = pinNum - 8; }
          else if (pinNum >= 14 && pinNum <= 19) { port = portC; bit = pinNum - 14; }
          
          if (port) port.setPin(bit, isHigh);
       };
    }
    // Analog input bus: keyed by Arduino pin number, value 0-1 (normalized)
    if (typeof window !== 'undefined') {
      window.__avrAnalogInputs = {};
    }
    let currentTWIAddr = 0;
    twi.eventHandler = {
      start: () => { twi.completeStart(); },
      stop: () => { twi.completeStop(); },
      connectToSlave: (addr, write) => {
        currentTWIAddr = addr;
        if (typeof window !== 'undefined' && window.onTWIConnect) window.onTWIConnect(addr, write, cpu.cycles);
        twi.completeConnect(true);
      },
      writeByte: (value) => {
        if (typeof window !== 'undefined' && window.onTWIByte) window.onTWIByte(value, cpu.cycles, currentTWIAddr);
        twi.completeWrite(true);
      },
      readByte: () => {
        const byte = (typeof window !== 'undefined' && window.getTWIReadByte)
          ? (window.getTWIReadByte(currentTWIAddr) ?? 0x00)
          : 0x00;
        twi.completeRead(byte);
      }
    };

    // Mount ADC — required for analog reads (ADCSRA polling must not hang)
    const adc = new AVRADC(cpu, { ...adcConfig, muxChannels: atmega328Channels });
    adc.onADCRead = (input) => {
      if (input.type === 0 /* SingleEnded */ && input.channel !== undefined) {
        const pinIdx = 14 + input.channel; // A0=14, A1=15, …
        const norm = (typeof window !== 'undefined' && window.__avrAnalogInputs)
          ? (window.__avrAnalogInputs[pinIdx] ?? 0)
          : 0;
        return norm * 5; // return voltage 0-5V
      }
      return 0;
    };

    // Mount EEPROM — required for eeprom_read_byte / eeprom_write_byte
    const eepromBackend = new EEPROMMemoryBackend(1024);
    new AVREEPROM(cpu, eepromBackend, eepromConfig);

    // Mount Watchdog — required for wdt_enable / WDT reset
    new AVRWatchdog(cpu, watchdogConfig, 16000000);

    cpuRef.current = { cpu, portB, portC, portD, serialBuffer: "", spi, twi, usart, adc };
    
    usart.onByteTransmit = (data) => {
      cpuRef.current.serialBuffer += String.fromCharCode(data);
      if (typeof window !== 'undefined') window.onSerialTX?.(data);
    };

    if (typeof window !== 'undefined') {
      window.injectSerialByte = (byte) => { cpuRef.current?.usart?.writeByte(byte); };
    }

    // 4. Apply initial register states (if provided)
    // Map register names to I/O addresses for ATmega328P
    const REG_MAP = {
      TCCR0A: 0x44, TCCR0B: 0x45, OCR0A: 0x47, OCR0B: 0x48,
      TCCR1A: 0x80, TCCR1B: 0x81, OCR1A: 0x88, OCR1B: 0x8A, ICR1: 0x86,
      TCCR2A: 0xB0, TCCR2B: 0xB1, OCR2A: 0xB3,
      EICRA: 0x69, EIMSK: 0x3D, PCICR: 0x68, SMCR: 0x53,
      SREG: 0x5F,
    };

    if (initialRegisters) {
      Object.entries(initialRegisters).forEach(([reg, val]) => {
        const addr = REG_MAP[reg];
        if (addr !== undefined) {
          if (Array.isArray(val)) {
            // Convert bit array to byte
            let byteVal = 0;
            val.forEach((bit, i) => { if(bit) byteVal |= (1 << i); });
            cpu.data[addr] = byteVal;
          } else if (typeof val === 'number') {
            // Handle 16-bit registers (OCR1A etc)
            if (reg === 'OCR1A' || reg === 'OCR1B' || reg === 'ICR1') {
               cpu.data[addr] = val & 0xFF; // Low byte
               cpu.data[addr + 1] = (val >> 8) & 0xFF; // High byte
            } else {
               cpu.data[addr] = val & 0xFF;
            }
          }
        }
      });
      // Special case for SREG_I bit
      if (initialRegisters.SREG_I) {
          cpu.data[0x5F] |= (1 << 7);
      }
    }
    
    // 5. Reset State
    timelineBufferRef.current = [{
      time: 0,
      registers: null,
      type: "SERIAL_BEGIN",
      baud: 9600, // We default to 9600 in our generic display
      pc: 0,
    }];

    setLiveTimeline([...timelineBufferRef.current]);
    setCpuState(null);
    setIsRunning(true);
    
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(runExecutionLoop);
  }, [runExecutionLoop, activeMcuId]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    cpuRef.current = null;
    if (toneFreqRef.current !== 0) {
      toneFreqRef.current = 0;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('avr-tone-change', { detail: { pin: 11, freq: 0, active: false } }));
      }
    }
  }, []);

  const updateSpeedMultiplier = useCallback((value) => {
    speedRef.current = value;
    setSpeedMultiplierState(value);
  }, []);

  const updateBreakpoints = useCallback((list) => {
    setActiveBreakpoints(list);
    breakpointsRef.current = new Set(list);
  }, []);

  const setBreakpointHandler = useCallback((handler) => {
    breakpointHandlerRef.current = handler || (() => {});
  }, []);

  return {
    startSimulation,
    stopSimulation,
    isRunning,
    cpuState,
    liveTimeline,
    speedMultiplier,
    setSpeedMultiplier: updateSpeedMultiplier,
    activeBreakpoints,
    setBreakpoints: updateBreakpoints,
    setBreakpointHandler,
  };
}
