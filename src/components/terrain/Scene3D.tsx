import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, PerspectiveCamera } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import MeasurementMarkers from "./MeasurementMarkers";
import MiniMap from "./MiniMap";
import BiomeObjects from "./BiomeObjects";
import WeatherEffects from "./WeatherEffects";
import { Suspense, useMemo } from "react";
import { BiomeConfig } from "@/lib/biomes";

interface MeasurementPoint {
  position: [number, number, number];
  type: string;
  height: number;
}

interface Scene3DProps {
  onPointClick?: (info: { type: string; height: number; position: [number, number, number] }) => void;
  pointA?: MeasurementPoint | null;
  pointB?: MeasurementPoint | null;
  biome: BiomeConfig;
  seed?: number;
  isNight?: boolean;
}

function Lights({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  return (
    <>
      <ambientLight intensity={isNight ? biome.ambientIntensity * 0.15 : biome.ambientIntensity} color={isNight ? "#4466aa" : "#ffffff"} />
      <directionalLight
        position={isNight ? [-20, 20, -10] : [20, 30, 10]}
        intensity={isNight ? 0.2 : 1.2}
        color={isNight ? "#8899cc" : "#ffffff"}
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
      <pointLight position={[-20, 15, -20]} intensity={isNight ? 0.1 : 0.3} color={isNight ? "#6688bb" : "#88ccff"} />
    </>
  );
}

function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * factor);
  const ng = Math.round(g * factor);
  const nb = Math.round(b * factor);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

export default function Scene3D({ onPointClick, pointA, pointB, biome, seed = 0, isNight = false }: Scene3DProps) {
  const nightFog = useMemo(() => darkenColor(biome.fogColor, 0.15), [biome.fogColor]);

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={60} near={0.1} far={500} />
      <color attach="background" args={[isNight ? "#050a18" : "#0a1628"]} />

      <Suspense fallback={null}>
        <Lights biome={biome} isNight={isNight} />
        {!isNight && (
          <Sky
            sunPosition={biome.sunPosition}
            inclination={biome.skyInclination}
            azimuth={biome.skyAzimuth}
            turbidity={biome.skyTurbidity}
            rayleigh={biome.skyRayleigh}
          />
        )}
        <Stars
          radius={100}
          depth={50}
          count={isNight ? 8000 : 3000}
          factor={isNight ? 6 : 4}
          saturation={isNight ? 0.8 : 0.5}
          fade
          speed={1}
        />
        <fog attach="fog" args={[isNight ? nightFog : biome.fogColor, isNight ? biome.fogNear * 0.6 : biome.fogNear, isNight ? biome.fogFar * 0.7 : biome.fogFar]} />
        <TerrainMesh onPointClick={onPointClick} biome={biome} seed={seed} />
        <BiomeObjects biome={biome} seed={seed} />
        <WeatherEffects biome={biome} />
        <MeasurementMarkers pointA={pointA || null} pointB={pointB || null} />
        <MiniMap biome={biome} seed={seed} />
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
