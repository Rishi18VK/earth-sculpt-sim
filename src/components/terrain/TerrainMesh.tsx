import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, biomeNoise, biomeColor, biomeTerrainType } from "@/lib/biomes";
import type { ModTerrainColorOverrides } from "@/lib/mod-types";
import type { ModTerrainColorOverrides } from "@/lib/mod-types";

interface TerrainMeshProps {
  onPointClick?: (info: { type: string; height: number; position: [number, number, number] }) => void;
  biome: BiomeConfig;
  seed?: number;
  colorOverrides?: ModTerrainColorOverrides | null;
}

function applyColorMod(color: THREE.Color, overrides: ModTerrainColorOverrides): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  if (overrides.hueShift != null) {
    hsl.h = (hsl.h + overrides.hueShift) % 1;
    if (hsl.h < 0) hsl.h += 1;
  }
  if (overrides.saturationShift != null) {
    hsl.s = Math.max(0, Math.min(1, hsl.s + overrides.saturationShift));
  }
  if (overrides.lightnessShift != null) {
    hsl.l = Math.max(0, Math.min(1, hsl.l + overrides.lightnessShift));
  }

  color.setHSL(hsl.h, hsl.s, hsl.l);

  if (overrides.colorMultiplier) {
    color.r *= overrides.colorMultiplier.r;
    color.g *= overrides.colorMultiplier.g;
    color.b *= overrides.colorMultiplier.b;
  }

  return color;
}

export default function TerrainMesh({ onPointClick, biome, seed = 0, colorOverrides }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, waterGeometry } = useMemo(() => {
    const size = 80;
    const segments = 200;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = biomeNoise(x, z, biome, seed);
      positions.setY(i, height);

      const color = biomeColor(height, biome);
      if (colorOverrides) {
        applyColorMod(color, colorOverrides);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const waterGeo = new THREE.PlaneGeometry(size, size, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    return { geometry: geo, waterGeometry: waterGeo };
  }, [biome, seed, colorOverrides?.modName]);

  const waterRef = useRef<THREE.Mesh>(null);
  const waterColor = colorOverrides?.waterColor || biome.waterColor;
  const waterOpacity = colorOverrides?.waterOpacity ?? biome.waterOpacity;

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = biome.waterLevel + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const height = point.y;
    // Use biome's original terrain type labels
    const { biomeTerrainType } = require("@/lib/biomes");
    const type = biomeTerrainType(height, biome);
    onPointClick?.({
      type,
      height: Math.round(height * 100) / 100,
      position: [Math.round(point.x * 10) / 10, Math.round(point.y * 10) / 10, Math.round(point.z * 10) / 10],
    });
  };

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} onClick={handleClick} castShadow receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh ref={waterRef} geometry={waterGeometry} position={[0, biome.waterLevel, 0]}>
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={waterOpacity}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
