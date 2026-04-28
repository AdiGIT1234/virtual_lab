import { useMemo, useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { UNO_PIN_COORDS } from "../../constants/unoPinCoords";
import { useCircuitStore } from "../../state/useCircuitStore";

const formatPinLabel = (pin) => {
  const num = Number(pin);
  if (Number.isNaN(num)) return `Pin ${pin}`;
  if (num >= 14) return `A${num - 14}`;
  return `D${num}`;
};

function PulsingRing() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + 0.25 * Math.sin(t * 4);
    ref.current.scale.set(s, s, s);
    if (ref.current.material) {
      ref.current.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(t * 4));
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.032, 0.005, 10, 28]} />
      <meshStandardMaterial
        color="#00e5ff"
        emissive="#00e5ff"
        emissiveIntensity={2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

export default function PinHotspots({ onPinClick, wiringFrom = null }) {
  const outputs = useCircuitStore((state) => state.outputs);
  const inputs = useCircuitStore((state) => state.inputs);
  const toggleInputPin = useCircuitStore((state) => state.toggleInputPin);
  const pins = useMemo(() => Object.entries(UNO_PIN_COORDS), []);
  const [hoveredPin, setHoveredPin] = useState(null);

  return (
    <group>
      {pins.map(([pin, position]) => {
        const numPin = Number(pin);
        const outputLevel = outputs[numPin] ?? 0;
        const inputLevel = inputs[numPin] ?? 0;
        const level = Math.max(outputLevel, inputLevel);
        const active = level > 0.5;
        const label = formatPinLabel(numPin);

        const isHovered = hoveredPin === numPin;
        const isWiringFrom = wiringFrom === numPin;

        return (
          <group key={pin} position={[position[0], position[1] + 0.04, position[2]]}>
            {/* Invisible larger hit area so the tiny sphere is easy to hover */}
            <mesh
              onPointerOver={(e) => { e.stopPropagation(); setHoveredPin(numPin); }}
              onPointerOut={(e) => { e.stopPropagation(); setHoveredPin((prev) => (prev === numPin ? null : prev)); }}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onPinClick === "function") {
                  onPinClick(numPin);
                } else {
                  toggleInputPin(numPin, "arlab");
                }
              }}
            >
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial transparent opacity={0} />
            </mesh>

            {/* Visible pin sphere */}
            <mesh>
              <sphereGeometry args={[0.016, 16, 16]} />
              <meshStandardMaterial
                color={isWiringFrom ? "#00e5ff" : active ? "#00ffd2" : isHovered ? "#4d8fff" : "#1a3a5c"}
                emissive={isWiringFrom ? "#00e5ff" : active ? "#00ffd2" : isHovered ? "#1a4aff" : "#001830"}
                emissiveIntensity={isWiringFrom ? 1.8 : active ? 1.2 : isHovered ? 1.0 : 0.5}
                metalness={0.3}
                roughness={0.25}
              />
            </mesh>

            {/* Pulsing cyan ring when this pin is the wiring-source */}
            {isWiringFrom && <PulsingRing />}

            {/* Hover ring for extra visibility */}
            {isHovered && !isWiringFrom && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.026, 0.004, 8, 24]} />
                <meshStandardMaterial
                  color="#4d8fff"
                  emissive="#1a4aff"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            )}

            {(isHovered || isWiringFrom) && (
              <Html position={[0, 0.07, 0]} center distanceFactor={10}>
                <div
                  style={{
                    background: "rgba(2, 10, 22, 0.92)",
                    border: `1px solid ${isWiringFrom ? "rgba(0, 229, 255, 0.9)" : "rgba(0, 229, 255, 0.5)"}`,
                    padding: "5px 11px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#a8f0ff",
                    whiteSpace: "nowrap",
                    fontFamily: "'Inter', monospace",
                    boxShadow: "0 2px 12px rgba(0,229,255,0.2)",
                  }}
                >
                  {isWiringFrom ? `${label} — wire start` : `${label} — ${active ? "HIGH" : "LOW"}`}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
