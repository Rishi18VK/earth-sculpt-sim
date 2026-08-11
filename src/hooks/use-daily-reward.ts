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

  /** Eligibility, the server date and the XP grant are all enforced server-side. */
  const claim = useCallback(async (): Promise<number | null> => {
    if (!user || !available || claiming) return null;
    setClaiming(true);
    const { data, error } = await supabase.functions.invoke("game-progress", {
      body: { action: "claim_daily_reward" },
    });
    setClaiming(false);
    if (error) { setAvailable(false); return null; }
    setAvailable(false);
    return data?.awarded ?? REWARD_XP;
  }, [user, available, claiming]);

  return { available, claim, claiming, rewardXp: REWARD_XP };
}
