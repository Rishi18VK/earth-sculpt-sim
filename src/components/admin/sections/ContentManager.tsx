import { useMemo, useState } from "react";
import { Save, Mountain, Landmark, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, StateBlock, fmtDate } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listContent, saveContent, createContent, deleteContent, type ContentItem } from "@/lib/admin/admin-data";

/** Shared editor used by the Terrain, Landmark and Content modules. */
export default function ContentManager({
  kind,
  title,
  description,
}: {
  kind: "terrain" | "landmark" | "all";
  title: string;
  description: string;
}) {
  const { data, loading, error, refetch, setData } = useAsyncData(listContent);
  const [draft, setDraft] = useState("");

  const items = useMemo(
    () => (data ?? []).filter((i) => kind === "all" || i.kind === kind),
    [data, kind]
  );

  const patch = (id: string, p: Partial<ContentItem>) =>
    setData((prev) => (prev ?? []).map((i) => (i.id === id ? { ...i, ...p } : i)));

  const save = async (item: ContentItem) => {
    try {
      await saveContent(item.id, { title: item.title, description: item.description, published: item.published });
      toast.success(`${item.title} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const add = async () => {
    if (!draft.trim()) return toast.error("Enter a title first");
    try {
      await createContent(draft.trim(), kind === "all" ? "terrain" : kind);
      setDraft("");
      toast.success("Created");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const remove = async (item: ContentItem) => {
    try {
      await deleteContent(item.id);
      toast.success(`${item.title} deleted`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <AdminSection
      title={title}
      description={description}
      actions={
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`New ${kind === "all" ? "entry" : kind} title`}
            className="rounded-xl w-full sm:w-56"
            aria-label="New entry title"
          />
          <Button className="rounded-xl premium-gradient border-0 text-white gap-2 shrink-0" onClick={add}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      }
    >
      <StateBlock loading={loading} error={error} empty={!items.length} />

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Panel key={item.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.kind === "terrain" ? (
                  <Mountain className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Landmark className="h-4 w-4 text-primary shrink-0" />
                )}
                <Input
                  value={item.title}
                  onChange={(e) => patch(item.id, { title: e.target.value })}
                  className="rounded-lg h-9 font-medium"
                  aria-label="Title"
                />
              </div>
              <Pill tone={item.published ? "success" : "warning"}>{item.published ? "published" : "draft"}</Pill>
            </div>

            <Textarea
              value={item.description}
              onChange={(e) => patch(item.id, { description: e.target.value })}
              rows={3}
              className="rounded-xl resize-none"
              aria-label={`Description for ${item.title}`}
            />

            <p className="text-xs text-muted-foreground">
              {item.media} media · updated {fmtDate(item.updatedAt)}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={item.published} onCheckedChange={(v) => patch(item.id, { published: v })} />
                Published
              </label>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive gap-1.5" onClick={() => remove(item)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <Button size="sm" className="rounded-lg gap-1.5 premium-gradient border-0 text-white" onClick={() => save(item)}>
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
