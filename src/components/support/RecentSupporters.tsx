import { Sparkles } from "lucide-react";

const RECENT_SUPPORTERS = [
  { name: "Explorer Fan", amount: 50, time: "2 hours ago", badge: "🥈" },
  { name: "Nature Lover", amount: 100, time: "5 hours ago", badge: "🥇" },
  { name: "Map Enthusiast", amount: 20, time: "1 day ago", badge: "🥉" },
  { name: "Terrain Pro", amount: 200, time: "2 days ago", badge: "🥇" },
];

const TOTAL_RAISED = 2350;

export default function RecentSupporters() {
  return (
    <div className="mb-6">
      {/* Total counter */}
      <div className="bg-gradient-to-r from-[hsl(260,60%,55%)/0.1] to-[hsl(200,80%,50%)/0.1] backdrop-blur-xl rounded-2xl border border-border/20 p-4 mb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">₹{TOTAL_RAISED.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">raised from the community</p>
      </div>

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Recent Supporters
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
        {RECENT_SUPPORTERS.map((s, i) => (
          <div
            key={i}
            className="bg-card/40 backdrop-blur-xl rounded-xl border border-border/15 p-3 flex items-center gap-3 hover:bg-card/60 transition-colors duration-200"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm">
              {s.badge}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{s.name}</div>
              <div className="text-[10px] text-muted-foreground">{s.time}</div>
            </div>
            <div className="text-sm font-bold bg-gradient-to-r from-[hsl(260,80%,60%)] to-[hsl(200,90%,50%)] bg-clip-text text-transparent">
              ₹{s.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
