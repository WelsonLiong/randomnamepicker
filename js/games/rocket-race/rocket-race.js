/**
 * Lucky Duck Race / Random Name Picker Platform
 * Game Module: Cosmic Rocket Odyssey (Vertical Flight Race)
 * 
 * Invariants Enforced:
 * - Rule 7: Fair straight starting line (launchY = startLineY across all lanes)
 * - Rule 8: Name-only floating badges (strictly student name)
 * - Rule 9: Straight-line vertical racing trajectory (this.x = this.startX)
 * - Zero-Emoji Policy: 100% SVG and canvas vector rendering
 */

(function () {
  'use strict';

  class RocketRaceGame extends window.BaseGame {
    constructor(id, name, options = {}) {
      super(id, name, options);

      this.rockets = [];
      this.trackHeight = 4400; // Vertical course length
      this.finishLineY = 340;  // Orbital space station finish line
      this.startLineY = 3950;  // Earth launchpad starting line

      // Viewport & Camera
      this.viewportWidth = 1200;
      this.viewportHeight = 800;
      this.cameraY = this.startLineY - 500;
      this.targetCameraY = this.cameraY;

      // Starfield & Cosmic Decor
      this.stars = [];
      this.nebulaClouds = [];
      this.spaceDust = [];
      this.altitudeMarkers = [];
      this.initCosmicDecor();
    }

    init(canvas, appShell) {
      super.init(canvas, appShell);
      this.resize(canvas.width, canvas.height);
      this.reset();
    }

    initCosmicDecor() {
      // Generate 150 parallax stars
      this.stars = [];
      for (let i = 0; i < 160; i++) {
        this.stars.push({
          xRatio: Math.random(),
          y: Math.random() * this.trackHeight,
          radius: Math.random() * 1.8 + 0.6,
          baseAlpha: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          parallax: Math.random() * 0.4 + 0.6 // 0.6 to 1.0 scroll rate
        });
      }

      // Generate colorful nebula dust spots
      this.nebulaClouds = [
        { xRatio: 0.25, y: 1100, radius: 240, color: 'rgba(124, 58, 237, 0.14)' }, // Violet nebula
        { xRatio: 0.75, y: 1900, radius: 280, color: 'rgba(2, 132, 199, 0.12)' },  // Blue nebula
        { xRatio: 0.35, y: 2600, radius: 220, color: 'rgba(219, 39, 119, 0.12)' }, // Pink nebula
        { xRatio: 0.65, y: 600, radius: 260, color: 'rgba(16, 185, 129, 0.10)' }   // Cyan/Green nebula
      ];

      // Altitude furlongs
      this.altitudeMarkers = [
        { y: 3200, label: '10,000 KM • STRATOSPHERE' },
        { y: 2400, label: '50,000 KM • MESOSPHERE' },
        { y: 1600, label: '100,000 KM • THERMOSPHERE' },
        { y: 850, label: '250,000 KM • ORBITAL APOGEE' }
      ];
    }

    setParticipants(names) {
      super.setParticipants(names);
      this.rockets = names.map((name, i) => new window.RocketRacer(name, i, names.length));
      this.positionRocketsAtStart();
    }

    positionRocketsAtStart() {
      if (this.rockets.length === 0) return;

      const numRacers = this.rockets.length;
      const margin = 70;
      const availableWidth = Math.max(200, this.viewportWidth - margin * 2);
      const laneSpacing = availableWidth / (numRacers + 1);

      // Adaptive scaling for large classes (>15 racers)
      let scale = 1.0;
      if (numRacers > 15) {
        scale = Math.max(0.55, Math.min(1.0, availableWidth / (numRacers * 46)));
      }

      // Invariant 7: Fair straight starting line (all rockets align on exact same startLineY)
      this.rockets.forEach((rocket, i) => {
        const laneX = margin + laneSpacing * (i + 1);
        rocket.reset(laneX, this.startLineY, scale);
      });

      // Frame camera on the launchpads
      this.cameraY = this.startLineY - this.viewportHeight * 0.72;
      this.targetCameraY = this.cameraY;
    }

    startRace(durationSecs = 8) {
      super.startRace(durationSecs);

      // Distribute speed profiles to reach finish line around requested duration
      const totalDistance = this.startLineY - this.finishLineY;
      const averageSpeedNeeded = totalDistance / (durationSecs * 60);

      this.rockets.forEach(rocket => {
        rocket.baseSpeed = averageSpeedNeeded * (0.85 + Math.random() * 0.3);
        rocket.maxSpeed = rocket.baseSpeed * (1.25 + Math.random() * 0.35);
        rocket.targetSpeed = rocket.baseSpeed;
      });
    }

    reset() {
      super.reset();
      this.positionRocketsAtStart();
      this.cameraY = this.startLineY - this.viewportHeight * 0.72;
      this.targetCameraY = this.cameraY;
    }

    update(timestamp, delta, deltaFactor) {
      // 1. Update Rockets
      this.rockets.forEach(rocket => {
        rocket.update(delta, deltaFactor, this.isRacing, this.finishLineY);
      });

      // 2. Determine Leader & Check Finish
      if (this.isRacing && !this.winner) {
        const finishedRockets = this.rockets.filter(r => r.hasFinished);
        if (finishedRockets.length > 0) {
          // Sort by earliest finish timestamp
          finishedRockets.sort((a, b) => a.finishTime - b.finishTime);
          const firstWinner = finishedRockets[0];
          this.triggerFinished(firstWinner);
        }
      }

      // 3. Smooth Camera Tracking along the Vertical Y-Axis
      if (this.isRacing && this.rockets.length > 0) {
        // Track the leader (minimum Y)
        const minY = Math.min(...this.rockets.map(r => r.y));
        this.targetCameraY = minY - this.viewportHeight * 0.42;
      } else if (!this.isRacing && !this.winner) {
        this.targetCameraY = this.startLineY - this.viewportHeight * 0.72;
      } else if (this.winner) {
        // Center on the orbital finish line
        this.targetCameraY = this.finishLineY - this.viewportHeight * 0.35;
      }

      // Clamp camera bounds
      const minCam = 0;
      const maxCam = Math.max(0, this.trackHeight - this.viewportHeight);
      this.targetCameraY = Math.max(minCam, Math.min(maxCam, this.targetCameraY));

      // Smooth camera interpolation
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.085 * deltaFactor;
    }

    render(ctx, width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;

      ctx.clearRect(0, 0, width, height);

      // 1. Atmospheric & Deep Space Gradient Backdrop
      this.drawCosmicBackdrop(ctx, width, height);

      // 2. Parallax Nebulae & Starfield
      this.drawNebulae(ctx, width, height);
      this.drawStars(ctx, width, height);

      // 3. Celestial Bodies (Moon & Saturn)
      this.drawCelestialBodies(ctx, width, height);

      // 4. Altitude Furlong Gates
      this.drawAltitudeMarkers(ctx, width);

      // 5. Earth Launchpad & Gantry Towers (Bottom)
      this.drawLaunchpadBase(ctx, width);

      // 6. Orbital Space Station & Laser Finish Line (Top)
      this.drawOrbitalStation(ctx, width);

      // 7. Render All Rockets
      this.rockets.forEach(rocket => {
        rocket.draw(ctx, this.cameraY);
      });
    }

    drawCosmicBackdrop(ctx, width, height) {
      // Dynamic vertical gradient that shifts with altitude
      const grad = ctx.createLinearGradient(0, 0, 0, height);

      // Calculate altitude ratio: 0 (top = deep space) to 1 (bottom = Earth twilight)
      const altitudeRatio = this.cameraY / (this.trackHeight - height);

      if (altitudeRatio > 0.6) {
        // Near Earth / Atmosphere launch
        grad.addColorStop(0, '#0F172A'); // Midnight slate
        grad.addColorStop(0.5, '#1E1B4B'); // Dark twilight indigo
        grad.addColorStop(1, '#0B1120'); // Launchpad ground night
      } else if (altitudeRatio > 0.25) {
        // Stratosphere & Mesosphere
        grad.addColorStop(0, '#020617'); // Space black
        grad.addColorStop(0.6, '#0F172A'); // Deep space blue
        grad.addColorStop(1, '#1E1B4B'); // Purple atmospheric fringe
      } else {
        // Deep Orbital Outer Space
        grad.addColorStop(0, '#020617'); // Infinite cosmos black
        grad.addColorStop(0.7, '#070C1E'); // Midnight star void
        grad.addColorStop(1, '#0F172A'); // Subtle stellar blue
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    drawNebulae(ctx, width, height) {
      this.nebulaClouds.forEach(nebula => {
        const renderX = nebula.xRatio * width;
        const renderY = nebula.y - this.cameraY;
        if (renderY < -nebula.radius || renderY > height + nebula.radius) return;

        ctx.save();
        const radGrad = ctx.createRadialGradient(renderX, renderY, 10, renderX, renderY, nebula.radius);
        radGrad.addColorStop(0, nebula.color);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(renderX, renderY, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    drawStars(ctx, width, height) {
      const now = performance.now();
      ctx.save();

      this.stars.forEach(star => {
        const renderX = star.xRatio * width;
        const renderY = (star.y - this.cameraY * star.parallax);

        // Wrap around vertically in screen space for continuous star density
        const wrappedY = ((renderY % height) + height) % height;

        // Twinkle oscillation
        const twinkle = Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
        const alpha = Math.max(0.1, Math.min(1.0, star.baseAlpha + twinkle * 0.35));

        ctx.beginPath();
        ctx.arc(renderX, wrappedY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = alpha;
        ctx.fill();
      });

      ctx.restore();
    }

    drawCelestialBodies(ctx, width, height) {
      ctx.save();

      // 1. Cratered Crescent Moon (Right side, altitude ~2000px)
      const moonY = 2100 - this.cameraY;
      const moonX = width - 130;
      if (moonY > -100 && moonY < height + 100) {
        // Moon body
        ctx.beginPath();
        ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
        ctx.fillStyle = '#F8FAFC';
        ctx.shadowColor = '#94A3B8';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Craters
        const craters = [
          { x: moonX - 14, y: moonY - 12, r: 9 },
          { x: moonX + 16, y: moonY - 18, r: 7 },
          { x: moonX - 6, y: moonY + 16, r: 12 },
          { x: moonX + 20, y: moonY + 14, r: 8 }
        ];
        ctx.fillStyle = '#CBD5E1';
        craters.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 2. Ringed Saturn Planet (Left side, altitude ~1000px)
      const saturnY = 1050 - this.cameraY;
      const saturnX = 140;
      if (saturnY > -100 && saturnY < height + 100) {
        // Planet Disc
        ctx.beginPath();
        ctx.arc(saturnX, saturnY, 36, 0, Math.PI * 2);
        const saturnGrad = ctx.createLinearGradient(saturnX - 36, saturnY - 36, saturnX + 36, saturnY + 36);
        saturnGrad.addColorStop(0, '#FEF08A');
        saturnGrad.addColorStop(0.5, '#F59E0B');
        saturnGrad.addColorStop(1, '#D97706');
        ctx.fillStyle = saturnGrad;
        ctx.fill();

        // Saturn Rings (Tilted Ellipse)
        ctx.beginPath();
        ctx.ellipse(saturnX, saturnY, 68, 16, -Math.PI / 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(saturnX, saturnY, 78, 20, -Math.PI / 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawAltitudeMarkers(ctx, width) {
      ctx.save();
      this.altitudeMarkers.forEach(marker => {
        const renderY = marker.y - this.cameraY;
        if (renderY < -40 || renderY > this.viewportHeight + 40) return;

        // Glowing Laser Grid Line
        ctx.beginPath();
        ctx.moveTo(40, renderY);
        ctx.lineTo(width - 40, renderY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Altitude Tag Badge
        ctx.font = '600 12px Fredoka, sans-serif';
        ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.textAlign = 'right';
        ctx.fillText(marker.label, width - 50, renderY - 8);
      });
      ctx.restore();
    }

    drawLaunchpadBase(ctx, width) {
      const renderY = this.startLineY - this.cameraY;
      if (renderY < -150 || renderY > this.viewportHeight + 250) return;

      ctx.save();

      // Launch Platform Concrete Foundation
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, renderY + 36, width, 300);

      // Steel Safety Perimeter Beam with Hazard Warning Stripes
      const stripeW = 24;
      const beamY = renderY + 32;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, beamY, width, 12);

      ctx.fillStyle = '#F59E0B';
      for (let x = 0; x < width; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, beamY);
        ctx.lineTo(x + stripeW, beamY);
        ctx.lineTo(x + stripeW - 6, beamY + 12);
        ctx.lineTo(x - 6, beamY + 12);
        ctx.closePath();
        ctx.fill();
      }

      // Launch Pad Gantry Clamps & Girders under each rocket
      this.rockets.forEach(rocket => {
        const rx = rocket.startX;
        // Launch Clamp Pedestal
        ctx.fillStyle = '#334155';
        ctx.fillRect(rx - 16, renderY + 24, 32, 16);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx - 16, renderY + 24, 32, 16);

        // Status Indicator LED on Pad (Green when ready, Amber when countdown)
        ctx.beginPath();
        ctx.arc(rx, renderY + 32, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = this.isRacing ? '#EF4444' : '#10B981';
        ctx.shadowColor = this.isRacing ? '#EF4444' : '#10B981';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Launchpad floodlights pointing skyward
      [width * 0.1, width * 0.9].forEach(towerX => {
        ctx.beginPath();
        ctx.moveTo(towerX - 10, renderY + 36);
        ctx.lineTo(towerX + 10, renderY + 36);
        ctx.lineTo(towerX + 4, renderY - 20);
        ctx.lineTo(towerX - 4, renderY - 20);
        ctx.closePath();
        ctx.fillStyle = '#475569';
        ctx.fill();

        // Light Beam Cone
        const beamGrad = ctx.createLinearGradient(towerX, renderY - 20, towerX, renderY - 300);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.beginPath();
        ctx.moveTo(towerX - 6, renderY - 20);
        ctx.lineTo(towerX - 60, renderY - 300);
        ctx.lineTo(towerX + 60, renderY - 300);
        ctx.lineTo(towerX + 6, renderY - 20);
        ctx.closePath();
        ctx.fillStyle = beamGrad;
        ctx.fill();
      });

      // Starting Line Label (Centered)
      ctx.font = '700 14px Fredoka, sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCHPAD ALPHA • MISSION START', width / 2, renderY + 68);

      ctx.restore();
    }

    drawOrbitalStation(ctx, width) {
      const renderY = this.finishLineY - this.cameraY;
      if (renderY < -150 || renderY > this.viewportHeight + 250) return;

      ctx.save();

      // 1. Glowing Neon Checkered Laser Finish Line
      const squareSize = 16;
      const numSquares = Math.ceil(width / squareSize);
      for (let i = 0; i < numSquares; i++) {
        const x = i * squareSize;
        ctx.fillStyle = i % 2 === 0 ? '#38BDF8' : '#0F172A';
        ctx.fillRect(x, renderY - 6, squareSize, 6);

        ctx.fillStyle = i % 2 === 0 ? '#0F172A' : '#38BDF8';
        ctx.fillRect(x, renderY, squareSize, 6);
      }

      // Laser Beam Glow
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, renderY - 6, width, 12);
      ctx.shadowBlur = 0;

      // 2. Orbital Space Station Superstructure (Above finish line)
      const stationY = renderY - 95;
      const centerX = width / 2;

      // Central Command Module
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(centerX - 120, stationY, 240, 52, 12);
      ctx.fill();
      ctx.stroke();

      // Porthole Observation Windows
      for (let w = -80; w <= 80; w += 40) {
        ctx.beginPath();
        ctx.arc(centerX + w, stationY + 26, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }

      // Solar Panel Arrays (Left and Right Wings)
      [-1, 1].forEach(side => {
        const wingX = centerX + side * 180;
        ctx.fillStyle = '#0369A1';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wingX - 45, stationY + 10, 90, 32);

        // Solar Grid Lines
        ctx.fillStyle = '#0284C7';
        for (let gx = -35; gx < 45; gx += 20) {
          ctx.fillRect(wingX + gx, stationY + 12, 14, 28);
        }
      });

      // Celebratory Mission Complete Banner
      ctx.font = '700 14px Fredoka, sans-serif';
      ctx.fillStyle = '#FEF08A';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText('ORBITAL DOCKING STATION • FINISH GATEWAY', centerX, stationY - 14);

      ctx.restore();
    }

    getLeaderboard() {
      if (this.rockets.length === 0) return [];
      // Lowest Y is closest to the finish line at the top
      return [...this.rockets].sort((a, b) => a.y - b.y).slice(0, 3);
    }

    renderWinnerAvatar(winner) {
      // Mount Champion Rocket Avatar in Winner Modal
      const container = document.getElementById('modalAvatarContainer');
      if (!container) return;

      const p = winner && winner.palette ? winner.palette : { body: '#E0F2FE', nose: '#0284C7', fins: '#0369A1', trim: '#38BDF8' };

      container.innerHTML = `
        <div class="winner-rocket-illustration" style="position:relative; width:130px; height:120px; margin:0 auto;">
          <svg viewBox="0 0 140 120" width="130" height="110" fill="none">
            <!-- Golden Orbital Laurel Ring (Zero Emoji) -->
            <ellipse cx="70" cy="56" rx="54" ry="46" stroke="#EAB308" stroke-width="4" stroke-dasharray="6,4" fill="none"/>
            <circle cx="28" cy="38" r="3" fill="#FEF08A"/>
            <circle cx="112" cy="38" r="3" fill="#FEF08A"/>
            <circle cx="70" cy="10" r="4" fill="#FEF08A"/>

            <!-- Exhaust Flame -->
            <path d="M 64,88 Q 70,108 76,88 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
            <path d="M 67,88 Q 70,98 73,88 Z" fill="#FEF08A"/>

            <!-- Rocket Swept Fins -->
            <path d="M 58,66 L 44,84 L 58,82 Z" fill="${p.fins}" stroke="#0F172A" stroke-width="2"/>
            <path d="M 82,66 L 96,84 L 82,82 Z" fill="${p.fins}" stroke="#0F172A" stroke-width="2"/>

            <!-- Thruster Nozzle -->
            <path d="M 62,82 L 60,88 L 80,88 L 78,82 Z" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>

            <!-- Rocket Fuselage -->
            <path d="M 70,22 C 82,40 82,72 78,82 L 62,82 C 58,72 58,40 70,22 Z" fill="${p.body}" stroke="#0F172A" stroke-width="2.5"/>

            <!-- Nose Cone -->
            <path d="M 70,22 C 77,34 78,44 78,48 L 62,48 C 62,44 63,34 70,22 Z" fill="${p.nose}" stroke="#0F172A" stroke-width="2"/>

            <!-- Cockpit Porthole Window -->
            <circle cx="70" cy="58" r="8" fill="#0284C7" stroke="#0F172A" stroke-width="2"/>
            <circle cx="68" cy="56" r="4" fill="#BAE6FD" opacity="0.8"/>
            <circle cx="71" cy="55" r="1.5" fill="#FFFFFF"/>

            <!-- Dorsal Fin Strip -->
            <line x1="70" y1="58" x2="70" y2="82" stroke="${p.fins}" stroke-width="2.5"/>
          </svg>
        </div>
      `;
    }

    resize(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.positionRocketsAtStart();
    }
  }

  // Central Game Registration
  if (window.gameRegistry) {
    window.gameRegistry.register('rocket-race', RocketRaceGame, {
      name: 'Cosmic Rocket Odyssey',
      description: 'Retro rockets blast off vertically into outer space toward orbital station docking',
      themeColor: '#6366F1',
      icon: 'rocket',
      isAvailable: true
    });
  }

  // Export to global scope
  window.RocketRaceGame = RocketRaceGame;
})();
