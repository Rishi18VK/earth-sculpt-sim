import { useState, useMemo } from "react";
import { Search, MapPin, Globe2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchLocations, RealEarthLocation } from "@/lib/real-earth-locations";

interface RealEarthPanelProps {
  onSelectLocation: (loc: RealEarthLocation) => void;
  onClose: () => void;
  activeLocation?: RealEarthLocation | null;
}

export default function RealEarthPanel({ onSelectLocation, onClose, activeLocation }: RealEarthPanelProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchLocations(query), [query]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search a place (e.g., Himalayas, Goa...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-9 text-xs bg-background"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-2.5 top-2.5">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Active location */}
      {activeLocation && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Globe2 className="h-3.5 w-3.5" />
            Exploring: {activeLocation.name}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{activeLocation.region}</p>
        </div>
      )}

      {/* Results */}
      <ScrollArea className="h-[280px]">
        <div className="flex flex-col gap-1.5 pr-2">
          {results.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6">
              No locations found. Try a different search term.
            </div>
          )}
          {results.map((loc) => (
            <button
              key={loc.name}
              onClick={() => onSelectLocation(loc)}
              className={`w-full text-left rounded-lg border p-2.5 transition-colors hover:bg-accent/50 ${
                activeLocation?.name === loc.name
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">{loc.name}</span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">{loc.region}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{loc.description}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {loc.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[8px] h-3.5 px-1">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
