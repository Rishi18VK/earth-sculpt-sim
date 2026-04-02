// Quality settings for terrain rendering - mobile-first approach

export interface QualitySettings {
  terrainSegments: number;
  shadowMapSize: number;
  vegetationCount: number;
  particleCount: number;
  enableSSAO: boolean;
  enableGodRays: boolean;
  waterSegments: number;
  grassPatchCount: number;
  dpr: [number, number];
  lodDistances: [number, number, number]; // near, mid, far
  treeDetail: number; // geometry segments for trees
  enableFoam: boolean;
  enableCaustics: boolean;
  cloudCount: number;
  enableCanopyRays: boolean;
  maxDrawDistance: number;
}

export function detectQuality(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";

  const isMobile = window.innerWidth < 768;
  const pixelRatio = window.devicePixelRatio || 1;
  const hasWebGL2 = !!document.createElement("canvas").getContext("webgl2");

  if (isMobile || !hasWebGL2) return "low";
  if (pixelRatio > 1.5 && window.innerWidth > 1200) return "high";
  return "medium";
}

export const QUALITY_PRESETS: Record<"low" | "medium" | "high", QualitySettings> = {
  low: {
    terrainSegments: 128,
    shadowMapSize: 1024,
    vegetationCount: 25,
    particleCount: 300,
    enableSSAO: false,
    enableGodRays: false,
    waterSegments: 32,
    grassPatchCount: 0,
    dpr: [1, 1],
    lodDistances: [12, 25, 45],
    treeDetail: 5,
    enableFoam: false,
    enableCaustics: false,
    cloudCount: 4,
    enableCanopyRays: false,
    maxDrawDistance: 60,
  },
  medium: {
    terrainSegments: 200,
    shadowMapSize: 2048,
    vegetationCount: 55,
    particleCount: 800,
    enableSSAO: false,
    enableGodRays: true,
    waterSegments: 64,
    grassPatchCount: 60,
    dpr: [1, 1.5],
    lodDistances: [20, 40, 70],
    treeDetail: 7,
    enableFoam: true,
    enableCaustics: false,
    cloudCount: 10,
    enableCanopyRays: false,
    maxDrawDistance: 90,
  },
  high: {
    terrainSegments: 300,
    shadowMapSize: 4096,
    vegetationCount: 90,
    particleCount: 1500,
    enableSSAO: true,
    enableGodRays: true,
    waterSegments: 128,
    grassPatchCount: 150,
    dpr: [1, 2],
    lodDistances: [30, 60, 100],
    treeDetail: 8,
    enableFoam: true,
    enableCaustics: true,
    cloudCount: 16,
    enableCanopyRays: true,
    maxDrawDistance: 120,
  },
};

export function getQualitySettings(): QualitySettings {
  return QUALITY_PRESETS[detectQuality()];
}
