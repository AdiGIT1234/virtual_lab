import { useMemo, useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UNO_PIN_COORDS } from "../../constants/unoPinCoords";
import { ESP32_PIN_COORDS } from "../../constants/esp32PinCoords";
import { useCircuitStore } from "../../state/useCircuitStore";

const PIN_INFO = {
  0:  { label: "D0",  port: "PD0", fn: "RX"   },
  1:  { label: "D1",  port: "PD1", fn: "TX"   },
  2:  { label: "D2",  port: "PD2", fn: "INT0" },
  3:  { label: "~D3", port: "PD3", fn: "INT1" },
  4:  { label: "D4",  port: "PD4", fn: ""     },
  5:  { label: "~D5", port: "PD5", fn: ""     },
  6:  { label: "~D6", port: "PD6", fn: ""     },
  7:  { label: "D7",  port: "PD7", fn: ""     },
  8:  { label: "D8",  port: "PB0", fn: ""     },
  9:  { label: "~D9", port: "PB1", fn: ""     },
  10: { label: "~D10",port: "PB2", fn: "SS"   },
  11: { label: "~D11",port: "PB3", fn: "MOSI" },
  12: { label: "D12", port: "PB4", fn: "MISO" },
  13: { label: "D13", port: "PB5", fn: "SCK"  },
  14: { label: "A0",  port: "PC0", fn: ""     },
  15: { label: "A1",  port: "PC1", fn: ""     },
  16: { label: "A2",  port: "PC2", fn: ""     },
  17: { label: "A3",  port: "PC3", fn: ""     },
  18: { label: "A4",  port: "PC4", fn: "SDA"  },
  19: { label: "A5",  port: "PC5", fn: "SCL"  },
};

// Socket geometry constants (real Arduino pin-header scale)
const OUTER_R  = 0.022;   // outer socket radius  ≈ 1.7 mm real
const INNER_R  = 0.012;   // inner hole  radius   ≈ 0.9 mm real
const SOCK_H   = 0.055;   // socket depth into header ≈ 2.1 mm real
const SEGS     = 14;      // cylinder segments (smooth enough, cheap)

// Pulsing ring shown at the socket opening when this pin is the wire start
function PulsingRing() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + 0.3 * Math.sin(t * 5);
    ref.current.scale.set(s, s, s);
    if (ref.current.material)
      ref.current.material.opacity = 0.55 + 0.4 * Math.abs(Math.sin(t * 5));
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[OUTER_R * 1.1, OUTER_R * 1.7, SEGS]} />
      <meshStandardMaterial
        color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3}
        transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false}
      />
    </mesh>
  );
}

// Hollow pin socket — fully transparent, interaction-only
function PinSocket() {
  return (
    <>
      {/* Outer tube — invisible but occupies space for the cylinder shape */}
      <mesh position={[0, -SOCK_H / 2, 0]}>
        <cylinderGeometry args={[OUTER_R, OUTER_R, SOCK_H, SEGS, 1, true]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

const formatPinLabel = (pin) => PIN_INFO[pin]?.label ?? `Pin ${pin}`;
const formatEsp32PinLabel = (pin) => String(pin);

export default function PinHotspots({ onPinClick, wiringFrom = null, mcuId = "atmega328p" }) {
  const outputs        = useCircuitStore((s) => s.outputs);
  const inputs         = useCircuitStore((s) => s.inputs);
  const toggleInputPin = useCircuitStore((s) => s.toggleInputPin);
  
  const pins = useMemo(() => {
    if (mcuId === "esp32") return Object.entries(ESP32_PIN_COORDS);
    return Object.entries(UNO_PIN_COORDS);
  }, [mcuId]);

  const [hoveredPin, setHoveredPin] = useState(null);

  return (
    <group>
      {pins.map(([pin, position]) => {
        // pin could be a string ("VIN") for ESP32, or a number string ("13") for Arduino
        const numPin      = isNaN(Number(pin)) ? pin : Number(pin);
        const level       = Math.max(outputs[numPin] ?? 0, inputs[numPin] ?? 0);
        const active      = level > 0.5;
        const isHovered   = hoveredPin === numPin;
        const isWiringFrom = wiringFrom === numPin;
        const label       = mcuId === "esp32" ? formatEsp32PinLabel(pin) : formatPinLabel(numPin);

        return (
          // Group sits at the header surface (PIN_Y + 0.04 set in unoPinCoords keeps Y=0 = hole opening)
          <group key={pin} position={[position[0], position[1] + 0.04, position[2]]}>

            {/* ── Invisible click / hover cylinder ── */}
            <mesh
              onPointerOver={(e) => { e.stopPropagation(); setHoveredPin(numPin); }}
              onPointerOut={(e)  => { e.stopPropagation(); setHoveredPin((p) => p === numPin ? null : p); }}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onPinClick === "function") onPinClick(numPin);
                else toggleInputPin(numPin, "arlab");
              }}
              position={[0, -SOCK_H / 2, 0]}
            >
              {/* slightly oversized cylinder covers the full socket for easy picking */}
              <cylinderGeometry args={[OUTER_R * 1.8, OUTER_R * 1.8, SOCK_H * 1.4, SEGS]} />
              <meshStandardMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* ── Visible hollow socket ── */}
            <PinSocket active={active} isHovered={isHovered} isWiringFrom={isWiringFrom} />

            {/* ── Pulsing ring when this pin is the wire start ── */}
            {isWiringFrom && <PulsingRing />}

            {/* ── Tooltip ── */}
            {(isHovered || isWiringFrom) && (
              <Html position={[0, 0.10, 0]} center distanceFactor={10}>
                <div style={{
                  background: "rgba(2,10,22,0.95)",
                  border: `1px solid ${isWiringFrom ? "rgba(0,229,255,0.9)" : "rgba(0,229,255,0.4)"}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', monospace",
                  boxShadow: "0 4px 16px rgba(0,229,255,0.18)",
                  pointerEvents: "none",
                }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a8f0ff" }}>{label}</span>
                    {mcuId !== "esp32" && PIN_INFO[numPin]?.port && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#00e5ff",
                        background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)",
                        borderRadius: 4, padding: "1px 5px",
                      }}>
                        {PIN_INFO[numPin].port}
                      </span>
                    )}
                    {mcuId !== "esp32" && PIN_INFO[numPin]?.fn && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "#fbbf24",
                        background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)",
                        borderRadius: 4, padding: "1px 5px",
                      }}>
                        {PIN_INFO[numPin].fn}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: isWiringFrom ? "#00e5ff" : active ? "#4ac26b" : "#6e7681" }}>
                    {isWiringFrom ? "wire start" : active ? "HIGH" : "LOW"}
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
