import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { levelFromXp } from "@/lib/tier-utils";

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

  const awardXp = useCallback(async (amount: number) => {
    if (!user) return;
    const newXp = xp + amount;
    const { level: lvl } = levelFromXp(newXp);
    setXp(newXp); setLevel(lvl);
    await supabase.from("user_progress").upsert({ user_id: user.id, xp: newXp, level: lvl }, { onConflict: "user_id" });
  }, [user, xp]);

  const breakdown = levelFromXp(xp);
  return { xp, level, loading, awardXp, refresh, into: breakdown.into, needed: breakdown.needed };
}
