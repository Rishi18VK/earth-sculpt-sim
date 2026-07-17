import { useState } from "react";
import { Package, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useMods } from "@/hooks/use-mods";
import ModManager from "@/components/terrain/ModManager";

export default function ModsPage() {
  const { mods } = useMods();
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
        <p className="text-xs text-muted-foreground">All mods are validated on import: schema check, model file sniffing and size limit (10MB). Only .glb / .gltf / .zip / .pak accepted.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ModManager
          mods={mods}
          onInstallZip={async (f) => { const { installFromZip } = useMods() as any; return installFromZip(f); }}
          onInstallFiles={async () => { throw new Error("use panel"); }}
          onInstallPreset={async () => { throw new Error("use panel"); }}
          onToggle={async () => {}}
          onRemove={async () => {}}
          error={null}
          onClearError={() => {}}
          externalOpen={open}
          onExternalOpenChange={setOpen}
        />
        {!open && (
          <button onClick={() => setOpen(true)} className="w-full glass-card rounded-2xl h-12 font-semibold premium-gradient-text">
            Open Mod Manager
          </button>
        )}
      </motion.div>
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
