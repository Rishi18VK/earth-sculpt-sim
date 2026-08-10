import { useMemo, useState } from "react";
import { Search, Gamepad2, Trophy, Footprints, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AdminSection, DataTable, StatCard, Pill, StateRow } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listPlayers, grantXp } from "@/lib/admin/admin-data";

export default function PlayersSection() {
  const { data, loading, error, refetch } = useAsyncData(listPlayers);
  const [query, setQuery] = useState("");
  const players = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? players.filter((p) => p.displayName.toLowerCase().includes(q)) : players;
  }, [players, query]);

  const adjust = async (id: string, amount: number) => {
    try {
      await grantXp(id, amount);
      toast.success(`${amount > 0 ? "+" : ""}${amount} XP applied`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const totalXp = players.reduce((s, p) => s + p.xp, 0);

  return (
    <AdminSection
      title="Player Management"
      description={loading ? "Loading players…" : `${players.length} explorer profiles.`}
      actions={
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players…"
            className="pl-9 rounded-xl"
            aria-label="Search players"
          />
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Players" value={players.length} icon={Gamepad2} index={0} />
        <StatCard label="Total XP" value={totalXp.toLocaleString()} icon={Trophy} index={1} />
        <StatCard
          label="Distance Explored"
          value={`${Math.round(players.reduce((s, p) => s + p.distance, 0)).toLocaleString()} m`}
          icon={Footprints}
          index={2}
        />
        <StatCard label="Collectibles" value={players.reduce((s, p) => s + p.collectibles, 0).toLocaleString()} index={3} />
      </div>

      <DataTable head={["Player", "Level", "XP", "Distance", "Collectibles", "Playtime", "XP grant"]}>
        <StateRow loading={loading} error={error} empty={!filtered.length} cols={7} />
        {filtered.map((p) => (
          <tr key={p.id} className="hover:bg-foreground/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full premium-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {p.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.displayName}</p>
                  <Pill tone={p.status === "active" ? "success" : "danger"}>{p.status}</Pill>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 tabular-nums">{p.level}</td>
            <td className="px-4 py-3 tabular-nums">{p.xp.toLocaleString()}</td>
            <td className="px-4 py-3 tabular-nums text-muted-foreground">{Math.round(p.distance).toLocaleString()} m</td>
            <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.collectibles}</td>
            <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.minutes} min</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="rounded-lg gap-1" onClick={() => adjust(p.id, 100)}>
                  <Plus className="h-3.5 w-3.5" /> 100
                </Button>
                <Button size="sm" variant="ghost" className="rounded-lg gap-1" onClick={() => adjust(p.id, -100)}>
                  <Minus className="h-3.5 w-3.5" /> 100
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </AdminSection>
  );
}
