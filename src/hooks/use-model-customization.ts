import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_CONFIG,
  cloneConfig,
  configToJson,
  normalizeConfig,
  type ModelConfiguration,
} from "@/lib/jarvis/config";

const LS_PREFIX = "jarvis-model-config:";
const MAX_HISTORY = 40;

export function useModelCustomization(locationId: string, modelId: string | null) {
  const { user } = useAuth();
  const [config, setConfigState] = useState<ModelConfiguration>(() => cloneConfig(DEFAULT_CONFIG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const past = useRef<ModelConfiguration[]>([]);
  const future = useRef<ModelConfiguration[]>([]);
  const [, force] = useState(0);

  const key = `${LS_PREFIX}${locationId}`;

  // Load persisted configuration (cloud first, local fallback).
  useEffect(() => {
    let active = true;
    past.current = [];
    future.current = [];
    setDirty(false);
    setLoading(true);

    const local = () => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? normalizeConfig(JSON.parse(raw)) : cloneConfig(DEFAULT_CONFIG);
      } catch {
        return cloneConfig(DEFAULT_CONFIG);
      }
    };

    const run = async () => {
      if (!user) {
        if (active) { setConfigState(local()); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("model_customizations")
        .select("configuration")
        .eq("user_id", user.id)
        .eq("location_id", locationId)
        .maybeSingle();
      if (!active) return;
      setConfigState(!error && data?.configuration ? normalizeConfig(data.configuration) : local());
      setLoading(false);
    };

    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, user?.id]);

  const commit = useCallback((next: ModelConfiguration, record = true) => {
    setConfigState((prev) => {
      if (record) {
        past.current = [...past.current.slice(-MAX_HISTORY), cloneConfig(prev)];
        future.current = [];
      }
      return next;
    });
    setDirty(true);
    force((n) => n + 1);
  }, []);

  /** Patch a single section of the configuration. */
  const update = useCallback(
    <K extends keyof ModelConfiguration>(section: K, patch: Partial<ModelConfiguration[K]>) => {
      setConfigState((prev) => {
        past.current = [...past.current.slice(-MAX_HISTORY), cloneConfig(prev)];
        future.current = [];
        return { ...prev, [section]: { ...(prev[section] as object), ...patch } } as ModelConfiguration;
      });
      setDirty(true);
      force((n) => n + 1);
    },
    [],
  );

  const undo = useCallback(() => {
    if (!past.current.length) return;
    setConfigState((prev) => {
      const previous = past.current.pop()!;
      future.current = [cloneConfig(prev), ...future.current].slice(0, MAX_HISTORY);
      return previous;
    });
    setDirty(true);
    force((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    setConfigState((prev) => {
      const [next, ...rest] = future.current;
      future.current = rest;
      past.current = [...past.current, cloneConfig(prev)];
      return next;
    });
    setDirty(true);
    force((n) => n + 1);
  }, []);

  const reset = useCallback(() => commit(cloneConfig(DEFAULT_CONFIG)), [commit]);

  const save = useCallback(async (): Promise<{ error: string | null; cloud: boolean }> => {
    setSaving(true);
    try {
      localStorage.setItem(key, JSON.stringify(config));
      if (!user) return { error: null, cloud: false };
      const { error } = await supabase.from("model_customizations").upsert(
        {
          user_id: user.id,
          location_id: locationId,
          model_id: modelId ?? `${locationId}-model`,
          name: locationId,
          configuration: config as unknown as Record<string, unknown>,
        },
        { onConflict: "user_id,location_id" },
      );
      if (error) return { error: error.message, cloud: false };
      return { error: null, cloud: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Save failed", cloud: false };
    } finally {
      setSaving(false);
      setDirty(false);
    }
  }, [config, key, locationId, modelId, user]);

  return {
    config,
    setConfig: commit,
    update,
    undo,
    redo,
    reset,
    save,
    loading,
    saving,
    dirty,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
