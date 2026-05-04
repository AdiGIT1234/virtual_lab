import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

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
    </group>
  );
}

// MAX30102 pulse oximeter / heart rate sensor (small red PCB)
export function Max30102_3D({ position, rotation, highlighted }) {
  const beatRef = useRef(0);
  useFrame((_, delta) => { beatRef.current += delta * 1.2; });

  return (
    <group position={position} rotation={rotation}>
      {/* Red PCB body */}
      <mesh castShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.055, 0.01, 0.085]} />
        <meshStandardMaterial color={highlighted ? "#8b0000" : "#6b0000"} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Sensor window */}
      <mesh position={[0, 0.011, 0.015]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.028, 0.018]} />
        <meshStandardMaterial color="#220000" emissive="#660011" emissiveIntensity={0.6} />
      </mesh>
      {/* IR LED glow */}
      <pointLight position={[0, 0.03, 0.015]} color="#ff1133" intensity={0.6} distance={0.15} decay={2} />
      {/* Pin row */}
      {[-0.015, -0.005, 0.005, 0.015].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.004, -0.044]}>
          <cylinderGeometry args={[0.002, 0.002, 0.018, 6]} />
          <meshStandardMaterial color="#c0a830" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
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
    </group>
  );
}

// HC-05 Bluetooth module (blue PCB)
export function Hc05_3D({ position, rotation, highlighted }) {
  return (
    <SensorModule3D
      position={position}
      rotation={rotation}
      label="HC-05"
      color={highlighted ? "#0d2b5e" : "#07193a"}
      borderColor="#1d4ed8"
      highlighted={highlighted}
    />
  );
}
