import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

// Compact labeled PCB for generic sensor/module boards
export function SensorModule3D({ position, rotation, label = "MODULE", color = "#0f2d4a", borderColor = "#1e5f8a", highlighted }) {
  const w = 0.14, h = 0.025, d = 0.08;
  const emissive = highlighted ? borderColor : "#000000";
  return (
    <group position={position} rotation={rotation}>
      {/* PCB body */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {/* Top copper face */}
      <mesh position={[0, h + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - 0.004, d - 0.004]} />
        <meshStandardMaterial color={borderColor} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* IC chip on top */}
      <mesh position={[0, h + 0.007, 0]}>
        <boxGeometry args={[0.04, 0.006, 0.03]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Pin header row */}
      {[-0.025, -0.010, 0.010, 0.025].map((z, i) => (
        <mesh key={i} position={[-w / 2 - 0.005, 0.008, z]}>
          <cylinderGeometry args={[0.003, 0.003, 0.016, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Floating label */}
      <Text
        position={[0, h + 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.018}
        color={highlighted ? "#00e5ff" : "#8b949e"}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

// DHT22 temperature/humidity sensor
export function Dht22_3D({ position, rotation, highlighted }) {
  return (
    <group position={position} rotation={rotation}>
      {/* White sensor housing */}
      <mesh castShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[0.035, 0.03, 0.06]} />
        <meshStandardMaterial color={highlighted ? "#e8e8ff" : "#f0f0f0"} roughness={0.7} metalness={0} />
      </mesh>
      {/* Vent grille holes (visual only) */}
      {[-0.015, -0.005, 0.005, 0.015].map((z, i) => (
        <mesh key={i} position={[0.018, 0.015, z]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.006, 0.002, 0.001]} />
          <meshStandardMaterial color="#aaa" roughness={0.8} />
        </mesh>
      ))}
      {/* Pin stubs */}
      {[-0.015, -0.005, 0.005, 0.015].map((z, i) => (
        <mesh key={i} position={[0, -0.002, z]}>
          <cylinderGeometry args={[0.002, 0.002, 0.014, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.013}
        color={highlighted ? "#00e5ff" : "#6ee7b7"}
        anchorX="center"
        anchorY="middle"
      >
        DHT22
      </Text>
    </group>
  );
}

// SSD1306 OLED 128×64 display module
export function OledDisplay3D({ position, rotation, highlighted }) {
  const w = 0.14, h = 0.006, d = 0.12;
  const screenW = 0.10, screenD = 0.08;
  return (
    <group position={position} rotation={rotation}>
      {/* PCB */}
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0a1628" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Screen border bezel */}
      <mesh position={[0, h + 0.003, 0]}>
        <boxGeometry args={[screenW + 0.01, 0.005, screenD + 0.01]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* OLED screen face */}
      <mesh position={[0, h + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[screenW, screenD]} />
        <meshStandardMaterial
          color={highlighted ? "#0044aa" : "#001133"}
          emissive={highlighted ? "#0033ff" : "#0011aa"}
          emissiveIntensity={highlighted ? 0.9 : 0.5}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
      {/* Pixel lines — decorative */}
      {[0, 0.012, 0.024, 0.036, -0.012, -0.024].map((zOff, i) => (
        <mesh key={i} position={[0, h + 0.0065, zOff]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[screenW * 0.8, 0.003]} />
          <meshStandardMaterial color="#2277ff" emissive="#2277ff" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Screen glow */}
      <pointLight position={[0, h + 0.05, 0]} color="#2255ff" intensity={0.4} distance={0.3} decay={2} />
      {/* Pin headers */}
      {[-0.02, -0.006, 0.006, 0.020].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.01, -d / 2 - 0.005]}>
          <cylinderGeometry args={[0.003, 0.003, 0.018, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, h + 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.014}
        color={highlighted ? "#00e5ff" : "#93c5fd"}
        anchorX="center"
        anchorY="middle"
      >
        OLED 128×64
      </Text>
    </group>
  );
}

// ILI9341 2.8" TFT display (larger, in landscape)
export function TftDisplay3D({ position, rotation, highlighted }) {
  const w = 0.22, h = 0.006, d = 0.18;
  const screenW = 0.18, screenD = 0.14;
  return (
    <group position={position} rotation={rotation}>
      {/* PCB */}
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0f1a0f" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Bezel */}
      <mesh position={[0, h + 0.004, 0]}>
        <boxGeometry args={[screenW + 0.012, 0.006, screenD + 0.012]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.15} />
      </mesh>
      {/* TFT screen */}
      <mesh position={[0, h + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[screenW, screenD]} />
        <meshStandardMaterial
          color={highlighted ? "#001a33" : "#000d1a"}
          emissive={highlighted ? "#0088ff" : "#003366"}
          emissiveIntensity={highlighted ? 1.0 : 0.3}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
      {/* Color bands to suggest TFT color display */}
      {[["#ff4444", -0.03], ["#44ff44", 0], ["#4444ff", 0.03]].map(([col, zOff], i) => (
        <mesh key={i} position={[0, h + 0.009, zOff]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[screenW * 0.7, 0.018]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} transparent opacity={0.4} />
        </mesh>
      ))}
      <pointLight position={[0, h + 0.06, 0]} color="#3388ff" intensity={0.5} distance={0.4} decay={2} />
      {/* Label */}
      <Text
        position={[0, h + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.014}
        color={highlighted ? "#00e5ff" : "#fbbf24"}
        anchorX="center"
        anchorY="middle"
      >
        ILI9341 TFT
      </Text>
    </group>
  );
}

// Potentiometer / dial knob
export function Potentiometer3D({ position, rotation, highlighted, value = 0.5 }) {
  const knobAngle = (value - 0.5) * Math.PI * 1.4; // ~±126° sweep
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Knob */}
      <mesh position={[0, 0.018, 0]} rotation={[0, knobAngle, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.014, 16]} />
        <meshStandardMaterial
          color={highlighted ? "#5577aa" : "#334455"}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      {/* Indicator line */}
      <mesh position={[0, 0.026, 0.012]} rotation={[0, knobAngle, 0]}>
        <boxGeometry args={[0.003, 0.003, 0.008]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      {/* Pin legs */}
      {[-0.012, 0, 0.012].map((xOff, i) => (
        <mesh key={i} position={[xOff, -0.002, 0.024]}>
          <cylinderGeometry args={[0.002, 0.002, 0.014, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.013}
        color={highlighted ? "#00e5ff" : "#d1d5db"}
        anchorX="center"
        anchorY="middle"
      >
        POT
      </Text>
    </group>
  );
}

// MAX30102 pulse oximeter / heart rate sensor (small red PCB)
export function Max30102_3D({ position, rotation, highlighted }) {
  const beatRef = useRef(0);
  const lightRef = useRef();
  const windowRef = useRef();

  useFrame((_, delta) => {
    beatRef.current += delta * 1.8;
    // Two-beat pulse pattern: sharp peak followed by smaller diastolic bump
    const t = beatRef.current % (Math.PI * 2);
    const pulse = Math.max(0, Math.sin(t * 2.5) * Math.exp(-t * 0.8)) + Math.max(0, Math.sin(t * 2.5 - 1.2) * Math.exp(-(t - 1.2) * 1.2)) * 0.4;
    if (lightRef.current) lightRef.current.intensity = 0.3 + pulse * 1.1;
    if (windowRef.current) windowRef.current.material.emissiveIntensity = 0.4 + pulse * 0.8;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Red PCB body */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.055, 0.01, 0.085]} />
        <meshStandardMaterial color={highlighted ? "#8b0000" : "#6b0000"} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Sensor window */}
      <mesh ref={windowRef} position={[0, 0.011, 0.015]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.028, 0.018]} />
        <meshStandardMaterial color="#220000" emissive="#ff1133" emissiveIntensity={0.4} />
      </mesh>
      {/* IR LED glow — pulses with heartbeat */}
      <pointLight ref={lightRef} position={[0, 0.03, 0.015]} color="#ff1133" intensity={0.3} distance={0.18} decay={2} />
      {/* Pin row */}
      {[-0.015, -0.005, 0.005, 0.015].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.004, -0.044]}>
          <cylinderGeometry args={[0.002, 0.002, 0.018, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 0.038, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.014}
        color={highlighted ? "#00e5ff" : "#ff6677"}
        anchorX="center"
        anchorY="middle"
      >
        MAX30102
      </Text>
    </group>
  );
}

// TCS34725 color sensor (small white PCB with clear lens)
export function Tcs34725_3D({ position, rotation, highlighted }) {
  return (
    <group position={position} rotation={rotation}>
      {/* PCB */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.055, 0.01, 0.085]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Sensor lens — clear */}
      <mesh position={[0, 0.012, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.024, 0.024]} />
        <meshStandardMaterial
          color={highlighted ? "#aaddff" : "#88bbee"}
          transparent
          opacity={0.75}
          roughness={0.05}
          metalness={0.1}
          emissive={highlighted ? "#88ccff" : "#336699"}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Diffuse white LED ring */}
      <pointLight position={[0, 0.035, 0.01]} color="#ffffff" intensity={0.5} distance={0.12} decay={2} />
      {/* Pins */}
      {[-0.015, -0.005, 0.005, 0.015].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.004, -0.044]}>
          <cylinderGeometry args={[0.002, 0.002, 0.018, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 0.038, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.014}
        color={highlighted ? "#00e5ff" : "#86efac"}
        anchorX="center"
        anchorY="middle"
      >
        TCS34725
      </Text>
    </group>
  );
}

// HC-05 Bluetooth module (blue PCB with ceramic antenna)
export function Hc05_3D({ position, rotation, highlighted }) {
  const blink = useRef(0);
  const ledRef = useRef();
  useFrame((_, delta) => {
    blink.current += delta;
    // Slow blink every ~2s to simulate BT status LED
    if (ledRef.current) {
      const on = Math.sin(blink.current * Math.PI) > 0.85;
      ledRef.current.material.emissiveIntensity = on ? 1.0 : 0.1;
    }
  });

  const w = 0.038, h = 0.006, d = 0.055;
  const pcbColor = highlighted ? "#0d2b5e" : "#07193a";
  return (
    <group position={position} rotation={rotation}>
      {/* PCB */}
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={pcbColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Copper top layer */}
      <mesh position={[0, h + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - 0.003, d - 0.003]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* HC-05 RF module (silver rectangular block) */}
      <mesh position={[0, h + 0.006, 0.006]}>
        <boxGeometry args={[0.030, 0.008, 0.030]} />
        <meshStandardMaterial color="#c0c8d0" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Chip inside module (visible as darker rect) */}
      <mesh position={[0, h + 0.011, 0.006]}>
        <boxGeometry args={[0.014, 0.002, 0.014]} />
        <meshStandardMaterial color="#222" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Antenna — thin whip extending from top */}
      <mesh position={[0.016, h + 0.022, 0.006]}>
        <cylinderGeometry args={[0.001, 0.001, 0.028, 4]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Status LED (blue blink) */}
      <mesh ref={ledRef} position={[-0.014, h + 0.009, -0.018]}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.1} />
      </mesh>
      {/* Pin headers — 6 pins on one side */}
      {[-0.025, -0.015, -0.005, 0.005, 0.015, 0.025].map((z, i) => (
        <mesh key={i} position={[-w / 2 - 0.004, 0.006, z]}>
          <cylinderGeometry args={[0.002, 0.002, 0.016, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, h + 0.042, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.013}
        color={highlighted ? "#00e5ff" : "#60a5fa"}
        anchorX="center"
        anchorY="middle"
      >
        HC-05 BT
      </Text>
    </group>
  );
}

// RC522 RFID reader (blue PCB with rectangular antenna coil)
export function Rc522_3D({ position, rotation, highlighted }) {
  const w = 0.060, h = 0.005, d = 0.040;
  const pcbColor = highlighted ? "#0a2744" : "#051830";
  const coilColor = highlighted ? "#c0d8ff" : "#94a3b8";

  return (
    <group position={position} rotation={rotation}>
      {/* PCB body */}
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={pcbColor} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Copper top plane */}
      <mesh position={[0, h + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - 0.003, d - 0.003]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* MFRC522 IC chip */}
      <mesh position={[0.008, h + 0.005, 0.003]}>
        <boxGeometry args={[0.012, 0.007, 0.012]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Rectangular antenna coil — 4 thin rails forming a frame */}
      {/* Top rail */}
      <mesh position={[-0.006, h + 0.003, -0.014]}>
        <boxGeometry args={[0.040, 0.002, 0.002]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[-0.006, h + 0.003, 0.014]}>
        <boxGeometry args={[0.040, 0.002, 0.002]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Left rail */}
      <mesh position={[-0.026, h + 0.003, 0]}>
        <boxGeometry args={[0.002, 0.002, 0.028]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right rail */}
      <mesh position={[0.014, h + 0.003, 0]}>
        <boxGeometry args={[0.002, 0.002, 0.028]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Inner coil loop (second winding) */}
      <mesh position={[-0.006, h + 0.003, -0.010]}>
        <boxGeometry args={[0.031, 0.001, 0.001]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.006, h + 0.003, 0.010]}>
        <boxGeometry args={[0.031, 0.001, 0.001]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.021, h + 0.003, 0]}>
        <boxGeometry args={[0.001, 0.001, 0.020]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.009, h + 0.003, 0]}>
        <boxGeometry args={[0.001, 0.001, 0.020]} />
        <meshStandardMaterial color={coilColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Pin headers — 7 pins */}
      {[-0.018, -0.012, -0.006, 0.000, 0.006, 0.012, 0.018].map((z, i) => (
        <mesh key={i} position={[w / 2 + 0.004, 0.006, z]}>
          <cylinderGeometry args={[0.002, 0.002, 0.016, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Field glow when highlighted */}
      {highlighted && (
        <pointLight position={[-0.006, 0.03, 0]} color="#60a5fa" intensity={0.4} distance={0.25} decay={2} />
      )}

      {/* Label */}
      <Text
        position={[0, h + 0.028, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.012}
        color={highlighted ? "#00e5ff" : "#7dd3fc"}
        anchorX="center"
        anchorY="middle"
      >
        RC522 RFID
      </Text>
    </group>
  );
}

// DC Motor — cylinder body with shaft, spins when active
export function DcMotor3D({ position, rotation, highlighted, speed = 0 }) {
  const shaftRef = useRef(0);
  useFrame((_, delta) => {
    if (speed > 0.05) shaftRef.current += delta * speed * 20;
  });

  const bodyColor = highlighted ? "#374151" : "#1f2937";
  return (
    <group position={position} rotation={rotation}>
      {/* Motor body — horizontal cylinder */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.10, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* End caps */}
      {[-0.051, 0.051].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.003, 16]} />
          <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      {/* Shaft */}
      <mesh position={[0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Rotation indicator line on shaft end */}
      <mesh
        position={[0.082, 0.01 * Math.sin(shaftRef.current), 0.01 * Math.cos(shaftRef.current)]}
        rotation={[shaftRef.current, 0, Math.PI / 2]}
      >
        <boxGeometry args={[0.004, 0.001, 0.018]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      {/* Wire leads */}
      {[0.015, -0.015].map((zOff, i) => (
        <mesh key={i} position={[-0.065, -0.025, zOff]}>
          <cylinderGeometry args={[0.003, 0.003, 0.022, 6]} />
          <meshStandardMaterial color={i === 0 ? "#ef4444" : "#1f2937"} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// L298N H-bridge driver module (red PCB with heatsink)
export function L298nDriver3D({ position, rotation, highlighted }) {
  return (
    <group position={position} rotation={rotation}>
      {/* PCB base */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.13, 0.01, 0.10]} />
        <meshStandardMaterial color={highlighted ? "#7f1d1d" : "#450a0a"} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* L298N IC chip */}
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[0.04, 0.016, 0.05]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Heatsink fins */}
      {[-0.012, -0.006, 0, 0.006, 0.012].map((zOff, i) => (
        <mesh key={i} position={[0, 0.032, zOff]}>
          <boxGeometry args={[0.042, 0.02, 0.003]} />
          <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {/* Terminal block — motor outputs */}
      <mesh position={[0.055, 0.012, 0]}>
        <boxGeometry args={[0.016, 0.012, 0.07]} />
        <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Control pin headers */}
      {[-0.025, -0.015, -0.005, 0.005, 0.015, 0.025].map((zOff, i) => (
        <mesh key={i} position={[-0.060, 0.015, zOff]}>
          <cylinderGeometry args={[0.003, 0.003, 0.022, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
