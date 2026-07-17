import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DISCOVER_LOCATIONS } from "@/lib/discover-locations";
import { useHaptics } from "@/hooks/use-haptics";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

// Simple equirectangular projection to place hotspots on a stylized world panel.
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

export default function MapPage() {
  const nav = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
      <header>
        <p className="text-eyebrow text-muted-foreground mb-1">World Map</p>
        <h1 className="text-3xl font-extrabold">Jump anywhere on Earth</h1>
        <p className="text-sm text-muted-foreground mt-1">Tap a hotspot to load it in Explore.</p>
      </header>

      <div className="glass-card rounded-3xl p-4 relative">
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-[hsl(210,40%,10%)]">
          {/* Stylized world SVG (simple continents) */}
          <svg viewBox="0 0 360 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-60">
            <defs>
              <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="hsl(200 60% 25%)" />
                <stop offset="1" stopColor="hsl(180 50% 18%)" />
              </linearGradient>
            </defs>
            <rect width="360" height="180" fill="hsl(220 60% 8%)" />
            <g fill="url(#landG)" stroke="hsl(200 50% 40% / 0.4)" strokeWidth="0.5">
              {/* Extremely stylized continent blobs */}
              <path d="M40,60 Q60,40 90,50 T140,70 Q120,100 80,110 Q40,100 40,60Z" />
              <path d="M150,40 Q200,30 240,50 Q260,80 240,110 Q200,120 160,100 Q140,80 150,40Z" />
              <path d="M170,110 Q200,120 210,150 Q190,170 170,160 Q155,140 170,110Z" />
              <path d="M260,120 Q290,110 310,130 Q305,155 275,155 Q255,145 260,120Z" />
              <path d="M90,120 Q110,125 115,145 Q100,160 85,150 Q80,135 90,120Z" />
            </g>
          </svg>

          {/* Hotspots */}
          {DISCOVER_LOCATIONS.map(l => {
            const { x, y } = project(l.lat, l.lng);
            return (
              <motion.button
                key={l.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.random() * 0.4 }}
                onClick={() => { haptics.tap(); toast.success(`Loading ${l.name}…`); nav("/explore"); }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={l.name}
              >
                <span className="absolute inset-0 -m-2 rounded-full premium-gradient opacity-40 blur-md animate-pulse" />
                <span className="relative block w-2.5 h-2.5 rounded-full premium-gradient ring-2 ring-white/70" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold bg-background/80 backdrop-blur px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {l.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2 px-1">All hotspots</h2>
        <div className="grid grid-cols-2 gap-2">
          {DISCOVER_LOCATIONS.map(l => (
            <button
              key={l.id}
              onClick={() => { haptics.tap(); toast.success(`Loading ${l.name}…`); nav("/explore"); }}
              className="glass-card rounded-xl p-3 text-left flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <span className="text-xl">{l.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{l.name}</p>
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{l.region}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
