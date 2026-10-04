import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

type Row = {
  id: string; type: string; title: string; detail: string; status: string; created_at: string;
  ai_summary: string | null; ai_category: string | null; ai_priority: string | null;
  ai_rationale: string | null; ai_actions: unknown; triaged_at: string | null;
};
const PV: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  low: "secondary", medium: "outline", high: "default", critical: "destructive",
};

export default function TriagedSubmissions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(50);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const retriage = async (id: string) => {
    setBusy(id);
    await supabase.functions.invoke("ai-triage", { body: { feedback_id: id } });
    setBusy(null); load();
  };
  const setStatus = async (id: string, status: string) => {
    await supabase.from("feedback").update({ status }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User submissions</h3>
        <Button size="sm" variant="outline" onClick={load} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur divide-y divide-border">
        {loading ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        : rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No submissions yet.</p>
        : rows.map((r) => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{r.type === "bug" ? "Bug" : "Feedback"}</Badge>
              {r.ai_priority && <Badge variant={PV[r.ai_priority] ?? "outline"}>{r.ai_priority}</Badge>}
              {r.ai_category && <Badge variant="secondary">{r.ai_category.replace("_", " ")}</Badge>}
              <span className="font-medium">{r.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.status}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{r.detail}</p>
            {r.ai_summary ? (
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <p><Sparkles className="inline h-3.5 w-3.5 mr-1 text-primary" />{r.ai_summary}</p>
                {r.ai_rationale && <p className="text-xs text-muted-foreground">{r.ai_rationale}</p>}
                {Array.isArray(r.ai_actions) && r.ai_actions.length > 0 && (
                  <ul className="list-disc pl-5 text-xs">{(r.ai_actions as string[]).map((a, i) => <li key={i}>{a}</li>)}</ul>
                )}
              </div>
            ) : <p className="text-xs text-muted-foreground">Not triaged yet.</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => retriage(r.id)}>
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : r.ai_summary ? "Re-run AI" : "Run AI triage"}
              </Button>
              {["open", "in_progress", "resolved"].map((s) => (
                <Button key={s} size="sm" variant={r.status === s ? "default" : "ghost"} onClick={() => setStatus(r.id, s)} className="capitalize">{s.replace("_", " ")}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
