import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ambientAudio } from "@/lib/ambient-audio";
import { BiomeId } from "@/lib/biomes";

const BIOME_SOUND_LABELS: Record<BiomeId, { day: string; night: string }> = {
  arctic: { day: "❄️ Arctic Wind", night: "🌬️ Howling Blizzard" },
  earth: { day: "🌧️ Rain", night: "🦗 Night Crickets" },
  volcanic: { day: "🌋 Rumbling", night: "🔥 Glowing Embers" },
  desert: { day: "🔥 Fire Crackling", night: "🐺 Desert Night" },
  tropical: { day: "🦗 Insects & Nature", night: "🐸 Frogs & Crickets" },
};

interface AmbientSoundToggleProps {
  biome: BiomeId;
  isNight?: boolean;
}

export default function AmbientSoundToggle({ biome, isNight = false }: AmbientSoundToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);

  useEffect(() => {
    if (isPlaying) {
      ambientAudio.play(biome, isNight);
    }
  }, [biome, isNight, isPlaying]);

  useEffect(() => {
    ambientAudio.setVolume(volume / 100);
  }, [volume]);

  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  const toggle = () => {
    if (isPlaying) {
      ambientAudio.stop();
      setIsPlaying(false);
    } else {
      ambientAudio.play(biome, isNight);
      setIsPlaying(true);
    }
  };

  const label = isNight
    ? BIOME_SOUND_LABELS[biome].night
    : BIOME_SOUND_LABELS[biome].day;

  return (
    <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50 px-3 py-2 space-y-2">
      <button
        onClick={toggle}
        className="flex items-center gap-2 w-full text-left"
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-foreground">
          {isPlaying ? label : "Ambient Sound Off"}
        </span>
      </button>
      {isPlaying && (
        <Slider
          value={[volume]}
          onValueChange={([v]) => setVolume(v)}
          max={100}
          min={0}
          step={1}
          className="w-full"
        />
      )}
    </div>
  );
}
