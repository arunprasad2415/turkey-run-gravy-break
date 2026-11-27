/* Sound, synthesised on the page: nothing is loaded, every effect is a short oscillator or noise
   burst, which keeps the game a set of plain files with no network request. The audio context is
   created on the first key or click, as browsers require. */

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
  }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  tone({ freq = 440, to = null, type = 'sine', dur = 0.18, gain = 0.3, delay = 0, sweep = 'exp' }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to && to !== freq) {
      if (sweep === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      else osc.frequency.linearRampToValueAtTime(to, t0 + dur);
    }
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noise({ dur = 0.2, gain = 0.25, delay = 0, filter = 1400, sweepTo = null }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(filter, t0);
    if (sweepTo) band.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t0 + dur);
    band.Q.value = 0.9;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(band).connect(amp).connect(this.master);
    src.start(t0);
  }

  gobble() {
    this.tone({ freq: 320, to: 190, type: 'sawtooth', dur: 0.14, gain: 0.22 });
    this.tone({ freq: 260, to: 150, type: 'square', dur: 0.12, gain: 0.12, delay: 0.1 });
  }

  cluck() {
    this.tone({ freq: 720, to: 1080, type: 'triangle', dur: 0.07, gain: 0.14 });
  }

  corn() {
    this.tone({ freq: 660, type: 'triangle', dur: 0.09, gain: 0.2 });
    this.tone({ freq: 990, type: 'triangle', dur: 0.12, gain: 0.18, delay: 0.07 });
  }

  dash() {
    this.noise({ dur: 0.16, gain: 0.18, filter: 900, sweepTo: 2600 });
  }

  spotted() {
    this.tone({ freq: 300, to: 520, type: 'square', dur: 0.16, gain: 0.2 });
    this.tone({ freq: 520, to: 300, type: 'square', dur: 0.2, gain: 0.18, delay: 0.17 });
  }

  knifeWarn() {
    this.noise({ dur: 0.1, gain: 0.1, filter: 3200 });
  }

  knifeHit() {
    this.noise({ dur: 0.26, gain: 0.32, filter: 1800, sweepTo: 300 });
    this.tone({ freq: 160, to: 70, type: 'sawtooth', dur: 0.24, gain: 0.2 });
  }

  flame() {
    this.noise({ dur: 0.36, gain: 0.16, filter: 620, sweepTo: 1500 });
  }

  caught() {
    this.tone({ freq: 240, to: 90, type: 'sawtooth', dur: 0.5, gain: 0.26 });
    this.tone({ freq: 180, to: 60, type: 'square', dur: 0.6, gain: 0.16, delay: 0.12 });
  }

  stageClear() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.2, gain: 0.18, delay: i * 0.11 }));
  }

  escape() {
    const notes = [392, 523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.28, gain: 0.17, delay: i * 0.13 }));
  }

  ui() {
    this.tone({ freq: 540, to: 760, type: 'triangle', dur: 0.08, gain: 0.12 });
  }
}