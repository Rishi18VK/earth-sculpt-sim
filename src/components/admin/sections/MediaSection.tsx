import { useMemo, useState } from "react";
import { Images, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, StatCard, StateBlock, fmtDate } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listMedia, deleteMedia } from "@/lib/admin/admin-data";

export default function MediaSection() {
  const { data, loading, error, refetch } = useAsyncData(listMedia);
  const [query, setQuery] = useState("");
  const items = useMemo(() => data ?? [], [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter((m) => m.title.toLowerCase().includes(q) || m.biome.toLowerCase().includes(q) || m.author.toLowerCase().includes(q))
      : items;
  }, [items, query]);

  const remove = async (id: string) => {
    try {
      await deleteMedia(id);
      toast.success("Media removed");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <AdminSection
      title="Media Library"
      description={loading ? "Loading media…" : `${items.length} community images.`}
      actions={
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search media…"
          className="rounded-xl w-full sm:w-64"
          aria-label="Search media"
        />
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Assets" value={items.length} icon={Images} index={0} />
        <StatCard label="Biomes covered" value={new Set(items.map((m) => m.biome)).size} index={1} />
        <StatCard label="Contributors" value={new Set(items.map((m) => m.author)).size} index={2} />
      </div>

      <StateBlock loading={loading} error={error} empty={!visible.length} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((m) => (
          <Panel key={m.id} className="space-y-3">
            <div className="rounded-xl overflow-hidden bg-foreground/5 aspect-video">
              <img src={m.imageUrl} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground truncate">{m.author} · {fmtDate(m.createdAt)}</p>
              </div>
              <Pill tone="info">{m.biome}</Pill>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
              <a href={m.imageUrl} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
              <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-destructive hover:text-destructive" onClick={() => remove(m.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
