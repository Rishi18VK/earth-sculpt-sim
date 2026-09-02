import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Trash2, Loader2, UserPlus, KeyRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection, DataTable, Pill, fmtDateTime } from "../AdminUI";
import PasswordChangeCard from "./PasswordChangeCard";

type AppRole = "super_admin" | "admin" | "moderator" | "user";
type RoleRow = { id: string; user_id: string; role: AppRole; created_at: string; email: string };

const tone = { super_admin: "danger", admin: "danger", moderator: "info", user: "neutral" } as const;

export default function RoleManager() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("moderator");
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const applyStoredPassword = async () => {
    setPwBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-password", { body: {} });
      if (error) {
        const message = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(typeof message === "string" ? message : "Request failed");
      }
      toast.success("Super admin password updated. Use it on your next sign-in.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set password");
    } finally {
      setPwBusy(false);
    }
  };


  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-roles", { body });
    if (error) {
      const message = (data as { error?: string } | null)?.error ?? error.message;
      throw new Error(typeof message === "string" ? message : "Request failed");
    }
    return data as any;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setRows(data.roles ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load roles");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    void load();
  }, [load]);

  const grant = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await call({ action: "grant", email: email.trim(), role });
      toast.success(`Granted ${role} to ${email.trim()}`);
      setEmail("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not grant role");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (row: RoleRow) => {
    setBusy(true);
    try {
      await call({ action: "revoke", user_id: row.user_id, role: row.role });
      toast.success(`Revoked ${row.role} from ${row.email}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke role");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection
      title="Role management"
      description="Assign or revoke privileges. Verified server-side — admin role required."
    >
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="rounded-xl"
          aria-label="Account email"
        />
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger className="rounded-xl sm:w-40" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">super_admin</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="moderator">moderator</SelectItem>
            <SelectItem value="user">user</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={grant} disabled={busy || !email.trim()} className="rounded-xl gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Grant
        </Button>
      </div>

      <div className="mb-6">
        <PasswordChangeCard />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 rounded-xl border border-border/40 bg-foreground/5 p-3">
        <p className="text-xs text-muted-foreground flex-1">
          Apply the stored super admin password to your own account. The value is kept in secure
          backend storage and never shown here.
        </p>
        <Button
          variant="outline"
          onClick={applyStoredPassword}
          disabled={pwBusy}
          className="rounded-xl gap-2 shrink-0"
        >
          {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Set super admin password
        </Button>
      </div>



      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable head={["Account", "Role", "Granted", "Actions"]}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-foreground/5 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{r.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Pill tone={tone[r.role]}>{r.role}</Pill>
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmtDateTime(r.created_at)}
              </td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  className="rounded-lg gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => revoke(r)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revoke
                </Button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                No roles assigned yet.
              </td>
            </tr>
          )}
        </DataTable>
      )}
    </AdminSection>
  );
}
