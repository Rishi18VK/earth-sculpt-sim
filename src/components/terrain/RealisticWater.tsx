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
  const waterOpacity = colorOverrides?.waterOpacity ?? biome.waterOpacity;

  const geometry = useMemo(() => {
    const size = 80;
    const segs = quality.waterSegments;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [quality.waterSegments]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Multi-frequency wave simulation
      const wave1 = Math.sin(x * 0.3 + time * 0.8) * 0.08;
      const wave2 = Math.sin(z * 0.5 + time * 1.2) * 0.05;
      const wave3 = Math.sin((x + z) * 0.2 + time * 0.5) * 0.06;
      const ripple = Math.sin(Math.sqrt(x * x + z * z) * 0.15 + time) * 0.03;
      pos.setY(i, biome.waterLevel + wave1 + wave2 + wave3 + ripple);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color={waterColor}
        transparent
        opacity={waterOpacity}
        roughness={0.05}
        metalness={0.1}
        transmission={0.3}
        thickness={1.5}
        envMapIntensity={1.5}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
