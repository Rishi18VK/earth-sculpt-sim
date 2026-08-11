import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { levelFromXp } from "@/lib/tier-utils";

/** Server-known XP actions. The client never sends an amount. */
export type XpAction =
  | "terrain_generated"
  | "collectible_found"
  | "landmark_visited"
  | "screenshot_shared"
  | "mod_published";

export function useProgress() {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("user_progress").select("xp,level").eq("user_id", user.id).maybeSingle();
    if (data) {
      setXp(data.xp);
      setLevel(data.level);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  /** XP is computed and written server-side; the client only names the action. */
  const awardXp = useCallback(async (reason: XpAction) => {
    if (!user) return;
    const { data, error } = await supabase.functions.invoke("game-progress", {
      body: { action: "award_xp", reason },
    });
    if (error) return;
    if (data?.xp != null) { setXp(data.xp); setLevel(data.level); }
  }, [user]);

  const breakdown = levelFromXp(xp);
  return { xp, level, loading, awardXp, refresh, into: breakdown.into, needed: breakdown.needed };
}
