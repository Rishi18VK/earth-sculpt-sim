import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import {
  Compass, Sparkles, Map as MapIcon, Package, Gift, ArrowRight, Trophy,
  Play, Mountain, Cloud, Users, Zap, Shield, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/hooks/use-progress";
import { useDailyReward } from "@/hooks/use-daily-reward";
import { BIOMES } from "@/lib/biomes";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";

const HeroEarth = lazy(() => import("@/components/home/HeroEarth"));

const QUICK = [
  { to: "/explore", icon: Compass, label: "Explore 3D", desc: "Enter the terrain" },
  { to: "/discover", icon: Sparkles, label: "Discover", desc: "Famous places" },
  { to: "/map", icon: MapIcon, label: "World Map", desc: "Jump anywhere" },
  { to: "/mods", icon: Package, label: "Mods", desc: "Customize" },
];

const FEATURES = [
  { icon: Mountain, title: "Real Earth Terrain", desc: "Explore accurately modeled biomes with physically based rendering, dynamic LODs, and 3D-printable STL export." },
  { icon: Cloud, title: "Living Weather & Time", desc: "Full day/night cycle, volumetric fog, god rays, ambient particles, and biome-tuned atmospherics." },
  { icon: Package, title: "Powerful Mods", desc: "Import ZIP or Pak mods with safe validation, version compatibility, and one-tap enable across sessions." },
  { icon: Users, title: "Community Ready", desc: "Level up, unlock badges, climb the leaderboard, and share your favorite discoveries." },
  { icon: Zap, title: "Built for Speed", desc: "144 fps target with adaptive quality tiers, mobile-first controls, and asset streaming." },
  { icon: Shield, title: "Yours, Safely", desc: "Managed backend with row-level security, OAuth-ready integrations, and MCP for AI agents." },
];

const STATS = [
  { value: "12+", label: "Global biomes" },
  { value: "144", label: "FPS target" },
  { value: "9k+", label: "Explorers" },
  { value: "4.9", label: "User rating" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "3D Print Hobbyist", text: "The STL export is flawless — I printed Mt. Fuji in a single click and it slotted right into my collection." },
  { name: "Marcus Chen", role: "Indie Game Dev", text: "Terra Explorer is the reference for what a modern WebGL app can feel like. Buttery on my laptop and phone." },
  { name: "Aisha Okonkwo", role: "Geography Teacher", text: "My students actually beg to open the lesson. The living weather and biomes bring textbook maps to life." },
];

const TRUSTED = ["3D Print Weekly", "GameDev.tv", "WebGL Report", "MakerCon", "EDU Digital", "Voxel Times"];

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { xp, level, into, needed } = useProgress();
  const { available, claim, rewardXp } = useDailyReward();
  const haptics = useHaptics();

  const biomes = Object.values(BIOMES).slice(0, 6);

  const handleClaim = async () => {
    const amt = await claim();
    if (amt) { haptics.reward(); toast.success(`Daily reward claimed! +${amt} XP`); }
  };

  return (
    <div className="w-full">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* 3D Earth background — desktop only for perf */}
        <div className="hidden md:block absolute inset-0 -z-10">
          <Suspense fallback={null}>
            <HeroEarth />
          </Suspense>
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background pointer-events-none" />
        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8 pt-6 md:pt-16 pb-10 md:pb-28 min-h-[70vh] md:min-h-[85vh] flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-3 py-1 text-xs font-semibold mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Now with MCP + AI agent integrations
            </div>

            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl leading-[1.05] mb-5">
              Explore Earth.<br />
              <span className="premium-gradient-text">Sculpt worlds.</span>
            </h1>

            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mb-8">
              A cinematic 3D terrain platform for explorers, makers, and creators. Real biomes, living weather, mods, and gamified discovery — all in your browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg" onClick={() => { haptics.tap(); nav("/explore"); }}
                className="rounded-2xl h-14 px-8 premium-gradient border-0 text-white font-semibold shadow-xl gap-2 text-base"
              >
                <Compass className="h-5 w-5" /> Explore Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg" variant="outline"
                onClick={() => nav("/discover")}
                className="rounded-2xl h-14 px-8 glass-card border-border/50 gap-2 text-base"
              >
                <Play className="h-4 w-4" /> Watch Demo
              </Button>
            </div>

            {user && (
              <div className="mt-8 max-w-md glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold">Level {level}</span>
                  <span className="text-muted-foreground">{into} / {needed} XP</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full premium-gradient" style={{ width: `${(into / needed) * 100}%` }} />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ============ TRUSTED BY ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-12">
        <p className="text-center text-eyebrow text-muted-foreground mb-6">Trusted by explorers worldwide</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-60">
          {TRUSTED.map(n => (
            <span key={n} className="font-display font-bold text-sm md:text-base tracking-tight">{n}</span>
          ))}
        </div>
      </section>

      {/* ============ ANIMATED STATS ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-card rounded-2xl p-5 md:p-8 text-center"
            >
              <div className="text-amount text-3xl md:text-5xl premium-gradient-text mb-1">{s.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ MOBILE QUICK ACTIONS (mobile only) ============ */}
      <section className="md:hidden mx-auto max-w-xl px-4 py-4">
        {user && available && (
          <motion.button
            onClick={handleClaim}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 mb-5"
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
        <h2 className="text-lg font-bold mb-3 px-1">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q, i) => (
            <motion.button
              key={q.to} onClick={() => { haptics.tap(); nav(q.to); }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 text-left min-h-24"
            >
              <q.icon className="h-6 w-6 text-primary mb-2" />
              <p className="font-semibold text-sm">{q.label}</p>
              <p className="text-xs text-muted-foreground">{q.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ============ FEATURE HIGHLIGHTS ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-24">
        <div className="max-w-2xl mb-10 md:mb-14">
          <p className="text-eyebrow text-primary mb-3">Everything you need</p>
          <h2 className="text-display text-3xl md:text-5xl mb-4">A platform, not just a demo.</h2>
          <p className="text-muted-foreground md:text-lg">Every layer is production-grade — from the rendering pipeline to the auth stack — so what you build here is what you ship.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 md:p-7 group hover:scale-[1.02] transition-transform"
            >
              <div className="w-11 h-11 rounded-xl premium-gradient flex items-center justify-center mb-4 shadow-lg">
                <f.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-lg md:text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FEATURED BIOMES ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-20">
        <div className="flex items-end justify-between mb-6 md:mb-10">
          <div>
            <p className="text-eyebrow text-primary mb-2">Discover</p>
            <h2 className="text-display text-3xl md:text-5xl">Featured biomes</h2>
          </div>
          <button onClick={() => nav("/discover")} className="text-sm text-primary font-semibold hover:underline hidden md:inline-flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex md:grid gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-6 overflow-x-auto scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 pb-2 snap-x">
          {biomes.map((b, i) => (
            <motion.button
              key={b.id}
              onClick={() => { haptics.tap(); nav("/explore"); }}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-5 min-w-[160px] snap-start text-left hover:scale-[1.03] transition-transform"
            >
              <div className="text-4xl md:text-5xl mb-3">{b.emoji}</div>
              <p className="font-display font-semibold">{b.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Biome</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <p className="text-eyebrow text-primary mb-3">Loved by creators</p>
          <h2 className="text-display text-3xl md:text-5xl">Explorers are talking.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6 md:p-7 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm md:text-base text-foreground/90 leading-relaxed mb-5 flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center text-white font-bold text-sm">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 premium-gradient rounded-full opacity-25 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 premium-gradient rounded-full opacity-20 blur-3xl" />
          <div className="relative">
            <Trophy className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h2 className="text-display text-3xl md:text-5xl mb-4">Your next expedition awaits.</h2>
            <p className="text-muted-foreground md:text-lg max-w-xl mx-auto mb-8">
              Jump in — no setup, no download. Start exploring Terra in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg" onClick={() => nav("/explore")}
                className="rounded-2xl h-14 px-8 premium-gradient border-0 text-white font-semibold shadow-xl gap-2 text-base"
              >
                Launch Explorer <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg" variant="outline"
                onClick={() => nav("/support")}
                className="rounded-2xl h-14 px-8 glass-card border-border/50 gap-2 text-base"
              >
                Support the project
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="mx-auto max-w-7xl px-6 md:px-8 py-8 border-t border-border/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Terra Explorer. Crafted with care.</p>
          <div className="flex gap-5">
            <button onClick={() => nav("/support")} className="hover:text-foreground">Support</button>
            <button onClick={() => nav("/mods")} className="hover:text-foreground">Mods</button>
            <button onClick={() => nav("/profile")} className="hover:text-foreground">Profile</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
