import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, BiomeId } from "@/lib/biomes";
import type { ModWeatherOverrides } from "@/lib/mod-types";

interface WeatherEffectsProps {
  biome: BiomeConfig;
  modOverrides?: ModWeatherOverrides | null;
}

const DEFAULT_PARTICLE_COUNT = 1500;
const SPREAD = 50;
const HEIGHT = 30;

function getWeatherConfig(biomeId: BiomeId) {
  switch (biomeId) {
    case "arctic":
      return { color: "#e8f0ff", size: 0.15, speed: 0.8, drift: 0.4, opacity: 0.8, direction: [0.3, -1, 0.2] as [number, number, number], particleCount: DEFAULT_PARTICLE_COUNT };
    case "desert":
      return { color: "#c4a060", size: 0.1, speed: 1.5, drift: 1.2, opacity: 0.5, direction: [1.5, -0.3, 0.5] as [number, number, number], particleCount: DEFAULT_PARTICLE_COUNT };
    case "volcanic":
      return { color: "#444444", size: 0.12, speed: 0.6, drift: 0.5, opacity: 0.6, direction: [0.2, -0.8, 0.1] as [number, number, number], particleCount: DEFAULT_PARTICLE_COUNT };
    case "tropical":
      return { color: "#aaccff", size: 0.04, speed: 2.5, drift: 0.1, opacity: 0.4, direction: [0.1, -1, 0.05] as [number, number, number], particleCount: DEFAULT_PARTICLE_COUNT };
    case "dudhsagar":
      return { color: "#cceeff", size: 0.06, speed: 0.8, drift: 0.6, opacity: 0.35, direction: [0.2, -0.4, 0.1] as [number, number, number], particleCount: 2000 };
    default:
      return null;
  }
}

export default function WeatherEffects({ biome, modOverrides }: WeatherEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const biomeConfig = getWeatherConfig(biome.id);

  // If there's a weather mod, it overrides or supplements the biome weather
  const hasModWeather = !!modOverrides;

  const config = useMemo(() => {
    if (hasModWeather && modOverrides) {
      return {
        color: modOverrides.particleColor || "#ffffff",
        size: modOverrides.particleSize || 0.1,
        speed: modOverrides.speed || 1.0,
        drift: modOverrides.drift || 0.3,
        opacity: modOverrides.opacity || 0.6,
        direction: modOverrides.direction || [0, -1, 0] as [number, number, number],
        particleCount: modOverrides.particleCount || DEFAULT_PARTICLE_COUNT,
      };
    }
    return biomeConfig;
  }, [hasModWeather, modOverrides, biomeConfig]);

  const particleCount = config?.particleCount || DEFAULT_PARTICLE_COUNT;
  const spread = modOverrides?.spread || SPREAD;

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = Math.random() * HEIGHT;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [biome.id, particleCount, spread, modOverrides?.modName]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !config) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const dt = Math.min(delta, 0.05);
    const count = Math.min(particleCount, arr.length / 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += config.direction[0] * config.speed * dt + (Math.random() - 0.5) * config.drift * dt;
      arr[i3 + 1] += config.direction[1] * config.speed * dt;
      arr[i3 + 2] += config.direction[2] * config.speed * dt + (Math.random() - 0.5) * config.drift * dt;

      if (arr[i3 + 1] < -1 || arr[i3 + 1] > HEIGHT + 5 || Math.abs(arr[i3]) > spread / 2 || Math.abs(arr[i3 + 2]) > spread / 2) {
        arr[i3] = (Math.random() - 0.5) * spread;
        arr[i3 + 1] = config.direction[1] < 0 ? HEIGHT * (0.5 + Math.random() * 0.5) : Math.random() * 2;
        arr[i3 + 2] = (Math.random() - 0.5) * spread;
      }
    }
    pos.needsUpdate = true;
  });

  if (!config) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={config.color}
        size={config.size}
        transparent
        opacity={config.opacity}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
