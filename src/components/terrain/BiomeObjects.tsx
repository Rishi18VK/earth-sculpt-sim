import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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

// ── Wind-animated wrapper with multi-axis turbulence ──
function WindSway({ children, seed, intensity = 1 }: { children: React.ReactNode; seed: number; intensity?: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => seededRandom(seed * 31) * Math.PI * 2, [seed]);
  const freq = useMemo(() => 0.6 + seededRandom(seed * 47) * 0.4, [seed]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Primary wind
    ref.current.rotation.z = Math.sin(t * freq + phase) * 0.025 * intensity;
    // Secondary gust
    ref.current.rotation.x = Math.sin(t * freq * 0.7 + phase + 1.3) * 0.018 * intensity;
    // Micro-turbulence
    ref.current.rotation.z += Math.sin(t * 2.5 + phase * 3) * 0.005 * intensity;
  });

  return <group ref={ref}>{children}</group>;
}

// ── LOD wrapper: hides object beyond distance ──
function LODObject({ position, lodDistances, children, fallback }: {
  position: [number, number, number];
  lodDistances: [number, number, number];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    const dist = camera.position.distanceTo(new THREE.Vector3(...position));
    // Show full detail within mid distance, hide beyond far
    ref.current.visible = dist < lodDistances[2];
    // Scale simplification: could swap children but just hide for perf
    if (dist > lodDistances[1]) {
      ref.current.scale.setScalar(0.7);
    } else {
      ref.current.scale.setScalar(1);
    }
  });

  return <group ref={ref} position={position}>{children}</group>;
}

// ── Realistic Pine Tree with detailed layers ──
function RealisticPineTree({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const segments = quality.treeDetail;
  const trunkHue = 25 + seededRandom(seed) * 10;
  const trunkLit = 16 + seededRandom(seed + 1) * 6;
  const foliageHue = 115 + seededRandom(seed + 2) * 25;

  return (
    <WindSway seed={seed} intensity={0.7}>
      <group scale={scale}>
        {/* Trunk */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.15, 0.95, segments]} />
          <meshStandardMaterial color={`hsl(${trunkHue}, 38%, ${trunkLit}%)`} roughness={0.95} metalness={0} />
        </mesh>
        {/* Foliage tiers */}
        {[
          { y: 0.65, r: 0.85, h: 1.4 },
          { y: 1.25, r: 0.65, h: 1.2 },
          { y: 1.75, r: 0.42, h: 0.95 },
          { y: 2.1, r: 0.22, h: 0.55 },
        ].map((tier, i) => (
          <mesh key={i} position={[0, tier.y, 0]} castShadow>
            <coneGeometry args={[tier.r, tier.h, segments]} />
            <meshStandardMaterial
              color={`hsl(${foliageHue + i * 3}, ${52 + i * 3}%, ${20 + i * 3}%)`}
              roughness={0.9}
            />
          </mesh>
        ))}
      </group>
    </WindSway>
  );
}

// ── Deciduous / Broadleaf Tree ──
function BroadleafTree({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const segments = quality.treeDetail;
  const foliageHue = 100 + seededRandom(seed + 3) * 40;

  return (
    <WindSway seed={seed} intensity={1.0}>
      <group scale={scale}>
        {/* Trunk */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 1.1, segments]} />
          <meshStandardMaterial color={`hsl(28, 35%, ${15 + seededRandom(seed) * 5}%)`} roughness={0.95} />
        </mesh>
        {/* Canopy spheres */}
        {[
          [0, 1.4, 0, 0.6],
          [0.25, 1.2, 0.15, 0.4],
          [-0.2, 1.3, -0.1, 0.45],
          [0.1, 1.6, -0.15, 0.35],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
            <sphereGeometry args={[r as number, segments, segments - 1]} />
            <meshStandardMaterial
              color={`hsl(${foliageHue + i * 5}, ${50 + i * 4}%, ${24 + i * 2}%)`}
              roughness={0.88}
            />
          </mesh>
        ))}
      </group>
    </WindSway>
  );
}

// ── Bush ──
function Bush({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const hue = 110 + seededRandom(seed) * 30;
  return (
    <WindSway seed={seed} intensity={0.4}>
      <group scale={scale}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.35, 6, 5]} />
          <meshStandardMaterial color={`hsl(${hue}, 45%, 22%)`} roughness={0.92} />
        </mesh>
        <mesh position={[0.15, 0.15, 0.1]} castShadow>
          <sphereGeometry args={[0.25, 5, 4]} />
          <meshStandardMaterial color={`hsl(${hue + 5}, 50%, 25%)`} roughness={0.9} />
        </mesh>
      </group>
    </WindSway>
  );
}

function RealisticPalmTree({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const segments = quality.treeDetail;
  const curve = seededRandom(seed) * 0.3;

  return (
    <WindSway seed={seed} intensity={1.3}>
      <group scale={scale}>
        <mesh position={[curve * 0.5, 1.2, 0]} rotation={[0, 0, curve * 0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.11, 2.5, segments]} />
          <meshStandardMaterial color={`hsl(30, 40%, ${18 + seededRandom(seed + 1) * 8}%)`} roughness={0.95} />
        </mesh>
        {/* Trunk rings */}
        {[0.5, 1.0, 1.5, 2.0].map((y, i) => (
          <mesh key={i} position={[curve * y / 2.5, y, 0]} rotation={[0, 0, curve * y * 0.08]}>
            <torusGeometry args={[0.08 - y * 0.008, 0.012, 4, 8]} />
            <meshStandardMaterial color="hsl(30, 35%, 22%)" roughness={1} />
          </mesh>
        ))}
        {/* Fronds */}
        {[0, 0.9, 1.8, 2.7, 3.6, 4.5].map((r, i) => (
          <mesh key={`f${i}`} position={[Math.cos(r) * 0.3 + curve, 2.5, Math.sin(r) * 0.3]} rotation={[0.5 * Math.cos(r), r, 0.5 * Math.sin(r)]} castShadow>
            <boxGeometry args={[0.1, 0.012, 0.85]} />
            <meshStandardMaterial color={`hsl(${112 + i * 5}, ${55 + i * 3}%, ${26 + i * 2}%)`} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[curve, 2.55, 0]}>
          <sphereGeometry args={[0.1, 5, 5]} />
          <meshStandardMaterial color="hsl(120, 50%, 30%)" roughness={0.8} />
        </mesh>
      </group>
    </WindSway>
  );
}

function RealisticRock({ position, scale = 1, color = "#666", seed = 0 }: { position: [number, number, number]; scale?: number; color?: string; seed?: number }) {
  const variation = seededRandom(seed) * 0.15;
  return (
    <group position={position}>
      <mesh scale={[scale * (1 + variation), scale * (0.65 + variation * 0.5), scale * (1 - variation * 0.3)]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color={color} roughness={0.95} metalness={0.02} />
      </mesh>
      {seededRandom(seed + 5) > 0.5 && (
        <mesh position={[0, scale * 0.28, 0]} scale={[scale * 0.55, scale * 0.08, scale * 0.55]}>
          <sphereGeometry args={[0.4, 5, 4]} />
          <meshStandardMaterial color="hsl(110, 40%, 22%)" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function Cactus({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  return (
    <WindSway seed={seed} intensity={0.15}>
      <group scale={scale}>
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
      <meshPhysicalMaterial color="#a0d8f0" roughness={0.05} metalness={0.1} transparent opacity={0.75} transmission={0.4} thickness={1} clearcoat={1} />
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

// ── Animated Grass Patches ──
function GrassPatches({ biome, seed }: { biome: BiomeConfig; seed: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const ref = useRef<THREE.Group>(null);

  const patches = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotation: number; hue: number }[] = [];
    const count = quality.grassPatchCount;
    for (let i = 0; i < count; i++) {
      const x = seededRandom(i * 5 + 0.3 + seed * 50) * 60 - 30;
      const z = seededRandom(i * 5 + 1.7 + seed * 50) * 60 - 30;
      const h = biomeNoise(x, z, biome, seed);
      if (h < 0.2 || h > 2.5) continue;
      items.push({
        pos: [x, h, z],
        scale: 0.25 + seededRandom(i * 13 + seed * 50) * 0.4,
        rotation: seededRandom(i * 17 + seed * 50) * Math.PI * 2,
        hue: 95 + seededRandom(i * 19 + seed * 50) * 35,
      });
    }
    return items;
  }, [biome, seed, quality.grassPatchCount]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      // Wind wave through grass
      child.rotation.z = Math.sin(t * 1.8 + i * 0.5 + child.position.x * 0.1) * 0.1;
      child.rotation.x = Math.sin(t * 1.2 + i * 0.3) * 0.04;
    });
  });

  if (patches.length === 0) return null;

  return (
    <group ref={ref}>
      {patches.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rotation, 0]} scale={p.scale}>
          <planeGeometry args={[0.25, 0.45]} />
          <meshStandardMaterial
            color={`hsl(${p.hue}, ${42 + seededRandom(i + 1) * 18}%, ${22 + seededRandom(i + 2) * 12}%)`}
            roughness={0.9}
            side={THREE.DoubleSide}
            alphaTest={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

type ObjectType = "pineTree" | "broadleafTree" | "palmTree" | "rock" | "cactus" | "iceCrystal" | "lavaRock" | "bush";

interface PlacedObject {
  type: ObjectType;
  position: [number, number, number];
  scale: number;
  color?: string;
  seed: number;
}

const biomeObjects: Record<BiomeId, { types: ObjectType[]; count: number; minHeight: number; maxHeight: number; rockColor?: string }> = {
  earth: { types: ["pineTree", "broadleafTree", "bush", "rock"], count: 65, minHeight: 0.3, maxHeight: 3.0, rockColor: "#7a7a6a" },
  volcanic: { types: ["lavaRock", "rock"], count: 40, minHeight: 0.5, maxHeight: 3.5, rockColor: "#3a3a3a" },
  desert: { types: ["cactus", "rock"], count: 35, minHeight: 0.0, maxHeight: 2.5, rockColor: "#9a7a5a" },
  arctic: { types: ["iceCrystal", "rock"], count: 40, minHeight: 0.2, maxHeight: 3.0, rockColor: "#8a9aaa" },
  tropical: { types: ["palmTree", "broadleafTree", "bush", "rock"], count: 55, minHeight: 0.3, maxHeight: 2.0, rockColor: "#6a8a6a" },
  dudhsagar: { types: ["palmTree", "pineTree", "broadleafTree", "bush", "rock"], count: 35, minHeight: 0.5, maxHeight: 3.5, rockColor: "#6a6050" },
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
      const scale = (0.55 + seededRandom(i * 11 + 3.7 + seedOffset) * 0.85) * scaleMult;

      placed.push({ type, position: [x, height, z], scale, color: config.rockColor, seed: i + seedOffset });
    }
    return placed;
  }, [biome, seed, densityMult, scaleMult, quality.vegetationCount]);

  const glowEnabled = effectOverrides?.glowEnabled;
  const glowColor = effectOverrides?.glowColor || "#4488ff";
  const glowIntensity = effectOverrides?.glowIntensity || 0.3;

  return (
    <group>
      {objects.map((obj, i) => {
        const renderObj = () => {
          switch (obj.type) {
            case "pineTree": return <RealisticPineTree position={[0, 0, 0]} scale={obj.scale} seed={obj.seed} />;
            case "broadleafTree": return <BroadleafTree position={[0, 0, 0]} scale={obj.scale} seed={obj.seed} />;
            case "palmTree": return <RealisticPalmTree position={[0, 0, 0]} scale={obj.scale} seed={obj.seed} />;
            case "bush": return <Bush position={[0, 0, 0]} scale={obj.scale} seed={obj.seed} />;
            case "rock": return <RealisticRock position={[0, 0, 0]} scale={obj.scale} color={obj.color} seed={obj.seed} />;
            case "cactus": return <Cactus position={[0, 0, 0]} scale={obj.scale} seed={obj.seed} />;
            case "iceCrystal": return <IceCrystal position={[0, 0, 0]} scale={obj.scale} />;
            case "lavaRock": return <LavaRock position={[0, 0, 0]} scale={obj.scale} />;
            default: return null;
          }
        };
        return (
          <LODObject key={i} position={obj.position} lodDistances={quality.lodDistances}>
            {renderObj()}
          </LODObject>
        );
      })}
      <GrassPatches biome={biome} seed={seed} />
      {glowEnabled && (
        <pointLight position={[0, 10, 0]} color={glowColor} intensity={glowIntensity} distance={80} />
      )}
    </group>
  );
}
