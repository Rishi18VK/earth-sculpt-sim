import { useState } from "react";
import { Image, Video, Save, Mountain, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, fmtDate } from "../AdminUI";
import { mockContent, type ContentItem } from "@/lib/admin/mock-data";

export default function ContentSection() {
  const [items, setItems] = useState<ContentItem[]>(mockContent);
  const [filter, setFilter] = useState<"all" | "terrain" | "landmark">("all");

  const visible = items.filter((i) => filter === "all" || i.kind === filter);

  const patch = (id: string, p: Partial<ContentItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  return (
    <AdminSection
      title="Content"
      description="Manage terrains, landmarks, media and descriptions."
      actions={
        <div className="flex gap-1 glass-card rounded-xl p-1">
          {(["all", "terrain", "landmark"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((item) => (
          <Panel key={item.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {item.kind === "terrain" ? (
                  <Mountain className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Landmark className="h-4 w-4 text-primary shrink-0" />
                )}
                <h3 className="font-display font-semibold truncate">{item.title}</h3>
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

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" className="rounded-lg gap-1.5" onClick={() => toast.success("Image upload opened")}>
                <Image className="h-3.5 w-3.5" /> Image
              </Button>
              <Button size="sm" variant="secondary" className="rounded-lg gap-1.5" onClick={() => toast.success("Video upload opened")}>
                <Video className="h-3.5 w-3.5" /> Video
              </Button>
              <span className="text-xs text-muted-foreground">{item.media} media · updated {fmtDate(item.updatedAt)}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={item.published} onCheckedChange={(v) => patch(item.id, { published: v })} />
                Published
              </label>
              <Button size="sm" className="rounded-lg gap-1.5 premium-gradient border-0 text-white" onClick={() => toast.success(`${item.title} saved`)}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
