import { Users, TrendingUp, Clock } from "lucide-react";
import { AdminSection, StatCard, Panel, Bar, Sparkline, StateBlock } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAnalytics } from "@/lib/admin/admin-data";

export default function AnalyticsSection() {
  const { data, loading, error } = useAsyncData(getAnalytics);

  if (loading || error || !data) {
    return (
      <AdminSection title="Analytics" description="Engagement and audience breakdown.">
        <StateBlock loading={loading} error={error} empty={!data} />
      </AdminSection>
    );
  }

  const a = data.analytics;
  const maxCum = Math.max(1, ...a.cumulative.map((m) => m.value));
  const maxLandmark = Math.max(1, ...a.popularLandmarks.map((t) => t.visits));

  return (
    <AdminSection title="Analytics" description="Engagement and audience breakdown.">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Total Users" value={data.overview.totalUsers.toLocaleString()} icon={Users} index={0} />
        <StatCard label="Active (7 days)" value={data.overview.activeWeek.toLocaleString()} icon={TrendingUp} index={1} />
        <StatCard label="Avg. Session" value={`${a.avgSessionMinutes} min`} icon={Clock} index={2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display font-semibold mb-2">Daily signups</h2>
          <Sparkline points={a.signups.map((d) => d.value)} />
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Cumulative users by month</h2>
          {a.cumulative.map((m) => (
            <Bar key={m.month} label={m.month} value={m.value} max={maxCum} />
          ))}
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Most shared biomes</h2>
          {a.topBiomes.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
          {a.topBiomes.map((t) => (
            <Bar key={t.name} label={t.name} value={t.visits} max={Math.max(1, ...a.topBiomes.map((x) => x.visits))} />
          ))}
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Popular landmarks</h2>
          {a.popularLandmarks.length === 0 && <p className="text-sm text-muted-foreground">No landmarks published yet.</p>}
          {a.popularLandmarks.map((t) => (
            <Bar key={t.name} label={t.name} value={t.visits} max={maxLandmark} />
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Graphics preset", rows: a.graphics },
          { title: "Theme", rows: a.themes },
          { title: "Countries", rows: a.countries },
        ].map((g) => (
          <Panel key={g.title} className="space-y-3">
            <h2 className="font-display font-semibold">{g.title}</h2>
            {g.rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {g.rows.map((r) => (
              <Bar key={r.name} label={r.name} value={r.pct} max={100} suffix="%" />
            ))}
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
