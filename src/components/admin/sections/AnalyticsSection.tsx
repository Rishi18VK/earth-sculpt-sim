import { AdminSection, Panel, Bar, Sparkline, StatCard } from "../AdminUI";
import { mockAnalytics } from "@/lib/admin/mock-data";
import { Clock, Users, TrendingUp } from "lucide-react";

export default function AnalyticsSection() {
  const a = mockAnalytics;
  const dauNow = a.dau[a.dau.length - 1].value;
  const mauNow = a.mau[a.mau.length - 1].value;
  const maxTerrain = Math.max(...a.topTerrains.map((t) => t.visits));
  const maxLandmark = Math.max(...a.popularLandmarks.map((t) => t.visits));

  return (
    <AdminSection title="Analytics" description="Engagement and audience breakdown.">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Daily Active Users" value={dauNow.toLocaleString()} icon={Users} index={0} />
        <StatCard label="Monthly Active Users" value={mauNow.toLocaleString()} icon={TrendingUp} index={1} />
        <StatCard label="Avg. Session Duration" value={`${a.avgSessionMinutes} min`} icon={Clock} index={2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display font-semibold mb-2">Daily active users</h2>
          <Sparkline points={a.dau.map((d) => d.value)} />
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Monthly active users</h2>
          {a.mau.map((m) => (
            <Bar key={m.month} label={m.month} value={m.value} max={Math.max(...a.mau.map((x) => x.value))} />
          ))}
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Most visited terrains</h2>
          {a.topTerrains.map((t) => (
            <Bar key={t.name} label={t.name} value={t.visits} max={maxTerrain} />
          ))}
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold">Popular landmarks</h2>
          {a.popularLandmarks.map((t) => (
            <Bar key={t.name} label={t.name} value={t.visits} max={maxLandmark} />
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Browsers", rows: a.browsers },
          { title: "Devices", rows: a.devices },
          { title: "Countries", rows: a.countries },
        ].map((g) => (
          <Panel key={g.title} className="space-y-3">
            <h2 className="font-display font-semibold">{g.title}</h2>
            {g.rows.map((r) => (
              <Bar key={r.name} label={r.name} value={r.pct} max={100} suffix="%" />
            ))}
          </Panel>
        ))}
      </div>
    </AdminSection>
  );
}
