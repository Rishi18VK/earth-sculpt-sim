import { useState } from "react";
import { Package, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useMods } from "@/hooks/use-mods";
import ModManager from "@/components/terrain/ModManager";

export default function ModsPage() {
  const {
    mods, error, warnings, installFromZip, installFromFiles, installPreset,
    toggleMod, removeMod, clearError, clearWarnings,
  } = useMods();
  const [open, setOpen] = useState(true);
  const enabledCount = mods.filter(m => m.enabled).length;

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
      <header>
        <p className="text-eyebrow text-muted-foreground mb-1">Mods</p>
        <h1 className="text-3xl font-extrabold">Your mod collection</h1>
        <p className="text-sm text-muted-foreground mt-1">Import .zip / .pak files. Enable, disable and remove.</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={<Package className="h-4 w-4" />} label="Installed" value={mods.length} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Enabled" value={enabledCount} />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Warnings" value={0} />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1">Compatibility</p>
        <p className="text-xs text-muted-foreground">
          All mods are validated on import: schema check, model file sniffing and size limit. Supported: .glb, .gltf, .zip, .pak.
        </p>
      </div>

      {mods.length > 0 && (
        <ul className="space-y-2">
          {mods.map(m => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white text-lg">
                {m.config.type === "player" ? "🧍" : m.config.type === "weather" ? "🌦️" : "🎨"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{m.config.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">v{m.config.version} · {m.config.author}</p>
              </div>
              <button
                onClick={() => toggleMod(m.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${m.enabled ? "premium-gradient text-white" : "bg-muted text-muted-foreground"}`}
              >
                {m.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                onClick={() => removeMod(m.id)}
                className="text-[11px] font-semibold px-2 py-1.5 rounded-full text-destructive hover:bg-destructive/10"
              >Remove</button>
            </motion.li>
          ))}
        </ul>
      )}

      <button onClick={() => setOpen(true)} className="w-full glass-card rounded-2xl h-12 font-semibold premium-gradient-text">
        + Import a mod
      </button>

      <div className="sr-only">
        <ModManager
          mods={mods}
          onInstallZip={installFromZip}
          onInstallFiles={installFromFiles}
          onInstallPreset={installPreset}
          onToggle={toggleMod}
          onRemove={removeMod}
          error={error}
          onClearError={clearError}
          warnings={warnings}
          onClearWarnings={clearWarnings}
          externalOpen={open}
          onExternalOpenChange={setOpen}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-3 text-center">
      <div className="w-8 h-8 rounded-lg premium-gradient mx-auto flex items-center justify-center text-white mb-1.5">{icon}</div>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
