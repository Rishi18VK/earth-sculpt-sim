import { useState, useRef } from "react";
import { Package, Upload, Trash2, ToggleLeft, ToggleRight, Info, FileJson, Box, X, Plus, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { InstalledMod, ModConfig, ModType } from "@/lib/mod-types";
import { MOD_TYPE_LABELS, MOD_TYPE_EMOJIS } from "@/lib/mod-types";
import { MOD_PRESETS, getPresetsByType } from "@/lib/mod-presets";

interface ModManagerProps {
  mods: InstalledMod[];
  onInstallZip: (file: File) => Promise<InstalledMod>;
  onInstallFiles: (config: File | null, model: File | null, manual?: Partial<ModConfig>) => Promise<InstalledMod>;
  onInstallPreset: (config: ModConfig) => Promise<InstalledMod>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  error: string | null;
  onClearError: () => void;
  warnings?: string[];
  onClearWarnings?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const MOD_CATEGORIES: ModType[] = ["player", "weather", "terrain_color", "biome_effect", "camera"];

function PresetCard({ preset, alreadyInstalled, uploading, onInstall }: {
  preset: typeof MOD_PRESETS[0];
  alreadyInstalled: boolean;
  uploading: boolean;
  onInstall: () => void;
}) {
  const typeConfig = preset.config[preset.config.type as keyof Pick<ModConfig, "player" | "weather" | "terrainColor" | "biomeEffect" | "camera">];

  return (
    <div className="border rounded-lg p-3 flex items-start gap-3 transition-colors hover:bg-muted/30">
      <span className="text-2xl mt-0.5">{preset.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{preset.config.name}</h4>
          <Badge variant="outline" className="text-[9px]">{MOD_TYPE_LABELS[preset.config.type]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{preset.config.description}</p>
        <PresetStats config={preset.config} />
      </div>
      <Button
        size="sm"
        variant={alreadyInstalled ? "secondary" : "default"}
        className="shrink-0 text-xs gap-1"
        disabled={uploading || alreadyInstalled}
        onClick={onInstall}
      >
        {alreadyInstalled ? "Installed" : (
          <>
            <Zap className="h-3 w-3" />
            Install
          </>
        )}
      </Button>
    </div>
  );
}

function PresetStats({ config }: { config: ModConfig }) {
  const stats: string[] = [];

  if (config.player) {
    if (config.player.speed != null) stats.push(`Speed: ${config.player.speed}`);
    if (config.player.jumpForce != null) stats.push(`Jump: ${config.player.jumpForce}`);
    if (config.player.gravity != null) stats.push(`Gravity: ${config.player.gravity}`);
    if (config.player.scale != null) stats.push(`Scale: ${config.player.scale}x`);
  }
  if (config.weather) {
    if (config.weather.particleCount != null) stats.push(`Particles: ${config.weather.particleCount}`);
    if (config.weather.speed != null) stats.push(`Speed: ${config.weather.speed}`);
    if (config.weather.opacity != null) stats.push(`Opacity: ${config.weather.opacity}`);
  }
  if (config.terrainColor) {
    if (config.terrainColor.hueShift != null) stats.push(`Hue: ${config.terrainColor.hueShift > 0 ? "+" : ""}${config.terrainColor.hueShift}`);
    if (config.terrainColor.saturationShift != null) stats.push(`Sat: ${config.terrainColor.saturationShift > 0 ? "+" : ""}${config.terrainColor.saturationShift}`);
  }
  if (config.biomeEffect) {
    if (config.biomeEffect.objectDensityMultiplier != null) stats.push(`Density: ${config.biomeEffect.objectDensityMultiplier}x`);
    if (config.biomeEffect.objectScaleMultiplier != null) stats.push(`Scale: ${config.biomeEffect.objectScaleMultiplier}x`);
    if (config.biomeEffect.glowEnabled) stats.push("Glow ✓");
  }
  if (config.camera) {
    if (config.camera.firstPerson) stats.push("First Person");
    if (config.camera.distance != null) stats.push(`Dist: ${config.camera.distance}`);
    if (config.camera.fov != null) stats.push(`FOV: ${config.camera.fov}`);
    if (config.camera.autoRotate) stats.push("Auto Orbit");
  }

  if (stats.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
      {stats.map((s, i) => <span key={i}>{s}</span>)}
    </div>
  );
}

function ModInfoExpanded({ mod }: { mod: InstalledMod }) {
  const allStats: { label: string; value: string | number }[] = [];

  if (mod.config.player) {
    const p = mod.config.player;
    if (p.speed != null) allStats.push({ label: "Speed", value: p.speed });
    if (p.sprintSpeed != null) allStats.push({ label: "Sprint", value: p.sprintSpeed });
    if (p.jumpForce != null) allStats.push({ label: "Jump", value: p.jumpForce });
    if (p.scale != null) allStats.push({ label: "Scale", value: `${p.scale}x` });
    if (p.gravity != null) allStats.push({ label: "Gravity", value: p.gravity });
    if (p.cameraDistance != null) allStats.push({ label: "Cam Dist", value: p.cameraDistance });
  }
  if (mod.config.weather) {
    const w = mod.config.weather;
    if (w.particleCount != null) allStats.push({ label: "Particles", value: w.particleCount });
    if (w.speed != null) allStats.push({ label: "Speed", value: w.speed });
    if (w.particleSize != null) allStats.push({ label: "Size", value: w.particleSize });
    if (w.opacity != null) allStats.push({ label: "Opacity", value: w.opacity });
  }
  if (mod.config.terrainColor) {
    const t = mod.config.terrainColor;
    if (t.hueShift != null) allStats.push({ label: "Hue Shift", value: t.hueShift });
    if (t.saturationShift != null) allStats.push({ label: "Sat Shift", value: t.saturationShift });
    if (t.lightnessShift != null) allStats.push({ label: "Light Shift", value: t.lightnessShift });
  }
  if (mod.config.biomeEffect) {
    const b = mod.config.biomeEffect;
    if (b.objectDensityMultiplier != null) allStats.push({ label: "Density", value: `${b.objectDensityMultiplier}x` });
    if (b.objectScaleMultiplier != null) allStats.push({ label: "Obj Scale", value: `${b.objectScaleMultiplier}x` });
    if (b.glowEnabled) allStats.push({ label: "Glow", value: "On" });
  }
  if (mod.config.camera) {
    const c = mod.config.camera;
    if (c.firstPerson) allStats.push({ label: "Mode", value: "First Person" });
    if (c.distance != null) allStats.push({ label: "Distance", value: c.distance });
    if (c.height != null) allStats.push({ label: "Height", value: c.height });
    if (c.fov != null) allStats.push({ label: "FOV", value: c.fov });
    if (c.autoRotate) allStats.push({ label: "Auto Orbit", value: "On" });
  }

  if (allStats.length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[10px]">
      {allStats.map((s, i) => (
        <div key={i}>
          <span className="text-muted-foreground">{s.label}:</span>{" "}
          <span className="font-mono text-foreground">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ModManager({
  mods, onInstallZip, onInstallFiles, onInstallPreset, onToggle, onRemove,
  error, onClearError, warnings, onClearWarnings, externalOpen, onExternalOpenChange,
}: ModManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;
  const [uploading, setUploading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<InstalledMod | null>(null);
  const [presetCategory, setPresetCategory] = useState<ModType>("player");
  const zipInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [manualName, setManualName] = useState("Custom Player");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualSpeed, setManualSpeed] = useState("8");
  const [manualJump, setManualJump] = useState("10");
  const [manualScale, setManualScale] = useState("1");

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const mod = await onInstallZip(file);
      toast.success(`Mod "${mod.config.name}" installed!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to install mod");
    } finally {
      setUploading(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  const handleFilesUpload = async () => {
    const configFile = configInputRef.current?.files?.[0] || null;
    const modelFile = modelInputRef.current?.files?.[0] || null;

    if (!configFile && !modelFile) {
      toast.error("Please provide at least a config file or model file");
      return;
    }

    setUploading(true);
    try {
      const manual: Partial<ModConfig> = {
        name: manualName || "Custom Player",
        author: manualAuthor || "Unknown",
        type: "player",
        player: {
          speed: parseFloat(manualSpeed) || 8,
          jumpForce: parseFloat(manualJump) || 10,
          scale: parseFloat(manualScale) || 1,
        },
      };
      const mod = await onInstallFiles(configFile, modelFile, manual);
      toast.success(`Mod "${mod.config.name}" installed!`);
      setManualName("Custom Player");
      setManualAuthor("");
      setManualSpeed("8");
      setManualJump("10");
      setManualScale("1");
    } catch (err: any) {
      toast.error(err.message || "Failed to install mod");
    } finally {
      setUploading(false);
      if (configInputRef.current) configInputRef.current.value = "";
      if (modelInputRef.current) modelInputRef.current.value = "";
    }
  };

  const activeModCount = mods.filter((m) => m.enabled).length;

  const categoryPresets = getPresetsByType(presetCategory);
  const modsByType = MOD_CATEGORIES.reduce<Record<ModType, InstalledMod[]>>((acc, type) => {
    acc[type] = mods.filter((m) => m.config.type === type);
    return acc;
  }, {} as Record<ModType, InstalledMod[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Package className="h-3.5 w-3.5" />
          Mods
          {activeModCount > 0 && (
            <Badge variant="secondary" className="text-[9px] ml-1">
              {activeModCount} Active
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Mod Manager
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
            <span className="text-xs text-destructive flex-1 whitespace-pre-line font-medium">{error}</span>
            <button onClick={onClearError} className="text-destructive hover:text-destructive/80" aria-label="Dismiss error">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-amber-500">Installed with warnings</p>
              {warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-500/90 whitespace-pre-line">• {w}</p>
              ))}
            </div>
            <button onClick={onClearWarnings} className="text-amber-500 hover:text-amber-500/80" aria-label="Dismiss warnings">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <Tabs defaultValue="presets">
          <TabsList className="w-full">
            <TabsTrigger value="presets" className="flex-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="installed" className="flex-1">
              Installed ({mods.length})
            </TabsTrigger>
            <TabsTrigger value="install" className="flex-1">
              <Plus className="h-3 w-3 mr-1" />
              Custom
            </TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-3">
            <p className="text-xs text-muted-foreground">One-click install built-in mods. Only one mod per type can be active.</p>

            {/* Category selector */}
            <div className="flex flex-wrap gap-1.5">
              {MOD_CATEGORIES.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={presetCategory === type ? "default" : "outline"}
                  className="text-xs gap-1 h-7"
                  onClick={() => setPresetCategory(type)}
                >
                  {MOD_TYPE_EMOJIS[type]} {MOD_TYPE_LABELS[type]}
                  <Badge variant="secondary" className="text-[9px] ml-0.5">
                    {getPresetsByType(type).length}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Presets for selected category */}
            <div className="space-y-2">
              {categoryPresets.map((preset) => {
                const alreadyInstalled = mods.some((m) => m.config.name === preset.config.name);
                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    alreadyInstalled={alreadyInstalled}
                    uploading={uploading}
                    onInstall={async () => {
                      setUploading(true);
                      try {
                        await onInstallPreset(preset.config);
                        toast.success(`"${preset.config.name}" installed!`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to install preset");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                );
              })}
            </div>
          </TabsContent>

          {/* Installed Mods Tab */}
          <TabsContent value="installed" className="space-y-3">
            {mods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No mods installed</p>
                <p className="text-xs mt-1">Install mods from the Presets tab</p>
              </div>
            ) : (
              MOD_CATEGORIES.map((type) => {
                const typeMods = modsByType[type];
                if (typeMods.length === 0) return null;
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      {MOD_TYPE_EMOJIS[type]} {MOD_TYPE_LABELS[type]} ({typeMods.length})
                    </h3>
                    <div className="space-y-2">
                      {typeMods.map((mod) => (
                        <div
                          key={mod.id}
                          className={`border rounded-lg p-3 transition-colors ${
                            mod.enabled ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground truncate">{mod.config.name}</h4>
                                <Badge variant={mod.enabled ? "default" : "secondary"} className="text-[9px] shrink-0">
                                  {mod.enabled ? "Active" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                v{mod.config.version} by {mod.config.author}
                              </p>
                              {mod.config.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.config.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                {mod.modelUrl && (
                                  <span className="flex items-center gap-1"><Box className="h-3 w-3" /> Custom Model</span>
                                )}
                                <span className="capitalize">{mod.source}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMod(selectedMod?.id === mod.id ? null : mod)}>
                                <Info className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(mod.id)}>
                                {mod.enabled ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => { onRemove(mod.id); toast.info(`Mod "${mod.config.name}" removed`); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {selectedMod?.id === mod.id && <ModInfoExpanded mod={mod} />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Install Tab */}
          <TabsContent value="install" className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Mod Package (.zip / .pak)
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload a ZIP or Pak with a <code>mod.json</code> manifest. Executable files, scripts, HTML, and paths with <code>..</code> are rejected. Max 20 MB.
              </p>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,.pak,application/zip,application/x-zip-compressed"
                onChange={handleZipUpload}
                className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                disabled={uploading}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileJson className="h-4 w-4 text-primary" />
                Upload Individual Files
              </h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Mod Name</Label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="My Custom Player" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Author</Label>
                  <Input value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} placeholder="Your name" className="h-8 text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Speed</Label>
                    <Input value={manualSpeed} onChange={(e) => setManualSpeed(e.target.value)} type="number" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Jump Force</Label>
                    <Input value={manualJump} onChange={(e) => setManualJump(e.target.value)} type="number" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Scale</Label>
                    <Input value={manualScale} onChange={(e) => setManualScale(e.target.value)} type="number" step="0.1" className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Config File (mod.json) — optional</Label>
                  <input ref={configInputRef} type="file" accept=".json" className="block w-full text-xs mt-1 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-secondary-foreground file:cursor-pointer" />
                </div>
                <div>
                  <Label className="text-xs">3D Model (GLB/GLTF/OBJ) — optional</Label>
                  <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" className="block w-full text-xs mt-1 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-secondary-foreground file:cursor-pointer" />
                </div>
              </div>
              <Button onClick={handleFilesUpload} disabled={uploading} size="sm" className="w-full text-xs">
                {uploading ? "Installing..." : "Install Mod"}
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-xs font-semibold mb-2">📄 mod.json — Supported Types</h4>
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`// Player Mod
{ "type": "player",
  "player": { "speed": 10, "jumpForce": 12 } }

// Weather Mod
{ "type": "weather",
  "weather": { "particleColor": "#ff0", "speed": 2 } }

// Terrain Color Mod
{ "type": "terrain_color",
  "terrainColor": { "hueShift": 0.3 } }

// Biome Effect Mod
{ "type": "biome_effect",
  "biomeEffect": { "objectDensityMultiplier": 2 } }

// Camera Mod
{ "type": "camera",
  "camera": { "firstPerson": true, "fov": 90 } }`}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
