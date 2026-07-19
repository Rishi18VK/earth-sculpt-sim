import { NavLink, useNavigate } from "react-router-dom";
import { Globe2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/discover", label: "Landmarks" },
  { to: "/mods", label: "Mods" },
  { to: "/map", label: "Community" },
  { to: "/support", label: "Pricing" },
  { to: "/support", label: "Support" },
];

export default function TopNav() {
  const nav = useNavigate();
  const { user } = useAuth();

  return (
    <header className="hidden md:block fixed top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <div className="glass-nav rounded-2xl px-4 py-2.5 flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl premium-gradient flex items-center justify-center">
              <Globe2 className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold tracking-tight">Terra Explorer</span>
          </NavLink>

          <nav className="flex-1 flex items-center gap-1">
            {LINKS.map((l, i) => (
              <NavLink
                key={`${l.to}-${i}`}
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "text-foreground bg-foreground/5" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-foreground/5"
            >
              Profile
            </NavLink>
            {!user ? (
              <Button size="sm" onClick={() => nav("/auth")} className="rounded-xl premium-gradient border-0 text-white gap-1.5 h-9 px-4">
                Sign in <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => nav("/explore")} className="rounded-xl premium-gradient border-0 text-white gap-1.5 h-9 px-4">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
