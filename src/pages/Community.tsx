import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Camera, Users, Crown, Medal, Heart, MessageCircle, Share2, MapPin, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Explorer = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  level: number;
  xp: number;
  distanceKm: number;
  biomesUnlocked: number;
  streak: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  badges: string[];
};

type Shot = {
  id: string;
  author: string;
  handle: string;
  location: string;
  gradient: string;
  likes: number;
  comments: number;
  caption: string;
};

type Creator = {
  id: string;
  name: string;
  handle: string;
  role: string;
  followers: number;
  mods: number;
  gradient: string;
};

const TIERS = {
  bronze: "from-amber-700/40 to-amber-900/40 text-amber-200 border-amber-600/40",
  silver: "from-slate-400/30 to-slate-600/30 text-slate-100 border-slate-300/30",
  gold: "from-yellow-400/40 to-orange-500/30 text-yellow-100 border-yellow-400/40",
  platinum: "from-cyan-300/40 to-fuchsia-400/40 text-white border-cyan-300/40",
} as const;

const LEADERBOARD: Explorer[] = [
  { id: "1", name: "Aarav Mehta", handle: "aarav.explores", level: 47, xp: 128400, distanceKm: 8421, biomesUnlocked: 12, streak: 63, tier: "platinum", badges: ["Trailblazer", "Cartographer", "Founder"] },
  { id: "2", name: "Luna Park", handle: "luna.terra", level: 44, xp: 119200, distanceKm: 7980, biomesUnlocked: 12, streak: 41, tier: "platinum", badges: ["Storm Chaser", "Peak Bagger"] },
  { id: "3", name: "Diego Alvarez", handle: "diegoxr", level: 41, xp: 104100, distanceKm: 6890, biomesUnlocked: 11, streak: 28, tier: "gold", badges: ["Modder", "Waterfall Hunter"] },
  { id: "4", name: "Priya Nair", handle: "priya.roams", level: 38, xp: 92040, distanceKm: 6120, biomesUnlocked: 10, streak: 19, tier: "gold", badges: ["Night Owl"] },
  { id: "5", name: "Kenji Watanabe", handle: "kenji.k", level: 36, xp: 84900, distanceKm: 5780, biomesUnlocked: 10, streak: 22, tier: "gold", badges: ["Photographer"] },
  { id: "6", name: "Amelia Ford", handle: "ford.rides", level: 33, xp: 71200, distanceKm: 4930, biomesUnlocked: 9, streak: 12, tier: "silver", badges: ["Speedrunner"] },
  { id: "7", name: "Noah Bergman", handle: "noahb", level: 30, xp: 62100, distanceKm: 4210, biomesUnlocked: 8, streak: 8, tier: "silver", badges: [] },
  { id: "8", name: "Sana Rahman", handle: "sanar", level: 27, xp: 51800, distanceKm: 3600, biomesUnlocked: 8, streak: 6, tier: "silver", badges: ["Collector"] },
];

const SHOTS: Shot[] = [
  { id: "s1", author: "Luna Park", handle: "luna.terra", location: "Dudhsagar Falls", gradient: "from-cyan-500 via-blue-600 to-indigo-800", likes: 2140, comments: 84, caption: "Chasing monsoon spray at golden hour." },
  { id: "s2", author: "Diego Alvarez", handle: "diegoxr", location: "Sahara Dunes", gradient: "from-amber-400 via-orange-500 to-rose-700", likes: 1820, comments: 52, caption: "Endless waves of sand under a burning sky." },
  { id: "s3", author: "Aarav Mehta", handle: "aarav.explores", location: "Everest Ridge", gradient: "from-slate-200 via-sky-400 to-indigo-800", likes: 3210, comments: 121, caption: "The world curves from up here." },
  { id: "s4", author: "Kenji Watanabe", handle: "kenji.k", location: "Aurora Fjord", gradient: "from-emerald-400 via-teal-500 to-purple-800", likes: 2760, comments: 96, caption: "Green ribbons dancing over glass water." },
  { id: "s5", author: "Priya Nair", handle: "priya.roams", location: "Amazon Canopy", gradient: "from-lime-400 via-emerald-600 to-emerald-900", likes: 1490, comments: 38, caption: "Every leaf hiding a new species." },
  { id: "s6", author: "Amelia Ford", handle: "ford.rides", location: "Mars Analog", gradient: "from-red-400 via-orange-600 to-rose-900", likes: 1120, comments: 44, caption: "Pretending it's not Earth for a minute." },
];

const CREATORS: Creator[] = [
  { id: "c1", name: "Studio Nimbus", handle: "nimbus.mods", role: "Weather Pack Author", followers: 12400, mods: 18, gradient: "from-sky-500 to-indigo-600" },
  { id: "c2", name: "Terra Foundry", handle: "terra.foundry", role: "Terrain Curator", followers: 9800, mods: 32, gradient: "from-emerald-500 to-teal-700" },
  { id: "c3", name: "Aurora Labs", handle: "aurora.labs", role: "Shader Pack Author", followers: 15600, mods: 11, gradient: "from-fuchsia-500 to-purple-700" },
  { id: "c4", name: "Wildframe", handle: "wildframe", role: "Photo Mode Creator", followers: 7200, mods: 24, gradient: "from-amber-500 to-rose-600" },
];

const ACHIEVEMENTS = [
  { code: "trailblazer", title: "Trailblazer", desc: "Explore 10 biomes", icon: "🧭", tier: "gold" as const },
  { code: "cartographer", title: "Cartographer", desc: "Visit 25 real-earth locations", icon: "🗺️", tier: "platinum" as const },
  { code: "peakbagger", title: "Peak Bagger", desc: "Summit 5 major peaks", icon: "⛰️", tier: "silver" as const },
  { code: "storm", title: "Storm Chaser", desc: "Weather every biome storm", icon: "⚡", tier: "gold" as const },
  { code: "waterfall", title: "Waterfall Hunter", desc: "Find 12 hidden waterfalls", icon: "💧", tier: "silver" as const },
  { code: "modder", title: "Modder", desc: "Publish a public mod", icon: "🧩", tier: "gold" as const },
  { code: "collector", title: "Collector", desc: "Grab 100 collectibles", icon: "💎", tier: "silver" as const },
  { code: "founder", title: "Founder", desc: "Supporter since day one", icon: "🌟", tier: "platinum" as const },
];

export default function Community() {
  const [range, setRange] = useState<"week" | "month" | "all">("month");

  const ranked = useMemo(() => {
    const factor = range === "week" ? 0.08 : range === "month" ? 0.35 : 1;
    return [...LEADERBOARD]
      .map(e => ({ ...e, xp: Math.round(e.xp * factor), distanceKm: Math.round(e.distanceKm * factor) }))
      .sort((a, b) => b.xp - a.xp);
  }, [range]);

  return (
    <div className="min-h-dvh px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Hero */}
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
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Where explorers meet.
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Climb the global leaderboard, share your most breathtaking finds, and follow the creators redefining Terra Explorer.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <Stat icon={<Users className="h-4 w-4" />} label="Explorers" value="48.2k" />
            <Stat icon={<Camera className="h-4 w-4" />} label="Shots shared" value="12.9k" />
            <Stat icon={<Flame className="h-4 w-4" />} label="Active today" value="3.4k" />
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-400" /> Exploration Leaderboard</h2>
            <div className="glass-nav rounded-full p-1 flex gap-1">
              {(["week", "month", "all"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
                    range === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r === "all" ? "All time" : `This ${r}`}
                </button>
              ))}
            </div>
          </div>

          {/* Podium */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[1, 0, 2].map((idx, pos) => {
              const e = ranked[idx];
              if (!e) return null;
              const rank = idx + 1;
              const heights = ["mt-6", "mt-0", "mt-10"];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pos * 0.08 }}
                  className={cn("glass-card rounded-2xl p-4 md:p-5 text-center relative overflow-hidden", heights[pos])}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", TIERS[e.tier])} />
                  <div className="relative">
                    <div className="mb-3 flex justify-center">
                      {rank === 1 ? <Crown className="h-6 w-6 text-yellow-400" /> : <Medal className={cn("h-5 w-5", rank === 2 ? "text-slate-300" : "text-amber-600")} />}
                    </div>
                    <Avatar className="h-14 w-14 md:h-16 md:w-16 mx-auto mb-3 ring-2 ring-white/20">
                      <AvatarImage src={e.avatar} />
                      <AvatarFallback className="premium-gradient text-white font-bold">{initials(e.name)}</AvatarFallback>
                    </Avatar>
                    <div className="font-semibold truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground truncate">@{e.handle}</div>
                    <div className="mt-3 text-lg md:text-xl font-bold tabular-nums">{e.xp.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">XP</span></div>
                    <div className="text-[11px] text-muted-foreground">Lv {e.level} · {e.distanceKm.toLocaleString()} km</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {ranked.slice(3).map((e, i) => (
              <div key={e.id} className={cn("flex items-center gap-3 md:gap-4 p-3 md:p-4", i !== ranked.length - 4 && "border-b border-white/5")}>
                <div className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">#{i + 4}</div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={e.avatar} />
                  <AvatarFallback className="premium-gradient text-white text-xs font-bold">{initials(e.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {e.name}
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border capitalize bg-gradient-to-br", TIERS[e.tier])}>{e.tier}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Lv {e.level} · {e.distanceKm.toLocaleString()} km · 🔥 {e.streak}d</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums">{e.xp.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">XP</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Medal className="h-5 w-5 text-fuchsia-400" /> Achievement Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={a.code}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-4 md:p-5 relative overflow-hidden text-center"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", TIERS[a.tier])} />
                <div className="relative">
                  <div className="text-4xl md:text-5xl mb-2">{a.icon}</div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
                  <div className={cn("mt-3 inline-block text-[10px] px-2 py-0.5 rounded-full border capitalize bg-gradient-to-br", TIERS[a.tier])}>{a.tier}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Screenshots */}
        <TabsContent value="shots" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Camera className="h-5 w-5 text-sky-400" /> Community Screenshots</h2>
            <Button variant="secondary" size="sm" className="rounded-xl gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share yours</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOTS.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden group"
              >
                <div className={cn("relative aspect-[4/3] bg-gradient-to-br", s.gradient)}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_50%)]" />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur text-[11px] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {s.location}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="premium-gradient text-white text-[10px] font-bold">{initials(s.author)}</AvatarFallback></Avatar>
                    <div className="text-sm font-semibold truncate">{s.author}</div>
                    <div className="text-xs text-muted-foreground truncate">@{s.handle}</div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.caption}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-rose-400 transition-colors"><Heart className="h-3.5 w-3.5" /> {s.likes.toLocaleString()}</button>
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors"><MessageCircle className="h-3.5 w-3.5" /> {s.comments}</button>
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"><Share2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </TabsContent>

        {/* Creators */}
        <TabsContent value="creators" className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400" /> Featured Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CREATORS.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
              >
                <div className={cn("h-16 w-16 rounded-2xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white font-bold text-lg", c.gradient)}>
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{c.handle} · {c.role}</div>
                  <div className="text-xs mt-2 flex gap-3 text-muted-foreground">
                    <span><b className="text-foreground tabular-nums">{c.followers.toLocaleString()}</b> followers</span>
                    <span><b className="text-foreground tabular-nums">{c.mods}</b> mods</span>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl premium-gradient border-0 text-white shrink-0">Follow</Button>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
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
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}
