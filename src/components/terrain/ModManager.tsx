import { useState, useRef } from "react";
import { Package, Upload, Trash2, ToggleLeft, ToggleRight, Info, FileJson, Box, X, Plus, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { InstalledMod, ModConfig } from "@/lib/mod-types";
import { MOD_PRESETS } from "@/lib/mod-presets";

interface ModManagerProps {
  mods: InstalledMod[];
  onInstallZip: (file: File) => Promise<InstalledMod>;
  onInstallFiles: (config: File | null, model: File | null, manual?: Partial<ModConfig>) => Promise<InstalledMod>;
  onInstallPreset: (config: ModConfig) => Promise<InstalledMod>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  error: string | null;
  onClearError: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export default function ModManager({
  mods,
  onInstallZip,
  onInstallFiles,
  onInstallPreset,
  onToggle,
  onRemove,
  error,
  onClearError,
  externalOpen,
  onExternalOpenChange,
}: ModManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;
  const [uploading, setUploading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<InstalledMod | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Manual config state
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
        player: {
          speed: parseFloat(manualSpeed) || 8,
          jumpForce: parseFloat(manualJump) || 10,
          scale: parseFloat(manualScale) || 1,
        },
      };
      const mod = await onInstallFiles(configFile, modelFile, manual);
      toast.success(`Mod "${mod.config.name}" installed!`);
      // Reset
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

  const activeMod = mods.find((m) => m.enabled && m.config.type === "player");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Package className="h-3.5 w-3.5" />
          Mods
          {activeMod && (
            <Badge variant="secondary" className="text-[9px] ml-1">
              1 Active
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
            <span className="text-xs text-destructive flex-1">{error}</span>
            <button onClick={onClearError} className="text-destructive hover:text-destructive/80">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <Tabs defaultValue="installed">
          <TabsList className="w-full">
            <TabsTrigger value="installed" className="flex-1">
              Installed ({mods.length})
            </TabsTrigger>
            <TabsTrigger value="install" className="flex-1">
              <Plus className="h-3 w-3 mr-1" />
              Install New
            </TabsTrigger>
          </TabsList>

          {/* Installed Mods Tab */}
          <TabsContent value="installed" className="space-y-2">
            {mods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No mods installed</p>
                <p className="text-xs mt-1">Install mods to customize your player</p>
              </div>
            ) : (
              mods.map((mod) => (
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
                          <span className="flex items-center gap-1">
                            <Box className="h-3 w-3" /> Custom Model
                          </span>
                        )}
                        {mod.config.player && (
                          <span className="flex items-center gap-1">
                            <FileJson className="h-3 w-3" /> Custom Config
                          </span>
                        )}
                        <span className="capitalize">{mod.source}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedMod(selectedMod?.id === mod.id ? null : mod)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(mod.id)}>
                        {mod.enabled ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          onRemove(mod.id);
                          toast.info(`Mod "${mod.config.name}" removed`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded info */}
                  {selectedMod?.id === mod.id && mod.config.player && (
                    <div className="mt-3 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[10px]">
                      {mod.config.player.speed != null && (
                        <div>
                          <span className="text-muted-foreground">Speed:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.speed}</span>
                        </div>
                      )}
                      {mod.config.player.sprintSpeed != null && (
                        <div>
                          <span className="text-muted-foreground">Sprint:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.sprintSpeed}</span>
                        </div>
                      )}
                      {mod.config.player.jumpForce != null && (
                        <div>
                          <span className="text-muted-foreground">Jump:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.jumpForce}</span>
                        </div>
                      )}
                      {mod.config.player.scale != null && (
                        <div>
                          <span className="text-muted-foreground">Scale:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.scale}x</span>
                        </div>
                      )}
                      {mod.config.player.gravity != null && (
                        <div>
                          <span className="text-muted-foreground">Gravity:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.gravity}</span>
                        </div>
                      )}
                      {mod.config.player.cameraDistance != null && (
                        <div>
                          <span className="text-muted-foreground">Cam Dist:</span>{" "}
                          <span className="font-mono text-foreground">{mod.config.player.cameraDistance}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Install Tab */}
          <TabsContent value="install" className="space-y-4">
            {/* ZIP Upload */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Mod Package (.zip)
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload a ZIP file containing mod.json and optional model files (GLB/GLTF/OBJ).
              </p>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                disabled={uploading}
              />
            </div>

            {/* Individual Files */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileJson className="h-4 w-4 text-primary" />
                Upload Individual Files
              </h4>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Mod Name</Label>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="My Custom Player"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Author</Label>
                  <Input
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    placeholder="Your name"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Speed</Label>
                    <Input
                      value={manualSpeed}
                      onChange={(e) => setManualSpeed(e.target.value)}
                      type="number"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Jump Force</Label>
                    <Input
                      value={manualJump}
                      onChange={(e) => setManualJump(e.target.value)}
                      type="number"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Scale</Label>
                    <Input
                      value={manualScale}
                      onChange={(e) => setManualScale(e.target.value)}
                      type="number"
                      step="0.1"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Config File (mod.json) — optional</Label>
                  <input
                    ref={configInputRef}
                    type="file"
                    accept=".json"
                    className="block w-full text-xs mt-1 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-secondary-foreground file:cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-xs">3D Model (GLB/GLTF/OBJ) — optional</Label>
                  <input
                    ref={modelInputRef}
                    type="file"
                    accept=".glb,.gltf,.obj"
                    className="block w-full text-xs mt-1 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-secondary-foreground file:cursor-pointer"
                  />
                </div>
              </div>

              <Button onClick={handleFilesUpload} disabled={uploading} size="sm" className="w-full text-xs">
                {uploading ? "Installing..." : "Install Mod"}
              </Button>
            </div>

            {/* Mod Structure Reference */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-xs font-semibold mb-2">📁 Mod Package Structure</h4>
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`/my-player-mod/
  mod.json          ← required
  player-model.glb  ← optional
  textures/         ← optional
  animations/       ← optional`}
              </pre>
              <h4 className="text-xs font-semibold mt-3 mb-1">📄 mod.json Example</h4>
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`{
  "name": "Robot Player",
  "version": "1.0.0",
  "author": "YourName",
  "type": "player",
  "model": "player-model.glb",
  "player": {
    "speed": 10,
    "sprintSpeed": 18,
    "jumpForce": 12,
    "scale": 1.2
  }
}`}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
