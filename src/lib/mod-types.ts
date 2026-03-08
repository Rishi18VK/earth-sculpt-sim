export interface ModConfig {
  name: string;
  version: string;
  author: string;
  description?: string;
  type: "player";
  model?: string; // relative path to GLB/GLTF/OBJ
  textures?: Record<string, string>;
  animations?: Record<string, string>;
  player?: {
    speed?: number;
    sprintSpeed?: number;
    jumpForce?: number;
    gravity?: number;
    cameraDistance?: number;
    cameraHeight?: number;
    scale?: number;
  };
}

export interface InstalledMod {
  id: string;
  config: ModConfig;
  enabled: boolean;
  modelUrl?: string; // object URL or storage URL for the 3D model
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
