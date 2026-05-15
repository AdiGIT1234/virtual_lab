import { Text } from "@react-three/drei";

// Pin layout matching UNO_PIN_COORDS exactly
// Digital pins 0-13 at z=0.45, spacing 0.10: pin0 x=-0.75 … pin13 x=0.55
// Analog  pins 14-19 at z=-0.45, spacing 0.09: pin14 x=0.30 … pin19 x=0.75 (approx)
const DIG_PINS  = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
const ANA_PINS  = [14,15,16,17,18,19];
const PWM_PINS  = new Set([3,5,6,9,10,11]);

export default function BoardModel(props) {
  return (
    <group {...props}>

      {/* ── PCB substrate ──────────────────────────────────────────── */}
      <mesh receiveShadow castShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[1.8, 0.045, 1.2]} />
        <meshStandardMaterial color="#00686b" roughness={0.22} metalness={0.14} />
      </mesh>
      {/* Soldermask sheen on top face */}
      <mesh position={[0, 0.0385, 0]}>
        <boxGeometry args={[1.76, 0.0015, 1.16]} />
        <meshStandardMaterial color="#007a7d" roughness={0.18} metalness={0.18} transparent opacity={0.55} />
      </mesh>

      {/* ── Silk-screen labels ─────────────────────────────────────── */}
      <group position={[0, 0.0405, 0]}>
        {/* Board name */}
        <Text position={[0.18, 0, 0.20]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.082} color="#e8f4f8" fillOpacity={0.80} anchorX="center" anchorY="middle">
          ARDUINO
        </Text>
        <Text position={[0.18, 0, 0.36]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.130} color="#f0faff" fillOpacity={0.92} anchorX="center" anchorY="middle">
          UNO
        </Text>
        <Text position={[0.42, 0, 0.36]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.056} color="#b0cfd4" fillOpacity={0.65} anchorX="center" anchorY="middle">
          R3
        </Text>

        {/* Row labels */}
        <Text position={[-0.10, 0, 0.49]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.024} color="#8ab8be" fillOpacity={0.70} anchorX="center" anchorY="middle">
          DIGITAL  PWM~
        </Text>
        <Text position={[-0.25, 0, -0.49]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.024} color="#8ab8be" fillOpacity={0.70} anchorX="center" anchorY="middle">
          ANALOG IN
        </Text>
        <Text position={[0.50, 0, -0.49]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.024} color="#8ab8be" fillOpacity={0.70} anchorX="center" anchorY="middle">
          POWER
        </Text>

        {/* Digital pin numbers */}
        {DIG_PINS.map((pin) => {
          const x = -0.75 + pin * 0.10;
          const label = PWM_PINS.has(pin) ? `~${pin}` : `${pin}`;
          return (
            <Text key={pin}
              position={[x, 0, 0.475]}
              rotation={[-Math.PI/2, 0, -Math.PI/2]}
              fontSize={0.026} color="#c8e4e8" fillOpacity={0.82}
              anchorX="center" anchorY="middle">
              {label}
            </Text>
          );
        })}

        {/* Analog pin labels */}
        {ANA_PINS.map((pin, i) => {
          const x = 0.30 + i * 0.09;
          return (
            <Text key={pin}
              position={[x, 0, -0.475]}
              rotation={[-Math.PI/2, 0, Math.PI/2]}
              fontSize={0.026} color="#c8e4e8" fillOpacity={0.82}
              anchorX="center" anchorY="middle">
              {`A${i}`}
            </Text>
          );
        })}

        {/* Power pin labels */}
        {["3.3V","5V","GND","GND","VIN"].map((lbl, i) => (
          <Text key={lbl+i}
            position={[0.54 + i * 0.09, 0, -0.475]}
            rotation={[-Math.PI/2, 0, Math.PI/2]}
            fontSize={0.022} color="#c8e4e8" fillOpacity={0.70}
            anchorX="center" anchorY="middle">
            {lbl}
          </Text>
        ))}
      </group>

      {/* ── ATmega328P IC ──────────────────────────────────────────── */}
      <group position={[0.10, 0.045, -0.10]}>
        {/* IC body */}
        <mesh castShadow>
          <boxGeometry args={[0.64, 0.056, 0.64]} />
          <meshStandardMaterial color="#0e1014" roughness={0.52} metalness={0.22} />
        </mesh>
        {/* Top surface */}
        <mesh position={[0, 0.030, 0]}>
          <boxGeometry args={[0.62, 0.002, 0.62]} />
          <meshStandardMaterial color="#1a1d24" roughness={0.32} metalness={0.38} />
        </mesh>
        {/* Pin-1 dimple */}
        <mesh position={[-0.265, 0.032, -0.22]}>
          <cylinderGeometry args={[0.020, 0.020, 0.003, 12]} />
          <meshStandardMaterial color="#363a44" />
        </mesh>
        {/* Chip text */}
        <Text position={[0, 0.033, 0.05]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.040} color="#4a5060" fillOpacity={0.95} anchorX="center" anchorY="middle">
          ATMEGA328P
        </Text>
        <Text position={[0, 0.033, 0.14]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.030} color="#3c4250" fillOpacity={0.80} anchorX="center" anchorY="middle">
          ARDUINO
        </Text>
        {/* DIP-28 leads — 14 per side, 0.8mm pitch ≈ 0.04 units */}
        {Array.from({length:28}).map((_,i) => {
          const side = i < 14 ? -0.335 : 0.335;
          const z = -0.26 + (i % 14) * 0.04;
          return (
            <mesh key={i} position={[side, -0.010, z]}>
              <boxGeometry args={[0.016, 0.022, 0.012]} />
              <meshStandardMaterial color="#b0bcc8" metalness={0.92} roughness={0.08} />
            </mesh>
          );
        })}
      </group>

      {/* ── Digital pin header (top edge, z≈+0.52) ─────────────────── */}
      <group position={[-0.10, 0.065, 0.525]}>
        {/* Plastic body */}
        <mesh castShadow>
          <boxGeometry args={[1.42, 0.092, 0.082]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.88} />
        </mesh>
        {/* Gold pins */}
        {DIG_PINS.map((pin) => {
          const x = (-0.75 - (-0.10)) + pin * 0.10; // local x relative to group center
          return (
            <mesh key={pin} position={[x, 0.052, 0]}>
              <cylinderGeometry args={[0.017, 0.017, 0.016, 8]} />
              <meshStandardMaterial color="#c8a820" metalness={0.96} roughness={0.04} />
            </mesh>
          );
        })}
        {/* Extra pins: AREF, GND3, SCL, SDA — continue the row to the right */}
        {[-0.20, -0.10, 0.72, 0.82].map((dx, i) => (
          <mesh key={`extra-${i}`} position={[dx, 0.052, 0]}>
            <cylinderGeometry args={[0.017, 0.017, 0.016, 8]} />
            <meshStandardMaterial color="#c8a820" metalness={0.96} roughness={0.04} />
          </mesh>
        ))}
      </group>

      {/* ── Analog / Power header (bottom edge, z≈-0.52) ────────────── */}
      {/* Analog pins A0-A5 */}
      <group position={[-0.105, 0.065, -0.525]}>
        <mesh castShadow>
          <boxGeometry args={[0.54, 0.092, 0.082]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.88} />
        </mesh>
        {ANA_PINS.map((pin, i) => (
          <mesh key={pin} position={[-0.225 + i * 0.09, 0.052, 0]}>
            <cylinderGeometry args={[0.017, 0.017, 0.016, 8]} />
            <meshStandardMaterial color="#c8a820" metalness={0.96} roughness={0.04} />
          </mesh>
        ))}
      </group>
      {/* Power header: 3.3V 5V GND GND VIN + RST IOREF */}
      <group position={[0.575, 0.065, -0.525]}>
        <mesh castShadow>
          <boxGeometry args={[0.68, 0.092, 0.082]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.88} />
        </mesh>
        {Array.from({length:8}).map((_,i) => (
          <mesh key={i} position={[-0.315 + i * 0.09, 0.052, 0]}>
            <cylinderGeometry args={[0.017, 0.017, 0.016, 8]} />
            <meshStandardMaterial color="#c8a820" metalness={0.96} roughness={0.04} />
          </mesh>
        ))}
      </group>

      {/* ── USB-B connector ────────────────────────────────────────── */}
      <group position={[-0.82, 0.105, 0.20]}>
        <mesh castShadow>
          <boxGeometry args={[0.20, 0.20, 0.36]} />
          <meshStandardMaterial color="#b0bcc8" metalness={0.90} roughness={0.10} />
        </mesh>
        {/* Socket opening */}
        <mesh position={[0.098, -0.018, 0]}>
          <boxGeometry args={[0.012, 0.10, 0.10]} />
          <meshStandardMaterial color="#111" roughness={0.95} />
        </mesh>
        {/* Mounting tabs */}
        {[-0.14, 0.14].map((z,i) => (
          <mesh key={i} position={[0, -0.12, z]}>
            <boxGeometry args={[0.24, 0.018, 0.038]} />
            <meshStandardMaterial color="#a0acb8" metalness={0.88} roughness={0.12} />
          </mesh>
        ))}
      </group>

      {/* ── DC barrel jack ─────────────────────────────────────────── */}
      <group position={[-0.82, 0.076, -0.30]}>
        <mesh castShadow rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.30, 16]} />
          <meshStandardMaterial color="#1e1e24" roughness={0.68} metalness={0.18} />
        </mesh>
        {/* Inner metal ring */}
        <mesh position={[-0.07, 0, 0]} rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.044, 16]} />
          <meshStandardMaterial color="#555560" roughness={0.45} metalness={0.50} />
        </mesh>
      </group>

      {/* ── Crystal oscillator ─────────────────────────────────────── */}
      <mesh castShadow position={[-0.20, 0.042, -0.08]}>
        <boxGeometry args={[0.105, 0.030, 0.046]} />
        <meshStandardMaterial color="#ccd4de" metalness={0.88} roughness={0.08} />
      </mesh>

      {/* ── Voltage regulator (7805 style, TO-220) ─────────────────── */}
      <group position={[-0.56, 0.046, -0.36]}>
        <mesh castShadow>
          <boxGeometry args={[0.088, 0.058, 0.168]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.68} metalness={0.12} />
        </mesh>
        {/* Metal heatsink tab */}
        <mesh position={[-0.048, 0.006, 0]}>
          <boxGeometry args={[0.012, 0.046, 0.160]} />
          <meshStandardMaterial color="#b0bcc8" metalness={0.86} roughness={0.12} />
        </mesh>
        <Text position={[0, 0.033, 0]} rotation={[-Math.PI/2,0,0]}
          fontSize={0.026} color="#444" fillOpacity={0.85} anchorX="center" anchorY="middle">
          7805
        </Text>
      </group>

      {/* ── Reset button ───────────────────────────────────────────── */}
      <group position={[0.72, 0.054, -0.38]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.050, 0.050, 0.024, 16]} />
          <meshStandardMaterial color="#182640" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.014, 16]} />
          <meshStandardMaterial color="#3060cc" roughness={0.38} emissive="#1030a0" emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* ── Power LED (green) ──────────────────────────────────────── */}
      <mesh position={[-0.62, 0.058, 0.42]}>
        <cylinderGeometry args={[0.014, 0.014, 0.015, 10]} />
        <meshStandardMaterial color="#00ee44" emissive="#00cc33" emissiveIntensity={0.90} roughness={0.18} />
      </mesh>
      {/* TX LED */}
      <mesh position={[-0.52, 0.058, 0.42]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 10]} />
        <meshStandardMaterial color="#ff8800" emissive="#cc6600" emissiveIntensity={0.50} roughness={0.20} />
      </mesh>
      {/* RX LED */}
      <mesh position={[-0.43, 0.058, 0.42]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 10]} />
        <meshStandardMaterial color="#ff8800" emissive="#cc6600" emissiveIntensity={0.35} roughness={0.20} />
      </mesh>

      {/* ── ICSP header (2×3) ──────────────────────────────────────── */}
      <group position={[0.74, 0.065, 0.04]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.092, 0.26]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.88} />
        </mesh>
        {[[-0.048,-0.08],[0.048,-0.08],[-0.048,0],[0.048,0],[-0.048,0.08],[0.048,0.08]].map(([x,z],i) => (
          <mesh key={i} position={[x, 0.052, z]}>
            <cylinderGeometry args={[0.016, 0.016, 0.016, 8]} />
            <meshStandardMaterial color="#c8a820" metalness={0.96} roughness={0.04} />
          </mesh>
        ))}
      </group>

      {/* ── Decoupling capacitors (small cylinders) ─────────────────── */}
      {[[0.30,0],[0.42,0],[0.54,0]].map(([x,z],i) => (
        <group key={i} position={[x, 0.053, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.040, 12]} />
            <meshStandardMaterial color="#191926" roughness={0.70} metalness={0.12} />
          </mesh>
        </group>
      ))}

      {/* ── Board edge mounting holes ───────────────────────────────── */}
      {[[-0.76, -0.53],[0.76, -0.53],[-0.76, 0.53],[0.76, 0.53]].map(([x,z],i) => (
        <mesh key={i} position={[x, 0.038, z]} rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.040, 0.040, 0.030, 16]} />
          <meshStandardMaterial color="#004e50" roughness={0.40} metalness={0.15} />
        </mesh>
      ))}

      {/* ── Rubber feet ─────────────────────────────────────────────── */}
      {[[-0.78,-0.03,-0.48],[0.78,-0.03,-0.48],[-0.78,-0.03,0.48],[0.78,-0.03,0.48]].map(([fx,fy,fz],i) => (
        <mesh key={i} position={[fx,fy,fz]} castShadow>
          <cylinderGeometry args={[0.030, 0.034, 0.046, 10]} />
          <meshStandardMaterial color="#0e0e0e" roughness={0.96} />
        </mesh>
      ))}

    </group>
  );
}
