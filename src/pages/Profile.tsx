import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Settings as SettingsIcon, Trophy, Sparkles, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/hooks/use-progress";
import { useAchievements } from "@/hooks/use-achievements";
import { useMods } from "@/hooks/use-mods";
import { supabase } from "@/integrations/supabase/client";
import { tierFor, TIER_META } from "@/lib/tier-utils";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { user, signOut, isGuest, continueAsGuest } = useAuth();
  const nav = useNavigate();
  const { xp, level, into, needed } = useProgress();
  const { all, unlockedIds } = useAchievements();
  const { mods } = useMods();

  const [profile, setProfile] = useState<{ display_name?: string | null; avatar_url?: string | null; bio?: string | null } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [donations, setDonations] = useState<{ amount: number; created_at: string; message: string | null }[]>([]);
  const [lifetime, setLifetime] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name,avatar_url,bio").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("user_stats").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setStats(data));
    supabase.from("donations").select("amount,created_at,message").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      const rows = data || [];
      setDonations(rows.slice(0, 5));
      setLifetime(rows.reduce((s, r) => s + Number(r.amount || 0), 0));
    });
  }, [user]);

  if (!user && !isGuest) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10 text-center space-y-4">
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Track XP, badges and donations across devices.</p>
        <Button onClick={() => nav("/auth")} className="w-full h-12 rounded-2xl premium-gradient border-0 text-white">Sign in / create account</Button>
        <button onClick={() => continueAsGuest()} className="text-sm text-muted-foreground underline">Continue as guest</button>
      </div>
    );
  }

  const tier = tierFor(lifetime);
  const tierMeta = TIER_META[tier];
  const name = profile?.display_name || user?.email?.split("@")[0] || "Guest";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
      {/* Header card */}
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full premium-gradient opacity-25 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl premium-gradient flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover rounded-2xl" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{name}</h1>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? "Guest mode"}</p>
            <span className={cn("inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full", tierMeta.className)}>
              {tierMeta.emoji} {tierMeta.label}
            </span>
          </div>
        </div>

        {user && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold">Level {level}</span>
              <span className="text-muted-foreground">{into} / {needed} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full premium-gradient" style={{ width: `${(into / needed) * 100}%` }} />
            </div>
          </div>
        )}
      </motion.header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Terrains" value={stats.terrains_generated} />
          <MiniStat label="Distance" value={`${Math.round(stats.distance_explored)}m`} />
          <MiniStat label="Collected" value={stats.collectibles_found} />
        </div>
      )}

      {/* Achievements */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Achievements</h2>
          <span className="text-xs text-muted-foreground">{unlockedIds.size}/{all.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {all.slice(0, 8).map(a => {
            const got = unlockedIds.has(a.id);
            return (
              <div key={a.id} title={`${a.title} — ${a.description}`} className={cn(
                "glass-card rounded-xl p-3 text-center aspect-square flex flex-col items-center justify-center",
                !got && "opacity-40 grayscale"
              )}>
                <div className="text-2xl">{a.icon}</div>
                <p className="text-[9px] font-semibold mt-1 leading-tight line-clamp-2">{a.title}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Donations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold flex items-center gap-1.5"><Heart className="h-4 w-4" /> Donations</h2>
          <button onClick={() => nav("/support")} className="text-xs text-primary font-semibold">Support</button>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Lifetime</p>
          <p className="text-2xl font-extrabold text-amount">₹{lifetime}</p>
          {donations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No donations yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {donations.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-xs border-t border-border/40 pt-1.5">
                  <span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold text-amount">₹{d.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Mods */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold flex items-center gap-1.5"><Package className="h-4 w-4" /> Mods</h2>
          <button onClick={() => nav("/mods")} className="text-xs text-primary font-semibold">Manage</button>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm">{mods.length} installed · {mods.filter(m => m.enabled).length} enabled</p>
        </div>
      </section>

      {/* Settings + sign out */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => nav("/settings")} className="rounded-xl h-11 gap-2 glass-card border-border/40">
          <SettingsIcon className="h-4 w-4" /> Settings
        </Button>
        {user ? (
          <Button variant="outline" onClick={signOut} className="rounded-xl h-11 gap-2 glass-card border-border/40">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        ) : (
          <Button onClick={() => nav("/auth")} className="rounded-xl h-11 premium-gradient border-0 text-white gap-2">
            <Sparkles className="h-4 w-4" /> Sign in
          </Button>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass-card rounded-2xl p-3 text-center">
      <p className="text-base font-extrabold text-amount">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
