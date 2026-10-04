import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bug, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";

const Schema = z.object({
  title: z.string().trim().min(3, "Add a short title (3+ characters).").max(120),
  detail: z.string().trim().min(10, "Describe it in at least 10 characters.").max(4000),
});

export default function Report() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [type, setType] = useState<"bug" | "feedback">("bug");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Schema.safeParse({ title, detail });
    if (!p.success) { setError(p.error.issues[0].message); return; }
    if (!userId) return;
    setBusy(true); setError(null);
    const { data, error } = await supabase.from("feedback")
      .insert({ user_id: userId, type, title: p.data.title, detail: p.data.detail }).select("id").single();
    if (error || !data) { setBusy(false); setError("Couldn't send your report. Please try again."); return; }
    // Fire-and-forget: AI triage for admins + Discord alert.
    supabase.functions.invoke("ai-triage", { body: { feedback_id: data.id } });
    supabase.functions.invoke("discord-notify", {
      body: { kind: "feedback", title: `New ${type === "bug" ? "bug report" : "feedback"}: ${p.data.title}`, description: p.data.detail.slice(0, 1000) },
    });
    setBusy(false); setDone(true);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 pb-28">
      <h1 className="text-3xl font-semibold">Report a bug or share feedback</h1>
      <p className="mt-1 text-sm text-muted-foreground">Our team reviews every submission.</p>

      {userId === undefined ? <Loader2 className="mt-8 h-5 w-5 animate-spin" />
      : userId === null ? (
        <div className="mt-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <p className="text-sm">Please sign in to send a report.</p>
          <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
        </div>
      ) : done ? (
        <div className="mt-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <p className="font-medium">Thanks — we got it!</p>
          <Button variant="outline" onClick={() => { setDone(false); setTitle(""); setDetail(""); }}>Send another</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={type === "bug" ? "default" : "outline"} onClick={() => setType("bug")}><Bug className="mr-2 h-4 w-4" />Bug report</Button>
            <Button type="button" variant={type === "feedback" ? "default" : "outline"} onClick={() => setType("feedback")}><MessageSquare className="mr-2 h-4 w-4" />Feedback</Button>
          </div>
          <Input placeholder="Short title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          <Textarea rows={7} maxLength={4000} value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder={type === "bug" ? "What happened? What did you expect? Steps to reproduce…" : "Tell us what you think…"} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}</Button>
        </form>
      )}
    </div>
  );
}
