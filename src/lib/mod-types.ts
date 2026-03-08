export interface ModPlayerConfig {
  speed?: number;
  sprintSpeed?: number;
  jumpForce?: number;
  gravity?: number;
  cameraDistance?: number;
  cameraHeight?: number;
  scale?: number;
}

export interface ModWeatherConfig {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  speed?: number;
  drift?: number;
  opacity?: number;
  direction?: [number, number, number];
  spread?: number;
}

export interface ModTerrainColorConfig {
  colorMultiplier?: { r: number; g: number; b: number };
  saturationShift?: number;
  lightnessShift?: number;
  hueShift?: number;
  waterColor?: string;
  waterOpacity?: number;
  fogColor?: string;
}

export interface ModBiomeEffectConfig {
  objectDensityMultiplier?: number;
  objectScaleMultiplier?: number;
  extraObjectTypes?: string[];
  ambientIntensityMultiplier?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowIntensity?: number;
}

export interface ModCameraConfig {
  fov?: number;
  distance?: number;
  height?: number;
  lerpSpeed?: number;
  minPitch?: number;
  maxPitch?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  firstPerson?: boolean;
}

export interface ModConfig {
  name: string;
  version: string;
  author: string;
  description?: string;
  type: "player" | "weather" | "terrain_color" | "biome_effect" | "camera";
  model?: string;
  textures?: Record<string, string>;
  animations?: Record<string, string>;
  player?: ModPlayerConfig;
  weather?: ModWeatherConfig;
  terrainColor?: ModTerrainColorConfig;
  biomeEffect?: ModBiomeEffectConfig;
  camera?: ModCameraConfig;
}

export interface InstalledMod {
  id: string;
  config: ModConfig;
  enabled: boolean;
  modelUrl?: string;
  createdAt: number;
  source: "local" | "cloud";
}

export interface ModPlayerOverrides {
  speed?: number;
  sprintSpeed?: number;
  jumpForce?: number;
  gravity?: number;
  cameraDistance?: number;
  cameraHeight?: number;
  scale?: number;
  modelUrl?: string;
  modName?: string;
}

export interface ModWeatherOverrides {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  speed?: number;
  drift?: number;
  opacity?: number;
  direction?: [number, number, number];
  spread?: number;
  modName?: string;
}

export interface ModTerrainColorOverrides {
  colorMultiplier?: { r: number; g: number; b: number };
  saturationShift?: number;
  lightnessShift?: number;
  hueShift?: number;
  waterColor?: string;
  waterOpacity?: number;
  fogColor?: string;
  modName?: string;
}

export interface ModBiomeEffectOverrides {
  objectDensityMultiplier?: number;
  objectScaleMultiplier?: number;
  ambientIntensityMultiplier?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  modName?: string;
}

export interface ModCameraOverrides {
  fov?: number;
  distance?: number;
  height?: number;
  lerpSpeed?: number;
  minPitch?: number;
  maxPitch?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  firstPerson?: boolean;
  modName?: string;
}

export const DEFAULT_MOD_CONFIG: ModConfig = {
  name: "Example Player Mod",
  version: "1.0.0",
  author: "Unknown",
  description: "A custom player mod",
  type: "player",
  player: {
    speed: 8,
    sprintSpeed: 14,
    jumpForce: 10,
    gravity: -25,
    cameraDistance: 8,
    cameraHeight: 4,
    scale: 1,
  },
};

export type ModType = ModConfig["type"];

export const MOD_TYPE_LABELS: Record<ModType, string> = {
  player: "Player",
  weather: "Weather",
  terrain_color: "Terrain Color",
  biome_effect: "Biome Effect",
  camera: "Camera",
};

export const MOD_TYPE_EMOJIS: Record<ModType, string> = {
  player: "🏃",
  weather: "🌦️",
  terrain_color: "🎨",
  biome_effect: "✨",
  camera: "📷",
};
