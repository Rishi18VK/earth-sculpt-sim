import { GitBranch, Package, Rocket, Settings2 } from "lucide-react";
import { AdminSection, Panel, Pill, DataTable, fmtDateTime } from "../AdminUI";
import { mockDeveloper } from "@/lib/admin/mock-data";

const depTone = { success: "success", rolled_back: "warning", failed: "danger" } as const;

export default function DeveloperSection() {
  const d = mockDeveloper;
  return (
    <AdminSection title="Developer" description="Build, repository and deployment information.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Build information
          </h2>
          {[
            ["Version", `v${d.build.version}`],
            ["Commit", d.build.sha],
            ["Built at", fmtDateTime(d.build.builtAt)],
            ["Node", d.build.node],
            ["Bundle size", `${d.build.bundleKb} KB`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium font-mono">{v}</span>
            </div>
          ))}
        </Panel>

        <Panel className="space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" /> Repository
          </h2>
          {[
            ["Repository", d.repo.name],
            ["Branch", d.repo.branch],
            ["Open PRs", String(d.repo.openPRs)],
            ["Open issues", String(d.repo.openIssues)],
            ["Last commit", d.repo.lastCommit],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground shrink-0">{k}</span>
              <span className="font-medium truncate">{v}</span>
            </div>
          ))}
        </Panel>

        <Panel className="space-y-3 lg:col-span-2">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Environment configuration
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.env.map((e) => (
              <div key={e.key} className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2">
                <span className="font-mono text-xs truncate">{e.key}</span>
                <Pill tone="success">{e.value}</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" /> Deployment history
        </h2>
        <DataTable head={["Environment", "Version", "Status", "When"]}>
          {d.deployments.map((dep) => (
            <tr key={dep.id} className="hover:bg-foreground/5 transition-colors">
              <td className="px-4 py-3 font-medium capitalize">{dep.env}</td>
              <td className="px-4 py-3 font-mono text-xs">{dep.version}</td>
              <td className="px-4 py-3">
                <Pill tone={depTone[dep.status as keyof typeof depTone] ?? "neutral"}>{dep.status.replace("_", " ")}</Pill>
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(dep.at)}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </AdminSection>
  );
}
