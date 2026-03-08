import { Gamepad2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayModeUIProps {
  playMode: boolean;
  onToggle: () => void;
  playerPosition: [number, number, number] | null;
  collectibles?: { collected: number; total: number };
}

export default function PlayModeUI({ playMode, onToggle, playerPosition, collectibles }: PlayModeUIProps) {
  if (!playMode || !playerPosition) return null;
  
  return (
    <>

      {/* Player coordinates HUD */}
      {playMode && playerPosition && (
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50">
          <p className="text-[10px] font-mono text-muted-foreground mb-1">🎮 Player Position</p>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <div>
              <span className="text-primary">X:</span>{" "}
              <span className="text-foreground">{playerPosition[0]}</span>
            </div>
            <div>
              <span className="text-primary">Y:</span>{" "}
              <span className="text-foreground">{playerPosition[1]}</span>
            </div>
            <div>
              <span className="text-primary">Z:</span>{" "}
              <span className="text-foreground">{playerPosition[2]}</span>
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            📏 Elevation: {playerPosition[1]}m
          </p>
          {collectibles && (
            <div className="mt-1.5 pt-1.5 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">💎 Collectibles</span>
                <span className="text-[10px] font-mono font-bold text-primary">
                  {collectibles.collected}/{collectibles.total}
                </span>
              </div>
              {collectibles.total > 0 && (
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(collectibles.collected / collectibles.total) * 100}%` }}
                  />
                </div>
              )}
              {collectibles.collected === collectibles.total && collectibles.total > 0 && (
                <p className="text-[9px] text-primary font-semibold mt-0.5">🎉 All collected!</p>
              )}
            </div>
          )}
          <p className="text-[9px] text-muted-foreground">
            🖥️ WASD + Shift(Sprint) + Space(Jump)
          </p>
          <p className="text-[9px] text-muted-foreground">
            📱 Joystick + Swipe | Jump & Sprint buttons
          </p>
        </div>
      )}
    </>
  );
}
