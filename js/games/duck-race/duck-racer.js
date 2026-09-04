/**
 * Lucky Duck Race / Random Name Picker Platform
 * Game Module: DuckRacer Sprite & Physics
 * 
 * Manages individual duck attributes, color palettes, accessories,
 * sinusoidal bobbing, speed bursts, wake ripples, and canvas rendering.
 */

(function () {
  'use strict';

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
      this.radius = 26;
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

      // Border
      ctx.strokeStyle = this.isWinner ? '#d97706' : this.palette.stroke;
      ctx.lineWidth = this.isWinner ? 2.5 : 1.8;
      ctx.stroke();

      // Shadow
      ctx.shadowColor = this.isWinner ? 'rgba(217, 119, 6, 0.4)' : 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = this.isWinner ? 8 : 4;

      if (this.isWinner) {
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

  // Export
  window.DUCK_PALETTES = DUCK_PALETTES;
  window.ACCESSORIES = ACCESSORIES;
  window.DuckRacer = DuckRacer;
})();
