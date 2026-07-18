import JSZip from "jszip";
import { get, set, del } from "idb-keyval";
import type {
  ModConfig,
  InstalledMod,
  ModPlayerOverrides,
  ModWeatherOverrides,
  ModTerrainColorOverrides,
  ModBiomeEffectOverrides,
  ModCameraOverrides,
} from "./mod-types";
import { validateModConfig, validateModZip, validateModelFile, MOD_LIMITS } from "./mod-validation";

const MOD_STORE_PREFIX = "terracraft_mod_";
const MOD_LIST_KEY = "terracraft_mod_list";
const MOD_BLOB_PREFIX = "terracraft_mod_blob_";

// ---- IndexedDB Local Storage ----

async function getModList(): Promise<string[]> {
  return (await get(MOD_LIST_KEY)) || [];
}

async function setModList(ids: string[]): Promise<void> {
  await set(MOD_LIST_KEY, ids);
}

export async function loadLocalMods(): Promise<InstalledMod[]> {
  const ids = await getModList();
  const mods: InstalledMod[] = [];
  for (const id of ids) {
    const mod = await get<InstalledMod>(`${MOD_STORE_PREFIX}${id}`);
    if (mod) {
      const blobData = await get<Blob>(`${MOD_BLOB_PREFIX}${id}`);
      if (blobData) {
        mod.modelUrl = URL.createObjectURL(blobData);
      } else {
        mod.modelUrl = undefined;
      }
      mods.push(mod);
    }
  }
  return mods;
}

export async function saveLocalMod(mod: InstalledMod, modelBlob?: Blob): Promise<void> {
  const modToStore = { ...mod, modelUrl: modelBlob ? "has_blob" : undefined };
  await set(`${MOD_STORE_PREFIX}${mod.id}`, modToStore);
  if (modelBlob) {
    await set(`${MOD_BLOB_PREFIX}${mod.id}`, modelBlob);
  }
  const ids = await getModList();
  if (!ids.includes(mod.id)) {
    ids.push(mod.id);
    await setModList(ids);
  }
}

export async function deleteLocalMod(id: string): Promise<void> {
  await del(`${MOD_STORE_PREFIX}${id}`);
  await del(`${MOD_BLOB_PREFIX}${id}`);
  const ids = await getModList();
  await setModList(ids.filter((i) => i !== id));
}

export async function updateLocalMod(id: string, updates: Partial<InstalledMod>): Promise<void> {
  const mod = await get<InstalledMod>(`${MOD_STORE_PREFIX}${id}`);
  if (mod) {
    await set(`${MOD_STORE_PREFIX}${id}`, { ...mod, ...updates });
  }
}

// ---- ZIP Extraction ----

export async function extractModFromZip(file: File): Promise<{ mod: InstalledMod; modelBlob?: Blob }> {
  const zip = await JSZip.loadAsync(file);

  let modJsonFile: JSZip.JSZipObject | null = null;
  let basePath = "";

  zip.forEach((relativePath, zipEntry) => {
    if (relativePath.endsWith("mod.json") && !modJsonFile) {
      modJsonFile = zipEntry;
      basePath = relativePath.replace("mod.json", "");
    }
  });

  if (!modJsonFile) {
    throw new Error("No mod.json found in ZIP file. Please include a mod.json configuration file.");
  }

  const configText = await (modJsonFile as JSZip.JSZipObject).async("text");
  let config: ModConfig;

  try {
    config = JSON.parse(configText);
  } catch {
    throw new Error("Invalid mod.json: Could not parse JSON.");
  }

  if (!config.name || !config.type) {
    throw new Error("Invalid mod.json: Missing required 'name' or 'type' field.");
  }

  if (!VALID_MOD_TYPES.includes(config.type)) {
    throw new Error(`Unsupported mod type: "${config.type}". Supported types: ${VALID_MOD_TYPES.join(", ")}`);
  }

  let modelBlob: Blob | undefined;
  let modelUrl: string | undefined;
  const modelExtensions = [".glb", ".gltf", ".obj"];

  if (config.model) {
    const modelFile = zip.file(basePath + config.model);
    if (modelFile) {
      modelBlob = await modelFile.async("blob");
      modelUrl = URL.createObjectURL(modelBlob);
    }
  }

  if (!modelBlob) {
    for (const [path, entry] of Object.entries(zip.files) as [string, any][]) {
      if (!entry.dir && modelExtensions.some((ext: string) => path.toLowerCase().endsWith(ext))) {
        modelBlob = await entry.async("blob");
        modelUrl = URL.createObjectURL(modelBlob);
        break;
      }
    }
  }

  const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    mod: { id, config, enabled: true, modelUrl, createdAt: Date.now(), source: "local" },
    modelBlob,
  };
}

// ---- Individual File Upload ----

export async function createModFromFiles(
  configFile: File | null,
  modelFile: File | null,
  manualConfig?: Partial<ModConfig>
): Promise<{ mod: InstalledMod; modelBlob?: Blob }> {
  let config: ModConfig;

  if (configFile) {
    const text = await configFile.text();
    try {
      config = JSON.parse(text);
    } catch {
      throw new Error("Invalid mod.json file.");
    }
  } else if (manualConfig) {
    config = {
      name: manualConfig.name || "Custom Mod",
      version: manualConfig.version || "1.0.0",
      author: manualConfig.author || "Unknown",
      description: manualConfig.description || "",
      type: manualConfig.type || "player",
      player: manualConfig.player,
      weather: manualConfig.weather,
      terrainColor: manualConfig.terrainColor,
      biomeEffect: manualConfig.biomeEffect,
      camera: manualConfig.camera,
    };
  } else {
    throw new Error("Either a config file or manual configuration is required.");
  }

  let modelBlob: Blob | undefined;
  let modelUrl: string | undefined;
  if (modelFile) {
    const validExts = [".glb", ".gltf", ".obj"];
    const ext = modelFile.name.toLowerCase().slice(modelFile.name.lastIndexOf("."));
    if (!validExts.includes(ext)) {
      throw new Error(`Unsupported model format: ${ext}. Use GLB, GLTF, or OBJ.`);
    }
    modelBlob = modelFile;
    modelUrl = URL.createObjectURL(modelFile);
  }

  const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    mod: { id, config, enabled: true, modelUrl, createdAt: Date.now(), source: "local" },
    modelBlob,
  };
}

// ---- Create mod from preset config (no files) ----

export function createModFromPreset(config: ModConfig): InstalledMod {
  const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    config,
    enabled: true,
    createdAt: Date.now(),
    source: "local",
  };
}

// ---- Get active overrides by type ----

export function getActivePlayerOverrides(mods: InstalledMod[]): ModPlayerOverrides | null {
  const activeMod = mods.find((m) => m.enabled && m.config.type === "player");
  if (!activeMod) return null;
  return {
    speed: activeMod.config.player?.speed,
    sprintSpeed: activeMod.config.player?.sprintSpeed,
    jumpForce: activeMod.config.player?.jumpForce,
    gravity: activeMod.config.player?.gravity,
    cameraDistance: activeMod.config.player?.cameraDistance,
    cameraHeight: activeMod.config.player?.cameraHeight,
    scale: activeMod.config.player?.scale,
    modelUrl: activeMod.modelUrl,
    modName: activeMod.config.name,
  };
}

export function getActiveWeatherOverrides(mods: InstalledMod[]): ModWeatherOverrides | null {
  const activeMod = mods.find((m) => m.enabled && m.config.type === "weather");
  if (!activeMod || !activeMod.config.weather) return null;
  return { ...activeMod.config.weather, modName: activeMod.config.name };
}

export function getActiveTerrainColorOverrides(mods: InstalledMod[]): ModTerrainColorOverrides | null {
  const activeMod = mods.find((m) => m.enabled && m.config.type === "terrain_color");
  if (!activeMod || !activeMod.config.terrainColor) return null;
  return { ...activeMod.config.terrainColor, modName: activeMod.config.name };
}

export function getActiveBiomeEffectOverrides(mods: InstalledMod[]): ModBiomeEffectOverrides | null {
  const activeMod = mods.find((m) => m.enabled && m.config.type === "biome_effect");
  if (!activeMod || !activeMod.config.biomeEffect) return null;
  return { ...activeMod.config.biomeEffect, modName: activeMod.config.name };
}

export function getActiveCameraOverrides(mods: InstalledMod[]): ModCameraOverrides | null {
  const activeMod = mods.find((m) => m.enabled && m.config.type === "camera");
  if (!activeMod || !activeMod.config.camera) return null;
  return { ...activeMod.config.camera, modName: activeMod.config.name };
}
