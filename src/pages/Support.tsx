import { useState, useCallback } from "react";
import { Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import SupportHeader from "@/components/support/SupportHeader";
import DonationCards from "@/components/support/DonationCards";
import CustomAmount from "@/components/support/CustomAmount";
import PaymentSection from "@/components/support/PaymentSection";
import BadgesSection from "@/components/support/BadgesSection";
import RecentSupporters from "@/components/support/RecentSupporters";
import ThankYouOverlay from "@/components/support/ThankYouOverlay";

export default function Support() {
  const [selectedOption, setSelectedOption] = useState("coffee");
  const [selectedSubAmount, setSelectedSubAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  const getAmount = useCallback(() => {
    if (customAmount && Number(customAmount) > 0) return Number(customAmount);
    return selectedSubAmount;
  }, [customAmount, selectedSubAmount]);

  const getBadgeForAmount = (amount: number) => {
    if (amount >= 500) return "👑";
    if (amount >= 100) return "🥇";
    if (amount >= 50) return "🥈";
    if (amount >= 10) return "🥉";
    return undefined;
  };

  const fireConfetti = () => {
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ["#8b5cf6", "#3b82f6", "#06b6d4", "#f43f5e", "#fbbf24"] });
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.5 } }), 350);
  };

  const handleDonate = () => {
    setShowThankYou(true);
    fireConfetti();
    toast.success("Thank you for supporting Terra Explorer ❤️", {
      description: "Your contribution keeps the project growing.",
    });
    setTimeout(() => setShowThankYou(false), 4500);
  };

  const handleSelectCard = (id: string, amount: number) => {
    setSelectedOption(id);
    setSelectedSubAmount(amount);
    setCustomAmount("");
  };

  const amount = getAmount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(260,30%,12%)] to-[hsl(220,40%,10%)] relative overflow-y-auto">
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-[hsl(260,70%,50%)/0.08] rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[hsl(200,80%,50%)/0.06] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(280,60%,40%)/0.04] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 pb-20">
        <SupportHeader />
        <DonationCards
          selectedOption={selectedOption}
          selectedSubAmount={selectedSubAmount}
          onSelect={handleSelectCard}
        />
        <CustomAmount customAmount={customAmount} onChange={setCustomAmount} />
        <PaymentSection />

        {/* CTA Button */}
        <Button
          onClick={handleDonate}
          className="w-full h-14 text-base font-bold rounded-2xl text-white shadow-xl shadow-[hsl(260,60%,50%)/0.3] gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] border-0"
          style={{
            background: "linear-gradient(135deg, hsl(260,80%,60%), hsl(200,90%,50%))",
          }}
        >
          <Check className="h-5 w-5" />
          I've Completed Payment — ₹{amount}
          <span className="text-lg">✅</span>
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-70">
          After paying via UPI, tap above to confirm
        </p>

        <div className="mt-8">
          <BadgesSection currentAmount={amount} />
        </div>
        <RecentSupporters />
      </div>

      <ThankYouOverlay visible={showThankYou} badgeEarned={getBadgeForAmount(amount)} />
    </div>
  );
}
