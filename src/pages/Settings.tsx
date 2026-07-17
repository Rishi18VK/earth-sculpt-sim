import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings, type AppSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/use-haptics";

const GRAPHICS: AppSettings["graphics"][] = ["low", "medium", "high", "ultra"];
const FPS: AppSettings["fps_limit"][] = [30, 60, 120, 0];
const LANGS: { code: AppSettings["language"]; label: string }[] = [
  { code: "en", label: "English" }, { code: "hi", label: "हिन्दी" }, { code: "es", label: "Español" },
];
const THEMES: AppSettings["theme"][] = ["dark", "light", "system"];

export default function Settings() {
  const nav = useNavigate();
  const { settings, update } = useSettings();
  const haptics = useHaptics();

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-eyebrow text-muted-foreground">Settings</p>
          <h1 className="text-2xl font-extrabold">Preferences</h1>
        </div>
      </header>

      <Section title="Graphics">
        <Segmented value={settings.graphics} options={GRAPHICS.map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))}
          onChange={(v) => { haptics.tap(); update({ graphics: v as AppSettings["graphics"] }); }} />
      </Section>

      <Section title="Frame rate limit">
        <Segmented value={String(settings.fps_limit)} options={FPS.map(v => ({ value: String(v), label: v === 0 ? "Unlimited" : `${v} FPS` }))}
          onChange={(v) => { haptics.tap(); update({ fps_limit: Number(v) as AppSettings["fps_limit"] }); }} />
      </Section>

      <Section title="Audio">
        <SliderRow label="Music volume" value={settings.music_volume} onChange={(v) => update({ music_volume: v })} />
        <SliderRow label="Sound effects" value={settings.sfx_volume} onChange={(v) => update({ sfx_volume: v })} />
      </Section>

      <Section title="Appearance">
        <p className="text-xs text-muted-foreground mb-1.5">Theme</p>
        <Segmented value={settings.theme} options={THEMES.map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
          onChange={(v) => { haptics.tap(); update({ theme: v as AppSettings["theme"] }); }} />
      </Section>

      <Section title="Language">
        <Segmented value={settings.language} options={LANGS.map(l => ({ value: l.code, label: l.label }))}
          onChange={(v) => { haptics.tap(); update({ language: v as AppSettings["language"] }); }} />
      </Section>

      <Section title="Accessibility">
        <Toggle label="Reduce motion" checked={settings.reduced_motion} onChange={(v) => update({ reduced_motion: v })} />
        <Toggle label="High contrast" checked={settings.high_contrast} onChange={(v) => update({ high_contrast: v })} />
        <Toggle label="Larger text" checked={settings.larger_text} onChange={(v) => update({ larger_text: v })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </motion.section>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/30">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2 py-2 rounded-lg text-xs font-semibold transition-colors",
            value === o.value ? "premium-gradient text-white shadow" : "text-muted-foreground hover:text-foreground"
          )}
        >{o.label}</button>
      ))}
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground text-amount">{Math.round(value * 100)}%</span>
      </div>
      <Slider value={[value * 100]} min={0} max={100} step={1} onValueChange={(vals) => onChange(vals[0] / 100)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-1 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        role="switch" aria-checked={checked}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "premium-gradient" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )} />
      </button>
    </label>
  );
}
