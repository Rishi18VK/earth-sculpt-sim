import { useState, useEffect, useCallback } from "react";
import {
  loadLocalMods,
  saveLocalMod,
  deleteLocalMod,
  updateLocalMod,
  extractModFromZip,
  createModFromFiles,
  getActivePlayerOverrides,
} from "@/lib/mod-loader";
import type { InstalledMod, ModConfig, ModPlayerOverrides } from "@/lib/mod-types";

export function useMods() {
  const [mods, setMods] = useState<InstalledMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mods on mount
  useEffect(() => {
    loadLocalMods()
      .then(setMods)
      .catch((e) => console.error("Failed to load mods:", e))
      .finally(() => setLoading(false));
  }, []);

  const installFromZip = useCallback(async (file: File) => {
    setError(null);
    try {
      const mod = await extractModFromZip(file);
      await saveLocalMod(mod);
      setMods((prev) => [...prev, mod]);
      return mod;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const installFromFiles = useCallback(
    async (configFile: File | null, modelFile: File | null, manualConfig?: Partial<ModConfig>) => {
      setError(null);
      try {
        const mod = await createModFromFiles(configFile, modelFile, manualConfig);
        await saveLocalMod(mod);
        setMods((prev) => [...prev, mod]);
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

      // If enabling a player mod, disable other player mods
      if (!mod.enabled && mod.config.type === "player") {
        return prev.map((m) => ({
          ...m,
          enabled: m.id === id ? true : m.config.type === "player" ? false : m.enabled,
        }));
      }

      return prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    });

    // Persist toggle
    const currentMods = await loadLocalMods();
    const mod = currentMods.find((m) => m.id === id);
    if (mod) {
      await updateLocalMod(id, { enabled: !mod.enabled });
      // Disable other player mods if enabling this one
      if (!mod.enabled && mod.config.type === "player") {
        for (const m of currentMods) {
          if (m.id !== id && m.config.type === "player" && m.enabled) {
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

  const playerOverrides = getActivePlayerOverrides(mods);

  return {
    mods,
    loading,
    error,
    installFromZip,
    installFromFiles,
    toggleMod,
    removeMod,
    playerOverrides,
    clearError: () => setError(null),
  };
}
