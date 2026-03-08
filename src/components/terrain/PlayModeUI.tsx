import { Gamepad2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayModeUIProps {
  playMode: boolean;
  onToggle: () => void;
  playerPosition: [number, number, number] | null;
}

export default function PlayModeUI({ playMode, onToggle, playerPosition }: PlayModeUIProps) {
  return (
    <>
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <Button
          variant={playMode ? "destructive" : "default"}
          size="sm"
          onClick={onToggle}
          className="gap-1.5 text-xs"
        >
          {playMode ? <X className="h-3.5 w-3.5" /> : <Gamepad2 className="h-3.5 w-3.5" />}
          {playMode ? "Exit Play" : "Play Mode"}
        </Button>
      </div>

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
