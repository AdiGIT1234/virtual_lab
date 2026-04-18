import React, { useEffect, useRef, useState } from 'react';
import { PeripheralSimulator } from '../engine/PeripheralSimulator';

// Helper for consistent pin markers (static, DraggableWrapper handles interaction)
const Pin = ({ x, y, label, color = '#22d3ee' }) => (
  <g>
    <circle cx={x} cy={y} r={3.5} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
    {label && <text x={x} y={y + 10} fill="#64748b" fontSize={7} textAnchor="middle" fontFamily="monospace">{label}</text>}
  </g>
);

/* ── Displays & Actuators ── */
export const Buzzer = () => (
  <svg width={80} height={90} viewBox="0 0 80 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={10} y={10} width={60} height={60} rx={30} fill="#0f172a" stroke="#22c55e" strokeWidth={2} />
    <circle cx={40} cy={40} r={10} fill="#334155" />
    <text x={30} y={25} fill="white" fontSize={14}>+</text>
    <Pin x={20} y={82} label="SIG" />
    <Pin x={56} y={82} label="GND" />
    <line x1={20} y1={70} x2={20} y2={82} stroke="#94a3b8" strokeWidth={2} />
    <line x1={56} y1={70} x2={56} y2={82} stroke="#94a3b8" strokeWidth={2} />
  </svg>
);

export const Lcd1602 = ({ id, wiredPins }) => {
  const [buffer, setBuffer] = useState(new Array(32).fill(" "));
  
  useEffect(() => {
    if (!id || !wiredPins) return;
    
    // Register LCD with simulator
    PeripheralSimulator.registerComponent(id, "LCD1602", {
      pins: {
        rs: wiredPins["rs"],
        e: wiredPins["e"],
        d4: wiredPins["d4"],
        d5: wiredPins["d5"],
        d6: wiredPins["d6"],
        d7: wiredPins["d7"]
      },
      onRenderTarget: (newBuffer) => {
        setBuffer([...newBuffer]);
      }
    });

    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const line1 = buffer.slice(0, 16).join("");
  const line2 = buffer.slice(16, 32).join("");

  return (
    <svg width={200} height={105} viewBox="0 0 200 105" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={200} height={85} rx={4} fill="#166534" />
      <rect x={20} y={15} width={160} height={55} rx={2} fill="#84cc16" opacity={0.8} />
      
      <text x={25} y={35} fill="#064e3b" fontSize={16} fontFamily="monospace" fontWeight="bold">
        {line1.trim() === "" && line2.trim() === "" ? "16x2 LCD" : line1}
      </text>
      <text x={25} y={55} fill="#064e3b" fontSize={16} fontFamily="monospace" fontWeight="bold">
        {line2}
      </text>

      <g transform="translate(0, 95)">
        {["vss","vdd","rs","e","d4","d5","d6","d7","led+","led-"].map((l, i) => (
          <Pin key={i} x={9 + i * 12} y={5} label={l.toUpperCase()} color={i<2||i>7 ? '#facc15' : '#22d3ee'} />
        ))}
      </g>
    </svg>
  );
};

export const OledSSD1306 = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    
    // Register OLED with simulator
    PeripheralSimulator.registerComponent(id, "OLED_SSD1306", {
      address: 0x3C,
      onRenderTarget: (buffer) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const imgData = ctx.createImageData(128, 64);
        // SSD1306 buffer is 128x64 bits = 1024 bytes (8 pages of 128 bytes)
        // Each byte is a vertical column of 8 pixels
        for (let page = 0; page < 8; page++) {
          for (let col = 0; col < 128; col++) {
            const byte = buffer[page * 128 + col];
            for (let bit = 0; bit < 8; bit++) {
              const pixelOn = (byte & (1 << bit)) !== 0;
              const x = col;
              const y = page * 8 + bit;
              const idx = (y * 128 + x) * 4;
              imgData.data[idx] = 0;       // R
              imgData.data[idx+1] = pixelOn ? 242 : 6; // G
              imgData.data[idx+2] = pixelOn ? 255 : 23; // B
              imgData.data[idx+3] = 255;   // A
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    });

    return () => {
      PeripheralSimulator.unregisterComponent(id);
    };
  }, [id, wiredPins]);

  return (
    <svg width={80} height={100} viewBox="0 0 80 100" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={80} height={80} rx={4} fill="#1e3a8a" />
      <rect x={10} y={20} width={60} height={40} fill="#020617" />
      
      <foreignObject x={10} y={20} width={60} height={40}>
        <canvas ref={canvasRef} width={128} height={64} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      </foreignObject>

      <text x={40} y={15} fill="#00f2ff" fontSize={10} fontFamily="monospace" fontWeight="bold" textAnchor="middle">OLED 128x64</text>
      {["VCC","GND","SCL","SDA"].map((l, i) => (
        <Pin key={i} x={15 + i*16} y={95} label={l} />
      ))}
    </svg>
  );
};

export const LedBarGraph = ({ pinStates = {} }) => {
  return (
    <svg width={140} height={40} viewBox="0 0 140 40" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={140} height={40} rx={4} fill="#020617" />
      {[...Array(10)].map((_, i) => {
        const pinId = (i + 1).toString();
        let isOn = pinStates[pinId] === 1;
        
        // For preview where pinStates isn't fully defined
        if (Object.keys(pinStates).length === 0) isOn = i < 7; 
        
        let ledColor = i < 2 ? "#22c55e" : i < 5 ? "#eab308" : i < 8 ? "#f97316" : "#ef4444";
        return (
          <rect key={i} x={5 + i*13} y={5} width={10} height={30} fill={ledColor} opacity={isOn ? 1 : 0.2} />
        );
      })}
    </svg>
  );
};

export const EPaperDisplay = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!id || !wiredPins) return;
    
    PeripheralSimulator.registerComponent(id, "EPAPER_BASIC", {
      pins: {
        cs: wiredPins["cs"],
        dc: wiredPins["dc"],
        rst: wiredPins["rst"],
        mosi: wiredPins["mosi"],
        sck: wiredPins["sck"],
        busy: wiredPins["busy"]
      }
    });

    const renderLoop = setInterval(() => {
      const comp = PeripheralSimulator.components.get(id);
      // Wait for master activation to actually redraw visually
      if (comp && comp.state.updatePending && canvasRef.current) {
         comp.state.updatePending = false; // Reset flag upon render

         const ctx = canvasRef.current.getContext('2d');
         // Use logical size native to the component mapping (296 x 128 is a common generic format)
         const width = 128;
         const height = 296;
         const imgData = ctx.createImageData(width, height);
         const buffer = comp.state.buffer;
         
         const bytesPerRow = width / 8; // 16
         
         for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            const y = Math.floor(i / bytesPerRow);
            const xBase = (i % bytesPerRow) * 8;
            for (let bit = 0; bit < 8; bit++) {
               // 1 usually means white, 0 means black in e-paper
               const pixelOff = (byte & (0x80 >> bit)) !== 0; 
               const idx = (y * width + (xBase + bit)) * 4;
               
               if (idx < imgData.data.length - 3) {
                 imgData.data[idx] = pixelOff ? 248 : 0;     // R
                 imgData.data[idx+1] = pixelOff ? 250 : 0;   // G
                 imgData.data[idx+2] = pixelOff ? 252 : 0;   // B
                 imgData.data[idx+3] = 255;                  // Alpha
               }
            }
         }
         ctx.putImageData(imgData, 0, 0);
      }
    }, 250); // Epaper is slow, don't run 60hz loop

    return () => {
      clearInterval(renderLoop);
      PeripheralSimulator.unregisterComponent(id);
    };
  }, [id, wiredPins]);

  return (
    <svg width={140} height={200} viewBox="0 0 140 200" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={140} height={180} rx={4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
      <rect x={5} y={5} width={130} height={170} fill="#e2e8f0" />
      <foreignObject x={5} y={5} width={130} height={170}>
        <canvas ref={canvasRef} width={128} height={296} style={{ width: '100%', height: '100%', display: 'block' }} />
      </foreignObject>
      <text x={70} y={90} fill="#94a3b8" fontSize={14} fontWeight="bold" textAnchor="middle">E-INK (SPI)</text>
      {["vcc", "gnd", "sck", "mosi", "cs", "dc", "rst", "busy"].map((l, i) => (
        <Pin key={i} x={14 + i*16} y={194} label={l.toUpperCase()} color={i<2 ? '#facc15' : '#22d3ee'} />
      ))}
    </svg>
  );
};

export const AnalogTV = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
     let animationId;
     if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        let counter = 0;
        const drawStatic = () => {
           // Simulate a TV screen with static and a slight rolling bar effect
           const imgData = ctx.createImageData(160, 120);
           const barY = (counter % 120);
           for (let i = 0; i < imgData.data.length / 4; i++) {
              const y = Math.floor(i / 160);
              let noise = Math.random() * 80 + 20;
              if (Math.abs(y - barY) < 5) noise += 40; // rolling sync bar
              
              imgData.data[i*4] = noise;
              imgData.data[i*4+1] = noise;
              imgData.data[i*4+2] = noise;
              imgData.data[i*4+3] = 255;
           }
           ctx.putImageData(imgData, 0, 0);
           counter++;
           // We cap the frame rate a little so we don't spin CPUs for just visual static
           setTimeout(() => { animationId = requestAnimationFrame(drawStatic); }, 30);
        };
        drawStatic();
     }
     return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <svg width={200} height={180} viewBox="0 0 200 180" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={200} height={160} rx={10} fill="#f59e0b" />
      <rect x={5} y={5} width={190} height={150} rx={8} fill="#78350f" />
      
      {/* Vents & Dials */}
      <rect x={165} y={20} width={20} height={8} fill="#451a03" />
      <rect x={165} y={40} width={20} height={8} fill="#451a03" />
      <circle cx={175} cy={80} r={10} fill="#d97706" />
      <circle cx={175} cy={110} r={10} fill="#d97706" />
      
      {/* Screen Extrusion */}
      <rect x={10} y={15} width={150} height={130} rx={25} fill="#3b2010" />
      
      {/* Screen Screen */}
      <rect x={15} y={20} width={140} height={120} rx={20} fill="#020617" />
      
      <foreignObject x={15} y={20} width={140} height={120} style={{ clipPath: "polygon(5% 0, 95% 0, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0 90%, 0 10%)" }}>
        <canvas ref={canvasRef} width={160} height={120} style={{ width: '100%', height: '100%', display: 'block' }} />
      </foreignObject>

      <text x={85} y={135} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" opacity="0.3">ANALOG</text>

      {["video", "gnd"].map((l, i) => (
         <Pin key={i} x={50 + i*60} y={170} label={l.toUpperCase()} color={i === 0 ? "#eab308" : "#22d3ee"} />
      ))}
    </svg>
  );
};

export const Ili9341Tft = ({ id, wiredPins }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!id || !wiredPins) return;
    
    // Register TFT with simulator
    PeripheralSimulator.registerComponent(id, "TFT_ILI9341", {
      pins: {
        cs: wiredPins["cs"],
        dc: wiredPins["dc"],
        rst: wiredPins["rst"],
        mosi: wiredPins["mosi"],
        sck: wiredPins["sck"]
      }
    });

    const renderLoop = setInterval(() => {
      const comp = PeripheralSimulator.components.get(id);
      if (comp && comp.state.buffer && canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         const imgData = ctx.createImageData(240, 320);
         const buffer = comp.state.buffer;
         for (let i = 0; i < buffer.length; i++) {
            const color565 = buffer[i];
            const r = (color565 >> 11) & 0x1F;
            const g = (color565 >> 5) & 0x3F;
            const b = color565 & 0x1F;
            // Scale to 8-bit
            imgData.data[i*4] = (r * 255) / 31;
            imgData.data[i*4+1] = (g * 255) / 63;
            imgData.data[i*4+2] = (b * 255) / 31;
            imgData.data[i*4+3] = 255; 
         }
         ctx.putImageData(imgData, 0, 0);
      }
    }, 100); // 10fps refresh from buffer

    return () => {
      clearInterval(renderLoop);
      PeripheralSimulator.unregisterComponent(id);
    };
  }, [id, wiredPins]);

  return (
    <svg width={110} height={150} viewBox="0 0 110 150" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={110} height={130} rx={4} fill="#b91c1c" />
      <rect x={10} y={15} width={90} height={100} fill="#0f172a" />
      
      <foreignObject x={10} y={15} width={90} height={100}>
        <canvas ref={canvasRef} width={240} height={320} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      </foreignObject>

      <text x={55} y={15} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">ILI9341</text>
      {["vcc","gnd","cs","rst","dc","mosi","sck","led"].map((l, i) => (
        <Pin key={i} x={10 + i*13} y={142} label={l.toUpperCase()} />
      ))}
    </svg>
  );
};

/* ── Sensors ── */
export const Dht22 = () => (
  <svg width={65} height={90} viewBox="0 0 65 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={5} width={55} height={70} rx={4} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
    {[20,30,40,50,60].map(y => <line key={y} x1={15} x2={50} y1={y} y2={y} stroke="#cbd5e1" strokeWidth={2} />)}
    <text x={32} y={16} fill="#0ea5e9" fontSize={10} fontWeight="bold" textAnchor="middle">DHT22</text>
    {["VCC","DATA","GND"].map((l, i) => <Pin key={i} x={13 + i*20} y={84} label={l} />)}
  </svg>
);

export const NtcSensor = () => (
  <svg width={50} height={80} viewBox="0 0 50 80" style={{ display: 'block', overflow: 'visible' }}>
    <circle cx={25} cy={40} r={12} fill="#0ea5e9" opacity={0.9} />
    <Pin x={15} y={74} label="T1" />
    <Pin x={35} y={74} label="T2" />
    <path d="M15 74 Q 15 52 20 45" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <path d="M35 74 Q 35 52 30 45" stroke="#94a3b8" strokeWidth={2} fill="none" />
  </svg>
);

export const Photoresistor = () => (
  <svg width={50} height={80} viewBox="0 0 50 80" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={10} y={30} width={30} height={20} rx={8} fill="#f59e0b" opacity={0.9} />
    <path d="M15 40 L20 35 L25 45 L30 35 L35 40" stroke="#b45309" strokeWidth={2} fill="none" />
    <Pin x={15} y={74} label="L1" />
    <Pin x={35} y={74} label="L2" />
    <path d="M15 74 C 15 60 15 50 20 50" stroke="#94a3b8" strokeWidth={2} fill="none" />
    <path d="M35 74 C 35 60 35 50 30 50" stroke="#94a3b8" strokeWidth={2} fill="none" />
  </svg>
);

export const PirSensor = () => (
  <svg width={75} height={90} viewBox="0 0 75 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={15} width={65} height={60} rx={4} fill="#22c55e" />
    <circle cx={37.5} cy={45} r={25} fill="#f8fafc" />
    <circle cx={37.5} cy={45} r={15} fill="#e2e8f0" />
    {["VCC","OUT","GND"].map((l, i) => <Pin key={i} x={14 + i*24} y={84} label={l} />)}
  </svg>
);

export const Mpu6050 = () => (
  <svg width={85} height={65} viewBox="0 0 85 65" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={85} height={50} rx={4} fill="#1e3a8a" />
    <rect x={40} y={15} width={20} height={20} rx={2} fill="#0f172a" />
    <text x={20} y={30} fill="white" fontSize={10} fontWeight="bold">MPU</text>
    {["VCC","GND","SCL","SDA"].map((l, i) => <Pin key={i} x={10 + i*21} y={60} label={l} />)}
  </svg>
);

export const HcSr04 = () => (
  <svg width={110} height={65} viewBox="0 0 110 65" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={110} height={50} rx={4} fill="#2563eb" />
    <circle cx={30} cy={25} r={18} fill="#e2e8f0" />
    <circle cx={30} cy={25} r={8} fill="#333" />
    <circle cx={80} cy={25} r={18} fill="#e2e8f0" />
    <circle cx={80} cy={25} r={8} fill="#333" />
    {["VCC","TRIG","ECHO","GND"].map((l, i) => <Pin key={i} x={20 + i*23} y={60} label={l} />)}
  </svg>
);

export const FlameSensor = () => (
  <svg width={70} height={90} viewBox="0 0 70 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={20} width={70} height={55} rx={4} fill="#7e22ce" />
    <circle cx={55} cy={15} r={6} fill="#0f172a" />
    <text x={35} y={50} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">FLAME</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*16} y={84} label={l} />)}
  </svg>
);

export const GasSensor = () => (
  <svg width={80} height={100} viewBox="0 0 80 100" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={30} width={80} height={55} rx={4} fill="#1e293b" />
    <rect x={20} y={5} width={40} height={25} fill="#475569" />
    <path d="M20 10 H60 M20 15 H60 M20 20 H60 M25 5 V30 M35 5 V30 M45 5 V30 M55 5 V30" stroke="#94a3b8" />
    <text x={40} y={65} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle">MQ-2</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*20} y={94} label={l} />)}
  </svg>
);

export const HeartbeatSensor = () => (
  <svg width={70} height={90} viewBox="0 0 70 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={70} height={60} rx={35} fill="#b91c1c" />
    <ellipse cx={35} cy={45} rx={15} ry={10} fill="#fca5a5" />
    {["VCC","SIG","GND"].map((l, i) => <Pin key={i} x={12 + i*23} y={84} label={l} />)}
  </svg>
);

export const SoundSensor = () => (
  <svg width={75} height={90} viewBox="0 0 75 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={20} width={75} height={55} rx={4} fill="#2563eb" />
    <circle cx={15} cy={15} r={10} fill="#94a3b8" />
    <circle cx={15} cy={15} r={6} fill="#475569" />
    <text x={45} y={50} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">MIC</text>
    {["AOUT","DOUT","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*18} y={84} label={l} />)}
  </svg>
);

export const LoadCellHx711 = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={90} height={70} rx={4} fill="#166534" />
    <rect x={35} y={25} width={20} height={20} rx={2} fill="#0f172a" />
    {["E+","E-","A+","A-","DT","SCK","VCC","GND"].map((l, i) => <Pin key={i} x={9 + i*11} y={84} label={l} color={i<4?"#f87171":"#22d3ee"} />)}
  </svg>
);

/* ── Inputs ── */
export const MembraneKeypad = ({ id, wiredPins }) => {
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => {
    if (!id || !wiredPins) return;
    PeripheralSimulator.registerComponent(id, "KEYPAD", {
      pins: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"].map(p => wiredPins[p])
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  const handleDown = (r, c) => {
    setActiveKey(`r${r}c${c}`);
    const comp = PeripheralSimulator.components.get(id);
    if (comp && comp.state) {
       comp.state.activeNode = `r${r}c${c}`;
       const rowPin = comp.state.pins[r - 1];
       const colPin = comp.state.pins[c + 3];
       if (rowPin && PeripheralSimulator.getPinVal(rowPin) === 0 && window.setExternalPin) {
           window.setExternalPin(colPin, false);
       }
    }
  };

  const handleUp = () => {
    const comp = PeripheralSimulator.components.get(id);
    if (comp && comp.state && comp.state.activeNode) {
       const colIdx = parseInt(comp.state.activeNode.charAt(3), 10);
       const colPin = comp.state.pins[colIdx + 3];
       comp.state.activeNode = null;
       if (colPin && window.setExternalPin) {
           window.setExternalPin(colPin, true); // Restore back to simulated pullup High
       }
    }
    setActiveKey(null);
  };

  return (
    <svg width={90} height={120} viewBox="0 0 90 120" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0} y={0} width={70} height={120} rx={4} fill="#0f172a" />
      {[1,2,3,4].map(r => [1,2,3,4].map(c => (
         <rect 
            key={`${r}${c}`} 
            x={4+c*14} y={5+r*20} 
            width={10} height={14} rx={2} 
            fill={activeKey === `r${r}c${c}` ? "#f8fafc" : "#334155"}
            onPointerDown={(e) => { e.stopPropagation(); handleDown(r, c); }}
            onPointerUp={(e) => { e.stopPropagation(); handleUp(); }}
            onPointerLeave={handleUp}
            style={{ cursor: "pointer" }}
         />
      )))}
      {[1,2,3,4,5,6,7,8].map(i => <Pin key={i} x={84} y={15 + i*13} label={`P${i}`} />)}
    </svg>
  );
};

export const RotaryEncoder = () => (
  <svg width={65} height={90} viewBox="0 0 65 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={25} width={55} height={50} rx={4} fill="#334155" />
    <circle cx={32.5} cy={20} r={15} fill="#94a3b8" />
    <path d="M 32.5 5 V 35 M 17.5 20 H 47.5" stroke="#475569" strokeWidth={2} />
    {["CLK","DT","SW","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*11} y={84} label={l} />)}
  </svg>
);

export const AnalogJoystick = () => (
  <svg width={85} height={95} viewBox="0 0 85 95" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={85} height={65} rx={4} fill="#166534" />
    <circle cx={42.5} cy={45} r={25} fill="#0f172a" opacity={0.6} />
    <circle cx={42.5} cy={45} r={15} fill="#475569" />
    {["VRX","VRY","SW","VCC","GND"].map((l, i) => <Pin key={i} x={10 + i*16} y={90} label={l} />)}
  </svg>
);

export const DipSwitch8 = () => (
  <svg width={115} height={65} viewBox="0 0 115 65" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={115} height={45} rx={4} fill="#dc2626" />
    {[1,2,3,4,5,6,7,8].map(i => <rect key={i} x={0 + i*11} y={10} width={6} height={16} rx={1} fill="#f8fafc" />)}
    {[1,2,3,4,5,6,7,8].map(i => <Pin key={i} x={3 + i*11} y={58} label={i} />)}
    <Pin x={105} y={58} label="COM" color="#f59e0b" />
  </svg>
);

export const SlideSwitch = () => (
  <svg width={55} height={55} viewBox="0 0 55 55" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={10} width={45} height={30} rx={4} fill="#64748b" />
    <rect x={10} y={15} width={10} height={20} rx={2} fill="#0f172a" />
    <Pin x={12} y={50} label="1" />
    <Pin x={27} y={50} label="2" />
    <Pin x={43} y={50} label="3" />
  </svg>
);

export const NeopixelRing = ({ id, wiredPins }) => {
  const [colors, setColors] = useState(new Array(12).fill("#1e293b"));

  useEffect(() => {
    if (!id || !wiredPins || !wiredPins["din"]) return;
    
    PeripheralSimulator.registerComponent(id, "NEOPIXEL", {
      pin: wiredPins["din"],
      length: 12,
      onRenderTarget: (buffer) => {
        const newColors = [];
        for (let i = 0; i < 12; i++) {
          const g = buffer[i*3];
          const r = buffer[i*3 + 1] !== undefined ? buffer[i*3 + 1] : 0;
          const b = buffer[i*3 + 2] !== undefined ? buffer[i*3 + 2] : 0;
          newColors.push(`rgb(${r},${g},${b})`);
        }
        setColors(newColors);
      }
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  return (
    <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block', overflow: 'visible' }}>
      <circle cx={45} cy={45} r={40} fill="#1e293b" />
      <circle cx={45} cy={45} r={25} fill="#0f172a" />
      {colors.map((c, i) => (
        <circle key={i} cx={45 + 32*Math.cos(i*Math.PI/6)} cy={45 + 32*Math.sin(i*Math.PI/6)} r={3} fill={c === "rgb(0,0,0)" || !c ? "#334155" : c} />
      ))}
      {["5v","din","gnd"].map((l, i) => <Pin key={i} x={25 + i*20} y={84} label={l.toUpperCase()} />)}
    </svg>
  );
};

/* ── Motors & Individual Outputs ── */
export const StepperMotor = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block', overflow: 'visible' }}>
    <circle cx={45} cy={40} r={35} fill="#cbd5e1" />
    <circle cx={45} cy={40} r={10} fill="#f8fafc" />
    <circle cx={45} cy={40} r={3} fill="#334155" />
    <rect x={15} y={75} width={60} height={5} fill="#0ea5e9" />
    {["a+","a-","b+","b-"].map((l, i) => <Pin key={i} x={20 + i*16} y={84} label={l.toUpperCase()} color="#f59e0b" />)}
  </svg>
);

export const NeopixelPixel = ({ id, wiredPins }) => {
  const [color, setColor] = useState("#1e293b");

  useEffect(() => {
    if (!id || !wiredPins || !wiredPins["din"]) return;
    
    PeripheralSimulator.registerComponent(id, "NEOPIXEL", {
      pin: wiredPins["din"],
      length: 1,
      onRenderTarget: (buffer) => {
        const g = buffer[0];
        const r = buffer[1];
        const b = buffer[2];
        if (r===0 && g===0 && b===0) setColor("#1e293b"); // Off
        else setColor(`rgb(${r},${g},${b})`);
      }
    });
    return () => PeripheralSimulator.unregisterComponent(id);
  }, [id, wiredPins]);

  return (
    <svg width={50} height={55} viewBox="0 0 50 55" style={{ display: 'block', overflow: 'visible' }}>
      <rect x={10} y={10} width={30} height={30} rx={2} fill="#f8fafc" />
      <circle cx={25} cy={25} r={10} fill={color} />
      {["5v","din","gnd"].map((l, i) => <Pin key={i} x={10 + i*15} y={50} label={l.toUpperCase()} />)}
    </svg>
  );
};

/* ── Comms & ICs ── */
export const IrReceiver = () => (
  <svg width={50} height={70} viewBox="0 0 50 70" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={10} y={15} width={30} height={40} rx={15} fill="#111827" />
    <circle cx={25} cy={30} r={8} fill="#334155" />
    {["OUT","VCC","GND"].map((l, i) => <Pin key={i} x={12 + i*13} y={64} label={l} />)}
  </svg>
);

export const IrRemote = () => (
  <svg width={75} height={130} viewBox="0 0 75 130" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={5} y={5} width={65} height={120} rx={10} fill="#111827" />
    <circle cx={37.5} cy={20} r={6} fill="#ef4444" />
    {[35, 55, 75, 95].map(y => [20, 37.5, 55].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill="#334155" />))}
  </svg>
);

export const Ds1307Rtc = () => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={90} height={75} rx={4} fill="#166534" />
    <circle cx={25} cy={35} r={20} fill="#e2e8f0" />
    <text x={25} y={40} fill="#64748b" fontSize={10} textAnchor="middle">CR2032</text>
    <rect x={55} y={20} width={20} height={30} rx={2} fill="#0f172a" />
    {["VCC","GND","SCL","SDA"].map((l, i) => <Pin key={i} x={15 + i*20} y={84} label={l} />)}
  </svg>
);

export const MicroSdModule = () => (
  <svg width={80} height={75} viewBox="0 0 80 75" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={80} height={60} rx={4} fill="#2563eb" />
    <rect x={15} y={5} width={50} height={40} fill="#e2e8f0" />
    <rect x={20} y={10} width={40} height={30} fill="#0f172a" />
    {["VCC","GND","MISO","MOSI","SCK","CS"].map((l, i) => <Pin key={i} x={8 + i*13} y={70} label={l} />)}
  </svg>
);

export const ShiftRegister = () => (
  <svg width={100} height={110} viewBox="0 0 100 110" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={20} y={10} width={60} height={90} rx={4} fill="#0f172a" />
    <text x={50} y={60} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" transform="rotate(-90 50 60)">74HC595</text>
    {/* Explicit Left Pins */}
    {["VCC","Q0","DS","OE","STCP","SHCP","MR","Q7'"].map((l, i) => <Pin key={i} x={10} y={15 + i*11} label={l} color={i===0?"#facc15":"#22d3ee"} />)}
    {/* Explicit Right Pins */}
    {["Q7","Q6","Q5","Q4","Q3","Q2","Q1","GND"].map((l, i) => <Pin key={i} x={90} y={15 + i*11} label={l} color={i===7?"#facc15":"#22d3ee"} />)}
  </svg>
);

export const RelayModule = () => (
  <svg width={90} height={100} viewBox="0 0 90 100" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={0} width={90} height={80} rx={4} fill="#2563eb" />
    <rect x={10} y={10} width={40} height={60} fill="#3b82f6" />
    <text x={30} y={45} fill="white" fontSize={12} textAnchor="middle">RELAY</text>
    {["IN","VCC","GND"].map((l, i) => <Pin key={i} x={15 + i*16} y={94} label={l} />)}
    {["COM","NO","NC"].map((l, i) => <Pin key={i} x={60 + i*12} y={94} label={l} color="#f59e0b" />)}
  </svg>
);

export const LedMatrix8x8 = ({ pinStates = {} }) => (
  <svg width={90} height={90} viewBox="0 0 90 90" style={{ display: 'block', overflow: 'visible' }}>
    <rect x={0} y={15} width={90} height={60} rx={4} fill="#111827" />
    {[0,1,2,3,4,5,6,7].map(r => [0,1,2,3,4,5,6,7].map(c => {
       const isRowHigh = pinStates[`r${r}`] === 1;
       const isColLow = pinStates[`c${c}`] === 0 || pinStates[`c${c}`] === undefined;
       let isOn = isRowHigh && isColLow;
       if (Object.keys(pinStates).length === 0) isOn = (r+c) % 2 === 0;

       return <circle key={`${r}${c}`} cx={14+c*9} cy={22+r*7} r={2} fill="#ef4444" opacity={isOn ? 1 : 0.15} />
    }))}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`T${i}`} x={12 + i*9} y={5} label={`C${i}`} />)}
    {[0,1,2,3,4,5,6,7].map(i => <Pin key={`B${i}`} x={12 + i*9} y={85} label={`R${i}`} />)}
  </svg>
);
