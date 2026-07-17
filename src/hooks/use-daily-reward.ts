import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const REWARD_XP = 50;

export function useDailyReward() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const check = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("daily_rewards_log").select("id").eq("user_id", user.id).eq("day", today).maybeSingle();
    setAvailable(!data);
  }, [user]);

  useEffect(() => { check(); }, [check]);

  const claim = useCallback(async (): Promise<number | null> => {
    if (!user || !available || claiming) return null;
    setClaiming(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("daily_rewards_log").insert({ user_id: user.id, day: today, reward_type: "xp", amount: REWARD_XP });
    setClaiming(false);
    if (error) return null;
    // add xp
    const { data: prog } = await supabase.from("user_progress").select("xp").eq("user_id", user.id).maybeSingle();
    const newXp = (prog?.xp ?? 0) + REWARD_XP;
    await supabase.from("user_progress").upsert({ user_id: user.id, xp: newXp }, { onConflict: "user_id" });
    setAvailable(false);
    return REWARD_XP;
  }, [user, available, claiming]);

  return { available, claim, claiming, rewardXp: REWARD_XP };
}
