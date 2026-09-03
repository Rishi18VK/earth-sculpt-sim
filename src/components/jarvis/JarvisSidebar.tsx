import { useState } from "react";
import { RotateCcw, RotateCw, Save, SlidersHorizontal, Box, Sun, PanelsTopLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { HOLO_COLORS, type EnvPreset, type ModelConfiguration } from "@/lib/jarvis/config";
import type { ModelDefinition } from "@/lib/jarvis/models";

type Tab = "transform" | "material" | "lighting" | "environment" | "parts";
const TABS: { id: Tab; label: string; icon: typeof Box }[] = [
  { id: "transform", label: "Transform", icon: SlidersHorizontal },
  { id: "material", label: "Material", icon: Box },
  { id: "lighting", label: "Lighting", icon: Sun },
  { id: "environment", label: "Environment", icon: PanelsTopLeft },
  { id: "parts", label: "Parts", icon: Eye },
];

interface Props {
  model: ModelDefinition | null;
  config: ModelConfiguration;
  update: <K extends keyof ModelConfiguration>(section: K, patch: Partial<ModelConfiguration[K]>) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

function Field({ label, value, min, max, step = 0.01, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="flex justify-between text-[11px] font-medium text-muted-foreground"><span>{label}</span><span className="font-mono text-foreground">{value.toFixed(step < 1 ? 2 : 0)}</span></span>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} />
    </label>
  );
}

export default function JarvisSidebar({ model, config, update, reset, undo, redo, save, saving, canUndo, canRedo }: Props) {
  const [tab, setTab] = useState<Tab>("transform");
  return (
    <aside className="flex min-h-0 flex-col border-t border-border/40 bg-card/40 lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between border-b border-border/40 p-3">
        <div><p className="text-eyebrow text-primary">Inspector</p><p className="mt-1 text-sm font-semibold">Model controls</p></div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Undo" onClick={undo} disabled={!canUndo}><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Redo" onClick={redo} disabled={!canRedo}><RotateCw className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-5 border-b border-border/40 bg-background/20">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-label={label} onClick={() => setTab(id)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 px-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground", tab === id ? "border-primary text-primary" : "border-transparent") }><Icon className="h-4 w-4" /><span>{label}</span></button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!model && <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">No reconstruction is mapped to this location yet. A blueprint fallback is shown.</div>}
        {tab === "transform" && <div className="space-y-5"><Field label="Scale" value={config.transform.scale} min={0.45} max={2.4} step={0.05} onChange={(scale) => update("transform", { scale })} /><Field label="Rotation" value={config.transform.rotationY} min={-180} max={180} step={1} onChange={(rotationY) => update("transform", { rotationY })} /><Field label="Height" value={config.transform.height} min={-1} max={2} step={0.05} onChange={(height) => update("transform", { height })} /><p className="text-xs text-muted-foreground">Drag to orbit. Scroll to zoom.</p></div>}
        {tab === "material" && <div className="space-y-5"><div><p className="mb-2 text-[11px] font-medium text-muted-foreground">Hologram color</p><div className="flex flex-wrap gap-2">{HOLO_COLORS.map((color) => <button key={color} type="button" aria-label={`Set color ${color}`} onClick={() => update("material", { color })} className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", config.material.color === color ? "border-foreground ring-2 ring-primary/60" : "border-border/60")} style={{ backgroundColor: color }} />)}</div></div><Field label="Metalness" value={config.material.metalness} min={0} max={1} onChange={(metalness) => update("material", { metalness })} /><Field label="Roughness" value={config.material.roughness} min={0} max={1} onChange={(roughness) => update("material", { roughness })} /><Field label="Opacity" value={config.material.opacity} min={0.2} max={1} onChange={(opacity) => update("material", { opacity })} /><Field label="Glow" value={config.material.emissive} min={0} max={2} onChange={(emissive) => update("material", { emissive })} /><div className="flex items-center justify-between text-xs"><span>Wireframe overlay</span><Switch checked={config.material.wireframe} onCheckedChange={(wireframe) => update("material", { wireframe })} /></div></div>}
        {tab === "lighting" && <div className="space-y-5"><Field label="Key light" value={config.lighting.key} min={0} max={3} onChange={(key) => update("lighting", { key })} /><Field label="Ambient light" value={config.lighting.ambient} min={0} max={1.5} onChange={(ambient) => update("lighting", { ambient })} /><p className="text-xs leading-relaxed text-muted-foreground">A cool key light and colored rim light keep the reconstruction readable against the deep-space stage.</p></div>}
        {tab === "environment" && <div className="space-y-5"><div><p className="mb-2 text-[11px] font-medium text-muted-foreground">Stage preset</p><div className="grid grid-cols-2 gap-2">{(["void", "orbit", "dusk", "grid", "aurora"] as EnvPreset[]).map((preset) => <Button key={preset} type="button" size="sm" variant={config.environment.preset === preset ? "default" : "outline"} className="justify-start capitalize" onClick={() => update("environment", { preset })}>{preset}</Button>)}</div></div>{([ ["grid", "Floor grid"], ["stars", "Star field"], ["autoRotate", "Auto rotate"], ["scanlines", "Scan line"] ] as const).map(([key, label]) => <div key={key} className="flex items-center justify-between text-xs"><span>{label}</span><Switch checked={config.environment[key]} onCheckedChange={(value) => update("environment", { [key]: value })} /></div>)}</div>}
        {tab === "parts" && <div className="space-y-2">{(model?.parts ?? [{ id: "base", label: "Base" }, { id: "body", label: "Body" }, { id: "crown", label: "Crown" }, { id: "details", label: "Details" }]).map((part) => { const visible = config.parts[part.id] !== false; return <button key={part.id} type="button" onClick={() => update("parts", { [part.id]: !visible })} className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/20 px-3 py-3 text-left text-xs transition-colors hover:bg-background/40"><span>{part.label}</span>{visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</button>; })}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border/40 p-3"><Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" />Reset</Button><Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving" : "Save model"}</Button></div>
    </aside>
  );
}
