import { useMemo, useState } from "react";
import { Search, Ban, PauseCircle, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSection, DataTable, Pill, fmtDate, fmtDateTime } from "../AdminUI";
import { mockUsers, type AdminUser } from "@/lib/admin/mock-data";

const statusTone = { active: "success", suspended: "warning", banned: "danger" } as const;
const roleTone = { admin: "info", moderator: "info", user: "neutral" } as const;

export default function UsersSection() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);

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

  const setStatus = (id: string, status: AdminUser["status"]) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    toast.success(`User ${status === "active" ? "reinstated" : status}`);
  };

  return (
    <AdminSection
      title="Users"
      description={`${users.length} registered accounts.`}
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
        {filtered.map((u) => (
          <tr key={u.id} className="hover:bg-foreground/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full premium-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {u.displayName.split(" ").map((n) => n[0]).join("")}
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
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(u.lastLoginAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                {u.status === "active" ? (
                  <>
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => setStatus(u.id, "suspended")}>
                      <PauseCircle className="h-3.5 w-3.5" /> Suspend
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-destructive hover:text-destructive" onClick={() => setStatus(u.id, "banned")}>
                      <Ban className="h-3.5 w-3.5" /> Ban
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={() => setStatus(u.id, "active")}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reinstate
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
        {!filtered.length && (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No users match “{query}”.</td>
          </tr>
        )}
      </DataTable>
    </AdminSection>
  );
}
