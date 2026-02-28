import { useMemo } from "react";
import { Line, Html } from "@react-three/drei";
import * as THREE from "three";

interface MeasurementPoint {
  position: [number, number, number];
  type: string;
  height: number;
}

interface MeasurementMarkersProps {
  pointA: MeasurementPoint | null;
  pointB: MeasurementPoint | null;
}

function Marker({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <group position={position}>
      {/* Vertical pole */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Sphere on top */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Ring at base */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Label */}
      <Html position={[0, 2.2, 0]} center distanceFactor={15}>
        <div
          style={{
            background: "rgba(10, 22, 40, 0.85)",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            border: `1px solid ${color}`,
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function ElevationProfile({ pointA, pointB }: { pointA: MeasurementPoint; pointB: MeasurementPoint }) {
  const samplePoints = useMemo(() => {
    const steps = 20;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = pointA.position[0] + (pointB.position[0] - pointA.position[0]) * t;
      const y = pointA.position[1] + (pointB.position[1] - pointA.position[1]) * t;
      const z = pointA.position[2] + (pointB.position[2] - pointA.position[2]) * t;
      points.push(new THREE.Vector3(x, y + 0.1, z));
    }
    return points;
  }, [pointA, pointB]);

  return (
    <>
      {/* Main measurement line */}
      <Line
        points={samplePoints}
        color="#ff6b35"
        lineWidth={3}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />
      {/* Ground projection line */}
      <Line
        points={[
          new THREE.Vector3(pointA.position[0], 0.05, pointA.position[2]),
          new THREE.Vector3(pointB.position[0], 0.05, pointB.position[2]),
        ]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={0.3}
      />
      {/* Vertical lines from ground to points */}
      <Line
        points={[
          new THREE.Vector3(pointA.position[0], 0.05, pointA.position[2]),
          new THREE.Vector3(pointA.position[0], pointA.position[1] + 0.1, pointA.position[2]),
        ]}
        color="#22d3ee"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
      <Line
        points={[
          new THREE.Vector3(pointB.position[0], 0.05, pointB.position[2]),
          new THREE.Vector3(pointB.position[0], pointB.position[1] + 0.1, pointB.position[2]),
        ]}
        color="#f97316"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
    </>
  );
}

export default function MeasurementMarkers({ pointA, pointB }: MeasurementMarkersProps) {
  return (
    <group>
      {pointA && <Marker position={pointA.position} label={`A: ${pointA.height}m`} color="#22d3ee" />}
      {pointB && <Marker position={pointB.position} label={`B: ${pointB.height}m`} color="#f97316" />}
      {pointA && pointB && <ElevationProfile pointA={pointA} pointB={pointB} />}
    </group>
  );
}
