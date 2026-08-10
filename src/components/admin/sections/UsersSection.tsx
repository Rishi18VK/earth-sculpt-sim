import { useMemo, useState } from "react";
import { Search, Ban, PauseCircle, RotateCcw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, DataTable, Pill, fmtDate, fmtDateTime } from "../AdminUI";
import RoleManager from "./RoleManager";
import { useAsyncData } from "@/hooks/use-async-data";
import { listUsers, setUserStatus, type AdminUser } from "@/lib/admin/admin-data";

const statusTone = { active: "success", suspended: "warning", banned: "danger" } as const;
const roleTone = { super_admin: "danger", admin: "info", moderator: "info", user: "neutral" } as const;

export default function UsersSection() {
  const [query, setQuery] = useState("");
  const { data, loading, error, refetch } = useAsyncData(listUsers);
  const users = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.role.includes(q)
    );
  }, [query, users]);

  const changeStatus = async (id: string, status: AdminUser["status"]) => {
    try {
      await setUserStatus(id, status);
      toast.success(`User ${status === "active" ? "reinstated" : status}`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="space-y-8">
      <RoleManager />
      <AdminSection
        title="Users"
        description={loading ? "Loading accounts…" : `${users.length} registered accounts.`}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, country…"
              className="pl-9 rounded-xl"
              aria-label="Search users"
            />
          </div>
        }
      >
        <DataTable head={["User", "Role", "Status", "Registered", "Last login", "Actions"]}>
          {loading && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>
          )}
          {error && !loading && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
          )}
          {!loading && !error && filtered.map((u) => (
            <tr key={u.id} className="hover:bg-foreground/5 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full premium-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {u.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email} · {u.country}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Pill tone={roleTone[u.role]}>{u.role}</Pill></td>
              <td className="px-4 py-3"><Pill tone={statusTone[u.status]}>{u.status}</Pill></td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(u.registeredAt)}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {u.status === "active" ? (
                    <>
                      <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => changeStatus(u.id, "suspended")}>
                        <PauseCircle className="h-3.5 w-3.5" /> Suspend
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-destructive hover:text-destructive" onClick={() => changeStatus(u.id, "banned")}>
                        <Ban className="h-3.5 w-3.5" /> Ban
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => changeStatus(u.id, "active")}>
                      <RotateCcw className="h-3.5 w-3.5" /> Reinstate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!loading && !error && !filtered.length && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                {query ? `No users match “${query}”.` : "No registered users yet."}
              </td>
            </tr>
          )}
        </DataTable>
      </AdminSection>
    </div>
  );
}
