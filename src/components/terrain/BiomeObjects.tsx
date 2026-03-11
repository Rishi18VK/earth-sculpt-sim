import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, BiomeId, biomeNoise } from "@/lib/biomes";
import type { ModBiomeEffectOverrides } from "@/lib/mod-types";
import { getQualitySettings } from "@/lib/terrain-quality";

interface BiomeObjectsProps {
  biome: BiomeConfig;
  seed?: number;
  effectOverrides?: ModBiomeEffectOverrides | null;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Wind-animated tree wrapper ──
function WindSway({ children, seed, intensity = 1 }: { children: React.ReactNode; seed: number; intensity?: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => seededRandom(seed * 31) * Math.PI * 2, [seed]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.8 + phase) * 0.03 * intensity;
    ref.current.rotation.x = Math.sin(t * 0.6 + phase + 1) * 0.02 * intensity;
  });

  return <group ref={ref}>{children}</group>;
}

function RealisticPineTree({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const trunkColor = `hsl(30, ${35 + seededRandom(seed) * 15}%, ${18 + seededRandom(seed + 1) * 8}%)`;
  const foliageHue = 120 + seededRandom(seed + 2) * 30;
  
  return (
    <WindSway seed={seed} intensity={0.8}>
      <group position={position} scale={scale}>
        {/* Trunk with bark texture variation */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.16, 0.9, 6]} />
          <meshStandardMaterial color={trunkColor} roughness={0.95} metalness={0} />
        </mesh>
        {/* Multiple foliage layers for depth */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.9, 1.5, 7]} />
          <meshStandardMaterial color={`hsl(${foliageHue}, 55%, 22%)`} roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <coneGeometry args={[0.7, 1.3, 7]} />
          <meshStandardMaterial color={`hsl(${foliageHue}, 60%, 26%)`} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <coneGeometry args={[0.45, 1.0, 6]} />
          <meshStandardMaterial color={`hsl(${foliageHue}, 50%, 30%)`} roughness={0.88} />
        </mesh>
      </group>
    </WindSway>
  );
}

function RealisticPalmTree({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const curve = seededRandom(seed) * 0.3;
  
  return (
    <WindSway seed={seed} intensity={1.5}>
      <group position={position} scale={scale}>
        {/* Curved trunk */}
        <mesh position={[curve * 0.5, 1.2, 0]} rotation={[0, 0, curve * 0.2]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 2.5, 6]} />
          <meshStandardMaterial color={`hsl(30, 40%, ${20 + seededRandom(seed + 1) * 10}%)`} roughness={0.95} />
        </mesh>
        {/* Trunk rings */}
        {[0.5, 1.0, 1.5, 2.0].map((y, i) => (
          <mesh key={i} position={[curve * y / 2.5, y, 0]} rotation={[0, 0, curve * y * 0.08]}>
            <torusGeometry args={[0.09 - y * 0.01, 0.015, 4, 8]} />
            <meshStandardMaterial color="hsl(30, 35%, 25%)" roughness={1} />
          </mesh>
        ))}
        {/* Fronds with wind sway */}
        {[0, 0.9, 1.8, 2.7, 3.6, 4.5].map((r, i) => (
          <mesh
            key={i}
            position={[Math.cos(r) * 0.3 + curve, 2.5, Math.sin(r) * 0.3]}
            rotation={[0.5 * Math.cos(r), r, 0.5 * Math.sin(r)]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.015, 0.9]} />
            <meshStandardMaterial color={`hsl(${115 + i * 5}, ${55 + i * 3}%, ${28 + i * 2}%)`} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[curve, 2.55, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color="hsl(120, 50%, 32%)" roughness={0.8} />
        </mesh>
      </group>
    </WindSway>
  );
}

function RealisticRock({ position, scale = 1, color = "#666", seed = 0 }: { position: [number, number, number]; scale?: number; color?: string; seed?: number }) {
  const variation = seededRandom(seed) * 0.15;
  
  return (
    <group position={position}>
      <mesh scale={[scale * (1 + variation), scale * (0.7 + variation * 0.5), scale * (1 - variation * 0.3)]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color={color} roughness={0.95} metalness={0.02} />
      </mesh>
      {/* Moss on top */}
      {seededRandom(seed + 5) > 0.5 && (
        <mesh position={[0, scale * 0.3, 0]} scale={[scale * 0.6, scale * 0.1, scale * 0.6]}>
          <sphereGeometry args={[0.4, 5, 4]} />
          <meshStandardMaterial color="hsl(110, 40%, 25%)" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function Cactus({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  return (
    <WindSway seed={seed} intensity={0.2}>
      <group position={position} scale={scale}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 1.2, 8]} />
          <meshStandardMaterial color="hsl(120, 55%, 25%)" roughness={0.85} />
        </mesh>
        <mesh position={[0.2, 0.8, 0]} rotation={[0, 0, -0.8]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
          <meshStandardMaterial color="hsl(118, 50%, 27%)" roughness={0.85} />
        </mesh>
        <mesh position={[-0.15, 0.5, 0]} rotation={[0, 0, 0.9]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.4, 6]} />
          <meshStandardMaterial color="hsl(122, 52%, 23%)" roughness={0.85} />
        </mesh>
      </group>
    </WindSway>
  );
}

function IceCrystal({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <octahedronGeometry args={[0.4, 0]} />
      <meshPhysicalMaterial
        color="#a0d8f0"
        roughness={0.05}
        metalness={0.1}
        transparent
        opacity={0.75}
        transmission={0.4}
        thickness={1}
        clearcoat={1}
      />
    </mesh>
  );
}

function LavaRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.1, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#cc3300" emissive="#cc3300" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Grass Patches ──
function GrassPatches({ biome, seed }: { biome: BiomeConfig; seed: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const ref = useRef<THREE.Group>(null);

  const patches = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotation: number }[] = [];
    const count = quality.grassPatchCount;
    for (let i = 0; i < count; i++) {
      const x = seededRandom(i * 5 + 0.3 + seed * 50) * 60 - 30;
      const z = seededRandom(i * 5 + 1.7 + seed * 50) * 60 - 30;
      const h = biomeNoise(x, z, biome, seed);
      // Only on moderate heights (grasslands)
      if (h < 0.2 || h > 2.5) continue;
      items.push({
        pos: [x, h, z],
        scale: 0.3 + seededRandom(i * 13 + seed * 50) * 0.4,
        rotation: seededRandom(i * 17 + seed * 50) * Math.PI * 2,
      });
    }
    return items;
  }, [biome, seed, quality.grassPatchCount]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 1.5 + i * 0.7) * 0.08;
    });
  });

  if (patches.length === 0) return null;

  return (
    <group ref={ref}>
      {patches.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rotation, 0]} scale={p.scale}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial
            color={`hsl(${100 + seededRandom(i) * 30}, ${40 + seededRandom(i + 1) * 20}%, ${25 + seededRandom(i + 2) * 15}%)`}
            roughness={0.9}
            side={THREE.DoubleSide}
            alphaTest={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

type ObjectType = "pineTree" | "palmTree" | "rock" | "cactus" | "iceCrystal" | "lavaRock";

interface PlacedObject {
  type: ObjectType;
  position: [number, number, number];
  scale: number;
  color?: string;
  seed: number;
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
  const quality = useMemo(() => getQualitySettings(), []);

  const objects = useMemo(() => {
    const config = biomeObjects[biome.id];
    const placed: PlacedObject[] = [];
    const halfSize = 35;
    const seedOffset = seed * 50;
    const qualityMult = quality.vegetationCount / 60;
    const count = Math.round(config.count * densityMult * qualityMult);

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
        seed: i + seedOffset,
      });
    }
    return placed;
  }, [biome, seed, densityMult, scaleMult, quality.vegetationCount]);

  const glowEnabled = effectOverrides?.glowEnabled;
  const glowColor = effectOverrides?.glowColor || "#4488ff";
  const glowIntensity = effectOverrides?.glowIntensity || 0.3;

  return (
    <group>
      {objects.map((obj, i) => {
        switch (obj.type) {
          case "pineTree": return <RealisticPineTree key={i} position={obj.position} scale={obj.scale} seed={obj.seed} />;
          case "palmTree": return <RealisticPalmTree key={i} position={obj.position} scale={obj.scale} seed={obj.seed} />;
          case "rock": return <RealisticRock key={i} position={obj.position} scale={obj.scale} color={obj.color} seed={obj.seed} />;
          case "cactus": return <Cactus key={i} position={obj.position} scale={obj.scale} seed={obj.seed} />;
          case "iceCrystal": return <IceCrystal key={i} position={obj.position} scale={obj.scale} />;
          case "lavaRock": return <LavaRock key={i} position={obj.position} scale={obj.scale} />;
          default: return null;
        }
      })}
      <GrassPatches biome={biome} seed={seed} />
      {glowEnabled && (
        <pointLight position={[0, 10, 0]} color={glowColor} intensity={glowIntensity} distance={80} />
      )}
    </group>
  );
}
