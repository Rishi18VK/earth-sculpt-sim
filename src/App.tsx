import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Support from "./pages/Support";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Discover from "./pages/Discover";
import MapPage from "./pages/Map";
import ModsPage from "./pages/Mods";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import Jarvis from "./pages/Jarvis";
import AppShell from "@/components/shell/AppShell";
import LoadingScreen from "@/components/shell/LoadingScreen";

const queryClient = new QueryClient();

function Shell() {
  const location = useLocation();
  // Full-immersive routes bypass the shell chrome entirely
  const immersive = ["/explore", "/auth", "/admin", "/.lovable/oauth/consent"].some(p =>
    location.pathname === p || location.pathname.startsWith(p + "/")
  );
  const content = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Index />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/mods" element={<ModsPage />} />
      <Route path="/community" element={<Community />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/support" element={<Support />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
  return immersive ? content : <AppShell>{content}</AppShell>;
}

const App = () => {
  const [ready, setReady] = useState(() => sessionStorage.getItem("terra-loaded") === "1");

  useEffect(() => {
    if (ready) sessionStorage.setItem("terra-loaded", "1");
  }, [ready]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!ready && <LoadingScreen onDone={() => setReady(true)} />}
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
