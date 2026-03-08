import { useState, useCallback } from "react";
import Scene3D from "@/components/terrain/Scene3D";
import InfoPanel from "@/components/terrain/InfoPanel";
import TerrainLegend from "@/components/terrain/TerrainLegend";
import MeasurementPanel from "@/components/terrain/MeasurementPanel";
import ExportPanel from "@/components/terrain/ExportPanel";
import BiomeSelector from "@/components/terrain/BiomeSelector";
import DayNightToggle from "@/components/terrain/DayNightToggle";
import AmbientSoundToggle from "@/components/terrain/AmbientSoundToggle";
import PlayModeUI from "@/components/terrain/PlayModeUI";
import MobileControls from "@/components/terrain/MobileControls";
import { Badge } from "@/components/ui/badge";
import { Mountain, Compass } from "lucide-react";
import { BIOMES, BiomeId } from "@/lib/biomes";

interface TerrainInfo {
  type: string;
  height: number;
  position: [number, number, number];
}

const Index = () => {
  const [selectedInfo, setSelectedInfo] = useState<TerrainInfo | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [pointA, setPointA] = useState<TerrainInfo | null>(null);
  const [pointB, setPointB] = useState<TerrainInfo | null>(null);
  const [currentBiome, setCurrentBiome] = useState<BiomeId>("earth");
  const [seed, setSeed] = useState(1);
  const [isNight, setIsNight] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number] | null>(null);
  const [mobileInput, setMobileInput] = useState({ moveX: 0, moveZ: 0, cameraX: 0, cameraY: 0 });

  const biome = BIOMES[currentBiome];

  const handlePointClick = useCallback(
    (info: TerrainInfo) => {
      if (playMode) return; // Disable terrain clicking in play mode
      if (measureMode) {
        if (!pointA) {
          setPointA(info);
        } else if (!pointB) {
          setPointB(info);
          setMeasureMode(false);
        }
      } else {
        setSelectedInfo(info);
      }
    },
    [measureMode, pointA, pointB, playMode]
  );

  const handleClearMeasure = () => {
    setPointA(null);
    setPointB(null);
    setMeasureMode(false);
  };

  const handleToggleMeasure = () => {
    if (measureMode) {
      setMeasureMode(false);
    } else {
      setPointA(null);
      setPointB(null);
      setMeasureMode(true);
    }
  };

  const handleBiomeChange = (id: BiomeId) => {
    setCurrentBiome(id);
    setSelectedInfo(null);
    setPointA(null);
    setPointB(null);
    setMeasureMode(false);
  };

  const handleSeedChange = (newSeed: number) => {
    setSeed(newSeed);
    setSelectedInfo(null);
    setPointA(null);
    setPointB(null);
    setMeasureMode(false);
  };

  const handleTogglePlayMode = () => {
    setPlayMode((prev) => {
      if (!prev) {
        // Entering play mode - disable measure
        setMeasureMode(false);
      }
      return !prev;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <Scene3D
          onPointClick={handlePointClick}
          pointA={pointA}
          pointB={pointB}
          biome={biome}
          seed={seed}
          isNight={isNight}
          playMode={playMode}
          onPlayerPositionUpdate={setPlayerPosition}
          mobileInput={mobileInput}
        />
      </div>

      {/* Mobile Controls */}
      <MobileControls
        visible={playMode}
        onInput={setMobileInput}
        onJump={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
          setTimeout(() => window.dispatchEvent(new KeyboardEvent("keyup", { key: " " })), 100);
        }}
        onSprintChange={(sprinting) => {
          if (sprinting) {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
          } else {
            window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
          }
        }}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-md rounded-lg px-4 py-2 border border-border/50">
            <Mountain className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-bold text-foreground">TerraCraft 3D</h1>
            <Badge variant="secondary" className="text-[10px]">
              {biome.emoji} {biome.name}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <PlayModeUI playMode={playMode} onToggle={handleTogglePlayMode} playerPosition={playerPosition} />
          <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "8s" }} />
            <span className="text-[10px] font-mono text-muted-foreground">
              {playMode ? "🎮 Play Mode" : "360° Interactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Panels - hidden in play mode on mobile for cleaner view */}
      {!playMode && (
        <div className="absolute top-20 right-4 z-10 w-64 space-y-3 pointer-events-auto max-h-[calc(100vh-7rem)] overflow-y-auto">
          <DayNightToggle isNight={isNight} onToggle={() => setIsNight(!isNight)} />
          <AmbientSoundToggle biome={currentBiome} isNight={isNight} />
          <BiomeSelector currentBiome={currentBiome} onBiomeChange={handleBiomeChange} seed={seed} onSeedChange={handleSeedChange} />
          <MeasurementPanel
            measureMode={measureMode}
            onToggleMeasure={handleToggleMeasure}
            onClear={handleClearMeasure}
            pointA={pointA}
            pointB={pointB}
          />
          {!measureMode && <InfoPanel info={selectedInfo} />}
          <ExportPanel biome={biome} seed={seed} />
        </div>
      )}

      {/* Play mode side panel - minimal controls */}
      {playMode && (
        <div className="absolute top-20 right-4 z-10 w-64 space-y-3 pointer-events-auto">
          <DayNightToggle isNight={isNight} onToggle={() => setIsNight(!isNight)} />
          <AmbientSoundToggle biome={currentBiome} isNight={isNight} />
        </div>
      )}

      {/* Measure mode indicator */}
      {measureMode && !playMode && (
        <div className="absolute top-20 left-4 z-10 pointer-events-auto">
          <div className="bg-primary/90 backdrop-blur-md rounded-lg px-4 py-2 border border-primary animate-pulse">
            <p className="text-xs font-semibold text-primary-foreground">
              📐 Measure Mode — Click terrain to place {!pointA ? "Point A" : "Point B"}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="pointer-events-auto inline-block bg-card/80 backdrop-blur-md rounded-lg px-4 py-2 border border-border/50">
          <TerrainLegend biome={biome} />
        </div>
      </div>

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
