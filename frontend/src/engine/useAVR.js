import { useState, useRef, useCallback } from 'react';
import { 
  CPU,
  AVRIOPort, 
  portBConfig, 
  portCConfig, 
  portDConfig,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRUSART,
  usart0Config
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

export function useAVR() {
  const [cpuRegisters, setCpuRegisters] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liveTimeline, setLiveTimeline] = useState([]);
  
  const cpuRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  const timelineBufferRef = useRef([]);
  const snapshotTimerRef = useRef(0);

  const runExecutionLoop = useCallback(function tick(time) {
    if (!cpuRef.current) return;
    const { cpu, portB, portC, portD } = cpuRef.current;

    // Calculate how many CPU cycles to execute this frame to maintain 16MHz
    const delta = Math.min(time - lastTimeRef.current, 100); 
    lastTimeRef.current = time;
    
    const cyclesToRun = Math.floor(16000000 * (delta / 1000));
    const targetCycle = cpu.cycles + cyclesToRun;

    try {
      let runLimit = 2000000; // Safeguard browser thread from absolute freezing
      while (cpu.cycles < targetCycle && runLimit > 0) {
        cpu.tick();
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

      setCpuRegisters(currentRegState);

      // Save to logic analyzer timeline roughly every 16ms (60 FPS) for smooth UI. Buffer handles SVG limit.
      snapshotTimerRef.current += delta;
      
      // If there's serial output, inject it now!
      if (cpuRef.current.serialBuffer) {
         timelineBufferRef.current.push({
           time: cpu.cycles,
           registers: currentRegState,
           type: "SERIAL_PRINT",
           message: cpuRef.current.serialBuffer
         });
         cpuRef.current.serialBuffer = "";
      }

      if (snapshotTimerRef.current >= 16) {
        snapshotTimerRef.current = 0;
        
        // Push a standard logic analyzer snapshot
        timelineBufferRef.current.push({
          time: cpu.cycles,
          registers: currentRegState
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

      // Keep Looping
      requestRef.current = requestAnimationFrame(tick);

    } catch (e) {
      console.error("Virtual CPU execution panicked:", e);
      setIsRunning(false);
    }
  }, []);

  const startSimulation = useCallback((hexString) => {
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
    
    // Initialize timers to attach them to CPU hardware interrupts
    new AVRTimer(cpu, timer0Config);
    new AVRTimer(cpu, timer1Config);
    new AVRTimer(cpu, timer2Config);

    // Mount USART (Serial output)
    const usart = new AVRUSART(cpu, usart0Config, 16000000);
    
    cpuRef.current = { cpu, portB, portC, portD, serialBuffer: "" };
    
    usart.onByteTransmit = (data) => {
      cpuRef.current.serialBuffer += String.fromCharCode(data);
    };
    
    // 4. Reset State
    timelineBufferRef.current = [{
      time: 0,
      registers: null,
      type: "SERIAL_BEGIN",
      baud: 9600 // We default to 9600 in our generic display
    }];
    
    setLiveTimeline([...timelineBufferRef.current]);
    setCpuRegisters(null);
    setIsRunning(true);
    
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(runExecutionLoop);
  }, [runExecutionLoop]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    cpuRef.current = null;
  }, []);

  return {
    startSimulation,
    stopSimulation,
    isRunning,
    cpuRegisters,
    liveTimeline
  };
}
