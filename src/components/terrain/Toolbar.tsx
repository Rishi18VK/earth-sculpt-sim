import { useState } from "react";
import {
  Mountain, Sun, Moon, Volume2, VolumeX, Gamepad2, Package, Ruler,
  Download, Globe, Globe2, Layers, ChevronDown, Settings, Menu, X, Eye, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BiomeId, BIOMES } from "@/lib/biomes";
import type { InstalledMod } from "@/lib/mod-types";

interface ToolbarProps {
  // Biome
  currentBiome: BiomeId;
  onBiomeChange: (id: BiomeId) => void;
  // Day/Night
  isNight: boolean;
  onToggleNight: () => void;
  // Play mode
  playMode: boolean;
  onTogglePlay: () => void;
  // Measure
  measureMode: boolean;
  onToggleMeasure: () => void;
  // Panels
  onOpenExport: () => void;
  onOpenMods: () => void;
  onOpenSound: () => void;
  // Mod info
  activeMod?: InstalledMod;
  // Real Earth Mode
  realEarthMode: boolean;
  onToggleRealEarth: () => void;
  realEarthLocationName?: string;
}

const biomeOrder: BiomeId[] = ["earth", "volcanic", "desert", "arctic", "tropical", "dudhsagar"];

export default function Toolbar({
  currentBiome,
  onBiomeChange,
  isNight,
  onToggleNight,
  playMode,
  onTogglePlay,
  measureMode,
  onToggleMeasure,
  onOpenExport,
  onOpenMods,
  onOpenSound,
  activeMod,
  realEarthMode,
  onToggleRealEarth,
  realEarthLocationName,
}: ToolbarProps) {
  const biome = BIOMES[currentBiome];

  return (
    <div className="flex items-center gap-1.5">
      {/* Logo */}
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-md rounded-lg px-3 py-1.5 border border-border/50 mr-1">
        <Mountain className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-foreground hidden sm:inline">TerraCraft 3D</span>
      </div>

      {/* Biome Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 bg-card/90 backdrop-blur-md border-border/50">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{biome.emoji} {biome.name}</span>
            <span className="sm:hidden">{biome.emoji}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-[10px]">Select Biome</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {biomeOrder.map((id) => {
            const b = BIOMES[id];
            return (
              <DropdownMenuItem
                key={id}
                onClick={() => onBiomeChange(id)}
                className="gap-2 text-xs"
              >
                <span>{b.emoji}</span>
                <span className="flex-1">{b.name}</span>
                {currentBiome === id && (
                  <Badge variant="secondary" className="text-[9px] h-4">Active</Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Real Earth Mode Toggle */}
      <Button
        variant={realEarthMode ? "default" : "outline"}
        size="sm"
        className={`h-8 text-xs gap-1.5 ${realEarthMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-card/90 backdrop-blur-md border-border/50"}`}
        onClick={onToggleRealEarth}
      >
        <Globe2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{realEarthMode ? (realEarthLocationName || "Real Earth") : "Real Earth"}</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-5 bg-border/50 mx-0.5 hidden sm:block" />

      {/* Day/Night */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 bg-card/90 backdrop-blur-md border-border/50"
        onClick={onToggleNight}
      >
        {isNight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{isNight ? "Night" : "Day"}</span>
      </Button>

      {/* Sound */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 bg-card/90 backdrop-blur-md border-border/50"
        onClick={onOpenSound}
      >
        <Volume2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sound</span>
      </Button>

      {/* Divider */}
      <div className="w-px h-5 bg-border/50 mx-0.5 hidden sm:block" />

      {/* Play Mode */}
      <Button
        variant={playMode ? "destructive" : "default"}
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={onTogglePlay}
      >
        {playMode ? <X className="h-3.5 w-3.5" /> : <Gamepad2 className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{playMode ? "Exit" : "Play"}</span>
      </Button>

      {/* Tools Dropdown */}
      {!playMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-card/90 backdrop-blur-md border-border/50">
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onToggleMeasure} className="gap-2 text-xs">
              <Ruler className="h-3.5 w-3.5" />
              {measureMode ? "Stop Measuring" : "Measure"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenExport} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export STL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenMods} className="gap-2 text-xs">
              <Package className="h-3.5 w-3.5" />
              Mod Manager
              {activeMod && (
                <Badge variant="secondary" className="text-[9px] ml-auto h-4">1</Badge>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
