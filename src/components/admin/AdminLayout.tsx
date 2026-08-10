import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, IndianRupee, Package, FileText,
  MessageSquare, Shield, Bell, Settings, Code2, Menu, X, ArrowLeft, Globe2,
  Gamepad2, Mountain, MapPin, Heart, ScrollText, Bug, Images, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardSection from "./sections/DashboardSection";
import UsersSection from "./sections/UsersSection";
import PlayersSection from "./sections/PlayersSection";
import AnalyticsSection from "./sections/AnalyticsSection";
import DonationsSection from "./sections/DonationsSection";
import SupportersSection from "./sections/SupportersSection";
import ModsSection from "./sections/ModsSection";
import TerrainSection from "./sections/TerrainSection";
import LandmarkSection from "./sections/LandmarkSection";
import ContentSection from "./sections/ContentSection";
import FeedbackSection from "./sections/FeedbackSection";
import BugReportsSection from "./sections/BugReportsSection";
import SecuritySection from "./sections/SecuritySection";
import ActivityLogsSection from "./sections/ActivityLogsSection";
import NotificationsSection from "./sections/NotificationsSection";
import MediaSection from "./sections/MediaSection";
import SystemHealthSection from "./sections/SystemHealthSection";
import SettingsSection from "./sections/SettingsSection";
import DeveloperSection from "./sections/DeveloperSection";
import { APP_VERSION } from "@/lib/admin/admin-data";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: DashboardSection },
  { key: "users", label: "Users", icon: Users, Component: UsersSection },
  { key: "players", label: "Player Management", icon: Gamepad2, Component: PlayersSection },
  { key: "terrain", label: "Terrain", icon: Mountain, Component: TerrainSection },
  { key: "landmarks", label: "Landmarks", icon: MapPin, Component: LandmarkSection },
  { key: "mods", label: "Mods", icon: Package, Component: ModsSection },
  { key: "donations", label: "Donations", icon: IndianRupee, Component: DonationsSection },
  { key: "supporters", label: "Supporters", icon: Heart, Component: SupportersSection },
  { key: "analytics", label: "Analytics", icon: BarChart3, Component: AnalyticsSection },
  { key: "content", label: "Content", icon: FileText, Component: ContentSection },
  { key: "media", label: "Media Library", icon: Images, Component: MediaSection },
  { key: "logs", label: "Activity Logs", icon: ScrollText, Component: ActivityLogsSection },
  { key: "security", label: "Security", icon: Shield, Component: SecuritySection },
  { key: "bugs", label: "Bug Reports", icon: Bug, Component: BugReportsSection },
  { key: "feedback", label: "Feedback", icon: MessageSquare, Component: FeedbackSection },
  { key: "notifications", label: "Notifications", icon: Bell, Component: NotificationsSection },
  { key: "health", label: "System Health", icon: Activity, Component: SystemHealthSection },
  { key: "settings", label: "Settings", icon: Settings, Component: SettingsSection },
  { key: "developer", label: "Developer", icon: Code2, Component: DeveloperSection },
] as const;


export default function AdminLayout() {
  const [active, setActive] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const Current = NAV.find((n) => n.key === active)?.Component ?? DashboardSection;

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <button
          key={n.key}
          onClick={() => {
            setActive(n.key);
            setMobileOpen(false);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
            active === n.key
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <n.icon className="h-4 w-4 shrink-0" />
          {n.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh aurora-bg text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 glass-nav px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl premium-gradient flex items-center justify-center">
            <Globe2 className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold">Admin</span>
        </div>
        <button onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle admin menu" className="p-2 rounded-lg hover:bg-foreground/10">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden glass-card mx-4 mt-3 rounded-2xl p-3"
          >
            {navList}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 h-dvh sticky top-0 p-4 gap-4 border-r border-foreground/10">
          <Link to="/" className="flex items-center gap-2 px-2 py-1">
            <div className="w-9 h-9 rounded-xl premium-gradient flex items-center justify-center">
              <Globe2 className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold leading-tight">Terra Admin</p>
              <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
            </div>
          </Link>
          <div className="flex-1 overflow-y-auto">{navList}</div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to app
          </Link>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Current />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
