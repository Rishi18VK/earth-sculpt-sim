import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Box, Layers, Loader2 } from "lucide-react";
import { downloadSTL, getEstimatedFileSize } from "@/lib/stl-export";
import { BiomeConfig } from "@/lib/biomes";

interface ExportPanelProps {
  biome: BiomeConfig;
}

export default function ExportPanel({ biome }: ExportPanelProps) {
  const [resolution, setResolution] = useState(100);
  const [size, setSize] = useState(80);
  const [baseThickness, setBaseThickness] = useState(3);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // Use setTimeout to let UI update before heavy computation
    setTimeout(() => {
      try {
        downloadSTL({
          size,
          segments: resolution,
          baseThickness,
          scale,
          biome,
        });
      } finally {
        setExporting(false);
      }
    }, 50);
  };

  const fileSize = getEstimatedFileSize(resolution);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Printer className="h-4 w-4 text-primary" />
            STL Export
          </span>
          <Badge variant="secondary" className="text-[10px]">
            3D Print
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Resolution */}
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" /> Resolution
            </span>
            <span className="font-mono font-bold text-foreground">{resolution}×{resolution}</span>
          </div>
          <Slider
            value={[resolution]}
            onValueChange={(v) => setResolution(v[0])}
            min={20}
            max={200}
            step={10}
            className="py-1"
          />
          <p className="text-[10px] text-muted-foreground">Higher = more detail, larger file</p>
        </div>

        {/* Terrain Size */}
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Box className="h-3 w-3" /> Terrain Size
            </span>
            <span className="font-mono font-bold text-foreground">{size}mm</span>
          </div>
          <Slider
            value={[size]}
            onValueChange={(v) => setSize(v[0])}
            min={20}
            max={200}
            step={10}
            className="py-1"
          />
        </div>

        {/* Base Thickness */}
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Base Thickness</span>
            <span className="font-mono font-bold text-foreground">{baseThickness}mm</span>
          </div>
          <Slider
            value={[baseThickness]}
            onValueChange={(v) => setBaseThickness(v[0])}
            min={1}
            max={10}
            step={0.5}
            className="py-1"
          />
        </div>

        {/* Scale */}
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Scale Factor</span>
            <span className="font-mono font-bold text-foreground">{scale}×</span>
          </div>
          <Slider
            value={[scale]}
            onValueChange={(v) => setScale(v[0])}
            min={0.5}
            max={5}
            step={0.5}
            className="py-1"
          />
        </div>

        {/* File info */}
        <div className="flex justify-between items-center p-2 rounded bg-accent/30 border border-border/30">
          <span className="text-muted-foreground">Est. file size</span>
          <span className="font-mono font-bold text-foreground">{fileSize}</span>
        </div>

        {/* Export button */}
        <Button
          className="w-full"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export STL File
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Binary STL • Watertight mesh • Ready for slicing
        </p>
      </CardContent>
    </Card>
  );
}
