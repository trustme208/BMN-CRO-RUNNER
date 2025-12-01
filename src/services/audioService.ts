// Full audio service: tries to use audio files in /public/audio/*.mp3, otherwise uses WebAudio synth fallback.

type SoundKey = 'jump' | 'coin' | 'hit' | 'bossRoar';

class AudioService {
  private static instance: AudioService;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private audioEls: Partial<Record<SoundKey, HTMLAudioElement>> = {};
  private enabled = true;

  private constructor() {
    // Attempt to preload HTML audio files if present
    const base = '/audio';
    const list: Record<SoundKey, string> = {
      jump: `${base}/jump.mp3`,
      coin: `${base}/coin.mp3`,
      hit: `${base}/hit.mp3`,
      bossRoar: `${base}/bossRoar.mp3`
    };

    Object.entries(list).forEach(([k, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.load();
      // We won't rely solely on these existing files; synth fallback exists.
      this.audioEls[k as SoundKey] = audio;
    });
  }

  static getInstance() {
    if (!AudioService.instance) AudioService.instance = new AudioService();
    return AudioService.instance;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  private playHtmlAudio(key: SoundKey) {
    const el = this.audioEls[key];
    if (!el) return false;
    try {
      el.currentTime = 0;
      el.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  private synthBeep(opts: { freq: number; length?: number; type?: OscillatorType; gain?: number; freqEnd?: number }) {
    if (!this.ctx || !this.masterGain) return;
    const { freq, length = 0.12, type = 'sine', gain = 0.25, freqEnd } = opts;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (typeof freqEnd === 'number') osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + length);
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + length);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + length);
  }

  playJump() {
    if (!this.enabled) return;
    if (this.playHtmlAudio('jump')) return;
    this.synthBeep({ freq: 320, freqEnd: 640, length: 0.1, type: 'sine', gain: 0.25 });
  }

  playCollect() {
    if (!this.enabled) return;
    if (this.playHtmlAudio('coin')) return;
    // quick arpeggio
    if (!this.ctx) { this.init(); }
    this.synthBeep({ freq: 1200, freqEnd: 1600, length: 0.08, type: 'square', gain: 0.18 });
    setTimeout(() => this.synthBeep({ freq: 1400, length: 0.08, type: 'triangle', gain: 0.14 }), 60);
  }

  playCrash() {
    if (!this.enabled) return;
    if (this.playHtmlAudio('hit')) return;
    this.synthBeep({ freq: 150, freqEnd: 30, length: 0.32, type: 'sawtooth', gain: 0.4 });
  }

  playBossRoar() {
    if (!this.enabled) return;
    if (this.playHtmlAudio('bossRoar')) return;
    // deep rumble — layered oscillators
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(60, t);
    g1.gain.setValueAtTime(0.5, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
    o1.connect(g1);
    g1.connect(this.masterGain);
    o1.start();
    o1.stop(t + 1.2);
  }

  muteAll() { this.enabled = false; }
  unmuteAll() { this.enabled = true; }
}

export const audioService = AudioService.getInstance();
