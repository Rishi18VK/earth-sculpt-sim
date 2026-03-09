import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, biomeNoise } from "@/lib/biomes";

interface DudhsagarEnvironmentProps {
  biome: BiomeConfig;
  seed: number;
  playerPosition?: [number, number, number] | null;
}

// ── Seeded random ──
function srand(s: number) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Waterfall: multi-tier cascading water + spray ──
function Waterfall({ position }: { position: [number, number, number] }) {
  const sprayRef = useRef<THREE.Points>(null);
  const waterRefs = useRef<THREE.Mesh[]>([]);

  // Four tiers of the waterfall
  const tiers = useMemo(() => [
    { y: 12, height: 4, width: 3 },
    { y: 8, height: 3.5, width: 4 },
    { y: 4.5, height: 3.5, width: 5 },
    { y: 1, height: 3, width: 6 },
  ], []);

  // Spray / mist particles
  const sprayCount = 600;
  const sprayPositions = useMemo(() => {
    const arr = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    // Animate spray particles
    if (sprayRef.current) {
      const pos = sprayRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < sprayCount; i++) {
        const i3 = i * 3;
        arr[i3] += (Math.random() - 0.5) * 0.15;
        arr[i3 + 1] += (Math.random() - 0.3) * 0.08;
        arr[i3 + 2] += (Math.random() - 0.5) * 0.1;
        if (arr[i3 + 1] > 17 || arr[i3 + 1] < -1 || Math.abs(arr[i3]) > 8) {
          arr[i3] = (Math.random() - 0.5) * 6;
          arr[i3 + 1] = Math.random() * 14;
          arr[i3 + 2] = (Math.random() - 0.5) * 4;
        }
      }
      pos.needsUpdate = true;
    }
    // Animate water tier shimmer
    waterRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2 + idx) * 0.1;
      }
    });
  });

  return (
    <group position={position}>
      {/* Water tiers */}
      {tiers.map((tier, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) waterRefs.current[i] = el; }}
          position={[0, tier.y, 0]}
        >
          <planeGeometry args={[tier.width, tier.height, 4, 8]} />
          <meshStandardMaterial
            color="#cceeff"
            transparent
            opacity={0.65}
            roughness={0.1}
            metalness={0.2}
            side={THREE.DoubleSide}
            emissive="#aaddff"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      {/* White foam at base */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Spray particles */}
      <points ref={sprayRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={sprayCount} array={sprayPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ddeeff" size={0.12} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}

// ── Railway Bridge ──
function RailwayBridge({ position }: { position: [number, number, number] }) {
  const pillarPositions = useMemo(() => {
    const pillars: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      pillars.push([i * 4 - 10, 0, 0]);
    }
    return pillars;
  }, []);

  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      {/* Bridge deck */}
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[26, 0.4, 2.5]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Rails */}
      <mesh position={[0, 9.3, 0.8]} castShadow>
        <boxGeometry args={[26, 0.12, 0.1]} />
        <meshStandardMaterial color="#666666" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 9.3, -0.8]} castShadow>
        <boxGeometry args={[26, 0.12, 0.1]} />
        <meshStandardMaterial color="#666666" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Sleepers */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`sleeper-${i}`} position={[i * 1.3 - 12.5, 9.15, 0]} castShadow>
          <boxGeometry args={[0.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#4a3a2a" roughness={1} />
        </mesh>
      ))}

      {/* Pillars / Arches */}
      {pillarPositions.map(([x, y, z], i) => (
        <group key={`pillar-${i}`} position={[x, y, z]}>
          {/* Main pillar */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <boxGeometry args={[1.2, 9, 1.8]} />
            <meshStandardMaterial color="#8a7a6a" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Arch between pillars */}
          {i < 5 && (
            <mesh position={[2, 7.5, 0]} castShadow>
              <boxGeometry args={[2.8, 0.6, 1.6]} />
              <meshStandardMaterial color="#7a6a5a" roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}

      {/* Guard rails */}
      <mesh position={[0, 10, 1.1]} castShadow>
        <boxGeometry args={[26, 0.8, 0.08]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 10, -1.1]} castShadow>
        <boxGeometry args={[26, 0.8, 0.08]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ── Tropical Tree ──
function TropicalTree({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const trunkHeight = 2 + variant * 0.8;
  const crownSize = 0.8 + variant * 0.3;

  return (
    <group position={position} scale={scale}>
      {/* Trunk — slightly curved */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, trunkHeight, 6]} />
        <meshStandardMaterial color="#6a5030" roughness={1} />
      </mesh>
      {/* Crown layers */}
      <mesh position={[0, trunkHeight + 0.3, 0]} castShadow>
        <sphereGeometry args={[crownSize, 8, 6]} />
        <meshStandardMaterial color="#1a6a12" roughness={0.85} />
      </mesh>
      <mesh position={[0.2, trunkHeight + 0.6, 0.15]} castShadow>
        <sphereGeometry args={[crownSize * 0.7, 6, 5]} />
        <meshStandardMaterial color="#228a18" roughness={0.85} />
      </mesh>
      {/* Hanging vines */}
      {variant > 0.5 && (
        <mesh position={[crownSize * 0.5, trunkHeight - 0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2, 3]} />
          <meshStandardMaterial color="#2a5a1a" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

// ── Fern / Bush ──
function Fern({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.2, 0.15, Math.sin(angle) * 0.2]} rotation={[0.4 * Math.cos(angle), angle, 0]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial color="#2a8a1a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ── Rock Cluster ──
function CliffRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#6a6050" roughness={1} metalness={0.05} />
      </mesh>
      <mesh position={[0.4, -0.2, 0.3]} castShadow>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#7a7060" roughness={1} />
      </mesh>
    </group>
  );
}

// ── Trail Path ──
function TrailPath({ biome, seed }: { biome: BiomeConfig; seed: number }) {
  const trailPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    // Trail from south to waterfall base
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      const x = -15 + t * 20 + Math.sin(t * 4) * 2;
      const z = 20 - t * 25;
      const h = biomeNoise(x, z, biome, seed);
      const y = Math.max(h, biome.waterLevel + 0.1) + 0.05;
      points.push([x, y, z]);
    }
    return points;
  }, [biome, seed]);

  return (
    <group>
      {trailPoints.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 6]} />
          <meshStandardMaterial color="#8a7a5a" roughness={1} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Mist Volumes (large fog planes near waterfall) ──
function MistVolumes({ waterfallPosition }: { waterfallPosition: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        child.position.y = waterfallPosition[1] + 2 + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.5;
        (child as THREE.Mesh).material && ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity !== undefined && (
          ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.5 + i * 2) * 0.05
        );
      });
    }
  });

  return (
    <group ref={ref}>
      {[[-3, 0, 2], [4, 0, -1], [0, 0, 5], [-5, 0, -3], [2, 0, -4]].map(([x, y, z], i) => (
        <mesh key={i} position={[waterfallPosition[0] + x, waterfallPosition[1] + 3 + y, waterfallPosition[2] + z]}>
          <planeGeometry args={[8 + i * 2, 4 + i, 1, 1]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Sunlight Rays (God Rays via transparent planes) ──
function SunlightRays() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.2 + i * 1.5) * 0.02;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[10 + i * 5, 12, -5 + i * 3]}
          rotation={[0.3, 0.5 + i * 0.2, -0.8]}
        >
          <planeGeometry args={[2, 20]} />
          <meshBasicMaterial color="#fff8e0" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Wind-affected vegetation particles ──
function WindParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = Math.random() * 15 + 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += 0.3 * delta + (Math.random() - 0.5) * 0.05;
      arr[i3 + 1] += (Math.random() - 0.5) * 0.02;
      if (arr[i3] > 30) arr[i3] = -30;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#88aa44" size={0.06} transparent opacity={0.4} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ── Main Component ──
export default function DudhsagarEnvironment({ biome, seed, playerPosition }: DudhsagarEnvironmentProps) {
  const waterfallPos: [number, number, number] = [5, 0, -8];
  const bridgePos: [number, number, number] = [5, 0, -5];

  // Generate dense tropical vegetation
  const vegetation = useMemo(() => {
    const items: { type: "tree" | "fern" | "rock"; pos: [number, number, number]; scale: number; variant: number }[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const x = srand(i * 3 + 0.1 + seed * 50) * 70 - 35;
      const z = srand(i * 3 + 1.1 + seed * 50) * 70 - 35;
      const height = biomeNoise(x, z, biome, seed);

      // Only place on land above water
      if (height < 0.3 || height > 5.5) continue;
      // Avoid waterfall area
      const dxW = x - waterfallPos[0];
      const dzW = z - waterfallPos[2];
      if (Math.sqrt(dxW * dxW + dzW * dzW) < 6) continue;
      // Avoid bridge area
      const dxB = x - bridgePos[0];
      const dzB = z - bridgePos[2];
      if (Math.abs(dxB) < 14 && Math.abs(dzB) < 3) continue;

      const r = srand(i * 7 + 2.3 + seed * 50);
      const variant = srand(i * 11 + 3.7 + seed * 50);
      const scale = 0.6 + variant * 0.8;

      if (r < 0.5) {
        items.push({ type: "tree", pos: [x, height, z], scale, variant });
      } else if (r < 0.8) {
        items.push({ type: "fern", pos: [x, height, z], scale: scale * 0.8, variant });
      } else {
        items.push({ type: "rock", pos: [x, height, z], scale: scale * 0.6, variant });
      }
    }
    return items;
  }, [biome, seed]);

  // Cinematic viewpoints (shown as small markers)
  const viewpoints: { pos: [number, number, number]; label: string }[] = [
    { pos: [20, 5, 10], label: "Panoramic View" },
    { pos: [-5, 2, 5], label: "Waterfall Base" },
    { pos: [5, 12, -15], label: "Bridge Top" },
    { pos: [-15, 3, -5], label: "Forest Trail" },
  ];

  return (
    <group>
      {/* Waterfall */}
      <Waterfall position={waterfallPos} />

      {/* Railway Bridge */}
      <RailwayBridge position={bridgePos} />

      {/* Trail Path */}
      <TrailPath biome={biome} seed={seed} />

      {/* Dense Tropical Vegetation */}
      {vegetation.map((item, i) => {
        switch (item.type) {
          case "tree":
            return <TropicalTree key={i} position={item.pos} scale={item.scale} variant={item.variant} />;
          case "fern":
            return <Fern key={i} position={item.pos} scale={item.scale} />;
          case "rock":
            return <CliffRock key={i} position={item.pos} scale={item.scale} />;
          default:
            return null;
        }
      })}

      {/* Mist around waterfall */}
      <MistVolumes waterfallPosition={waterfallPos} />

      {/* God rays through canopy */}
      <SunlightRays />

      {/* Wind-blown leaves/particles */}
      <WindParticles />

      {/* Viewpoint markers */}
      {viewpoints.map((vp, i) => (
        <group key={`vp-${i}`} position={vp.pos}>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.4} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Additional ambient glow near waterfall */}
      <pointLight position={[waterfallPos[0], waterfallPos[1] + 6, waterfallPos[2]]} color="#aaddff" intensity={0.3} distance={25} />
      <pointLight position={[waterfallPos[0], waterfallPos[1] + 1, waterfallPos[2] + 3]} color="#88ccaa" intensity={0.2} distance={15} />
    </group>
  );
}
