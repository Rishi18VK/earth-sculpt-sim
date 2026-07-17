import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";

const TIPS = [
  "Pinch to zoom, drag to rotate any biome.",
  "Try Real Earth Mode to load actual coordinates.",
  "Collect glowing orbs in Play Mode for XP.",
  "Install .zip mods to unlock custom characters.",
  "Export any terrain as an STL for 3D printing.",
  "Toggle Night Mode for auroras and moonlight.",
  "Measurement Mode calculates real elevation deltas.",
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const total = 1800;
    let raf: number;
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / total);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  useEffect(() => {
    const iv = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] aurora-bg flex flex-col items-center justify-center px-8">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="relative mb-8"
      >
        <div className="absolute -inset-8 rounded-full premium-gradient opacity-30 blur-2xl animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="relative w-28 h-28 rounded-full premium-gradient flex items-center justify-center shadow-2xl"
        >
          <Globe className="h-14 w-14 text-white drop-shadow-lg" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <h1 className="text-3xl font-display font-extrabold tracking-tight mb-2">
        <span className="premium-gradient-text">Terra Explorer</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Loading your world…</p>

      <div className="w-64 h-1.5 rounded-full bg-muted/30 overflow-hidden mb-6">
        <motion.div
          className="h-full premium-gradient"
          style={{ width: `${progress * 100}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>

      <div className="h-8 relative w-full max-w-xs text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground"
          >
            💡 {TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
