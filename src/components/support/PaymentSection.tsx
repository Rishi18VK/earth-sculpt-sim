import { useState } from "react";
import { Copy, Check, Smartphone, QrCode } from "lucide-react";
import { toast } from "sonner";

const UPI_ID = "terraexplorer@upi";

const UPI_APPS = [
  { name: "Google Pay", color: "from-[hsl(210,80%,50%)] to-[hsl(145,60%,45%)]", icon: "💳" },
  { name: "Paytm", color: "from-[hsl(200,90%,50%)] to-[hsl(200,70%,40%)]", icon: "📱" },
  { name: "PhonePe", color: "from-[hsl(260,70%,55%)] to-[hsl(280,60%,45%)]", icon: "📲" },
];

export default function PaymentSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Pay via UPI
      </h3>
      <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/20 p-5">
        {/* QR Code placeholder */}
        <div className="flex justify-center mb-4">
          <div className="w-40 h-40 rounded-2xl bg-white flex items-center justify-center shadow-inner border border-border/10">
            <div className="text-center">
              <QrCode className="h-20 w-20 text-slate-900/85 mx-auto mb-1" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-slate-700">Scan to Pay</span>
            </div>
          </div>
        </div>

        {/* UPI ID */}
        <div className="flex items-center gap-2 bg-background/60 rounded-xl p-3 border border-border/20 mb-4">
          <Smartphone className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-mono text-foreground flex-1 truncate">{UPI_ID}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* UPI Apps */}
        <div className="grid grid-cols-3 gap-2">
          {UPI_APPS.map((app) => (
            <div
              key={app.name}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/60 border border-border/10 hover:border-primary/20 transition-all cursor-pointer hover:scale-[1.03]"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-lg shadow-sm`}>
                {app.icon}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{app.name}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Scan QR or pay using UPI ID above
        </p>
      </div>
    </div>
  );
}
