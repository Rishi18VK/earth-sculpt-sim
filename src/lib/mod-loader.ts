import JSZip from "jszip";
import { get, set, del, keys, entries } from "idb-keyval";
import type { ModConfig, InstalledMod } from "./mod-types";

const MOD_STORE_PREFIX = "terracraft_mod_";
const MOD_LIST_KEY = "terracraft_mod_list";

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
    if (mod) mods.push(mod);
  }
  return mods;
}

export async function saveLocalMod(mod: InstalledMod): Promise<void> {
  await set(`${MOD_STORE_PREFIX}${mod.id}`, mod);
  const ids = await getModList();
  if (!ids.includes(mod.id)) {
    ids.push(mod.id);
    await setModList(ids);
  }
}

export async function deleteLocalMod(id: string): Promise<void> {
  const mod = await get<InstalledMod>(`${MOD_STORE_PREFIX}${id}`);
  if (mod?.modelUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(mod.modelUrl);
  }
  await del(`${MOD_STORE_PREFIX}${id}`);
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

export async function extractModFromZip(file: File): Promise<InstalledMod> {
  const zip = await JSZip.loadAsync(file);

  // Find mod.json - could be at root or in a subfolder
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

  if (config.type !== "player") {
    throw new Error(`Unsupported mod type: "${config.type}". Only "player" mods are supported.`);
  }

  // Extract model file
  let modelUrl: string | undefined;
  const modelExtensions = [".glb", ".gltf", ".obj"];

  // Try explicit model path from config first
  if (config.model) {
    const modelFile = zip.file(basePath + config.model);
    if (modelFile) {
      const blob = await modelFile.async("blob");
      modelUrl = URL.createObjectURL(blob);
    }
  }

  // Fallback: find any model file
  if (!modelUrl) {
  for (const [path, entry] of Object.entries(zip.files) as [string, any][]) {
      if (!entry.dir && modelExtensions.some((ext: string) => path.toLowerCase().endsWith(ext))) {
        const blob = await entry.async("blob");
        modelUrl = URL.createObjectURL(blob);
        break;
      }
    }
  }

  const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    config,
    enabled: true,
    modelUrl,
    createdAt: Date.now(),
    source: "local",
  };
}

// ---- Individual File Upload ----

export async function createModFromFiles(
  configFile: File | null,
  modelFile: File | null,
  manualConfig?: Partial<ModConfig>
): Promise<InstalledMod> {
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
      type: "player",
      player: manualConfig.player,
    };
  } else {
    throw new Error("Either a config file or manual configuration is required.");
  }

  let modelUrl: string | undefined;
  if (modelFile) {
    const validExts = [".glb", ".gltf", ".obj"];
    const ext = modelFile.name.toLowerCase().slice(modelFile.name.lastIndexOf("."));
    if (!validExts.includes(ext)) {
      throw new Error(`Unsupported model format: ${ext}. Use GLB, GLTF, or OBJ.`);
    }
    modelUrl = URL.createObjectURL(modelFile);
  }

  const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    config,
    enabled: true,
    modelUrl,
    createdAt: Date.now(),
    source: "local",
  };
}

// ---- Get active player mod overrides ----

export function getActivePlayerOverrides(mods: InstalledMod[]) {
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
