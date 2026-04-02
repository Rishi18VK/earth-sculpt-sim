import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { BiomeConfig } from "@/lib/biomes";

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

// ── Animated Lighting with 3-point rig ──
export function AnimatedLights({ biome, isNight, ambientMultiplier, shadowMapSize }: { biome: BiomeConfig; isNight: boolean; ambientMultiplier: number; shadowMapSize: number }) {
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
    tRef.current += (target - tRef.current) * Math.min(delta * 1.8, 0.06);
    const t = tRef.current;

    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(biome.ambientIntensity * ambientMultiplier, biome.ambientIntensity * 0.1 * ambientMultiplier, t);
      lerpColor(dayAmbientColor, nightAmbientColor, t, ambientRef.current.color);
    }
    if (dirRef.current) {
      dirRef.current.intensity = lerp(1.5, 0.12, t);
      lerpColor(dayDirColor, nightDirColor, t, dirRef.current.color);
      dirRef.current.position.lerpVectors(dayDirPos, nightDirPos, t);
    }
    if (fillRef.current) {
      fillRef.current.intensity = lerp(0.35, 0.04, t);
    }
    if (pointRef.current) {
      pointRef.current.intensity = lerp(0.3, 0.06, t);
      lerpColor(dayPointColor, nightPointColor, t, pointRef.current.color);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={biome.ambientIntensity * ambientMultiplier} />
      <directionalLight
        ref={dirRef}
        position={[25, 35, 15]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={120}
        shadow-camera-near={0.1}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight ref={fillRef} position={[-20, 15, -15]} intensity={0.35} color="#aabbdd" />
      <pointLight ref={pointRef} position={[-25, 20, -25]} intensity={0.3} color="#88ccff" />
      <hemisphereLight args={["#b1e1ff", "#886644", 0.3]} />
    </>
  );
}

// ── Animated Fog ──
export function AnimatedFog({ biome, isNight, fogColorOverride }: { biome: BiomeConfig; isNight: boolean; fogColorOverride?: string }) {
  const fogRef = useRef<THREE.Fog>(null);
  const tRef = useRef(isNight ? 1 : 0);
  const baseFogColor = fogColorOverride || biome.fogColor;
  const dayColor = new THREE.Color(baseFogColor);
  const nightColor = new THREE.Color(darkenColor(baseFogColor, 0.15));

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 1.8, 0.06);
    const t = tRef.current;
    if (fogRef.current) {
      dayColor.set(baseFogColor);
      nightColor.set(darkenColor(baseFogColor, 0.15));
      lerpColor(dayColor, nightColor, t, fogRef.current.color);
      fogRef.current.near = lerp(biome.fogNear, biome.fogNear * 0.55, t);
      fogRef.current.far = lerp(biome.fogFar, biome.fogFar * 0.65, t);
    }
  });

  return <fog ref={fogRef} attach="fog" args={[baseFogColor, biome.fogNear, biome.fogFar]} />;
}

// ── Background ──
export function AnimatedBackground({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Color>(null);
  const tRef = useRef(isNight ? 1 : 0);
  const dayBg = new THREE.Color("#0a1628");
  const nightBg = new THREE.Color("#040810");

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 1.8, 0.06);
    if (ref.current) {
      lerpColor(dayBg, nightBg, tRef.current, ref.current);
    }
  });

  return <color ref={ref} attach="background" args={["#0a1628"]} />;
}

// ── Sky ──
export function AnimatedSky({ biome, isNight }: { biome: BiomeConfig; isNight: boolean }) {
  const ref = useRef<any>(null);
  const tRef = useRef(isNight ? 1 : 0);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 1.8, 0.06);
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
export function AnimatedStars({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const tRef = useRef(isNight ? 1 : 0);

  useFrame((_, delta) => {
    const target = isNight ? 1 : 0;
    tRef.current += (target - tRef.current) * Math.min(delta * 1.8, 0.06);
    if (ref.current && ref.current.material) {
      (ref.current.material as THREE.PointsMaterial).opacity = lerp(0.2, 1, tRef.current);
    }
  });

  return (
    <Stars ref={ref} radius={100} depth={50} count={6000} factor={5} saturation={0.7} fade speed={1} />
  );
}
