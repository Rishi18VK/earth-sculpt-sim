import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, BiomeId, biomeNoise } from "@/lib/biomes";

interface CollectiblesProps {
  biome: BiomeConfig;
  seed: number;
  playerPosition: [number, number, number] | null;
  playMode: boolean;
  onCollect?: (collected: number, total: number) => void;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface CollectibleData {
  id: number;
  position: [number, number, number];
  type: "gem" | "coin" | "star";
  color: string;
  emissive: string;
}

const PICKUP_DISTANCE = 2.0;
const TERRAIN_HALF = 38;
const COLLECTIBLE_COUNT = 25;

const BIOME_ITEMS: Record<string, { types: ("gem" | "coin" | "star")[]; colors: string[]; emissives: string[] }> = {
  earth: { types: ["gem", "coin", "star"], colors: ["#22c55e", "#eab308", "#3b82f6"], emissives: ["#16a34a", "#ca8a04", "#2563eb"] },
  volcanic: { types: ["gem", "gem", "coin"], colors: ["#ef4444", "#f97316", "#fbbf24"], emissives: ["#dc2626", "#ea580c", "#d97706"] },
  desert: { types: ["coin", "coin", "star"], colors: ["#fbbf24", "#f59e0b", "#d97706"], emissives: ["#ca8a04", "#b45309", "#92400e"] },
  arctic: { types: ["gem", "star", "star"], colors: ["#67e8f9", "#a5f3fc", "#e0f2fe"], emissives: ["#06b6d4", "#22d3ee", "#7dd3fc"] },
  tropical: { types: ["star", "gem", "coin"], colors: ["#f472b6", "#a78bfa", "#34d399"], emissives: ["#ec4899", "#8b5cf6", "#10b981"] },
};

function generateCollectibles(biome: BiomeConfig, seed: number): CollectibleData[] {
  const items: CollectibleData[] = [];
  const biomeKey = biome.id as string;
  const config = BIOME_ITEMS[biomeKey] || BIOME_ITEMS.earth;

  for (let i = 0; i < COLLECTIBLE_COUNT; i++) {
    const r1 = seededRandom(seed * 1000 + i * 7.3);
    const r2 = seededRandom(seed * 2000 + i * 13.1);
    const r3 = seededRandom(seed * 3000 + i * 3.7);

    const x = (r1 - 0.5) * TERRAIN_HALF * 1.6;
    const z = (r2 - 0.5) * TERRAIN_HALF * 1.6;
    const h = biomeNoise(x, z, biome, seed);

    // Skip if underwater
    if (h < biome.waterLevel + 0.5) continue;

    const typeIdx = Math.floor(r3 * config.types.length);
    items.push({
      id: i,
      position: [x, h + 0.5, z],
      type: config.types[typeIdx],
      color: config.colors[typeIdx],
      emissive: config.emissives[typeIdx],
    });
  }
  return items;
}

function CollectibleMesh({ data, collected, onPickup }: { data: CollectibleData; collected: boolean; onPickup: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!ref.current || collected) return;
    // Spin and bob
    ref.current.rotation.y += 0.03;
    ref.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.15;
    // Glow pulse
    if (glowRef.current) {
      glowRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3 + data.id) * 0.3;
    }
  });

  if (collected) return null;

  return (
    <group ref={ref} position={data.position}>
      {/* Glow light */}
      <pointLight ref={glowRef} color={data.emissive} intensity={0.5} distance={4} />

      {data.type === "gem" && (
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={data.color} emissive={data.emissive} emissiveIntensity={0.4} roughness={0.2} metalness={0.8} />
        </mesh>
      )}

      {data.type === "coin" && (
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
          <meshStandardMaterial color={data.color} emissive={data.emissive} emissiveIntensity={0.3} roughness={0.3} metalness={0.9} />
        </mesh>
      )}

      {data.type === "star" && (
        <mesh castShadow>
          <dodecahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color={data.color} emissive={data.emissive} emissiveIntensity={0.5} roughness={0.1} metalness={0.6} />
        </mesh>
      )}

      {/* Floating ring indicator */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[0.35, 0.45, 16]} />
        <meshBasicMaterial color={data.emissive} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Collectibles({ biome, seed, playerPosition, playMode, onCollect }: CollectiblesProps) {
  const collectibles = useMemo(() => generateCollectibles(biome, seed), [biome, seed]);
  const [collectedIds, setCollectedIds] = useState<Set<number>>(new Set());
  const prevKeyRef = useRef(`${biome.id}-${seed}`);

  // Reset when biome/seed changes
  const currentKey = `${biome.id}-${seed}`;
  if (currentKey !== prevKeyRef.current) {
    prevKeyRef.current = currentKey;
    setCollectedIds(new Set());
  }

  // Check pickups each frame
  useFrame(() => {
    if (!playMode || !playerPosition) return;
    const [px, py, pz] = playerPosition;

    for (const item of collectibles) {
      if (collectedIds.has(item.id)) continue;
      const dx = px - item.position[0];
      const dy = py - item.position[1];
      const dz = pz - item.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < PICKUP_DISTANCE) {
        setCollectedIds((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          onCollect?.(next.size, collectibles.length);
          return next;
        });
      }
    }
  });

  if (!playMode) return null;

  return (
    <group>
      {collectibles.map((item) => (
        <CollectibleMesh
          key={item.id}
          data={item}
          collected={collectedIds.has(item.id)}
          onPickup={() => {}}
        />
      ))}
    </group>
  );
}
