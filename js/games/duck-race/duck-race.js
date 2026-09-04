/**
 * Lucky Duck Race / Random Name Picker Platform
 * Game Module: DuckRaceGame (Concrete Implementation of BaseGame)
 * 
 * Implements the River Duck Race simulation, river rendering, floating lily pads,
 * finish ribbon collision, camera tracking, and registration with GameRegistry.
 */

(function () {
  'use strict';

  class DuckRaceGame extends BaseGame {
    constructor(id = 'duck-race', name = 'Lucky Duck Race', metadata = {}) {
      super(id, name, metadata);

      this.trackLength = 3400; // Virtual width of the river
      this.startLineX = 180;
      this.finishLineX = this.trackLength - 380;
      this.cameraX = 0;
      this.targetCameraX = 0;
      this.viewportWidth = 1000;
      this.viewportHeight = 600;

      this.ducks = [];
      this.scenery = [];
      this.initScenery();
      this.durationSecs = 8;
    }

    init(canvas, appShell) {
      super.init(canvas, appShell);
      this.resize(canvas.width, canvas.height);
      this.initScenery();
    }

    initScenery() {
      this.scenery = [];
      for (let i = 0; i < 28; i++) {
        this.scenery.push({
          type: 'lily',
          x: 200 + Math.random() * (this.trackLength - 500),
          yRel: 0.15 + Math.random() * 0.7,
          radius: 14 + Math.random() * 10,
          hasFlower: Math.random() > 0.4
        });
      }
    }

    setParticipants(names) {
      super.setParticipants(names);
      this.ducks = names.map((name, idx) => new DuckRacer(idx, name, idx, names.length));
      this.positionDucksAtStart();
    }

    positionDucksAtStart() {
      if (!this.viewportHeight) return;

      const riverTop = 50;
      const riverBottom = this.viewportHeight - 50;
      const usableHeight = riverBottom - riverTop;
      const count = this.ducks.length;
      if (count === 0) return;

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

    startRace(durationSecs = 8) {
      super.startRace(durationSecs);
      this.durationSecs = durationSecs;
      this.positionDucksAtStart();
    }

    reset() {
      super.reset();
      this.positionDucksAtStart();
    }

    resize(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      if (!this.isRacing && !this.winner) {
        this.positionDucksAtStart();
      }
    }

    update(timestamp, delta, deltaFactor) {
      let leadingDuck = null;
      let maxDist = -Infinity;

      this.ducks.forEach(duck => {
        duck.update(deltaFactor, this.isRacing, this.trackLength, this.durationSecs);

        if (duck.x > maxDist) {
          maxDist = duck.x;
          leadingDuck = duck;
        }

        // Check Winner Crossing
        if (this.isRacing && !this.winner && duck.x + duck.radius >= this.finishLineX) {
          duck.isWinner = true;
          this.triggerFinished(duck);
        }
      });

      // Camera Tracking
      if (leadingDuck && (this.isRacing || this.winner)) {
        const desiredCamX = leadingDuck.x - this.viewportWidth * 0.45;
        this.targetCameraX = Math.max(0, Math.min(this.trackLength - this.viewportWidth, desiredCamX));
      } else {
        this.targetCameraX = 0;
      }
      this.cameraX += (this.targetCameraX - this.cameraX) * 0.08;
    }

    render(ctx, width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      const w = width;
      const h = height;

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

      // 5. Finish Line Checkered Banner
      this.drawFinishLine(ctx);

      // 6. River Banks
      this.drawRiverBanks(ctx);

      // 7. Draw Ducks & Student Name Badges
      const sortedDucks = [...this.ducks].sort((a, b) => a.y - b.y);
      sortedDucks.forEach(duck => duck.draw(ctx, this.cameraX));
    }

    drawRiverBanks(ctx) {
      const w = this.viewportWidth;
      const h = this.viewportHeight;
      const bankH = 36;

      ctx.save();
      const topGrad = ctx.createLinearGradient(0, 0, 0, bankH);
      topGrad.addColorStop(0, '#15803d');
      topGrad.addColorStop(0.7, '#22c55e');
      topGrad.addColorStop(1, '#166534');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, bankH);

      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, bankH - 3, w, 3);

      const bottomGrad = ctx.createLinearGradient(0, h - bankH, 0, h);
      bottomGrad.addColorStop(0, '#166534');
      bottomGrad.addColorStop(0.3, '#22c55e');
      bottomGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, h - bankH, w, bankH);

      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, h - bankH, w, 3);

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

        if (renderX < -50 || renderX > this.viewportWidth + 50) return;

        ctx.save();
        ctx.translate(renderX, renderY);

        ctx.beginPath();
        ctx.arc(0, 0, pad.radius, 0.25, Math.PI * 1.85);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = '#15803d';
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 2;
        ctx.stroke();

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
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(renderX, 40);
      ctx.lineTo(renderX, this.viewportHeight - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(renderX, 48, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(renderX, this.viewportHeight - 48, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

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
      const squareSize = 16;
      const numSquares = Math.ceil((h - 80) / squareSize);

      for (let i = 0; i < numSquares; i++) {
        const y = 40 + i * squareSize;
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1e293b';
        ctx.fillRect(renderX - 8, y, 8, squareSize);

        ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#ffffff';
        ctx.fillRect(renderX, y, 8, squareSize);
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(renderX - 8, 40, 16, numSquares * squareSize);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(renderX - 12, 30, 24, 14);
      ctx.fillRect(renderX - 12, h - 44, 24, 14);

      ctx.font = '700 14px Fredoka, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.fillText('FINISH LINE', renderX, 24);

      ctx.restore();
    }

    getLeaderboard() {
      if (this.ducks.length === 0) return [];
      return [...this.ducks].sort((a, b) => b.x - a.x).slice(0, 3);
    }

    renderWinnerAvatar(winner) {
      if (!winner || !winner.palette) return;
      const p = winner.palette;
      const bodyEl = document.getElementById('modalDuckBody');
      const tailEl = document.getElementById('modalDuckTail');
      const headEl = document.getElementById('modalDuckHead');
      const wingEl = document.getElementById('modalDuckWing');
      if (bodyEl) { bodyEl.setAttribute('fill', p.body); bodyEl.setAttribute('stroke', p.stroke); }
      if (tailEl) { tailEl.setAttribute('fill', p.body); tailEl.setAttribute('stroke', p.stroke); }
      if (headEl) { headEl.setAttribute('fill', p.body); headEl.setAttribute('stroke', p.stroke); }
      if (wingEl) { wingEl.setAttribute('fill', p.wing); wingEl.setAttribute('stroke', p.stroke); }
    }
  }

  // Register with central GameRegistry
  if (window.gameRegistry) {
    window.gameRegistry.register('duck-race', DuckRaceGame, {
      name: 'Lucky Duck Race',
      description: 'Exciting river duck race for classrooms',
      themeColor: '#0284c7',
      icon: 'duck',
      isAvailable: true
    });
  }

  // Export
  window.DuckRaceGame = DuckRaceGame;
})();
