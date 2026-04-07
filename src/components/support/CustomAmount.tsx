import { Input } from "@/components/ui/input";

const QUICK_AMOUNTS = [10, 50, 100, 200];

interface Props {
  customAmount: string;
  onChange: (val: string) => void;
}

export default function CustomAmount({ customAmount, onChange }: Props) {
  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/20 p-4 mb-6">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">
        Or enter custom amount
      </label>
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
        <Input
          type="number"
          min="1"
          placeholder="Enter amount"
          value={customAmount}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 bg-background/50 border-border/30 h-12 text-base rounded-xl focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onChange(String(amt))}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              customAmount === String(amt)
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card/60 text-muted-foreground border border-border/20 hover:border-primary/30 hover:text-foreground"
            }`}
          >
            ₹{amt}
          </button>
        ))}
      </div>
    </div>
  );
}
