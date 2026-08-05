import { useState } from "react";
import { LogIn, ShieldAlert, ShieldCheck, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, DataTable, Pill, StatCard, fmtDateTime } from "../AdminUI";
import { mockSecurity, type SecurityEvent } from "@/lib/admin/mock-data";

const meta = {
  login: { tone: "success", label: "Login", icon: LogIn },
  failed_login: { tone: "danger", label: "Failed login", icon: ShieldAlert },
  admin_action: { tone: "info", label: "Admin action", icon: ShieldCheck },
  session: { tone: "warning", label: "Session", icon: MonitorSmartphone },
} as const;

export default function SecuritySection() {
  const [filter, setFilter] = useState<"all" | SecurityEvent["kind"]>("all");
  const events = mockSecurity.filter((e) => filter === "all" || e.kind === filter);

  return (
    <AdminSection
      title="Security"
      description="Login history, admin actions and audit logs."
      actions={
        <Button variant="secondary" className="rounded-xl" onClick={() => toast.success("All other sessions revoked")}>
          Revoke all sessions
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Logins (24h)" value={mockSecurity.filter((e) => e.kind === "login").length} icon={LogIn} index={0} />
        <StatCard label="Failed Logins" value={mockSecurity.filter((e) => e.kind === "failed_login").length} icon={ShieldAlert} index={1} />
        <StatCard label="Admin Actions" value={mockSecurity.filter((e) => e.kind === "admin_action").length} icon={ShieldCheck} index={2} />
        <StatCard label="Active Sessions" value={341} icon={MonitorSmartphone} index={3} />
      </div>

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
        {events.map((e) => (
          <tr key={e.id} className="hover:bg-foreground/5 transition-colors">
            <td className="px-4 py-3"><Pill tone={meta[e.kind].tone}>{meta[e.kind].label}</Pill></td>
            <td className="px-4 py-3 font-medium">{e.actor}</td>
            <td className="px-4 py-3 text-muted-foreground">{e.detail}</td>
            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.ip}</td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(e.at)}</td>
          </tr>
        ))}
      </DataTable>
    </AdminSection>
  );
}
