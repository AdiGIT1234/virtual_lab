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
  timer2Config
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
      while (cpu.cycles < targetCycle) {
        // Execute a single RISC-V Machine Instruction!
        cpu.tick(); 
      }

      // Snapshot the memory state at the end of the frame
      const data = cpu.data;
      
      const ddrb = data[0x24], portb_reg = data[0x25];
      const ddrc = data[0x27], portc_reg = data[0x28];
      const ddrd = data[0x2A], portd_reg = data[0x2B];

      /* 
         avr8js handles actual pin states depending on Pull-Ups and DDR values via portB.pinState
         We map this over to our Virtual Lab generic register format
      */
      const currentRegState = {
        DDRB: toBits(ddrb), PORTB: toBits(portb_reg), PINB: toBits(portB.pinState),
        DDRC: toBits(ddrc), PORTC: toBits(portc_reg), PINC: toBits(portC.pinState),
        DDRD: toBits(ddrd), PORTD: toBits(portd_reg), PIND: toBits(portD.pinState),
        // Simplistic array to keep our legacy visualizer happy for now
        PWM: new Array(20).fill(0) 
      };

      setCpuRegisters(currentRegState);

      // Save to logic analyzer timeline roughly every 16ms (60 FPS)
      snapshotTimerRef.current += delta;
      if (snapshotTimerRef.current >= 16) {
        snapshotTimerRef.current = 0;
        timelineBufferRef.current.push({
          time: cpu.cycles,
          registers: currentRegState
        });

        // Throttle memory array length strictly
        if (timelineBufferRef.current.length > 500) {
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
    // 1. Initialize CPU
    const cpu = new CPU(new Uint16Array(16384));
    
    // 2. Load Intel Hex into Program Memory
    loadHex(hexString, new Uint8Array(cpu.progBytes.buffer));

    // 3. Mount Hardware Peripherals
    const portB = new AVRIOPort(cpu, portBConfig);
    const portC = new AVRIOPort(cpu, portCConfig);
    const portD = new AVRIOPort(cpu, portDConfig);
    
    const timer0 = new AVRTimer(cpu, timer0Config);
    const timer1 = new AVRTimer(cpu, timer1Config);
    const timer2 = new AVRTimer(cpu, timer2Config);

    cpuRef.current = { cpu, portB, portC, portD, timer0, timer1, timer2 };
    
    // 4. Reset State
    timelineBufferRef.current = [];
    setLiveTimeline([]);
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
