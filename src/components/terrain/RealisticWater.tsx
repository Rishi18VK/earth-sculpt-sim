import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig } from "@/lib/biomes";
import type { ModTerrainColorOverrides } from "@/lib/mod-types";
import { getQualitySettings } from "@/lib/terrain-quality";

interface RealisticWaterProps {
  biome: BiomeConfig;
  colorOverrides?: ModTerrainColorOverrides | null;
}

export default function RealisticWater({ biome, colorOverrides }: RealisticWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const quality = useMemo(() => getQualitySettings(), []);

  const waterColor = colorOverrides?.waterColor || biome.waterColor;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(82, 82, quality.waterSegments, quality.waterSegments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [quality.waterSegments]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const positions = geo.attributes.position;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave1 = Math.sin(x * 0.15 + t * 0.8) * 0.08;
      const wave2 = Math.sin(z * 0.12 + t * 0.6 + 1.5) * 0.06;
      const wave3 = Math.sin((x + z) * 0.2 + t * 1.2) * 0.03;
      const ripple = Math.sin(x * 0.8 + z * 0.6 + t * 2.0) * 0.015;
      positions.setY(i, biome.waterLevel + wave1 + wave2 + wave3 + ripple);
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    if (mat) {
      mat.clearcoatRoughness = 0.05 + Math.sin(t * 0.3) * 0.02;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={biome.waterOpacity * 0.85}
          roughness={0.05}
          metalness={0.15}
          clearcoat={0.8}
          clearcoatRoughness={0.06}
          transmission={0.3}
          thickness={2.5}
          ior={1.33}
          envMapIntensity={1.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {quality.enableFoam && <WaterFoam biome={biome} />}
      {quality.enableCaustics && <CausticLight biome={biome} />}
    </group>
  );
}

function WaterFoam({ biome }: { biome: BiomeConfig }) {
  const ref = useRef<THREE.Points>(null);
  const count = 400;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 35;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = biome.waterLevel + 0.02;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [biome.waterLevel]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = biome.waterLevel + 0.02 + Math.sin(t * 0.5 + i * 0.3) * 0.015;
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.3 + Math.sin(t * 0.2) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.15} transparent opacity={0.35} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function CausticLight({ biome }: { biome: BiomeConfig }) {
  const ref = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = Math.sin(t * 0.2) * 5;
    ref.current.position.z = Math.cos(t * 0.15) * 5;
    ref.current.intensity = 0.15 + Math.sin(t * 0.8) * 0.05;
  });

  return (
    <spotLight
      ref={ref}
      position={[0, biome.waterLevel + 3, 0]}
      angle={0.8}
      penumbra={1}
      intensity={0.15}
      color={biome.waterColor}
      distance={15}
    />
  );
}
