import { Activity, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSection, Panel, StatCard, StateBlock, Pill } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { getSystemHealth, APP_VERSION } from "@/lib/admin/admin-data";

export default function SystemHealthSection() {
  const { data, loading, error, refetch } = useAsyncData(getSystemHealth);
  const checks = data ?? [];
  const healthy = checks.filter((c) => c.ok).length;
  const avg = checks.length ? Math.round(checks.reduce((s, c) => s + c.ms, 0) / checks.length) : 0;

  return (
    <AdminSection
      title="System Health"
      description="Live status of backend services powering Terra Explorer."
      actions={
        <Button variant="secondary" className="rounded-xl gap-2" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Re-run checks
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Services Healthy" value={`${healthy}/${checks.length}`} icon={Activity} index={0} />
        <StatCard label="Avg. Response" value={`${avg} ms`} index={1} />
        <StatCard label="Incidents" value={checks.length - healthy} index={2} />
        <StatCard label="App Version" value={`v${APP_VERSION}`} index={3} />
      </div>

      <StateBlock loading={loading} error={error} empty={!checks.length} />

      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((c) => (
          <Panel key={c.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {c.ok ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.detail}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <Pill tone={c.ok ? "success" : "danger"}>{c.ok ? "healthy" : "down"}</Pill>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">{c.ms} ms</p>
            </div>
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
