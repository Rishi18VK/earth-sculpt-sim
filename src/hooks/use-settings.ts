import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppSettings {
  graphics: "low" | "medium" | "high" | "ultra";
  fps_limit: 30 | 60 | 120 | 0;
  music_volume: number;
  sfx_volume: number;
  language: "en" | "hi" | "es";
  theme: "dark" | "light" | "system";
  reduced_motion: boolean;
  high_contrast: boolean;
  larger_text: boolean;
}

const DEFAULTS: AppSettings = {
  graphics: "medium",
  fps_limit: 60,
  music_volume: 0.7,
  sfx_volume: 0.8,
  language: "en",
  theme: "dark",
  reduced_motion: false,
  high_contrast: false,
  larger_text: false,
};

const LS_KEY = "terra-settings-v1";

function readLocal(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}

function applyThemeAndA11y(s: AppSettings) {
  const root = document.documentElement;
  const wantDark = s.theme === "dark" || (s.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", wantDark);
  root.classList.toggle("reduce-motion", s.reduced_motion);
  root.style.fontSize = s.larger_text ? "17px" : "";
  root.style.filter = s.high_contrast ? "contrast(1.15)" : "";
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(readLocal);
  const [loading, setLoading] = useState(false);

  useEffect(() => { applyThemeAndA11y(settings); }, [settings]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const merged: AppSettings = {
            graphics: (data.graphics as any) || DEFAULTS.graphics,
            fps_limit: (data.fps_limit as any) || DEFAULTS.fps_limit,
            music_volume: Number(data.music_volume ?? DEFAULTS.music_volume),
            sfx_volume: Number(data.sfx_volume ?? DEFAULTS.sfx_volume),
            language: (data.language as any) || DEFAULTS.language,
            theme: (data.theme as any) || DEFAULTS.theme,
            reduced_motion: !!data.reduced_motion,
            high_contrast: !!data.high_contrast,
            larger_text: !!data.larger_text,
          };
          setSettings(merged);
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
        }
      })
      .then(() => setLoading(false));
  }, [user]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    if (user) {
      await supabase.from("user_settings").upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    }
  }, [user]);

  return { settings, update, loading };
}
