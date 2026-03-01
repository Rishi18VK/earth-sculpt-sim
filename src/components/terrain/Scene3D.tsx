import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, PerspectiveCamera } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import MeasurementMarkers from "./MeasurementMarkers";
import MiniMap from "./MiniMap";
import { Suspense } from "react";

interface MeasurementPoint {
  position: [number, number, number];
  type: string;
  height: number;
}

interface Scene3DProps {
  onPointClick?: (info: { type: string; height: number; position: [number, number, number] }) => void;
  pointA?: MeasurementPoint | null;
  pointB?: MeasurementPoint | null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-near={0.1}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <pointLight position={[-20, 15, -20]} intensity={0.3} color="#88ccff" />
    </>
  );
}

export default function Scene3D({ onPointClick, pointA, pointB }: Scene3DProps) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={60} near={0.1} far={500} />
      <color attach="background" args={["#0a1628"]} />

      <Suspense fallback={null}>
        <Lights />
        <Sky
          sunPosition={[100, 20, 100]}
          inclination={0.5}
          azimuth={0.25}
          turbidity={8}
          rayleigh={2}
        />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />
        <fog attach="fog" args={["#a0c4e8", 40, 100]} />
        <TerrainMesh onPointClick={onPointClick} />
        <MeasurementMarkers pointA={pointA || null} pointB={pointB || null} />
        <MiniMap />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
