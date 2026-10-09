import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { biomeNoise, type BiomeConfig } from "@/lib/biomes";
import type { LocationDetailCategory } from "@/lib/real-earth-locations";
import { getQualitySettings } from "@/lib/terrain-quality";

interface LocationEnvironmentProps {
  locationId: string;
  category: LocationDetailCategory;
  biome: BiomeConfig;
  seed: number;
}

type InstanceShape = "box" | "tree-trunk" | "tree-crown" | "rock" | "column";
interface Placement {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY?: number;
}

function seededRandom(key: string, seed: number) {
  let state = 2166136261;
  for (const character of `${key}:${seed}`) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeScatter(
  locationId: string,
  seed: number,
  biome: BiomeConfig,
  baseHeight: number,
  count: number,
  shape: "forest" | "rocks",
): Placement[] {
  const random = seededRandom(locationId, seed);
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 12 + random() * 16;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const size = shape === "forest" ? 0.7 + random() * 0.65 : 0.55 + random() * 1.1;
    const y = biomeNoise(x, z, biome, seed) - baseHeight;
    return {
      position: [x, y, z],
      scale: shape === "forest" ? [size, size, size] : [size, size * 0.7, size],
      rotationY: random() * Math.PI * 2,
    };
  });
}

function InstanceBatch({
  placements,
  shape,
  color,
}: {
  placements: Placement[];
  shape: InstanceShape;
  color: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    placements.forEach((placement, index) => {
      dummy.position.set(...placement.position);
      dummy.rotation.set(0, placement.rotationY ?? 0, 0);
      dummy.scale.set(...placement.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, placements.length]}>
      {shape === "box" && <boxGeometry args={[1, 1, 1]} />}
      {shape === "tree-trunk" && <cylinderGeometry args={[0.16, 0.24, 1.8, 5]} />}
      {shape === "tree-crown" && <coneGeometry args={[1.25, 2.6, 6]} />}
      {shape === "rock" && <dodecahedronGeometry args={[1, 0]} />}
      {shape === "column" && <cylinderGeometry args={[0.22, 0.3, 1, 6]} />}
      <meshStandardMaterial color={color} roughness={0.92} flatShading />
    </instancedMesh>
  );
}

function ScenicScatter({
  locationId,
  category,
  biome,
  seed,
  baseHeight,
}: LocationEnvironmentProps & { baseHeight: number }) {
  const quality = useMemo(() => getQualitySettings(), []);
  const count = Math.min(30, Math.max(8, Math.round(quality.vegetationCount * 0.38)));
  const forest = category === "park" || category === "waterfall";
  const placements = useMemo(
    () => makeScatter(locationId, seed, biome, baseHeight, count, forest ? "forest" : "rocks"),
    [locationId, seed, biome, baseHeight, count, forest],
  );

  if (forest) {
    const trunks = placements.map((placement) => ({
      ...placement,
      position: [placement.position[0], placement.position[1] + 0.8, placement.position[2]] as [number, number, number],
    }));
    const crowns = placements.map((placement) => ({
      ...placement,
      position: [placement.position[0], placement.position[1] + 2.7, placement.position[2]] as [number, number, number],
      scale: [placement.scale[0] * 0.95, placement.scale[1], placement.scale[2] * 0.95] as [number, number, number],
    }));
    return (
      <>
        <InstanceBatch placements={trunks} shape="tree-trunk" color="#624a32" />
        <InstanceBatch placements={crowns} shape="tree-crown" color={category === "park" ? "#39734b" : "#286a45"} />
      </>
    );
  }

  return <InstanceBatch placements={placements} shape="rock" color={category === "mountain" ? "#777e80" : "#8a7660"} />;
}

function Beam({
  start,
  end,
  radius = 0.12,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  radius?: number;
  color: string;
}) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  const center: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  return (
    <mesh position={center} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, direction.length(), 5]} />
      <meshStandardMaterial color={color} metalness={0.52} roughness={0.48} />
    </mesh>
  );
}

function LandmarkDetail({ locationId }: { locationId: string }) {
  if (locationId === "eiffel") {
    const feet: [number, number, number][] = [
      [-4, 0, -2.8], [4, 0, -2.8], [-4, 0, 2.8], [4, 0, 2.8],
    ];
    const deck: [number, number, number][] = [
      [-1.9, 5.2, -1.4], [1.9, 5.2, -1.4], [-1.9, 5.2, 1.4], [1.9, 5.2, 1.4],
    ];
    const crown: [number, number, number][] = [
      [-0.7, 8.1, -0.5], [0.7, 8.1, -0.5], [-0.7, 8.1, 0.5], [0.7, 8.1, 0.5],
    ];
    return (
      <group>
        {feet.map((point, index) => <Beam key={`leg-${index}`} start={point} end={deck[index]} radius={0.22} color="#75604f" />)}
        {deck.map((point, index) => <Beam key={`upper-${index}`} start={point} end={crown[index]} radius={0.14} color="#806b58" />)}
        {[2.8, 5.2, 8.1].map((height, index) => (
          <mesh key={height} position={[0, height, 0]}>
            <boxGeometry args={[index === 2 ? 1.5 : 4.4 - index * 1.1, 0.22, index === 2 ? 1.1 : 3.2 - index * 0.6]} />
            <meshStandardMaterial color="#705b49" metalness={0.38} roughness={0.62} />
          </mesh>
        ))}
        {[-2.4, 0, 2.4].map((height) => (
          <Beam key={height} start={[-2.7 + (height + 2.4) * 0.27, height, 0]} end={[2.7 - (height + 2.4) * 0.27, height, 0]} radius={0.08} color="#8c755e" />
        ))}
        <mesh position={[0, 9.2, 0]}>
          <cylinderGeometry args={[0.12, 0.28, 2.4, 6]} />
          <meshStandardMaterial color="#8c755e" metalness={0.45} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (locationId === "taj") {
    return (
      <group>
        <mesh position={[0, 0.65, 0]}><boxGeometry args={[9, 1.3, 7]} /><meshStandardMaterial color="#e2ddd0" roughness={0.38} /></mesh>
        <mesh position={[0, 1.45, 0]}><boxGeometry args={[6.8, 0.45, 5.2]} /><meshStandardMaterial color="#f0eade" roughness={0.32} /></mesh>
        <mesh position={[0, 3.35, 0]}><boxGeometry args={[3.7, 3.5, 3]} /><meshStandardMaterial color="#e7e1d6" roughness={0.38} /></mesh>
        <mesh position={[0, 5.25, 0]}><sphereGeometry args={[1.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#f2ede2" roughness={0.3} /></mesh>
        {([-1, 1] as const).flatMap((x) => ([-1, 1] as const).map((z) => (
          <group key={`${x}-${z}`} position={[x * 4, 0, z * 2.9]}>
            <mesh position={[0, 2.05, 0]}><cylinderGeometry args={[0.25, 0.38, 4.1, 8]} /><meshStandardMaterial color="#e7e1d6" roughness={0.35} /></mesh>
            <mesh position={[0, 4.35, 0]}><sphereGeometry args={[0.38, 8, 5]} /><meshStandardMaterial color="#f2ede2" roughness={0.3} /></mesh>
          </group>
        )))}
        <mesh position={[0, 0.16, 7.5]} rotation-x={-Math.PI / 2} scale={[1.4, 5.2, 1]}><cylinderGeometry args={[1, 1, 0.16, 24]} /><meshStandardMaterial color="#428a9c" metalness={0.26} roughness={0.22} /></mesh>
      </group>
    );
  }

  if (locationId === "sydney") {
    return (
      <group>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[12, 0.9, 7]} /><meshStandardMaterial color="#c7c8c1" roughness={0.5} /></mesh>
        {[-3.2, -1.1, 1.1, 3.2].map((x, index) => (
          <mesh key={x} position={[x, 2.25 + (index % 2) * 0.2, -0.3]} rotation-z={index % 2 ? -0.38 : 0.38} rotation-x={0.16} scale={[1.45, 2.2, 0.72]}>
            <sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#eeeae0" roughness={0.32} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, 0.12, 5.2]} rotation-x={-Math.PI / 2} scale={[1.8, 6.5, 1]}><cylinderGeometry args={[1, 1, 0.16, 24]} /><meshStandardMaterial color="#247f9b" roughness={0.28} metalness={0.16} /></mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 2.5, 0]}><boxGeometry args={[5, 5, 4]} /><meshStandardMaterial color="#d8d0c3" /></mesh>
      <mesh position={[0, 5.3, 0]}><coneGeometry args={[2.1, 1.4, 8]} /><meshStandardMaterial color="#e8e0d0" /></mesh>
    </group>
  );
}

function MonumentDetail({ locationId }: { locationId: string }) {
  if (locationId === "great-wall") {
    const walls: Placement[] = Array.from({ length: 15 }, (_, index) => {
      const x = -15 + index * 2.15;
      const z = -7 + Math.sin(index * 0.38) * 2.2;
      return { position: [x, 1.1 + Math.sin(index * 0.4) * 0.5, z], scale: [2.3, 0.8, 1.1], rotationY: Math.cos(index * 0.38) * 0.2 };
    });
    const towers: Placement[] = [2, 7, 12].map((index) => {
      const wall = walls[index];
      return { position: [wall.position[0], wall.position[1] + 0.9, wall.position[2]], scale: [1.7, 2, 1.7] };
    });
    return <group><InstanceBatch placements={walls} shape="box" color="#9b8064" /><InstanceBatch placements={towers} shape="box" color="#7d6552" /></group>;
  }

  if (locationId === "machu") {
    return (
      <group>
        {[0, 1, 2, 3].map((row) => (
          <mesh key={row} position={[0, 0.4 + row * 0.8, -5 + row * 1.8]}>
            <boxGeometry args={[10 - row * 1.7, 0.65, 1.7]} /><meshStandardMaterial color={row % 2 ? "#718064" : "#827c65"} roughness={0.96} />
          </mesh>
        ))}
        <mesh position={[0, 3.6, 0.2]}><boxGeometry args={[3.7, 2.8, 2.6]} /><meshStandardMaterial color="#8b8068" roughness={0.96} /></mesh>
        <mesh position={[0, 5.05, 0.2]}><coneGeometry args={[2.3, 1.2, 4]} /><meshStandardMaterial color="#716b57" roughness={1} /></mesh>
        <InstanceBatch placements={[{ position: [-5.3, 0.8, 2.2], scale: [1.1, 1.2, 1.1] }, { position: [5.3, 0.8, 2.2], scale: [1.1, 1.2, 1.1] }]} shape="box" color="#8b8068" />
      </group>
    );
  }

  if (locationId === "petra") {
    return (
      <group>
        <mesh position={[0, 4.8, -5]}><boxGeometry args={[14, 9.6, 2.3]} /><meshStandardMaterial color="#a95f42" roughness={0.96} flatShading /></mesh>
        {[2.2, 4.6, 7.2].map((y, index) => (
          <mesh key={y} position={[0, y, -3.72]}><boxGeometry args={[13 - index * 1.5, 0.22, 0.12]} /><meshStandardMaterial color="#c07b56" roughness={0.94} /></mesh>
        ))}
        {[-3.3, -1.1, 1.1, 3.3].map((x) => (
          <mesh key={x} position={[x, 2.3, -3.45]}><cylinderGeometry args={[0.24, 0.33, 4.2, 8]} /><meshStandardMaterial color="#df9a6e" roughness={0.78} /></mesh>
        ))}
        <mesh position={[0, 5.1, -3.45]}><boxGeometry args={[8.1, 0.55, 0.6]} /><meshStandardMaterial color="#df9a6e" roughness={0.78} /></mesh>
        <mesh position={[0, 6.1, -3.55]}><coneGeometry args={[4.1, 1.4, 4]} /><meshStandardMaterial color="#c77b59" roughness={0.9} /></mesh>
      </group>
    );
  }

  if (locationId === "colosseum") {
    const columns: Placement[] = Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 16) * Math.PI * 2;
      return { position: [Math.cos(angle) * 5.3, 1.2, Math.sin(angle) * 4.1], scale: [1, 2.4, 1], rotationY: -angle };
    });
    return (
      <group>
        <mesh position={[0, 1.25, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[5, 0.52, 5, 28]} /><meshStandardMaterial color="#b29979" roughness={0.9} /></mesh>
        <mesh position={[0, 3.4, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[4.2, 0.46, 5, 28]} /><meshStandardMaterial color="#a58769" roughness={0.9} /></mesh>
        <InstanceBatch placements={columns} shape="column" color="#c1a989" />
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[3.2, 3.4, 0.2, 24]} /><meshStandardMaterial color="#8a806e" roughness={0.95} /></mesh>
      </group>
    );
  }

  return <LandmarkDetail locationId={locationId} />;
}

function WaterfallSheet({ x, width, height, bottom, tint }: { x: number; width: number; height: number; bottom: number; tint: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (meshRef.current) meshRef.current.rotation.z = Math.sin(performance.now() * 0.0015) * 0.012 * (delta > 0 ? 1 : 0);
  });
  return (
    <mesh ref={meshRef} position={[x, bottom + height / 2, 0.35]}>
      <planeGeometry args={[width, height, 1, 6]} />
      <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.12} transparent opacity={0.68} depthWrite={false} side={THREE.DoubleSide} roughness={0.22} />
    </mesh>
  );
}

function WaterfallDetail({ locationId }: { locationId: string }) {
  const falls = locationId === "angel"
    ? [{ x: 0, width: 2.4, height: 8.5, bottom: 0.2 }]
    : locationId === "niagara"
      ? [-2.25, 0, 2.25].map((x) => ({ x, width: 2.8, height: 5.3, bottom: 0.3 }))
      : [{ x: -2.2, width: 2.8, height: 4.8, bottom: 0.3 }, { x: 1.2, width: 3.7, height: 5.8, bottom: 0.65 }, { x: 3.6, width: 2.4, height: 3.7, bottom: 0.1 }];
  return (
    <group>
      <mesh position={[0, 0.15, 0.8]} scale={[1.7, 0.28, 1]}><cylinderGeometry args={[3.3, 3.8, 0.45, 24]} /><meshStandardMaterial color="#298a94" roughness={0.2} metalness={0.12} /></mesh>
      {falls.map((fall, index) => <WaterfallSheet key={index} {...fall} tint={locationId === "dudhsagar" ? "#e6eee8" : "#79d5de"} />)}
      <mesh position={[0, 0.9, -0.5]} scale={[5.4, 1.4, 1]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#665f51" flatShading roughness={1} /></mesh>
      <mesh position={[0, 0.55, 1.55]} scale={[3.8, 0.65, 1]}><sphereGeometry args={[1, 10, 6]} /><meshStandardMaterial color="#e9f4ed" transparent opacity={0.42} depthWrite={false} /></mesh>
    </group>
  );
}

function Peak({ x, z, height, radius, snow, color }: { x: number; z: number; height: number; radius: number; snow: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]}><coneGeometry args={[radius, height, 7]} /><meshStandardMaterial color={color} roughness={0.94} flatShading /></mesh>
      <mesh position={[0, height - snow / 2 + 0.04, 0]}><coneGeometry args={[radius * (snow / height) * 1.05, snow, 7]} /><meshStandardMaterial color="#e7ece9" roughness={0.7} flatShading /></mesh>
    </group>
  );
}

function MountainDetail({ locationId }: { locationId: string }) {
  if (locationId === "fuji") {
    return <group><Peak x={0} z={-1} height={10} radius={7.7} snow={2.7} color="#64747b" /><mesh position={[0, 1.2, 0]}><coneGeometry args={[8.8, 2.4, 8]} /><meshStandardMaterial color="#50715c" roughness={1} flatShading /></mesh></group>;
  }
  if (locationId === "kilimanjaro") {
    return <group><Peak x={0} z={-1} height={9.6} radius={7.4} snow={2.25} color="#706e61" /><mesh position={[0, 9.35, -1]} rotation-x={Math.PI / 2}><torusGeometry args={[1.35, 0.16, 5, 18]} /><meshStandardMaterial color="#524d44" roughness={1} /></mesh></group>;
  }
  return <group><Peak x={-3.2} z={-1.8} height={8} radius={3.8} snow={3} color="#777e82" /><Peak x={0.4} z={-3} height={11.5} radius={4.7} snow={4.6} color="#68757a" /><Peak x={4} z={-1} height={7.5} radius={3.2} snow={2.6} color="#858b8b" /></group>;
}

function AcaciaTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.2, 0.3, 4.2, 6]} /><meshStandardMaterial color="#685039" roughness={0.98} /></mesh>
      <mesh position={[-0.8, 3.35, 0]} rotation-z={-0.45}><cylinderGeometry args={[0.09, 0.15, 2, 5]} /><meshStandardMaterial color="#685039" /></mesh>
      <mesh position={[0.8, 3.35, 0]} rotation-z={0.45}><cylinderGeometry args={[0.09, 0.15, 2, 5]} /><meshStandardMaterial color="#685039" /></mesh>
      {[-1, 0, 1].map((x) => <mesh key={x} position={[x * 0.9, 4.25, 0]} scale={[1.4, 0.32, 0.85]}><sphereGeometry args={[1, 8, 5]} /><meshStandardMaterial color="#718148" flatShading /></mesh>)}
    </group>
  );
}

function Geyser() {
  const plumeRef = useRef<THREE.Group>(null);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (plumeRef.current) plumeRef.current.position.y = 2.7 + Math.sin(performance.now() * 0.0012) * 0.24 * (delta > 0 ? 1 : 0);
  });
  return (
    <group>
      <mesh position={[0, 0.35, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[1.5, 0.34, 6, 20]} /><meshStandardMaterial color="#cf9a6e" roughness={0.82} /></mesh>
      <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[1.35, 1.4, 0.12, 20]} /><meshStandardMaterial color="#4d9b9d" roughness={0.25} /></mesh>
      <group ref={plumeRef}>
        <mesh position={[0, 1.4, 0]}><coneGeometry args={[0.55, 2.6, 8]} /><meshStandardMaterial color="#f0f2ed" transparent opacity={0.43} depthWrite={false} /></mesh>
        <mesh position={[0.35, 2.25, 0]} scale={[0.6, 0.7, 0.6]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#f3f3eb" transparent opacity={0.35} depthWrite={false} /></mesh>
      </group>
    </group>
  );
}

function ParkDetail({ locationId, biome, seed, baseHeight }: { locationId: string; biome: BiomeConfig; seed: number; baseHeight: number }) {
  if (locationId === "yellowstone") return <Geyser />;
  if (locationId === "banff") {
    return <group><mesh position={[0, 0.2, 2]} rotation-x={-Math.PI / 2} scale={[1.3, 0.72, 1]}><circleGeometry args={[4.2, 32]} /><meshStandardMaterial color="#4eaeb2" roughness={0.2} metalness={0.14} /></mesh><Peak x={-5} z={-5} height={8} radius={4} snow={2.5} color="#7a817d" /><Peak x={4} z={-7} height={10} radius={4.8} snow={3.1} color="#69767a" /></group>;
  }
  if (locationId === "serengeti") {
    return <group><AcaciaTree position={[-4, biomeNoise(-4, -2, biome, seed) - baseHeight, -2]} /><AcaciaTree position={[4, biomeNoise(4, -4, biome, seed) - baseHeight, -4]} /><mesh position={[0, 0.35, 4]} scale={[1.8, 0.42, 1]}><sphereGeometry args={[2.6, 10, 5]} /><meshStandardMaterial color="#c4a76a" roughness={0.96} /></mesh></group>;
  }
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.1, 0, -5]}>
          {[0, 1, 2, 3].map((layer) => (
            <mesh key={layer} position={[0, 1.3 + layer * 1.45, 0]}>
              <boxGeometry args={[4.6 - layer * 0.25, 1.55, 9 - layer * 0.8]} />
              <meshStandardMaterial color={["#a65336", "#c06b42", "#d18b58", "#b96d45"][layer]} roughness={0.97} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.15, -2]} rotation-x={-Math.PI / 2} scale={[1.4, 0.6, 1]}><circleGeometry args={[3.5, 24]} /><meshStandardMaterial color="#397b82" roughness={0.3} /></mesh>
    </group>
  );
}

export default function LocationEnvironment({ locationId, category, biome, seed }: LocationEnvironmentProps) {
  const baseHeight = biomeNoise(0, 0, biome, seed);
  const context = { locationId, category, biome, seed, baseHeight };

  return (
    <group position={[0, baseHeight, 0]}>
      {category === "waterfall" && <WaterfallDetail locationId={locationId} />}
      {category === "mountain" && <MountainDetail locationId={locationId} />}
      {category === "landmark" && <LandmarkDetail locationId={locationId} />}
      {category === "monument" && <MonumentDetail locationId={locationId} />}
      {category === "park" && <ParkDetail locationId={locationId} biome={biome} seed={seed} baseHeight={baseHeight} />}
      <ScenicScatter {...context} baseHeight={baseHeight} />
    </group>
  );
}