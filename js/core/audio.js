/**
 * Lucky Duck Race / Random Name Picker Platform
 * Core Module: AudioManager
 * 
 * Hybrid dual-mode audio engine:
 * 1. Primary: HTML5 Audio for high-quality audio files (race.mp3).
 * 2. Fallback: Web Audio API synthesis ("Sabre Dance" arrangement) for offline / CORS restrictions.
 * 3. Procedural Sound FX: Quacks, countdown beeps, fanfare, water splashes.
 */

(function () {
  'use strict';

  const SOUND_STORAGE_KEY = 'lucky_duck_sound_enabled';

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.enabled = this.loadSoundPreference();
      this.musicGain = null;
      this.isMusicPlaying = false;
      this.musicLoopTimeout = null;

      // Hybrid Audio: MP3 file with Web Audio Synthesizer fallback
      this.mp3Audio = null;
      this.hasMp3 = false;
      this.currentTrackUrl = 'race.mp3';
      this.initMp3(this.currentTrackUrl);
    }

    loadSoundPreference() {
      try {
        const saved = localStorage.getItem(SOUND_STORAGE_KEY);
        if (saved !== null) {
          return saved === 'true';
        }
      } catch (e) {}
      return true;
    }

    saveSoundPreference() {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, this.enabled ? 'true' : 'false');
      } catch (e) {}
    }

    initMp3(trackUrl) {
      try {
        this.mp3Audio = new Audio(trackUrl);
        this.mp3Audio.preload = 'auto';
        this.mp3Audio.loop = true;
        this.mp3Audio.volume = 0.85;

        this.mp3Audio.addEventListener('canplaythrough', () => {
          this.hasMp3 = true;
        });
        this.mp3Audio.addEventListener('loadeddata', () => {
          this.hasMp3 = true;
        });
        this.mp3Audio.addEventListener('error', () => {
          this.hasMp3 = false;
        });
        if (this.mp3Audio.readyState >= 2) {
          this.hasMp3 = true;
        }
      } catch (e) {
        this.hasMp3 = false;
      }
    }

    setMusicTrack(trackUrl) {
      if (this.isMusicPlaying) {
        this.stopRaceMusic();
      }
      this.currentTrackUrl = trackUrl;
      this.initMp3(trackUrl);
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      this.saveSoundPreference();
      if (!this.enabled) {
        this.stopRaceMusic();
      }
      return this.enabled;
    }

    playRaceMusic() {
      if (!this.enabled) return;
      this.init();

      this.isMusicPlaying = true;

      // 1. Try playing MP3 audio track if available
      if (this.mp3Audio) {
        this.mp3Audio.currentTime = 0;
        this.mp3Audio.volume = 0.85;
        const playPromise = this.mp3Audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.hasMp3 = true;
          }).catch(err => {
            console.log('Audio file playback prevented, using synth fallback:', err);
            if (this.isMusicPlaying && this.enabled) {
              this.playSabreDance();
            }
          });
          return;
        }
      }

      // 2. Fallback to synthesized Sabre Dance orchestra
      this.playSabreDance();
    }

    stopRaceMusic() {
      this.isMusicPlaying = false;

      // Stop MP3 if active
      if (this.mp3Audio) {
        try {
          this.mp3Audio.pause();
          this.mp3Audio.currentTime = 0;
        } catch (e) {}
      }

      // Stop Synth
      this.stopSabreDance();
    }

    // Play cheerful duck quack squeak
    playQuack() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    }

    // Play countdown tones (3, 2, 1, go)
    playCountdown(step, gameId = 'duck-race') {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freqMap = { 3: 440, 2: 554, 1: 659, go: 880 };
      const freq = freqMap[step] || 523;

      osc.type = step === 'go' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (step === 'go') {
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.25);
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (step === 'go' ? 0.45 : 0.25));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);

      if (step === 'go') {
        setTimeout(() => {
          if (gameId === 'rocket-race') {
            this.playRocketBlast();
          } else if (gameId === 'horse-race') {
            this.playGallop();
          } else if (gameId === 'wheel-fortune') {
            this.playWheelTick(1.0);
          } else {
            this.playQuack();
          }
        }, 120);
      }
    }

    // Play rocket blastoff ignition sound
    playRocketBlast() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Low frequency rumble oscillator
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);

      // Noise blast
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.45);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    }

    // Play procedural rocket engine thruster rumble
    playRocketThruster() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    }

    // Play sci-fi warp speed boost sweep
    playWarpBoost() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1280, now + 0.28);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.28);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    }

    // Play mechanical carnival prize wheel peg click
    playWheelTick(speedRate = 1.0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp mechanical woodblock/brass tick transient
      const baseFreq = 1150 + (speedRate * 450) + (Math.random() * 60 - 30);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.028);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.042);
    }

    // Play water splash sound
    playSplash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    }

    // Play turf hoofbeat gallop sound
    playGallop() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [0, 0.05].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 110 : 95, now + offset);
        osc.frequency.exponentialRampToValueAtTime(45, now + offset + 0.04);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.045);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
    }

    // Play victory fanfare
    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.45 } // C6
      ];

      let delay = 0;
      notes.forEach((n, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(n.f, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + n.d + 0.05);
        }, delay * 1000);
        delay += n.d * 0.85;
      });
    }

    // ========================================================================
    // ARAM KHACHATURIAN: "SABRE DANCE" SYNTHESIZER FALLBACK
    // ========================================================================
    async playSabreDance() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.stopSabreDance();

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.70, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.isMusicPlaying = true;
      this.scheduleSabreDanceLoop();
    }

    stopSabreDance() {
      this.isMusicPlaying = false;
      if (this.musicLoopTimeout) {
        clearTimeout(this.musicLoopTimeout);
        this.musicLoopTimeout = null;
      }
      if (this.musicGain && this.ctx) {
        try {
          const now = this.ctx.currentTime;
          this.musicGain.gain.cancelScheduledValues(now);
          this.musicGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          const oldGain = this.musicGain;
          setTimeout(() => {
            try { oldGain.disconnect(); } catch (e) {}
          }, 100);
          this.musicGain = null;
        } catch (e) {}
      }
    }

    scheduleSabreDanceLoop() {
      if (!this.isMusicPlaying || !this.ctx || !this.enabled || !this.musicGain) return;

      const ctx = this.ctx;
      const startTime = ctx.currentTime + 0.04;
      const stepTime = 0.088; // 16th note (~170 BPM high-energy Presto tempo)

      // Note Frequencies (Hz)
      const G4 = 392.00, Fs4 = 369.99, Ab4 = 415.30, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
      const C5 = 523.25, Cs5 = 554.37, D5 = 587.33, Eb5 = 622.25, E5 = 659.25, F5 = 698.46, Fs5 = 739.99, G5 = 783.99;

      // 64 Sixteenth-Notes of the iconic theme
      const melody = [
        G4, G4, G4, G4, Fs4, G4, Ab4, G4,
        Fs4, G4, Ab4, G4, Fs4, G4, Ab4, A4,
        Bb4, A4, Ab4, A4, Bb4, A4, Ab4, A4,
        D5, Cs5, D5, Eb5, D5, C5, Bb4, A4,
        G4, G4, G4, G4, Fs4, G4, Ab4, G4,
        Fs4, G4, Ab4, G4, Fs4, G4, Ab4, A4,
        Bb4, B4, C5, Cs5, D5, Eb5, E5, F5,
        Fs5, G5, G5, G5, D5, D5, Bb4, G4
      ];

      // Schedule Melody
      melody.forEach((freq, idx) => {
        const noteTime = startTime + idx * stepTime;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(freq, noteTime);

        const peakGain = 0.45;
        const attack = 0.005;
        const sustainLevel = peakGain * 0.72;
        const sustainTime = stepTime * 0.70;

        noteGain.gain.setValueAtTime(0.0001, noteTime);
        noteGain.gain.linearRampToValueAtTime(peakGain, noteTime + attack);
        noteGain.gain.linearRampToValueAtTime(sustainLevel, noteTime + sustainTime);
        noteGain.gain.linearRampToValueAtTime(0.0001, noteTime + stepTime);

        osc.connect(noteGain);
        if (this.musicGain) noteGain.connect(this.musicGain);

        osc.start(noteTime);
        osc.stop(noteTime + stepTime + 0.01);
      });

      // Schedule Rhythm
      const totalMeasures = 8;
      for (let m = 0; m < totalMeasures; m++) {
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = startTime + (m * 4 + beat) * (stepTime * 4);
          const beatDuration = stepTime * 4;

          if (beat === 0 || beat === 2) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.type = 'triangle';
            kickOsc.frequency.setValueAtTime(140, beatTime);
            kickOsc.frequency.exponentialRampToValueAtTime(65, beatTime + 0.12);

            kickGain.gain.setValueAtTime(0.0001, beatTime);
            kickGain.gain.linearRampToValueAtTime(0.55, beatTime + 0.005);
            kickGain.gain.linearRampToValueAtTime(0.35, beatTime + beatDuration * 0.5);
            kickGain.gain.linearRampToValueAtTime(0.0001, beatTime + beatDuration * 0.85);

            kickOsc.connect(kickGain);
            if (this.musicGain) kickGain.connect(this.musicGain);

            kickOsc.start(beatTime);
            kickOsc.stop(beatTime + beatDuration);
          }

          if (beat === 1 || beat === 3) {
            [146.83, 196.00, 233.08, 293.66].forEach(chordFreq => {
              const chordOsc = ctx.createOscillator();
              const chordGain = ctx.createGain();

              chordOsc.type = 'sawtooth';
              chordOsc.frequency.setValueAtTime(chordFreq, beatTime);

              chordGain.gain.setValueAtTime(0.0001, beatTime);
              chordGain.gain.linearRampToValueAtTime(0.18, beatTime + 0.005);
              chordGain.gain.linearRampToValueAtTime(0.12, beatTime + beatDuration * 0.4);
              chordGain.gain.linearRampToValueAtTime(0.0001, beatTime + beatDuration * 0.6);

              chordOsc.connect(chordGain);
              if (this.musicGain) chordGain.connect(this.musicGain);

              chordOsc.start(beatTime);
              chordOsc.stop(beatTime + beatDuration * 0.65);
            });
          }
        }
      }

      const loopDurationMs = 64 * stepTime * 1000;
      this.musicLoopTimeout = setTimeout(() => {
        if (this.isMusicPlaying) {
          this.scheduleSabreDanceLoop();
        }
      }, loopDurationMs - 40);
    }
  }

  // Export to global scope
  window.AudioManager = AudioManager;
  window.SoundEffects = AudioManager; // Backward compatibility alias
})();
