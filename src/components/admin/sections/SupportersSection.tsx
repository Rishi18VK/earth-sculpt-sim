import { useMemo } from "react";
import { Heart, Crown, Sparkles } from "lucide-react";
import { AdminSection, StatCard, Panel, StateBlock, inr, fmtDate } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listDonations } from "@/lib/admin/admin-data";

const tierOf = (total: number) =>
  total >= 5000 ? { label: "Legend", tone: "text-amber-300" } : total >= 1000 ? { label: "Champion", tone: "text-primary" } : { label: "Supporter", tone: "text-emerald-300" };

export default function SupportersSection() {
  const { data, loading, error } = useAsyncData(listDonations);

  const supporters = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; last: string; message: string | null }>();
    (data ?? []).forEach((d) => {
      const cur = map.get(d.supporter);
      if (cur) {
        cur.total += d.amount;
        cur.count += 1;
        if (d.createdAt > cur.last) cur.last = d.createdAt;
        cur.message = cur.message ?? d.message;
      } else {
        map.set(d.supporter, { name: d.supporter, total: d.amount, count: 1, last: d.createdAt, message: d.message });
      }
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [data]);

  const total = supporters.reduce((s, x) => s + x.total, 0);

  return (
    <AdminSection title="Supporters" description="People funding Terra Explorer.">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Supporters" value={supporters.length} icon={Heart} index={0} />
        <StatCard label="Lifetime Value" value={inr(total)} icon={Crown} index={1} />
        <StatCard label="Repeat Supporters" value={supporters.filter((s) => s.count > 1).length} icon={Sparkles} index={2} />
      </div>

      <StateBlock loading={loading} error={error} empty={!supporters.length} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {supporters.map((s) => {
          const tier = tierOf(s.total);
          return (
            <Panel key={s.name} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center text-white font-semibold shrink-0">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className={`text-xs font-medium ${tier.tone}`}>{tier.label}</p>
                </div>
                <span className="font-display font-bold tabular-nums">{inr(s.total)}</span>
              </div>
              {s.message && <p className="text-sm text-muted-foreground italic">“{s.message}”</p>}
              <p className="text-xs text-muted-foreground">
                {s.count} contribution{s.count > 1 ? "s" : ""} · last {fmtDate(s.last)}
              </p>
            </Panel>
          );
        })}
      </div>
    </AdminSection>
  );
}
