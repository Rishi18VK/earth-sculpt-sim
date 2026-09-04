export type QualityPreset = "auto" | "low" | "medium" | "high";
export type EnvPreset = "void" | "orbit" | "dusk" | "grid" | "aurora";

export interface ModelConfiguration {
  transform: { scale: number; rotationY: number; height: number };
  material: {
    color: string;
    metalness: number;
    roughness: number;
    opacity: number;
    emissive: number;
    wireframe: boolean;
  };
  lighting: { key: number; ambient: number; rim: string };
  environment: {
    preset: EnvPreset;
    grid: boolean;
    stars: boolean;
    autoRotate: boolean;
    scanlines: boolean;
  };
  parts: Record<string, boolean>;
}

export const DEFAULT_CONFIG: ModelConfiguration = {
  transform: { scale: 1, rotationY: 0, height: 0 },
  material: {
    color: "#4fd1ff",
    metalness: 0.35,
    roughness: 0.25,
    opacity: 0.9,
    emissive: 0.6,
    wireframe: false,
  },
  lighting: { key: 1.6, ambient: 0.45, rim: "#7c5cff" },
  environment: { preset: "orbit", grid: true, stars: true, autoRotate: true, scanlines: true },
  parts: { base: true, body: true, crown: true, details: true },
};

export const HOLO_COLORS = [
  "#4fd1ff",
  "#7c5cff",
  "#39ffc7",
  "#ffb84d",
  "#ff6b9d",
  "#e6f7ff",
];

export const ENV_BACKGROUNDS: Record<EnvPreset, string> = {
  void: "#03060d",
  orbit: "#05101f",
  dusk: "#170f22",
  grid: "#04120f",
  aurora: "#0a0820",
};

export function cloneConfig(c: ModelConfiguration): ModelConfiguration {
  return JSON.parse(JSON.stringify(c));
}

/** Serialize a configuration into a database-safe JSON value. */
export function configToJson(c: ModelConfiguration): Json {
  return JSON.parse(JSON.stringify(c)) as Json;
}


/** Merge a persisted (possibly partial / legacy) payload onto the defaults. */
export function normalizeConfig(raw: unknown): ModelConfiguration {
  const base = cloneConfig(DEFAULT_CONFIG);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ModelConfiguration>;
  return {
    transform: { ...base.transform, ...(r.transform ?? {}) },
    material: { ...base.material, ...(r.material ?? {}) },
    lighting: { ...base.lighting, ...(r.lighting ?? {}) },
    environment: { ...base.environment, ...(r.environment ?? {}) },
    parts: { ...base.parts, ...(r.parts ?? {}) },
  };
}

export function resolveQuality(preset: QualityPreset): "low" | "medium" | "high" {
  if (preset !== "auto") return preset;
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (mobile || cores <= 4) return "low";
  return cores >= 8 ? "high" : "medium";
}
