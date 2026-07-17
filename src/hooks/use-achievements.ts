import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export function useAchievements() {
  const { user } = useAuth();
  const [all, setAll] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: catalog } = await supabase.from("achievements").select("*").order("xp_reward");
      setAll(catalog || []);
      if (user) {
        const { data: mine } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id);
        setUnlockedIds(new Set((mine || []).map(r => r.achievement_id)));
      }
      setLoading(false);
    })();
  }, [user]);

  const unlock = useCallback(async (code: string) => {
    if (!user) return null;
    const ach = all.find(a => a.code === code);
    if (!ach || unlockedIds.has(ach.id)) return null;
    const { error } = await supabase.from("user_achievements").insert({ user_id: user.id, achievement_id: ach.id });
    if (error) return null;
    setUnlockedIds(prev => new Set(prev).add(ach.id));
    return ach;
  }, [user, all, unlockedIds]);

  return { all, unlockedIds, loading, unlock };
}
