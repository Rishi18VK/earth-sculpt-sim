// Procedural ambient audio engine using Web Audio API

type BiomeAudioType = "earth" | "volcanic" | "desert" | "arctic" | "tropical";

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private activeBiome: BiomeAudioType | null = null;
  private activeNight: boolean = false;
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

  private makeNoise(ctx: AudioContext, length = 2): AudioBuffer {
    const bufferSize = ctx.sampleRate * length;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // ========== DAY SOUNDS ==========

  private createWind(ctx: AudioContext, out: GainNode) {
    const source = ctx.createBufferSource();
    source.buffer = this.makeNoise(ctx);
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 400;
    bp.Q.value = 0.5;

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
    const source = ctx.createBufferSource();
    source.buffer = this.makeNoise(ctx);
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

    const buffer = this.makeNoise(ctx);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i] * (Math.random() > 0.97 ? 1 : 0.02);
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
    const buffer = this.makeNoise(ctx);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i] * (Math.random() > 0.92 ? 1 : 0.05);
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
    const freqs = [4200, 5800, 3600];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

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

    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoise(ctx);
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

  // ========== NIGHT SOUNDS ==========

  private createNightCrickets(ctx: AudioContext, out: GainNode) {
    // Crickets: rapid chirping at ~4-5kHz with rhythmic AM
    const chirpFreqs = [4800, 5200, 4400];
    chirpFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      // Fast AM for chirp pattern
      const am = ctx.createOscillator();
      am.type = "square";
      am.frequency.value = 12 + i * 3; // staggered chirp rates
      const amGain = ctx.createGain();
      amGain.gain.value = 0.4;
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

    // Soft background night hum
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoise(ctx);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800;
    bp.Q.value = 0.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(out);
    noise.start();

    this.nodes.push(noise, bp, noiseGain);
  }

  private createHowlingWind(ctx: AudioContext, out: GainNode) {
    // Stronger, lower wind with howling modulation
    const source = ctx.createBufferSource();
    source.buffer = this.makeNoise(ctx);
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 250;
    bp.Q.value = 1.5;

    // Slow sweep for howling effect
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    // Second howl layer
    const lfo2 = ctx.createOscillator();
    lfo2.type = "triangle";
    lfo2.frequency.value = 0.04;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 100;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(bp.frequency);
    lfo2.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.7;

    source.connect(bp);
    bp.connect(gain);
    gain.connect(out);
    source.start();

    // Eerie high whistling
    const whistle = ctx.createOscillator();
    whistle.type = "sine";
    whistle.frequency.value = 1200;
    const whistleLfo = ctx.createOscillator();
    whistleLfo.type = "sine";
    whistleLfo.frequency.value = 0.12;
    const whistleLfoGain = ctx.createGain();
    whistleLfoGain.gain.value = 300;
    whistleLfo.connect(whistleLfoGain);
    whistleLfoGain.connect(whistle.frequency);
    whistleLfo.start();
    const whistleGain = ctx.createGain();
    whistleGain.gain.value = 0.06;
    whistle.connect(whistleGain);
    whistleGain.connect(out);
    whistle.start();

    this.nodes.push(source, bp, lfo, lfoGain, lfo2, lfo2Gain, gain, whistle, whistleLfo, whistleLfoGain, whistleGain);
  }

  private createVolcanicNight(ctx: AudioContext, out: GainNode) {
    // Deeper, slower rumbling with glowing embers crackling
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 25;

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 18;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 100;
    lp.Q.value = 3;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    osc1.start();
    osc2.start();

    // More prominent crackling embers
    const buffer = this.makeNoise(ctx);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i] * (Math.random() > 0.95 ? 1 : 0.03);
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = buffer;
    crackle.loop = true;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.2;
    crackle.connect(crackleGain);
    crackleGain.connect(out);
    crackle.start();

    this.nodes.push(osc1, osc2, lp, lfo, lfoGain, gain, crackle, crackleGain);
  }

  private createDesertNight(ctx: AudioContext, out: GainNode) {
    // Cold desert wind + distant coyote-like howls (tonal sweeps)
    const source = ctx.createBufferSource();
    source.buffer = this.makeNoise(ctx);
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 300;
    bp.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    source.connect(bp);
    bp.connect(gain);
    gain.connect(out);
    source.start();

    // Tonal sweep for distant howl effect
    const howl = ctx.createOscillator();
    howl.type = "sine";
    howl.frequency.value = 600;
    const howlLfo = ctx.createOscillator();
    howlLfo.type = "sine";
    howlLfo.frequency.value = 0.06;
    const howlLfoGain = ctx.createGain();
    howlLfoGain.gain.value = 200;
    howlLfo.connect(howlLfoGain);
    howlLfoGain.connect(howl.frequency);
    howlLfo.start();
    const howlGain = ctx.createGain();
    howlGain.gain.value = 0.04;
    howl.connect(howlGain);
    howlGain.connect(out);
    howl.start();

    // Sparse cricket
    const cricket = ctx.createOscillator();
    cricket.type = "sine";
    cricket.frequency.value = 5000;
    const cricketAm = ctx.createOscillator();
    cricketAm.type = "square";
    cricketAm.frequency.value = 8;
    const cricketAmGain = ctx.createGain();
    cricketAmGain.gain.value = 0.3;
    cricketAm.connect(cricketAmGain);
    const cricketMod = ctx.createGain();
    cricketMod.gain.value = 0;
    cricketAmGain.connect(cricketMod.gain);
    cricket.connect(cricketMod);
    cricketMod.connect(out);
    cricket.start();
    cricketAm.start();

    this.nodes.push(source, bp, gain, howl, howlLfo, howlLfoGain, howlGain, cricket, cricketAm, cricketAmGain, cricketMod);
  }

  private createTropicalNight(ctx: AudioContext, out: GainNode) {
    // Dense chorus of frogs + crickets + occasional bird-like calls
    // Frogs: lower frequency pulsing
    const frogFreqs = [800, 1100, 950];
    frogFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      const am = ctx.createOscillator();
      am.type = "square";
      am.frequency.value = 2 + i * 1.5;
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

    // Louder crickets
    const cricketFreqs = [5500, 4800, 6200];
    cricketFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;

      const am = ctx.createOscillator();
      am.type = "square";
      am.frequency.value = 14 + i * 4;
      const amGain = ctx.createGain();
      amGain.gain.value = 0.35;
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

    // Warm background noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoise(ctx);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 0.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.06;
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(out);
    noise.start();

    this.nodes.push(noise, bp, noiseGain);
  }

  // --- Public API ---

  play(biome: BiomeAudioType, isNight: boolean = false) {
    if (this.activeBiome === biome && this.activeNight === isNight && this.isPlaying) return;
    this.stop();
    const ctx = this.getContext();
    const out = this.masterGain!;

    if (isNight) {
      switch (biome) {
        case "arctic": this.createHowlingWind(ctx, out); break;
        case "earth": this.createNightCrickets(ctx, out); break;
        case "volcanic": this.createVolcanicNight(ctx, out); break;
        case "desert": this.createDesertNight(ctx, out); break;
        case "tropical": this.createTropicalNight(ctx, out); break;
      }
    } else {
      switch (biome) {
        case "arctic": this.createWind(ctx, out); break;
        case "earth": this.createRain(ctx, out); break;
        case "volcanic": this.createVolcanic(ctx, out); break;
        case "desert": this.createDesertFire(ctx, out); break;
        case "tropical": this.createTropicalInsects(ctx, out); break;
      }
    }

    this.activeBiome = biome;
    this.activeNight = isNight;
    this.isPlaying = true;
  }

  stop() {
    this.stopNodes();
    this.isPlaying = false;
    this.activeBiome = null;
    this.activeNight = false;
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
