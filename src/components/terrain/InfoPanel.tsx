import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mountain, Waves, TreePine, Snowflake, Globe, Layers } from "lucide-react";

interface TerrainInfo {
  type: string;
  height: number;
  position: [number, number, number];
}

const terrainData: Record<string, { icon: React.ReactNode; description: string; facts: string[] }> = {
  "Deep Sea": {
    icon: <Waves className="h-5 w-5" />,
    description: "Ocean depths where light barely penetrates. Rich in marine biodiversity.",
    facts: ["Average ocean depth: 3,688m", "Covers 71% of Earth's surface", "Contains 97% of Earth's water"],
  },
  "Shallow Water": {
    icon: <Waves className="h-5 w-5" />,
    description: "Continental shelf waters teeming with marine life and coral reefs.",
    facts: ["Supports most marine life", "Ideal for coral reef growth", "Key for fishing industries"],
  },
  "Sand/Beach": {
    icon: <Globe className="h-5 w-5" />,
    description: "Coastal zones formed by weathered rock and mineral deposits.",
    facts: ["Sand is mostly quartz (SiO₂)", "Used in glass manufacturing", "Essential for 3D printing ceramics"],
  },
  "Greenery/Lowland": {
    icon: <TreePine className="h-5 w-5" />,
    description: "Fertile plains and valleys supporting agriculture and diverse ecosystems.",
    facts: ["Best for agriculture", "Rich topsoil layers", "Key biodiversity zones"],
  },
  Forest: {
    icon: <TreePine className="h-5 w-5" />,
    description: "Dense woodland areas crucial for oxygen production and carbon capture.",
    facts: ["Produces 28% of oxygen", "Houses 80% of land species", "Wood used in 3D printing filaments"],
  },
  "Stone/Rock": {
    icon: <Mountain className="h-5 w-5" />,
    description: "Rocky mountain terrain formed by tectonic activity and erosion.",
    facts: ["Granite density: 2.75 g/cm³", "Used in construction & 3D scanning", "Contains mineral deposits"],
  },
  "Snow/Ice": {
    icon: <Snowflake className="h-5 w-5" />,
    description: "Alpine and polar ice formations. Critical for fresh water reserves.",
    facts: ["Ice stores 69% freshwater", "Reflects solar radiation", "Studied for climate research"],
  },
};

interface InfoPanelProps {
  info: TerrainInfo | null;
}

export default function InfoPanel({ info }: InfoPanelProps) {
  if (!info) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            TerraCraft 3D Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>Click any terrain point to explore geological data.</p>
          <p>Drag to rotate • Scroll to zoom • Right-click to pan</p>
          <div className="flex flex-wrap gap-1 pt-2">
            {["Ice", "Rock", "Forest", "Sand", "Water"].map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = terrainData[info.type] || terrainData["Stone/Rock"];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-primary">{data?.icon}</span>
          {info.type}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground">{data?.description}</p>
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-muted-foreground">
            Elevation: {info.height}m | Pos: ({info.position.join(", ")})
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">Key Facts:</p>
          {data?.facts.map((fact, i) => (
            <p key={i} className="text-muted-foreground flex items-start gap-1">
              <span className="text-primary mt-0.5">•</span> {fact}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
