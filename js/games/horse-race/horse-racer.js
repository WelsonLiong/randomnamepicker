/**
 * Random Name Picker Platform
 * Game Module: HorseRacer Sprite & Procedural Gallop Kinematics
 * 
 * Features:
 * - Parametric 4-joint leg articulation (Shoulder, Knee, Hip, Hock, Hoof)
 * - Zero gliding: Authentic 4-beat gallop gait with torso pitch and head surge
 * - Multi-layered thoroughbred coat palettes and jockey silks
 * - Dynamic turf dust particle physics
 * - Student name badge plaque and winner championship wreath
 */

(function () {
  'use strict';

  const HORSE_COATS = [
    { name: 'Bay', body: '#78350F', dark: '#451A03', mane: '#1C1917', legs: '#291407', blaze: false },
    { name: 'Chestnut', body: '#9A3412', dark: '#7C2D12', mane: '#C2410C', legs: '#7C2D12', blaze: true },
    { name: 'Black Stallion', body: '#1E1E24', dark: '#0F0F12', mane: '#09090B', legs: '#121216', blaze: false },
    { name: 'Dapple Grey', body: '#94A3B8', dark: '#64748B', mane: '#475569', legs: '#475569', blaze: false },
    { name: 'Palomino', body: '#F59E0B', dark: '#D97706', mane: '#FEF08A', legs: '#D97706', blaze: true },
    { name: 'Roan', body: '#881337', dark: '#4C0519', mane: '#370617', legs: '#4C0519', blaze: false },
    { name: 'Buckskin', body: '#D97706', dark: '#B45309', mane: '#18181B', legs: '#18181B', blaze: false },
    { name: 'Seal Brown', body: '#451A03', dark: '#291102', mane: '#170E04', legs: '#1C1917', blaze: false }
  ];

  const JOCKEY_SILKS = [
    { primary: '#2563EB', secondary: '#FFFFFF', name: 'Royal Blue' },
    { primary: '#DC2626', secondary: '#FEF08A', name: 'Scarlet Gold' },
    { primary: '#16A34A', secondary: '#FFFFFF', name: 'Emerald White' },
    { primary: '#9333EA', secondary: '#FDE047', name: 'Purple Star' },
    { primary: '#EA580C', secondary: '#0F172A', name: 'Tangerine Dark' },
    { primary: '#0891B2', secondary: '#FFFFFF', name: 'Cyan Wing' },
    { primary: '#CA8A04', secondary: '#78350F', name: 'Gold Bronze' },
    { primary: '#DB2777', secondary: '#FBCFE8', name: 'Magenta Rose' }
  ];

  class HorseRacer {
    constructor(id, name, index, total) {
      this.id = id;
      this.name = name;
      this.index = index;
      this.total = total || 20;
      this.saddleNumber = index + 1;

      // Coat and Silk styling
      const coatIdx = Math.abs(this.hashCode(name)) % HORSE_COATS.length;
      this.coat = HORSE_COATS[coatIdx];

      const silkIdx = Math.abs(this.hashCode(name + '_silk')) % JOCKEY_SILKS.length;
      this.silks = JOCKEY_SILKS[silkIdx];

      // Physical size and bounds
      this.width = 72;
      this.height = 48;
      this.radius = 28;

      this.x = 80;
      this.y = 100;
      this.startX = 80;
      this.startY = 100;
      this.targetY = 100;

      this.speed = 0;
      this.turboTimer = 0;

      // Gallop Kinematics State
      this.stridePhase = (Math.abs(this.hashCode(name)) % 100) * 0.06;
      this.strideRate = 0.22; // Speed of leg cycling
      this.bodyBob = 0;
      this.torsoPitch = 0;

      // Turf Dust Particles
      this.dustParticles = [];
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
      this.dustParticles = [];
      this.isWinner = false;
      this.stridePhase = 0;
    }

    update(deltaFactor, isRacing, trackLength, durationSecs) {
      if (isRacing) {
        // Calculate race speed scaled to selected duration
        const targetSpeed = (trackLength / (durationSecs * 60)) * (0.86 + Math.random() * 0.32);

        // Random gallop surge (spurt of energy)
        this.turboTimer -= 1;
        if (this.turboTimer <= 0) {
          if (Math.random() < 0.035) {
            this.turboTimer = Math.floor(45 + Math.random() * 55);
          }
        }

        const turboBoost = this.turboTimer > 0 ? 1.38 + Math.random() * 0.35 : 1.0;
        this.speed = targetSpeed * turboBoost;
        this.x += this.speed * deltaFactor;

        // Cycle gallop leg kinematics in direct proportion to forward speed!
        // This ensures the horse NEVER glides: faster forward speed = faster leg gallop
        this.strideRate = 0.18 + (this.speed / 18) * 0.22;
        this.stridePhase += this.strideRate * deltaFactor;

        // Pure straight line: lock horse to lane centerline (zero lane wandering)
        this.y = this.startY;

        // Emit turf dust particles when hooves strike
        if (Math.sin(this.stridePhase) > 0.8 && Math.random() < 0.6) {
          this.emitTurfDust();
        }
      } else {
        // Idling on the starting line: steady stance on the fair starting line
        this.stridePhase += 0.03 * deltaFactor;
        this.y = this.startY;
      }

      // Update dust particles
      for (let i = this.dustParticles.length - 1; i >= 0; i--) {
        const p = this.dustParticles[i];
        p.x += p.vx * deltaFactor;
        p.y += p.vy * deltaFactor;
        p.vy += 0.15 * deltaFactor; // gravity
        p.size *= 0.94;
        p.alpha -= 0.035 * deltaFactor;
        if (p.alpha <= 0 || p.size < 0.5) {
          this.dustParticles.splice(i, 1);
        }
      }
    }

    emitTurfDust() {
      const colors = ['#15803D', '#166534', '#854D0E', '#A16207', '#4D7C0F'];
      for (let i = 0; i < 3; i++) {
        this.dustParticles.push({
          x: this.x - 22 + (Math.random() - 0.5) * 8,
          y: this.y + 24 + Math.random() * 4,
          vx: -2 - Math.random() * 3,
          vy: -1 - Math.random() * 2.5,
          size: 3 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.75
        });
      }
    }

    draw(ctx, cameraX) {
      const renderX = this.x - cameraX;

      // Stride Phase calculations
      const phi = this.stridePhase;
      // Stable straight-line motion: steady level torso with subtle natural stride lift
      const bobHeight = this.speed > 0 ? Math.abs(Math.sin(phi)) * 1.0 : 0;
      const renderY = this.y - bobHeight;

      // 1. Draw Turf Dust Behind Hooves
      this.dustParticles.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
        ctx.restore();
      });

      // 2. Ground Shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(renderX, this.y + 27, 34, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(renderX, renderY);
      // Level torso without tilt rotation for pure horizontal straight-line sprinting

      // Victory Halo if winner
      if (this.isWinner) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, -2, 45, 32, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // ======================================================================
      // LAYER 1: FAR LEGS (Background / Left Legs)
      // ======================================================================
      ctx.save();
      ctx.fillStyle = this.coat.dark;
      ctx.strokeStyle = this.coat.dark;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Far Hindleg (offset stride)
      this.drawHindLeg(ctx, -20, 4, phi + 0.5, true);

      // Far Foreleg (offset stride)
      this.drawForeLeg(ctx, 16, 4, phi + 0.6, true);
      ctx.restore();

      // ======================================================================
      // LAYER 2: HORSE BODY, TAIL, HEAD, NECK
      // ======================================================================
      this.drawHorseBody(ctx, phi);

      // ======================================================================
      // LAYER 3: NEAR LEGS (Foreground / Right Legs)
      // ======================================================================
      ctx.save();
      ctx.fillStyle = this.coat.body;
      ctx.strokeStyle = this.coat.body;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';

      // Near Hindleg
      this.drawHindLeg(ctx, -18, 5, phi, false);

      // Near Foreleg
      this.drawForeLeg(ctx, 18, 5, phi + 0.15, false);
      ctx.restore();

      // ======================================================================
      // LAYER 4: JOCKEY IN SADDLE
      // ======================================================================
      this.drawJockey(ctx, phi);

      ctx.restore();

      // ======================================================================
      // LAYER 5: FLOATING STUDENT NAME BADGE
      // ======================================================================
      this.drawNameBadge(ctx, renderX, renderY - 34);
    }

    /**
     * Procedural Foreleg Gallop Kinematics:
     * Shoulder -> Knee -> Lower Leg -> Hoof
     */
    drawForeLeg(ctx, hipX, hipY, phase, isFar) {
      // Gallop reach and pull trigonometry
      const reach = Math.sin(phase);
      const upperAngle = reach * 0.55 + 0.2;
      const upperLen = 14;

      const kneeX = hipX + Math.sin(upperAngle) * upperLen;
      const kneeY = hipY + Math.cos(upperAngle) * upperLen;

      // Knee flexion: bends sharply during swing, straightens upon ground strike
      const bend = Math.max(0, -Math.cos(phase)) * 1.1;
      const lowerAngle = upperAngle - bend;
      const lowerLen = 14;

      const hoofX = kneeX + Math.sin(lowerAngle) * lowerLen;
      const hoofY = kneeY + Math.cos(lowerAngle) * lowerLen;

      // Draw Upper Leg
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();

      // Draw Lower Leg
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(hoofX, hoofY);
      ctx.stroke();

      // Draw Hoof (Dark Hoof Cap)
      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(hoofX, hoofY, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /**
     * Procedural Hindleg Gallop Kinematics:
     * Hip -> Hock (reverse angle) -> Cannon -> Hoof
     */
    drawHindLeg(ctx, hipX, hipY, phase, isFar) {
      // Rear push and gather trigonometry
      const thrust = Math.cos(phase);
      const thighAngle = thrust * 0.55 - 0.25;
      const thighLen = 15;

      const hockX = hipX + Math.sin(thighAngle) * thighLen;
      const hockY = hipY + Math.cos(thighAngle) * thighLen;

      // Hock bends backwards during forward gather, kicks straight during thrust
      const hockBend = Math.max(0, Math.sin(phase)) * 0.95;
      const cannonAngle = thighAngle + hockBend;
      const cannonLen = 15;

      const hoofX = hockX + Math.sin(cannonAngle) * cannonLen;
      const hoofY = hockY + Math.cos(cannonAngle) * cannonLen;

      // Draw Thigh
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hockX, hockY);
      ctx.stroke();

      // Draw Cannon / Hock
      ctx.beginPath();
      ctx.moveTo(hockX, hockY);
      ctx.lineTo(hoofX, hoofY);
      ctx.stroke();

      // Draw Hoof
      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(hoofX, hoofY, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawHorseBody(ctx, phase) {
      ctx.save();
      ctx.fillStyle = this.coat.body;
      ctx.strokeStyle = this.coat.dark;
      ctx.lineWidth = 2;

      // 1. Flowing Tail (waves in wind)
      const tailWave = Math.sin(phase * 1.5) * 6;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.quadraticCurveTo(-38, -6 + tailWave, -46, 6 + tailWave);
      ctx.quadraticCurveTo(-36, 12 + tailWave, -22, 6);
      ctx.closePath();
      ctx.fillStyle = this.coat.mane;
      ctx.fill();
      ctx.restore();

      // 2. Muscular Torso (Barrel)
      ctx.beginPath();
      ctx.ellipse(0, 3, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rump / Flank definition
      ctx.beginPath();
      ctx.arc(-16, 2, 12, 0, Math.PI * 2);
      ctx.fill();

      // Chest definition
      ctx.beginPath();
      ctx.arc(16, 2, 12, 0, Math.PI * 2);
      ctx.fill();

      // 3. Neck & Head (Reaches forward with speed surge)
      const headReach = Math.sin(phase) * 3;
      const neckX = 22 + headReach;
      const neckY = -6;

      ctx.beginPath();
      ctx.moveTo(12, 2);
      ctx.lineTo(neckX + 8, neckY - 14); // Poll (top of head)
      ctx.lineTo(neckX + 20, neckY - 10); // Muzzle tip
      ctx.lineTo(neckX + 16, neckY - 2);  // Jaw / Chin
      ctx.lineTo(16, 8); // Neck base
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cheerful White Blaze marking (if breed has one)
      if (this.coat.blaze) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(neckX + 10, neckY - 13);
        ctx.lineTo(neckX + 17, neckY - 8);
        ctx.lineTo(neckX + 13, neckY - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.coat.body;
      }

      // Pointy Horse Ears
      ctx.beginPath();
      ctx.moveTo(neckX + 6, neckY - 14);
      ctx.lineTo(neckX + 4, neckY - 21);
      ctx.lineTo(neckX + 9, neckY - 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Expressive Big Cute Eye
      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(neckX + 11, neckY - 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(neckX + 11.8, neckY - 10.8, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Flowing Mane (Waving along neck)
      ctx.save();
      ctx.fillStyle = this.coat.mane;
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.quadraticCurveTo(neckX - 4, neckY - 10 + Math.sin(phase) * 3, neckX + 6, neckY - 14);
      ctx.lineTo(neckX - 2, neckY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    drawJockey(ctx, phase) {
      ctx.save();
      const s = this.silks;

      // Saddle Cloth with Student Number
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 12, 3);
      ctx.fill();
      ctx.stroke();

      // Number on saddlecloth
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 8px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(this.saddleNumber), 0, 2);

      // Jockey Torso (crouched forward in aerodynamic racing form)
      ctx.fillStyle = s.primary;
      ctx.beginPath();
      ctx.ellipse(-2, -9, 8, 5, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = s.secondary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Jockey Cap & Goggles
      ctx.fillStyle = s.primary;
      ctx.beginPath();
      ctx.arc(4, -15, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cap Peak / Visor
      ctx.fillStyle = s.secondary;
      ctx.beginPath();
      ctx.moveTo(6, -16);
      ctx.lineTo(12, -15);
      ctx.lineTo(8, -13);
      ctx.closePath();
      ctx.fill();

      // Racing Goggles
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(5, -16, 4, 3);

      // Jockey Arm holding reins
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(10, -6);
      ctx.stroke();

      // Leather Reins connecting bit
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.lineTo(24, -9);
      ctx.stroke();

      ctx.restore();
    }

    drawNameBadge(ctx, x, y) {
      ctx.save();
      const compact = this.total > 15;
      ctx.font = this.isWinner
        ? (compact ? '700 12px Fredoka, sans-serif' : '700 13px Fredoka, sans-serif')
        : (compact ? '600 11px Fredoka, sans-serif' : '600 12px Fredoka, sans-serif');
      const text = this.name;
      const textWidth = ctx.measureText(text).width;
      const crownWidth = this.isWinner ? 14 : 0;
      const padX = this.isWinner ? 10 : 7;
      const badgeW = textWidth + crownWidth + padX * 2;
      const badgeH = this.isWinner ? 20 : (compact ? 16 : 18);

      // Plaque background
      ctx.fillStyle = this.isWinner ? '#FEF08A' : 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, badgeH / 2);
      ctx.fill();

      // Border matching jockey silk color or gold for winner
      ctx.strokeStyle = this.isWinner ? '#D97706' : this.silks.primary;
      ctx.lineWidth = this.isWinner ? 2.5 : 1.8;
      ctx.stroke();

      // Shadow
      ctx.shadowColor = this.isWinner ? 'rgba(217, 119, 6, 0.4)' : 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = this.isWinner ? 8 : 4;

      if (this.isWinner) {
        // Draw tiny vector crown for winner
        const crownX = x - badgeW / 2 + padX + 5;
        const crownY = y;
        ctx.fillStyle = '#D97706';
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

        ctx.fillStyle = '#78350F';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, crownX + 8, y);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
      }

      ctx.restore();
    }
  }

  // Export
  window.HORSE_COATS = HORSE_COATS;
  window.JOCKEY_SILKS = JOCKEY_SILKS;
  window.HorseRacer = HorseRacer;
})();
