/**
 * Random Name Picker Platform
 * Game Module: HorseRaceGame (Concrete Implementation of BaseGame)
 * 
 * Implements the Turf Derby Championship track, white rail fences, furlong poles,
 * finish banner collision, camera tracking, and registration with GameRegistry.
 */

(function () {
  'use strict';

  class HorseRaceGame extends BaseGame {
    constructor(id = 'horse-race', name = 'Horse Derby Race', metadata = {}) {
      super(id, name, metadata);

      this.trackLength = 3600; // Virtual width of the turf course
      this.startLineX = 180;
      this.finishLineX = this.trackLength - 380;
      this.cameraX = 0;
      this.targetCameraX = 0;
      this.viewportWidth = 1000;
      this.viewportHeight = 600;

      this.horses = [];
      this.furlongPoles = [];
      this.initTrackFeatures();
      this.durationSecs = 8;
      this.hoofbeatTimer = 0;
    }

    init(canvas, appShell) {
      super.init(canvas, appShell);
      this.resize(canvas.width, canvas.height);
      this.initTrackFeatures();
    }

    initTrackFeatures() {
      this.furlongPoles = [];
      // Furlong markers along the track
      for (let x = 600; x < this.trackLength - 500; x += 650) {
        this.furlongPoles.push({ x });
      }
    }

    setParticipants(names) {
      super.setParticipants(names);
      this.horses = names.map((name, idx) => new HorseRacer(idx, name, idx, names.length));
      this.positionHorsesAtStart();
    }

    positionHorsesAtStart() {
      if (!this.viewportHeight) return;

      const trackTop = 55;
      const trackBottom = this.viewportHeight - 55;
      const usableHeight = trackBottom - trackTop;
      const count = this.horses.length;
      if (count === 0) return;

      const startX = this.startLineX - 48;
      this.horses.forEach((horse, idx) => {
        const startY = count === 1
          ? (trackTop + trackBottom) / 2
          : trackTop + 24 + (idx / (count - 1)) * (usableHeight - 48);
        horse.reset(startX, startY);
      });

      this.cameraX = 0;
      this.targetCameraX = 0;
    }

    startRace(durationSecs = 8) {
      super.startRace(durationSecs);
      this.durationSecs = durationSecs;
      this.positionHorsesAtStart();
    }

    reset() {
      super.reset();
      this.positionHorsesAtStart();
    }

    resize(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      if (!this.isRacing && !this.winner) {
        this.positionHorsesAtStart();
      }
    }

    update(timestamp, delta, deltaFactor) {
      let leadingHorse = null;
      let maxDist = -Infinity;

      this.horses.forEach(horse => {
        horse.update(deltaFactor, this.isRacing, this.trackLength, this.durationSecs);

        if (horse.x > maxDist) {
          maxDist = horse.x;
          leadingHorse = horse;
        }

        // Check Winner Crossing
        if (this.isRacing && !this.winner && horse.x + horse.radius >= this.finishLineX) {
          horse.isWinner = true;
          this.triggerFinished(horse);
        }
      });

      // Camera Tracking
      if (leadingHorse && (this.isRacing || this.winner)) {
        const desiredCamX = leadingHorse.x - this.viewportWidth * 0.45;
        this.targetCameraX = Math.max(0, Math.min(this.trackLength - this.viewportWidth, desiredCamX));
      } else {
        this.targetCameraX = 0;
      }
      this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;

      // Galloping Hoofbeat Audio Trigger
      if (this.isRacing && this.app && this.app.sound) {
        this.hoofbeatTimer += delta;
        if (this.hoofbeatTimer > 160) {
          this.hoofbeatTimer = 0;
          if (typeof this.app.sound.playGallop === 'function') {
            this.app.sound.playGallop();
          }
        }
      }
    }

    render(ctx, width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      const w = width;
      const h = height;

      ctx.clearRect(0, 0, w, h);

      // 1. Manicured Turf Grass Track with Alternating Mowed Stripes
      this.drawTurfCourse(ctx, w, h);

      // 2. Furlong Distance Marker Poles
      this.drawFurlongPoles(ctx);

      // 3. Starting Line & Barrier Gates
      this.drawStartGates(ctx);

      // 4. Checkered Finish Line Banner
      this.drawFinishLine(ctx);

      // 5. White Racetrack Rail Fences
      this.drawTrackRails(ctx, w, h);

      // 6. Draw Horses & Student Name Badges (sorted vertically for depth)
      const sortedHorses = [...this.horses].sort((a, b) => a.y - b.y);
      sortedHorses.forEach(horse => horse.draw(ctx, this.cameraX));
    }

    drawTurfCourse(ctx, w, h) {
      // Base emerald turf gradient
      const turfGrad = ctx.createLinearGradient(0, 0, 0, h);
      turfGrad.addColorStop(0, '#15803D');
      turfGrad.addColorStop(0.5, '#16A34A');
      turfGrad.addColorStop(1, '#15803D');
      ctx.fillStyle = turfGrad;
      ctx.fillRect(0, 0, w, h);

      // Alternating mowed lawn stripes (horizontal turf bands)
      ctx.save();
      const stripeHeight = 44;
      const numStripes = Math.ceil(h / stripeHeight);
      for (let i = 0; i < numStripes; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(0, i * stripeHeight, w, stripeHeight);
        }
      }
      ctx.restore();
    }

    drawTrackRails(ctx, w, h) {
      ctx.save();
      const railH = 14;
      const postSpacing = 64;
      const postOffset = (this.cameraX % postSpacing);

      // Top White Rail Fence
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;

      // Top horizontal rail bars
      ctx.fillRect(0, 24, w, 5);
      ctx.fillRect(0, 32, w, 5);

      // Top fence vertical posts
      for (let x = -postOffset; x < w + postSpacing; x += postSpacing) {
        ctx.fillRect(x - 3, 18, 6, 22);
        ctx.strokeRect(x - 3, 18, 6, 22);
      }

      // Bottom White Rail Fence
      const botY = h - 42;
      ctx.fillRect(0, botY + 8, w, 5);
      ctx.fillRect(0, botY + 16, w, 5);

      // Bottom fence vertical posts
      for (let x = -postOffset; x < w + postSpacing; x += postSpacing) {
        ctx.fillRect(x - 3, botY + 2, 6, 22);
        ctx.strokeRect(x - 3, botY + 2, 6, 22);
      }

      ctx.restore();
    }

    drawFurlongPoles(ctx) {
      this.furlongPoles.forEach(pole => {
        const renderX = pole.x - this.cameraX;
        if (renderX < -40 || renderX > this.viewportWidth + 40) return;

        ctx.save();
        // Red and White striped distance pole
        const poleH = 46;
        const poleY = 12;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(renderX - 4, poleY, 8, poleH);

        ctx.fillStyle = '#DC2626';
        ctx.fillRect(renderX - 4, poleY + 10, 8, 12);
        ctx.fillRect(renderX - 4, poleY + 32, 8, 12);

        // Circular Crown Topper
        ctx.beginPath();
        ctx.arc(renderX, poleY - 4, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });
    }

    drawStartGates(ctx) {
      const renderX = this.startLineX - this.cameraX;
      if (renderX < -40 || renderX > this.viewportWidth + 40) return;

      ctx.save();
      // Dashed Starting Chalk Line
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(renderX, 42);
      ctx.lineTo(renderX, this.viewportHeight - 42);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Gate Post
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(renderX - 6, 36, 12, 16);
      ctx.beginPath();
      ctx.arc(renderX, 36, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Bottom Gate Post
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(renderX - 6, this.viewportHeight - 52, 12, 16);
      ctx.beginPath();
      ctx.arc(renderX, this.viewportHeight - 36, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // START text label
      ctx.font = '700 13px Fredoka, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('START', renderX, 68);

      ctx.restore();
    }

    drawFinishLine(ctx) {
      const renderX = this.finishLineX - this.cameraX;
      if (renderX < -60 || renderX > this.viewportWidth + 60) return;

      const h = this.viewportHeight;

      ctx.save();
      // Checkered Pattern Finish Ribbon
      const squareSize = 16;
      const numSquares = Math.ceil((h - 84) / squareSize);

      for (let i = 0; i < numSquares; i++) {
        const y = 42 + i * squareSize;
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#0F172A';
        ctx.fillRect(renderX - 8, y, 8, squareSize);

        ctx.fillStyle = i % 2 === 0 ? '#0F172A' : '#FFFFFF';
        ctx.fillRect(renderX, y, 8, squareSize);
      }

      // Finish Ribbon Border
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.strokeRect(renderX - 8, 42, 16, numSquares * squareSize);

      // Gold Banner Posts
      ctx.fillStyle = '#D97706';
      ctx.fillRect(renderX - 12, 28, 24, 16);
      ctx.fillRect(renderX - 12, h - 48, 24, 16);

      // Celebratory text
      ctx.font = '700 14px Fredoka, sans-serif';
      ctx.fillStyle = '#FEF08A';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText('PHOTO FINISH', renderX, 22);

      ctx.restore();
    }

    getLeaderboard() {
      if (this.horses.length === 0) return [];
      return [...this.horses].sort((a, b) => b.x - a.x).slice(0, 3);
    }

    renderWinnerAvatar(winner) {
      // Mount Champion Horse Avatar in Winner Modal
      const container = document.getElementById('modalAvatarContainer');
      if (!container) return;

      const coat = winner && winner.coat ? winner.coat : { body: '#78350F', mane: '#1C1917' };
      const silks = winner && winner.silks ? winner.silks : { primary: '#2563EB', secondary: '#FFFFFF' };
      const number = winner && winner.saddleNumber ? winner.saddleNumber : 1;

      container.innerHTML = `
        <div class="winner-horse-illustration" style="position:relative; width:130px; height:120px; margin:0 auto;">
          <svg viewBox="0 0 140 120" width="130" height="110" fill="none">
            <!-- Laurel Victory Wreath (Zero Emoji) -->
            <path d="M 25,60 C 15,30 45,12 70,12 C 95,12 125,30 115,60 C 110,80 85,96 70,96 C 55,96 30,80 25,60 Z" stroke="#EAB308" stroke-width="4" stroke-dasharray="6,4" fill="none"/>
            
            <!-- Horse Body / Neck & Head -->
            <path d="M 38,82 C 40,65 52,50 68,48 L 78,28 L 94,34 L 88,48 C 96,56 98,72 88,82 Z" fill="${coat.body}" stroke="${coat.dark || '#451A03'}" stroke-width="2.5" stroke-linejoin="round"/>
            
            <!-- Horse Muzzle & Nose -->
            <ellipse cx="94" cy="38" rx="8" ry="6" fill="${coat.dark || '#451A03'}"/>
            
            <!-- Big Cute Friendly Eye -->
            <circle cx="82" cy="36" r="4.5" fill="#0F172A"/>
            <circle cx="83.5" cy="34.5" r="1.8" fill="#FFFFFF"/>
            
            <!-- Pointy Ears -->
            <path d="M 72,28 L 70,16 L 76,26 Z" fill="${coat.body}" stroke="${coat.dark || '#451A03'}" stroke-width="2"/>
            <path d="M 76,28 L 76,14 L 82,26 Z" fill="${coat.body}" stroke="${coat.dark || '#451A03'}" stroke-width="2"/>
            
            <!-- Flowing Mane -->
            <path d="M 66,32 C 60,38 58,52 52,62 L 62,56 C 68,48 70,38 66,32 Z" fill="${coat.mane}"/>
          </svg>
        </div>
      `;
    }
  }

  // Register with central GameRegistry
  if (window.gameRegistry) {
    window.gameRegistry.register('horse-race', HorseRaceGame, {
      name: 'Horse Derby Race',
      description: 'Thrilling turf track derby with realistic galloping animation',
      themeColor: '#16A34A',
      icon: 'horse',
      isAvailable: true
    });
  }

  // Export
  window.HorseRaceGame = HorseRaceGame;
})();
