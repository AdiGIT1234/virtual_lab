import { useMemo, useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UNO_PIN_COORDS } from "../../constants/unoPinCoords";
import { ESP32_PIN_COORDS } from "../../constants/esp32PinCoords";
import { ESP32_PIN_LAYOUT, getESP32PinColor } from "../../constants/esp32PinLayout";
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

// ── Arduino: female socket geometry (invisible click target) ─────────────────
const OUTER_R  = 0.022;
const SOCK_H   = 0.055;
const SEGS     = 14;

// ── ESP32: male header pin geometry ──────────────────────────────────────────
const PIN_BASE_H   = 0.032;   // black plastic base height
const PIN_BASE_W   = 0.050;   // black plastic base width
const PIN_POST_R   = 0.008;   // gold post radius
const PIN_POST_H   = 0.062;   // gold post above base
const PIN_SEGS     = 8;

// Pulsing ring shown at the socket opening when this pin is the wire start
function PulsingRing({ isEsp32 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + 0.3 * Math.sin(t * 5);
    ref.current.scale.set(s, s, s);
    if (ref.current.material)
      ref.current.material.opacity = 0.55 + 0.4 * Math.abs(Math.sin(t * 5));
  });
  const r = isEsp32 ? PIN_POST_R * 2.5 : OUTER_R * 1.1;
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, isEsp32 ? PIN_POST_H + 0.005 : 0, 0]}>
      <ringGeometry args={[r, r * 1.6, SEGS]} />
      <meshStandardMaterial
        color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3}
        transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false}
      />
    </mesh>
  );
}

// Arduino hollow socket — invisible geometry for click target only
function ArduinoSocket() {
  return (
    <mesh position={[0, -SOCK_H / 2, 0]}>
      <cylinderGeometry args={[OUTER_R, OUTER_R, SOCK_H, SEGS, 1, true]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// Invisible click/hover cylinder — works for both Arduino socket and ESP32 male pin
// (ESP32 pins are already in the GLB model, no extra geometry needed)
function PinHitCylinder({ isEsp32 }) {
  return (
    <mesh position={[0, isEsp32 ? (PIN_BASE_H + PIN_POST_H) / 2 : -SOCK_H / 2, 0]}>
      <cylinderGeometry args={[
        isEsp32 ? PIN_BASE_W * 0.7 : OUTER_R * 1.8,
        isEsp32 ? PIN_BASE_W * 0.7 : OUTER_R * 1.8,
        isEsp32 ? PIN_BASE_H + PIN_POST_H + 0.01 : SOCK_H * 1.4,
        SEGS
      ]} />
      <meshStandardMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// Build a quick lookup: label → ESP32 pin metadata
const ESP32_LABEL_MAP = {};
[...ESP32_PIN_LAYOUT].forEach((p) => {
  ESP32_LABEL_MAP[p.label] = p;
  if (p.gpio != null) ESP32_LABEL_MAP[String(p.gpio)] = p;
});

const formatPinLabel    = (pin) => PIN_INFO[pin]?.label ?? `Pin ${pin}`;
const formatEsp32Label  = (pinKey) => {
  const meta = ESP32_LABEL_MAP[String(pinKey)];
  return meta?.label ?? String(pinKey);
};

export default function PinHotspots({ onPinClick, wiringFrom = null, mcuId = "atmega328p" }) {
  const outputs        = useCircuitStore((s) => s.outputs);
  const inputs         = useCircuitStore((s) => s.inputs);
  const toggleInputPin = useCircuitStore((s) => s.toggleInputPin);
  const isEsp32        = mcuId === "esp32";

  const pins = useMemo(() => {
    if (isEsp32) return Object.entries(ESP32_PIN_COORDS);
    return Object.entries(UNO_PIN_COORDS);
  }, [isEsp32]);

  const [hoveredPin, setHoveredPin] = useState(null);

  return (
    <group>
      {pins.map(([pin, position]) => {
        const numPin       = isNaN(Number(pin)) ? pin : Number(pin);
        const level        = Math.max(outputs[numPin] ?? 0, inputs[numPin] ?? 0);
        const active       = level > 0.5;
        const isHovered    = hoveredPin === numPin;
        const isWiringFrom = wiringFrom === numPin;
        const label        = isEsp32 ? formatEsp32Label(pin) : formatPinLabel(numPin);

        // Per-pin colour from pin category (ESP32 only)
        const esp32Meta    = isEsp32 ? ESP32_LABEL_MAP[String(pin)] : null;
        const pinColor     = esp32Meta ? getESP32PinColor(esp32Meta) : "#c0a830";

        // For ESP32: group origin at PCB surface, pins stick up from there
        // For Arduino: keep legacy offset
        const groupY = isEsp32 ? position[1] : position[1] + 0.04;

        return (
          <group key={pin} position={[position[0], groupY, position[2]]}>

            {/* ── Invisible click / hover hit cylinder ── */}
            <mesh
              onPointerOver={(e) => { e.stopPropagation(); setHoveredPin(numPin); }}
              onPointerOut={(e)  => { e.stopPropagation(); setHoveredPin((p) => p === numPin ? null : p); }}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onPinClick === "function") onPinClick(numPin);
                else toggleInputPin(numPin, "arlab");
              }}
              position={[0, isEsp32 ? (PIN_BASE_H + PIN_POST_H) / 2 : -SOCK_H / 2, 0]}
            >
              <cylinderGeometry args={[
                isEsp32 ? PIN_BASE_W * 0.7 : OUTER_R * 1.8,
                isEsp32 ? PIN_BASE_W * 0.7 : OUTER_R * 1.8,
                isEsp32 ? PIN_BASE_H + PIN_POST_H + 0.01 : SOCK_H * 1.4,
                SEGS
              ]} />
              <meshStandardMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* ── No extra visible geometry — GLB model already has pin geometry ── */}
            {!isEsp32 && <ArduinoSocket />}

            {/* ── DEBUG: colored spheres at GLB-extracted pin positions ── */}
            {/* Blue = left row (X<0), Red = right row (X>0) */}
            {isEsp32 && (
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.016, 12, 12]} />
                <meshStandardMaterial
                  color={position[0] < 0 ? "#0066ff" : "#ff2222"}
                  emissive={position[0] < 0 ? "#0066ff" : "#ff2222"}
                  emissiveIntensity={2}
                />
              </mesh>
            )}

            {/* ── Pulsing ring when this pin is the wire start ── */}
            {isWiringFrom && <PulsingRing isEsp32={isEsp32} />}

            {/* ── Tooltip ── */}
            {(isHovered || isWiringFrom) && (
              <Html
                position={[0, isEsp32 ? PIN_BASE_H + PIN_POST_H + 0.08 : 0.10, 0]}
                center distanceFactor={10}
              >
                <div style={{
                  background: "rgba(2,10,22,0.97)",
                  border: `1px solid ${isWiringFrom ? "rgba(0,229,255,0.9)" : `${pinColor}88`}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', monospace",
                  boxShadow: `0 4px 16px ${pinColor}33`,
                  pointerEvents: "none",
                }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a8f0ff" }}>{label}</span>
                    {isEsp32 && esp32Meta && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: pinColor,
                        background: `${pinColor}22`, border: `1px solid ${pinColor}55`,
                        borderRadius: 4, padding: "1px 5px",
                      }}>
                        {esp32Meta.desc?.split(" | ")[0]?.split(" — ")[0] ?? ""}
                      </span>
                    )}
                    {!isEsp32 && PIN_INFO[numPin]?.port && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#00e5ff",
                        background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.3)",
                        borderRadius: 4, padding: "1px 5px",
                      }}>
                        {PIN_INFO[numPin].port}
                      </span>
                    )}
                    {!isEsp32 && PIN_INFO[numPin]?.fn && (
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
                    {isWiringFrom ? "click component to wire" : active ? "HIGH" : "LOW"}
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
