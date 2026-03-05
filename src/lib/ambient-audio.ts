// Procedural ambient audio engine using Web Audio API

type BiomeAudioType = "earth" | "volcanic" | "desert" | "arctic" | "tropical";

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private activeBiome: BiomeAudioType | null = null;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private stopNodes() {
    this.nodes.forEach((n) => {
      try {
        if (n instanceof OscillatorNode) n.stop();
        if (n instanceof AudioBufferSourceNode) n.stop();
        n.disconnect();
      } catch {}
    });
    this.nodes = [];
  }

  // --- Biome sound generators ---

  private createWind(ctx: AudioContext, out: GainNode) {
    // Filtered noise for wind
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 400;
    bp.Q.value = 0.5;

    // LFO to modulate filter frequency for gusting
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    source.connect(bp);
    bp.connect(gain);
    gain.connect(out);
    source.start();

    this.nodes.push(source, bp, lfo, lfoGain, gain);
  }

  private createRain(ctx: AudioContext, out: GainNode) {
    // Noise filtered for rain-like patter
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2000;
    hp.Q.value = 0.3;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 8000;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    source.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    source.start();

    // Soft low rumble for thunder ambience
    const rumble = ctx.createOscillator();
    rumble.type = "sine";
    rumble.frequency.value = 55;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.08;
    rumble.connect(rumbleGain);
    rumbleGain.connect(out);
    rumble.start();

    this.nodes.push(source, hp, lp, gain, rumble, rumbleGain);
  }

  private createVolcanic(ctx: AudioContext, out: GainNode) {
    // Deep rumbling
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 35;

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 22;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 150;
    lp.Q.value = 2;

    // LFO for rumble modulation
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    osc1.start();
    osc2.start();

    // Crackling noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.97 ? 1 : 0.02);
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = buffer;
    crackle.loop = true;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.15;
    crackle.connect(crackleGain);
    crackleGain.connect(out);
    crackle.start();

    this.nodes.push(osc1, osc2, lp, lfo, lfoGain, gain, crackle, crackleGain);
  }

  private createDesertFire(ctx: AudioContext, out: GainNode) {
    // Crackling fire effect
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.92 ? 1 : 0.05);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3000;
    bp.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.35;

    source.connect(bp);
    bp.connect(gain);
    gain.connect(out);
    source.start();

    // Gentle low hum for heat
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 80;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain);
    humGain.connect(out);
    hum.start();

    this.nodes.push(source, bp, gain, hum, humGain);
  }

  private createTropicalInsects(ctx: AudioContext, out: GainNode) {
    // Multiple oscillators at insect-like frequencies with modulation
    const freqs = [4200, 5800, 3600];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      // AM modulation for chirping
      const am = ctx.createOscillator();
      am.type = "sine";
      am.frequency.value = 3 + Math.random() * 8;
      const amGain = ctx.createGain();
      amGain.gain.value = 0.5;
      am.connect(amGain);

      const modGain = ctx.createGain();
      modGain.gain.value = 0;
      amGain.connect(modGain.gain);

      osc.connect(modGain);
      modGain.connect(out);

      osc.start();
      am.start();

      this.nodes.push(osc, am, amGain, modGain);
    });

    // Background nature noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseBp = ctx.createBiquadFilter();
    noiseBp.type = "bandpass";
    noiseBp.frequency.value = 1500;
    noiseBp.Q.value = 0.3;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.08;
    noise.connect(noiseBp);
    noiseBp.connect(noiseGain);
    noiseGain.connect(out);
    noise.start();

    this.nodes.push(noise, noiseBp, noiseGain);
  }

  // --- Public API ---

  play(biome: BiomeAudioType) {
    if (this.activeBiome === biome && this.isPlaying) return;
    this.stop();
    const ctx = this.getContext();
    const out = this.masterGain!;

    switch (biome) {
      case "arctic": this.createWind(ctx, out); break;
      case "earth": this.createRain(ctx, out); break;
      case "volcanic": this.createVolcanic(ctx, out); break;
      case "desert": this.createDesertFire(ctx, out); break;
      case "tropical": this.createTropicalInsects(ctx, out); break;
    }

    this.activeBiome = biome;
    this.isPlaying = true;
  }

  stop() {
    this.stopNodes();
    this.isPlaying = false;
    this.activeBiome = null;
  }

  setVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  get playing() {
    return this.isPlaying;
  }

  get currentBiome() {
    return this.activeBiome;
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

export const ambientAudio = new AmbientAudioEngine();
