import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type Delivery = {
  id: string; kind: string; title: string; status: string;
  http_status: number | null; error: string | null; duration_ms: number | null; created_at: string;
};

export default function DiscordDeliveriesSection() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "delivered" | "failed">("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("discord_deliveries").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as Delivery[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const failed = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Webhook Deliveries</h2>
          <p className="text-sm text-muted-foreground">Recent Discord notifications, their delivery status and any errors.</p>
        </div>
        <div className="flex gap-2">
          {(["all", "delivered", "failed"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="outline" onClick={load} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-xl border border-border bg-card/60 p-4"><p className="text-xs text-muted-foreground">Shown</p><p className="text-2xl font-semibold">{rows.length}</p></div>
        <div className="rounded-xl border border-border bg-card/60 p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-semibold text-destructive">{failed}</p></div>
      </div>
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur divide-y divide-border">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No notifications sent yet.</p>
        ) : rows.map((r) => (
          <div key={r.id} className="p-4 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={r.status === "delivered" ? "secondary" : "destructive"}>{r.status}</Badge>
              <Badge variant="outline">{r.kind}</Badge>
              <span className="font-medium">{r.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
                {r.http_status ? ` · HTTP ${r.http_status}` : ""}
                {r.duration_ms != null ? ` · ${r.duration_ms} ms` : ""}
              </span>
            </div>
            {r.error && <p className="text-xs text-destructive break-all font-mono">{r.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
