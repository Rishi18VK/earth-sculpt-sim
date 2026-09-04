import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import JarvisCanvas from "@/components/jarvis/JarvisCanvas";
import JarvisHeader from "@/components/jarvis/JarvisHeader";
import JarvisLocationRail from "@/components/jarvis/JarvisLocationRail";
import JarvisSidebar from "@/components/jarvis/JarvisSidebar";
import JarvisStatusBar from "@/components/jarvis/JarvisStatusBar";
import { useModelCustomization } from "@/hooks/use-model-customization";
import { useAuth } from "@/contexts/AuthContext";
import { JARVIS_LOCATIONS, getModelForLocation } from "@/lib/jarvis/models";
import { resolveQuality, type QualityPreset } from "@/lib/jarvis/config";

const QUALITY_CYCLE: QualityPreset[] = ["auto", "low", "medium", "high"];

export default function Jarvis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState<QualityPreset>("auto");
  const [jarvisOn, setJarvisOn] = useState(true);

  const selectedId = params.get("location") ?? JARVIS_LOCATIONS[0].id;
  const location = useMemo(
    () => JARVIS_LOCATIONS.find((l) => l.id === selectedId) ?? JARVIS_LOCATIONS[0],
    [selectedId],
  );
  const model = useMemo(() => getModelForLocation(location.id), [location.id]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return JARVIS_LOCATIONS;
    return JARVIS_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q),
    );
  }, [query]);

  const { config, update, reset, undo, redo, save, saving, dirty, canUndo, canRedo } =
    useModelCustomization(location.id, model?.id ?? null);

  useEffect(() => {
    document.title = `JARVIS — ${location.name} | Terra Explorer`;
  }, [location.name]);

  const resolved = resolveQuality(quality);

  const handleSave = async () => {
    const { error, cloud } = await save();
    if (error) toast.error("Could not save", { description: error });
    else toast.success(cloud ? "Saved to your account" : "Saved on this device");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/jarvis?location=${location.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.error("Copy failed", { description: url });
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ location: location.id, model: model?.id, config }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-${location.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <JarvisHeader
        locationName={location.name}
        quality={resolved}
        jarvisOn={jarvisOn}
        dirty={dirty}
        onBack={() => navigate("/discover")}
        onToggle={() => setJarvisOn((v) => !v)}
        onQuality={() => {
          const next = QUALITY_CYCLE[(QUALITY_CYCLE.indexOf(quality) + 1) % QUALITY_CYCLE.length];
          setQuality(next);
          toast.info(`Quality preset: ${next.toUpperCase()}`);
        }}
        onShare={handleShare}
        onExport={handleExport}
      />
      <main className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[16rem_1fr_20rem] lg:grid-rows-1">
        <JarvisLocationRail
          locations={filtered}
          selectedId={location.id}
          query={query}
          onQuery={setQuery}
          onSelect={(id) => setParams({ location: id }, { replace: true })}
        />
        <section className="relative min-h-[42vh] bg-black/60">
          {jarvisOn ? (
            <JarvisCanvas model={model} config={config} quality={resolved} />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              JARVIS is on standby. Power the system back on to render the reconstruction.
            </div>
          )}
          <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-border/40 bg-background/70 p-3 backdrop-blur-xl">
            <p className="text-eyebrow text-primary">{location.region}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{location.description}</p>
          </div>
        </section>
        <JarvisSidebar
          model={model}
          config={config}
          update={update}
          reset={reset}
          undo={undo}
          redo={redo}
          save={handleSave}
          saving={saving}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </main>
      <JarvisStatusBar quality={resolved} modelReady={!!model} online={!!user} />
    </div>
  );
}
