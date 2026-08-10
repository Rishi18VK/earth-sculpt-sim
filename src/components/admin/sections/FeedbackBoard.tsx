import { useMemo, useState } from "react";
import { Bug, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, StatCard, StateBlock, fmtDate } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listFeedback, setFeedbackStatus, type FeedbackItem } from "@/lib/admin/admin-data";

const typeMeta = {
  feedback: { icon: MessageSquare, label: "Feedback" },
  feature: { icon: Lightbulb, label: "Feature request" },
  bug: { icon: Bug, label: "Bug report" },
} as const;

const statusTone = { open: "warning", in_progress: "info", resolved: "success" } as const;
const NEXT: Record<FeedbackItem["status"], FeedbackItem["status"]> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "open",
};

/** Shared board used by the Feedback and Bug Reports modules. */
export default function FeedbackBoard({
  only,
  title,
  description,
}: {
  only?: FeedbackItem["type"];
  title: string;
  description: string;
}) {
  const { data, loading, error, refetch } = useAsyncData(listFeedback);
  const [filter, setFilter] = useState<"all" | FeedbackItem["type"]>("all");

  const scoped = useMemo(() => (data ?? []).filter((i) => (only ? i.type === only : true)), [data, only]);
  const visible = scoped.filter((i) => only || filter === "all" || i.type === filter);

  const advance = async (item: FeedbackItem) => {
    try {
      await setFeedbackStatus(item.id, NEXT[item.status]);
      toast.success("Status updated");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <AdminSection
      title={title}
      description={description}
      actions={
        only ? undefined : (
          <div className="flex gap-1 glass-card rounded-xl p-1">
            {(["all", "feedback", "feature", "bug"] as const).map((f) => (
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
        )
      }
    >
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Open" value={scoped.filter((i) => i.status === "open").length} index={0} />
        <StatCard label="In Progress" value={scoped.filter((i) => i.status === "in_progress").length} index={1} />
        <StatCard label="Resolved" value={scoped.filter((i) => i.status === "resolved").length} index={2} />
      </div>

      <StateBlock loading={loading} error={error} empty={!visible.length} />

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((i) => {
          const Icon = typeMeta[i.type].icon;
          return (
            <Panel key={i.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-medium truncate">{i.title}</h3>
                </div>
                <Pill tone={statusTone[i.status]}>{i.status.replace("_", " ")}</Pill>
              </div>
              <p className="text-sm text-muted-foreground">{i.detail}</p>
              <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
                <span className="text-xs text-muted-foreground">{i.user} · {fmtDate(i.createdAt)}</span>
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => advance(i)}>
                  Advance status
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </AdminSection>
  );
}
