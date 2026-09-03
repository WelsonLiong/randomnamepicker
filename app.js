/**
 * Lucky Duck Race - Classroom Random Name Picker
 * Production-ready Web Application Logic
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION & CONSTANTS
  // ==========================================================================
  const MAX_STUDENTS = 100;
  const STORAGE_KEY = 'lucky_duck_classroom_names';

  const SAMPLE_STUDENTS = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia',
    'Lucas', 'Ava', 'Mason', 'Isabella', 'Ethan',
    'Mia', 'Oliver', 'Harper', 'James', 'Charlotte',
    'Benjamin', 'Amelia', 'Henry', 'Evelyn', 'Alexander'
  ];

  const DUCK_PALETTES = [
    { name: 'Classic Yellow', body: '#FFD23F', stroke: '#E89B00', wing: '#FFBF1F' },
    { name: 'Light Red', body: '#F87171', stroke: '#DC2626', wing: '#EF4444' },
    { name: 'Sky Blue', body: '#70D6FF', stroke: '#2BB0E6', wing: '#57CAFA' },
    { name: 'Mint Green', body: '#06D6A0', stroke: '#04A077', wing: '#05BF8F' },
    { name: 'Lavender', body: '#B79CED', stroke: '#8F66D6', wing: '#A685E6' },
    { name: 'Orange Sherbet', body: '#FF9F1C', stroke: '#D67600', wing: '#FF8E00' },
    { name: 'Lilac Berry', body: '#E0AAFF', stroke: '#B266E6', wing: '#D08BF7' },
    { name: 'Aqua Teal', body: '#48CAE4', stroke: '#0096C7', wing: '#00B4D8' },
    { name: 'Sunshine Gold', body: '#FFD166', stroke: '#F4A261', wing: '#FFBC42' },
    { name: 'Coral Pop', body: '#FF6B6B', stroke: '#D63031', wing: '#FF5252' }
  ];

  const ACCESSORIES = ['none', 'party-hat', 'crown', 'sunglasses', 'flower', 'bow-tie', 'propeller', 'star'];

  // ==========================================================================
  // 2. AUDIO SYNTHESIS (Web Audio API - 100% Offline & Firewall Safe)
  // ==========================================================================
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.musicGain = null;
      this.isMusicPlaying = false;
      this.musicLoopTimeout = null;

      // Hybrid Audio: MP3 file with Web Audio Synthesizer fallback
      this.mp3Audio = null;
      this.hasMp3 = false;
      this.initMp3();
    }

    initMp3() {
      try {
        this.mp3Audio = new Audio('race.mp3');
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
      if (!this.enabled) {
        this.stopRaceMusic();
      }
      return this.enabled;
    }

    playRaceMusic() {
      if (!this.enabled) return;
      this.init();

      this.isMusicPlaying = true;

      // 1. Try playing race.mp3 if available
      if (this.mp3Audio) {
        this.mp3Audio.currentTime = 0;
        this.mp3Audio.volume = 0.85;
        const playPromise = this.mp3Audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.hasMp3 = true;
          }).catch(err => {
            console.log('race.mp3 play prevented, using synth fallback:', err);
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
      // Pitch drop mimic quack formant
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

    // Play countdown tones
    playCountdown(step) {
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
        setTimeout(() => this.playQuack(), 120);
      }
    }

    // Play water splash / paddle sound
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

    // Play triumphant victory jingle
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
    // ARAM KHACHATURIAN: "SABRE DANCE" (SYNTHESIZER ORCHESTRA)
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
        // Measure 1
        G4, G4, G4, G4, Fs4, G4, Ab4, G4,
        // Measure 2
        Fs4, G4, Ab4, G4, Fs4, G4, Ab4, A4,
        // Measure 3
        Bb4, A4, Ab4, A4, Bb4, A4, Ab4, A4,
        // Measure 4 (Whimsical descending drop)
        D5, Cs5, D5, Eb5, D5, C5, Bb4, A4,
        // Measure 5
        G4, G4, G4, G4, Fs4, G4, Ab4, G4,
        // Measure 6
        Fs4, G4, Ab4, G4, Fs4, G4, Ab4, A4,
        // Measure 7 (Frantic chromatic chromatic climb!)
        Bb4, B4, C5, Cs5, D5, Eb5, E5, F5,
        // Measure 8 (Grand fanfare resolution!)
        Fs5, G5, G5, G5, D5, D5, Bb4, G4
      ];

      // Schedule Melody (Loud, sustained staccato notes with punchy presence)
      melody.forEach((freq, idx) => {
        const noteTime = startTime + idx * stepTime;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Alternating saw and square waves for vibrant orchestral xylophone/brass sound
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

      // Schedule Driving Timpani & Staccato Brass Rhythm (Quarter notes)
      const totalMeasures = 8;
      for (let m = 0; m < totalMeasures; m++) {
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = startTime + (m * 4 + beat) * (stepTime * 4);
          const beatDuration = stepTime * 4;

          // Timpani kick on beats 1 and 3 (deep orchestral pulse)
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

          // Staccato brass chords on beats 2 and 4 (G minor triad)
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

      // Loop after 64 steps (~5.6 seconds)
      const loopDurationMs = 64 * stepTime * 1000;
      this.musicLoopTimeout = setTimeout(() => {
        if (this.isMusicPlaying) {
          this.scheduleSabreDanceLoop();
        }
      }, loopDurationMs - 40);
    }
  }

  // ==========================================================================
  // 3. CONFETTI PARTICLE SYSTEM
  // ==========================================================================
  class ConfettiSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.active = false;
      this.animId = null;
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    start() {
      this.resize();
      this.active = true;
      this.particles = [];

      const colors = ['#FFD700', '#FF4D4D', '#4D96FF', '#6BCB77', '#FF70A6', '#FF9F1C', '#E0AAFF'];

      // Spawn 130 confetti pieces
      for (let i = 0; i < 130; i++) {
        this.particles.push({
          x: this.canvas.width * (0.2 + Math.random() * 0.6),
          y: this.canvas.height * 0.4 + (Math.random() * 100 - 50),
          vx: (Math.random() - 0.5) * 16,
          vy: -Math.random() * 14 - 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 9 + 6,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 10,
          shape: Math.random() > 0.3 ? 'rect' : 'circle',
          opacity: 1
        });
      }

      this.loop();
    }

    stop() {
      this.active = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    loop() {
      if (!this.active) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = 0;
      this.particles.forEach(p => {
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y < this.canvas.height + 30) {
          alive++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
          } else {
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          }
          this.ctx.restore();
        }
      });

      if (alive > 0) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.stop();
      }
    }
  }

  // ==========================================================================
  // 4. DUCK SPRITE & RACER OBJECT
  // ==========================================================================
  class DuckRacer {
    constructor(id, name, index, total) {
      this.id = id;
      this.name = name;
      this.index = index;

      // Visual styling
      const paletteIdx = Math.abs(this.hashCode(name)) % DUCK_PALETTES.length;
      this.palette = DUCK_PALETTES[paletteIdx];
      const accIdx = Math.abs(this.hashCode(name + '_acc')) % ACCESSORIES.length;
      this.accessory = ACCESSORIES[accIdx];

      // Physical attributes
      this.radius = 26; // collision & render size
      this.x = 80;
      this.y = 100;
      this.startX = 80;
      this.startY = 100;
      this.targetY = 100;

      this.speed = 0;
      this.baseSpeed = 1;
      this.turboTimer = 0;
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.08 + Math.random() * 0.04;
      this.bobHeight = 4 + Math.random() * 3;

      // Trailing ripples
      this.ripples = [];
      this.rank = index + 1;
      this.isWinner = false;
    }

    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    reset(startX, startY) {
      this.x = startX;
      this.y = startY;
      this.startX = startX;
      this.startY = startY;
      this.targetY = startY;
      this.speed = 0;
      this.turboTimer = 0;
      this.ripples = [];
      this.isWinner = false;
    }

    update(deltaFactor, isRacing, trackLength, durationSecs) {
      this.wobblePhase += this.wobbleSpeed;

      if (isRacing) {
        // Base racing pace scaled by user selected duration
        // Track race distance is roughly (finishLine - startLine)
        const targetSpeed = (trackLength / (durationSecs * 60)) * (0.85 + Math.random() * 0.35);

        // Random turbo paddle burst
        this.turboTimer -= 1;
        if (this.turboTimer <= 0) {
          if (Math.random() < 0.035) {
            this.turboTimer = Math.floor(40 + Math.random() * 60);
          }
        }

        const turboBoost = this.turboTimer > 0 ? 1.35 + Math.random() * 0.4 : 1.0;
        this.speed = targetSpeed * turboBoost;

        this.x += this.speed * deltaFactor;

        // Gentle natural lane wander
        this.y += (this.targetY - this.y) * 0.05 + Math.sin(this.wobblePhase * 0.5) * 0.6;

        // Generate wake ripples
        if (Math.random() < 0.35) {
          this.ripples.push({
            x: this.x - this.radius * 0.9,
            y: this.y + 4,
            r: 5,
            alpha: 0.6
          });
        }
      } else {
        // Idling float at start
        this.y = this.startY + Math.sin(this.wobblePhase) * 3;
      }

      // Update wake ripples
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i];
        rp.r += 0.8;
        rp.alpha -= 0.025;
        if (rp.alpha <= 0) {
          this.ripples.splice(i, 1);
        }
      }
    }

    draw(ctx, cameraX) {
      const renderX = this.x - cameraX;
      const renderY = this.y + Math.sin(this.wobblePhase) * this.bobHeight;

      // 1. Draw Wake Ripples Behind Duck
      this.ripples.forEach(rp => {
        const rx = rp.x - cameraX;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(rx, rp.y, rp.r * 1.5, rp.r * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, rp.alpha)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      ctx.save();
      ctx.translate(renderX, renderY);

      // Tilt slightly when bobbing
      const tilt = Math.cos(this.wobblePhase) * 0.08;
      ctx.rotate(tilt);

      // If winner, draw glowing victory halo
      if (this.isWinner) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }

      // Duck Shadow on water
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 14, this.radius * 1.05, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 50, 90, 0.18)';
      ctx.fill();
      ctx.restore();

      // Duck Body
      ctx.beginPath();
      ctx.ellipse(0, 2, this.radius * 0.95, this.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.body;
      ctx.fill();
      ctx.strokeStyle = this.palette.stroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Duck Tail
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.8, -2);
      ctx.quadraticCurveTo(-this.radius * 1.35, -14, -this.radius * 0.95, 4);
      ctx.closePath();
      ctx.fillStyle = this.palette.body;
      ctx.fill();
      ctx.strokeStyle = this.palette.stroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Duck Wing
      ctx.beginPath();
      ctx.ellipse(-4, 4, this.radius * 0.45, this.radius * 0.32, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.wing;
      ctx.fill();
      ctx.strokeStyle = this.palette.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Duck Head
      const headX = this.radius * 0.48;
      const headY = -this.radius * 0.52;
      const headR = this.radius * 0.52;
      ctx.beginPath();
      ctx.arc(headX, headY, headR, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.body;
      ctx.fill();
      ctx.strokeStyle = this.palette.stroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cute Cheerful Eye
      const eyeX = headX + headR * 0.35;
      const eyeY = headY - headR * 0.18;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      // Catchlight
      ctx.beginPath();
      ctx.arc(eyeX + 1.2, eyeY - 1.2, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Rosy Cheek
      ctx.beginPath();
      ctx.ellipse(headX + 2, headY + 5, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 105, 135, 0.55)';
      ctx.fill();

      // Cheerful Duck Beak
      ctx.beginPath();
      ctx.moveTo(headX + headR * 0.75, headY - 1);
      ctx.quadraticCurveTo(headX + headR + 13, headY + 3, headX + headR * 0.65, headY + 7);
      ctx.closePath();
      ctx.fillStyle = '#FF7B25';
      ctx.fill();
      ctx.strokeStyle = '#D35400';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Accessories
      this.drawAccessory(ctx, headX, headY, headR);

      ctx.restore();

      // 2. Student Name Tag Plaque (Floating above duck)
      this.drawNameBadge(ctx, renderX, renderY - this.radius - 12);
    }

    drawAccessory(ctx, hx, hy, hr) {
      if (this.accessory === 'party-hat') {
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - hr + 2);
        ctx.lineTo(hx + 3, hy - hr - 16);
        ctx.lineTo(hx + 10, hy - hr + 2);
        ctx.closePath();
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Pom pom
        ctx.beginPath();
        ctx.arc(hx + 3, hy - hr - 17, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
      } else if (this.accessory === 'crown') {
        ctx.beginPath();
        ctx.moveTo(hx - 8, hy - hr + 3);
        ctx.lineTo(hx - 10, hy - hr - 8);
        ctx.lineTo(hx - 3, hy - hr - 3);
        ctx.lineTo(hx + 2, hy - hr - 11);
        ctx.lineTo(hx + 7, hy - hr - 3);
        ctx.lineTo(hx + 12, hy - hr - 8);
        ctx.lineTo(hx + 10, hy - hr + 3);
        ctx.closePath();
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (this.accessory === 'sunglasses') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx + 1, hy - 4, 13, 6);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy - 2);
        ctx.lineTo(hx + 1, hy - 2);
        ctx.stroke();
      } else if (this.accessory === 'flower') {
        ctx.beginPath();
        ctx.arc(hx - 4, hy - hr + 3, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f43f5e';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx - 4, hy - hr + 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
      } else if (this.accessory === 'bow-tie') {
        const bx = 4;
        const by = 8;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 6, by - 4);
        ctx.lineTo(bx - 6, by + 4);
        ctx.closePath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 6, by - 4);
        ctx.lineTo(bx + 6, by + 4);
        ctx.closePath();
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      }
    }

    drawNameBadge(ctx, x, y) {
      ctx.save();
      ctx.font = this.isWinner ? '700 13px Fredoka, sans-serif' : '600 12px Fredoka, sans-serif';
      const textWidth = ctx.measureText(this.name).width;
      const crownWidth = this.isWinner ? 14 : 0;
      const padX = this.isWinner ? 10 : 8;
      const padY = 4;
      const badgeW = textWidth + crownWidth + padX * 2;
      const badgeH = this.isWinner ? 22 : 18;

      // Plaque background
      ctx.fillStyle = this.isWinner ? '#fef08a' : 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, badgeH / 2);
      ctx.fill();

      // Border matching duck or gold for winner
      ctx.strokeStyle = this.isWinner ? '#d97706' : this.palette.stroke;
      ctx.lineWidth = this.isWinner ? 2.5 : 1.8;
      ctx.stroke();

      // Shadow
      ctx.shadowColor = this.isWinner ? 'rgba(217, 119, 6, 0.4)' : 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = this.isWinner ? 8 : 4;

      // Text & Vector Crown
      if (this.isWinner) {
        // Draw tiny vector crown on the left side of the plaque
        const crownX = x - badgeW / 2 + padX + 5;
        const crownY = y;
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(crownX - 5, crownY + 4);
        ctx.lineTo(crownX - 6, crownY - 3);
        ctx.lineTo(crownX - 2, crownY);
        ctx.lineTo(crownX, crownY - 5);
        ctx.lineTo(crownX + 2, crownY);
        ctx.lineTo(crownX + 6, crownY - 3);
        ctx.lineTo(crownX + 5, crownY + 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, crownX + 8, y);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, x, y);
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // 5. MAIN APPLICATION CONTROLLER
  // ==========================================================================
  class DuckRaceApp {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('riverCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.confettiCanvas = document.getElementById('confettiCanvas');

      // Top bar & buttons
      this.appContainer = document.getElementById('appContainer');
      this.headerStudentCount = document.getElementById('headerStudentCount');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundOnSvg = document.getElementById('soundOnSvg');
      this.soundOffSvg = document.getElementById('soundOffSvg');
      this.soundText = document.getElementById('soundText');
      this.fullscreenBtn = document.getElementById('fullscreenBtn');
      this.fullscreenText = document.getElementById('fullscreenText');
      this.fullscreenExpandSvg = document.getElementById('fullscreenExpandSvg');
      this.fullscreenCompressSvg = document.getElementById('fullscreenCompressSvg');
      this.toggleDrawerBtn = document.getElementById('toggleDrawerBtn');
      this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
      this.bottomActionBar = document.getElementById('bottomActionBar');
      this.startRaceBtn = document.getElementById('startRaceBtn');
      this.resetRaceBtn = document.getElementById('resetRaceBtn');
      this.raceDurationSelect = document.getElementById('raceDurationSelect');

      // HUD & Status
      this.raceStatusPill = document.getElementById('raceStatusPill');
      this.raceStatusText = document.getElementById('raceStatusText');
      this.leaderChips = document.getElementById('leaderChips');
      this.countdownOverlay = document.getElementById('countdownOverlay');
      this.countdownText = document.getElementById('countdownText');

      // Teacher Drawer Elements
      this.teacherDrawer = document.getElementById('teacherDrawer');
      this.drawerBackdrop = document.getElementById('drawerBackdrop');
      this.drawerCountText = document.getElementById('drawerCountText');
      this.limitBarFill = document.getElementById('limitBarFill');
      this.singleNameInput = document.getElementById('singleNameInput');
      this.addSingleNameBtn = document.getElementById('addSingleNameBtn');
      this.bulkNamesTextarea = document.getElementById('bulkNamesTextarea');
      this.updateFromBulkBtn = document.getElementById('updateFromBulkBtn');
      this.loadSampleBtn = document.getElementById('loadSampleBtn');
      this.shuffleNamesBtn = document.getElementById('shuffleNamesBtn');
      this.clearAllNamesBtn = document.getElementById('clearAllNamesBtn');
      this.studentChipsContainer = document.getElementById('studentChipsContainer');
      this.activeRacersCount = document.getElementById('activeRacersCount');

      // Class Presets & File Sync Elements
      this.classPresetSelect = document.getElementById('classPresetSelect');
      this.deleteClassBtn = document.getElementById('deleteClassBtn');
      this.newPresetNameInput = document.getElementById('newPresetNameInput');
      this.savePresetBtn = document.getElementById('savePresetBtn');
      this.exportFileBtn = document.getElementById('exportFileBtn');
      this.importFileBtn = document.getElementById('importFileBtn');
      this.filePickerInput = document.getElementById('filePickerInput');
      this.presets = this.loadPresets();

      // Winner Modal
      this.winnerModalOverlay = document.getElementById('winnerModalOverlay');
      this.winnerNameDisplay = document.getElementById('winnerNameDisplay');
      this.modalCloseBtn = document.getElementById('modalCloseBtn');
      this.modalRemoveBtn = document.getElementById('modalRemoveBtn');

      // Toast
      this.toastContainer = document.getElementById('toastContainer');

      // Systems
      this.sound = new SoundEffects();
      this.confetti = new ConfettiSystem(this.confettiCanvas);

      // State
      this.students = []; // Array of names
      this.ducks = [];    // Array of DuckRacer instances
      this.state = 'IDLE'; // 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'
      this.winner = null;

      // Track dimensions
      this.trackLength = 3400; // Virtual width of the river
      this.startLineX = 180;
      this.finishLineX = this.trackLength - 380;
      this.cameraX = 0;
      this.targetCameraX = 0;

      // Scenery: Floating Lily Pads & River current lines
      this.scenery = [];
      this.initScenery();

      // Bind all event listeners
      this.bindEvents();

      // Handle Canvas Sizing
      this.resizeCanvas();
      window.addEventListener('resize', () => {
        this.resizeCanvas();
        this.confetti.resize();
      });

      // Load initial students (from localStorage or default sample)
      this.loadRoster();
      this.populatePresetDropdown();

      // Start Main Render Loop
      this.lastTime = performance.now();
      requestAnimationFrame(time => this.renderLoop(time));
    }

    // Initialize decorative scenery along the virtual river
    initScenery() {
      this.scenery = [];
      // Generate 28 lily pads along track
      for (let i = 0; i < 28; i++) {
        this.scenery.push({
          type: 'lily',
          x: 200 + Math.random() * (this.trackLength - 500),
          yRel: 0.15 + Math.random() * 0.7, // percentage of river height
          radius: 14 + Math.random() * 10,
          hasFlower: Math.random() > 0.4
        });
      }
    }

    resizeCanvas() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.viewportWidth = rect.width;
      this.viewportHeight = rect.height;

      // Re-position ducks in lanes if currently idle
      if (this.state === 'IDLE') {
        this.positionDucksAtStart();
      }
    }

    // ==========================================================================
    // DATA & ROSTER MANAGEMENT (Max 100 Students)
    // ==========================================================================
    loadRoster() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.students = parsed.slice(0, MAX_STUDENTS);
            this.syncRosterUI();
            return;
          }
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      // Default to sample students if empty
      this.students = [...SAMPLE_STUDENTS];
      this.saveRoster();
      this.syncRosterUI();
    }

    saveRoster() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.students));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }

    addStudent(name) {
      const cleanName = name.trim();
      if (!cleanName) return;

      if (this.students.length >= MAX_STUDENTS) {
        this.showToast(`Duck pen is full! Limit is ${MAX_STUDENTS} students.`, 'warn');
        return;
      }

      this.students.push(cleanName);
      this.saveRoster();
      this.syncRosterUI();
      this.showToast(`Added "${cleanName}" to the race.`, 'success');
      this.sound.playQuack();
    }

    removeStudent(index) {
      if (index >= 0 && index < this.students.length) {
        const removed = this.students.splice(index, 1)[0];
        this.saveRoster();
        this.syncRosterUI();
        this.showToast(`Removed "${removed}" from the list.`, 'info');
      }
    }

    removeStudentByName(name) {
      const idx = this.students.findIndex(s => s.toLowerCase() === name.toLowerCase());
      if (idx !== -1) {
        this.removeStudent(idx);
      }
    }

    setBulkNames(text) {
      const lines = text
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);

      if (lines.length === 0) {
        this.showToast('Please enter at least one name.', 'warn');
        return;
      }

      if (lines.length > MAX_STUDENTS) {
        this.showToast(`Capped at the first ${MAX_STUDENTS} students!`, 'warn');
        this.students = lines.slice(0, MAX_STUDENTS);
      } else {
        this.students = lines;
        this.showToast(`Updated duck roster with ${this.students.length} students!`, 'success');
      }

      this.saveRoster();
      this.syncRosterUI();
      this.closeDrawer();
    }

    syncRosterUI() {
      const count = this.students.length;
      this.headerStudentCount.textContent = count;
      this.drawerCountText.textContent = count;
      this.activeRacersCount.textContent = count;

      // Update limit bar fill percentage
      const pct = Math.min(100, (count / MAX_STUDENTS) * 100);
      this.limitBarFill.style.width = `${pct}%`;
      if (count >= MAX_STUDENTS) {
        this.limitBarFill.classList.add('maxed');
      } else {
        this.limitBarFill.classList.remove('maxed');
      }

      // Update Textarea with active list
      this.bulkNamesTextarea.value = this.students.join('\n');

      // Re-populate Student Chips in Teacher Drawer
      this.studentChipsContainer.innerHTML = '';
      this.students.forEach((name, idx) => {
        const chip = document.createElement('div');
        chip.className = 'student-chip';

        const palette = DUCK_PALETTES[Math.abs(this.hashCode(name)) % DUCK_PALETTES.length];

        chip.innerHTML = `
          <span class="chip-duck-dot" style="background:${palette.body};"></span>
          <span>${name}</span>
          <button class="chip-delete-btn" title="Remove student" data-index="${idx}">
            <svg viewBox="0 0 20 20" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round">
              <path d="M4 4l12 12M16 4L4 16"/>
            </svg>
          </button>
        `;
        this.studentChipsContainer.appendChild(chip);
      });

      // Bind delete clicks
      this.studentChipsContainer.querySelectorAll('.chip-delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const index = parseInt(e.currentTarget.dataset.index, 10);
          this.removeStudent(index);
        });
      });

      // Update Duck Entities on track
      this.rebuildDuckRacers();
    }

    rebuildDuckRacers() {
      this.ducks = this.students.map((name, idx) => new DuckRacer(idx, name, idx, this.students.length));
      this.positionDucksAtStart();
    }

    positionDucksAtStart() {
      if (!this.viewportHeight) return;

      const riverTop = 50;
      const riverBottom = this.viewportHeight - 50;
      const usableHeight = riverBottom - riverTop;

      const count = this.ducks.length;
      if (count === 0) return;

      // Single Starting Line: Every duck starts at the EXACT same X coordinate for 100% fairness
      // Positioned slightly before the starting line so users and kids can clearly see the start line!
      const startX = this.startLineX - 48;
      this.ducks.forEach((duck, idx) => {
        const startY = count === 1
          ? (riverTop + riverBottom) / 2
          : riverTop + 20 + (idx / (count - 1)) * (usableHeight - 40);
        duck.reset(startX, startY);
      });

      this.cameraX = 0;
      this.targetCameraX = 0;
    }

    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    // ==========================================================================
    // 6. RACE CONTROLS & STATE MACHINE
    // ==========================================================================
    startRace() {
      if (this.students.length === 0) {
        this.showToast('Please add at least 1 student name in the list!', 'warn');
        this.openDrawer();
        return;
      }

      if (this.state === 'COUNTDOWN' || this.state === 'RACING') {
        return;
      }

      this.sound.init();
      if (this.sound.mp3Audio) {
        this.sound.mp3Audio.load();
      }
      this.state = 'COUNTDOWN';
      this.winner = null;
      this.startRaceBtn.disabled = true;
      if (this.bottomActionBar) {
        this.bottomActionBar.classList.add('hidden');
      }

      this.updateStatusPill('Starting Race...', 'racing');
      this.positionDucksAtStart();

      // Countdown sequence: 3 -> 2 -> 1 -> GO!
      this.countdownOverlay.classList.add('show');
      let count = 3;
      this.countdownText.textContent = count;
      this.sound.playCountdown(count);

      const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
          this.countdownText.textContent = count;
          this.sound.playCountdown(count);
        } else if (count === 0) {
          this.countdownText.textContent = 'QUACK!';
          this.sound.playCountdown('go');
        } else {
          clearInterval(countInterval);
          this.countdownOverlay.classList.remove('show');
          this.beginRacing();
        }
      }, 950);
    }

    beginRacing() {
      this.state = 'RACING';
      this.updateStatusPill('Race in Progress!', 'racing');

      // Play in-race music (Hybrid: race.mp3 if present, else synthesized Sabre Dance!)
      this.sound.playRaceMusic();

      // Random splash sound effects during race
      this.splashTimer = setInterval(() => {
        if (this.state === 'RACING') {
          this.sound.playSplash();
        } else {
          clearInterval(this.splashTimer);
        }
      }, 1500);
    }

    finishRace(winningDuck) {
      if (this.state === 'FINISHED') return;
      this.state = 'FINISHED';
      this.winner = winningDuck;
      winningDuck.isWinner = true;
      this.startRaceBtn.disabled = false;
      this.updateStatusPill(`${winningDuck.name} Crossed First!`, 'racing');

      // Stop in-race music and play victory fanfare
      this.sound.stopRaceMusic();
      this.sound.playVictory();

      // Announce crossing so classroom can see who won on the track
      this.showToast(`${winningDuck.name} crossed the finish line first!`, 'success');

      // 2.2-second suspense delay: lets students physically watch the winner cross the finish ribbon
      setTimeout(() => {
        this.showWinnerModal(winningDuck);
      }, 2200);
    }

    resetRace() {
      this.state = 'IDLE';
      this.winner = null;
      this.sound.stopRaceMusic();
      this.startRaceBtn.disabled = false;
      if (this.bottomActionBar) {
        this.bottomActionBar.classList.remove('hidden');
      }
      this.countdownOverlay.classList.remove('show');
      this.positionDucksAtStart();
      this.updateStatusPill('Ready to Race!', 'idle');
      this.showToast('Ducks reset to the starting line.', 'info');
    }

    updateStatusPill(text, mode) {
      if (this.raceStatusText) this.raceStatusText.textContent = text;
      if (this.raceStatusPill) {
        if (mode === 'racing') {
          this.raceStatusPill.classList.add('racing');
        } else {
          this.raceStatusPill.classList.remove('racing');
        }
      }
    }

    // ==========================================================================
    // 7. WINNER MODAL ACTIONS (CLOSE & REMOVE)
    // ==========================================================================
    showWinnerModal(winnerDuck) {
      this.winnerNameDisplay.textContent = winnerDuck.name;

      // Dynamically match celebration modal duck colors with the winning duck's actual palette!
      const p = winnerDuck.palette;
      const bodyEl = document.getElementById('modalDuckBody');
      const tailEl = document.getElementById('modalDuckTail');
      const headEl = document.getElementById('modalDuckHead');
      const wingEl = document.getElementById('modalDuckWing');
      if (bodyEl) { bodyEl.setAttribute('fill', p.body); bodyEl.setAttribute('stroke', p.stroke); }
      if (tailEl) { tailEl.setAttribute('fill', p.body); tailEl.setAttribute('stroke', p.stroke); }
      if (headEl) { headEl.setAttribute('fill', p.body); headEl.setAttribute('stroke', p.stroke); }
      if (wingEl) { wingEl.setAttribute('fill', p.wing); wingEl.setAttribute('stroke', p.stroke); }

      this.winnerModalOverlay.classList.add('active');
      this.confetti.start();
      if (this.bottomActionBar) {
        this.bottomActionBar.classList.remove('hidden');
      }
    }

    closeWinnerModal() {
      this.winnerModalOverlay.classList.remove('active');
      this.confetti.stop();
      this.resetRace();
      this.showToast(`Kept "${this.winner ? this.winner.name : 'student'}" in the race roster.`, 'info');
    }

    removeWinnerAndClose() {
      if (!this.winner) {
        this.closeWinnerModal();
        return;
      }

      const winnerName = this.winner.name;
      this.winnerModalOverlay.classList.remove('active');
      this.confetti.stop();

      // Remove winner from roster list
      this.removeStudentByName(winnerName);
      this.resetRace();
      this.showToast(`"${winnerName}" was removed from the list.`, 'success');
    }

    // ==========================================================================
    // 8. RENDER LOOP & RIVER TRACK ENGINE
    // ==========================================================================
    renderLoop(currentTime) {
      const delta = Math.min(32, currentTime - this.lastTime);
      const deltaFactor = delta / 16.666;
      this.lastTime = currentTime;

      const durationSecs = parseFloat(this.raceDurationSelect.value) || 8;

      // 1. Update Ducks Physics
      let leadingDuck = null;
      let maxDist = -Infinity;

      this.ducks.forEach(duck => {
        duck.update(deltaFactor, this.state === 'RACING', this.trackLength, durationSecs);

        if (duck.x > maxDist) {
          maxDist = duck.x;
          leadingDuck = duck;
        }

        // Check Winner Crossing
        if (this.state === 'RACING' && duck.x + duck.radius >= this.finishLineX) {
          this.finishRace(duck);
        }
      });

      // 2. Camera Tracking
      if (leadingDuck && (this.state === 'RACING' || this.state === 'FINISHED')) {
        // Track the leader, centered slightly toward the left of screen for forward view
        const desiredCamX = leadingDuck.x - this.viewportWidth * 0.45;
        this.targetCameraX = Math.max(0, Math.min(this.trackLength - this.viewportWidth, desiredCamX));
      } else {
        this.targetCameraX = 0;
      }
      this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;

      // 3. Update Mini Leaderboard HUD
      this.updateLeaderboardHUD();

      // 4. Draw River Scene
      this.drawRiverScene();

      requestAnimationFrame(time => this.renderLoop(time));
    }

    updateLeaderboardHUD() {
      if (!this.leaderChips) return;
      if (this.ducks.length === 0) {
        this.leaderChips.innerHTML = '<span class="leader-placeholder">No ducks in the water...</span>';
        return;
      }

      // Sort top 3
      const sorted = [...this.ducks].sort((a, b) => b.x - a.x).slice(0, 3);

      this.leaderChips.innerHTML = sorted.map((d, i) => `
        <span class="leader-pill ${i === 0 ? 'leader-rank-1' : ''}">
          <span class="rank-num rank-${i + 1}">#${i + 1}</span>
          <span>${d.name}</span>
        </span>
      `).join('');
    }

    drawRiverScene() {
      const ctx = this.ctx;
      const w = this.viewportWidth;
      const h = this.viewportHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. River Water Gradient Background
      const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(0.5, '#0ea5e9');
      waterGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. River Current Waves
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2.5;
      const waveOffset = (performance.now() * 0.06) % 120;

      for (let y = 60; y < h - 50; y += 45) {
        ctx.beginPath();
        for (let x = -100; x < w + 100; x += 80) {
          const waveX = x - waveOffset;
          ctx.quadraticCurveTo(waveX + 20, y - 5, waveX + 40, y);
          ctx.quadraticCurveTo(waveX + 60, y + 5, waveX + 80, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 3. Floating Scenery (Lily Pads)
      this.drawScenery(ctx);

      // 4. Start Line
      this.drawStartLine(ctx);

      // 5. Finish Line Checkered Banner & Floating Buoys
      this.drawFinishLine(ctx);

      // 6. River Banks (Photoshop Layer 2: Underneath the ducks & name tags!)
      this.drawRiverBanks(ctx);

      // 7. Draw Ducks & Student Name Badges (Photoshop Layer 3: On top of river banks!)
      const sortedDucks = [...this.ducks].sort((a, b) => a.y - b.y);
      sortedDucks.forEach(duck => duck.draw(ctx, this.cameraX));
    }

    drawRiverBanks(ctx) {
      const w = this.viewportWidth;
      const h = this.viewportHeight;
      const bankH = 36;

      ctx.save();
      // Top Grass Bank
      const topGrad = ctx.createLinearGradient(0, 0, 0, bankH);
      topGrad.addColorStop(0, '#15803d');
      topGrad.addColorStop(0.7, '#22c55e');
      topGrad.addColorStop(1, '#166534');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, bankH);

      // Top Soil Edge
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, bankH - 3, w, 3);

      // Bottom Grass Bank
      const bottomGrad = ctx.createLinearGradient(0, h - bankH, 0, h);
      bottomGrad.addColorStop(0, '#166534');
      bottomGrad.addColorStop(0.3, '#22c55e');
      bottomGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, h - bankH, w, bankH);

      // Bottom Soil Edge
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, h - bankH, w, 3);

      // Cheerful Daisy Flowers along banks
      ctx.fillStyle = '#fef08a';
      for (let x = 25; x < w; x += 55) {
        ctx.beginPath();
        ctx.arc(x, 18 + Math.sin(x * 0.05) * 5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 22, h - 18 + Math.cos(x * 0.05) * 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawScenery(ctx) {
      this.scenery.forEach(pad => {
        const renderX = pad.x - this.cameraX;
        const renderY = pad.yRel * this.viewportHeight;

        // Skip if outside viewport
        if (renderX < -50 || renderX > this.viewportWidth + 50) return;

        ctx.save();
        ctx.translate(renderX, renderY);

        // Lily Pad
        ctx.beginPath();
        ctx.arc(0, 0, pad.radius, 0.25, Math.PI * 1.85);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = '#15803d';
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lotus Flower
        if (pad.hasFlower) {
          ctx.beginPath();
          ctx.arc(2, -2, pad.radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = '#f472b6';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(2, -2, pad.radius * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        }

        ctx.restore();
      });
    }

    drawStartLine(ctx) {
      const renderX = this.startLineX - this.cameraX;
      if (renderX < -40 || renderX > this.viewportWidth + 40) return;

      ctx.save();
      // Dashed Buoy Line
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(renderX, 40);
      ctx.lineTo(renderX, this.viewportHeight - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Buoy
      ctx.beginPath();
      ctx.arc(renderX, 48, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bottom Buoy
      ctx.beginPath();
      ctx.arc(renderX, this.viewportHeight - 48, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Start text label
      ctx.font = '700 13px Fredoka, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('START', renderX, 74);

      ctx.restore();
    }

    drawFinishLine(ctx) {
      const renderX = this.finishLineX - this.cameraX;
      if (renderX < -60 || renderX > this.viewportWidth + 60) return;

      const h = this.viewportHeight;

      ctx.save();
      // Checkered Pattern Finish Ribbon
      const squareSize = 16;
      const numSquares = Math.ceil((h - 80) / squareSize);

      for (let i = 0; i < numSquares; i++) {
        const y = 40 + i * squareSize;
        // Two columns of squares
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1e293b';
        ctx.fillRect(renderX - 8, y, 8, squareSize);

        ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#ffffff';
        ctx.fillRect(renderX, y, 8, squareSize);
      }

      // Finish Ribbon Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(renderX - 8, 40, 16, numSquares * squareSize);

      // Finish Banner Posts
      ctx.fillStyle = '#d97706';
      ctx.fillRect(renderX - 12, 30, 24, 14);
      ctx.fillRect(renderX - 12, h - 44, 24, 14);

      // Floating celebratory text
      ctx.font = '700 14px Fredoka, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText('FINISH LINE', renderX, 24);

      ctx.restore();
    }

    // ==========================================================================
    // 9. EVENT BINDINGS & TOASTS
    // ==========================================================================
    bindEvents() {
      // Race Trigger
      this.startRaceBtn.addEventListener('click', () => this.startRace());
      this.resetRaceBtn.addEventListener('click', () => this.resetRace());

      // Sound Toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const on = this.sound.toggle();
        if (this.soundOnSvg) this.soundOnSvg.style.display = on ? 'inline' : 'none';
        if (this.soundOffSvg) this.soundOffSvg.style.display = on ? 'none' : 'inline';
        this.soundText.textContent = on ? 'Sound ON' : 'Sound OFF';
        this.showToast(on ? 'Sound effects enabled.' : 'Sound muted.', 'info');
      });

      // Fullscreen Toggle
      this.fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });

      // Listen for Fullscreen State Changes
      const onFsChange = () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (this.fullscreenText) {
          this.fullscreenText.textContent = isFs ? 'Exit Full Screen' : 'Full Screen';
        }
        if (this.fullscreenExpandSvg) this.fullscreenExpandSvg.style.display = isFs ? 'none' : 'inline';
        if (this.fullscreenCompressSvg) this.fullscreenCompressSvg.style.display = isFs ? 'inline' : 'none';
        this.resizeCanvas();
      };
      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);
      document.addEventListener('mozfullscreenchange', onFsChange);
      document.addEventListener('MSFullscreenChange', onFsChange);

      // Teacher Desk Drawer
      this.toggleDrawerBtn.addEventListener('click', () => this.openDrawer());
      this.closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
      this.drawerBackdrop.addEventListener('click', () => this.closeDrawer());

      // Single Name Form
      this.addSingleNameBtn.addEventListener('click', () => {
        this.addStudent(this.singleNameInput.value);
        this.singleNameInput.value = '';
        this.singleNameInput.focus();
      });

      this.singleNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.addStudent(this.singleNameInput.value);
          this.singleNameInput.value = '';
        }
      });

      // Bulk Names Update
      this.updateFromBulkBtn.addEventListener('click', () => {
        this.setBulkNames(this.bulkNamesTextarea.value);
      });

      // Helper Buttons
      this.loadSampleBtn.addEventListener('click', () => {
        this.students = [...SAMPLE_STUDENTS];
        this.saveRoster();
        this.syncRosterUI();
        this.showToast('Loaded sample class of 20 students.', 'success');
      });

      this.shuffleNamesBtn.addEventListener('click', () => {
        for (let i = this.students.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.students[i], this.students[j]] = [this.students[j], this.students[i]];
        }
        this.saveRoster();
        this.syncRosterUI();
        this.showToast('Ducks shuffled into new starting lanes.', 'info');
      });

      this.clearAllNamesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all student names?')) {
          this.students = [];
          this.saveRoster();
          this.syncRosterUI();
          this.showToast('Student list cleared.', 'warn');
        }
      });

      // Class Presets & File Sync Bindings
      if (this.classPresetSelect) {
        this.classPresetSelect.addEventListener('change', () => {
          this.loadSelectedPreset(this.classPresetSelect.value);
        });
      }

      if (this.savePresetBtn) {
        this.savePresetBtn.addEventListener('click', () => {
          const name = this.newPresetNameInput.value.trim();
          if (!name) {
            this.showToast('Please enter a name for the class preset.', 'warn');
            return;
          }
          this.saveCurrentPreset(name);
          this.newPresetNameInput.value = '';
        });
      }

      if (this.deleteClassBtn) {
        this.deleteClassBtn.addEventListener('click', () => {
          this.deleteSelectedPreset();
        });
      }

      if (this.exportFileBtn) {
        this.exportFileBtn.addEventListener('click', () => {
          this.exportToFile();
        });
      }

      if (this.importFileBtn) {
        this.importFileBtn.addEventListener('click', () => {
          this.filePickerInput.click();
        });
      }

      if (this.filePickerInput) {
        this.filePickerInput.addEventListener('change', e => {
          const file = e.target.files[0];
          if (file) {
            this.importFromFile(file);
            this.filePickerInput.value = '';
          }
        });
      }

      // Modal Actions
      this.modalCloseBtn.addEventListener('click', () => this.closeWinnerModal());
      this.modalRemoveBtn.addEventListener('click', () => this.removeWinnerAndClose());
    }

    // ==========================================================================
    // FULLSCREEN HANDLERS
    // ==========================================================================
    toggleFullscreen() {
      const doc = document;
      const el = document.documentElement;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

      if (!isFs) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) {
          req.call(el).catch(err => {
            console.warn('Native fullscreen request blocked:', err);
            this.toggleWindowFallbackFullscreen();
          });
        } else {
          this.toggleWindowFallbackFullscreen();
        }
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(doc).catch(err => {
            console.warn('Exit fullscreen blocked:', err);
          });
        }
      }
    }

    toggleWindowFallbackFullscreen() {
      const app = this.appContainer || document.body;
      app.classList.toggle('pseudo-fullscreen');
      const isPseudo = app.classList.contains('pseudo-fullscreen');
      if (this.fullscreenText) {
        this.fullscreenText.textContent = isPseudo ? 'Exit Full Screen' : 'Full Screen';
      }
      if (this.fullscreenExpandSvg) this.fullscreenExpandSvg.style.display = isPseudo ? 'none' : 'inline';
      if (this.fullscreenCompressSvg) this.fullscreenCompressSvg.style.display = isPseudo ? 'inline' : 'none';
      this.resizeCanvas();
    }

    // ==========================================================================
    // CLASS PRESETS & FILE BACKUP MANAGEMENT
    // ==========================================================================
    loadPresets() {
      try {
        const saved = localStorage.getItem('lucky_duck_classroom_presets');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Error loading presets:', e);
      }
      return { 'Default Class': [...SAMPLE_STUDENTS] };
    }

    savePresets() {
      try {
        localStorage.setItem('lucky_duck_classroom_presets', JSON.stringify(this.presets));
      } catch (e) {
        console.warn('Error saving presets:', e);
      }
    }

    populatePresetDropdown(selectedKey = null) {
      if (!this.classPresetSelect) return;
      this.classPresetSelect.innerHTML = '';
      const keys = Object.keys(this.presets);
      keys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${k} (${this.presets[k].length} students)`;
        this.classPresetSelect.appendChild(opt);
      });

      if (selectedKey && this.presets[selectedKey]) {
        this.classPresetSelect.value = selectedKey;
      }
    }

    saveCurrentPreset(name) {
      if (this.students.length === 0) {
        this.showToast('Please add student names before saving a class.', 'warn');
        return;
      }
      this.presets[name] = [...this.students];
      this.savePresets();
      this.populatePresetDropdown(name);
      this.showToast(`Saved class "${name}" (${this.students.length} students).`, 'success');
    }

    loadSelectedPreset(name) {
      if (this.presets[name]) {
        this.students = [...this.presets[name]];
        this.saveRoster();
        this.syncRosterUI();
        this.showToast(`Loaded class "${name}".`, 'info');
      }
    }

    deleteSelectedPreset() {
      const selected = this.classPresetSelect.value;
      const keys = Object.keys(this.presets);
      if (keys.length <= 1) {
        this.showToast('You must have at least one saved class.', 'warn');
        return;
      }
      if (confirm(`Delete saved class "${selected}"?`)) {
        delete this.presets[selected];
        this.savePresets();
        const nextKey = Object.keys(this.presets)[0];
        this.populatePresetDropdown(nextKey);
        this.loadSelectedPreset(nextKey);
        this.showToast(`Deleted class "${selected}".`, 'info');
      }
    }

    exportToFile() {
      if (this.students.length === 0) {
        this.showToast('No students to export.', 'warn');
        return;
      }
      const text = this.students.join('\r\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const currentName = this.classPresetSelect.value || 'duck-race-class';
      a.download = `${currentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-list.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('Class list exported to .txt file.', 'success');
    }

    importFromFile(file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target.result;
        this.setBulkNames(content);
        const presetName = file.name.replace(/\.[^/.]+$/, '').slice(0, 30);
        this.presets[presetName] = [...this.students];
        this.savePresets();
        this.populatePresetDropdown(presetName);
        this.showToast(`Imported "${file.name}" (${this.students.length} students).`, 'success');
      };
      reader.readAsText(file);
    }

    openDrawer() {
      this.teacherDrawer.classList.add('open');
      this.drawerBackdrop.classList.add('open');
    }

    closeDrawer() {
      this.teacherDrawer.classList.remove('open');
      this.drawerBackdrop.classList.remove('open');
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast-message ${type === 'success' ? 'toast-success' : type === 'warn' ? 'toast-warn' : ''}`;
      toast.textContent = message;
      this.toastContainer.appendChild(toast);

      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 3000);
    }
  }

  // Initialize Application on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    window.duckRaceApp = new DuckRaceApp();
  });
})();
