/**
 * Lucky Duck Race / Random Name Picker Platform
 * Core Module: Game Engine Interface & Registry
 * 
 * Defines the standard lifecycle contract for all random name picker games
 * and provides a central registry to discover and switch games.
 */

(function () {
  'use strict';

  class BaseGame {
    constructor(id, name, options = {}) {
      this.id = id;
      this.name = name;
      this.options = options;
      this.canvas = null;
      this.ctx = null;
      this.app = null;
      this.participants = [];
      this.isRacing = false;
      this.winner = null;
      this.onFinishCallbacks = [];
    }

    /**
     * Called once when the game is mounted to the canvas.
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} appShell 
     */
    init(canvas, appShell) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.app = appShell;
    }

    /**
     * Update the participant roster for the game.
     * @param {Array<string>} names 
     */
    setParticipants(names) {
      this.participants = [...names];
    }

    /**
     * Start the race simulation.
     * @param {number} durationSecs 
     */
    startRace(durationSecs = 8) {
      this.isRacing = true;
      this.winner = null;
    }

    /**
     * Reset the game to starting idle state.
     */
    reset() {
      this.isRacing = false;
      this.winner = null;
    }

    /**
     * Update physics / animation state.
     * @param {number} timestamp 
     * @param {number} delta 
     * @param {number} deltaFactor 
     */
    update(timestamp, delta, deltaFactor) {
      // Override in subclass
    }

    /**
     * Render game frame to canvas.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    render(ctx, width, height) {
      // Override in subclass
    }

    /**
     * Handle canvas resize.
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
      // Override in subclass
    }

    /**
     * Return array of top leading participant objects or names for HUD.
     * @returns {Array<{name: string, rank: number}>}
     */
    getLeaderboard() {
      return [];
    }

    /**
     * Return current winner, if finished.
     */
    getWinner() {
      return this.winner;
    }

    /**
     * Hook to render or recolor the winner avatar inside the Winner Modal.
     * @param {Object|string} winner 
     */
    renderWinnerAvatar(winner) {
      // Override in subclass
    }

    /**
     * Register a callback triggered when a participant wins.
     * @param {Function} callback 
     */
    onFinished(callback) {
      if (typeof callback === 'function') {
        this.onFinishCallbacks.push(callback);
      }
    }

    triggerFinished(winner) {
      this.winner = winner;
      this.isRacing = false;
      this.onFinishCallbacks.forEach(cb => cb(winner));
    }
  }

  class GameRegistry {
    constructor() {
      this.games = new Map();
    }

    /**
     * Register a game class with metadata.
     * @param {string} id 
     * @param {Class} GameClass 
     * @param {Object} metadata 
     */
    register(id, GameClass, metadata = {}) {
      this.games.set(id, {
        id,
        GameClass,
        name: metadata.name || id,
        themeColor: metadata.themeColor || '#0284c7',
        description: metadata.description || '',
        icon: metadata.icon || 'star',
        isAvailable: metadata.isAvailable !== false
      });
    }

    get(id) {
      return this.games.get(id);
    }

    getAll() {
      return Array.from(this.games.values());
    }

    has(id) {
      return this.games.has(id);
    }

    create(id, canvas, appShell) {
      const entry = this.get(id);
      if (!entry) {
        throw new Error(`Game with ID "${id}" is not registered in GameRegistry.`);
      }
      const instance = new entry.GameClass(id, entry.name, entry);
      instance.init(canvas, appShell);
      return instance;
    }
  }

  // Export singleton and base class
  window.BaseGame = BaseGame;
  window.gameRegistry = new GameRegistry();
})();
