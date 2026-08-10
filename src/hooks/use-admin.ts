import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "super_admin" | "moderator" | "user";

/**
 * Server-validated role check. Never trust localStorage for authorization.
 * Roles live in the `user_roles` table and are read through RLS.
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");

  return {
    loading: loading || authLoading,
    roles,
    isSuperAdmin,
    isAdmin,
    isModerator: isAdmin || roles.includes("moderator"),
  };
}
