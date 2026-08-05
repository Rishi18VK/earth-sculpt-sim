import { useState, useCallback, useEffect } from "react";
import Scene3D from "@/components/terrain/Scene3D";
import InfoPanel from "@/components/terrain/InfoPanel";
import TerrainLegend from "@/components/terrain/TerrainLegend";
import MeasurementPanel from "@/components/terrain/MeasurementPanel";
import ExportPanel from "@/components/terrain/ExportPanel";
import BiomeSelector from "@/components/terrain/BiomeSelector";
import AmbientSoundToggle from "@/components/terrain/AmbientSoundToggle";
import PlayModeUI from "@/components/terrain/PlayModeUI";
import MobileControls from "@/components/terrain/MobileControls";
import ModManager from "@/components/terrain/ModManager";
import Toolbar from "@/components/terrain/Toolbar";
import RealEarthPanel from "@/components/terrain/RealEarthPanel";
import ExplorerActions from "@/components/terrain/ExplorerActions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BIOMES, BiomeId } from "@/lib/biomes";
import { useMods } from "@/hooks/use-mods";
import { RealEarthLocation, locationToBiome, REAL_EARTH_LOCATIONS } from "@/lib/real-earth-locations";

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
  const [collectibles, setCollectibles] = useState({ collected: 0, total: 0 });

  // Sheet panels
  const [showExport, setShowExport] = useState(false);
  const [showMods, setShowMods] = useState(false);
  const [showSound, setShowSound] = useState(false);
  const [showRealEarth, setShowRealEarth] = useState(false);

  // Real Earth Mode
  const [realEarthMode, setRealEarthMode] = useState(false);
  const [realEarthLocation, setRealEarthLocation] = useState<RealEarthLocation | null>(null);

  const biome = realEarthMode && realEarthLocation
    ? locationToBiome(realEarthLocation)
    : BIOMES[currentBiome];
  const { mods, error: modError, warnings: modWarnings, installFromZip, installFromFiles, installPreset, toggleMod, removeMod, playerOverrides, weatherOverrides, terrainColorOverrides, biomeEffectOverrides, cameraOverrides, clearError, clearWarnings } = useMods();

  const activeMod = mods.find((m) => m.enabled && m.config.type === "player");

  const handlePointClick = useCallback(
    (info: TerrainInfo) => {
      if (playMode) return;
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
      if (!prev) setMeasureMode(false);
      return !prev;
    });
  };
  // Hydrate state from share URL (?biome=, ?seed=, ?night=, ?loc=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get("biome");
    const s = params.get("seed");
    const n = params.get("night");
    const loc = params.get("loc");
    if (b && b in BIOMES) setCurrentBiome(b as BiomeId);
    if (s && !isNaN(Number(s))) setSeed(Number(s));
    if (n === "1" || n === "true") setIsNight(true);
    if (loc && REAL_EARTH_LOCATIONS[loc]) {
      setRealEarthLocation(REAL_EARTH_LOCATIONS[loc]);
      setRealEarthMode(true);
    }
  }, []);

  // Keyboard shortcut: F for fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const realEarthLocationKey = realEarthMode && realEarthLocation
    ? Object.keys(REAL_EARTH_LOCATIONS).find((k) => REAL_EARTH_LOCATIONS[k].name === realEarthLocation.name)
    : undefined;

  const shareState = {
    biome: realEarthMode ? undefined : currentBiome,
    seed: realEarthMode ? undefined : seed,
    night: isNight ? 1 : undefined,
    loc: realEarthLocationKey,
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
          onCollect={(collected, total) => setCollectibles({ collected, total })}
          mobileInput={mobileInput}
          modOverrides={playerOverrides}
          weatherOverrides={weatherOverrides}
          terrainColorOverrides={terrainColorOverrides}
          biomeEffectOverrides={biomeEffectOverrides}
          cameraOverrides={cameraOverrides}
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

      {/* Top Bar — single unified toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <Toolbar
            currentBiome={currentBiome}
            onBiomeChange={handleBiomeChange}
            isNight={isNight}
            onToggleNight={() => setIsNight(!isNight)}
            playMode={playMode}
            onTogglePlay={handleTogglePlayMode}
            measureMode={measureMode}
            onToggleMeasure={handleToggleMeasure}
            onOpenExport={() => setShowExport(true)}
            onOpenMods={() => setShowMods(true)}
            onOpenSound={() => setShowSound(true)}
            activeMod={activeMod}
            realEarthMode={realEarthMode}
            onToggleRealEarth={() => {
              if (realEarthMode) {
                setRealEarthMode(false);
                setRealEarthLocation(null);
              } else {
                setShowRealEarth(true);
              }
            }}
            realEarthLocationName={realEarthLocation?.name}
          />
        </div>
      </div>

      {/* Explorer floating actions: fullscreen, screenshot, share */}
      <div className="absolute top-14 left-3 z-20">
        <ExplorerActions
          biomeLabel={realEarthMode && realEarthLocation ? realEarthLocation.name : biome.name}
          shareState={shareState}
        />
      </div>



      {/* Play Mode HUD */}
      {playMode && playerPosition && (
        <div className="absolute top-14 right-3 z-10 pointer-events-auto">
          <PlayModeUI
            playMode={playMode}
            onToggle={handleTogglePlayMode}
            playerPosition={playerPosition}
            collectibles={collectibles}
          />
        </div>
      )}

      {/* Right Side Panels — only when not in play mode */}
      {!playMode && (
        <div className="absolute top-14 right-3 z-10 w-64 space-y-3 pointer-events-auto max-h-[calc(100vh-5rem)] overflow-y-auto">
          {measureMode || pointA ? (
            <MeasurementPanel
              measureMode={measureMode}
              onToggleMeasure={handleToggleMeasure}
              onClear={handleClearMeasure}
              pointA={pointA}
              pointB={pointB}
            />
          ) : (
            <InfoPanel info={selectedInfo} />
          )}
        </div>
      )}

      {/* Measure mode indicator */}
      {measureMode && !playMode && (
        <div className="absolute top-14 left-16 z-10 pointer-events-auto">
          <div className="bg-primary/90 backdrop-blur-md rounded-lg px-4 py-2 border border-primary animate-pulse">
            <p className="text-xs font-semibold text-primary-foreground">
              📐 Measure Mode — Click terrain to place {!pointA ? "Point A" : "Point B"}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex items-end justify-between">
        <div className="pointer-events-auto bg-card/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-border/50">
          <TerrainLegend biome={biome} />
        </div>
        <div className="pointer-events-auto bg-card/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-border/50">
          <p className="text-[10px] text-muted-foreground font-mono">
            {realEarthMode && realEarthLocation
              ? `🌎 ${realEarthLocation.name}, ${realEarthLocation.region} • ${realEarthLocation.lat.toFixed(1)}°, ${realEarthLocation.lng.toFixed(1)}°`
              : `Seed: ${seed} • ${biome.emoji} ${biome.name}`}
          </p>
        </div>
      </div>

      {/* Sound Sheet */}
      <Sheet open={showSound} onOpenChange={setShowSound}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-sm">Ambient Sound</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AmbientSoundToggle biome={currentBiome} isNight={isNight} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Export Sheet */}
      <Sheet open={showExport} onOpenChange={setShowExport}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm">STL Export</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ExportPanel biome={biome} seed={seed} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Real Earth Panel */}
      <Sheet open={showRealEarth} onOpenChange={setShowRealEarth}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm flex items-center gap-1.5">🌎 Real Earth Mode</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <RealEarthPanel
              activeLocation={realEarthLocation}
              onSelectLocation={(loc) => {
                setRealEarthLocation(loc);
                setRealEarthMode(true);
                setSelectedInfo(null);
                setPointA(null);
                setPointB(null);
                setMeasureMode(false);
                setShowRealEarth(false);
                          }}
              onClose={() => setShowRealEarth(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mod Manager — uses its own Dialog, we just trigger open */}
      <div className="sr-only">
        <ModManager
          mods={mods}
          onInstallZip={installFromZip}
          onInstallFiles={installFromFiles}
          onInstallPreset={installPreset}
          onToggle={toggleMod}
          onRemove={removeMod}
          error={modError}
          onClearError={clearError}
          warnings={modWarnings}
          onClearWarnings={clearWarnings}
          externalOpen={showMods}
          onExternalOpenChange={setShowMods}
        />
      </div>
    </div>
  );
};

export default Index;
