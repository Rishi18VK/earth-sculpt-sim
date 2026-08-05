import { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AdminSection, Panel, Pill } from "../AdminUI";
import { mockSettings } from "@/lib/admin/mock-data";

export default function SettingsSection() {
  const [settings, setSettings] = useState(mockSettings);

  const toggleFeature = (key: string) =>
    setSettings((s) => ({
      ...s,
      features: s.features.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    }));

  return (
    <AdminSection
      title="Settings"
      description="General configuration, branding and feature flags."
      actions={
        <Button className="rounded-xl premium-gradient border-0 text-white gap-2" onClick={() => toast.success("Settings saved")}>
          <Save className="h-4 w-4" /> Save changes
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">General</h2>
          {[
            { label: "Site name", key: "siteName" as const },
            { label: "Tagline", key: "tagline" as const },
            { label: "Support email", key: "supportEmail" as const },
          ].map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-eyebrow text-muted-foreground">{f.label}</label>
              <Input
                value={settings[f.key]}
                onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
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
                onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))}
                aria-label="Primary color"
                className="h-10 w-14 rounded-lg bg-transparent border border-input cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))}
                className="rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-eyebrow text-muted-foreground">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as typeof s.theme }))}
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
                setSettings((s) => ({ ...s, maintenanceMode: v }));
                toast.success(v ? "Maintenance mode enabled" : "Maintenance mode disabled");
              }}
              aria-label="Maintenance mode"
            />
          </div>
        </Panel>
      </div>
    </AdminSection>
  );
}
