interface Badge {
  emoji: string;
  label: string;
  minAmount: number;
  color: string;
}

const BADGES: Badge[] = [
  { emoji: "🥉", label: "Bronze", minAmount: 10, color: "from-[hsl(30,60%,50%)] to-[hsl(25,50%,40%)]" },
  { emoji: "🥈", label: "Silver", minAmount: 50, color: "from-[hsl(210,10%,70%)] to-[hsl(210,10%,55%)]" },
  { emoji: "🥇", label: "Gold", minAmount: 100, color: "from-[hsl(45,90%,55%)] to-[hsl(35,80%,45%)]" },
  { emoji: "👑", label: "Top Supporter", minAmount: 500, color: "from-[hsl(260,80%,60%)] to-[hsl(280,70%,50%)]" },
];

interface Props {
  currentAmount: number;
}

export default function BadgesSection({ currentAmount }: Props) {
  const getCurrentBadgeIndex = () => {
    let idx = -1;
    BADGES.forEach((b, i) => {
      if (currentAmount >= b.minAmount) idx = i;
    });
    return idx;
  };

  const activeBadge = getCurrentBadgeIndex();

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Supporter Badges
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((badge, i) => {
          const isActive = i <= activeBadge;
          const isCurrent = i === activeBadge;
          return (
            <div
              key={badge.label}
              className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? "bg-card/60 border-primary/30 shadow-md"
                  : "bg-card/20 border-border/10 opacity-50"
              } ${isCurrent ? "scale-[1.05] ring-2 ring-primary/40" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-xl mb-1.5 shadow-sm ${
                isActive ? "" : "grayscale"
              }`}>
                {badge.emoji}
              </div>
              <span className="text-[10px] font-semibold text-foreground">{badge.label}</span>
              <span className="text-[9px] text-muted-foreground">₹{badge.minAmount}+</span>
              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-primary-foreground">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
