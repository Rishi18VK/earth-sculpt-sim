import type { ModConfig } from "./mod-types";

export interface ModPreset {
  id: string;
  emoji: string;
  config: ModConfig;
}

export const MOD_PRESETS: ModPreset[] = [
  {
    id: "fast-runner",
    emoji: "🏃",
    config: {
      name: "Fast Runner",
      version: "1.0.0",
      author: "TerraCraft",
      description: "Double movement speed and sprint for exploring large terrains quickly.",
      type: "player",
      player: {
        speed: 16,
        sprintSpeed: 28,
        jumpForce: 10,
        gravity: -25,
        scale: 1,
      },
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
      player: {
        speed: 8,
        sprintSpeed: 14,
        jumpForce: 25,
        gravity: -15,
        scale: 1,
      },
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
      player: {
        speed: 12,
        sprintSpeed: 20,
        jumpForce: 15,
        gravity: -30,
        scale: 3,
        cameraDistance: 16,
        cameraHeight: 8,
      },
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
      player: {
        speed: 6,
        sprintSpeed: 10,
        jumpForce: 8,
        gravity: -20,
        scale: 0.5,
        cameraDistance: 4,
        cameraHeight: 2,
      },
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
      player: {
        speed: 10,
        sprintSpeed: 18,
        jumpForce: 20,
        gravity: -5,
        scale: 1,
      },
    },
  },
];
