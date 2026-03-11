import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, biomeNoise, biomeColor, biomeTerrainType } from "@/lib/biomes";
import type { ModTerrainColorOverrides } from "@/lib/mod-types";
import { getQualitySettings } from "@/lib/terrain-quality";

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

// Calculate slope from neighboring heights for texture blending
function calculateSlope(x: number, z: number, biome: BiomeConfig, seed: number, step: number): number {
  const hC = biomeNoise(x, z, biome, seed);
  const hL = biomeNoise(x - step, z, biome, seed);
  const hR = biomeNoise(x + step, z, biome, seed);
  const hU = biomeNoise(x, z - step, biome, seed);
  const hD = biomeNoise(x, z + step, biome, seed);
  const dx = (hR - hL) / (2 * step);
  const dz = (hD - hU) / (2 * step);
  return Math.sqrt(dx * dx + dz * dz);
}

// PBR-inspired color blending based on elevation + slope
function realisticColor(
  height: number,
  slope: number,
  biome: BiomeConfig,
  x: number,
  z: number
): { color: THREE.Color; roughness: number; metalness: number } {
  const baseColor = biomeColor(height, biome);
  let roughness = 0.8;
  let metalness = 0.05;

  // Slope-based rock blending: steep slopes → rocky appearance
  if (slope > 1.5) {
    const rockBlend = Math.min((slope - 1.5) / 2, 1);
    const rockColor = new THREE.Color().setHSL(0.07, 0.12, 0.38);
    baseColor.lerp(rockColor, rockBlend * 0.7);
    roughness = 0.95;
    metalness = 0.02;
  }

  // Height-based snow blending (for biomes with snow)
  const maxAmplitude = biome.noiseAmplitude.reduce((a, b) => a + b, 0);
  const snowLine = maxAmplitude * 0.7;
  if (height > snowLine) {
    const snowBlend = Math.min((height - snowLine) / (maxAmplitude * 0.3), 1);
    const snowColor = new THREE.Color().setHSL(0.58, 0.08, 0.92);
    baseColor.lerp(snowColor, snowBlend * (1 - Math.min(slope / 3, 0.8)));
    roughness = 0.3 + (1 - snowBlend) * 0.5;
  }

  // Variation noise for natural look
  const noise = Math.sin(x * 5.3 + z * 7.1) * 0.03 + Math.sin(x * 13.7 + z * 11.3) * 0.02;
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + noise));
  hsl.s = Math.max(0, Math.min(1, hsl.s + noise * 0.5));
  baseColor.setHSL(hsl.h, hsl.s, hsl.l);

  // Wet areas near water level
  if (height < biome.waterLevel + 0.5 && height > biome.waterLevel - 0.5) {
    roughness = 0.3;
    metalness = 0.15;
    baseColor.multiplyScalar(0.85);
  }

  return { color: baseColor, roughness, metalness };
}

export default function TerrainMesh({ onPointClick, biome, seed = 0, colorOverrides }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const quality = useMemo(() => getQualitySettings(), []);

  const geometry = useMemo(() => {
    const size = 80;
    const segments = quality.terrainSegments;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const step = size / segments;

    // Store per-vertex roughness/metalness for shader variation
    const roughnessArr = new Float32Array(positions.count);
    const metalnessArr = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = biomeNoise(x, z, biome, seed);
      positions.setY(i, height);

      const slope = calculateSlope(x, z, biome, seed, step);
      const { color, roughness, metalness } = realisticColor(height, slope, biome, x, z);

      if (colorOverrides) {
        applyColorMod(color, colorOverrides);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      roughnessArr[i] = roughness;
      metalnessArr[i] = metalness;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Store average roughness/metalness for the material
    (geo as any)._avgRoughness = roughnessArr.reduce((a, b) => a + b, 0) / roughnessArr.length;
    (geo as any)._avgMetalness = metalnessArr.reduce((a, b) => a + b, 0) / metalnessArr.length;

    return geo;
  }, [biome, seed, colorOverrides?.modName, quality.terrainSegments]);

  const avgRoughness = (geometry as any)._avgRoughness || 0.8;
  const avgMetalness = (geometry as any)._avgMetalness || 0.05;

  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const height = point.y;
    const type = biomeTerrainType(height, biome);
    onPointClick?.({
      type,
      height: Math.round(height * 100) / 100,
      position: [Math.round(point.x * 10) / 10, Math.round(point.y * 10) / 10, Math.round(point.z * 10) / 10],
    });
  };

  return (
    <mesh ref={meshRef} geometry={geometry} onClick={handleClick} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={avgRoughness}
        metalness={avgMetalness}
        envMapIntensity={0.6}
        flatShading={false}
      />
    </mesh>
  );
}
