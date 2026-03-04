import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, BiomeId } from "@/lib/biomes";

interface WeatherEffectsProps {
  biome: BiomeConfig;
}

const PARTICLE_COUNT = 1500;
const SPREAD = 50;
const HEIGHT = 30;

function getWeatherConfig(biomeId: BiomeId) {
  switch (biomeId) {
    case "arctic":
      return { color: "#e8f0ff", size: 0.15, speed: 0.8, drift: 0.4, opacity: 0.8, direction: [0.3, -1, 0.2] as [number, number, number] };
    case "desert":
      return { color: "#c4a060", size: 0.1, speed: 1.5, drift: 1.2, opacity: 0.5, direction: [1.5, -0.3, 0.5] as [number, number, number] };
    case "volcanic":
      return { color: "#444444", size: 0.12, speed: 0.6, drift: 0.5, opacity: 0.6, direction: [0.2, -0.8, 0.1] as [number, number, number] };
    case "tropical":
      return { color: "#aaccff", size: 0.04, speed: 2.5, drift: 0.1, opacity: 0.4, direction: [0.1, -1, 0.05] as [number, number, number] };
    default:
      return null;
  }
}

export default function WeatherEffects({ biome }: WeatherEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const config = getWeatherConfig(biome.id);

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * SPREAD;
      arr[i * 3 + 1] = Math.random() * HEIGHT;
      arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    }
    return arr;
  }, [biome.id]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !config) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      arr[i3] += config.direction[0] * config.speed * dt + (Math.random() - 0.5) * config.drift * dt;
      arr[i3 + 1] += config.direction[1] * config.speed * dt;
      arr[i3 + 2] += config.direction[2] * config.speed * dt + (Math.random() - 0.5) * config.drift * dt;

      // Reset particle when it falls below ground or drifts too far
      if (arr[i3 + 1] < -1 || Math.abs(arr[i3]) > SPREAD / 2 || Math.abs(arr[i3 + 2]) > SPREAD / 2) {
        arr[i3] = (Math.random() - 0.5) * SPREAD;
        arr[i3 + 1] = HEIGHT * (0.5 + Math.random() * 0.5);
        arr[i3 + 2] = (Math.random() - 0.5) * SPREAD;
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
          count={PARTICLE_COUNT}
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
