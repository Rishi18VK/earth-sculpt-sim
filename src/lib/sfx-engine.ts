// Procedural meme sound effect engine using Web Audio API
// Generates a "fahhh" descending vocal-style sound on terrain switch

class SfxEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private playing = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  isEnabled() {
    return this.enabled;
  }

  /** Play the "fahhh" meme sound — a descending vocal formant burst */
  playBiomeSwitch() {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Stop previous if overlapping
      if (this.playing) return;
      this.playing = true;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, now);
      master.gain.linearRampToValueAtTime(0.45, now + 0.08);
      master.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      master.connect(ctx.destination);

      // Fundamental — descending "ahhh" tone
      const fund = ctx.createOscillator();
      fund.type = "sawtooth";
      fund.frequency.setValueAtTime(320, now);
      fund.frequency.exponentialRampToValueAtTime(140, now + 0.6);
      const fundGain = ctx.createGain();
      fundGain.gain.value = 0.5;
      fund.connect(fundGain);
      fundGain.connect(master);
      fund.start(now);
      fund.stop(now + 0.75);

      // Formant 1 — "ah" vowel (bandpass around 700-900Hz)
      const noise1 = this.createNoiseBurst(ctx, 0.8);
      const bp1 = ctx.createBiquadFilter();
      bp1.type = "bandpass";
      bp1.frequency.setValueAtTime(900, now);
      bp1.frequency.exponentialRampToValueAtTime(500, now + 0.5);
      bp1.Q.value = 3;
      const f1Gain = ctx.createGain();
      f1Gain.gain.setValueAtTime(0.3, now);
      f1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      noise1.connect(bp1);
      bp1.connect(f1Gain);
      f1Gain.connect(master);
      noise1.start(now);
      noise1.stop(now + 0.75);

      // Formant 2 — nasal quality
      const noise2 = this.createNoiseBurst(ctx, 0.8);
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.setValueAtTime(1800, now);
      bp2.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      bp2.Q.value = 4;
      const f2Gain = ctx.createGain();
      f2Gain.gain.setValueAtTime(0.15, now);
      f2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      noise2.connect(bp2);
      bp2.connect(f2Gain);
      f2Gain.connect(master);
      noise2.start(now);
      noise2.stop(now + 0.75);

      // Sub bass thump for impact
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start(now);
      sub.stop(now + 0.4);

      // Cleanup
      setTimeout(() => {
        this.playing = false;
        try {
          master.disconnect();
        } catch {}
      }, 800);
    } catch {
      this.playing = false;
      // Fail silently — don't break the app
    }
  }

  private createNoiseBurst(ctx: AudioContext, duration: number): AudioBufferSourceNode {
    const size = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

export const sfxEngine = new SfxEngine();
