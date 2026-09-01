import { useMemo, useState } from "react";
import { LogIn, ShieldAlert, ShieldCheck, MonitorSmartphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSection, DataTable, Pill, StatCard, StateRow, fmtDateTime } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listSecurityEvents, type SecurityEvent } from "@/lib/admin/admin-data";

const meta = {
  login: { tone: "success", label: "Login", icon: LogIn },
  failed_login: { tone: "danger", label: "Failed login", icon: ShieldAlert },
  admin_action: { tone: "info", label: "Admin action", icon: ShieldCheck },
  session: { tone: "warning", label: "Session", icon: MonitorSmartphone },
} as const;

/** Shared audit log used by the Security and Activity Logs modules. */
export default function EventLog({
  title,
  description,
  showStats = true,
}: {
  title: string;
  description: string;
  showStats?: boolean;
}) {
  const { data, loading, error, refetch } = useAsyncData(listSecurityEvents);
  const [filter, setFilter] = useState<"all" | SecurityEvent["kind"]>("all");
  const all = useMemo(() => data ?? [], [data]);
  const events = all.filter((e) => filter === "all" || e.kind === filter);

  return (
    <AdminSection
      title={title}
      description={description}
      actions={
        <Button variant="secondary" className="rounded-xl gap-2" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      }
    >
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Logins" value={all.filter((e) => e.kind === "login").length} icon={LogIn} index={0} />
          <StatCard label="Failed Logins" value={all.filter((e) => e.kind === "failed_login").length} icon={ShieldAlert} index={1} />
          <StatCard label="Admin Actions" value={all.filter((e) => e.kind === "admin_action").length} icon={ShieldCheck} index={2} />
          <StatCard label="Session Events" value={all.filter((e) => e.kind === "session").length} icon={MonitorSmartphone} index={3} />
        </div>
      )}

      <div className="flex flex-wrap gap-1 glass-card rounded-xl p-1 w-fit">
        {(["all", "login", "failed_login", "admin_action", "session"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : meta[f].label}
          </button>
        ))}
      </div>

      <DataTable head={["Event", "Actor", "Detail", "IP", "When"]}>
        <StateRow loading={loading} error={error} empty={!events.length} cols={5} />
        {events.map((e) => {
          const m = meta[e.kind] ?? meta.admin_action;
          return (
            <tr key={e.id} className="hover:bg-foreground/5 transition-colors">
              <td className="px-4 py-3"><Pill tone={m.tone}>{m.label}</Pill></td>
              <td className="px-4 py-3 font-medium">{e.actor}</td>
              <td className="px-4 py-3 text-muted-foreground">{e.detail}</td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.ip ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(e.at)}</td>
            </tr>
          );
        })}

      </DataTable>
    </AdminSection>
  );
}
