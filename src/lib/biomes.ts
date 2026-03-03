import * as THREE from "three";

export type BiomeId = "earth" | "volcanic" | "desert" | "arctic" | "tropical";

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  emoji: string;
  description: string;
  noiseScale: number[];
  noiseAmplitude: number[];
  noiseOffset: number[];
  colorStops: { threshold: number; hsl: [number, number, number]; label: string; hex: string }[];
  waterColor: string;
  waterOpacity: number;
  waterLevel: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  skyInclination: number;
  skyAzimuth: number;
  skyTurbidity: number;
  skyRayleigh: number;
  ambientIntensity: number;
  sunPosition: [number, number, number];
}

export const BIOMES: Record<BiomeId, BiomeConfig> = {
  earth: {
    id: "earth",
    name: "Earth Classic",
    emoji: "🌍",
    description: "Standard Earth-like terrain with all biomes",
    noiseScale: [0.3, 0.7, 1.5, 3.0],
    noiseAmplitude: [2, 1.5, 0.7, 0.3],
    noiseOffset: [0, 1.3, 2.1, 0],
    colorStops: [
      { threshold: -1.5, hsl: [0.58, 0.8, 0.25], label: "Deep Sea", hex: "#1a3a5c" },
      { threshold: -0.5, hsl: [0.55, 0.7, 0.4], label: "Shallow Water", hex: "#2a6b8a" },
      { threshold: 0.0, hsl: [0.12, 0.5, 0.65], label: "Sand/Beach", hex: "#c2b280" },
      { threshold: 1.0, hsl: [0.33, 0.55, 0.35], label: "Greenery", hex: "#4a8c3f" },
      { threshold: 2.0, hsl: [0.28, 0.5, 0.28], label: "Forest", hex: "#3a6b30" },
      { threshold: 3.0, hsl: [0.08, 0.1, 0.45], label: "Stone/Rock", hex: "#8b7355" },
      { threshold: Infinity, hsl: [0.58, 0.15, 0.85], label: "Snow/Ice", hex: "#dce8f0" },
    ],
    waterColor: "#1a6b8a",
    waterOpacity: 0.6,
    waterLevel: -0.5,
    fogColor: "#a0c4e8",
    fogNear: 40,
    fogFar: 100,
    skyInclination: 0.5,
    skyAzimuth: 0.25,
    skyTurbidity: 8,
    skyRayleigh: 2,
    ambientIntensity: 0.4,
    sunPosition: [100, 20, 100],
  },
  volcanic: {
    id: "volcanic",
    name: "Volcanic",
    emoji: "🌋",
    description: "Active volcanic landscape with lava flows and ash",
    noiseScale: [0.25, 0.6, 1.8, 4.0],
    noiseAmplitude: [3, 2, 0.8, 0.4],
    noiseOffset: [5, 3, 7, 2],
    colorStops: [
      { threshold: -1.5, hsl: [0.02, 0.9, 0.3], label: "Magma Pool", hex: "#8b1a0a" },
      { threshold: -0.5, hsl: [0.05, 0.85, 0.4], label: "Lava Flow", hex: "#c43c1a" },
      { threshold: 0.5, hsl: [0.0, 0.0, 0.2], label: "Basalt", hex: "#333333" },
      { threshold: 1.5, hsl: [0.0, 0.0, 0.3], label: "Volcanic Rock", hex: "#4d4d4d" },
      { threshold: 2.5, hsl: [0.08, 0.15, 0.35], label: "Ash Field", hex: "#5a5045" },
      { threshold: 3.5, hsl: [0.0, 0.0, 0.15], label: "Obsidian", hex: "#262626" },
      { threshold: Infinity, hsl: [0.02, 0.7, 0.5], label: "Crater Glow", hex: "#d94420" },
    ],
    waterColor: "#cc3300",
    waterOpacity: 0.8,
    waterLevel: -0.8,
    fogColor: "#4a2020",
    fogNear: 30,
    fogFar: 80,
    skyInclination: 0.6,
    skyAzimuth: 0.5,
    skyTurbidity: 20,
    skyRayleigh: 0.5,
    ambientIntensity: 0.3,
    sunPosition: [80, 10, 60],
  },
  desert: {
    id: "desert",
    name: "Desert",
    emoji: "🏜️",
    description: "Arid dunes and rocky canyons with oasis pools",
    noiseScale: [0.2, 0.5, 1.2, 2.5],
    noiseAmplitude: [1.5, 1, 0.5, 0.2],
    noiseOffset: [10, 8, 12, 6],
    colorStops: [
      { threshold: -1.0, hsl: [0.55, 0.6, 0.35], label: "Oasis Water", hex: "#2a7a6a" },
      { threshold: -0.2, hsl: [0.1, 0.6, 0.55], label: "Wet Sand", hex: "#c49a5a" },
      { threshold: 0.5, hsl: [0.1, 0.55, 0.7], label: "Sand Dune", hex: "#d4b87a" },
      { threshold: 1.2, hsl: [0.08, 0.45, 0.6], label: "Dry Sand", hex: "#c4a060" },
      { threshold: 2.0, hsl: [0.06, 0.3, 0.5], label: "Sandstone", hex: "#a08050" },
      { threshold: 2.8, hsl: [0.04, 0.2, 0.4], label: "Red Rock", hex: "#7a5a3a" },
      { threshold: Infinity, hsl: [0.08, 0.1, 0.75], label: "Bleached Stone", hex: "#c4baa0" },
    ],
    waterColor: "#2a7a6a",
    waterOpacity: 0.5,
    waterLevel: -1.0,
    fogColor: "#d4c4a0",
    fogNear: 50,
    fogFar: 120,
    skyInclination: 0.45,
    skyAzimuth: 0.3,
    skyTurbidity: 15,
    skyRayleigh: 1,
    ambientIntensity: 0.6,
    sunPosition: [100, 40, 80],
  },
  arctic: {
    id: "arctic",
    name: "Arctic",
    emoji: "❄️",
    description: "Frozen tundra with glaciers, ice sheets and frozen seas",
    noiseScale: [0.35, 0.8, 1.6, 3.2],
    noiseAmplitude: [2.5, 1.8, 0.6, 0.25],
    noiseOffset: [20, 15, 18, 22],
    colorStops: [
      { threshold: -1.5, hsl: [0.58, 0.5, 0.2], label: "Frozen Deep", hex: "#1a3050" },
      { threshold: -0.5, hsl: [0.55, 0.4, 0.45], label: "Ice Water", hex: "#5090a0" },
      { threshold: 0.0, hsl: [0.55, 0.2, 0.7], label: "Sea Ice", hex: "#a0b8c4" },
      { threshold: 1.0, hsl: [0.58, 0.15, 0.82], label: "Snow Field", hex: "#c8d4e0" },
      { threshold: 2.0, hsl: [0.6, 0.1, 0.9], label: "Fresh Snow", hex: "#e0e8f0" },
      { threshold: 3.0, hsl: [0.55, 0.05, 0.6], label: "Permafrost", hex: "#909898" },
      { threshold: Infinity, hsl: [0.58, 0.2, 0.95], label: "Glacier Peak", hex: "#eaf0f8" },
    ],
    waterColor: "#3a6880",
    waterOpacity: 0.4,
    waterLevel: -0.3,
    fogColor: "#c0d0e0",
    fogNear: 35,
    fogFar: 90,
    skyInclination: 0.3,
    skyAzimuth: 0.1,
    skyTurbidity: 5,
    skyRayleigh: 4,
    ambientIntensity: 0.5,
    sunPosition: [60, 8, 100],
  },
  tropical: {
    id: "tropical",
    name: "Tropical Island",
    emoji: "🏝️",
    description: "Lush tropical islands with coral reefs and lagoons",
    noiseScale: [0.2, 0.55, 1.3, 2.8],
    noiseAmplitude: [2, 1.2, 0.6, 0.3],
    noiseOffset: [30, 25, 33, 28],
    colorStops: [
      { threshold: -2.0, hsl: [0.6, 0.8, 0.2], label: "Deep Ocean", hex: "#0a3060" },
      { threshold: -1.0, hsl: [0.52, 0.75, 0.4], label: "Coral Reef", hex: "#1a90a0" },
      { threshold: -0.3, hsl: [0.48, 0.7, 0.55], label: "Lagoon", hex: "#40b8b0" },
      { threshold: 0.2, hsl: [0.13, 0.6, 0.75], label: "White Sand", hex: "#e8d8b0" },
      { threshold: 1.0, hsl: [0.3, 0.7, 0.35], label: "Tropical Forest", hex: "#2a8a30" },
      { threshold: 2.0, hsl: [0.35, 0.6, 0.3], label: "Jungle", hex: "#1a7020" },
      { threshold: Infinity, hsl: [0.33, 0.5, 0.4], label: "Canopy Peak", hex: "#409040" },
    ],
    waterColor: "#1a90b0",
    waterOpacity: 0.55,
    waterLevel: -0.3,
    fogColor: "#80c8e0",
    fogNear: 45,
    fogFar: 110,
    skyInclination: 0.55,
    skyAzimuth: 0.2,
    skyTurbidity: 6,
    skyRayleigh: 3,
    ambientIntensity: 0.5,
    sunPosition: [100, 30, 80],
  },
};

export function biomeNoise(x: number, z: number, biome: BiomeConfig, seed: number = 0): number {
  let total = 0;
  const seedOffset = seed * 100;
  for (let i = 0; i < biome.noiseScale.length; i++) {
    const s = biome.noiseScale[i];
    const a = biome.noiseAmplitude[i];
    const o = biome.noiseOffset[i] + seedOffset;
    total += Math.sin(x * s + o) * Math.cos(z * s + o * 0.7) * a;
  }
  return total;
}

export function biomeColor(height: number, biome: BiomeConfig): THREE.Color {
  for (const stop of biome.colorStops) {
    if (height < stop.threshold) {
      return new THREE.Color().setHSL(stop.hsl[0], stop.hsl[1], stop.hsl[2]);
    }
  }
  const last = biome.colorStops[biome.colorStops.length - 1];
  return new THREE.Color().setHSL(last.hsl[0], last.hsl[1], last.hsl[2]);
}

export function biomeColorHex(height: number, biome: BiomeConfig): string {
  for (const stop of biome.colorStops) {
    if (height < stop.threshold) return stop.hex;
  }
  return biome.colorStops[biome.colorStops.length - 1].hex;
}

export function biomeTerrainType(height: number, biome: BiomeConfig): string {
  for (const stop of biome.colorStops) {
    if (height < stop.threshold) return stop.label;
  }
  return biome.colorStops[biome.colorStops.length - 1].label;
}
