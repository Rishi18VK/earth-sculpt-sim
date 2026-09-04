import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DISCOVER_LOCATIONS, CATEGORY_LABELS, type DiscoverCategory } from "@/lib/discover-locations";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/use-haptics";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Filter = DiscoverCategory | "all";
const FILTERS: Filter[] = ["all", "trending", "landmark", "waterfall", "mountain", "park", "monument"];

export default function Discover() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const haptics = useHaptics();
  const nav = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISCOVER_LOCATIONS.filter(l => {
      if (filter === "trending") { if (!l.trending) return false; }
      else if (filter !== "all" && l.category !== filter) return false;
      if (q && !(l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, filter]);

  const open = (id: string, name: string) => {
    haptics.tap();
    toast.success(`Opening ${name} in Explore…`);
    nav("/explore");
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-eyebrow text-muted-foreground mb-1">Discover</p>
        <h1 className="text-3xl font-extrabold">Places to explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Curated landmarks, waterfalls, peaks and parks.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search locations…" className="pl-9 h-11 rounded-xl glass-card border-border/40" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {FILTERS.map(f => {
          const meta = CATEGORY_LABELS[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => { haptics.tap(); setFilter(f); }}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                active
                  ? "premium-gradient text-white border-transparent shadow"
                  : "glass-card text-foreground border-border/40 hover:border-border"
              )}
            >
              <span className="mr-1">{meta.emoji}</span>{meta.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {results.map((l, i) => (
          <motion.div
            key={l.id}
            role="button"
            tabIndex={0}
            onClick={() => open(l.id, l.name)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(l.id, l.name); } }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="glass-card rounded-2xl p-4 text-left relative overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br", l.gradient)} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{l.emoji}</div>
                {l.trending && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    TRENDING
                  </span>
                )}
              </div>
              <p className="font-semibold text-sm">{l.name}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{l.region}
              </p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{l.description}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); haptics.tap(); nav(`/jarvis?location=${l.id}`); }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
              >
                <Boxes className="h-3 w-3" />Inspect in JARVIS
              </button>
            </div>
          </motion.div>
        ))}

        {results.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
            No locations match your search.
          </div>
        )}
      </div>
    </div>
  );
}
