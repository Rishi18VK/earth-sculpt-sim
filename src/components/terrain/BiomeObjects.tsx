import { useMemo } from "react";
import * as THREE from "three";
import { BiomeConfig, BiomeId, biomeNoise } from "@/lib/biomes";
import type { ModBiomeEffectOverrides } from "@/lib/mod-types";

interface BiomeObjectsProps {
  biome: BiomeConfig;
  seed?: number;
  effectOverrides?: ModBiomeEffectOverrides | null;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.6, 1.8, 6]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.8, 1.4, 6]} />
        <meshStandardMaterial color="#3a7a28" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.5, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={1} />
      </mesh>
    </group>
  );
}

function PalmTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 2.2, 6]} />
        <meshStandardMaterial color="#8a6a3a" roughness={1} />
      </mesh>
      {[0, 1.2, 2.4, 3.6, 4.8].map((r, i) => (
        <mesh key={i} position={[Math.cos(r) * 0.4, 2.1, Math.sin(r) * 0.4]} rotation={[0.6 * Math.cos(r), r, 0.6 * Math.sin(r)]} castShadow>
          <boxGeometry args={[0.1, 0.02, 0.8]} />
          <meshStandardMaterial color="#1a8a20" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#2a9a30" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1, color = "#666" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
    </mesh>
  );
}

function Cactus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 1.2, 8]} />
        <meshStandardMaterial color="#2a6a20" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.8, 0]} rotation={[0, 0, -0.8]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#2a6a20" roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, 0.5, 0]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.4, 6]} />
        <meshStandardMaterial color="#2a6a20" roughness={0.9} />
      </mesh>
    </group>
  );
}

function IceCrystal({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#a0d8f0" roughness={0.1} metalness={0.3} transparent opacity={0.8} />
    </mesh>
  );
}

function LavaRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#cc3300" emissive="#cc3300" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

type ObjectType = "pineTree" | "palmTree" | "rock" | "cactus" | "iceCrystal" | "lavaRock";

interface PlacedObject {
  type: ObjectType;
  position: [number, number, number];
  scale: number;
  color?: string;
}

const biomeObjects: Record<BiomeId, { types: ObjectType[]; count: number; minHeight: number; maxHeight: number; rockColor?: string }> = {
  earth: { types: ["pineTree", "rock"], count: 60, minHeight: 0.3, maxHeight: 3.0, rockColor: "#7a7a6a" },
  volcanic: { types: ["lavaRock", "rock"], count: 40, minHeight: 0.5, maxHeight: 3.5, rockColor: "#3a3a3a" },
  desert: { types: ["cactus", "rock"], count: 35, minHeight: 0.0, maxHeight: 2.5, rockColor: "#9a7a5a" },
  arctic: { types: ["iceCrystal", "rock"], count: 40, minHeight: 0.2, maxHeight: 3.0, rockColor: "#8a9aaa" },
  tropical: { types: ["palmTree", "rock"], count: 50, minHeight: 0.3, maxHeight: 2.0, rockColor: "#6a8a6a" },
  dudhsagar: { types: ["palmTree", "pineTree", "rock"], count: 30, minHeight: 0.5, maxHeight: 3.5, rockColor: "#6a6050" },
};

export default function BiomeObjects({ biome, seed = 0, effectOverrides }: BiomeObjectsProps) {
  const densityMult = effectOverrides?.objectDensityMultiplier ?? 1;
  const scaleMult = effectOverrides?.objectScaleMultiplier ?? 1;

  const objects = useMemo(() => {
    const config = biomeObjects[biome.id];
    const placed: PlacedObject[] = [];
    const halfSize = 35;
    const seedOffset = seed * 50;
    const count = Math.round(config.count * densityMult);

    for (let i = 0; i < count; i++) {
      const x = seededRandom(i * 3 + 0.1 + seedOffset) * halfSize * 2 - halfSize;
      const z = seededRandom(i * 3 + 1.1 + seedOffset) * halfSize * 2 - halfSize;
      const height = biomeNoise(x, z, biome, seed);

      if (height < config.minHeight || height > config.maxHeight) continue;

      const typeIdx = Math.floor(seededRandom(i * 7 + 2.3 + seedOffset) * config.types.length);
      const type = config.types[typeIdx];
      const scale = (0.6 + seededRandom(i * 11 + 3.7 + seedOffset) * 0.8) * scaleMult;

      placed.push({
        type,
        position: [x, height, z],
        scale,
        color: config.rockColor,
      });
    }
    return placed;
  }, [biome, seed, densityMult, scaleMult]);

  const glowEnabled = effectOverrides?.glowEnabled;
  const glowColor = effectOverrides?.glowColor || "#4488ff";
  const glowIntensity = effectOverrides?.glowIntensity || 0.3;

  return (
    <group>
      {objects.map((obj, i) => {
        switch (obj.type) {
          case "pineTree": return <PineTree key={i} position={obj.position} scale={obj.scale} />;
          case "palmTree": return <PalmTree key={i} position={obj.position} scale={obj.scale} />;
          case "rock": return <Rock key={i} position={obj.position} scale={obj.scale} color={obj.color} />;
          case "cactus": return <Cactus key={i} position={obj.position} scale={obj.scale} />;
          case "iceCrystal": return <IceCrystal key={i} position={obj.position} scale={obj.scale} />;
          case "lavaRock": return <LavaRock key={i} position={obj.position} scale={obj.scale} />;
          default: return null;
        }
      })}
      {glowEnabled && (
        <pointLight position={[0, 10, 0]} color={glowColor} intensity={glowIntensity} distance={80} />
      )}
    </group>
  );
}
