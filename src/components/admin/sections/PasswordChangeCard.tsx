import { useState } from "react";
import { KeyRound, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Self-service password change for admin / super_admin accounts.
 * The current password is re-verified server-side before any change is applied.
 */
export default function PasswordChangeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const tooShort = next.length > 0 && next.length < 10;
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = current.length > 0 && next.length >= 10 && confirm === next && current !== next;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        body: { current_password: current, new_password: next },
      });
      if (error) {
        const message = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(typeof message === "string" ? message : "Request failed");
      }
      toast.success("Password updated. Use it the next time you sign in.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-foreground/5 p-4 space-y-4 mb-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Change your password</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Confirm your current password to set a new one. Every change is recorded in the audit log
        with your account, IP and timestamp.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pw-current" className="text-xs">Current password</Label>
          <Input
            id="pw-current"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-new" className="text-xs">New password</Label>
          <Input
            id="pw-new"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="rounded-xl"
            aria-invalid={tooShort}
          />
          {tooShort && <p className="text-xs text-destructive">At least 10 characters.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm" className="text-xs">Confirm new password</Label>
          <Input
            id="pw-confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-xl"
            aria-invalid={mismatch}
          />
          {mismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={submit} disabled={!valid || busy} className="rounded-xl gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Update password
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl gap-2"
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {show ? "Hide" : "Show"}
        </Button>
      </div>
    </div>
  );
}
