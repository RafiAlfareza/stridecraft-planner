/**
 * StrideCraft App Controller & UI Logic
 * PelariMandiri - Running Training Program Generator
 */

const App = {
  // Current state
  state: {
    config: {
      targetDistance: 10,
      hours: 0,
      minutes: 49,
      seconds: 30,
      paceMinutes: 4,
      paceSeconds: 57,
      totalWeeks: 10,
      daysPerWeek: 4,
      fitnessLevel: 'intermediate',
      startDate: new Date().toISOString().split('T')[0]
    },
    program: null,
    activeWeekFilter: 'all', // 'all' or weekNumber (1, 2, ...)
    activeTypeFilter: 'ALL',  // 'ALL', 'EASY', 'TEMPO', 'INTERVAL', 'LONGRUN', 'STRENGTH'
    completedWorkouts: {},   // format: { 'w1-d2': true }
    activeModalWorkout: null,
    chartInstance: null
  },

  /**
   * Initialize App
   */
  init() {
    if (typeof AuthEngine !== 'undefined') {
      AuthEngine.init();
    }
    if (typeof StravaEngine !== 'undefined') {
      StravaEngine.init();
    }
    this.loadStateFromStorage();
    this.renderPresets();
    this.renderNavUser();
    this.bindEvents();
    this.syncPaceFromTime(); // initialize initial target pace calculation

    // Generate initial program
    this.handleGenerate();

    // Render Strava section
    this.renderStravaSection();

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  /**
   * Load saved completed workouts and config from localStorage
   */
  loadStateFromStorage() {
    try {
      const savedCompleted = localStorage.getItem('stridecraft_completed');
      if (savedCompleted) {
        this.state.completedWorkouts = JSON.parse(savedCompleted);
      }
      const savedConfig = localStorage.getItem('stridecraft_config');
      if (savedConfig) {
        this.state.config = { ...this.state.config, ...JSON.parse(savedConfig) };
        this.updateFormFieldsFromState();
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
  },

  saveStateToStorage() {
    try {
      localStorage.setItem('stridecraft_completed', JSON.stringify(this.state.completedWorkouts));
      localStorage.setItem('stridecraft_config', JSON.stringify(this.state.config));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  },

  /**
   * Update HTML inputs from current state
   */
  updateFormFieldsFromState() {
    const c = this.state.config;
    const distInput = document.getElementById('input-distance');
    const customDistInput = document.getElementById('input-custom-distance');
    const hrsInput = document.getElementById('input-hours');
    const minsInput = document.getElementById('input-minutes');
    const secsInput = document.getElementById('input-seconds');
    const paceMinsInput = document.getElementById('input-pace-minutes');
    const paceSecsInput = document.getElementById('input-pace-seconds');
    const weeksInput = document.getElementById('input-weeks');
    const daysInput = document.getElementById('input-days');
    const levelInput = document.getElementById('input-level');
    const startDateInput = document.getElementById('input-start-date');

    if (distInput) distInput.value = c.targetDistance;
    if (customDistInput) {
      customDistInput.value = c.targetDistance;
      const isPresetDist = [5, 10, 21.0975, 42.195].includes(Number(c.targetDistance));
      customDistInput.classList.toggle('hidden', isPresetDist);
    }

    if (hrsInput) hrsInput.value = c.hours;
    if (minsInput) minsInput.value = c.minutes;
    if (secsInput) secsInput.value = c.seconds;
    if (paceMinsInput) paceMinsInput.value = c.paceMinutes;
    if (paceSecsInput) paceSecsInput.value = c.paceSeconds;
    if (weeksInput) weeksInput.value = c.totalWeeks;
    if (daysInput) daysInput.value = c.daysPerWeek;
    if (levelInput) levelInput.value = c.fitnessLevel;
    if (startDateInput && c.startDate) startDateInput.value = c.startDate;

    this.updateDistancePillStyles(c.targetDistance);
  },

  /**
   * Render Preset Cards in the UI
   */
  renderPresets() {
    const container = document.getElementById('presets-list');
    if (!container) return;

    container.innerHTML = TrainingPresets.map(preset => `
      <div class="preset-card group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:shadow-md transition cursor-pointer"
           onclick="App.loadPreset('${preset.id}')">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold px-2 py-0.5 rounded-full text-white ${preset.badgeColor}">
            ${preset.badge}
          </span>
          <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
            ${preset.totalWeeks} Minggu • ${preset.daysPerWeek} Hari/Mg
          </span>
        </div>
        <h4 class="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
          ${preset.title}
        </h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          ${preset.description}
        </p>
        <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            ⏱ ${preset.targetTime}
          </span>
          <span class="font-mono text-slate-600 dark:text-slate-300">
            Pace ${preset.targetPace}/km
          </span>
        </div>
      </div>
    `).join('');
  },

  /**
   * Load Preset onto Form & Generate
   */
  loadPreset(presetId) {
    const preset = TrainingPresets.find(p => p.id === presetId);
    if (!preset) return;

    const timeSecs = PacingEngine.timeStringToSeconds(preset.targetTime);
    const hours = Math.floor(timeSecs / 3600);
    const minutes = Math.floor((timeSecs % 3600) / 60);
    const seconds = timeSecs % 60;

    const paceSecs = PacingEngine.timeStringToSeconds(preset.targetPace);
    const paceMinutes = Math.floor(paceSecs / 60);
    const paceSeconds = paceSecs % 60;

    this.state.config = {
      ...this.state.config,
      targetDistance: preset.distanceKm,
      hours,
      minutes,
      seconds,
      paceMinutes,
      paceSeconds,
      totalWeeks: preset.totalWeeks,
      daysPerWeek: preset.daysPerWeek,
      fitnessLevel: preset.level
    };

    this.updateFormFieldsFromState();
    this.handleGenerate();

    // Scroll smoothly to program results
    const resultsEl = document.getElementById('results-section');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Distance buttons
    document.querySelectorAll('[data-distance-btn]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dist = parseFloat(btn.dataset.distanceBtn);
        this.selectDistance(dist);
      });
    });

    // Custom distance input
    const customDistInput = document.getElementById('input-custom-distance');
    if (customDistInput) {
      customDistInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val && val > 0) {
          this.state.config.targetDistance = val;
          this.syncPaceFromTime();
        }
      });
    }

    // Target Time Inputs (Hours, Minutes, Seconds)
    ['input-hours', 'input-minutes', 'input-seconds'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.readTimeInputs();
          this.syncPaceFromTime();
        });
      }
    });

    // Target Pace Inputs (Minutes, Seconds)
    ['input-pace-minutes', 'input-pace-seconds'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.readPaceInputs();
          this.syncTimeFromPace();
        });
      }
    });

    // Total Weeks & Days per week
    const weeksInput = document.getElementById('input-weeks');
    if (weeksInput) {
      weeksInput.addEventListener('change', (e) => {
        this.state.config.totalWeeks = parseInt(e.target.value, 10);
      });
    }

    const daysInput = document.getElementById('input-days');
    if (daysInput) {
      daysInput.addEventListener('change', (e) => {
        this.state.config.daysPerWeek = parseInt(e.target.value, 10);
      });
    }

    const levelInput = document.getElementById('input-level');
    if (levelInput) {
      levelInput.addEventListener('change', (e) => {
        this.state.config.fitnessLevel = e.target.value;
      });
    }

    const startDateInput = document.getElementById('input-start-date');
    if (startDateInput) {
      startDateInput.addEventListener('change', (e) => {
        this.state.config.startDate = e.target.value;
      });
    }

    // Generate Button
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.handleGenerate();
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Export buttons
    const exportIcsBtn = document.getElementById('btn-export-ics');
    if (exportIcsBtn) {
      exportIcsBtn.addEventListener('click', () => this.handleExportCalendar());
    }

    const printBtn = document.getElementById('btn-print-plan');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    const resetBtn = document.getElementById('btn-reset-completed');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetCompleted());
    }

    // Modal close events
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseBtn = document.getElementById('btn-modal-close');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => this.closeWorkoutModal());
    }
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeWorkoutModal());
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeWorkoutModal();
      }
    });
  },

  /**
   * Distance Pill Selection
   */
  selectDistance(dist) {
    this.state.config.targetDistance = dist;
    const customDistInput = document.getElementById('input-custom-distance');

    if (dist === -1) {
      // Custom distance requested
      if (customDistInput) {
        customDistInput.classList.remove('hidden');
        customDistInput.focus();
        this.state.config.targetDistance = parseFloat(customDistInput.value) || 10;
      }
    } else {
      if (customDistInput) customDistInput.classList.add('hidden');
    }

    this.updateDistancePillStyles(dist);
    this.syncPaceFromTime();
  },

  updateDistancePillStyles(activeDist) {
    document.querySelectorAll('[data-distance-btn]').forEach(btn => {
      const btnDist = parseFloat(btn.dataset.distanceBtn);
      const isMatch = (btnDist === activeDist) || (btnDist === -1 && ![5, 10, 21.0975, 42.195].includes(activeDist));
      if (isMatch) {
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200', 'dark:bg-slate-800', 'dark:text-slate-300');
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-sm');
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-sm');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200', 'dark:bg-slate-800', 'dark:text-slate-300');
      }
    });
  },

  /**
   * Read time inputs from UI
   */
  readTimeInputs() {
    const hrs = parseInt(document.getElementById('input-hours')?.value, 10) || 0;
    const mins = parseInt(document.getElementById('input-minutes')?.value, 10) || 0;
    const secs = parseInt(document.getElementById('input-seconds')?.value, 10) || 0;
    this.state.config.hours = hrs;
    this.state.config.minutes = mins;
    this.state.config.seconds = secs;
  },

  /**
   * Read pace inputs from UI
   */
  readPaceInputs() {
    const mins = parseInt(document.getElementById('input-pace-minutes')?.value, 10) || 0;
    const secs = parseInt(document.getElementById('input-pace-seconds')?.value, 10) || 0;
    this.state.config.paceMinutes = mins;
    this.state.config.paceSeconds = secs;
  },

  /**
   * Sync Pace when Target Time changes
   */
  syncPaceFromTime() {
    const dist = this.state.config.targetDistance;
    const totalTimeSec = (this.state.config.hours * 3600) + (this.state.config.minutes * 60) + this.state.config.seconds;
    if (dist > 0 && totalTimeSec > 0) {
      const paceSec = Math.round(totalTimeSec / dist);
      const pMins = Math.floor(paceSec / 60);
      const pSecs = paceSec % 60;

      this.state.config.paceMinutes = pMins;
      this.state.config.paceSeconds = pSecs;

      const pMinsEl = document.getElementById('input-pace-minutes');
      const pSecsEl = document.getElementById('input-pace-seconds');
      if (pMinsEl) pMinsEl.value = pMins;
      if (pSecsEl) pSecsEl.value = pSecs;

      this.updateSpeedBadge(paceSec);
    }
  },

  /**
   * Sync Target Time when Pace changes
   */
  syncTimeFromPace() {
    const dist = this.state.config.targetDistance;
    const paceSec = (this.state.config.paceMinutes * 60) + this.state.config.paceSeconds;
    if (dist > 0 && paceSec > 0) {
      const totalTimeSec = Math.round(dist * paceSec);
      const hrs = Math.floor(totalTimeSec / 3600);
      const mins = Math.floor((totalTimeSec % 3600) / 60);
      const secs = totalTimeSec % 60;

      this.state.config.hours = hrs;
      this.state.config.minutes = mins;
      this.state.config.seconds = secs;

      const hrsEl = document.getElementById('input-hours');
      const minsEl = document.getElementById('input-minutes');
      const secsEl = document.getElementById('input-seconds');
      if (hrsEl) hrsEl.value = hrs;
      if (minsEl) minsEl.value = mins;
      if (secsEl) secsEl.value = secs;

      this.updateSpeedBadge(paceSec);
    }
  },

  updateSpeedBadge(paceSec) {
    const badge = document.getElementById('badge-calculated-speed');
    if (badge && paceSec > 0) {
      const kmh = (3600 / paceSec).toFixed(1);
      badge.textContent = `${kmh} km/jam`;
    }
  },

  /**
   * Main Generator Action
   */
  handleGenerate() {
    this.readTimeInputs();
    this.readPaceInputs();

    const dist = this.state.config.targetDistance;
    const timeSec = (this.state.config.hours * 3600) + (this.state.config.minutes * 60) + this.state.config.seconds;

    if (!dist || dist <= 0 || !timeSec || timeSec <= 0) {
      alert('Silakan masukkan target jarak dan waktu latihan yang valid!');
      return;
    }

    // Call the Generator
    const program = TrainingProgramGenerator.generateProgram({
      targetDistance: dist,
      targetTimeSeconds: timeSec,
      totalWeeks: this.state.config.totalWeeks,
      daysPerWeek: this.state.config.daysPerWeek,
      fitnessLevel: this.state.config.fitnessLevel,
      startDate: this.state.config.startDate
    });

    this.state.program = program;
    this.saveStateToStorage();

    // Render results
    this.renderProgramOverview();
    this.renderPacesCheatSheet();
    this.renderRaceSplits();
    this.renderProgressionChart();
    this.renderWeekFilterTabs();
    this.renderSchedule();
    this.updateProgressMetrics();

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  /**
   * Render High-Level Overview Metrics
   */
  renderProgramOverview() {
    const meta = this.state.program.metadata;
    const container = document.getElementById('overview-metrics-container');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <!-- Target Jarak -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Jarak</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            ${meta.targetDistance} <span class="text-sm font-medium text-slate-500">km</span>
          </p>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">${meta.targetDistanceName}</span>
        </div>

        <!-- Target Waktu -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Waktu Target</p>
          <p class="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ${meta.targetTimeFormatted}
          </p>
          <span class="text-xs text-slate-500 dark:text-slate-400">Finish Goal</span>
        </div>

        <!-- Target Pace -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Pace</p>
          <p class="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
            ${meta.targetPaceFormatted}
          </p>
          <span class="text-xs text-slate-500 dark:text-slate-400">${meta.speedKmH} km/jam</span>
        </div>

        <!-- Durasi Program -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Durasi Latihan</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            ${meta.totalWeeks} <span class="text-sm font-medium text-slate-500">Minggu</span>
          </p>
          <span class="text-xs text-slate-500 dark:text-slate-400">${meta.daysPerWeek} hari per minggu</span>
        </div>

        <!-- Total Volume -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Akumulasi</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            ~${meta.totalProgramKm} <span class="text-sm font-medium text-slate-500">km</span>
          </p>
          <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">Puncak: ${meta.peakWeekKm} km/mg</span>
        </div>

        <!-- Total Sesi -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sesi Latihan</p>
          <p class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            ${meta.totalRuns + meta.totalStrength} <span class="text-sm font-medium text-slate-500">sesi</span>
          </p>
          <span class="text-xs text-slate-500 dark:text-slate-400">${meta.totalRuns} Lari • ${meta.totalStrength} Strength</span>
        </div>
      </div>
    `;
  },

  /**
   * Render Training Paces Cheat Sheet & Splits
   */
  renderPacesCheatSheet() {
    const zones = this.state.program.zones;
    const p = zones.paces;
    const container = document.getElementById('paces-cheatsheet-container');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Easy Pace -->
        <div class="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Easy / Recovery</span>
            <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">E-Pace</span>
          </div>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${p.easy.rangeFormatted}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${p.easy.hrRange}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.easy.purpose}</p>
        </div>

        <!-- Steady / Marathon Pace -->
        <div class="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Marathon / Steady</span>
            <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">M-Pace</span>
          </div>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${p.marathon.formatted}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${p.marathon.hrRange}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.marathon.purpose}</p>
        </div>

        <!-- Threshold / Tempo Pace -->
        <div class="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Threshold / Tempo</span>
            <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">T-Pace</span>
          </div>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${p.tempo.rangeFormatted}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${p.tempo.hrRange}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.tempo.purpose}</p>
        </div>

        <!-- Interval VO2 Max Pace -->
        <div class="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Interval VO2 Max</span>
            <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">I-Pace</span>
          </div>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${p.interval.formatted}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${p.interval.hrRange}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.interval.purpose}</p>
        </div>

        <!-- Repetition Speed Pace -->
        <div class="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Repetition / Speed</span>
            <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">R-Pace</span>
          </div>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${p.repetition.formatted}
          </p>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${p.repetition.hrRange}</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.repetition.purpose}</p>
        </div>
      </div>

      <!-- Quick Track Splits Reference Bar -->
      <div class="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-700 dark:text-slate-300">
        <span class="font-sans font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <i data-lucide="gauge" class="w-3.5 h-3.5 text-emerald-500"></i> Split Target Interval (I-Pace):
        </span>
        <div class="flex flex-wrap gap-4">
          <span>400m: <strong class="text-emerald-600 dark:text-emerald-400">${PacingEngine.secondsToTimeString(zones.splits.split400m)}</strong></span>
          <span>800m: <strong class="text-emerald-600 dark:text-emerald-400">${PacingEngine.secondsToTimeString(zones.splits.split800m)}</strong></span>
          <span>1000m: <strong class="text-emerald-600 dark:text-emerald-400">${PacingEngine.secondsToTimeString(zones.splits.split1000m)}</strong></span>
        </div>
      </div>
    `;
  },

  /**
   * Render Race Splits Checkpoints Table
   */
  renderRaceSplits() {
    const container = document.getElementById('race-splits-container');
    if (!container || !this.state.program) return;

    const meta = this.state.program.metadata;
    const splits = PacingEngine.generateRaceSplits(meta.targetDistance, meta.targetTimeSeconds);

    if (splits.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <details class="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <summary class="p-4 cursor-pointer font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
          <div class="flex items-center gap-2">
            <i data-lucide="timer" class="w-4 h-4 text-emerald-500"></i>
            <span>Tabel Split Kilometer & Waktu Lari Target (${meta.targetDistanceName} @ Pace ${meta.targetPaceFormatted})</span>
          </div>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 group-open:rotate-180 transition transform">
            ▼
          </span>
        </summary>
        <div class="p-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <p class="text-xs text-slate-500 dark:text-slate-400 my-2">
            Gunakan tabel acuan ini pada jam tangan lari Anda untuk memeriksa apakah ritme lari tepat sasaran pada hari perlombaan:
          </p>
          <div class="max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                <tr>
                  <th class="py-2 px-3">Titik / Km</th>
                  <th class="py-2 px-3">Split per Km</th>
                  <th class="py-2 px-3">Total Waktu Kumulatif</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${splits.map(s => `
                  <tr class="${s.isMajorCheckpoint ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}">
                    <td class="py-2 px-3">${s.splitLabel}</td>
                    <td class="py-2 px-3">${s.splitTime}</td>
                    <td class="py-2 px-3 font-semibold">${s.cumulativeTime}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  /**
   * Render Chart.js Progression Graph
   */
  renderProgressionChart() {
    const canvas = document.getElementById('progression-chart');
    if (!canvas || !window.Chart) return;

    const weeks = this.state.program.weeks;
    const labels = weeks.map(w => `Mg ${w.weekNumber}`);
    const weeklyMileage = weeks.map(w => w.targetWeeklyMileage);
    const longRunMileage = weeks.map(w => w.longRunMileage);

    // Color bars based on phase
    const barColors = weeks.map(w => {
      if (w.isRaceWeek) return '#dc2626'; // red
      if (w.phase === 'Taper') return '#a855f7'; // purple
      if (w.phase === 'Peak') return '#ef4444'; // rose
      if (w.phase === 'Build') return '#f59e0b'; // amber
      return '#10b981'; // emerald
    });

    if (this.state.chartInstance) {
      this.state.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.state.chartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Long Run (km)',
            data: longRunMileage,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 2.5,
            pointBackgroundColor: '#2563eb',
            pointRadius: 4,
            tension: 0.25,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Total Jarak Mingguan (km)',
            data: weeklyMileage,
            backgroundColor: barColors,
            borderRadius: 6,
            borderSkipped: false,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              afterTitle: (items) => {
                const w = weeks[items[0].dataIndex];
                return `${w.phaseName} ${w.isRecoveryWeek ? '(Recovery Week)' : ''}`;
              },
              afterBody: (items) => {
                const w = weeks[items[0].dataIndex];
                return `Fokus: ${w.focusTitle}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Jarak (km)'
            },
            grid: {
              color: 'rgba(226, 232, 240, 0.6)'
            }
          }
        }
      }
    });
  },

  /**
   * Render Filter Tabs (All Weeks vs Individual Week)
   */
  renderWeekFilterTabs() {
    const container = document.getElementById('week-filter-tabs');
    if (!container) return;

    const weeks = this.state.program.weeks;

    let html = `
      <button class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${this.state.activeWeekFilter === 'all' ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
              onclick="App.setWeekFilter('all')">
        Tampilkan Semua Minggu (${weeks.length})
      </button>
    `;

    weeks.forEach(w => {
      const isSelected = this.state.activeWeekFilter === String(w.weekNumber);
      html += `
        <button class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
                onclick="App.setWeekFilter('${w.weekNumber}')">
          M${w.weekNumber} <span class="text-[10px] opacity-80">(${w.targetWeeklyMileage}k)</span>
        </button>
      `;
    });

    container.innerHTML = html;
  },

  setWeekFilter(filter) {
    this.state.activeWeekFilter = filter;
    this.renderWeekFilterTabs();
    this.renderSchedule();
  },

  setTypeFilter(type) {
    this.state.activeTypeFilter = type;
    document.querySelectorAll('[data-type-filter]').forEach(btn => {
      const bType = btn.dataset.typeFilter;
      if (bType === type) {
        btn.classList.add('bg-slate-900', 'text-white', 'dark:bg-emerald-500', 'dark:text-slate-900');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-slate-900', 'text-white', 'dark:bg-emerald-500', 'dark:text-slate-900');
        btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });
    this.renderSchedule();
  },

  /**
   * Render Weekly Breakdown and Day-by-Day Cards
   */
  renderSchedule() {
    const container = document.getElementById('schedule-container');
    if (!container || !this.state.program) return;

    const weeks = this.state.program.weeks;
    const activeFilter = this.state.activeWeekFilter;
    const typeFilter = this.state.activeTypeFilter;

    const filteredWeeks = (activeFilter === 'all')
      ? weeks
      : weeks.filter(w => String(w.weekNumber) === activeFilter);

    if (filteredWeeks.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">Tidak ada jadwal ditemukan.</div>`;
      return;
    }

    container.innerHTML = filteredWeeks.map(w => {
      // Filter workouts within week if type filter is active
      const visibleWorkouts = (typeFilter === 'ALL')
        ? w.schedule
        : w.schedule.filter(wo => wo.type === typeFilter);

      return `
        <div class="week-card rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-sm overflow-hidden mb-8">
          <!-- Week Header -->
          <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl font-mono font-bold text-base flex items-center justify-center text-white shadow-sm" style="background-color: ${w.phaseColor}">
                M${w.weekNumber}
              </span>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                    Minggu ke-${w.weekNumber}: ${w.focusTitle}
                  </h3>
                  <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" style="background-color: ${w.phaseBadgeBg}; color: ${w.phaseColor}">
                    ${w.phaseName}
                  </span>
                  ${w.isRecoveryWeek ? `<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">Recovery Week</span>` : ''}
                  ${w.isRaceWeek ? `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">RACE WEEK 🏁</span>` : ''}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ${w.focusDescription}
                </p>
              </div>
            </div>

            <!-- Weekly Stats Badges -->
            <div class="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
              <div class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                <i data-lucide="route" class="w-3.5 h-3.5 text-emerald-500"></i>
                <span class="font-bold text-slate-800 dark:text-slate-200">${w.targetWeeklyMileage} km</span>
              </div>
              <div class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                <i data-lucide="compass" class="w-3.5 h-3.5 text-blue-500"></i>
                <span>Long Run: <strong class="text-blue-600 dark:text-blue-400">${w.longRunMileage} km</strong></span>
              </div>
            </div>
          </div>

          <!-- 7-Day Grid -->
          <div class="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            ${w.schedule.map(workout => {
              const workoutId = `w${w.weekNumber}-d${workout.dayIndex}`;
              const isCompleted = !!this.state.completedWorkouts[workoutId];
              const isDimmed = typeFilter !== 'ALL' && workout.type !== typeFilter;

              return `
                <div class="workout-card rounded-xl border p-3 flex flex-col justify-between transition relative ${isCompleted ? 'completed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} ${isDimmed ? 'opacity-30' : ''}">
                  <div>
                    <!-- Day Title & Checkbox -->
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ${workout.dayName}
                      </span>
                      <label class="cursor-pointer flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 transition" title="Tandai Selesai">
                        <input type="checkbox"
                               class="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 w-3.5 h-3.5"
                               ${isCompleted ? 'checked' : ''}
                               onchange="App.toggleCompleted('${workoutId}', this.checked)">
                      </label>
                    </div>

                    <!-- Type Badge -->
                    <div class="mb-2">
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block" style="background-color: ${workout.typeBgColor}; color: ${workout.typeColor}">
                        ${workout.typeLabel}
                      </span>
                    </div>

                    <!-- Title -->
                    <h4 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug">
                      ${workout.title}
                    </h4>

                    <!-- Distance / Duration Badges -->
                    <div class="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-mono">
                      ${workout.distanceKm > 0 ? `
                        <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                          ${workout.distanceKm} km
                        </span>
                      ` : ''}
                      ${workout.estimatedTimeMinutes > 0 ? `
                        <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          ~${workout.estimatedTimeMinutes} mnt
                        </span>
                      ` : ''}
                    </div>

                    <!-- Pace & Intensity -->
                    <div class="mt-2 text-[11px] space-y-0.5 text-slate-500 dark:text-slate-400">
                      ${workout.targetPaceFormatted !== '-' ? `
                        <div class="flex items-center justify-between">
                          <span>Target:</span>
                          <strong class="font-mono text-emerald-600 dark:text-emerald-400">${workout.targetPaceFormatted}</strong>
                        </div>
                      ` : ''}
                      <div class="flex items-center justify-between">
                        <span>Effort:</span>
                        <span class="font-medium text-slate-700 dark:text-slate-300">${workout.rpe}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Action: View Detailed Menu Button -->
                  <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                    <button class="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center justify-center gap-1"
                            onclick='App.openWorkoutModal(${JSON.stringify(workout).replace(/'/g, "&#39;")}, ${w.weekNumber})'>
                      <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> Detail Menu
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  /**
   * Toggle completed status for a specific workout
   */
  toggleCompleted(workoutId, isChecked) {
    if (isChecked) {
      this.state.completedWorkouts[workoutId] = true;
      if (window.confetti) {
        window.confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } else {
      delete this.state.completedWorkouts[workoutId];
    }

    this.saveStateToStorage();
    this.renderSchedule();
    this.updateProgressMetrics();
  },

  /**
   * Reset all completed workouts
   */
  handleResetCompleted() {
    if (confirm('Apakah Anda yakin ingin mereset semua tanda selesai latihan?')) {
      this.state.completedWorkouts = {};
      this.saveStateToStorage();
      this.renderSchedule();
      this.updateProgressMetrics();
    }
  },

  /**
   * Update Progress percentage and stats
   */
  updateProgressMetrics() {
    if (!this.state.program) return;
    const weeks = this.state.program.weeks;

    let totalNonRestWorkouts = 0;
    let completedCount = 0;
    let completedKm = 0;

    weeks.forEach(w => {
      w.schedule.forEach(wo => {
        if (wo.type !== 'REST') {
          totalNonRestWorkouts++;
          const id = `w${w.weekNumber}-d${wo.dayIndex}`;
          if (this.state.completedWorkouts[id]) {
            completedCount++;
            completedKm += (wo.distanceKm || 0);
          }
        }
      });
    });

    const percent = totalNonRestWorkouts > 0 ? Math.round((completedCount / totalNonRestWorkouts) * 100) : 0;

    const barEl = document.getElementById('progress-bar-fill');
    const labelEl = document.getElementById('progress-percent-label');
    const countEl = document.getElementById('progress-count-label');

    if (barEl) barEl.style.width = `${percent}%`;
    if (labelEl) labelEl.textContent = `${percent}%`;
    if (countEl) countEl.textContent = `${completedCount} dari ${totalNonRestWorkouts} sesi selesai (~${Math.round(completedKm)} km)`;
  },

  /**
   * Open Detailed Workout Menu Modal
   */
  openWorkoutModal(workout, weekNumber) {
    this.state.activeModalWorkout = { ...workout, weekNumber };
    const modal = document.getElementById('workout-modal');
    const content = document.getElementById('modal-workout-content');
    if (!modal || !content) return;

    const workoutId = `w${weekNumber}-d${workout.dayIndex}`;
    const isCompleted = !!this.state.completedWorkouts[workoutId];

    content.innerHTML = `
      <!-- Modal Header -->
      <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full" style="background-color: ${workout.typeBgColor}; color: ${workout.typeColor}">
            ${workout.typeLabel}
          </span>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Minggu ke-${weekNumber} • ${workout.dayName}
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            ${workout.intensity}
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          ${workout.title}
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          ${workout.shortSummary}
        </p>

        <!-- Metric badges -->
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span class="text-[10px] block font-sans text-slate-400 uppercase">Target Jarak</span>
            <span class="text-base font-bold text-slate-900 dark:text-white">${workout.distanceKm > 0 ? workout.distanceKm + ' km' : 'N/A'}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span class="text-[10px] block font-sans text-slate-400 uppercase">Estimasi Waktu</span>
            <span class="text-base font-bold text-slate-900 dark:text-white">~${workout.estimatedTimeMinutes} menit</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span class="text-[10px] block font-sans text-slate-400 uppercase">Target Pace</span>
            <span class="text-base font-bold text-emerald-600 dark:text-emerald-400">${workout.targetPaceFormatted}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span class="text-[10px] block font-sans text-slate-400 uppercase">Tingkat Usaha (RPE)</span>
            <span class="text-base font-bold text-slate-900 dark:text-white">${workout.rpe}</span>
          </div>
        </div>
      </div>

      <!-- Modal Body: Step-by-Step Menu -->
      <div class="py-5 space-y-5">
        <!-- 1. Warm-Up -->
        ${workout.warmUp ? `
          <div class="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
            <div class="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm mb-1.5">
              <i data-lucide="flame" class="w-4 h-4"></i>
              <span>1. PEMANASAN (${workout.warmUp.duration})</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              ${workout.warmUp.details}
            </p>
          </div>
        ` : ''}

        <!-- 2. Main Set -->
        ${workout.mainSet ? `
          <div class="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                <i data-lucide="zap" class="w-4 h-4"></i>
                <span>2. MENU UTAMA: ${workout.mainSet.title}</span>
              </div>
            </div>

            ${workout.type === 'STRENGTH' && workout.mainSet.exercises ? `
              <!-- Strength Exercise Breakdown -->
              <div class="space-y-3 mt-3">
                ${workout.mainSet.exercises.map((ex, idx) => `
                  <div class="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        ${idx + 1}. ${ex.name}
                      </h5>
                      <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        ${ex.sets} • ${ex.reps}
                      </span>
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Target: <strong>${ex.targetMuscles}</strong></span> • <span>Istirahat: ${ex.rest}</span>
                    </div>
                    <p class="mt-1.5 text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-750 p-2 rounded">
                      💡 <strong>Petunjuk:</strong> ${ex.coachingCue}
                    </p>
                  </div>
                `).join('')}
              </div>
            ` : `
              <!-- Running Main Set Details -->
              <ul class="space-y-2 mt-2">
                ${(workout.mainSet.details || []).map(item => `
                  <li class="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span class="text-emerald-500 mt-0.5 font-bold">•</span>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            `}
          </div>
        ` : ''}

        <!-- 3. Cool-Down -->
        ${workout.coolDown ? `
          <div class="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
            <div class="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-bold text-sm mb-1.5">
              <i data-lucide="snowflake" class="w-4 h-4"></i>
              <span>3. PENDINGINAN (${workout.coolDown.duration})</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              ${workout.coolDown.details}
            </p>
          </div>
        ` : ''}

        <!-- 4. Coach's Notes -->
        ${workout.coachNotes ? `
          <div class="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs sm:text-sm">
            <i data-lucide="info" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"></i>
            <div class="text-slate-600 dark:text-slate-300">
              <strong class="font-bold text-slate-900 dark:text-white">Tips Pelatih:</strong>
              ${workout.coachNotes}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Modal Footer -->
      <div class="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <label class="cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input type="checkbox"
                 class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                 ${isCompleted ? 'checked' : ''}
                 onchange="App.toggleCompleted('${workoutId}', this.checked)">
          <span>Tandai Selesai Dilakukan</span>
        </label>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          ${workout.type !== 'REST' && workout.type !== 'STRENGTH' ? `
            <button class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
                    onclick="App.exportToFIT()" title="Download file asli Garmin (.fit) untuk copy ke folder GARMIN/NewFiles via USB kabel">
              <i data-lucide="watch" class="w-3.5 h-3.5"></i> Garmin (.fit)
            </button>
            <button class="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
                    onclick="App.exportToGarminJSON()" title="Download file Garmin Connect (.json) untuk ekstensi Garmin Workout Importer">
              <i data-lucide="file-code" class="w-3.5 h-3.5"></i> Garmin (.json)
            </button>
          ` : ''}
          <button class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5"
                  onclick="App.copyWorkoutSummary()">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin Menu
          </button>
          <button class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition"
                  onclick="App.closeWorkoutModal()">
            Tutup
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Re-initialize Lucide icons inside modal
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  closeWorkoutModal() {
    const modal = document.getElementById('workout-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  },

  /**
   * Copy Workout description to clipboard
   */
  copyWorkoutSummary() {
    const w = this.state.activeModalWorkout;
    if (!w) return;

    let text = `🏃 PROGRAM LATIHAN LARI - MINGGU ${w.weekNumber} (${w.dayName})\n`;
    text += `Judul: ${w.title}\n`;
    text += `Tipe: ${w.typeLabel} | Jarak: ${w.distanceKm} km | Pace Target: ${w.targetPaceFormatted} | RPE: ${w.rpe}\n\n`;

    if (w.warmUp) {
      text += `1. PEMANASAN (${w.warmUp.duration}):\n${w.warmUp.details}\n\n`;
    }
    if (w.mainSet) {
      text += `2. MENU UTAMA (${w.mainSet.title}):\n`;
      if (w.mainSet.details) {
        w.mainSet.details.forEach(d => text += `${d}\n`);
      }
      text += '\n';
    }
    if (w.coolDown) {
      text += `3. PENDINGINAN (${w.coolDown.duration}):\n${w.coolDown.details}\n\n`;
    }
    if (w.coachNotes) {
      text += `Tips Pelatih: ${w.coachNotes}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      alert('Menu latihan berhasil disalin ke clipboard!');
    }).catch(() => {
      alert('Gagal menyalin menu ke clipboard.');
    });
  },

  /**
   * Calendar Export Handler
   */
  handleExportCalendar() {
    if (!this.state.program) {
      alert('Silakan buat program latihan terlebih dahulu!');
      return;
    }
    CalendarExport.downloadICS(this.state.program, this.state.config.startDate);
  },

  /**
   * Export Active Workout to Native Garmin (.fit) format
   */
  exportToFIT() {
    const w = this.state.activeModalWorkout;
    if (!w || !this.state.program) return;
    if (typeof FITWorkoutGenerator !== 'undefined') {
      FITWorkoutGenerator.downloadFIT(w, this.state.program.zones);
    } else {
      alert('Modul FIT belum dimuat.');
    }
  },

  /**
   * Export Active Workout to Garmin Connect JSON (.json) format
   */
  exportToGarminJSON() {
    const w = this.state.activeModalWorkout;
    if (!w || !this.state.program) return;
    if (typeof GarminJSONExport !== 'undefined') {
      GarminJSONExport.downloadJSON(w, this.state.program.zones);
    } else {
      alert('Modul Garmin JSON belum dimuat.');
    }
  },

  /**
   * Export Active Workout to Garmin/Coros (.tcx) format
   */
  exportToTCX() {
    const w = this.state.activeModalWorkout;
    if (!w || !this.state.program) return;
    if (typeof TCXExport !== 'undefined') {
      TCXExport.downloadTCX(w, this.state.program.zones);
    } else {
      alert('Modul TCX belum dimuat.');
    }
  },

  /**
   * Smartwatch Connection Guide Modal
   */
  openSmartwatchGuide() {
    const modal = document.getElementById('smartwatch-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    }
  },

  closeSmartwatchGuide() {
    const modal = document.getElementById('smartwatch-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  },

  /**
   * Render User Session in Navigation Bar
   */
  renderNavUser() {
    const container = document.getElementById('nav-user-container');
    if (!container || typeof AuthEngine === 'undefined') return;

    const user = AuthEngine.state.currentUser;

    if (user) {
      const firstName = user.name.split(' ')[0];
      container.innerHTML = `
        <button onclick="App.openProfileModal()" class="flex items-center gap-2 py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 transition shadow-sm" title="Buka Profil Pelari">
          <img src="${user.avatar}" alt="${user.name}" class="w-6 h-6 rounded-lg object-cover border border-emerald-500">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-100 hidden sm:inline">${firstName}</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      `;
    } else {
      container.innerHTML = `
        <button onclick="App.openAuthModal()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
          <i data-lucide="user" class="w-3.5 h-3.5"></i>
          <span>Masuk / Profil</span>
        </button>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Auth Modal Handlers
   */
  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      this.switchAuthTab('login');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const tabLoginBtn = document.getElementById('tab-btn-login');
    const tabRegBtn = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
      if (tabLoginBtn) {
        tabLoginBtn.classList.add('border-emerald-500', 'text-slate-900', 'dark:text-white');
        tabLoginBtn.classList.remove('border-transparent', 'text-slate-400');
      }
      if (tabRegBtn) {
        tabRegBtn.classList.remove('border-emerald-500', 'text-slate-900', 'dark:text-white');
        tabRegBtn.classList.add('border-transparent', 'text-slate-400');
      }
    } else {
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
      if (tabRegBtn) {
        tabRegBtn.classList.add('border-emerald-500', 'text-slate-900', 'dark:text-white');
        tabRegBtn.classList.remove('border-transparent', 'text-slate-400');
      }
      if (tabLoginBtn) {
        tabLoginBtn.classList.remove('border-emerald-500', 'text-slate-900', 'dark:text-white');
        tabLoginBtn.classList.add('border-transparent', 'text-slate-400');
      }
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const errorEl = document.getElementById('login-error-msg');

    const result = AuthEngine.login(email, password);
    if (result.success) {
      if (errorEl) errorEl.classList.add('hidden');
      this.closeAuthModal();
      this.renderNavUser();
      this.openProfileModal();
      if (window.confetti) {
        window.confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
    } else {
      if (errorEl) {
        errorEl.textContent = result.message;
        errorEl.classList.remove('hidden');
      }
    }
  },

  handleDemoLogin() {
    const result = AuthEngine.loginDemo();
    if (result.success) {
      this.closeAuthModal();
      this.renderNavUser();
      this.openProfileModal();
      if (window.confetti) {
        window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }
    }
  },

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value;
    const email = document.getElementById('reg-email')?.value;
    const password = document.getElementById('reg-password')?.value;
    const age = document.getElementById('reg-age')?.value;
    const restingHR = document.getElementById('reg-resting-hr')?.value;
    const runningClub = document.getElementById('reg-club')?.value;
    const errorEl = document.getElementById('reg-error-msg');

    const result = AuthEngine.register({
      name,
      email,
      password,
      age,
      restingHR,
      runningClub
    });

    if (result.success) {
      if (errorEl) errorEl.classList.add('hidden');
      this.closeAuthModal();
      this.renderNavUser();
      this.openProfileModal();
      if (window.confetti) {
        window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      }
    } else {
      if (errorEl) {
        errorEl.textContent = result.message;
        errorEl.classList.remove('hidden');
      }
    }
  },

  handleLogout() {
    AuthEngine.logout();
    this.closeProfileModal();
    this.renderNavUser();
  },

  /**
   * Profile Modal Handlers
   */
  openProfileModal() {
    const user = AuthEngine.state.currentUser;
    if (!user) {
      this.openAuthModal();
      return;
    }

    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    // Header info
    document.getElementById('profile-avatar-img').src = user.avatar;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email + ' • Anggota sejak ' + user.memberSince;
    document.getElementById('profile-club-badge').textContent = user.runningClub || 'Independent Runner';
    document.getElementById('profile-bio').textContent = `"${user.bio || 'Pelari fokus pada konsistensi dan kemajuan.'}"`;

    // Overview Stats
    document.getElementById('p-stat-age').textContent = `${user.age} thn`;
    document.getElementById('p-stat-physique').textContent = `${user.weightKg} kg / ${user.heightCm} cm`;
    document.getElementById('p-stat-resthr').textContent = `${user.restingHR} BPM`;
    document.getElementById('p-stat-maxhr').textContent = `${user.maxHR} BPM`;

    // Active Program Info
    if (this.state.program) {
      const meta = this.state.program.metadata;
      document.getElementById('p-prog-title').textContent = `${meta.targetDistanceName} (Target: ${meta.targetTimeFormatted} @ Pace ${meta.targetPaceFormatted})`;
      const percent = document.getElementById('progress-percent-label')?.textContent || '0%';
      document.getElementById('p-prog-percent').textContent = percent;
      document.getElementById('p-prog-bar').style.width = percent;
    } else {
      document.getElementById('p-prog-title').textContent = 'Belum ada program yang dibuat';
      document.getElementById('p-prog-percent').textContent = '0%';
      document.getElementById('p-prog-bar').style.width = '0%';
    }

    // Achievements list
    const achContainer = document.getElementById('p-achievements-list');
    if (achContainer) {
      achContainer.innerHTML = (user.achievements || []).map(ach => `
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
          🏆 ${ach}
        </span>
      `).join('');
    }

    // Personalized Heart Rate Zones
    const hrData = AuthEngine.calculatePersonalizedHRZones();
    const hrContainer = document.getElementById('p-hr-zones-list');
    if (hrContainer && hrData) {
      hrContainer.innerHTML = hrData.zones.map(z => `
        <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${z.color}"></span>
            <div>
              <div class="flex items-center gap-2">
                <strong class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">${z.zone}: ${z.name}</strong>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${z.rangePct}</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">${z.desc}</p>
            </div>
          </div>
          <span class="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white shrink-0 ml-2">${z.bpmRange}</span>
        </div>
      `).join('');
    }

    // PBs & Shoes
    document.getElementById('p-pb-5k').textContent = user.pbs?.pb5k || '-';
    document.getElementById('p-pb-10k').textContent = user.pbs?.pb10k || '-';
    document.getElementById('p-pb-hm').textContent = user.pbs?.pbHm || '-';
    document.getElementById('p-pb-fm').textContent = user.pbs?.pbFm || '-';
    document.getElementById('p-shoes').textContent = user.shoes || 'Belum diisi';

    // Edit form fields prefilled
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-avatar').value = user.avatar;
    document.getElementById('edit-age').value = user.age;
    document.getElementById('edit-weight').value = user.weightKg;
    document.getElementById('edit-height').value = user.heightCm;
    document.getElementById('edit-rest-hr').value = user.restingHR;
    document.getElementById('edit-shoes').value = user.shoes || '';
    document.getElementById('edit-bio').value = user.bio || '';

    this.switchProfileTab('overview');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    if (window.lucide) window.lucide.createIcons();
  },

  closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  },

  switchProfileTab(tab) {
    const tabs = ['overview', 'hr', 'pbs', 'edit'];
    tabs.forEach(t => {
      const btn = document.getElementById(`p-tab-btn-${t}`);
      const content = document.getElementById(`p-tab-content-${t}`);
      if (t === tab) {
        if (btn) {
          btn.classList.add('bg-emerald-600', 'text-white');
          btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        }
        if (content) content.classList.remove('hidden');
      } else {
        if (btn) {
          btn.classList.remove('bg-emerald-600', 'text-white');
          btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        }
        if (content) content.classList.add('hidden');
      }
    });
  },

  handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name')?.value;
    const avatar = document.getElementById('edit-avatar')?.value;
    const age = document.getElementById('edit-age')?.value;
    const weightKg = document.getElementById('edit-weight')?.value;
    const heightCm = document.getElementById('edit-height')?.value;
    const restingHR = document.getElementById('edit-rest-hr')?.value;
    const shoes = document.getElementById('edit-shoes')?.value;
    const bio = document.getElementById('edit-bio')?.value;

    const result = AuthEngine.updateProfile({
      name,
      avatar,
      age,
      weightKg,
      heightCm,
      restingHR,
      shoes,
      bio
    });

    if (result.success) {
      alert('Profil berhasil diperbarui!');
      this.renderNavUser();
      this.openProfileModal();
    }
  },

  /**
   * Render Strava Activities Section
   */
  renderStravaSection() {
    if (typeof StravaEngine === 'undefined') return;

    const isConnected = StravaEngine.state.isConnected;
    const summary = StravaEngine.getActivitiesSummary();
    const activities = StravaEngine.state.activities || [];

    // Update status badge
    const badgeEl = document.getElementById('strava-status-badge');
    if (badgeEl) {
      if (isConnected) {
        badgeEl.className = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300';
        badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Terhubung';
      } else {
        badgeEl.className = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Belum Terhubung';
      }
    }

    // Summary cards
    const summaryContainer = document.getElementById('strava-summary-container');
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 font-mono">
          <span class="text-[10px] block font-sans text-slate-500 dark:text-slate-400 uppercase">Total Jarak Strava</span>
          <span class="text-xl font-bold text-orange-600 dark:text-orange-400">${summary.totalKm} <span class="text-xs font-normal">km</span></span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono">
          <span class="text-[10px] block font-sans text-slate-500 dark:text-slate-400 uppercase">Total Sesi Lari</span>
          <span class="text-xl font-bold text-slate-900 dark:text-white">${summary.totalRuns} <span class="text-xs font-normal">aktivitas</span></span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono">
          <span class="text-[10px] block font-sans text-slate-500 dark:text-slate-400 uppercase">Rata-rata per Sesi</span>
          <span class="text-xl font-bold text-slate-900 dark:text-white">${summary.avgDistanceKm} <span class="text-xs font-normal">km</span></span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono">
          <span class="text-[10px] block font-sans text-slate-500 dark:text-slate-400 uppercase">Total Kudos Diterima</span>
          <span class="text-xl font-bold text-amber-500 flex items-center gap-1">
            🧡 ${summary.totalKudos}
          </span>
        </div>
      `;
    }

    // Activities list
    const listContainer = document.getElementById('strava-activities-list');
    if (!listContainer) return;

    if (activities.length === 0) {
      listContainer.innerHTML = `
        <div class="col-span-full p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500">
          Belum ada aktivitas Strava. Klik "Pengaturan Strava" untuk memuat aktivitas Anda.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = activities.map(act => {
      const distStr = StravaEngine.formatDistanceKm(act.distance);
      const paceStr = StravaEngine.formatPaceFromSpeed(act.average_speed);
      const durStr = StravaEngine.formatDuration(act.moving_time);
      const dateStr = StravaEngine.formatDateID(act.start_date_local);

      return `
        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              📅 ${dateStr}
            </span>
            <span class="text-xs font-mono font-bold text-orange-500 flex items-center gap-0.5">
              🧡 ${act.kudos_count || 0}
            </span>
          </div>

          <h4 class="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 mb-2">
            ${act.name}
          </h4>

          <div class="grid grid-cols-3 gap-2 font-mono text-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-750">
              <span class="text-[9px] block font-sans text-slate-400">Jarak</span>
              <strong class="text-slate-900 dark:text-white font-bold">${distStr}</strong>
            </div>
            <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-750">
              <span class="text-[9px] block font-sans text-slate-400">Pace Avg</span>
              <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${paceStr}</strong>
            </div>
            <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-750">
              <span class="text-[9px] block font-sans text-slate-400">Durasi</span>
              <strong class="text-slate-900 dark:text-white font-bold">${durStr}</strong>
            </div>
          </div>

          <div class="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>❤️ ${act.average_heartrate ? Math.round(act.average_heartrate) + ' BPM' : 'N/A'}</span>
            <span>⛰️ +${act.total_elevation_gain || 0}m</span>
            <span>📍 ${act.location_city || 'Outdoor'}</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Strava Modal Handlers
   */
  openStravaModal() {
    const modal = document.getElementById('strava-modal');
    if (!modal) return;

    const isConnected = StravaEngine.state.isConnected;
    const statusText = document.getElementById('strava-modal-status-text');
    if (statusText) {
      statusText.textContent = isConnected ? 'Terhubung (Aktif)' : 'Belum Terhubung';
      statusText.className = isConnected ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-slate-400';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    if (window.lucide) window.lucide.createIcons();
  },

  closeStravaModal() {
    const modal = document.getElementById('strava-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  },

  handleStravaConnectDemo() {
    StravaEngine.connectDemo();
    this.closeStravaModal();
    this.renderStravaSection();
    if (window.confetti) {
      window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    }
    alert('Riwayat lari Strava berhasil dimuat ke StrideCraft!');
  },

  handleStravaConnectToken() {
    const token = document.getElementById('input-strava-token')?.value;
    if (!token) {
      alert('Harap masukkan Access Token Strava Anda.');
      return;
    }

    StravaEngine.connectWithToken(token)
      .then(res => {
        this.closeStravaModal();
        this.renderStravaSection();
        alert(`Berhasil terhubung ke Strava! ${res.count} aktivitas lari berhasil disinkronkan.`);
        if (window.confetti) {
          window.confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
        }
      })
      .catch(err => {
        alert(err.message || 'Gagal menghubungkan ke Strava.');
      });
  },

  handleStravaDisconnect() {
    if (confirm('Apakah Anda yakin ingin memutuskan hubungan dengan Strava?')) {
      StravaEngine.disconnect();
      this.closeStravaModal();
      this.renderStravaSection();
    }
  },

  refreshStravaActivities() {
    if (StravaEngine.state.accessToken && StravaEngine.state.accessToken !== 'demo_token_strava_preview') {
      this.handleStravaConnectToken();
    } else {
      StravaEngine.loadDemoActivities();
      this.renderStravaSection();
      alert('Riwayat lari Strava berhasil diperbarui!');
    }
  }
};

// Initialize App on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
