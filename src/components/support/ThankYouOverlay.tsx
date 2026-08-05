interface Props {
  visible: boolean;
  badgeEarned?: string;
}

export default function ThankYouOverlay({ visible, badgeEarned }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md animate-fade-in">
      <div className="bg-card/90 backdrop-blur-2xl border border-border/30 rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4 animate-scale-in">
        {/* Animated success checkmark */}
        <div className="mx-auto mb-5 h-16 w-16">
          <svg viewBox="0 0 52 52" className="h-16 w-16">
            <circle
              cx="26"
              cy="26"
              r="24"
              fill="none"
              strokeWidth="2.5"
              className="stroke-primary"
              style={{
                strokeDasharray: 151,
                strokeDashoffset: 151,
                animation: "check-circle 0.6s ease-out forwards",
              }}
            />
            <path
              d="M14 27l8 8 16-16"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-primary"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 48,
                animation: "check-mark 0.35s 0.5s ease-out forwards",
              }}
            />
          </svg>
          <style>{`
            @keyframes check-circle { to { stroke-dashoffset: 0; } }
            @keyframes check-mark { to { stroke-dashoffset: 0; } }
          `}</style>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Thank you</h2>
        <p className="text-sm text-muted-foreground">
          Your support keeps Terra Explorer growing.
        </p>
        {badgeEarned && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mt-4 animate-fade-in">
            <span className="text-lg">{badgeEarned}</span>
            <span className="text-xs font-semibold text-foreground">Badge earned</span>
          </div>
        )}
      </div>
    </div>
  );
}
