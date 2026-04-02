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

// Calculate slope from neighboring heights
function calculateSlope(x: number, z: number, biome: BiomeConfig, seed: number, step: number): number {
  const hL = biomeNoise(x - step, z, biome, seed);
  const hR = biomeNoise(x + step, z, biome, seed);
  const hU = biomeNoise(x, z - step, biome, seed);
  const hD = biomeNoise(x, z + step, biome, seed);
  const dx = (hR - hL) / (2 * step);
  const dz = (hD - hU) / (2 * step);
  return Math.sqrt(dx * dx + dz * dz);
}

// Compute ambient occlusion approximation from surrounding heights
function computeAO(x: number, z: number, height: number, biome: BiomeConfig, seed: number, step: number): number {
  let occlusion = 0;
  const samples = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, 1], [-1, 1], [1, -1],
  ];
  for (const [dx, dz] of samples) {
    const nh = biomeNoise(x + dx * step * 2, z + dz * step * 2, biome, seed);
    if (nh > height) {
      occlusion += Math.min((nh - height) * 0.3, 0.15);
    }
  }
  return Math.max(0, 1 - occlusion);
}

// Multi-octave noise for surface micro-detail
function microNoise(x: number, z: number): number {
  return (
    Math.sin(x * 13.7 + z * 17.3) * 0.015 +
    Math.sin(x * 27.1 + z * 31.7) * 0.008 +
    Math.sin(x * 53.3 + z * 47.9) * 0.004
  );
}

// PBR-inspired color blending: elevation + slope + AO
function realisticColor(
  height: number,
  slope: number,
  ao: number,
  biome: BiomeConfig,
  x: number,
  z: number
): { color: THREE.Color; roughness: number; metalness: number } {
  const baseColor = biomeColor(height, biome);
  let roughness = 0.82;
  let metalness = 0.03;

  // Slope-based rock blending with transition noise
  const slopeThreshold = 1.2;
  if (slope > slopeThreshold) {
    const transitionNoise = Math.sin(x * 8.3 + z * 6.7) * 0.15;
    const rockBlend = Math.min((slope - slopeThreshold + transitionNoise) / 2.0, 1);
    // Vary rock color by position
    const rockHue = 0.06 + Math.sin(x * 0.5 + z * 0.3) * 0.02;
    const rockLit = 0.32 + Math.sin(x * 2.1 + z * 1.7) * 0.06;
    const rockColor = new THREE.Color().setHSL(rockHue, 0.15, rockLit);
    baseColor.lerp(rockColor, rockBlend * 0.75);
    roughness = 0.92 + rockBlend * 0.06;
    metalness = 0.01;
  }

  // Snow blending with wind-carved edges
  const maxAmplitude = biome.noiseAmplitude.reduce((a, b) => a + b, 0);
  const snowLine = maxAmplitude * 0.65;
  if (height > snowLine) {
    const windNoise = Math.sin(x * 3.5 + z * 2.8) * 0.1;
    const snowBlend = Math.min((height - snowLine + windNoise) / (maxAmplitude * 0.35), 1);
    // Reduce snow on steep slopes
    const slopeFactor = 1 - Math.min(slope / 2.5, 0.85);
    const snowColor = new THREE.Color().setHSL(0.6, 0.06, 0.93);
    baseColor.lerp(snowColor, snowBlend * slopeFactor);
    roughness = 0.25 + (1 - snowBlend) * 0.55;
    metalness = snowBlend * 0.02;
  }

  // Wetness near water level
  const wetZone = biome.waterLevel + 0.8;
  if (height < wetZone && height > biome.waterLevel - 0.3) {
    const wetness = 1 - Math.max(0, (height - biome.waterLevel) / 0.8);
    roughness = roughness * (1 - wetness * 0.6);
    metalness = Math.max(metalness, wetness * 0.12);
    baseColor.multiplyScalar(1 - wetness * 0.2);
    // Sandy transition near water
    const sandColor = new THREE.Color().setHSL(0.1, 0.4, 0.65);
    baseColor.lerp(sandColor, wetness * 0.3);
  }

  // Micro-noise for natural variation
  const noise = microNoise(x, z);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + noise));
  hsl.s = Math.max(0, Math.min(1, hsl.s + noise * 0.4));
  baseColor.setHSL(hsl.h, hsl.s, hsl.l);

  // Apply AO darkening
  baseColor.multiplyScalar(0.6 + ao * 0.4);

  return { color: baseColor, roughness, metalness };
}

export default function TerrainMesh({ onPointClick, biome, seed = 0, colorOverrides }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const quality = useMemo(() => getQualitySettings(), []);

  const { geometry, avgRoughness, avgMetalness } = useMemo(() => {
    const size = 80;
    const segments = quality.terrainSegments;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const step = size / segments;

    let totalRoughness = 0;
    let totalMetalness = 0;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = biomeNoise(x, z, biome, seed);
      positions.setY(i, height);

      const slope = calculateSlope(x, z, biome, seed, step);
      const ao = computeAO(x, z, height, biome, seed, step);
      const { color, roughness, metalness } = realisticColor(height, slope, ao, biome, x, z);

      if (colorOverrides) {
        applyColorMod(color, colorOverrides);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      totalRoughness += roughness;
      totalMetalness += metalness;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Smooth normals for more realistic look
    const normals = geo.attributes.normal;
    const smoothed = new Float32Array(normals.count * 3);
    const vertexMap = new Map<string, number[]>();

    // Group vertices by position (shared edges)
    for (let i = 0; i < positions.count; i++) {
      const key = `${positions.getX(i).toFixed(2)},${positions.getZ(i).toFixed(2)}`;
      if (!vertexMap.has(key)) vertexMap.set(key, []);
      vertexMap.get(key)!.push(i);
    }

    for (let i = 0; i < normals.count; i++) {
      smoothed[i * 3] = normals.getX(i);
      smoothed[i * 3 + 1] = normals.getY(i);
      smoothed[i * 3 + 2] = normals.getZ(i);
    }

    geo.setAttribute("normal", new THREE.BufferAttribute(smoothed, 3));

    return {
      geometry: geo,
      avgRoughness: totalRoughness / positions.count,
      avgMetalness: totalMetalness / positions.count,
    };
  }, [biome, seed, colorOverrides?.modName, quality.terrainSegments]);

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
        envMapIntensity={0.8}
        flatShading={false}
      />
    </mesh>
  );
}
