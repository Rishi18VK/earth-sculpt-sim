import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopNav from "./TopNav";

const NAV_HIDDEN = ["/explore", "/auth", "/.lovable/oauth/consent"];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const hideNav = NAV_HIDDEN.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));

  return (
    <div className="min-h-dvh aurora-bg text-foreground">
      {!hideNav && <TopNav />}
      <main className={hideNav ? "" : "md:pt-24 pb-0 with-bottom-nav md:!pb-0"}>{children}</main>
      {!hideNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
