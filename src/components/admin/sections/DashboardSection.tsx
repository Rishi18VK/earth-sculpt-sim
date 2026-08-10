import { Users, Activity, UserPlus, IndianRupee, Mountain, Landmark, Download, ShieldCheck, Clock } from "lucide-react";
import { AdminSection, StatCard, Panel, Pill, Sparkline, StateBlock, inr } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAnalytics, APP_VERSION } from "@/lib/admin/admin-data";

export default function DashboardSection() {
  const { data, loading, error } = useAsyncData(getAnalytics);

  if (loading || error || !data) {
    return (
      <AdminSection title="Dashboard" description="Live platform overview.">
        <StateBlock loading={loading} error={error} empty={!data} />
      </AdminSection>
    );
  }

  const o = data.overview;
  const a = data.analytics;
  const stats = [
    { label: "Total Users", value: o.totalUsers.toLocaleString(), icon: Users },
    { label: "Active (7d)", value: o.activeWeek.toLocaleString(), icon: Activity },
    { label: "Signups Today", value: o.signupsToday, icon: UserPlus },
    { label: "Total Donations", value: inr(o.totalDonations), icon: IndianRupee },
    { label: "Terrains", value: o.totalTerrains, icon: Mountain },
    { label: "Landmarks", value: o.totalLandmarks, icon: Landmark },
    { label: "Mod Downloads", value: o.totalModDownloads.toLocaleString(), icon: Download },
    { label: "Avg. Session", value: `${o.avgSessionMinutes} min`, icon: Clock },
  ];

  return (
    <AdminSection
      title="Dashboard"
      description="Live platform overview."
      actions={
        <div className="flex items-center gap-2">
          <Pill tone={o.maintenanceMode ? "warning" : "success"}>
            {o.maintenanceMode ? "maintenance" : "operational"}
          </Pill>
          <Pill tone="info">v{APP_VERSION}</Pill>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} index={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display font-semibold mb-2">Signups · last 14 days</h2>
          <Sparkline points={a.signups.map((s) => s.value)} />
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Top biomes shared
          </h2>
          {a.topBiomes.length === 0 && <p className="text-sm text-muted-foreground">No community screenshots yet.</p>}
          {a.topBiomes.map((b) => (
            <div key={b.name} className="flex items-center justify-between text-sm">
              <span className="capitalize">{b.name}</span>
              <span className="text-muted-foreground tabular-nums">{b.visits}</span>
            </div>
          ))}
        </Panel>
      </div>
    </AdminSection>
  );
}
