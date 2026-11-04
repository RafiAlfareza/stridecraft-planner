/**
 * Strava API Integration Engine
 * Connects runner's Strava account to display past activities and sync running history
 * StrideCraft PRO / PelariMandiri
 */

const StravaEngine = {
  STORAGE_KEY_TOKEN: 'stridecraft_strava_token',
  STORAGE_KEY_ACTIVITIES: 'stridecraft_strava_activities',
  STORAGE_KEY_CONFIG: 'stridecraft_strava_config',

  state: {
    isConnected: false,
    athlete: null,
    accessToken: null,
    activities: []
  },

  init() {
    this.loadState();
  },

  loadState() {
    try {
      const savedToken = localStorage.getItem(this.STORAGE_KEY_TOKEN);
      const savedActivities = localStorage.getItem(this.STORAGE_KEY_ACTIVITIES);

      if (savedToken) {
        this.state.accessToken = savedToken;
        this.state.isConnected = true;
      }

      if (savedActivities) {
        this.state.activities = JSON.parse(savedActivities);
      } else {
        // Pre-populate realistic Strava run activities so user can see it right away!
        this.loadDemoActivities();
      }
    } catch (e) {
      console.warn('Error loading Strava state:', e);
      this.loadDemoActivities();
    }
  },

  saveState() {
    try {
      if (this.state.accessToken) {
        localStorage.setItem(this.STORAGE_KEY_TOKEN, this.state.accessToken);
      } else {
        localStorage.removeItem(this.STORAGE_KEY_TOKEN);
      }
      localStorage.setItem(this.STORAGE_KEY_ACTIVITIES, JSON.stringify(this.state.activities));
    } catch (e) {
      console.warn('Error saving Strava state:', e);
    }
  },

  /**
   * Seed realistic Strava activities for instant preview
   */
  loadDemoActivities() {
    this.state.activities = [
      {
        id: 1001,
        name: 'Sunday Long Run CFD Sudirman - Senayan',
        type: 'Run',
        distance: 14200, // 14.2 km
        moving_time: 4860, // 81 mins (1h 21m) -> pace 5:42/km
        elapsed_time: 5120,
        total_elevation_gain: 45,
        start_date_local: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.92, // m/s -> pace ~5:42
        max_speed: 4.1,
        average_heartrate: 148,
        max_heartrate: 165,
        kudos_count: 24,
        achievement_count: 3,
        location_city: 'Jakarta Pusat'
      },
      {
        id: 1002,
        name: 'GBK Track - Interval Session 6x800m',
        type: 'Run',
        distance: 8500, // 8.5 km
        moving_time: 2430, // 40m 30s -> pace 4:45/km
        elapsed_time: 2700,
        total_elevation_gain: 12,
        start_date_local: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        average_speed: 3.50,
        max_speed: 5.2,
        average_heartrate: 164,
        max_heartrate: 182,
        kudos_count: 31,
        achievement_count: 5,
        location_city: 'Stadion Utama GBK'
      },
      {
        id: 1003,
        name: 'Morning Easy Aerobic Shakeout',
        type: 'Run',
        distance: 6100, // 6.1 km
        moving_time: 2250, // 37m 30s -> pace 6:08/km
        elapsed_time: 2310,
        total_elevation_gain: 28,
        start_date_local: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.71,
        max_speed: 3.6,
        average_heartrate: 138,
        max_heartrate: 149,
        kudos_count: 18,
        achievement_count: 0,
        location_city: 'Kuningan, Jakarta'
      },
      {
        id: 1004,
        name: 'Lactate Threshold Tempo Run 25 Mins',
        type: 'Run',
        distance: 7800, // 7.8 km
        moving_time: 2340, // 39m -> pace 5:00/km
        elapsed_time: 2420,
        total_elevation_gain: 32,
        start_date_local: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        average_speed: 3.33,
        max_speed: 4.4,
        average_heartrate: 159,
        max_heartrate: 173,
        kudos_count: 27,
        achievement_count: 2,
        location_city: 'Monas Loop'
      },
      {
        id: 1005,
        name: 'Recovery Jog & Strides Sore Hari',
        type: 'Run',
        distance: 5000, // 5.0 km
        moving_time: 1950, // 32m 30s -> pace 6:30/km
        elapsed_time: 2050,
        total_elevation_gain: 15,
        start_date_local: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.56,
        max_speed: 4.8,
        average_heartrate: 132,
        max_heartrate: 145,
        kudos_count: 14,
        achievement_count: 1,
        location_city: 'Taman Suropati'
      }
    ];

    this.saveState();
  },

  /**
   * Connect using user's real Strava Access Token
   */
  connectWithToken(token) {
    if (!token || !token.trim()) return Promise.reject('Token Strava tidak boleh kosong.');
    const cleanToken = token.trim();

    return fetch('https://www.strava.com/api/v3/athlete/activities?per_page=15', {
      headers: {
        'Authorization': `Bearer ${cleanToken}`
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Gagal mengakses Strava API. Pastikan token masih aktif dan memiliki izin activity:read.');
      }
      return res.json();
    })
    .then(activities => {
      // Filter only running activities
      const runActivities = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');
      this.state.accessToken = cleanToken;
      this.state.isConnected = true;
      this.state.activities = runActivities.length > 0 ? runActivities : activities;
      this.saveState();
      return { success: true, count: this.state.activities.length };
    });
  },

  /**
   * Connect via Demo Mode
   */
  connectDemo() {
    this.state.isConnected = true;
    this.state.accessToken = 'demo_token_strava_preview';
    this.loadDemoActivities();
    this.saveState();
    return { success: true, count: this.state.activities.length };
  },

  /**
   * Disconnect Strava
   */
  disconnect() {
    this.state.isConnected = false;
    this.state.accessToken = null;
    this.saveState();
  },

  /**
   * Format helper: convert meters to km string
   */
  formatDistanceKm(meters) {
    if (!meters || isNaN(meters)) return '0.0 km';
    return (meters / 1000).toFixed(1) + ' km';
  },

  /**
   * Format helper: convert m/s to pace string "MM:SS /km"
   */
  formatPaceFromSpeed(speedMps) {
    if (!speedMps || speedMps <= 0) return '-:-- /km';
    const paceSec = 1000 / speedMps;
    const mins = Math.floor(paceSec / 60);
    const secs = Math.round(paceSec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)} /km`;
  },

  /**
   * Format helper: convert seconds to HH:MM:SS
   */
  formatDuration(seconds) {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  },

  /**
   * Format date into friendly Indonesian string
   */
  formatDateID(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  },

  /**
   * Get stats summary from Strava activities
   */
  getActivitiesSummary() {
    const runs = this.state.activities || [];
    const totalMeters = runs.reduce((sum, a) => sum + (a.distance || 0), 0);
    const totalSeconds = runs.reduce((sum, a) => sum + (a.moving_time || 0), 0);
    const totalKudos = runs.reduce((sum, a) => sum + (a.kudos_count || 0), 0);

    return {
      totalRuns: runs.length,
      totalKm: (totalMeters / 1000).toFixed(1),
      totalDurationFormatted: this.formatDuration(totalSeconds),
      totalKudos,
      avgDistanceKm: runs.length > 0 ? (totalMeters / 1000 / runs.length).toFixed(1) : 0
    };
  }
};

if (typeof module !== 'undefined') {
  module.exports = StravaEngine;
}
