/**
 * Lucky Duck Race / Random Name Picker Platform
 * Game Module: Cosmic Rocket Odyssey - RocketRacer
 * 
 * Invariants Enforced:
 * - Rule 7: Fair straight starting line (y = startY)
 * - Rule 8: Name-only floating badge (strictly this.name, zero number prefixes)
 * - Rule 9: Straight-line vertical racing trajectory (this.x = this.startX, zero horizontal wandering)
 * - Zero-Emoji Policy: 100% vector canvas and procedural particle physics
 */

(function () {
  'use strict';

  const ROCKET_PALETTES = [
    { name: 'Cosmic Blue', body: '#E0F2FE', nose: '#0284C7', fins: '#0369A1', trim: '#38BDF8', glow: '#38BDF8' },
    { name: 'Crimson Comet', body: '#FEE2E2', nose: '#DC2626', fins: '#991B1B', trim: '#F87171', glow: '#F87171' },
    { name: 'Solar Flare', body: '#FEF3C7', nose: '#F59E0B', fins: '#D97706', trim: '#FBBF24', glow: '#FBBF24' },
    { name: 'Neon Emerald', body: '#DCFCE7', nose: '#16A34A', fins: '#15803D', trim: '#4ADE80', glow: '#4ADE80' },
    { name: 'Cosmic Violet', body: '#EDE9FE', nose: '#7C3AED', fins: '#6D28D9', trim: '#A78BFA', glow: '#C084FC' },
    { name: 'Starlight Gold', body: '#FEF08A', nose: '#CA8A04', fins: '#A16207', trim: '#FDE047', glow: '#FDE047' },
    { name: 'Cyber Cyan', body: '#CFFAFE', nose: '#0891B2', fins: '#0E7490', trim: '#22D3EE', glow: '#67E8F9' },
    { name: 'Magenta Pulse', body: '#FCE7F3', nose: '#DB2777', fins: '#BE185D', trim: '#F472B6', glow: '#F472B6' }
  ];

  class RocketRacer {
    constructor(name, index, totalRacers, palette = null) {
      this.name = name;
      this.index = index;
      this.totalRacers = totalRacers;

      // Color scheme
      if (palette) {
        this.palette = palette;
      } else {
        this.palette = ROCKET_PALETTES[index % ROCKET_PALETTES.length];
      }

      // Vertical track coordinates
      this.startX = 0;
      this.startY = 0;
      this.x = 0;
      this.y = 0;

      // Physics & Dynamics
      this.speed = 0;
      this.targetSpeed = 0;
      this.maxSpeed = 16 + Math.random() * 5;
      this.baseSpeed = 10 + Math.random() * 4;
      this.acceleration = 0.25;

      // Burst / Warp Boost mechanics
      this.boostTimer = 0;
      this.isBoosting = false;
      this.boostCooldown = 2.0 + Math.random() * 3.5;

      // Scale & Visuals
      this.scale = 1.0;
      this.flameFlicker = 0;
      this.thrusterParticles = [];

      // Finish State
      this.hasFinished = false;
      this.finishTime = 0;
    }

    reset(startX, startY, scale = 1.0) {
      this.startX = startX;
      this.startY = startY;
      // Strict Invariant 7: Fair straight starting line
      this.x = startX;
      this.y = startY;
      this.scale = scale;

      this.speed = 0;
      this.targetSpeed = 0;
      this.isBoosting = false;
      this.boostTimer = 0;
      this.boostCooldown = 1.5 + Math.random() * 3.0;
      this.thrusterParticles = [];
      this.hasFinished = false;
      this.finishTime = 0;
    }

    update(delta, deltaFactor, isRacing, finishLineY) {
      // Invariant 9: Strict straight vertical trajectory (zero horizontal lane wandering)
      this.x = this.startX;

      if (!isRacing) {
        this.speed = 0;
        this.isBoosting = false;
        return;
      }

      // If already crossed finish line, maintain cruising speed into docking orbit
      if (this.hasFinished) {
        this.speed = Math.max(5, this.speed * 0.985);
        this.y -= this.speed * deltaFactor;
        this.updateParticles(deltaFactor);
        return;
      }

      // Warp Boost AI Logic
      this.boostCooldown -= delta;
      if (this.boostCooldown <= 0 && !this.isBoosting && Math.random() < 0.035) {
        this.isBoosting = true;
        this.boostTimer = 1.2 + Math.random() * 1.0; // 1 to 2 seconds boost
        this.targetSpeed = this.maxSpeed * (1.35 + Math.random() * 0.25);
      }

      if (this.isBoosting) {
        this.boostTimer -= delta;
        if (this.boostTimer <= 0) {
          this.isBoosting = false;
          this.boostCooldown = 2.5 + Math.random() * 4.0;
          this.targetSpeed = this.baseSpeed * (0.95 + Math.random() * 0.25);
        }
      } else {
        // Natural speed variation / momentum shifts
        if (Math.random() < 0.04) {
          this.targetSpeed = this.baseSpeed * (0.85 + Math.random() * 0.4);
        }
      }

      // Accelerate towards target speed
      const accelRate = this.isBoosting ? 0.35 : 0.15;
      this.speed += (this.targetSpeed - this.speed) * accelRate * deltaFactor;

      // Advance upward (y decreases as rockets fly towards the top)
      this.y -= this.speed * deltaFactor;

      // Emit thruster particles
      this.emitParticles();
      this.updateParticles(deltaFactor);

      // Check finish line crossing
      if (this.y <= finishLineY && !this.hasFinished) {
        this.hasFinished = true;
        this.finishTime = performance.now();
      }
    }

    emitParticles() {
      // Emit exhaust smoke and glowing plasma sparks downwards
      const particleCount = this.isBoosting ? 3 : 1;
      const nozzleY = this.y + 28 * this.scale;
      const nozzleX = this.x;

      for (let i = 0; i < particleCount; i++) {
        const spreadX = (Math.random() - 0.5) * (8 * this.scale);
        const isSpark = Math.random() > 0.4;
        this.thrusterParticles.push({
          x: nozzleX + spreadX,
          y: nozzleY + Math.random() * 4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 4 + (this.speed * 0.4), // trails behind downward
          size: isSpark ? (Math.random() * 3 + 2) * this.scale : (Math.random() * 8 + 6) * this.scale,
          color: isSpark
            ? (this.isBoosting ? '#67E8F9' : (Math.random() > 0.5 ? '#FEF08A' : '#FF7825'))
            : (this.isBoosting ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.35)'),
          life: 1.0,
          decay: isSpark ? 0.05 + Math.random() * 0.04 : 0.03 + Math.random() * 0.02
        });
      }
    }

    updateParticles(deltaFactor) {
      for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
        const p = this.thrusterParticles[i];
        p.x += p.vx * deltaFactor;
        p.y += p.vy * deltaFactor;
        p.life -= p.decay * deltaFactor;
        p.size *= 0.985;
        if (p.life <= 0 || p.size <= 0.5) {
          this.thrusterParticles.splice(i, 1);
        }
      }
    }

    draw(ctx, cameraY) {
      const renderX = this.x;
      const renderY = this.y - cameraY;

      ctx.save();
      ctx.translate(renderX, renderY);
      ctx.scale(this.scale, this.scale);

      // 1. Draw Exhaust Flame
      this.drawExhaustFlame(ctx);

      // 2. Draw Warp Boost Shockwave / Halo
      if (this.isBoosting) {
        this.drawWarpHalo(ctx);
      }

      // 3. Draw Rocket Hull
      this.drawRocketBody(ctx);

      ctx.restore();

      // 4. Draw Trailing Exhaust Particles (rendered in world space coordinates)
      this.drawParticles(ctx, cameraY);

      // 5. Draw Name Badge (strictly name-only per Invariant 8)
      this.drawNameBadge(ctx, renderX, renderY);
    }

    drawExhaustFlame(ctx) {
      this.flameFlicker = (this.flameFlicker + 0.35) % (Math.PI * 2);
      const flickerFactor = 0.85 + Math.sin(this.flameFlicker) * 0.15;
      const boostMult = this.isBoosting ? 1.8 : 1.0;
      const flameLength = (16 + this.speed * 1.5) * flickerFactor * boostMult;

      ctx.save();

      // Outer Plasma Glow
      ctx.beginPath();
      ctx.moveTo(-7, 26);
      ctx.quadraticCurveTo(-10, 26 + flameLength * 0.6, 0, 26 + flameLength);
      ctx.quadraticCurveTo(10, 26 + flameLength * 0.6, 7, 26);
      ctx.closePath();
      ctx.fillStyle = this.isBoosting ? 'rgba(34, 211, 238, 0.75)' : 'rgba(249, 115, 22, 0.85)';
      ctx.shadowColor = this.isBoosting ? '#22D3EE' : '#F97316';
      ctx.shadowBlur = this.isBoosting ? 16 : 10;
      ctx.fill();

      // Inner Hot Flame Core
      ctx.beginPath();
      ctx.moveTo(-4, 26);
      ctx.quadraticCurveTo(-5, 26 + flameLength * 0.45, 0, 26 + flameLength * 0.75);
      ctx.quadraticCurveTo(5, 26 + flameLength * 0.45, 4, 26);
      ctx.closePath();
      ctx.fillStyle = this.isBoosting ? '#E0F2FE' : '#FEF08A';
      ctx.fill();

      ctx.restore();
    }

    drawWarpHalo(ctx) {
      ctx.save();
      const pulse = 1 + Math.sin(performance.now() * 0.015) * 0.15;

      // Sonic Cone Shockwave
      ctx.beginPath();
      ctx.moveTo(0, -38 * pulse);
      ctx.lineTo(-24 * pulse, 12);
      ctx.lineTo(24 * pulse, 12);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.restore();
    }

    drawRocketBody(ctx) {
      const p = this.palette;

      ctx.save();

      // Swept Delta Side Fins (Left & Right)
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(-22, 26);
      ctx.lineTo(-10, 24);
      ctx.closePath();
      ctx.fillStyle = p.fins;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.lineTo(22, 26);
      ctx.lineTo(10, 24);
      ctx.closePath();
      ctx.fillStyle = p.fins;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Thruster Bell Nozzle (Base)
      ctx.beginPath();
      ctx.moveTo(-7, 24);
      ctx.lineTo(-9, 28);
      ctx.lineTo(9, 28);
      ctx.lineTo(7, 24);
      ctx.closePath();
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Rocket Fuselage (Aerodynamic Body)
      ctx.beginPath();
      ctx.moveTo(0, -32); // Nose tip
      ctx.bezierCurveTo(14, -14, 13, 14, 10, 24);
      ctx.lineTo(-10, 24);
      ctx.bezierCurveTo(-13, 14, -14, -14, 0, -32);
      ctx.closePath();

      // Body Gradient Shading
      const bodyGrad = ctx.createLinearGradient(-12, 0, 12, 0);
      bodyGrad.addColorStop(0, p.body);
      bodyGrad.addColorStop(0.5, '#FFFFFF');
      bodyGrad.addColorStop(1, p.trim);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Nose Cone (Upper 35%)
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.bezierCurveTo(7, -22, 9, -15, 9, -10);
      ctx.lineTo(-9, -10);
      ctx.bezierCurveTo(-9, -15, -7, -22, 0, -32);
      ctx.closePath();
      ctx.fillStyle = p.nose;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();

      // Porthole Cockpit Window (Circular with Visor Gleam)
      ctx.beginPath();
      ctx.arc(0, 2, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0284C7';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();

      // Visor Glass Glare
      ctx.beginPath();
      ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // Center Dorsal Spine Fin
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 24);
      ctx.strokeStyle = p.fins;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    drawParticles(ctx, cameraY) {
      if (this.thrusterParticles.length === 0) return;
      ctx.save();
      for (const p of this.thrusterParticles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y - cameraY, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fill();
      }
      ctx.restore();
    }

    drawNameBadge(ctx, renderX, renderY) {
      ctx.save();

      // Invariant 8: Strictly student name only (zero number prefixes)
      const label = this.name;
      const isLargeClass = this.totalRacers > 15;
      const fontSize = isLargeClass ? 10 : 12;
      ctx.font = `700 ${fontSize}px Fredoka, sans-serif`;

      const textMetrics = ctx.measureText(label);
      const textW = textMetrics.width;
      const badgeW = Math.max(46, textW + 14);
      const badgeH = isLargeClass ? 18 : 22;

      // Position badge cleanly below the thruster nozzle
      const badgeX = renderX - badgeW / 2;
      const badgeY = renderY + (36 * this.scale);

      // Pill Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      // Pill Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
      ctx.fill();

      // Border matching rocket trim
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = this.palette.trim;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Label Text (Bright White)
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, renderX, badgeY + badgeH / 2 + 1);

      ctx.restore();
    }
  }

  // Export to global scope
  window.RocketRacer = RocketRacer;
  window.ROCKET_PALETTES = ROCKET_PALETTES;
})();
