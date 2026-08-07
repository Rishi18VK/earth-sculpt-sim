import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Camera, Users, Crown, Medal, Heart, Share2, MapPin, Flame, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAsyncData } from "@/hooks/use-async-data";
import {
  fetchLeaderboard,
  fetchScreenshots,
  fetchCreators,
  fetchAchievements,
  fetchCommunityStats,
  toggleLike,
  shareScreenshot,
} from "@/lib/community-data";

const TIERS = {
  bronze: "from-amber-700/40 to-amber-900/40 text-amber-200 border-amber-600/40",
  silver: "from-slate-400/30 to-slate-600/30 text-slate-100 border-slate-300/30",
  gold: "from-yellow-400/40 to-orange-500/30 text-yellow-100 border-yellow-400/40",
  platinum: "from-cyan-300/40 to-fuchsia-400/40 text-white border-cyan-300/40",
} as const;

type Tier = keyof typeof TIERS;
const tierFor = (level: number): Tier =>
  level >= 40 ? "platinum" : level >= 25 ? "gold" : level >= 10 ? "silver" : "bronze";

const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);

export default function Community() {
  const leaderboard = useAsyncData(() => fetchLeaderboard(20));
  const shotsQuery = useAsyncData(fetchScreenshots);
  const creators = useAsyncData(fetchCreators);
  const achievements = useAsyncData(fetchAchievements);
  const stats = useAsyncData(fetchCommunityStats);

  const ranked = useMemo(() => leaderboard.data ?? [], [leaderboard.data]);
  const shots = shotsQuery.data ?? [];

  const [shareOpen, setShareOpen] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", biome: "" });
  const [saving, setSaving] = useState(false);

  const like = async (id: string, liked: boolean) => {
    try {
      await toggleLike(id, liked);
      shotsQuery.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update like");
    }
  };

  const submitShot = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Title and image URL are required");
      return;
    }
    setSaving(true);
    try {
      await shareScreenshot({
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        biome: form.biome.trim() || "unknown",
      });
      toast.success("Screenshot shared");
      setForm({ title: "", imageUrl: "", biome: "" });
      setShareOpen(false);
      shotsQuery.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share screenshot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-6 md:p-10 mb-6 md:mb-10 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full premium-gradient opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3 rounded-full bg-white/5 border-white/10 gap-1.5">
              <Sparkles className="h-3 w-3" /> Community
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Where explorers meet.</h1>
            <p className="text-muted-foreground md:text-lg">
              Climb the global leaderboard, share your most breathtaking finds, and follow the creators redefining Terra Explorer.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <Stat icon={<Users className="h-4 w-4" />} label="Explorers" value={compact(stats.data?.explorers ?? 0)} />
            <Stat icon={<Camera className="h-4 w-4" />} label="Shots shared" value={compact(stats.data?.shots ?? 0)} />
            <Stat icon={<Flame className="h-4 w-4" />} label="Active today" value={compact(stats.data?.activeToday ?? 0)} />
          </div>
        </div>
      </motion.section>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="glass-nav rounded-2xl p-1 mb-6 grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="leaderboard" className="rounded-xl gap-1.5"><Trophy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Leaderboard</span></TabsTrigger>
          <TabsTrigger value="badges" className="rounded-xl gap-1.5"><Medal className="h-3.5 w-3.5" /><span className="hidden sm:inline">Badges</span></TabsTrigger>
          <TabsTrigger value="shots" className="rounded-xl gap-1.5"><Camera className="h-3.5 w-3.5" /><span className="hidden sm:inline">Screenshots</span></TabsTrigger>
          <TabsTrigger value="creators" className="rounded-xl gap-1.5"><Star className="h-3.5 w-3.5" /><span className="hidden sm:inline">Creators</span></TabsTrigger>
        </TabsList>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" /> Exploration Leaderboard
          </h2>

          <AsyncState loading={leaderboard.loading} error={leaderboard.error} empty={!ranked.length} emptyText="No explorers on the board yet — start exploring to claim the top spot.">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[1, 0, 2].map((idx, pos) => {
                const e = ranked[idx];
                if (!e) return null;
                const rank = idx + 1;
                const heights = ["mt-6", "mt-0", "mt-10"];
                const tier = tierFor(e.level);
                return (
                  <motion.div
                    key={e.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pos * 0.08 }}
                    className={cn("glass-card rounded-2xl p-4 md:p-5 text-center relative overflow-hidden", heights[pos])}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", TIERS[tier])} />
                    <div className="relative">
                      <div className="mb-3 flex justify-center">
                        {rank === 1 ? <Crown className="h-6 w-6 text-yellow-400" /> : <Medal className={cn("h-5 w-5", rank === 2 ? "text-slate-300" : "text-amber-600")} />}
                      </div>
                      <Avatar className="h-14 w-14 md:h-16 md:w-16 mx-auto mb-3 ring-2 ring-white/20">
                        <AvatarImage src={e.avatarUrl ?? undefined} />
                        <AvatarFallback className="premium-gradient text-white font-bold">{initials(e.name)}</AvatarFallback>
                      </Avatar>
                      <div className="font-semibold truncate">{e.name}</div>
                      <div className="mt-3 text-lg md:text-xl font-bold tabular-nums">
                        {e.xp.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">XP</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">Lv {e.level} · {e.distanceKm.toLocaleString()} km</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {ranked.length > 3 && (
              <div className="glass-card rounded-2xl overflow-hidden">
                {ranked.slice(3).map((e, i) => {
                  const tier = tierFor(e.level);
                  return (
                    <div key={e.userId} className={cn("flex items-center gap-3 md:gap-4 p-3 md:p-4", i !== ranked.length - 4 && "border-b border-white/5")}>
                      <div className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">#{i + 4}</div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={e.avatarUrl ?? undefined} />
                        <AvatarFallback className="premium-gradient text-white text-xs font-bold">{initials(e.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate flex items-center gap-2">
                          {e.name}
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border capitalize bg-gradient-to-br", TIERS[tier])}>{tier}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Lv {e.level} · {e.distanceKm.toLocaleString()} km · 💎 {e.collectibles}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold tabular-nums">{e.xp.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AsyncState>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Medal className="h-5 w-5 text-fuchsia-400" /> Achievement Badges
          </h2>
          <AsyncState loading={achievements.loading} error={achievements.error} empty={!achievements.data?.length} emptyText="No achievements configured yet.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {(achievements.data ?? []).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("glass-card rounded-2xl p-4 md:p-5 relative overflow-hidden text-center", !a.unlocked && "opacity-70")}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-20 from-cyan-300/40 to-fuchsia-400/40" />
                  <div className="relative">
                    <div className={cn("text-4xl md:text-5xl mb-2", !a.unlocked && "grayscale")}>{a.icon}</div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{a.description}</div>
                    <div className="mt-3 inline-block text-[10px] px-2 py-0.5 rounded-full border border-white/20 bg-white/5">
                      {a.unlocked ? "Unlocked" : `+${a.xpReward} XP`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AsyncState>
        </TabsContent>

        {/* Screenshots */}
        <TabsContent value="shots" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-sky-400" /> Community Screenshots
            </h2>
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xl gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share yours
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader><DialogTitle>Share a screenshot</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="shot-title">Caption</Label>
                    <Input id="shot-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Chasing monsoon spray at golden hour" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shot-url">Image URL</Label>
                    <Input id="shot-url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shot-biome">Location / biome</Label>
                    <Input id="shot-biome" value={form.biome} onChange={(e) => setForm({ ...form, biome: e.target.value })} placeholder="Dudhsagar Falls" className="rounded-xl" />
                  </div>
                  <Button onClick={submitShot} disabled={saving} className="w-full rounded-xl premium-gradient border-0 text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <AsyncState loading={shotsQuery.loading} error={shotsQuery.error} empty={!shots.length} emptyText="No screenshots yet — be the first to share one.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shots.map((s, i) => (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.05 }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    <img src={s.imageUrl} alt={s.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] text-white flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.biome}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={s.avatarUrl ?? undefined} />
                        <AvatarFallback className="premium-gradient text-white text-[10px] font-bold">{initials(s.author)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-semibold truncate">{s.author}</div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.title}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <button
                        onClick={() => like(s.id, s.likedByMe)}
                        aria-label={s.likedByMe ? "Unlike" : "Like"}
                        className={cn("flex items-center gap-1 transition-colors hover:text-rose-400", s.likedByMe && "text-rose-400")}
                      >
                        <Heart className={cn("h-3.5 w-3.5", s.likedByMe && "fill-current")} /> {s.likes.toLocaleString()}
                      </button>
                      <span className="ml-auto">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </AsyncState>
        </TabsContent>

        {/* Creators */}
        <TabsContent value="creators" className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" /> Featured Creators
          </h2>
          <AsyncState loading={creators.loading} error={creators.error} empty={!creators.data?.length} emptyText="No published mods yet — publish one to appear here.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(creators.data ?? []).map((c, i) => (
                <motion.div
                  key={c.userId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                >
                  <div className="h-16 w-16 rounded-2xl premium-gradient shrink-0 flex items-center justify-center text-white font-bold text-lg">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs mt-2 flex gap-3 text-muted-foreground">
                      <span><b className="text-foreground tabular-nums">{c.mods}</b> mods</span>
                      <span><b className="text-foreground tabular-nums">{c.downloads.toLocaleString()}</b> downloads</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AsyncState>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AsyncState({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-10 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error) {
    return <div className="glass-card rounded-2xl p-10 text-center text-destructive">{error}</div>;
  }
  if (empty) {
    return <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">{emptyText}</div>;
  }
  return <div className="space-y-6">{children}</div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl px-3 py-2.5 md:px-4 md:py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[11px] md:text-xs">{icon}{label}</div>
      <div className="font-bold text-base md:text-lg tabular-nums">{value}</div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
