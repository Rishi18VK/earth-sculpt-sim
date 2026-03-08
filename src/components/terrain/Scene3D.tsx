import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, PerspectiveCamera } from "@react-three/drei";
import TerrainMesh from "./TerrainMesh";
import MeasurementMarkers from "./MeasurementMarkers";
import MiniMap from "./MiniMap";
import BiomeObjects from "./BiomeObjects";
import WeatherEffects from "./WeatherEffects";
import PlayerCharacter from "./PlayerCharacter";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  playMode?: boolean;
  onPlayerPositionUpdate?: (pos: [number, number, number]) => void;
  mobileInput?: { moveX: number; moveZ: number; cameraX: number; cameraY: number };
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

function AnimatedLights({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const tRef = useRef(isNight ? 1 : 0);

  const dayAmbientColor = new THREE.Color("#ffffff");
  const nightAmbientColor = new THREE.Color("#4466aa");
  const dayDirColor = new THREE.Color("#ffffff");
  const nightDirColor = new THREE.Color("#8899cc");
  const dayPointColor = new THREE.Color("#88ccff");
  const nightPointColor = new THREE.Color("#6688bb");
  const tmpColor = new THREE.Color();
  const dayDirPos = new THREE.Vector3(20, 30, 10);
  const nightDirPos = new THREE.Vector3(-20, 20, -10);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    const t = tRef.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(biome.ambientIntensity, biome.ambientIntensity * 0.15, t);
      lerpColor(dayAmbientColor, nightAmbientColor, t, ambientRef.current.color);
    }
    if (dirRef.current) {
      dirRef.current.intensity = lerp(1.2, 0.2, t);
      lerpColor(dayDirColor, nightDirColor, t, dirRef.current.color);
      dirRef.current.position.lerpVectors(dayDirPos, nightDirPos, t);
    }
    if (pointRef.current) {
      pointRef.current.intensity = lerp(0.3, 0.1, t);
      lerpColor(dayPointColor, nightPointColor, t, pointRef.current.color);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={biome.ambientIntensity} />
      <directionalLight
        ref={dirRef}
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
      <pointLight ref={pointRef} position={[-20, 15, -20]} intensity={0.3} color="#88ccff" />
    </>
  );
}

function AnimatedFog({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  const fogRef = useRef<THREE.Fog>(null);
  const tRef = useRef(isNight ? 1 : 0);
  const dayColor = new THREE.Color(biome.fogColor);
  const nightColor = new THREE.Color(darkenColor(biome.fogColor, 0.15));
  const tmpColor = new THREE.Color();

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    const t = tRef.current;
    if (fogRef.current) {
      dayColor.set(biome.fogColor);
      nightColor.set(darkenColor(biome.fogColor, 0.15));
      lerpColor(dayColor, nightColor, t, fogRef.current.color);
      fogRef.current.near = lerp(biome.fogNear, biome.fogNear * 0.6, t);
      fogRef.current.far = lerp(biome.fogFar, biome.fogFar * 0.7, t);
    }
  });

  return <fog ref={fogRef} attach="fog" args={[biome.fogColor, biome.fogNear, biome.fogFar]} />;
}

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

function AnimatedSky({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  const ref = useRef<any>(null);
  const tRef = useRef(isNight ? 1 : 0);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 2, 0.08);
    if (ref.current) {
      const t = tRef.current;
      // Fade sun below horizon for night
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

export default function Scene3D({ onPointClick, pointA, pointB, biome, seed = 0, isNight = false, playMode = false, onPlayerPositionUpdate, mobileInput }: Scene3DProps) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={60} near={0.1} far={500} />
      <AnimatedBackground isNight={isNight} />

      <Suspense fallback={null}>
        <AnimatedLights biome={biome} isNight={isNight} />
        <AnimatedSky biome={biome} isNight={isNight} />
        <AnimatedStars isNight={isNight} />
        <AnimatedFog biome={biome} isNight={isNight} />
        <TerrainMesh onPointClick={onPointClick} biome={biome} seed={seed} />
        <BiomeObjects biome={biome} seed={seed} />
        <WeatherEffects biome={biome} />
        <PlayerCharacter biome={biome} seed={seed} playMode={playMode} onPositionUpdate={onPlayerPositionUpdate} mobileInput={mobileInput} />
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
