import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SupportHeader() {
  const navigate = useNavigate();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Explorer
      </Button>

      <div className="text-center mb-8">
        {/* Creator avatar */}
        <div className="relative inline-block mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(260,80%,60%)] to-[hsl(200,90%,50%)] p-[3px] shadow-xl shadow-[hsl(260,60%,50%)/0.3]">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-br from-[hsl(260,80%,60%)] to-[hsl(200,90%,50%)] bg-clip-text text-transparent">
                T
              </span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-destructive to-[hsl(340,80%,55%)] flex items-center justify-center shadow-lg">
            <Heart className="h-3.5 w-3.5 text-white fill-white" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
          Support the Creator <span className="text-destructive">❤️</span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Help keep Terra Explorer growing by buying me a coffee or meal.
        </p>
      </div>
    </>
  );
}
