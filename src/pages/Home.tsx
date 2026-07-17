import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Compass, Sparkles, Map as MapIcon, Package, Gift, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/hooks/use-progress";
import { useDailyReward } from "@/hooks/use-daily-reward";
import { BIOMES } from "@/lib/biomes";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";

const QUICK = [
  { to: "/explore", icon: Compass, label: "Explore 3D", desc: "Enter the terrain" },
  { to: "/discover", icon: Sparkles, label: "Discover", desc: "Famous places" },
  { to: "/map", icon: MapIcon, label: "World Map", desc: "Jump anywhere" },
  { to: "/mods", icon: Package, label: "Mods", desc: "Customize" },
];

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { xp, level, into, needed } = useProgress();
  const { available, claim, rewardXp } = useDailyReward();
  const haptics = useHaptics();

  const biomes = Object.values(BIOMES).slice(0, 6);

  const handleClaim = async () => {
    const amt = await claim();
    if (amt) {
      haptics.reward();
      toast.success(`Daily reward claimed! +${amt} XP`);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-6 space-y-6">
      {/* Hero */}
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-56 h-56 premium-gradient rounded-full opacity-20 blur-3xl" />
        <p className="text-eyebrow text-muted-foreground mb-2">Welcome back</p>
        <h1 className="text-3xl font-extrabold leading-tight mb-1">
          <span className="premium-gradient-text">Terra Explorer</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-4">Sculpt worlds. Discover Earth. Play with terrain.</p>
        {user && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold">Level {level}</span>
              <span className="text-muted-foreground">{into} / {needed} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full premium-gradient" style={{ width: `${(into / needed) * 100}%` }} />
            </div>
          </div>
        )}
        <Button onClick={() => nav("/explore")} size="lg" className="mt-5 w-full rounded-2xl h-12 premium-gradient border-0 text-white font-semibold shadow-lg gap-2">
          Continue Exploring <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.header>

      {/* Daily reward */}
      {user && available && (
        <motion.button
          onClick={handleClaim}
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center animate-pulse">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">Daily reward ready</p>
            <p className="text-xs text-muted-foreground">Tap to claim +{rewardXp} XP</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-bold mb-3 px-1">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q, i) => (
            <motion.button
              key={q.to}
              onClick={() => { haptics.tap(); nav(q.to); }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 text-left hover:scale-[1.02] transition-transform min-h-24"
            >
              <q.icon className="h-6 w-6 text-primary mb-2" />
              <p className="font-semibold text-sm">{q.label}</p>
              <p className="text-xs text-muted-foreground">{q.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Featured biomes */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Featured biomes</h2>
          <button onClick={() => nav("/explore")} className="text-xs text-primary font-semibold">View all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
          {biomes.map((b, i) => (
            <motion.button
              key={b.id}
              onClick={() => { haptics.tap(); nav("/explore"); }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-4 min-w-[140px] snap-start text-left"
            >
              <div className="text-3xl mb-2">{b.emoji}</div>
              <p className="font-semibold text-sm">{b.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Biome</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Support */}
      <motion.button
        onClick={() => { haptics.tap(); nav("/support"); }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform"
      >
        <div className="w-11 h-11 rounded-xl premium-gradient flex items-center justify-center">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">Support the creator</p>
          <p className="text-xs text-muted-foreground">Unlock supporter badges</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </motion.button>
    </div>
  );
}
