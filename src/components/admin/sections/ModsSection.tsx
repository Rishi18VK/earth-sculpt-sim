import { useRef, useState } from "react";
import { Check, X, Star, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, DataTable, Pill, StatCard, fmtDate } from "../AdminUI";
import { mockMods, type ModEntry } from "@/lib/admin/mock-data";

const tone = { approved: "success", pending: "warning", rejected: "danger" } as const;

export default function ModsSection() {
  const [mods, setMods] = useState<ModEntry[]>(mockMods);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (id: string, patch: Partial<ModEntry>, msg: string) => {
    setMods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    toast.success(msg);
  };

  return (
    <AdminSection
      title="Mods"
      description="Review, approve and feature community mods."
      actions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,.glb"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMods((prev) => [
                {
                  id: `mod_${Date.now()}`,
                  name: f.name.replace(/\.(zip|glb)$/i, ""),
                  author: "Admin upload",
                  version: "1.0.0",
                  status: "pending",
                  downloads: 0,
                  featured: false,
                  submittedAt: new Date().toISOString(),
                },
                ...prev,
              ]);
              toast.success("Mod queued for review");
              e.target.value = "";
            }}
          />
          <Button className="rounded-xl premium-gradient border-0 text-white gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload mod
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Mods" value={mods.length} index={0} />
        <StatCard label="Pending Review" value={mods.filter((m) => m.status === "pending").length} index={1} />
        <StatCard label="Featured" value={mods.filter((m) => m.featured).length} icon={Star} index={2} />
        <StatCard label="Downloads" value={mods.reduce((s, m) => s + m.downloads, 0).toLocaleString()} icon={Download} index={3} />
      </div>

      <DataTable head={["Mod", "Version", "Status", "Downloads", "Submitted", "Actions"]}>
        {mods.map((m) => (
          <tr key={m.id} className="hover:bg-foreground/5 transition-colors">
            <td className="px-4 py-3">
              <p className="font-medium flex items-center gap-2">
                {m.name}
                {m.featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
              </p>
              <p className="text-xs text-muted-foreground">by {m.author}</p>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{m.version}</td>
            <td className="px-4 py-3"><Pill tone={tone[m.status]}>{m.status}</Pill></td>
            <td className="px-4 py-3 tabular-nums text-muted-foreground">{m.downloads.toLocaleString()}</td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(m.submittedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => update(m.id, { status: "approved" }, "Mod approved")}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-destructive hover:text-destructive" onClick={() => update(m.id, { status: "rejected" }, "Mod rejected")}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => update(m.id, { featured: !m.featured }, m.featured ? "Removed from featured" : "Mod featured")}>
                  <Star className="h-3.5 w-3.5" /> {m.featured ? "Unfeature" : "Feature"}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </AdminSection>
  );
}
