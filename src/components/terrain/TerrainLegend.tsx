import { BiomeConfig } from "@/lib/biomes";

interface TerrainLegendProps {
  biome: BiomeConfig;
}

export default function TerrainLegend({ biome }: TerrainLegendProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {biome.colorStops.map((stop) => (
        <div key={stop.label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border border-border/50"
            style={{ backgroundColor: stop.hex }}
          />
          <span className="text-[10px] text-muted-foreground font-medium">{stop.label}</span>
        </div>
      ))}
    </div>
  );
}
