import { useState } from "react";
import Scene3D from "@/components/terrain/Scene3D";
import InfoPanel from "@/components/terrain/InfoPanel";
import TerrainLegend from "@/components/terrain/TerrainLegend";
import { Badge } from "@/components/ui/badge";
import { Mountain, Compass } from "lucide-react";

interface TerrainInfo {
  type: string;
  height: number;
  position: [number, number, number];
}

const Index = () => {
  const [selectedInfo, setSelectedInfo] = useState<TerrainInfo | null>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* 3D Canvas - Full Screen */}
      <div className="absolute inset-0">
        <Scene3D onPointClick={setSelectedInfo} />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-md rounded-lg px-4 py-2 border border-border/50">
            <Mountain className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-bold text-foreground">TerraCraft 3D</h1>
            <Badge variant="secondary" className="text-[10px]">
              R&D Explorer
            </Badge>
          </div>
        </div>
        <div className="pointer-events-auto bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-[10px] font-mono text-muted-foreground">360° Interactive</span>
        </div>
      </div>

      {/* Info Panel - Right Side */}
      <div className="absolute top-20 right-4 z-10 w-64 pointer-events-auto">
        <InfoPanel info={selectedInfo} />
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="pointer-events-auto inline-block bg-card/80 backdrop-blur-md rounded-lg px-4 py-2 border border-border/50">
          <TerrainLegend />
        </div>
      </div>

      {/* 3D Printing Context Badge */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <p className="text-[10px] text-muted-foreground font-mono">
            🖨️ 3D Print Ready • Engineering & Student Edition
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
