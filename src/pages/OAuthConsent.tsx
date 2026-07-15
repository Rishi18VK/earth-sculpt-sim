import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Minimal typed shim for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { redirect_url?: string; redirect_to?: string };
const authOAuth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  };
}).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorizationId)
      : await authOAuth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/30 mb-3">
            <Mountain className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">TerraCraft 3D</h1>
        </div>

        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-6">
          {error ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Authorization error</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !details ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading authorization…</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold">
                    Connect {details.client?.name ?? "an app"} to TerraCraft
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    This lets {details.client?.name ?? "the client"} use TerraCraft as you.
                  </p>
                </div>
              </div>

              {userEmail && (
                <div className="text-xs text-muted-foreground">
                  Signed in as <span className="text-foreground font-medium">{userEmail}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t border-border/40 pt-3">
                This does not bypass TerraCraft's permissions or backend policies.
              </div>

              <div className="flex gap-2">
                <Button variant="outline" disabled={busy} onClick={() => decide(false)} className="flex-1">
                  Cancel
                </Button>
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                  {busy ? "Please wait…" : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
