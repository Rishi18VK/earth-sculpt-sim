import { Check } from "lucide-react";

interface DonationOption {
  id: string;
  emoji: string;
  label: string;
  amounts: number[];
}

const DONATION_OPTIONS: DonationOption[] = [
  { id: "coffee", emoji: "☕", label: "Coffee", amounts: [10, 20] },
  { id: "burger", emoji: "🍔", label: "Burger", amounts: [50] },
  { id: "meal", emoji: "🍕", label: "Meal", amounts: [100] },
];

interface Props {
  selectedOption: string;
  selectedSubAmount: number;
  onSelect: (id: string, amount: number) => void;
}

export default function DonationCards({ selectedOption, selectedSubAmount, onSelect }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Choose your support
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {DONATION_OPTIONS.map((opt) => {
          const isSelected = selectedOption === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id, opt.amounts[0])}
              className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                isSelected
                  ? "border-transparent bg-gradient-to-br from-[hsl(260,60%,55%)/0.15] to-[hsl(200,80%,50%)/0.15] shadow-lg shadow-[hsl(260,60%,50%)/0.15] scale-[1.03]"
                  : "border-border/30 bg-card/40 backdrop-blur-xl hover:border-primary/30 hover:scale-[1.02] hover:shadow-md"
              }`}
              style={isSelected ? {
                backgroundImage: "linear-gradient(hsl(var(--card) / 0.8), hsl(var(--card) / 0.8)), linear-gradient(135deg, hsl(260,80%,60%), hsl(200,90%,50%))",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                border: "2px solid transparent",
              } : undefined}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {opt.emoji}
              </div>
              <div className="text-xs font-semibold text-foreground mb-2">{opt.label}</div>
              <div className="flex flex-wrap justify-center gap-1">
                {opt.amounts.map((amt) => (
                  <span
                    key={amt}
                    onClick={(e) => { e.stopPropagation(); onSelect(opt.id, amt); }}
                    className={`text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-all duration-200 ${
                      isSelected && selectedSubAmount === amt
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-muted/20 text-muted-foreground hover:bg-primary/20"
                    }`}
                  >
                    ₹{amt}
                  </span>
                ))}
              </div>
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-[hsl(260,80%,60%)] to-[hsl(200,90%,50%)] rounded-full flex items-center justify-center shadow-md animate-scale-in">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
