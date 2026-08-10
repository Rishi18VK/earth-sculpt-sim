import { useState, useEffect } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, StateBlock } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAppSettings, saveAppSettings, type AppSettings } from "@/lib/admin/admin-data";

export default function SettingsSection() {
  const { data, loading, error } = useAsyncData(getAppSettings);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => setSettings(data), [data]);

  const save = async (next?: AppSettings) => {
    const s = next ?? settings;
    if (!s) return;
    try {
      await saveAppSettings(s);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  if (!settings) {
    return (
      <AdminSection title="Settings" description="General configuration, branding and feature flags.">
        <StateBlock loading={loading} error={error} empty={!settings} />
      </AdminSection>
    );
  }

  const toggleFeature = (key: string) =>
    setSettings((s) =>
      s ? { ...s, features: s.features.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)) } : s
    );

  return (
    <AdminSection
      title="Settings"
      description="General configuration, branding and feature flags."
      actions={
        <Button className="rounded-xl premium-gradient border-0 text-white gap-2" onClick={() => save()}>
          <Save className="h-4 w-4" /> Save changes
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">General</h2>
          {([
            { label: "Site name", key: "siteName" },
            { label: "Tagline", key: "tagline" },
            { label: "Support email", key: "supportEmail" },
          ] as const).map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-eyebrow text-muted-foreground">{f.label}</label>
              <Input
                value={settings[f.key]}
                onChange={(e) => setSettings((s) => (s ? { ...s, [f.key]: e.target.value } : s))}
                className="rounded-xl"
              />
            </div>
          ))}
        </Panel>

        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Branding &amp; theme</h2>
          <div className="space-y-1.5">
            <label className="text-eyebrow text-muted-foreground">Primary color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings((s) => (s ? { ...s, primaryColor: e.target.value } : s))}
                aria-label="Primary color"
                className="h-10 w-14 rounded-lg bg-transparent border border-input cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings((s) => (s ? { ...s, primaryColor: e.target.value } : s))}
                className="rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-eyebrow text-muted-foreground">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings((s) => (s ? { ...s, theme: e.target.value as AppSettings["theme"] } : s))}
              aria-label="Theme"
              className="w-full rounded-xl bg-background border border-input px-3 py-2 text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Feature toggles</h2>
          {settings.features.length === 0 && <p className="text-sm text-muted-foreground">No feature flags configured.</p>}
          {settings.features.map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <span className="text-sm">{f.label}</span>
              <Switch checked={f.enabled} onCheckedChange={() => toggleFeature(f.key)} aria-label={f.label} />
            </div>
          ))}
        </Panel>

        <Panel className="space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Maintenance mode
          </h2>
          <p className="text-sm text-muted-foreground">
            When enabled, visitors see a maintenance notice while admins keep full access.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
            <Pill tone={settings.maintenanceMode ? "warning" : "success"}>
              {settings.maintenanceMode ? "maintenance" : "operational"}
            </Pill>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => {
                const next = { ...settings, maintenanceMode: v };
                setSettings(next);
                save(next);
              }}
              aria-label="Maintenance mode"
            />
          </div>
        </Panel>
      </div>
    </AdminSection>
  );
}
