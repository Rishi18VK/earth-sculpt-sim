import { useState } from "react";
import { RefreshCw, Plus, Trash2, Power, CheckCircle2, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSection, DataTable, Panel, Pill, StateRow, fmtDateTime } from "../AdminUI";
import { useAsyncData } from "@/hooks/use-async-data";
import { toast } from "@/hooks/use-toast";
import {
  getDiscordStatus,
  listDiscordLinks,
  addDiscordLink,
  setDiscordLinkActive,
  removeDiscordLink,
  registerDiscordCommands,
} from "@/lib/admin/discord-data";

function ConfigRow({ label, ok, valid }: { label: string; ok: boolean; valid?: boolean }) {
  const state = !ok ? "missing" : valid === false ? "invalid" : "ok";
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {state === "ok" ? (
        <span className="inline-flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Valid</span>
      ) : state === "invalid" ? (
        <span className="inline-flex items-center gap-1.5 text-amber-400"><AlertTriangle className="h-4 w-4" /> Invalid format</span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" /> Missing</span>
      )}
    </div>
  );
}


export default function DiscordSection() {
  const status = useAsyncData(getDiscordStatus);
  const links = useAsyncData(listDiscordLinks);
  const [discordUserId, setDiscordUserId] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: ok });
      links.refetch();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const s = status.data;

  return (
    <AdminSection
      title="Discord"
      description="Connect the Discord admin bot and control which Discord accounts may run admin commands."
      actions={
        <Button variant="secondary" className="rounded-xl gap-2" onClick={() => { status.refetch(); links.refetch(); }}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display font-bold mb-3">Configuration</h2>
          {status.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {status.error && <p className="text-sm text-destructive">{status.error}</p>}
          {s && (
            <>
              <ConfigRow label="Application ID" ok={s.configured.applicationId} valid={s.valid?.applicationId} />
              <ConfigRow label="Public key" ok={s.configured.publicKey} valid={s.valid?.publicKey} />
              <ConfigRow label="Bot token" ok={s.configured.botToken} valid={s.valid?.botToken} />
              <ConfigRow label="Server (guild) ID" ok={s.configured.guildId} valid={s.valid?.guildId} />
              <ConfigRow label="Admin role ID" ok={s.configured.adminRoleId} valid={s.valid?.adminRoleId} />
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Interactions endpoint URL</p>
                <div className="flex gap-2">
                  <Input readOnly value={s.interactionsUrl} className="rounded-xl font-mono text-xs" />
                  <Button
                    variant="secondary"
                    className="rounded-xl shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(s.interactionsUrl);
                      toast({ title: "Endpoint URL copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!!s.problems?.length && (
                <ul className="mt-4 space-y-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                  {s.problems.map((p) => (
                    <li key={p} className="flex gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
              )}

              <Button
                className="rounded-xl mt-4 w-full"
                disabled={busy || !s.canRegister}
                onClick={() => run(registerDiscordCommands, "Slash commands registered")}
              >
                Register slash commands
              </Button>
              {!s.canRegister && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Save all five settings correctly to enable registration.
                </p>
              )}

            </>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display font-bold mb-3">Bot status</h2>
          {s ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Bot</span><span>{s.bot?.username ?? "Not connected"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Server</span><span>{s.guild?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span>{s.guild?.memberCount ?? "—"}</span></div>
              {s.botError && <p className="text-destructive text-xs">{s.botError}</p>}
              <div className="pt-3 border-t border-foreground/10">
                <p className="text-xs text-muted-foreground mb-1">Last Discord activity</p>
                {s.lastActivity ? (
                  <p className="text-sm">
                    {s.lastActivity.action.replace(/_/g, " ")} — {s.lastActivity.actor_label}{" "}
                    <span className="text-muted-foreground">{fmtDateTime(s.lastActivity.created_at)}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{status.loading ? "Loading…" : "Unavailable."}</p>
          )}
        </Panel>
      </div>

      <Panel>
        <h2 className="font-display font-bold mb-3">Allowed Discord admins</h2>
        <form
          className="flex flex-wrap gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => addDiscordLink({ discordUserId: discordUserId.trim(), discordUsername: discordUsername.trim() }),
              "Discord admin linked",
            ).then(() => {
              setDiscordUserId("");
              setDiscordUsername("");
            });
          }}
        >
          <Input
            value={discordUserId}
            onChange={(e) => setDiscordUserId(e.target.value.replace(/\D/g, ""))}
            placeholder="Discord user ID (numeric)"
            className="rounded-xl flex-1 min-w-[200px]"
            maxLength={25}
            required
          />
          <Input
            value={discordUsername}
            onChange={(e) => setDiscordUsername(e.target.value)}
            placeholder="Username (optional)"
            className="rounded-xl flex-1 min-w-[160px]"
            maxLength={64}
          />
          <Button type="submit" className="rounded-xl gap-2" disabled={busy || !discordUserId}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>

        <DataTable head={["Discord ID", "Username", "Status", "Last used", "Added", ""]}>
          <StateRow loading={links.loading} error={links.error} empty={!(links.data ?? []).length} cols={6} />
          {(links.data ?? []).map((l) => (
            <tr key={l.id} className="hover:bg-foreground/5 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{l.discordUserId}</td>
              <td className="px-4 py-3">{l.discordUsername ?? "—"}</td>
              <td className="px-4 py-3"><Pill tone={l.active ? "success" : "neutral"}>{l.active ? "Active" : "Disabled"}</Pill></td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{l.lastUsedAt ? fmtDateTime(l.lastUsedAt) : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-lg"
                    disabled={busy}
                    onClick={() => run(() => setDiscordLinkActive(l.id, !l.active), l.active ? "Link disabled" : "Link enabled")}
                    aria-label={l.active ? "Disable link" : "Enable link"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-lg"
                    disabled={busy}
                    onClick={() => run(() => removeDiscordLink(l.id), "Link removed")}
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AdminSection>
  );
}
