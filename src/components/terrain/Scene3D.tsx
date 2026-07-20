import { useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, PerspectiveCamera, Environment } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import RealisticWater from "./RealisticWater";
import MeasurementMarkers from "./MeasurementMarkers";
import MiniMap from "./MiniMap";
import BiomeObjects from "./BiomeObjects";
import WeatherEffects from "./WeatherEffects";
import PlayerCharacter from "./PlayerCharacter";
import Collectibles from "./Collectibles";
import DudhsagarEnvironment from "./DudhsagarEnvironment";
import { CloudLayer, VolumetricFog, AmbientParticles, GodRays, WaterMist, CanopyRays } from "./AtmosphereEffects";
import { AnimatedLights, AnimatedFog, AnimatedBackground, AnimatedSky, AnimatedStars } from "./SceneLighting";
import { Suspense } from "react";
import * as THREE from "three";
import { BiomeConfig } from "@/lib/biomes";
import { getQualitySettings } from "@/lib/terrain-quality";
import type { ModPlayerOverrides, ModWeatherOverrides, ModTerrainColorOverrides, ModBiomeEffectOverrides, ModCameraOverrides } from "@/lib/mod-types";

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
  playMode?: boolean;
  onPlayerPositionUpdate?: (pos: [number, number, number]) => void;
  onCollect?: (collected: number, total: number) => void;
  mobileInput?: { moveX: number; moveZ: number; cameraX: number; cameraY: number };
  modOverrides?: ModPlayerOverrides | null;
  weatherOverrides?: ModWeatherOverrides | null;
  terrainColorOverrides?: ModTerrainColorOverrides | null;
  biomeEffectOverrides?: ModBiomeEffectOverrides | null;
  cameraOverrides?: ModCameraOverrides | null;
}

export default function Scene3D({
  onPointClick, pointA, pointB, biome, seed = 0, isNight = false, playMode = false,
  onPlayerPositionUpdate, onCollect, mobileInput, modOverrides,
  weatherOverrides, terrainColorOverrides, biomeEffectOverrides, cameraOverrides,
}: Scene3DProps) {
  const [playerPos, setPlayerPos] = useState<[number, number, number] | null>(null);
  const quality = useMemo(() => getQualitySettings(), []);

  const handlePlayerPosition = useCallback((pos: [number, number, number]) => {
    setPlayerPos(pos);
    onPlayerPositionUpdate?.(pos);
  }, [onPlayerPositionUpdate]);

  const ambientMultiplier = biomeEffectOverrides?.ambientIntensityMultiplier ?? 1;
  const fogColorOverride = terrainColorOverrides?.fogColor;
  const cameraFov = cameraOverrides?.fov || 55;

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        preserveDrawingBuffer: true,
      }}
      dpr={quality.dpr}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={cameraFov} near={0.1} far={quality.maxDrawDistance * 5} />
      <AnimatedBackground isNight={isNight} />

      <Suspense fallback={null}>
        <AnimatedLights biome={biome} isNight={isNight} ambientMultiplier={ambientMultiplier} shadowMapSize={quality.shadowMapSize} />
        <AnimatedSky biome={biome} isNight={isNight} />
        <AnimatedStars isNight={isNight} />
        <AnimatedFog biome={biome} isNight={isNight} fogColorOverride={fogColorOverride} />

        {/* Atmosphere */}
        <CloudLayer isNight={isNight} />
        <VolumetricFog biome={biome} isNight={isNight} />
        <AmbientParticles isNight={isNight} />
        <WaterMist waterLevel={biome.waterLevel} />
        {quality.enableGodRays && <GodRays sunPosition={biome.sunPosition} isNight={isNight} />}
        {quality.enableCanopyRays && <CanopyRays isNight={isNight} />}

        {/* Terrain */}
        <TerrainMesh onPointClick={onPointClick} biome={biome} seed={seed} colorOverrides={terrainColorOverrides} />
        <RealisticWater biome={biome} colorOverrides={terrainColorOverrides} />

        {/* Objects */}
        <BiomeObjects biome={biome} seed={seed} effectOverrides={biomeEffectOverrides} />
        <WeatherEffects biome={biome} modOverrides={weatherOverrides} />

        {biome.id === "dudhsagar" && (
          <DudhsagarEnvironment biome={biome} seed={seed} playerPosition={playerPos} />
        )}

        <PlayerCharacter biome={biome} seed={seed} playMode={playMode} onPositionUpdate={handlePlayerPosition} mobileInput={mobileInput} modOverrides={modOverrides} cameraOverrides={cameraOverrides} />
        <Collectibles biome={biome} seed={seed} playerPosition={playerPos} playMode={playMode} onCollect={onCollect} />
        <MeasurementMarkers pointA={pointA || null} pointB={pointB || null} />
        <MiniMap biome={biome} seed={seed} playerPosition={playMode ? playerPos : null} />

        {/* HDR environment for reflections */}
        <Environment preset={isNight ? "night" : "sunset"} background={false} />
      </Suspense>

      {!playMode && (
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.25}
          enableDamping
          dampingFactor={0.08}
        />
      )}
    </Canvas>
  );
}
