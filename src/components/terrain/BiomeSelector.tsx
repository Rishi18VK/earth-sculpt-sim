import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Dices } from "lucide-react";
import { BIOMES, BiomeId } from "@/lib/biomes";

interface BiomeSelectorProps {
  currentBiome: BiomeId;
  onBiomeChange: (biome: BiomeId) => void;
  seed: number;
  onSeedChange: (seed: number) => void;
}

const biomeOrder: BiomeId[] = ["earth", "volcanic", "desert", "arctic", "tropical", "dudhsagar"];

export default function BiomeSelector({ currentBiome, onBiomeChange, seed, onSeedChange }: BiomeSelectorProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" />
          Biome Selector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {biomeOrder.map((id) => {
          const biome = BIOMES[id];
          const isActive = currentBiome === id;
          return (
            <Button
              key={id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 h-auto py-1.5 text-xs"
              onClick={() => onBiomeChange(id)}
            >
              <span className="text-sm">{biome.emoji}</span>
              <span className="flex-1 text-left">{biome.name}</span>
              {isActive && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Active
                </Badge>
              )}
            </Button>
          );
        })}
        <p className="text-[10px] text-muted-foreground pt-1">
          {BIOMES[currentBiome].description}
        </p>

        {/* Seed Input */}
        <div className="pt-2 border-t border-border/30 space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">Terrain Seed</label>
          <div className="flex gap-1.5">
            <Input
              type="number"
              value={seed}
              onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
              className="h-7 text-xs font-mono"
              min={0}
              max={9999}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => onSeedChange(Math.floor(Math.random() * 9999))}
              title="Randomize seed"
            >
              <Dices className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
