/**
 * Lucky Duck Race / Random Name Picker Platform
 * Core Module: RosterManager
 * 
 * Manages student rosters, localStorage persistence, class presets,
 * bulk text import/export, and teacher drawer interactions.
 */

(function () {
  'use strict';

  const MAX_STUDENTS = 100;
  const STORAGE_KEY = 'lucky_duck_classroom_names';
  const PRESETS_STORAGE_KEY = 'lucky_duck_classroom_presets';

  const SAMPLE_STUDENTS = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia',
    'Lucas', 'Ava', 'Mason', 'Isabella', 'Ethan',
    'Mia', 'Oliver', 'Harper', 'James', 'Charlotte',
    'Benjamin', 'Amelia', 'Henry', 'Evelyn', 'Alexander'
  ];

  class RosterManager {
    constructor(options = {}) {
      this.options = options;
      this.students = [];
      this.presets = this.loadPresets();
      this.onRosterChangedCallbacks = [];

      // DOM Elements
      this.headerStudentCount = document.getElementById('headerStudentCount');
      this.hubStudentCount = document.getElementById('hubStudentCount');
      this.drawerCountText = document.getElementById('drawerCountText');
      this.activeRacersCount = document.getElementById('activeRacersCount');
      this.limitBarFill = document.getElementById('limitBarFill');
      this.bulkNamesTextarea = document.getElementById('bulkNamesTextarea');
      this.studentChipsContainer = document.getElementById('studentChipsContainer');
      this.singleNameInput = document.getElementById('singleNameInput');
      this.addSingleNameBtn = document.getElementById('addSingleNameBtn');
      this.updateFromBulkBtn = document.getElementById('updateFromBulkBtn');
      this.loadSampleBtn = document.getElementById('loadSampleBtn');
      this.shuffleNamesBtn = document.getElementById('shuffleNamesBtn');
      this.clearAllNamesBtn = document.getElementById('clearAllNamesBtn');
      this.classPresetSelect = document.getElementById('classPresetSelect');
      this.newPresetNameInput = document.getElementById('newPresetNameInput');
      this.savePresetBtn = document.getElementById('savePresetBtn');
      this.deleteClassBtn = document.getElementById('deleteClassBtn');
      this.exportFileBtn = document.getElementById('exportFileBtn');
      this.importFileBtn = document.getElementById('importFileBtn');
      this.filePickerInput = document.getElementById('filePickerInput');
      this.teacherDrawer = document.getElementById('teacherDrawer');
      this.drawerBackdrop = document.getElementById('drawerBackdrop');
      this.toggleDrawerBtn = document.getElementById('toggleDrawerBtn');
      this.closeDrawerBtn = document.getElementById('closeDrawerBtn');

      this.init();
    }

    init() {
      this.bindEvents();
      this.loadRoster();
      this.populatePresetDropdown();
    }

    onRosterChanged(callback) {
      if (typeof callback === 'function') {
        this.onRosterChangedCallbacks.push(callback);
      }
    }

    notifyRosterChanged() {
      this.onRosterChangedCallbacks.forEach(cb => cb([...this.students]));
    }

    getStudents() {
      return [...this.students];
    }

    loadRoster() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.students = parsed.slice(0, MAX_STUDENTS);
            this.syncUI();
            this.notifyRosterChanged();
            return;
          }
        }
      } catch (e) {
        console.warn('LocalStorage error loading roster:', e);
      }

      // Default to sample students if empty
      this.students = [...SAMPLE_STUDENTS];
      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();
    }

    saveRoster() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.students));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }

    addStudent(name) {
      const cleanName = name.trim();
      if (!cleanName) return false;

      if (this.students.length >= MAX_STUDENTS) {
        if (this.options.showToast) {
          this.options.showToast(`Roster is full! Limit is ${MAX_STUDENTS} participants.`, 'warn');
        }
        return false;
      }

      this.students.push(cleanName);
      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();

      if (this.options.showToast) {
        this.options.showToast(`Added "${cleanName}" to the roster.`, 'success');
      }
      return true;
    }

    removeStudent(index) {
      if (index >= 0 && index < this.students.length) {
        const removed = this.students.splice(index, 1)[0];
        this.saveRoster();
        this.syncUI();
        this.notifyRosterChanged();
        if (this.options.showToast) {
          this.options.showToast(`Removed "${removed}" from the list.`, 'info');
        }
        return true;
      }
      return false;
    }

    removeStudentByName(name) {
      const idx = this.students.findIndex(s => s.toLowerCase() === name.toLowerCase());
      if (idx !== -1) {
        return this.removeStudent(idx);
      }
      return false;
    }

    setBulkNames(text) {
      const lines = text
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0 && !n.startsWith('#') && !n.match(/^(?:class\s*name|class|preset)\s*:/i));

      if (lines.length === 0) {
        if (this.options.showToast) {
          this.options.showToast('Please enter at least one name.', 'warn');
        }
        return false;
      }

      if (lines.length > MAX_STUDENTS) {
        if (this.options.showToast) {
          this.options.showToast(`Capped at the first ${MAX_STUDENTS} students!`, 'warn');
        }
        this.students = lines.slice(0, MAX_STUDENTS);
      } else {
        this.students = lines;
        if (this.options.showToast) {
          this.options.showToast(`Updated roster with ${this.students.length} students!`, 'success');
        }
      }

      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();
      this.closeDrawer();
      return true;
    }

    shuffle() {
      for (let i = this.students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.students[i], this.students[j]] = [this.students[j], this.students[i]];
      }
      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();
      if (this.options.showToast) {
        this.options.showToast('Participants shuffled into new lanes.', 'info');
      }
    }

    clear() {
      this.students = [];
      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();
      if (this.options.showToast) {
        this.options.showToast('Student roster cleared.', 'warn');
      }
    }

    loadSample() {
      this.students = [...SAMPLE_STUDENTS];
      this.saveRoster();
      this.syncUI();
      this.notifyRosterChanged();
      if (this.options.showToast) {
        this.options.showToast('Loaded sample class of 20 students.', 'success');
      }
    }

    syncUI() {
      const count = this.students.length;
      if (this.headerStudentCount) this.headerStudentCount.textContent = count;
      if (this.hubStudentCount) this.hubStudentCount.textContent = count;
      if (this.drawerCountText) this.drawerCountText.textContent = count;
      if (this.activeRacersCount) this.activeRacersCount.textContent = count;

      if (this.limitBarFill) {
        const pct = Math.min(100, (count / MAX_STUDENTS) * 100);
        this.limitBarFill.style.width = `${pct}%`;
        if (count >= MAX_STUDENTS) {
          this.limitBarFill.classList.add('maxed');
        } else {
          this.limitBarFill.classList.remove('maxed');
        }
      }

      if (this.bulkNamesTextarea) {
        this.bulkNamesTextarea.value = this.students.join('\n');
      }

      if (this.studentChipsContainer) {
        this.studentChipsContainer.innerHTML = '';
        this.students.forEach((name, idx) => {
          const chip = document.createElement('div');
          chip.className = 'student-chip';

          // Visual dot color
          const dotColor = this.options.getParticipantColor
            ? this.options.getParticipantColor(name)
            : '#38BDF8';

          chip.innerHTML = `
            <span class="chip-duck-dot" style="background:${dotColor};"></span>
            <span>${name}</span>
            <button class="chip-delete-btn" title="Remove student" data-index="${idx}">
              <svg viewBox="0 0 20 20" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round">
                <path d="M4 4l12 12M16 4L4 16"/>
              </svg>
            </button>
          `;
          this.studentChipsContainer.appendChild(chip);
        });

        this.studentChipsContainer.querySelectorAll('.chip-delete-btn').forEach(btn => {
          btn.addEventListener('click', e => {
            const index = parseInt(e.currentTarget.dataset.index, 10);
            this.removeStudent(index);
          });
        });
      }
    }

    // ========================================================================
    // CLASS PRESETS & FILE I/O
    // ========================================================================
    loadPresets() {
      try {
        const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Error loading presets:', e);
      }
      return { 'Default Class': [...SAMPLE_STUDENTS] };
    }

    savePresets() {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(this.presets));
      } catch (e) {
        console.warn('Error saving presets:', e);
      }
    }

    populatePresetDropdown(selectedKey = null) {
      if (!this.classPresetSelect) return;
      this.classPresetSelect.innerHTML = '';
      const keys = Object.keys(this.presets);
      keys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${k} (${this.presets[k].length} students)`;
        this.classPresetSelect.appendChild(opt);
      });

      if (selectedKey && this.presets[selectedKey]) {
        this.classPresetSelect.value = selectedKey;
      }
    }

    saveCurrentPreset(name) {
      if (this.students.length === 0) {
        if (this.options.showToast) {
          this.options.showToast('Please add student names before saving a class.', 'warn');
        }
        return;
      }
      this.presets[name] = [...this.students];
      this.savePresets();
      this.populatePresetDropdown(name);
      if (this.options.showToast) {
        this.options.showToast(`Saved class "${name}" (${this.students.length} students).`, 'success');
      }
    }

    loadSelectedPreset(name) {
      if (this.presets[name]) {
        this.students = [...this.presets[name]];
        this.saveRoster();
        this.syncUI();
        this.notifyRosterChanged();
        if (this.options.showToast) {
          this.options.showToast(`Loaded class "${name}".`, 'info');
        }
      }
    }

    deleteSelectedPreset() {
      if (!this.classPresetSelect) return;
      const selected = this.classPresetSelect.value;
      const keys = Object.keys(this.presets);
      if (keys.length <= 1) {
        if (this.options.showToast) {
          this.options.showToast('You must have at least one saved class.', 'warn');
        }
        return;
      }
      if (confirm(`Delete saved class "${selected}"?`)) {
        delete this.presets[selected];
        this.savePresets();
        const nextKey = Object.keys(this.presets)[0];
        this.populatePresetDropdown(nextKey);
        this.loadSelectedPreset(nextKey);
        if (this.options.showToast) {
          this.options.showToast(`Deleted class "${selected}".`, 'info');
        }
      }
    }

    exportToFile() {
      if (this.students.length === 0) {
        if (this.options.showToast) {
          this.options.showToast('No students to export.', 'warn');
        }
        return;
      }
      const currentClassName = (this.newPresetNameInput && this.newPresetNameInput.value.trim())
        || (this.classPresetSelect && this.classPresetSelect.value)
        || 'Default Class';
      const fileContent = `# Class: ${currentClassName}\r\n` + this.students.join('\r\n');
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeFilename = currentClassName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'classroom-roster';
      a.download = `${safeFilename}-list.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (this.options.showToast) {
        this.options.showToast(`Exported "${currentClassName}" to .txt file.`, 'success');
      }
    }

    importFromFile(file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target.result;
        if (!content || !content.trim()) {
          if (this.options.showToast) {
            this.options.showToast('The selected file is empty.', 'warn');
          }
          return;
        }

        const lines = content.split(/\r?\n/);
        let className = '';

        for (const line of lines) {
          const trimmed = line.trim();
          const match = trimmed.match(/^#?\s*(?:class\s*name|class|preset)\s*:\s*(.+)$/i);
          if (match && match[1].trim()) {
            className = match[1].trim().replace(/^[\["']+|[\]"']+$/g, '').slice(0, 30);
            break;
          }
        }

        if (!className) {
          className = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/-list$/i, '')
            .replace(/[_-]+/g, ' ')
            .trim()
            .slice(0, 30);
        }
        if (!className) className = 'Imported Class';

        const studentNames = lines
          .map(l => l.trim())
          .filter(l => l.length > 0 && !l.startsWith('#') && !l.match(/^(?:class\s*name|class|preset)\s*:/i));

        if (studentNames.length === 0) {
          if (this.options.showToast) {
            this.options.showToast('No student names found in file.', 'warn');
          }
          return;
        }

        if (studentNames.length > MAX_STUDENTS) {
          if (this.options.showToast) {
            this.options.showToast(`Capped at first ${MAX_STUDENTS} students!`, 'warn');
          }
          this.students = studentNames.slice(0, MAX_STUDENTS);
        } else {
          this.students = studentNames;
        }

        this.saveRoster();
        this.syncUI();
        this.notifyRosterChanged();

        this.presets[className] = [...this.students];
        this.savePresets();
        this.populatePresetDropdown(className);

        if (this.options.showToast) {
          this.options.showToast(`Imported "${className}" (${this.students.length} students).`, 'success');
        }
      };
      reader.readAsText(file);
    }

    openDrawer() {
      if (this.teacherDrawer) this.teacherDrawer.classList.add('open');
      if (this.drawerBackdrop) this.drawerBackdrop.classList.add('open');
    }

    closeDrawer() {
      if (this.teacherDrawer) this.teacherDrawer.classList.remove('open');
      if (this.drawerBackdrop) this.drawerBackdrop.classList.remove('open');
    }

    bindEvents() {
      if (this.toggleDrawerBtn) this.toggleDrawerBtn.addEventListener('click', () => this.openDrawer());
      const hubDrawerBtn = document.getElementById('hubDrawerBtn');
      if (hubDrawerBtn) hubDrawerBtn.addEventListener('click', () => this.openDrawer());
      if (this.closeDrawerBtn) this.closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
      if (this.drawerBackdrop) this.drawerBackdrop.addEventListener('click', () => this.closeDrawer());

      if (this.addSingleNameBtn && this.singleNameInput) {
        this.addSingleNameBtn.addEventListener('click', () => {
          this.addStudent(this.singleNameInput.value);
          this.singleNameInput.value = '';
          this.singleNameInput.focus();
        });

        this.singleNameInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            this.addStudent(this.singleNameInput.value);
            this.singleNameInput.value = '';
          }
        });
      }

      if (this.updateFromBulkBtn && this.bulkNamesTextarea) {
        this.updateFromBulkBtn.addEventListener('click', () => {
          this.setBulkNames(this.bulkNamesTextarea.value);
        });
      }

      if (this.loadSampleBtn) {
        this.loadSampleBtn.addEventListener('click', () => this.loadSample());
      }

      if (this.shuffleNamesBtn) {
        this.shuffleNamesBtn.addEventListener('click', () => this.shuffle());
      }

      if (this.clearAllNamesBtn) {
        this.clearAllNamesBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear all student names?')) {
            this.clear();
          }
        });
      }

      if (this.classPresetSelect) {
        this.classPresetSelect.addEventListener('change', () => {
          this.loadSelectedPreset(this.classPresetSelect.value);
        });
      }

      if (this.savePresetBtn && this.newPresetNameInput) {
        this.savePresetBtn.addEventListener('click', () => {
          const name = this.newPresetNameInput.value.trim();
          if (!name) {
            if (this.options.showToast) {
              this.options.showToast('Please enter a name for the class preset.', 'warn');
            }
            return;
          }
          this.saveCurrentPreset(name);
          this.newPresetNameInput.value = '';
        });
      }

      if (this.deleteClassBtn) {
        this.deleteClassBtn.addEventListener('click', () => this.deleteSelectedPreset());
      }

      if (this.exportFileBtn) {
        this.exportFileBtn.addEventListener('click', () => this.exportToFile());
      }

      if (this.importFileBtn && this.filePickerInput) {
        this.importFileBtn.addEventListener('click', () => this.filePickerInput.click());
        this.filePickerInput.addEventListener('change', e => {
          const file = e.target.files[0];
          if (file) {
            this.importFromFile(file);
            this.filePickerInput.value = '';
          }
        });
      }
    }
  }

  // Export to global scope
  window.RosterManager = RosterManager;
  window.MAX_STUDENTS = MAX_STUDENTS;
  window.SAMPLE_STUDENTS = SAMPLE_STUDENTS;
})();
