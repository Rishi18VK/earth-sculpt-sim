import { useState, useEffect, useCallback } from "react";
import {
  loadLocalMods,
  saveLocalMod,
  deleteLocalMod,
  updateLocalMod,
  extractModFromZip,
  createModFromFiles,
  createModFromPreset,
  getActivePlayerOverrides,
  getActiveWeatherOverrides,
  getActiveTerrainColorOverrides,
  getActiveBiomeEffectOverrides,
  getActiveCameraOverrides,
} from "@/lib/mod-loader";
import type { InstalledMod, ModConfig, ModType } from "@/lib/mod-types";

export function useMods() {
  const [mods, setMods] = useState<InstalledMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadLocalMods()
      .then(setMods)
      .catch((e) => console.error("Failed to load mods:", e))
      .finally(() => setLoading(false));
  }, []);

  const installFromZip = useCallback(async (file: File) => {
    setError(null);
    setWarnings([]);
    try {
      const { mod, modelBlob, warnings: w } = await extractModFromZip(file);
      await saveLocalMod(mod, modelBlob);
      setMods((prev) => [...prev, mod]);
      if (w.length) setWarnings(w);
      return mod;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const installFromFiles = useCallback(
    async (configFile: File | null, modelFile: File | null, manualConfig?: Partial<ModConfig>) => {
      setError(null);
      setWarnings([]);
      try {
        const { mod, modelBlob, warnings: w } = await createModFromFiles(configFile, modelFile, manualConfig);
        await saveLocalMod(mod, modelBlob);
        setMods((prev) => [...prev, mod]);
        if (w.length) setWarnings(w);
        return mod;
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const toggleMod = useCallback(async (id: string) => {
    setMods((prev) => {
      const mod = prev.find((m) => m.id === id);
      if (!mod) return prev;

      // If enabling, disable other mods of the same type
      if (!mod.enabled) {
        return prev.map((m) => ({
          ...m,
          enabled: m.id === id ? true : m.config.type === mod.config.type ? false : m.enabled,
        }));
      }

      return prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    });

    // Persist
    const currentMods = await loadLocalMods();
    const mod = currentMods.find((m) => m.id === id);
    if (mod) {
      await updateLocalMod(id, { enabled: !mod.enabled });
      if (!mod.enabled) {
        for (const m of currentMods) {
          if (m.id !== id && m.config.type === mod.config.type && m.enabled) {
            await updateLocalMod(m.id, { enabled: false });
          }
        }
      }
    }
  }, []);

  const removeMod = useCallback(async (id: string) => {
    await deleteLocalMod(id);
    setMods((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const installPreset = useCallback(async (config: ModConfig) => {
    setError(null);
    try {
      const mod = createModFromPreset(config);
      await saveLocalMod(mod);
      setMods((prev) => [...prev, mod]);
      return mod;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const playerOverrides = getActivePlayerOverrides(mods);
  const weatherOverrides = getActiveWeatherOverrides(mods);
  const terrainColorOverrides = getActiveTerrainColorOverrides(mods);
  const biomeEffectOverrides = getActiveBiomeEffectOverrides(mods);
  const cameraOverrides = getActiveCameraOverrides(mods);

  return {
    mods,
    loading,
    error,
    installFromZip,
    installFromFiles,
    installPreset,
    toggleMod,
    removeMod,
    playerOverrides,
    weatherOverrides,
    terrainColorOverrides,
    biomeEffectOverrides,
    cameraOverrides,
    clearError: () => setError(null),
  };
}
