import { useCallback, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, DataTable, Pill, StateRow, fmtDateTime } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { listAuditLogs } from "@/lib/admin/discord-data";

const PAGE_SIZE = 25;
const SOURCES = ["all", "web", "discord"] as const;

export default function AuditLogSection() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [page, setPage] = useState(0);

  const fetcher = useCallback(
    () => listAuditLogs({ search: query || undefined, source, page, pageSize: PAGE_SIZE }),
    [query, source, page],
  );
  const { data, loading, error, refetch } = useAsyncData(fetcher, [query, source, page]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <AdminSection
      title="Audit Log"
      description="Every privileged action taken from the dashboard or from Discord, with actor, target and result."
      actions={
        <Button variant="secondary" className="rounded-xl gap-2" onClick={refetch}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="relative flex-1 min-w-[220px]"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setQuery(search.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or actor…"
            className="pl-9 rounded-xl"
            maxLength={80}
          />
        </form>
        <div className="flex gap-1 glass-card rounded-xl p-1 w-fit">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSource(s);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                source === s ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <DataTable head={["Action", "Actor", "Source", "Target", "Status", "When"]}>
        <StateRow loading={loading} error={error} empty={!rows.length} cols={6} />
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-foreground/5 transition-colors">
            <td className="px-4 py-3 font-medium">{r.action.replace(/_/g, " ")}</td>
            <td className="px-4 py-3 text-muted-foreground">{r.actor}</td>
            <td className="px-4 py-3"><Pill tone={r.source === "discord" ? "info" : "neutral"}>{r.source}</Pill></td>
            <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
              {r.targetType ? `${r.targetType}:${r.targetId ?? "—"}` : "—"}
            </td>
            <td className="px-4 py-3">
              <Pill tone={r.status === "success" ? "success" : "danger"}>{r.status}</Pill>
            </td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
          </tr>
        ))}
      </DataTable>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total ? `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}` : "No entries"}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="rounded-xl" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl" disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AdminSection>
  );
}
