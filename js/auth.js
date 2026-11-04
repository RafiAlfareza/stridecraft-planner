/**
 * Runner Authentication & Profile Management Engine
 * StrideCraft PRO / PelariMandiri
 */

const AuthEngine = {
  STORAGE_KEY_USERS: 'stridecraft_users',
  STORAGE_KEY_CURRENT: 'stridecraft_current_user',

  state: {
    currentUser: null,
    users: {}
  },

  init() {
    this.loadUsers();
    this.loadCurrentSession();
  },

  loadUsers() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_USERS);
      if (data) {
        this.state.users = JSON.parse(data);
      } else {
        // Seed default demo runner profile
        const demoUser = {
          id: 'runner-demo',
          name: 'Rafi Alfareza',
          email: 'rafi.alfareza@example.com',
          password: 'password123',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          memberSince: 'November 2026',
          age: 26,
          gender: 'Pria',
          weightKg: 65,
          heightCm: 173,
          restingHR: 52,
          maxHR: 194, // 220 - age or formula
          runningClub: 'Mandiri Runners',
          shoes: 'Nike Pegasus 40 & Saucony Endorphin Speed',
          pbs: {
            pb5k: '00:23:45',
            pb10k: '00:49:15',
            pbHm: '01:52:30',
            pbFm: '03:58:10'
          },
          bio: 'Pelari hobi yang bermimpi menembus Boston Marathon.',
          achievements: ['10K Finisher', 'Sub-2 HM Club', '100km Milestones']
        };
        this.state.users[demoUser.email.toLowerCase()] = demoUser;
        this.saveUsers();
      }
    } catch (e) {
      console.warn('Error loading users:', e);
      this.state.users = {};
    }
  },

  saveUsers() {
    try {
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(this.state.users));
    } catch (e) {
      console.warn('Error saving users:', e);
    }
  },

  loadCurrentSession() {
    try {
      const currentEmail = localStorage.getItem(this.STORAGE_KEY_CURRENT);
      if (currentEmail && this.state.users[currentEmail.toLowerCase()]) {
        this.state.currentUser = this.state.users[currentEmail.toLowerCase()];
      } else {
        // Auto-login demo user on first visit if no session exists
        const demoEmail = 'rafi.alfareza@example.com';
        if (this.state.users[demoEmail]) {
          this.state.currentUser = this.state.users[demoEmail];
          localStorage.setItem(this.STORAGE_KEY_CURRENT, demoEmail);
        }
      }
    } catch (e) {
      console.warn('Error loading current session:', e);
      this.state.currentUser = null;
    }
  },

  register(userData) {
    const email = userData.email.trim().toLowerCase();
    if (!email || !userData.name || !userData.password) {
      return { success: false, message: 'Harap isi nama, email, dan kata sandi.' };
    }

    if (this.state.users[email]) {
      return { success: false, message: 'Email sudah terdaftar. Silakan langsung masuk (login).' };
    }

    const age = parseInt(userData.age, 10) || 28;
    const maxHR = 208 - (0.7 * age); // Tanaka formula for max HR

    const newUser = {
      id: 'runner-' + Date.now(),
      name: userData.name.trim(),
      email: email,
      password: userData.password,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}`,
      memberSince: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      age: age,
      gender: userData.gender || 'Pria',
      weightKg: parseInt(userData.weightKg, 10) || 65,
      heightCm: parseInt(userData.heightCm, 10) || 170,
      restingHR: parseInt(userData.restingHR, 10) || 55,
      maxHR: Math.round(maxHR),
      runningClub: userData.runningClub || 'Independent Runner',
      shoes: userData.shoes || 'Daily Running Shoes',
      pbs: {
        pb5k: userData.pb5k || '-',
        pb10k: userData.pb10k || '-',
        pbHm: userData.pbHm || '-',
        pbFm: userData.pbFm || '-'
      },
      bio: userData.bio || 'Pelari pemula yang sedang giat berlatih.',
      achievements: ['Anggota Baru StrideCraft']
    };

    this.state.users[email] = newUser;
    this.saveUsers();
    this.login(email, userData.password);

    return { success: true, user: newUser };
  },

  login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.state.users[cleanEmail];

    if (!user) {
      return { success: false, message: 'Akun dengan email tersebut belum terdaftar.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Kata sandi tidak sesuai.' };
    }

    this.state.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY_CURRENT, cleanEmail);

    return { success: true, user };
  },

  loginDemo() {
    const demoEmail = 'rafi.alfareza@example.com';
    if (this.state.users[demoEmail]) {
      return this.login(demoEmail, 'password123');
    }
    return { success: false, message: 'Akun demo tidak ditemukan.' };
  },

  logout() {
    this.state.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_CURRENT);
  },

  updateProfile(updatedData) {
    if (!this.state.currentUser) return { success: false, message: 'Belum masuk ke akun.' };

    const email = this.state.currentUser.email.toLowerCase();
    const user = this.state.users[email];
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' };

    // Update user properties
    const age = parseInt(updatedData.age, 10) || user.age;
    const maxHR = 208 - (0.7 * age);

    this.state.users[email] = {
      ...user,
      name: updatedData.name || user.name,
      avatar: updatedData.avatar || user.avatar,
      age: age,
      gender: updatedData.gender || user.gender,
      weightKg: parseInt(updatedData.weightKg, 10) || user.weightKg,
      heightCm: parseInt(updatedData.heightCm, 10) || user.heightCm,
      restingHR: parseInt(updatedData.restingHR, 10) || user.restingHR,
      maxHR: Math.round(maxHR),
      runningClub: updatedData.runningClub || user.runningClub,
      shoes: updatedData.shoes || user.shoes,
      bio: updatedData.bio || user.bio,
      pbs: {
        ...user.pbs,
        ...(updatedData.pbs || {})
      }
    };

    this.state.currentUser = this.state.users[email];
    this.saveUsers();

    return { success: true, user: this.state.currentUser };
  },

  /**
   * Calculate personalized Karvonen Heart Rate Zones for the current runner
   */
  calculatePersonalizedHRZones() {
    const user = this.state.currentUser;
    if (!user) return null;

    const maxHR = user.maxHR || (208 - (0.7 * (user.age || 26)));
    const restHR = user.restingHR || 55;
    const hrr = maxHR - restHR; // Heart Rate Reserve

    const calcBPM = (pct) => Math.round(restHR + (hrr * pct));

    return {
      maxHR: Math.round(maxHR),
      restHR: Math.round(restHR),
      hrr: Math.round(hrr),
      zones: [
        {
          zone: 'Zone 1',
          name: 'Active Recovery',
          rangePct: '< 60% HRR',
          bpmRange: `< ${calcBPM(0.60)} BPM`,
          color: '#64748b',
          desc: 'Pemulihan aktif & pelepasan asam laktat'
        },
        {
          zone: 'Zone 2',
          name: 'Aerobic Base (Easy Run)',
          rangePct: '60% - 70% HRR',
          bpmRange: `${calcBPM(0.60)} - ${calcBPM(0.70)} BPM`,
          color: '#10b981',
          desc: 'Pembakaran lemak & efisiensi kapiler darah utama'
        },
        {
          zone: 'Zone 3',
          name: 'Aerobic Power (Steady)',
          rangePct: '70% - 80% HRR',
          bpmRange: `${calcBPM(0.70)} - ${calcBPM(0.80)} BPM`,
          color: '#06b6d4',
          desc: 'Daya tahan otot & ritme marathon terkontrol'
        },
        {
          zone: 'Zone 4',
          name: 'Lactate Threshold (Tempo)',
          rangePct: '80% - 90% HRR',
          bpmRange: `${calcBPM(0.80)} - ${calcBPM(0.90)} BPM`,
          color: '#f59e0b',
          desc: 'Ambang batas laktat, pernapasan 2:2 terkendali'
        },
        {
          zone: 'Zone 5',
          name: 'VO2 Max & Speed (Interval)',
          rangePct: '> 90% HRR',
          bpmRange: `> ${calcBPM(0.90)} BPM`,
          color: '#ef4444',
          desc: 'Kapasitas serapan oksigen maksimal paru-paru'
        }
      ]
    };
  }
};

if (typeof module !== 'undefined') {
  module.exports = AuthEngine;
}
