/**
 * Random Name Picker Platform
 * Platform Application Shell (AppShell)
 * 
 * Orchestrates platform services:
 * - Landing Page Game Hub & Mode Switching
 * - RosterManager: Handles participant names, class presets, file sync, and drawer UI
 * - AudioManager: Handles race music (MP3 + synth fallback), gallop, quack, and SFX
 * - WinnerModal: Handles winner celebration, confetti, and exclusion logic
 * - GameRegistry: Multi-game lifecycle management (Duck Race, Horse Derby, etc.)
 */

(function () {
  'use strict';

  const DUCK_MASCOT_SVG = `
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
      <path d="M 10,24 Q 3,15 11,28 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="20" cy="25" rx="12" ry="8.5" fill="#FBBF24" stroke="#B45309" stroke-width="1.8"/>
      <path d="M 14,24 Q 19,19 24,23 Q 21,28 16,27 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
      <circle cx="26" cy="16.5" r="7.8" fill="#FBBF24" stroke="#B45309" stroke-width="1.8"/>
      <path d="M 31,16 Q 39,17 33,21 Q 30,20 31,16 Z" fill="#FF7825" stroke="#C2410C" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="28.5" cy="14.8" r="2.2" fill="#1E293B"/>
      <circle cx="29.2" cy="14.1" r="0.8" fill="#FFFFFF"/>
      <ellipse cx="25" cy="19" rx="2" ry="1.2" fill="#FB7185" opacity="0.65"/>
    </svg>
  `;

  const HORSE_MASCOT_SVG = `
    <svg viewBox="24 8 88 88" width="34" height="34" fill="none">
      <!-- Circular Turf Badge -->
      <circle cx="68" cy="52" r="42" fill="#15803D" stroke="#166534" stroke-width="3"/>
      
      <!-- Horse Body / Neck & Head -->
      <path d="M 38,82 C 40,65 52,50 68,48 L 78,28 L 94,34 L 88,48 C 96,56 98,72 88,82 Z" fill="#78350F" stroke="#451A03" stroke-width="3" stroke-linejoin="round"/>
      
      <!-- Horse Muzzle & Nose -->
      <ellipse cx="94" cy="38" rx="8" ry="6" fill="#451A03"/>
      
      <!-- Big Cute Friendly Eye -->
      <circle cx="82" cy="36" r="4.5" fill="#0F172A"/>
      <circle cx="83.5" cy="34.5" r="1.8" fill="#FFFFFF"/>
      
      <!-- Pointy Ears -->
      <path d="M 72,28 L 70,16 L 76,26 Z" fill="#78350F" stroke="#451A03" stroke-width="2.5"/>
      <path d="M 76,28 L 76,14 L 82,26 Z" fill="#78350F" stroke="#451A03" stroke-width="2.5"/>
      
      <!-- Flowing Mane -->
      <path d="M 66,32 C 60,38 58,52 52,62 L 62,56 C 68,48 70,38 66,32 Z" fill="#1C1917"/>
    </svg>
  `;

  const ROCKET_MASCOT_SVG = `
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
      <!-- Circular Cosmic Crest Badge -->
      <circle cx="20" cy="20" r="18" fill="#1E1B4B" stroke="#4F46E5" stroke-width="2"/>
      
      <!-- Exhaust Flame -->
      <path d="M 18,29 Q 20,36 22,29 Z" fill="#F59E0B"/>
      <path d="M 19,29 Q 20,33 21,29 Z" fill="#FEF08A"/>
      
      <!-- Side Fins -->
      <path d="M 16,22 L 11,27 L 16,26 Z" fill="#0369A1" stroke="#0F172A" stroke-width="1"/>
      <path d="M 24,22 L 29,27 L 24,26 Z" fill="#0369A1" stroke="#0F172A" stroke-width="1"/>
      
      <!-- Rocket Body -->
      <path d="M 20,7 C 25,14 24,24 23,27 L 17,27 C 16,24 15,14 20,7 Z" fill="#E0F2FE" stroke="#0F172A" stroke-width="1.5"/>
      
      <!-- Nose Cone -->
      <path d="M 20,7 C 22,12 23,15 23,17 L 17,17 C 17,15 18,12 20,7 Z" fill="#0284C7"/>
      
      <!-- Cockpit Visor -->
      <circle cx="20" cy="20" r="3" fill="#0284C7" stroke="#0F172A" stroke-width="1"/>
      <circle cx="19.2" cy="19.2" r="1.2" fill="#FFFFFF"/>
    </svg>
  `;

  class AppShell {
    constructor() {
      // DOM Elements - Views
      this.landingView = document.getElementById('landingView');
      this.gameArenaView = document.getElementById('gameArenaView');
      this.backToHubBtn = document.getElementById('backToHubBtn');
      this.hubStudentCount = document.getElementById('hubStudentCount');
      this.appContainer = document.getElementById('appContainer');

      // Arena Canvas
      this.canvas = document.getElementById('riverCanvas');
      this.ctx = this.canvas.getContext('2d');

      // Dynamic Branding Elements
      this.headerMainTitle = document.getElementById('headerMainTitle');
      this.headerSubtitle = document.getElementById('headerSubtitle');
      this.headerMascot = document.getElementById('headerMascot');
      this.startRaceBtnText = document.getElementById('startRaceBtnText');

      // Top HUD Controls
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundOnSvg = document.getElementById('soundOnSvg');
      this.soundOffSvg = document.getElementById('soundOffSvg');
      this.soundText = document.getElementById('soundText');
      this.fullscreenBtn = document.getElementById('fullscreenBtn');
      this.fullscreenText = document.getElementById('fullscreenText');
      this.fullscreenExpandSvg = document.getElementById('fullscreenExpandSvg');
      this.fullscreenCompressSvg = document.getElementById('fullscreenCompressSvg');
      this.bottomActionBar = document.getElementById('bottomActionBar');
      this.startRaceBtn = document.getElementById('startRaceBtn');
      this.resetRaceBtn = document.getElementById('resetRaceBtn');
      this.raceDurationSelect = document.getElementById('raceDurationSelect');
      this.gameSelectorSelect = document.getElementById('gameSelectorSelect');

      // HUD & Status
      this.raceStatusPill = document.getElementById('raceStatusPill');
      this.raceStatusText = document.getElementById('raceStatusText');
      this.leaderChips = document.getElementById('leaderChips');
      this.countdownOverlay = document.getElementById('countdownOverlay');
      this.countdownText = document.getElementById('countdownText');
      this.toastContainer = document.getElementById('toastContainer');

      // Core Platform Services
      this.sound = new AudioManager();
      this.winnerModal = new WinnerModal();

      this.roster = new RosterManager({
        showToast: (msg, type) => this.showToast(msg, type),
        getParticipantColor: (name) => this.getParticipantColor(name)
      });

      // Active Game Mode
      this.activeGameId = 'duck-race';
      this.activeGame = null;
      this.state = 'IDLE'; // 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'
      this.winner = null;
      this.ambientTimer = null;

      // Initialize
      this.initGameMode(this.activeGameId);
      this.bindEvents();
      this.showLanding(); // Start on Landing Page Hub
      this.resizeCanvas();

      window.addEventListener('resize', () => {
        this.resizeCanvas();
        if (this.winnerModal && this.winnerModal.confetti) {
          this.winnerModal.confetti.resize();
        }
      });

      // Render Loop
      this.lastTime = performance.now();
      requestAnimationFrame(time => this.renderLoop(time));
    }

    showLanding() {
      if (this.state === 'COUNTDOWN' || this.state === 'RACING') {
        this.resetRace();
      }
      this.sound.stopRaceMusic();
      if (this.ambientTimer) {
        clearInterval(this.ambientTimer);
        this.ambientTimer = null;
      }
      if (this.winnerModal) {
        this.winnerModal.close();
      }

      if (this.gameArenaView) this.gameArenaView.classList.add('hidden');
      if (this.landingView) this.landingView.classList.remove('hidden');

      if (this.hubStudentCount && this.roster) {
        this.hubStudentCount.textContent = this.roster.getStudents().length;
      }
    }

    launchGame(gameId) {
      if (!window.gameRegistry || !window.gameRegistry.has(gameId)) {
        this.showToast('That game mode is coming soon!', 'info');
        return;
      }

      if (this.landingView) this.landingView.classList.add('hidden');
      if (this.gameArenaView) this.gameArenaView.classList.remove('hidden');

      // Update Arena Branding
      if (gameId === 'horse-race') {
        if (this.headerMainTitle) this.headerMainTitle.textContent = 'Horse Derby Race!';
        if (this.headerSubtitle) this.headerSubtitle.textContent = 'Classroom Random Name Picker';
        if (this.headerMascot) this.headerMascot.innerHTML = HORSE_MASCOT_SVG;
        if (this.startRaceBtnText) this.startRaceBtnText.textContent = 'START HORSE DERBY!';
      } else if (gameId === 'rocket-race') {
        if (this.headerMainTitle) this.headerMainTitle.textContent = 'Cosmic Rocket Odyssey!';
        if (this.headerSubtitle) this.headerSubtitle.textContent = 'Classroom Random Name Picker';
        if (this.headerMascot) this.headerMascot.innerHTML = ROCKET_MASCOT_SVG;
        if (this.startRaceBtnText) this.startRaceBtnText.textContent = 'LAUNCH ROCKETS!';
      } else {
        if (this.headerMainTitle) this.headerMainTitle.textContent = 'Lucky Duck Race!';
        if (this.headerSubtitle) this.headerSubtitle.textContent = 'Classroom Random Name Picker';
        if (this.headerMascot) this.headerMascot.innerHTML = DUCK_MASCOT_SVG;
        if (this.startRaceBtnText) this.startRaceBtnText.textContent = 'START DUCK RACE!';
      }

      this.initGameMode(gameId);
      this.resetRace();
      this.resizeCanvas();

      const gameConfig = window.gameRegistry.get(gameId);
      const gameName = gameConfig ? gameConfig.name : 'Game';
      this.showToast(`Ready for ${gameName}!`, 'success');
    }

    initGameMode(gameId) {
      if (!window.gameRegistry || !window.gameRegistry.has(gameId)) {
        console.error(`Game "${gameId}" not found in GameRegistry.`);
        return;
      }

      // Cleanup old game if present
      if (this.activeGame && typeof this.activeGame.destroy === 'function') {
        this.activeGame.destroy();
      }

      this.activeGameId = gameId;
      this.activeGame = window.gameRegistry.create(gameId, this.canvas, this);

      // Connect roster to active game
      this.activeGame.setParticipants(this.roster.getStudents());

      // Listen for game finish
      this.activeGame.onFinished(winner => {
        this.finishRace(winner);
      });

      // Sync Roster Manager updates to active game
      this.roster.onRosterChanged(students => {
        if (this.hubStudentCount) {
          this.hubStudentCount.textContent = students.length;
        }
        if (this.activeGame && (this.state === 'IDLE' || this.state === 'FINISHED')) {
          this.activeGame.setParticipants(students);
        }
      });

      // Wire WinnerModal actions
      this.winnerModal.onRematch(() => {
        this.resetRace();
        this.showToast(`Kept "${this.winner ? this.winner.name : 'participant'}" in the roster.`, 'info');
      });

      this.winnerModal.onRemoveWinner(winner => {
        const winnerName = typeof winner === 'object' ? winner.name : String(winner);
        this.roster.removeStudentByName(winnerName);
        this.resetRace();
        this.showToast(`"${winnerName}" was removed from the roster.`, 'success');
      });

      // Sync sound button initial state
      this.syncSoundUI();
    }

    getParticipantColor(name) {
      if (this.activeGameId === 'rocket-race' && window.ROCKET_PALETTES) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = (hash << 5) - hash + name.charCodeAt(i);
          hash |= 0;
        }
        const p = window.ROCKET_PALETTES[Math.abs(hash) % window.ROCKET_PALETTES.length];
        return p.trim;
      }
      if (this.activeGameId === 'horse-race' && window.HORSE_COATS) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = (hash << 5) - hash + name.charCodeAt(i);
          hash |= 0;
        }
        const coat = window.HORSE_COATS[Math.abs(hash) % window.HORSE_COATS.length];
        return coat.body;
      }
      if (window.DUCK_PALETTES) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = (hash << 5) - hash + name.charCodeAt(i);
          hash |= 0;
        }
        const p = window.DUCK_PALETTES[Math.abs(hash) % window.DUCK_PALETTES.length];
        return p.body;
      }
      return '#38BDF8';
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.viewportWidth = rect.width;
      this.viewportHeight = rect.height;

      if (this.activeGame) {
        this.activeGame.resize(this.viewportWidth, this.viewportHeight);
      }
    }

    renderLoop(currentTime) {
      const delta = Math.min(32, currentTime - this.lastTime);
      const deltaFactor = delta / 16.666;
      this.lastTime = currentTime;

      // Update & Render active game
      if (this.activeGame) {
        this.activeGame.update(currentTime, delta, deltaFactor);
        this.activeGame.render(this.ctx, this.viewportWidth, this.viewportHeight);
        this.updateLeaderboardHUD(this.activeGame.getLeaderboard());
      }

      requestAnimationFrame(time => this.renderLoop(time));
    }

    updateLeaderboardHUD(leaders = []) {
      if (!this.leaderChips) return;
      if (!leaders || leaders.length === 0) {
        this.leaderChips.innerHTML = '<span class="leader-placeholder">Waiting for start...</span>';
        return;
      }

      this.leaderChips.innerHTML = leaders.map((d, i) => `
        <span class="leader-pill ${i === 0 ? 'leader-rank-1' : ''}">
          <span class="rank-num rank-${i + 1}">#${i + 1}</span>
          <span>${d.name}</span>
        </span>
      `).join('');
    }

    startRace() {
      const students = this.roster.getStudents();
      if (students.length === 0) {
        this.showToast('Please add at least 1 student name to race!', 'warn');
        this.roster.openDrawer();
        return;
      }

      if (this.state === 'COUNTDOWN' || this.state === 'RACING') {
        return;
      }

      // Unlock sound
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

      // Countdown sequence: 3 -> 2 -> 1 -> GO!
      this.countdownOverlay.classList.add('show');
      let count = 3;
      this.countdownText.textContent = count;
      this.sound.playCountdown(count, this.activeGameId);

      const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
          this.countdownText.textContent = count;
          this.sound.playCountdown(count, this.activeGameId);
        } else if (count === 0) {
          this.countdownText.textContent = this.activeGameId === 'rocket-race' ? 'BLAST OFF!' : (this.activeGameId === 'horse-race' ? 'GALLOP!' : 'QUACK!');
          this.sound.playCountdown('go', this.activeGameId);
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

      const durationSecs = parseFloat(this.raceDurationSelect.value) || 8;
      if (this.activeGame) {
        this.activeGame.startRace(durationSecs);
      }

      this.sound.playRaceMusic();

      // Ambient race SFX
      if (this.ambientTimer) clearInterval(this.ambientTimer);
      this.ambientTimer = setInterval(() => {
        if (this.state === 'RACING') {
          if (this.activeGameId === 'horse-race') {
            this.sound.playGallop();
          } else if (this.activeGameId === 'rocket-race') {
            this.sound.playRocketThruster();
          } else {
            this.sound.playSplash();
          }
        } else {
          clearInterval(this.ambientTimer);
          this.ambientTimer = null;
        }
      }, this.activeGameId === 'rocket-race' ? 220 : (this.activeGameId === 'horse-race' ? 240 : 1200));
    }

    finishRace(winner) {
      if (this.state === 'FINISHED') return;
      this.state = 'FINISHED';
      this.winner = winner;
      this.startRaceBtn.disabled = false;

      if (this.ambientTimer) {
        clearInterval(this.ambientTimer);
        this.ambientTimer = null;
      }

      const winnerName = typeof winner === 'object' ? winner.name : String(winner);
      this.updateStatusPill(`${winnerName} Crossed First!`, 'racing');

      this.sound.stopRaceMusic();
      this.sound.playVictory();

      this.showToast(`${winnerName} crossed the finish line first!`, 'success');

      // Suspense delay before showing victory modal
      setTimeout(() => {
        if (this.bottomActionBar) {
          this.bottomActionBar.classList.remove('hidden');
        }
        this.winnerModal.show(winner, this.activeGame);
      }, 2200);
    }

    resetRace() {
      this.state = 'IDLE';
      this.winner = null;
      this.sound.stopRaceMusic();
      if (this.ambientTimer) {
        clearInterval(this.ambientTimer);
        this.ambientTimer = null;
      }

      this.startRaceBtn.disabled = false;

      if (this.bottomActionBar) {
        this.bottomActionBar.classList.remove('hidden');
      }
      this.countdownOverlay.classList.remove('show');

      if (this.activeGame) {
        this.activeGame.reset();
      }

      this.updateStatusPill('Ready to Race!', 'idle');
      this.showToast('Reset to starting line.', 'info');
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

    syncSoundUI() {
      const on = this.sound.enabled;
      if (this.soundOnSvg) this.soundOnSvg.style.display = on ? 'inline' : 'none';
      if (this.soundOffSvg) this.soundOffSvg.style.display = on ? 'none' : 'inline';
      if (this.soundText) this.soundText.textContent = on ? 'Sound ON' : 'Sound OFF';
    }

    bindEvents() {
      // Race Trigger
      this.startRaceBtn.addEventListener('click', () => this.startRace());
      this.resetRaceBtn.addEventListener('click', () => this.resetRace());

      // Return to Game Selection Hub
      if (this.backToHubBtn) {
        this.backToHubBtn.addEventListener('click', () => this.showLanding());
      }

      // Game Card Launch Triggers
      document.querySelectorAll('.play-card-btn[data-game]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const gameId = e.currentTarget.dataset.game;
          if (gameId) this.launchGame(gameId);
        });
      });

      document.querySelectorAll('.game-card[data-game-id]').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.play-card-btn')) return;
          const gameId = card.dataset.gameId;
          if (gameId && !card.classList.contains('card-teaser')) {
            this.launchGame(gameId);
          }
        });
      });

      // Sound Toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const on = this.sound.toggle();
        this.syncSoundUI();
        this.showToast(on ? 'Sound effects enabled.' : 'Sound muted.', 'info');
      });

      // Fullscreen Toggle
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

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

      // Game Selector Dropdown (if present)
      if (this.gameSelectorSelect) {
        this.gameSelectorSelect.addEventListener('change', e => {
          const selectedId = e.target.value;
          if (selectedId && window.gameRegistry.has(selectedId)) {
            this.launchGame(selectedId);
          } else {
            this.showToast('That game mode is coming soon!', 'info');
            this.gameSelectorSelect.value = this.activeGameId;
          }
        });
      }
    }

    toggleFullscreen() {
      const doc = document;
      const el = document.documentElement;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

      if (!isFs) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) {
          req.call(el).catch(() => this.toggleWindowFallbackFullscreen());
        } else {
          this.toggleWindowFallbackFullscreen();
        }
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(doc).catch(() => {});
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

    showToast(message, type = 'info') {
      if (!this.toastContainer) return;
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

  // Launch on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppShell();
    window.duckRaceApp = window.app; // Backward compatibility alias
  });
})();
