import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface DayNightToggleProps {
  isNight: boolean;
  onToggle: () => void;
}

export default function DayNightToggle({ isNight, onToggle }: DayNightToggleProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardContent className="p-2">
        <Button
          variant={isNight ? "default" : "outline"}
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={onToggle}
        >
          {isNight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          {isNight ? "Night Mode" : "Day Mode"}
        </Button>
      </CardContent>
    </Card>
  );
}
