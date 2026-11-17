export interface MusicTrack {
  id: string;
  title: string;
  mood: string;
  bpm: number;
  wave: OscillatorType;
  bassWave: OscillatorType;
  chordProgression: number[][];
  melodyPattern: number[];
  stepDivisor: number;
  filterCutoff: number;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'warm-cocoa',
    title: 'Warm Cocoa Lofi',
    mood: 'Уютный лоу-фай',
    bpm: 78,
    wave: 'triangle',
    bassWave: 'sine',
    chordProgression: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ],
    melodyPattern: [523.25, 659.25, 587.33, 493.88, 523.25, 0, 440.0, 392.0],
    stepDivisor: 2,
    filterCutoff: 1100,
  },
  {
    id: 'kitty-music-box',
    title: 'Kitty Music Box',
    mood: 'Нежная шкатулка',
    bpm: 94,
    wave: 'sine',
    bassWave: 'sine',
    chordProgression: [
      [329.63, 392.0, 493.88],
      [293.66, 349.23, 440.0],
      [261.63, 329.63, 392.0],
      [246.94, 293.66, 392.0],
    ],
    melodyPattern: [783.99, 659.25, 523.25, 659.25, 783.99, 880.0, 783.99, 587.33],
    stepDivisor: 2,
    filterCutoff: 2400,
  },
  {
    id: 'starlight-chill',
    title: 'Starlight Chill',
    mood: 'Звёздный эмбиент',
    bpm: 72,
    wave: 'sine',
    bassWave: 'triangle',
    chordProgression: [
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [246.94, 293.66, 392.0, 493.88], // G6
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 440.0], // Am
    ],
    melodyPattern: [587.33, 0, 659.25, 523.25, 0, 440.0, 493.88, 392.0],
    stepDivisor: 2,
    filterCutoff: 1500,
  },
  {
    id: 'berry-bossa',
    title: 'Berry Bossa',
    mood: 'Солнечный босса-грув',
    bpm: 102,
    wave: 'triangle',
    bassWave: 'sine',
    chordProgression: [
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
    ],
    melodyPattern: [659.25, 587.33, 523.25, 0, 587.33, 523.25, 440.0, 392.0],
    stepDivisor: 2,
    filterCutoff: 1400,
  },
  {
    id: 'velvet-rain',
    title: 'Velvet Rain',
    mood: 'Вечернее пианино',
    bpm: 66,
    wave: 'sine',
    bassWave: 'sine',
    chordProgression: [
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [261.63, 329.63, 392.0], // C
      [196.0, 246.94, 293.66], // G
    ],
    melodyPattern: [440.0, 523.25, 659.25, 523.25, 440.0, 392.0, 329.63, 0],
    stepDivisor: 2,
    filterCutoff: 1200,
  },
  {
    id: 'pastel-arcade',
    title: 'Pastel Arcade',
    mood: 'Игровой пастельный бит',
    bpm: 112,
    wave: 'triangle',
    bassWave: 'triangle',
    chordProgression: [
      [261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
    ],
    melodyPattern: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 440.0],
    stepDivisor: 2,
    filterCutoff: 1850,
  },
  {
    id: 'midnight-latte',
    title: 'Midnight Latte',
    mood: 'Глубокий чиллаут',
    bpm: 74,
    wave: 'sine',
    bassWave: 'sine',
    chordProgression: [
      [196.0, 233.08, 293.66, 349.23], // Gm7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [155.56, 196.0, 233.08, 293.66], // Ebmaj7
      [146.83, 174.61, 220.0, 261.63], // Dm7
    ],
    melodyPattern: [392.0, 466.16, 587.33, 0, 523.25, 440.0, 349.23, 392.0],
    stepDivisor: 2,
    filterCutoff: 980,
  },
];

class AmbientMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timerId: number | null = null;
  private currentTrack: MusicTrack | null = null;
  private stepIndex = 0;
  private volume = 0.45;

  private ensureContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 1400;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.38;

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.38, this.ctx.currentTime, 0.06);
    }
  }

  public play(track: MusicTrack): void {
    this.stop();
    this.ensureContext();
    if (!this.ctx || !this.filter) return;

    this.currentTrack = track;
    this.stepIndex = 0;
    this.filter.frequency.setTargetAtTime(track.filterCutoff, this.ctx.currentTime, 0.1);

    const stepMs = (60 / track.bpm / track.stepDivisor) * 1000;
    this.tick();
    this.timerId = window.setInterval(() => {
      this.tick();
    }, stepMs);
  }

  private tick(): void {
    if (!this.ctx || !this.filter || !this.currentTrack) return;

    const now = this.ctx.currentTime;
    const track = this.currentTrack;
    const step = this.stepIndex;
    const stepsPerBar = 8;
    const barIndex = Math.floor(step / stepsPerBar) % track.chordProgression.length;
    const stepInBar = step % stepsPerBar;

    // Play soft warm chord pad + bass at the start of each bar
    if (stepInBar === 0) {
      const chord = track.chordProgression[barIndex];
      const barDuration = (60 / track.bpm / track.stepDivisor) * stepsPerBar;

      chord.forEach((freq) => {
        this.playTone(freq, now, barDuration * 0.92, track.wave, 0.11, 0.12);
      });

      // Sub bass root
      this.playTone(chord[0] / 2, now, barDuration * 0.85, track.bassWave, 0.16, 0.08);
    }

    // Play gentle melody note on each step
    const melodyFreq = track.melodyPattern[stepInBar % track.melodyPattern.length];
    if (melodyFreq > 0) {
      const noteDur = (60 / track.bpm / track.stepDivisor) * 1.4;
      this.playTone(melodyFreq, now, noteDur, track.wave, 0.14, 0.025);
    }

    this.stepIndex += 1;
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    attack: number,
  ): void {
    if (!this.ctx || !this.filter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.filter);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  public stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentTrack = null;
  }
}

export const musicEngine = new AmbientMusicEngine();
