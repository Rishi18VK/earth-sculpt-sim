import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, BarChart3, Heart, Package, Settings,
  LogOut, Trophy, Clock, Mountain, Map, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Stats {
  distance_explored: number;
  terrains_generated: number;
  time_spent_seconds: number;
  collectibles_found: number;
}

interface Donation {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

function getBadge(totalDonated: number) {
  if (totalDonated >= 100) return { label: "Top Supporter", emoji: "👑", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  if (totalDonated >= 50) return { label: "Gold Supporter", emoji: "🥇", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
  if (totalDonated >= 25) return { label: "Silver Supporter", emoji: "🥈", color: "bg-slate-400/20 text-slate-300 border-slate-400/30" };
  if (totalDonated >= 10) return { label: "Bronze Supporter", emoji: "🥉", color: "bg-orange-600/20 text-orange-300 border-orange-600/30" };
  return null;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ display_name: null, avatar_url: null, bio: null });
  const [stats, setStats] = useState<Stats>({ distance_explored: 0, terrains_generated: 0, time_spent_seconds: 0, collectibles_found: 0 });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch profile
    (supabase.from("profiles" as any).select("*").eq("id", user.id).single() as any).then(({ data }: any) => {
      if (data) {
        setProfile({ display_name: data.display_name, avatar_url: data.avatar_url, bio: data.bio });
        setEditName(data.display_name || "");
        setEditBio(data.bio || "");
      }
    });
    // Fetch stats
    (supabase.from("user_stats" as any).select("*").eq("id", user.id).single() as any).then(({ data }: any) => {
      if (data) setStats(data as Stats);
    });
    // Fetch donations
    (supabase.from("donations" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any).then(({ data }: any) => {
      if (data) setDonations(data as Donation[]);
    });
  }, [user]);

  if (!user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const badge = getBadge(totalDonated);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await (supabase.from("profiles" as any).update({
      display_name: editName,
      bio: editBio,
      updated_at: new Date().toISOString(),
    } as any).eq("id", user.id) as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile(p => ({ ...p, display_name: editName, bio: editBio }));
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Profile header */}
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-6 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-3">
            {(profile.display_name || user.email || "?")[0].toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.display_name || "Explorer"}</h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {badge && (
            <Badge className={`mt-2 ${badge.color} border text-xs`}>
              {badge.emoji} {badge.label}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full bg-card/50 backdrop-blur-md border border-border/30 mb-4">
            <TabsTrigger value="profile" className="flex-1 text-xs gap-1"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 text-xs gap-1"><BarChart3 className="h-3.5 w-3.5" /> Stats</TabsTrigger>
            <TabsTrigger value="donations" className="flex-1 text-xs gap-1"><Heart className="h-3.5 w-3.5" /> Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-background/50 border-border/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
                <Input value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell us about yourself..." className="bg-background/50 border-border/40" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Map className="h-5 w-5 text-primary" />, label: "Distance Explored", value: `${stats.distance_explored.toFixed(1)} km` },
                { icon: <Mountain className="h-5 w-5 text-primary" />, label: "Terrains Generated", value: stats.terrains_generated.toString() },
                { icon: <Clock className="h-5 w-5 text-primary" />, label: "Time Spent", value: formatTime(stats.time_spent_seconds) },
                { icon: <Sparkles className="h-5 w-5 text-primary" />, label: "Collectibles Found", value: stats.collectibles_found.toString() },
              ].map((s, i) => (
                <div key={i} className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-4 text-center">
                  <div className="flex justify-center mb-2">{s.icon}</div>
                  <div className="text-lg font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="donations">
            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-5">
              {badge && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{badge.emoji} {badge.label}</div>
                    <div className="text-[10px] text-muted-foreground">Total donated: ${totalDonated.toFixed(2)}</div>
                  </div>
                </div>
              )}
              {donations.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No donations yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/support")}>
                    Support the Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {donations.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/20">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">💖</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">${Number(d.amount).toFixed(2)}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()} • {d.payment_method}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
