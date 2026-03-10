import { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { UNO_PIN_COORDS } from "../../constants/unoPinCoords";
import { useCircuitStore } from "../../state/useCircuitStore";

const formatPinLabel = (pin) => {
  const num = Number(pin);
  if (Number.isNaN(num)) return `Pin ${pin}`;
  if (num >= 14) return `A${num - 14}`;
  return `D${num}`;
};

export default function PinHotspots() {
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

        return (
          <group key={pin} position={[position[0], position[1] + 0.04, position[2]]}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredPin(numPin);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredPin((prev) => (prev === numPin ? null : prev));
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleInputPin(numPin, "arlab");
              }}
            >
              <sphereGeometry args={[0.014, 16, 16]} />
              <meshStandardMaterial
                color={active ? "#00ffd2" : hoveredPin === numPin ? "#0a5bff" : "#0f1f2c"}
                emissive={active ? "#00ffd2" : hoveredPin === numPin ? "#003060" : "#001015"}
                emissiveIntensity={active ? 0.9 : 0.25}
                metalness={0.4}
                roughness={0.2}
              />
            </mesh>
            {hoveredPin === numPin && (
              <Html position={[0, 0.05, 0]} center distanceFactor={10}>
                <div
                  style={{
                    background: "rgba(2, 10, 20, 0.9)",
                    border: "1px solid rgba(0, 255, 213, 0.4)",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    color: "#d2f8ff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}: {active ? "HIGH" : "LOW"}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
