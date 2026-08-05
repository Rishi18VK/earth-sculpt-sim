import { Download, IndianRupee, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSection, StatCard, Panel, DataTable, Pill, fmtDateTime, inr } from "../AdminUI";
import { mockDonations, downloadCsv } from "@/lib/admin/mock-data";

export default function DonationsSection() {
  const total = mockDonations.reduce((s, d) => s + d.amount, 0);
  const top = [...mockDonations].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <AdminSection
      title="Donations"
      description="Revenue and supporter activity."
      actions={
        <Button
          className="rounded-xl premium-gradient border-0 text-white gap-2"
          onClick={() => downloadCsv("terra-donations.csv", mockDonations as unknown as Record<string, unknown>[])}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Revenue" value={inr(total)} icon={IndianRupee} index={0} />
        <StatCard label="Supporters" value={new Set(mockDonations.map((d) => d.supporter)).size} icon={Users} index={1} />
        <StatCard label="Avg. Donation" value={inr(Math.round(total / mockDonations.length))} icon={TrendingUp} index={2} />
        <StatCard label="This Month" value={inr(total)} icon={IndianRupee} index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1 space-y-3">
          <h2 className="font-display font-semibold">Top supporters</h2>
          {top.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3">
              <span className="w-6 text-center font-display font-bold text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.supporter}</p>
                <p className="text-xs text-muted-foreground">{d.method}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{inr(d.amount)}</span>
            </div>
          ))}
        </Panel>

        <div className="lg:col-span-2">
          <DataTable head={["Supporter", "Amount", "Method", "Message", "Date"]}>
            {mockDonations.map((d) => (
              <tr key={d.id} className="hover:bg-foreground/5 transition-colors">
                <td className="px-4 py-3 font-medium">{d.supporter}</td>
                <td className="px-4 py-3 tabular-nums">{inr(d.amount)}</td>
                <td className="px-4 py-3"><Pill tone="info">{d.method}</Pill></td>
                <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{d.message ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(d.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </AdminSection>
  );
}
