import { NavLink, useLocation } from "react-router-dom";
import { Compass, Map, Sparkles, Package, User } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/map", label: "Map", icon: Map },
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/mods", label: "Mods", icon: Package },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const haptics = useHaptics();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav safe-bottom pt-2 px-2">
      <ul className="flex items-center justify-around max-w-xl mx-auto">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to === "/explore" && location.pathname === "/explore");
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                onClick={() => haptics.tap()}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-colors min-h-11",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute -inset-2 rounded-2xl premium-gradient opacity-20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] font-semibold tracking-wide", active && "text-foreground")}>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
