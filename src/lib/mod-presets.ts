import type { ModConfig, ModType } from "./mod-types";

export interface ModPreset {
  id: string;
  emoji: string;
  config: ModConfig;
}

export const MOD_PRESETS: ModPreset[] = [
  // ── Player Presets ──
  {
    id: "fast-runner",
    emoji: "🏃",
    config: {
      name: "Fast Runner",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Double movement speed and sprint for exploring large terrains quickly.",
      type: "player",
      player: { speed: 16, sprintSpeed: 28, jumpForce: 10, gravity: -25, scale: 1 },
    },
  },
  {
    id: "super-jumper",
    emoji: "🦘",
    config: {
      name: "Super Jumper",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Massive jump force with reduced gravity for moon-like leaps across the terrain.",
      type: "player",
      player: { speed: 8, sprintSpeed: 14, jumpForce: 25, gravity: -15, scale: 1 },
    },
  },
  {
    id: "giant-player",
    emoji: "🗿",
    config: {
      name: "Giant Player",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Towering 3x scale with a wide camera view. Stomp across the landscape!",
      type: "player",
      player: { speed: 12, sprintSpeed: 20, jumpForce: 15, gravity: -30, scale: 3, cameraDistance: 16, cameraHeight: 8 },
    },
  },
  {
    id: "tiny-explorer",
    emoji: "🐜",
    config: {
      name: "Tiny Explorer",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Shrink to half size with a close camera. See the terrain from an ant's perspective.",
      type: "player",
      player: { speed: 6, sprintSpeed: 10, jumpForce: 8, gravity: -20, scale: 0.5, cameraDistance: 4, cameraHeight: 2 },
    },
  },
  {
    id: "zero-gravity",
    emoji: "🚀",
    config: {
      name: "Zero Gravity",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Float through the air with near-zero gravity and boosted jumps.",
      type: "player",
      player: { speed: 10, sprintSpeed: 18, jumpForce: 20, gravity: -5, scale: 1 },
    },
  },

  // ── Weather Presets ──
  {
    id: "meteor-shower",
    emoji: "☄️",
    config: {
      name: "Meteor Shower",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Fiery particles streaking from the sky like tiny meteors.",
      type: "weather",
      weather: { particleCount: 800, particleColor: "#ff6633", particleSize: 0.2, speed: 3.0, drift: 0.3, opacity: 0.9, direction: [0.5, -1, 0.2] },
    },
  },
  {
    id: "aurora-snow",
    emoji: "🌌",
    config: {
      name: "Aurora Snow",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Gentle green-tinted snow with an aurora-like glow effect.",
      type: "weather",
      weather: { particleCount: 2000, particleColor: "#66ffaa", particleSize: 0.12, speed: 0.5, drift: 0.8, opacity: 0.7, direction: [0.1, -0.6, 0.3] },
    },
  },
  {
    id: "heavy-rain",
    emoji: "🌧️",
    config: {
      name: "Heavy Rain",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Dense downpour with fast-falling rain streaks across any biome.",
      type: "weather",
      weather: { particleCount: 3000, particleColor: "#aaccff", particleSize: 0.03, speed: 4.0, drift: 0.05, opacity: 0.5, direction: [0.1, -1, 0.05] },
    },
  },
  {
    id: "golden-dust",
    emoji: "✨",
    config: {
      name: "Golden Dust",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Magical golden particles floating gently upward.",
      type: "weather",
      weather: { particleCount: 1000, particleColor: "#ffcc44", particleSize: 0.08, speed: 0.3, drift: 1.0, opacity: 0.6, direction: [0.2, 0.3, 0.1] },
    },
  },

  // ── Terrain Color Presets ──
  {
    id: "neon-world",
    emoji: "💜",
    config: {
      name: "Neon World",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Shift terrain hues to vivid neon colors with boosted saturation.",
      type: "terrain_color",
      terrainColor: { hueShift: 0.4, saturationShift: 0.3, lightnessShift: 0.05, waterColor: "#ff00ff", waterOpacity: 0.7, fogColor: "#2a0040" },
    },
  },
  {
    id: "grayscale",
    emoji: "🖤",
    config: {
      name: "Grayscale",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Strip all color from the terrain for a monochrome noir look.",
      type: "terrain_color",
      terrainColor: { saturationShift: -1.0, lightnessShift: 0, waterColor: "#444444", waterOpacity: 0.5, fogColor: "#888888" },
    },
  },
  {
    id: "sunset-palette",
    emoji: "🌅",
    config: {
      name: "Sunset Palette",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Warm orange and pink tones across the entire terrain.",
      type: "terrain_color",
      terrainColor: { hueShift: -0.15, saturationShift: 0.1, lightnessShift: 0.05, waterColor: "#cc6644", waterOpacity: 0.6, fogColor: "#e8a060" },
    },
  },
  {
    id: "alien-green",
    emoji: "👽",
    config: {
      name: "Alien Green",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Eerie green-shifted terrain like an alien planet.",
      type: "terrain_color",
      terrainColor: { hueShift: 0.25, saturationShift: 0.15, lightnessShift: -0.05, waterColor: "#00aa44", waterOpacity: 0.7, fogColor: "#224422" },
    },
  },

  // ── Biome Effect Presets ──
  {
    id: "dense-forest",
    emoji: "🌲",
    config: {
      name: "Dense Forest",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Triple the density of biome objects for a lush, packed landscape.",
      type: "biome_effect",
      biomeEffect: { objectDensityMultiplier: 3.0, objectScaleMultiplier: 1.0, ambientIntensityMultiplier: 0.7 },
    },
  },
  {
    id: "giant-objects",
    emoji: "🍄",
    config: {
      name: "Giant Objects",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Everything is oversized! Trees, rocks, and crystals grow to 2.5x their normal scale.",
      type: "biome_effect",
      biomeEffect: { objectDensityMultiplier: 1.0, objectScaleMultiplier: 2.5, ambientIntensityMultiplier: 1.0 },
    },
  },
  {
    id: "glow-world",
    emoji: "💡",
    config: {
      name: "Glow World",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Add a soft ambient glow to the entire scene with increased light.",
      type: "biome_effect",
      biomeEffect: { objectDensityMultiplier: 1.0, objectScaleMultiplier: 1.0, ambientIntensityMultiplier: 2.0, glowEnabled: true, glowColor: "#4488ff", glowIntensity: 0.5 },
    },
  },
  {
    id: "barren-wasteland",
    emoji: "💀",
    config: {
      name: "Barren Wasteland",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Strip away most biome objects for a desolate, empty world.",
      type: "biome_effect",
      biomeEffect: { objectDensityMultiplier: 0.15, objectScaleMultiplier: 0.7, ambientIntensityMultiplier: 0.5 },
    },
  },

  // ── Camera Presets ──
  {
    id: "first-person",
    emoji: "👁️",
    config: {
      name: "First Person",
      version: "1.0.0",
      author: "TerraCraft",
      description: "See through the player's eyes with a first-person camera view.",
      type: "camera",
      camera: { firstPerson: true, fov: 90 },
    },
  },
  {
    id: "drone-view",
    emoji: "🚁",
    config: {
      name: "Drone View",
      version: "1.0.0",
      author: "TerraCraft",
      description: "High overhead camera with wide FOV, like a drone following you.",
      type: "camera",
      camera: { distance: 20, height: 15, fov: 75, lerpSpeed: 3 },
    },
  },
  {
    id: "cinematic",
    emoji: "🎬",
    config: {
      name: "Cinematic",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Low, close camera with narrow FOV for dramatic cinematic framing.",
      type: "camera",
      camera: { distance: 5, height: 2, fov: 45, lerpSpeed: 2 },
    },
  },
  {
    id: "orbit-cam",
    emoji: "🔄",
    config: {
      name: "Auto Orbit",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Camera slowly orbits around the player automatically.",
      type: "camera",
      camera: { distance: 10, height: 5, autoRotate: true, autoRotateSpeed: 1.5 },
    },
  },
];

export function getPresetsByType(type: ModConfig["type"]): ModPreset[] {
  return MOD_PRESETS.filter((p) => p.config.type === type);
}
