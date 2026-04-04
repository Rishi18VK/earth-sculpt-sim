// Sound effect engine using a preloaded MP3 file for biome switch

class SfxEngine {
  private audio: HTMLAudioElement | null = null;
  private enabled = true;

  constructor() {
    try {
      this.audio = new Audio("/sounds/faaah.mp3");
      this.audio.preload = "auto";
    } catch {
      // Fail silently
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  isEnabled() {
    return this.enabled;
  }

  playBiomeSwitch() {
    if (!this.enabled || !this.audio) return;
    try {
      this.audio.currentTime = 0;
      this.audio.volume = 0.5;
      this.audio.play().catch(() => {});
    } catch {
      // Fail silently
    }
  }
}

export const sfxEngine = new SfxEngine();
