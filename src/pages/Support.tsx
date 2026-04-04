import { useState, useRef, useCallback } from "react";
import { Heart, Coffee, UtensilsCrossed, Pizza, ArrowLeft, Check, Sparkles, CreditCard, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface DonationOption {
  id: string;
  emoji: string;
  label: string;
  amount: number;
  icon: React.ReactNode;
}

const DONATION_OPTIONS: DonationOption[] = [
  { id: "coffee", emoji: "☕", label: "Buy me a Coffee", amount: 3, icon: <Coffee className="h-6 w-6" /> },
  { id: "burger", emoji: "🍔", label: "Buy me a Burger", amount: 7, icon: <UtensilsCrossed className="h-6 w-6" /> },
  { id: "meal", emoji: "🍕", label: "Buy me a Meal", amount: 15, icon: <Pizza className="h-6 w-6" /> },
];

const PAYMENT_METHODS = [
  { id: "paypal", label: "PayPal", icon: <CreditCard className="h-5 w-5" />, color: "from-blue-500 to-blue-600", placeholder: "https://paypal.me/yourname" },
  { id: "upi", label: "UPI", icon: <Smartphone className="h-5 w-5" />, color: "from-emerald-500 to-teal-600", placeholder: "yourname@upi" },
  { id: "card", label: "Card", icon: <CreditCard className="h-5 w-5" />, color: "from-violet-500 to-purple-600", placeholder: "Payment link" },
];

const RECENT_SUPPORTERS = [
  { name: "Explorer Fan", amount: 7, time: "2 hours ago" },
  { name: "Nature Lover", amount: 15, time: "5 hours ago" },
  { name: "Map Enthusiast", amount: 3, time: "1 day ago" },
];

export default function Support() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>("coffee");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<string>("paypal");
  const [showThankYou, setShowThankYou] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const totalSupport = 142; // placeholder counter

  const getAmount = useCallback(() => {
    if (customAmount && Number(customAmount) > 0) return Number(customAmount);
    return DONATION_OPTIONS.find(o => o.id === selectedOption)?.amount ?? 3;
  }, [customAmount, selectedOption]);

  const fireConfetti = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"] });
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 300);
  };

  const playThankYouSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/faaah.mp3");
      }
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(() => {});
    } catch { /* fallback silent */ }
  };

  const handleDonate = () => {
    // In real flow this would redirect to payment link
    // For now simulate success
    setShowThankYou(true);
    fireConfetti();
    playThankYouSound();
    setTimeout(() => setShowThankYou(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-y-auto">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 pb-16">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Explorer
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-primary/20 border border-border/30 mb-4">
            <Heart className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Support the Creator <span className="text-destructive">❤️</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            If you like this project, you can support me by buying me a coffee, meal, or burger.
          </p>
        </div>

        {/* Creator card */}
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            T
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Terra Explorer Dev</h3>
            <p className="text-xs text-muted-foreground">Building immersive 3D terrain experiences. Every contribution fuels the next feature!</p>
          </div>
        </div>

        {/* Support counter */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/20 p-3 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{totalSupport}</span>
            <span className="text-muted-foreground">supporters so far</span>
          </div>
        </div>

        {/* Donation options */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {DONATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setSelectedOption(opt.id); setCustomAmount(""); }}
              className={`relative p-4 rounded-2xl border transition-all duration-300 text-center group ${
                selectedOption === opt.id && !customAmount
                  ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]"
                  : "bg-card/50 backdrop-blur-md border-border/30 hover:border-primary/30 hover:bg-card/70"
              }`}
            >
              <div className="text-2xl mb-2">{opt.emoji}</div>
              <div className="text-xs font-medium text-foreground mb-1">{opt.label.replace("Buy me a ", "")}</div>
              <div className="text-lg font-bold text-primary">${opt.amount}</div>
              {selectedOption === opt.id && !customAmount && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/30 p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Or enter a custom amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
            <Input
              type="number"
              min="1"
              placeholder="5.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-7 bg-background/50 border-border/40 h-11 text-base"
            />
          </div>
        </div>

        {/* Payment methods */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Method</h3>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
                  selectedPayment === pm.id
                    ? "bg-primary/10 border-primary/50 shadow-md"
                    : "bg-card/50 backdrop-blur-md border-border/30 hover:border-primary/20"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pm.color} flex items-center justify-center text-white`}>
                  {pm.icon}
                </div>
                <span className="text-xs font-medium text-foreground">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Donate button */}
        <Button
          onClick={handleDonate}
          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 gap-2 transition-all duration-300 hover:scale-[1.01]"
        >
          <Heart className="h-5 w-5" />
          Donate ${getAmount().toFixed(2)}
          <ExternalLink className="h-4 w-4 opacity-60" />
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          You'll be redirected to the payment provider to complete your donation.
        </p>

        {/* Recent supporters */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Supporters</h3>
          <div className="space-y-2">
            {RECENT_SUPPORTERS.map((s, i) => (
              <div key={i} className="bg-card/40 backdrop-blur-md rounded-xl border border-border/20 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.time}</div>
                </div>
                <div className="text-sm font-semibold text-primary">${s.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thank you overlay */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4 animate-in zoom-in-95 duration-300">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-foreground mb-2">Thank you!</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for your support! <span className="text-destructive">❤️</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">Your generosity keeps this project alive.</p>
          </div>
        </div>
      )}
    </div>
  );
}
