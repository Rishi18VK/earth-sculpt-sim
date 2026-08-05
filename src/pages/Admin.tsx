import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import AdminLayout from "@/components/admin/AdminLayout";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || authLoading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (!isAdmin) navigate("/", { replace: true });
  }, [loading, authLoading, user, isAdmin, navigate]);

  if (loading || authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-dvh aurora-bg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <AdminLayout />;
}
