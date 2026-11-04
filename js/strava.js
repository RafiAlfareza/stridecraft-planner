/**
 * Strava API Integration Engine (Full OAuth 2.0 & Token Sync)
 * Connects runner's real Strava account to display past activities
 * StrideCraft PRO / PelariMandiri
 */

const StravaEngine = {
  STORAGE_KEY_TOKEN: 'stridecraft_strava_token',
  STORAGE_KEY_REFRESH: 'stridecraft_strava_refresh',
  STORAGE_KEY_ATHLETE: 'stridecraft_strava_athlete',
  STORAGE_KEY_ACTIVITIES: 'stridecraft_strava_activities',
  STORAGE_KEY_CLIENT_ID: 'stridecraft_strava_client_id',
  STORAGE_KEY_CLIENT_SECRET: 'stridecraft_strava_client_secret',

  state: {
    isConnected: false,
    athlete: null,
    accessToken: null,
    refreshToken: null,
    clientId: null,
    clientSecret: null,
    activities: []
  },

  init() {
    this.loadState();
    return this.checkOAuthCallback();
  },

  loadState() {
    try {
      const savedToken = localStorage.getItem(this.STORAGE_KEY_TOKEN);
      const savedRefresh = localStorage.getItem(this.STORAGE_KEY_REFRESH);
      const savedAthlete = localStorage.getItem(this.STORAGE_KEY_ATHLETE);
      const savedActivities = localStorage.getItem(this.STORAGE_KEY_ACTIVITIES);
      const savedClientId = localStorage.getItem(this.STORAGE_KEY_CLIENT_ID);
      const savedClientSecret = localStorage.getItem(this.STORAGE_KEY_CLIENT_SECRET);

      if (savedClientId) this.state.clientId = savedClientId;
      if (savedClientSecret) this.state.clientSecret = savedClientSecret;

      if (savedToken) {
        this.state.accessToken = savedToken;
        this.state.refreshToken = savedRefresh;
        this.state.isConnected = true;
      }

      if (savedAthlete) {
        this.state.athlete = JSON.parse(savedAthlete);
      }

      if (savedActivities) {
        this.state.activities = JSON.parse(savedActivities);
      } else {
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

      if (this.state.refreshToken) {
        localStorage.setItem(this.STORAGE_KEY_REFRESH, this.state.refreshToken);
      } else {
        localStorage.removeItem(this.STORAGE_KEY_REFRESH);
      }

      if (this.state.clientId) {
        localStorage.setItem(this.STORAGE_KEY_CLIENT_ID, this.state.clientId);
      }
      if (this.state.clientSecret) {
        localStorage.setItem(this.STORAGE_KEY_CLIENT_SECRET, this.state.clientSecret);
      }

      if (this.state.athlete) {
        localStorage.setItem(this.STORAGE_KEY_ATHLETE, JSON.stringify(this.state.athlete));
      } else {
        localStorage.removeItem(this.STORAGE_KEY_ATHLETE);
      }

      localStorage.setItem(this.STORAGE_KEY_ACTIVITIES, JSON.stringify(this.state.activities));
    } catch (e) {
      console.warn('Error saving Strava state:', e);
    }
  },

  /**
   * Check if page was redirected back from Strava with an authorization code
   */
  checkOAuthCallback() {
    if (typeof window === 'undefined' || !window.location) return Promise.resolve(false);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const scope = urlParams.get('scope');

    if (code) {
      const clientId = this.state.clientId || localStorage.getItem(this.STORAGE_KEY_CLIENT_ID);
      const clientSecret = this.state.clientSecret || localStorage.getItem(this.STORAGE_KEY_CLIENT_SECRET);

      if (!clientId || !clientSecret) {
        console.warn('Strava OAuth code received but Client ID or Secret is missing.');
        return Promise.resolve(false);
      }

      return this.exchangeOAuthToken(clientId, clientSecret, code)
        .then(() => {
          // Clean query parameters from URL
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return true;
        })
        .catch(err => {
          console.error('Error exchanging Strava token:', err);
          return false;
        });
    }

    return Promise.resolve(false);
  },

  /**
   * Start Strava Official OAuth Authorization Flow
   */
  startOAuthFlow(clientId, clientSecret) {
    if (!clientId || !clientSecret) {
      return { success: false, message: 'Harap masukkan Client ID dan Client Secret dari Strava.' };
    }

    this.state.clientId = clientId.trim();
    this.state.clientSecret = clientSecret.trim();
    this.saveState();

    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=auto&scope=read,activity:read_all`;

    window.location.href = authUrl;
    return { success: true };
  },

  /**
   * Exchange Authorization Code for Access & Refresh Tokens
   */
  exchangeOAuthToken(clientId, clientSecret, code) {
    return fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.message || 'Gagal menukarkan kode otorisasi Strava.');
        });
      }
      return res.json();
    })
    .then(data => {
      this.state.accessToken = data.access_token;
      this.state.refreshToken = data.refresh_token;
      this.state.athlete = data.athlete;
      this.state.isConnected = true;
      this.saveState();

      return this.fetchRealActivities();
    });
  },

  /**
   * Fetch real activities from Strava API v3
   */
  fetchRealActivities() {
    if (!this.state.accessToken) return Promise.reject('Token Strava tidak ada.');

    return fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', {
      headers: {
        'Authorization': `Bearer ${this.state.accessToken}`
      }
    })
    .then(res => {
      if (!res.ok) {
        // If token expired, try refresh
        if (res.status === 401 && this.state.refreshToken) {
          return this.refreshAccessToken().then(() => this.fetchRealActivities());
        }
        throw new Error('Gagal mengambil aktivitas dari Strava.');
      }
      return res.json();
    })
    .then(activities => {
      const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');
      this.state.activities = runs.length > 0 ? runs : activities;
      this.saveState();
      return this.state.activities;
    });
  },

  /**
   * Refresh expired token
   */
  refreshAccessToken() {
    if (!this.state.clientId || !this.state.clientSecret || !this.state.refreshToken) {
      return Promise.reject('Data refresh token tidak lengkap.');
    }

    return fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.state.clientId,
        client_secret: this.state.clientSecret,
        refresh_token: this.state.refreshToken,
        grant_type: 'refresh_token'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        this.state.accessToken = data.access_token;
        this.state.refreshToken = data.refresh_token;
        this.saveState();
        return data.access_token;
      }
      throw new Error('Gagal memperbarui token Strava.');
    });
  },

  /**
   * Connect using direct access token with activity:read_all
   */
  connectWithToken(token) {
    if (!token || !token.trim()) return Promise.reject('Token Strava tidak boleh kosong.');
    const cleanToken = token.trim();
    this.state.accessToken = cleanToken;

    return this.fetchRealActivities()
      .then(() => {
        this.state.isConnected = true;
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
    this.state.athlete = {
      firstname: 'Rafi',
      lastname: 'Alfareza',
      city: 'Jakarta',
      country: 'Indonesia'
    };
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
    this.state.refreshToken = null;
    this.state.athlete = null;
    this.saveState();
  },

  /**
   * Seed realistic Strava activities for preview
   */
  loadDemoActivities() {
    this.state.activities = [
      {
        id: 1001,
        name: 'Sunday Long Run CFD Sudirman - Senayan',
        type: 'Run',
        distance: 14200,
        moving_time: 4860,
        elapsed_time: 5120,
        total_elevation_gain: 45,
        start_date_local: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.92,
        max_speed: 4.1,
        average_heartrate: 148,
        max_heartrate: 165,
        kudos_count: 24,
        location_city: 'Jakarta Pusat'
      },
      {
        id: 1002,
        name: 'GBK Track - Interval Session 6x800m',
        type: 'Run',
        distance: 8500,
        moving_time: 2430,
        elapsed_time: 2700,
        total_elevation_gain: 12,
        start_date_local: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        average_speed: 3.50,
        max_speed: 5.2,
        average_heartrate: 164,
        max_heartrate: 182,
        kudos_count: 31,
        location_city: 'Stadion Utama GBK'
      },
      {
        id: 1003,
        name: 'Morning Easy Aerobic Shakeout',
        type: 'Run',
        distance: 6100,
        moving_time: 2250,
        elapsed_time: 2310,
        total_elevation_gain: 28,
        start_date_local: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.71,
        max_speed: 3.6,
        average_heartrate: 138,
        max_heartrate: 149,
        kudos_count: 18,
        location_city: 'Kuningan, Jakarta'
      },
      {
        id: 1004,
        name: 'Lactate Threshold Tempo Run 25 Mins',
        type: 'Run',
        distance: 7800,
        moving_time: 2340,
        elapsed_time: 2420,
        total_elevation_gain: 32,
        start_date_local: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        average_speed: 3.33,
        max_speed: 4.4,
        average_heartrate: 159,
        max_heartrate: 173,
        kudos_count: 27,
        location_city: 'Monas Loop'
      },
      {
        id: 1005,
        name: 'Recovery Jog & Strides Sore Hari',
        type: 'Run',
        distance: 5000,
        moving_time: 1950,
        elapsed_time: 2050,
        total_elevation_gain: 15,
        start_date_local: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
        average_speed: 2.56,
        max_speed: 4.8,
        average_heartrate: 132,
        max_heartrate: 145,
        kudos_count: 14,
        location_city: 'Taman Suropati'
      }
    ];

    this.saveState();
  },

  formatDistanceKm(meters) {
    if (!meters || isNaN(meters)) return '0.0 km';
    return (meters / 1000).toFixed(1) + ' km';
  },

  formatPaceFromSpeed(speedMps) {
    if (!speedMps || speedMps <= 0) return '-:-- /km';
    const paceSec = 1000 / speedMps;
    const mins = Math.floor(paceSec / 60);
    const secs = Math.round(paceSec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)} /km`;
  },

  formatDuration(seconds) {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  },

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
