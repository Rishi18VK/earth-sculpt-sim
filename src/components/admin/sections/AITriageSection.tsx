import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

type Result = { summary: string; category: string; priority: string; rationale: string; suggested_actions: string[] };

const PRIORITY_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  low: "secondary", medium: "outline", high: "default", critical: "destructive",
};

export default function AITriageSection() {
  const [kind, setKind] = useState<"bug" | "feedback">("bug");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    const { data, error } = await supabase.functions.invoke("ai-triage", { body: { kind, text } });
    setLoading(false);
    if (error) {
      let msg = error.message;
      try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) msg = b.error; } catch { /* keep */ }
      setError(msg); return;
    }
    if (data?.error) { setError(data.error); return; }
    setResult(data as Result);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">AI Triage</h2>
        <p className="text-sm text-muted-foreground">Paste a bug report or feedback post to get an AI-powered summary, category and recommended priority.</p>
      </div>
      <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3 backdrop-blur">
        <div className="flex gap-2">
          {(["bug", "feedback"] as const).map((k) => (
            <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
              {k === "bug" ? "Bug report" : "Feedback"}
            </Button>
          ))}
        </div>
        <Textarea rows={8} maxLength={8000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Paste the user's submission here…" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{text.length}/8000</span>
          <Button onClick={run} disabled={loading || text.trim().length < 5}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {result && (
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Category: {result.category.replace("_", " ")}</Badge>
            <Badge variant={PRIORITY_VARIANT[result.priority] ?? "outline"}>Priority: {result.priority}</Badge>
          </div>
          <p className="text-sm">{result.summary}</p>
          {result.rationale && <p className="text-xs text-muted-foreground">Why: {result.rationale}</p>}
          {result.suggested_actions.length > 0 && (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {result.suggested_actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
