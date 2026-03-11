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
import { CloudLayer, VolumetricFog, AmbientParticles, GodRays } from "./AtmosphereEffects";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color) {
  out.r = lerp(a.r, b.r, t);
  out.g = lerp(a.g, b.g, t);
  out.b = lerp(a.b, b.b, t);
  return out;
}

function darkenColor(hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Animated Lighting ──
function AnimatedLights({ biome, isNight, ambientMultiplier, shadowMapSize }: { biome: BiomeConfig; isNight: boolean; ambientMultiplier: number; shadowMapSize: number }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const tRef = useRef(isNight ? 1 : 0);

  const dayAmbientColor = new THREE.Color("#fff8f0");
  const nightAmbientColor = new THREE.Color("#2a3355");
  const dayDirColor = new THREE.Color("#fff5e6");
  const nightDirColor = new THREE.Color("#667799");
  const dayPointColor = new THREE.Color("#88ccff");
  const nightPointColor = new THREE.Color("#446688");
  const dayDirPos = new THREE.Vector3(25, 35, 15);
  const nightDirPos = new THREE.Vector3(-20, 15, -10);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    const t = tRef.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(biome.ambientIntensity * ambientMultiplier, biome.ambientIntensity * 0.12 * ambientMultiplier, t);
      lerpColor(dayAmbientColor, nightAmbientColor, t, ambientRef.current.color);
    }
    if (dirRef.current) {
      dirRef.current.intensity = lerp(1.4, 0.15, t);
      lerpColor(dayDirColor, nightDirColor, t, dirRef.current.color);
      dirRef.current.position.lerpVectors(dayDirPos, nightDirPos, t);
    }
    if (fillRef.current) {
      fillRef.current.intensity = lerp(0.3, 0.05, t);
    }
    if (pointRef.current) {
      pointRef.current.intensity = lerp(0.25, 0.08, t);
      lerpColor(dayPointColor, nightPointColor, t, pointRef.current.color);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={biome.ambientIntensity * ambientMultiplier} />
      {/* Key light */}
      <directionalLight
        ref={dirRef}
        position={[25, 35, 15]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={120}
        shadow-camera-near={0.1}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Fill light from opposite side */}
      <directionalLight
        ref={fillRef}
        position={[-20, 15, -15]}
        intensity={0.3}
        color="#aabbdd"
      />
      {/* Rim/back light */}
      <pointLight ref={pointRef} position={[-25, 20, -25]} intensity={0.25} color="#88ccff" />
      {/* Bounce light from ground */}
      <hemisphereLight args={["#b1e1ff", "#886644", 0.25]} />
    </>
  );
}

// ── Animated Fog ──
function AnimatedFog({ biome, isNight, fogColorOverride }: { biome: BiomeConfig; isNight: boolean; fogColorOverride?: string }) {
  const fogRef = useRef<THREE.Fog>(null);
  const tRef = useRef(isNight ? 1 : 0);
  const baseFogColor = fogColorOverride || biome.fogColor;
  const dayColor = new THREE.Color(baseFogColor);
  const nightColor = new THREE.Color(darkenColor(baseFogColor, 0.15));

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    const t = tRef.current;
    if (fogRef.current) {
      dayColor.set(baseFogColor);
      nightColor.set(darkenColor(baseFogColor, 0.15));
      lerpColor(dayColor, nightColor, t, fogRef.current.color);
      fogRef.current.near = lerp(biome.fogNear, biome.fogNear * 0.6, t);
      fogRef.current.far = lerp(biome.fogFar, biome.fogFar * 0.7, t);
    }
  });

  return <fog ref={fogRef} attach="fog" args={[baseFogColor, biome.fogNear, biome.fogFar]} />;
}

// ── Background ──
function AnimatedBackground({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Color>(null);
  const tRef = useRef(isNight ? 1 : 0);
  const dayBg = new THREE.Color("#0a1628");
  const nightBg = new THREE.Color("#050a18");

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    if (ref.current) {
      lerpColor(dayBg, nightBg, tRef.current, ref.current);
    }
  });

  return <color ref={ref} attach="background" args={["#0a1628"]} />;
}

// ── Sky ──
function AnimatedSky({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  const ref = useRef<any>(null);
  const tRef = useRef(isNight ? 1 : 0);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    if (ref.current) {
      const t = tRef.current;
      const sunY = lerp(biome.sunPosition[1], -50, t);
      ref.current.material.uniforms.sunPosition.value.set(biome.sunPosition[0], sunY, biome.sunPosition[2]);
    }
  });

  return (
    <Sky
      ref={ref}
      sunPosition={biome.sunPosition}
      inclination={biome.skyInclination}
      azimuth={biome.skyAzimuth}
      turbidity={biome.skyTurbidity}
      rayleigh={biome.skyRayleigh}
    />
  );
}

// ── Stars ──
function AnimatedStars({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const tRef = useRef(isNight ? 1 : 0);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    if (ref.current && ref.current.material) {
      (ref.current.material as THREE.PointsMaterial).opacity = lerp(0.3, 1, tRef.current);
    }
  });

  return (
    <Stars ref={ref} radius={100} depth={50} count={6000} factor={5} saturation={0.7} fade speed={1} />
  );
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
  const cameraFov = cameraOverrides?.fov || 60;

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={quality.dpr}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={cameraFov} near={0.1} far={500} />
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
        {quality.enableGodRays && <GodRays sunPosition={biome.sunPosition} isNight={isNight} />}

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
          autoRotateSpeed={0.3}
        />
      )}
    </Canvas>
  );
}
