import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const NAV_HIDDEN = ["/explore", "/auth", "/.lovable/oauth/consent"];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const hideNav = NAV_HIDDEN.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));

  return (
    <div className="min-h-dvh aurora-bg text-foreground">
      <main className={hideNav ? "" : "with-bottom-nav"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
