import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ruler, Trash2, ArrowUpDown, MapPin, Triangle } from "lucide-react";

interface MeasurementPoint {
  position: [number, number, number];
  type: string;
  height: number;
}

interface MeasurementPanelProps {
  measureMode: boolean;
  onToggleMeasure: () => void;
  onClear: () => void;
  pointA: MeasurementPoint | null;
  pointB: MeasurementPoint | null;
}

function calcDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function calcHorizontalDistance(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2);
}

function calcSlope(a: MeasurementPoint, b: MeasurementPoint) {
  const hDist = calcHorizontalDistance(a.position, b.position);
  if (hDist === 0) return 90;
  const elevDiff = Math.abs(b.height - a.height);
  return Math.atan2(elevDiff, hDist) * (180 / Math.PI);
}

export default function MeasurementPanel({
  measureMode,
  onToggleMeasure,
  onClear,
  pointA,
  pointB,
}: MeasurementPanelProps) {
  const hasData = pointA && pointB;
  const distance3D = hasData ? calcDistance(pointA.position, pointB.position) : 0;
  const distanceH = hasData ? calcHorizontalDistance(pointA.position, pointB.position) : 0;
  const elevDiff = hasData ? pointB.height - pointA.height : 0;
  const slope = hasData ? calcSlope(pointA, pointB) : 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Ruler className="h-4 w-4 text-primary" />
            Measurement
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={measureMode ? "default" : "outline"}
              className="h-6 text-[10px] px-2"
              onClick={onToggleMeasure}
            >
              {measureMode ? "Measuring..." : "Measure"}
            </Button>
            {(pointA || pointB) && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2"
                onClick={onClear}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        {!measureMode && !pointA && (
          <p className="text-muted-foreground">Click "Measure" then click two terrain points.</p>
        )}

        {measureMode && !pointA && (
          <p className="text-primary font-medium animate-pulse">Click Point A on terrain...</p>
        )}

        {measureMode && pointA && !pointB && (
          <p className="text-primary font-medium animate-pulse">Click Point B on terrain...</p>
        )}

        {/* Point info */}
        {pointA && (
          <div className="flex items-start gap-2 p-1.5 rounded bg-accent/30 border border-border/30">
            <MapPin className="h-3 w-3 mt-0.5 text-chart-1 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Point A — {pointA.type}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                ({pointA.position.join(", ")}) • {pointA.height}m
              </p>
            </div>
          </div>
        )}

        {pointB && (
          <div className="flex items-start gap-2 p-1.5 rounded bg-accent/30 border border-border/30">
            <MapPin className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Point B — {pointB.type}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                ({pointB.position.join(", ")}) • {pointB.height}m
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {hasData && (
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> 3D Distance
              </span>
              <span className="font-mono font-bold text-foreground">{distance3D.toFixed(2)}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Horizontal
              </span>
              <span className="font-mono font-bold text-foreground">{distanceH.toFixed(2)}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Elevation Δ
              </span>
              <span className={`font-mono font-bold ${elevDiff >= 0 ? "text-chart-1" : "text-destructive"}`}>
                {elevDiff >= 0 ? "+" : ""}{elevDiff.toFixed(2)}m
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Triangle className="h-3 w-3" /> Slope
              </span>
              <span className="font-mono font-bold text-foreground">{slope.toFixed(1)}°</span>
            </div>

            {/* Elevation mini-profile */}
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground mb-1 font-semibold">Elevation Profile</p>
              <div className="h-10 bg-secondary/30 rounded relative border border-border/30 overflow-hidden">
                <ElevationChart heightA={pointA.height} heightB={pointB.height} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ElevationChart({ heightA, heightB }: { heightA: number; heightB: number }) {
  const minH = Math.min(heightA, heightB, -2);
  const maxH = Math.max(heightA, heightB, 4);
  const range = maxH - minH || 1;

  const normalize = (h: number) => ((h - minH) / range) * 100;
  const yA = 100 - normalize(heightA);
  const yB = 100 - normalize(heightB);

  // Simple SVG line profile
  const points = `0,${yA} 15,${yA + (yB - yA) * 0.1} 30,${yA + (yB - yA) * 0.3} 50,${yA + (yB - yA) * 0.5} 70,${yA + (yB - yA) * 0.7} 85,${yA + (yB - yA) * 0.9} 100,${yB}`;
  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <polygon points={fillPoints} fill="hsl(200, 98%, 39%)" opacity="0.2" />
      <polyline points={points} fill="none" stroke="hsl(200, 98%, 39%)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx="0" cy={yA} r="3" fill="hsl(198, 93%, 59%)" />
      <circle cx="100" cy={yB} r="3" fill="hsl(24, 95%, 53%)" />
    </svg>
  );
}
