import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const checking = loading || authLoading;

  useEffect(() => {
    if (checking) return;
    // Not signed in → send to auth, remembering where they wanted to go.
    if (!user) navigate("/auth", { replace: true, state: { from: location.pathname } });
  }, [checking, user, navigate, location.pathname]);

  if (checking || !user) {
    return (
      <div className="min-h-dvh aurora-bg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Signed in but not authorized: explicit denial instead of a silent redirect.
  if (!isAdmin) {
    return (
      <div className="min-h-dvh aurora-bg flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center space-y-3">
          <ShieldAlert className="h-8 w-8 mx-auto text-destructive" />
          <h1 className="font-display text-xl font-bold">Access restricted</h1>
          <p className="text-sm text-muted-foreground">
            The admin dashboard is limited to accounts with the admin or super admin role.
          </p>
          <Button className="rounded-xl" onClick={() => navigate("/", { replace: true })}>
            Back to app
          </Button>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}
