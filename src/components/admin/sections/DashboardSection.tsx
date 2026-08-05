import { Users, Wifi, Eye, UserPlus, Activity, IndianRupee, Mountain, Landmark, Download, ShieldCheck, Tag } from "lucide-react";
import { AdminSection, StatCard, Panel, Pill, Sparkline, inr } from "../AdminUI";
import { mockOverview, mockAnalytics } from "@/lib/admin/mock-data";

export default function DashboardSection() {
  const o = mockOverview;
  const stats = [
    { label: "Total Users", value: o.totalUsers.toLocaleString(), icon: Users, hint: "+312 this week" },
    { label: "Online Users", value: o.onlineUsers, icon: Wifi, hint: "live" },
    { label: "Visitors Today", value: o.visitorsToday.toLocaleString(), icon: Eye, hint: "+8.4% vs yesterday" },
    { label: "Registered Users", value: o.registeredUsers.toLocaleString(), icon: UserPlus },
    { label: "Active Sessions", value: o.activeSessions, icon: Activity },
    { label: "Total Donations", value: inr(o.totalDonations), icon: IndianRupee },
    { label: "Total Terrains", value: o.totalTerrains, icon: Mountain },
    { label: "Total Landmarks", value: o.totalLandmarks, icon: Landmark },
    { label: "Mod Downloads", value: o.totalModDownloads.toLocaleString(), icon: Download },
  ];

  return (
    <AdminSection title="Dashboard" description="Live overview of Terra Explorer.">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} index={i} {...s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Daily active users</h2>
            <Pill tone="info">last 14 days</Pill>
          </div>
          <Sparkline points={mockAnalytics.dau.map((d) => d.value)} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{mockAnalytics.dau[0].date}</span>
            <span>{mockAnalytics.dau[mockAnalytics.dau.length - 1].date}</span>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <h2 className="font-display font-semibold">System</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Website status
            </span>
            <Pill tone={o.websiteStatus === "operational" ? "success" : "warning"}>{o.websiteStatus}</Pill>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> Application version
            </span>
            <Pill>v{o.appVersion}</Pill>
          </div>
          <div className="pt-2 border-t border-foreground/10 space-y-2">
            <p className="text-eyebrow text-muted-foreground">Avg. session</p>
            <p className="font-display text-2xl font-bold">{mockAnalytics.avgSessionMinutes} min</p>
          </div>
        </Panel>
      </div>
    </AdminSection>
  );
}
