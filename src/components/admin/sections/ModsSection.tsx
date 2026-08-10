import { useMemo, useRef } from "react";
import { Check, X, Star, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, DataTable, Pill, StatCard, StateRow, fmtDate } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listMods, updateMod, type ModEntry } from "@/lib/admin/admin-data";

const tone = { approved: "success", pending: "warning", rejected: "danger" } as const;

export default function ModsSection() {
  const { data, loading, error, refetch } = useAsyncData(listMods);
  const mods = useMemo(() => data ?? [], [data]);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = async (id: string, patch: Partial<Pick<ModEntry, "status" | "featured">>, msg: string) => {
    try {
      await updateMod(id, patch);
      toast.success(msg);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <AdminSection
      title="Mod Management"
      description="Review, approve and feature community mods."
      actions={
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,.glb"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) toast.info("Upload mods from the public Mods page — they arrive here for review.");
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
        <StateRow loading={loading} error={error} empty={!mods.length} cols={6} />
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
