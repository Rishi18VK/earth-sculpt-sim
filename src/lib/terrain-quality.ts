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
    vegetationCount: 30,
    particleCount: 500,
    enableSSAO: false,
    enableGodRays: false,
    waterSegments: 32,
    grassPatchCount: 0,
    dpr: [1, 1],
    lodDistances: [15, 30, 50],
  },
  medium: {
    terrainSegments: 200,
    shadowMapSize: 2048,
    vegetationCount: 60,
    particleCount: 1200,
    enableSSAO: false,
    enableGodRays: true,
    waterSegments: 64,
    grassPatchCount: 80,
    dpr: [1, 1.5],
    lodDistances: [20, 40, 70],
  },
  high: {
    terrainSegments: 300,
    shadowMapSize: 4096,
    vegetationCount: 100,
    particleCount: 2000,
    enableSSAO: true,
    enableGodRays: true,
    waterSegments: 128,
    grassPatchCount: 200,
    dpr: [1, 2],
    lodDistances: [30, 60, 100],
  },
};

export function getQualitySettings(): QualitySettings {
  return QUALITY_PRESETS[detectQuality()];
}
