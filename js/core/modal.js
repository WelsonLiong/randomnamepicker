/**
 * Lucky Duck Race / Random Name Picker Platform
 * Core Module: Modal & Celebration System
 * 
 * Contains:
 * 1. ConfettiSystem: Canvas particle physics celebration engine.
 * 2. WinnerModal: Generic dialog coordinator with pluggable game avatar rendering.
 */

(function () {
  'use strict';

  class ConfettiSystem {
    constructor(canvas) {
      this.canvas = canvas || document.getElementById('confettiCanvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.active = false;
      this.animId = null;
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    start() {
      if (!this.canvas || !this.ctx) return;
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
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    loop() {
      if (!this.active || !this.ctx) return;
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

  class WinnerModal {
    constructor(options = {}) {
      this.options = options;
      this.winner = null;

      // DOM Elements
      this.overlay = document.getElementById('winnerModalOverlay');
      this.nameDisplay = document.getElementById('winnerNameDisplay');
      this.subtextDisplay = document.getElementById('winnerSubtext');
      this.closeBtn = document.getElementById('modalCloseBtn');
      this.removeBtn = document.getElementById('modalRemoveBtn');
      this.confetti = new ConfettiSystem(document.getElementById('confettiCanvas'));

      this.onRematchCallbacks = [];
      this.onRemoveWinnerCallbacks = [];

      this.bindEvents();
    }

    onRematch(callback) {
      if (typeof callback === 'function') this.onRematchCallbacks.push(callback);
    }

    onRemoveWinner(callback) {
      if (typeof callback === 'function') this.onRemoveWinnerCallbacks.push(callback);
    }

    show(winner, activeGame = null) {
      this.lastFocusedElement = document.activeElement;
      this.winner = winner;

      if (this.nameDisplay) {
        this.nameDisplay.textContent = typeof winner === 'object' ? winner.name : String(winner);
      }

      const duckEl = document.getElementById('modalDuckIllustration');
      const customEl = document.getElementById('modalCustomIllustration') || document.getElementById('modalHorseIllustration');

      if (activeGame && activeGame.id === 'wheel-fortune') {
        if (duckEl) duckEl.style.display = 'none';
        if (customEl) {
          customEl.style.display = 'block';
          activeGame.renderWinnerAvatar(winner);
        }
        if (this.subtextDisplay) {
          this.subtextDisplay.textContent = 'The Wheel of Fortune spun and landed on your name!';
        }
      } else if (activeGame && activeGame.id === 'rocket-race') {
        if (duckEl) duckEl.style.display = 'none';
        if (customEl) {
          customEl.style.display = 'block';
          activeGame.renderWinnerAvatar(winner);
        }
        if (this.subtextDisplay) {
          this.subtextDisplay.textContent = 'Blasted off to infinity and docked at the space station first!';
        }
      } else if (activeGame && activeGame.id === 'horse-race') {
        if (duckEl) duckEl.style.display = 'none';
        if (customEl) {
          customEl.style.display = 'block';
          activeGame.renderWinnerAvatar(winner);
        }
        if (this.subtextDisplay) {
          this.subtextDisplay.textContent = 'Galloped the fastest and crossed the finish line first!';
        }
      } else {
        if (duckEl) duckEl.style.display = 'block';
        if (customEl) customEl.style.display = 'none';
        if (activeGame && typeof activeGame.renderWinnerAvatar === 'function') {
          activeGame.renderWinnerAvatar(winner);
        } else if (winner && winner.palette) {
          this.recolorDuckAvatar(winner.palette);
        }
        if (this.subtextDisplay) {
          this.subtextDisplay.textContent = 'Paddled the fastest and crossed the finish line first!';
        }
      }

      if (this.overlay) {
        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');
      }
      this.confetti.start();
      if (this.closeBtn) {
        setTimeout(() => this.closeBtn.focus(), 50);
      }
    }

    recolorDuckAvatar(palette) {
      const bodyEl = document.getElementById('modalDuckBody');
      const tailEl = document.getElementById('modalDuckTail');
      const headEl = document.getElementById('modalDuckHead');
      const wingEl = document.getElementById('modalDuckWing');
      if (bodyEl) { bodyEl.setAttribute('fill', palette.body); bodyEl.setAttribute('stroke', palette.stroke); }
      if (tailEl) { tailEl.setAttribute('fill', palette.body); tailEl.setAttribute('stroke', palette.stroke); }
      if (headEl) { headEl.setAttribute('fill', palette.body); headEl.setAttribute('stroke', palette.stroke); }
      if (wingEl) { wingEl.setAttribute('fill', palette.wing); wingEl.setAttribute('stroke', palette.stroke); }
    }

    close() {
      if (this.overlay) {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');
      }
      this.confetti.stop();
      if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
        this.lastFocusedElement.focus();
      }
    }

    bindEvents() {
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => {
          const currentWinner = this.winner;
          this.close();
          this.onRematchCallbacks.forEach(cb => cb(currentWinner));
        });
      }

      if (this.removeBtn) {
        this.removeBtn.addEventListener('click', () => {
          const currentWinner = this.winner;
          this.close();
          this.onRemoveWinnerCallbacks.forEach(cb => cb(currentWinner));
        });
      }

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('active')) {
          const currentWinner = this.winner;
          this.close();
          this.onRematchCallbacks.forEach(cb => cb(currentWinner));
        }
      });

      if (this.overlay) {
        this.overlay.addEventListener('keydown', e => {
          if (e.key !== 'Tab') return;
          const focusables = [this.closeBtn, this.removeBtn].filter(Boolean);
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        });
      }
    }
  }

  // Export to global scope
  window.ConfettiSystem = ConfettiSystem;
  window.WinnerModal = WinnerModal;
})();
