interface Props {
  visible: boolean;
  badgeEarned?: string;
}

export default function ThankYouOverlay({ visible, badgeEarned }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card/90 backdrop-blur-2xl border border-border/30 rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4 animate-in zoom-in-95 duration-400">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thank you!</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Your support means the world <span className="text-destructive">❤️</span>
        </p>
        {badgeEarned && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(260,60%,55%)/0.15] to-[hsl(200,80%,50%)/0.15] border border-primary/20 mt-2">
            <span className="text-lg">{badgeEarned}</span>
            <span className="text-xs font-semibold text-foreground">Badge Earned!</span>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">Your generosity keeps this project alive.</p>
      </div>
    </div>
  );
}
