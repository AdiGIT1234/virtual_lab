import React from "react";

const Segment = ({ pos, rot, active, color, segmentLength, segmentWidth }) => (
  <mesh position={pos} rotation={rot}>
    <boxGeometry args={[segmentLength, segmentWidth, 0.005]} />
    <meshStandardMaterial
      color={active ? color : "#222"}
      emissive={active ? color : "#000"}
      emissiveIntensity={active ? 1.5 : 0}
      roughness={0.2}
    />
  </mesh>
);

export default function SevenSegment3D({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  a, b, c, d, e, f, g, dp, 
  color = "#ff3333", 
  highlighted = false 
}) {
  const segmentWidth = 0.008;
  const segmentLength = 0.04;

  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.15, 0.02]} />
        <meshStandardMaterial color={highlighted ? "#333" : "#111"} roughness={0.8} />
      </mesh>

      {/* Segments */}
      <Segment pos={[0, 0.06, 0.011]} rot={[0, 0, 0]} active={a} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[0.045, 0.03, 0.011]} rot={[0, 0, Math.PI / 2]} active={b} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[0.045, -0.03, 0.011]} rot={[0, 0, Math.PI / 2]} active={c} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[0, -0.06, 0.011]} rot={[0, 0, 0]} active={d} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[-0.045, -0.03, 0.011]} rot={[0, 0, Math.PI / 2]} active={e} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[-0.045, 0.03, 0.011]} rot={[0, 0, Math.PI / 2]} active={f} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 
      <Segment pos={[0, 0, 0.011]} rot={[0, 0, 0]} active={g} color={color} segmentLength={segmentLength} segmentWidth={segmentWidth} /> 

      {/* DP */}
      <mesh position={[0.04, -0.065, 0.011]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial
          color={dp ? color : "#222"}
          emissive={dp ? color : "#000"}
          emissiveIntensity={dp ? 1.5 : 0}
        />
      </mesh>

      {/* Legs */}
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[(i % 5) * 0.02 - 0.04, i < 5 ? -0.08 : 0.08, -0.03]}>
          <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
          <meshStandardMaterial color="#bbb" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {highlighted && (
        <mesh>
          <boxGeometry args={[0.12, 0.17, 0.04]} />
          <meshBasicMaterial color="#00ffd5" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
