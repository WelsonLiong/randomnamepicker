/**
 * Lucky Duck Race / Random Name Picker Platform
 * Game Module: Carnival Wheel of Fortune
 * 
 * Invariants Enforced:
 * - Rule 8: Name-only labels on wedges (strictly student names, zero number prefixes)
 * - Zero-Emoji Policy: 100% vector canvas and procedural sound synthesis
 * - Fair Chances: Exact equal angular slice per participant (2*PI / N)
 * - Realistic Deceleration: Rotational inertia with physical flapper deflection and clicking cadence
 */

(function () {
  'use strict';

  const WHEEL_PALETTES = [
    { bg: '#EF4444', text: '#FFFFFF', dark: '#991B1B' }, // Crimson Red
    { bg: '#3B82F6', text: '#FFFFFF', dark: '#1D4ED8' }, // Sapphire Blue
    { bg: '#10B981', text: '#FFFFFF', dark: '#047857' }, // Emerald Green
    { bg: '#F59E0B', text: '#FFFFFF', dark: '#B45309' }, // Amber Gold
    { bg: '#8B5CF6', text: '#FFFFFF', dark: '#6D28D9' }, // Royal Purple
    { bg: '#EC4899', text: '#FFFFFF', dark: '#BE185D' }, // Hot Pink
    { bg: '#06B6D4', text: '#FFFFFF', dark: '#0E7490' }, // Vibrant Cyan
    { bg: '#F97316', text: '#FFFFFF', dark: '#C2410C' }, // Tangerine Orange
    { bg: '#14B8A6', text: '#FFFFFF', dark: '#0F766E' }, // Deep Teal
    { bg: '#E11D48', text: '#FFFFFF', dark: '#9F1239' }  // Ruby Rose
  ];

  class WheelFortuneGame extends window.BaseGame {
    constructor(id, name, options = {}) {
      super(id, name, options);

      // Geometry & Dimensions
      this.viewportWidth = 1200;
      this.viewportHeight = 800;
      this.centerX = 600;
      this.centerY = 400;
      this.radius = 280;

      // Rotation & Physics State
      this.currentAngle = 0;
      this.startAngle = 0;
      this.targetAngle = 0;
      this.totalRotation = 0;
      this.spinStartTime = 0;
      this.spinDuration = 8000;
      this.isSpinning = false;
      this.winningIndex = -1;
      this.currentWinnerName = '';

      // Stationary Flapper Pointer & Peg Tick Sound Detection
      this.flapperAngle = 0;
      this.activeContactPegIndex = -1;
      this.lastRecordedAngle = 0;

      // Marquee Light Bulbs
      this.numBulbs = 24;
      this.marqueeOffset = 0;

      // Celebratory Pulse
      this.celebrationPulse = 0;
    }

    init(canvas, appShell) {
      super.init(canvas, appShell);
      this.resize(canvas.width, canvas.height);
      this.reset();
    }

    setParticipants(names) {
      super.setParticipants(names);
      this.reset();
    }

    startRace(durationSecs = 8) {
      if (this.participants.length === 0) return;
      super.startRace(durationSecs);

      this.isSpinning = true;
      this.spinStartTime = performance.now();
      this.spinDuration = durationSecs * 1000;
      this.startAngle = this.currentAngle;

      const N = this.participants.length;
      const sliceAngle = (Math.PI * 2) / N;

      // High-entropy cryptographic random generator
      const getRandomFloat = () => {
        if (window.crypto && window.crypto.getRandomValues) {
          const buf = new Uint32Array(1);
          window.crypto.getRandomValues(buf);
          return buf[0] / (0xFFFFFFFF + 1);
        }
        return Math.random();
      };

      // 1. Fairly pick winning student index (1/N equal chance for each student)
      this.winningIndex = Math.floor(getRandomFloat() * N);
      this.currentWinnerName = this.participants[this.winningIndex];

      // 2. Natural continuous offset inside winning wedge:
      // - 8% buffer away from boundary pegs prevents ambiguous dead-center line straddling.
      // - The remaining 84% allows natural variety: center, off-center, and occasional near-misses.
      // - Does NOT stop near the border every single time, keeping the experience fresh and organic.
      const minMargin = 0.08;
      const usableSpan = 1.0 - 2 * minMargin; // 0.84
      const sliceFraction = minMargin + getRandomFloat() * usableSpan;

      // 3. Target angle positioning sliceFraction of winningIndex directly under the top pointer (3*PI/2)
      const targetPointInWedge = (this.winningIndex + sliceFraction) * sliceAngle;
      const topPointerAngle = (Math.PI * 3) / 2;
      let targetMod = (topPointerAngle - targetPointInWedge) % (Math.PI * 2);
      if (targetMod < 0) targetMod += Math.PI * 2;

      // 4. Randomized base spins (between 4 and 6 full rotations) for unpredictable rotation distance
      const baseSpins = 4 + Math.floor(getRandomFloat() * 3);
      const currentMod = this.startAngle % (Math.PI * 2);
      let diff = targetMod - currentMod;
      if (diff <= 0) diff += Math.PI * 2;

      this.totalRotation = (Math.PI * 2 * baseSpins) + diff;
      this.targetAngle = this.startAngle + this.totalRotation;

      this.activeContactPegIndex = -1;
      this.lastRecordedAngle = this.startAngle;
      this.celebrationPulse = 0;
    }

    reset() {
      super.reset();
      this.isSpinning = false;
      this.flapperAngle = 0;
      this.activeContactPegIndex = -1;
      this.celebrationPulse = 0;
      this.winningIndex = -1;
      this.currentWinnerName = '';
    }

    update(timestamp, delta, deltaFactor) {
      // 1. Wheel Rotation Dynamics
      if (this.isSpinning) {
        const elapsed = timestamp - this.spinStartTime;
        const progress = Math.min(1.0, elapsed / this.spinDuration);

        // Smooth cubic friction deceleration (1 - (1-p)^3.2) for a dramatic, suspenseful slow-crawl finish
        const easedProgress = 1 - Math.pow(1 - progress, 3.2);
        this.currentAngle = this.startAngle + this.totalRotation * easedProgress;

        // Marquee light bulb chase speed (synchronized with spin tempo)
        this.marqueeOffset += (1 - progress * 0.8) * 0.22 * deltaFactor;

        // Finish state
        if (progress >= 1.0) {
          this.isSpinning = false;
          this.currentAngle = this.targetAngle;

          const winner = {
            name: this.currentWinnerName,
            index: this.winningIndex,
            palette: WHEEL_PALETTES[this.winningIndex % WHEEL_PALETTES.length]
          };
          this.triggerFinished(winner);
        }
      } else {
        // Idle marquee lights
        this.marqueeOffset += 0.05 * deltaFactor;
      }

      // 2. Realistic Continuous Flapper Contact & Spring Release
      this.updateFlapperContact(delta, deltaFactor);

      // 3. Celebratory Pulse on Winner
      if (this.winner) {
        this.celebrationPulse = (this.celebrationPulse + 0.05 * deltaFactor) % (Math.PI * 2);
      }
    }

    updateFlapperContact(delta, deltaFactor) {
      if (this.participants.length === 0) return;

      const dt = Math.min(0.04, Math.max(0.001, delta));
      const N = this.participants.length;
      const sliceAngle = (Math.PI * 2) / N;
      const cx = this.centerX;
      const cy = this.centerY;
      const pegR = this.radius - 18;
      const rPeg = 4.5;
      const flapperHalfWidth = 3.5;
      const rEff = rPeg + flapperHalfWidth; // 8.0px
      const pivotY = cy - this.radius - 14;
      const flapperLength = 40;

      // Calculate instantaneous angular velocity for tick speed modulation
      const dAngle = Math.abs(this.currentAngle - (this.lastRecordedAngle !== undefined ? this.lastRecordedAngle : this.currentAngle));
      const angVel = dt > 0 ? dAngle / dt : 0;
      this.lastRecordedAngle = this.currentAngle;
      const speedRate = Math.min(1.0, Math.max(0.15, angVel / 9.5));

      // Check all pegs near top center (12 o'clock) for physical contact
      let maxContactDeflection = 0;
      let contactPegFound = -1;

      for (let i = 0; i < N; i++) {
        const pegAngle = this.currentAngle + i * sliceAngle;
        const px = cx + Math.cos(pegAngle) * pegR;
        const py = cy + Math.sin(pegAngle) * pegR;

        const dx = px - cx;
        const dy = py - pivotY;

        // Peg must be below pivot within interaction range
        if (dy > 0 && dy < flapperLength + 16 && Math.abs(dx) < 36) {
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > rEff && dist < flapperLength + rEff) {
            // Angle to peg center from vertical down (+Y is down, +X is right)
            const alpha = Math.atan2(dx, dy);
            const deltaAngle = Math.asin(Math.min(1.0, rEff / dist));

            // In a clockwise wheel, peg moves Left -> Right, pushing flapper to the Right (+X)
            const requiredAngle = alpha + deltaAngle;

            // In local coordinates of candidate deflection:
            const cosA = Math.cos(requiredAngle);
            const sinA = Math.sin(requiredAngle);
            const yLocal = dx * sinA + dy * cosA;

            // Only engage pegs approaching from left (dx <= 4) or currently in active contact
            const isEngaged = (i === this.activeContactPegIndex);
            if (yLocal > 0 && yLocal <= flapperLength && requiredAngle > 0 && dx < 24) {
              if (dx <= 4 || isEngaged) {
                if (requiredAngle > maxContactDeflection) {
                  maxContactDeflection = requiredAngle;
                  contactPegFound = i;
                }
              }
            }
          }
        }
      }

      // Peg pass-by event tracking for tick audio
      const wasInContact = this.activeContactPegIndex !== -1;

      if (contactPegFound !== -1) {
        this.activeContactPegIndex = contactPegFound;
      } else {
        if (wasInContact) {
          // Peg slipped past the pointer: trigger procedural mechanical tick sound
          if (this.app && this.app.sound && typeof this.app.sound.playWheelTick === 'function') {
            this.app.sound.playWheelTick(speedRate);
          }
          this.activeContactPegIndex = -1;
        }
      }

      // Pointer remains permanently stationary at 0 degrees
      this.flapperAngle = 0;
    }

    updateLayout(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.centerX = width / 2;

      // Top clearance: room for flapper bracket mount (topY - 34), leaving ~20px top canvas margin
      const topClearance = 54;
      // Bottom clearance: room for stand base foot and bottom action bar
      const bottomClearance = 70;

      const maxHRadius = Math.floor((height - topClearance - bottomClearance) / 2);
      const maxWRadius = Math.floor(width * 0.46);

      // Scale dynamically up to 480px radius (eliminates empty space above wheel)
      this.radius = Math.max(160, Math.min(maxHRadius, maxWRadius, 480));
      this.centerY = topClearance + this.radius;
    }

    resize(width, height) {
      this.updateLayout(width, height);
    }

    render(ctx, width, height) {
      this.updateLayout(width, height);

      ctx.clearRect(0, 0, width, height);

      // 1. Fairground Stage Backdrop
      this.drawCarnivalStageBackdrop(ctx, width, height);

      // 2. Wheel Shadow & Base Stand
      this.drawWheelStand(ctx);

      // 3. Wheel Slices & Student Names
      this.drawWheelSlices(ctx);

      // 4. Brass Pegs
      this.drawBrassPegs(ctx);

      // 5. Outer Golden Marquee Rim with Light Bulbs
      this.drawMarqueeRim(ctx);

      // 6. Center Hub Medallion
      this.drawCenterHub(ctx);

      // 7. Top Pointer / Mechanical Flapper
      this.drawTopFlapper(ctx);
    }

    drawCarnivalStageBackdrop(ctx, width, height) {
      ctx.save();

      // Deep midnight carnival tent atmosphere
      const bgGrad = ctx.createRadialGradient(this.centerX, this.centerY * 0.8, 80, this.centerX, this.centerY, width * 0.7);
      bgGrad.addColorStop(0, '#1E1B4B'); // Warm deep indigo
      bgGrad.addColorStop(0.55, '#0F172A'); // Midnight slate
      bgGrad.addColorStop(1, '#020617'); // Pitch dark perimeter
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient bokeh stage light spheres
      const bokeh = [
        { x: width * 0.15, y: height * 0.25, r: 90, color: 'rgba(245, 158, 11, 0.08)' },
        { x: width * 0.85, y: height * 0.22, r: 110, color: 'rgba(236, 72, 153, 0.07)' },
        { x: width * 0.22, y: height * 0.75, r: 80, color: 'rgba(14, 165, 233, 0.07)' },
        { x: width * 0.78, y: height * 0.78, r: 100, color: 'rgba(168, 85, 247, 0.07)' }
      ];
      bokeh.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      });

      // Subtle carnival tent roof scallop lines at top
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2;
      const scallopW = 60;
      for (let x = 0; x < width; x += scallopW) {
        ctx.beginPath();
        ctx.arc(x + scallopW / 2, 0, scallopW / 2, 0, Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    }

    drawWheelStand(ctx) {
      const cx = this.centerX;
      const cy = this.centerY;
      const r = this.radius;

      ctx.save();

      // Large Floor Cast Shadow
      ctx.beginPath();
      ctx.ellipse(cx, cy + r + 24, r * 0.9, 26, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Heavy Triangular Wooden Stage Stand Behind Wheel
      ctx.beginPath();
      ctx.moveTo(cx - 36, cy + 20);
      ctx.lineTo(cx - r * 0.45, cy + r + 26);
      ctx.lineTo(cx + r * 0.45, cy + r + 26);
      ctx.lineTo(cx + 36, cy + 20);
      ctx.closePath();

      const standGrad = ctx.createLinearGradient(cx - r * 0.45, 0, cx + r * 0.45, 0);
      standGrad.addColorStop(0, '#1E293B');
      standGrad.addColorStop(0.5, '#475569');
      standGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = standGrad;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Stand cross braces
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.35, cy + r + 20);
      ctx.lineTo(cx + r * 0.35, cy + r + 20);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.restore();
    }

    drawWheelSlices(ctx) {
      const N = this.participants.length;
      if (N === 0) return;

      const cx = this.centerX;
      const cy = this.centerY;
      const r = this.radius - 18; // Leave room for marquee rim
      const sliceAngle = (Math.PI * 2) / N;

      ctx.save();
      ctx.translate(cx, cy);

      for (let i = 0; i < N; i++) {
        const startA = this.currentAngle + i * sliceAngle;
        const endA = startA + sliceAngle;
        const palette = WHEEL_PALETTES[i % WHEEL_PALETTES.length];

        // 1. Draw Wedge Sector
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, startA, endA);
        ctx.closePath();

        // Wedge Radial Gradient for 3D depth
        const wedgeGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, r);
        wedgeGrad.addColorStop(0, '#FFFFFF');
        wedgeGrad.addColorStop(0.2, palette.bg);
        wedgeGrad.addColorStop(1, palette.dark);
        ctx.fillStyle = wedgeGrad;
        ctx.fill();

        // Crisp separator line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = N > 30 ? 1 : 1.8;
        ctx.stroke();

        // 2. Draw Winner Highlight Pulse if finished on this slice
        if (this.winner && this.winner.index === i) {
          ctx.save();
          const pulseAlpha = 0.35 + Math.sin(this.celebrationPulse * 2) * 0.25;
          ctx.fillStyle = `rgba(254, 240, 138, ${pulseAlpha})`;
          ctx.fill();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }

        // 3. Draw Student Name (Strict Invariant 8: Name-Only, No Number Prefix)
        const studentName = this.participants[i];
        this.drawWedgeName(ctx, studentName, startA + sliceAngle / 2, r, N);
      }

      ctx.restore();
    }

    drawWedgeName(ctx, name, midAngle, r, N) {
      ctx.save();
      ctx.rotate(midAngle);

      // Adaptive text styling scaled by enlarged wheel radius (baseline 300px)
      const rScale = Math.max(0.95, Math.min(1.45, r / 300));
      let baseSize = 22;
      if (N > 50) baseSize = 11;
      else if (N > 38) baseSize = 13;
      else if (N > 28) baseSize = 15;
      else if (N > 18) baseSize = 17.5;
      else if (N > 12) baseSize = 19.5;

      const fontSize = Math.round(baseSize * rScale);

      ctx.font = `700 ${fontSize}px Fredoka, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Position text along the outer radius with max width clamp to prevent center hub overlap
      const textX = r - 20;
      const hubR = Math.max(46, Math.min(72, this.radius * 0.19));
      const maxTextWidth = Math.max(60, textX - hubR - 14);

      // Text Shadow for supreme readability on any slice color
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Invariant 8: Display name strictly
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(name, textX, 0, maxTextWidth);

      ctx.restore();
    }

    drawBrassPegs(ctx) {
      const N = this.participants.length;
      if (N === 0) return;

      const cx = this.centerX;
      const cy = this.centerY;
      const pegRadius = this.radius - 18;
      const sliceAngle = (Math.PI * 2) / N;

      ctx.save();

      for (let i = 0; i < N; i++) {
        const angle = this.currentAngle + i * sliceAngle;
        const px = cx + Math.cos(angle) * pegRadius;
        const py = cy + Math.sin(angle) * pegRadius;

        // Brass Peg Shadow
        ctx.beginPath();
        ctx.arc(px + 1, py + 1.5, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();

        // Shiny Golden Brass Peg Disc
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        const pegGrad = ctx.createRadialGradient(px - 1.5, py - 1.5, 1, px, py, 4.5);
        pegGrad.addColorStop(0, '#FFFBEB');
        pegGrad.addColorStop(0.4, '#FDE047');
        pegGrad.addColorStop(1, '#B45309');
        ctx.fillStyle = pegGrad;
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }

    drawMarqueeRim(ctx) {
      const cx = this.centerX;
      const cy = this.centerY;
      const r = this.radius;

      ctx.save();

      // Outer Golden Metallic Marquee Ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx, cy, r - 20, 0, Math.PI * 2, true); // Donut cut

      const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rimGrad.addColorStop(0, '#F59E0B');
      rimGrad.addColorStop(0.25, '#FEF3C7');
      rimGrad.addColorStop(0.5, '#D97706');
      rimGrad.addColorStop(0.75, '#FFFBEB');
      rimGrad.addColorStop(1, '#92400E');
      ctx.fillStyle = rimGrad;
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Marquee Light Bulbs around rim
      const bulbRadius = r - 10;
      const bulbStep = (Math.PI * 2) / this.numBulbs;

      for (let i = 0; i < this.numBulbs; i++) {
        const bAngle = i * bulbStep;
        const bx = cx + Math.cos(bAngle) * bulbRadius;
        const by = cy + Math.sin(bAngle) * bulbRadius;

        // Chasing Marquee Pattern
        const bulbPhase = (i + Math.floor(this.marqueeOffset * 10)) % 3;
        const isLit = this.winner ? Math.sin(this.celebrationPulse * 4) > 0 : bulbPhase === 0;

        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);

        if (isLit) {
          ctx.fillStyle = '#FEF08A';
          ctx.shadowColor = '#FDE047';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#64748B';
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    drawCenterHub(ctx) {
      const cx = this.centerX;
      const cy = this.centerY;
      const hubR = Math.min(this.radius * 0.22, 54);

      ctx.save();

      // Hub Outer Drop Shadow
      ctx.beginPath();
      ctx.arc(cx, cy, hubR + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gold Medallion Rim
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      const rimGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, hubR);
      rimGrad.addColorStop(0, '#FEF08A');
      rimGrad.addColorStop(0.6, '#F59E0B');
      rimGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = rimGrad;
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Inner Core Disc
      ctx.beginPath();
      ctx.arc(cx, cy, hubR * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Golden Star Crest in Center (Zero Emoji)
      ctx.save();
      ctx.translate(cx, cy);
      const starPoints = 6;
      const outerR = hubR * 0.48;
      const innerR = hubR * 0.22;
      ctx.beginPath();
      for (let i = 0; i < starPoints * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / starPoints;
        const sx = Math.cos(a) * r;
        const sy = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    drawTopFlapper(ctx) {
      const cx = this.centerX;
      const cy = this.centerY;
      const topY = cy - this.radius;
      const pivotY = topY - 14;
      const L = 42;

      ctx.save();

      // 1. Heavy Brass Bracket Mount on Top Bezel
      ctx.beginPath();
      ctx.roundRect(cx - 22, topY - 34, 44, 26, 6);
      const bracketGrad = ctx.createLinearGradient(cx - 22, topY - 34, cx + 22, topY - 8);
      bracketGrad.addColorStop(0, '#92400E');
      bracketGrad.addColorStop(0.5, '#F59E0B');
      bracketGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = bracketGrad;
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Golden Mounting Screws (Left & Right)
      [-12, 12].forEach(ox => {
        ctx.beginPath();
        ctx.arc(cx + ox, topY - 22, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF08A';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      });

      // 2. Soft Dynamic Drop Shadow of the Flapper onto the Rim
      ctx.save();
      ctx.translate(cx + 3, pivotY + 4);
      ctx.rotate(this.flapperAngle * 0.9);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(2, L);
      ctx.lineTo(-2, L);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
      ctx.restore();

      // 3. Flexible Flapper Pointer Tongue
      ctx.save();
      ctx.translate(cx, pivotY);

      // Deflection with subtle organic curvature
      const phi = this.flapperAngle;
      ctx.rotate(phi);

      // Flapper Tongue Outline with realistic taper
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.quadraticCurveTo(5, L * 0.5, 2, L);
      ctx.lineTo(-2, L);
      ctx.quadraticCurveTo(-5, L * 0.5, -6, 0);
      ctx.closePath();

      // Ruby Red Gloss Gradient with depth
      const tongueGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      tongueGrad.addColorStop(0, '#B91C1C');
      tongueGrad.addColorStop(0.3, '#EF4444');
      tongueGrad.addColorStop(0.7, '#DC2626');
      tongueGrad.addColorStop(1, '#991B1B');
      ctx.fillStyle = tongueGrad;
      ctx.strokeStyle = '#450A0A';
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();

      // High-visibility golden spine / pointer indicator
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, L - 4);
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Reinforced Brass Contact Tip (strikes pegs)
      ctx.beginPath();
      ctx.arc(0, L - 3, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Center Polished Brass Pivot Bushing & Cap Screw
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      const pivotGrad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 6.5);
      pivotGrad.addColorStop(0, '#FFFBEB');
      pivotGrad.addColorStop(0.5, '#F59E0B');
      pivotGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = pivotGrad;
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Inner Screw Slot
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      ctx.restore();
    }

    getLeaderboard() {
      // In a wheel of fortune, the leader is the current wedge under the pointer
      if (this.participants.length === 0) return [];

      const N = this.participants.length;
      const sliceAngle = (Math.PI * 2) / N;
      const topPointerAngle = (Math.PI * 3) / 2;
      const relAngle = (topPointerAngle - this.currentAngle) % (Math.PI * 2);
      const normalizedAngle = relAngle < 0 ? relAngle + Math.PI * 2 : relAngle;
      const currentIdx = Math.floor(normalizedAngle / sliceAngle) % N;

      return [{ name: this.participants[currentIdx], rank: 1 }];
    }

    renderWinnerAvatar(winner) {
      // Mount Champion Wheel Avatar inside Winner Modal
      const container = document.getElementById('modalAvatarContainer');
      if (!container) return;

      container.innerHTML = `
        <div class="winner-wheel-illustration" style="position:relative; width:130px; height:120px; margin:0 auto;">
          <svg viewBox="0 0 140 120" width="130" height="110" fill="none">
            <!-- Golden Laurel Wreath (Zero Emoji) -->
            <ellipse cx="70" cy="58" rx="54" ry="46" stroke="#EAB308" stroke-width="4" stroke-dasharray="6,4" fill="none"/>
            <circle cx="28" cy="40" r="3" fill="#FEF08A"/>
            <circle cx="112" cy="40" r="3" fill="#FEF08A"/>

            <!-- Prize Wheel Graphic -->
            <circle cx="70" cy="58" r="36" fill="#1E1B4B" stroke="#CA8A04" stroke-width="3"/>
            <path d="M 70,58 L 70,22 A 36 36 0 0 1 95,32 Z" fill="#EF4444"/>
            <path d="M 70,58 L 95,32 A 36 36 0 0 1 106,58 Z" fill="#3B82F6"/>
            <path d="M 70,58 L 106,58 A 36 36 0 0 1 95,84 Z" fill="#10B981"/>
            <path d="M 70,58 L 95,84 A 36 36 0 0 1 70,94 Z" fill="#F59E0B"/>
            <path d="M 70,58 L 70,94 A 36 36 0 0 1 45,84 Z" fill="#8B5CF6"/>
            <path d="M 70,58 L 45,84 A 36 36 0 0 1 34,58 Z" fill="#EC4899"/>
            <path d="M 70,58 L 34,58 A 36 36 0 0 1 45,32 Z" fill="#06B6D4"/>
            <path d="M 70,58 L 45,32 A 36 36 0 0 1 70,22 Z" fill="#F97316"/>

            <!-- Center Gold Hub -->
            <circle cx="70" cy="58" r="10" fill="#FDE047" stroke="#B45309" stroke-width="2"/>
            <circle cx="70" cy="58" r="4" fill="#DC2626"/>

            <!-- Top Flapper -->
            <polygon points="70,18 64,8 76,8" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.5"/>
            <circle cx="70" cy="8" r="2.5" fill="#FEF08A"/>
          </svg>
        </div>
      `;
    }

    resize(width, height) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.centerX = width / 2;
      this.centerY = height / 2 + 10;
      this.radius = Math.min(width * 0.44, height * 0.42, 320);
    }
  }

  // Register with central GameRegistry
  if (window.gameRegistry) {
    window.gameRegistry.register('wheel-fortune', WheelFortuneGame, {
      name: 'Wheel of Fortune',
      description: 'Classic carnival spinning wheel with suspenseful clicking ticker and brass pegs',
      themeColor: '#D97706',
      icon: 'wheel',
      isAvailable: true
    });
  }

  // Export to global scope
  window.WheelFortuneGame = WheelFortuneGame;
  window.WHEEL_PALETTES = WHEEL_PALETTES;
})();
