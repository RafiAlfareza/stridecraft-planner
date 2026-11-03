/**
 * Running Training Program Generator Engine
 * Periodization, Weekly Plotting, and Detailed Workout Menus
 * StrideCraft / PelariMandiri
 */

const TrainingProgramGenerator = {
  /**
   * Day names in Indonesian
   */
  dayNames: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],

  /**
   * Main Generator Function
   */
  generateProgram(config) {
    const {
      targetDistance = 10,
      targetTimeSeconds = 3000, // e.g. 50:00 (pace 5:00/km)
      totalWeeks = 12,
      daysPerWeek = 4,
      fitnessLevel = 'intermediate',
      startDate = new Date()
    } = config;

    // 1. Calculate Paces & Zones
    const zones = PacingEngine.calculateTrainingZones(targetDistance, targetTimeSeconds);
    const targetPace = zones.targetPace;

    // 2. Determine Peak Long Run and Peak Weekly Mileage based on Target Distance & Level
    const peakConfig = this.getPeakConfig(targetDistance, fitnessLevel);

    // 3. Generate Week-by-Week Periodization Progression
    const weeks = [];
    const taperWeeksCount = targetDistance >= 42 ? 3 : (targetDistance >= 21 ? 2 : 1);
    const buildWeeksCount = totalWeeks - taperWeeksCount;

    for (let w = 1; w <= totalWeeks; w++) {
      const phaseInfo = this.determinePhase(w, totalWeeks, taperWeeksCount);
      const mileageMultiplier = this.getWeeklyMileageMultiplier(w, totalWeeks, taperWeeksCount);
      const isRecoveryWeek = (w % 4 === 0 && w < totalWeeks - 1 && phaseInfo.phase !== 'Taper');

      // Adjust multiplier if recovery week
      const adjustedMultiplier = isRecoveryWeek ? mileageMultiplier * 0.78 : mileageMultiplier;
      const targetWeeklyMileage = Math.round(peakConfig.peakWeeklyKm * adjustedMultiplier);
      const longRunMileage = Math.round(peakConfig.peakLongRunKm * adjustedMultiplier * (isRecoveryWeek ? 0.8 : 1.0));

      const weekSchedule = this.generateWeekSchedule({
        weekNumber: w,
        totalWeeks,
        phase: phaseInfo.phase,
        phaseName: phaseInfo.name,
        targetWeeklyMileage,
        longRunMileage,
        daysPerWeek,
        fitnessLevel,
        zones,
        targetDistance,
        targetTimeSeconds,
        isRecoveryWeek,
        isRaceWeek: w === totalWeeks
      });

      // Calculate actual total distance for the week
      const actualWeeklyKm = weekSchedule.reduce((sum, day) => sum + (day.distanceKm || 0), 0);

      weeks.push({
        weekNumber: w,
        phase: phaseInfo.phase,
        phaseName: phaseInfo.name,
        phaseColor: phaseInfo.color,
        phaseBadgeBg: phaseInfo.bgColor,
        isRecoveryWeek,
        isRaceWeek: w === totalWeeks,
        targetWeeklyMileage: Math.round(actualWeeklyKm * 10) / 10,
        longRunMileage,
        focusTitle: phaseInfo.focusTitle,
        focusDescription: phaseInfo.focusDescription,
        schedule: weekSchedule
      });
    }

    // Calculate overall program metrics
    const totalProgramKm = weeks.reduce((sum, w) => sum + w.targetWeeklyMileage, 0);
    const peakWeekKm = Math.max(...weeks.map(w => w.targetWeeklyMileage));
    const totalRuns = weeks.reduce((sum, w) => sum + w.schedule.filter(d => d.type !== 'REST' && d.type !== 'STRENGTH').length, 0);
    const totalStrength = weeks.reduce((sum, w) => sum + w.schedule.filter(d => d.type === 'STRENGTH').length, 0);

    return {
      metadata: {
        createdAt: new Date().toISOString(),
        targetDistance,
        targetDistanceName: this.getDistanceName(targetDistance),
        targetTimeSeconds,
        targetTimeFormatted: PacingEngine.secondsToTimeString(targetTimeSeconds, targetDistance >= 21),
        targetPaceSeconds: targetPace,
        targetPaceFormatted: PacingEngine.formatPace(targetPace),
        speedKmH: zones.speedKmH,
        totalWeeks,
        daysPerWeek,
        fitnessLevel,
        totalProgramKm: Math.round(totalProgramKm),
        peakWeekKm: Math.round(peakWeekKm),
        totalRuns,
        totalStrength
      },
      zones,
      weeks
    };
  },

  /**
   * Helper to get friendly name for race distance
   */
  getDistanceName(distanceKm) {
    if (Math.abs(distanceKm - 5) < 0.2) return '5K (5.00 km)';
    if (Math.abs(distanceKm - 10) < 0.2) return '10K (10.00 km)';
    if (Math.abs(distanceKm - 21.0975) < 0.2) return 'Half Marathon (21.1 km)';
    if (Math.abs(distanceKm - 42.195) < 0.2) return 'Full Marathon (42.2 km)';
    return `${distanceKm} km (Custom)`;
  },

  /**
   * Peak mileage benchmark config based on distance & runner level
   */
  getPeakConfig(targetDistance, level) {
    const levelMultipliers = {
      beginner: 0.85,
      intermediate: 1.0,
      advanced: 1.25
    };
    const mult = levelMultipliers[level] || 1.0;

    if (targetDistance <= 5) {
      return {
        peakWeeklyKm: Math.round(30 * mult),
        peakLongRunKm: Math.round(10 * mult)
      };
    } else if (targetDistance <= 10) {
      return {
        peakWeeklyKm: Math.round(42 * mult),
        peakLongRunKm: Math.round(15 * mult)
      };
    } else if (targetDistance <= 21.1) {
      return {
        peakWeeklyKm: Math.round(55 * mult),
        peakLongRunKm: Math.round(20 * mult)
      };
    } else {
      // Marathon
      return {
        peakWeeklyKm: Math.round(75 * mult),
        peakLongRunKm: Math.min(34, Math.round(32 * mult))
      };
    }
  },

  /**
   * Determine Phase of Periodization
   */
  determinePhase(weekNumber, totalWeeks, taperWeeksCount) {
    const buildWeeks = totalWeeks - taperWeeksCount;
    const baseWeeks = Math.max(2, Math.round(buildWeeks * 0.35));

    if (weekNumber > buildWeeks) {
      return {
        phase: 'Taper',
        name: 'Tapering & Kesiapan Lomba',
        color: '#8b5cf6', // purple-500
        bgColor: '#f3e8ff',
        focusTitle: 'Pengurangan Volume & Pengisian Glikogen',
        focusDescription: 'Menurunkan jarak mingguan hingga 40-60% agar otot segar bugar, sambil menjaga ritme kaki dengan lari singkat di pace target.'
      };
    } else if (weekNumber <= baseWeeks) {
      return {
        phase: 'Base',
        name: 'Fondasi Aerobik & Kekuatan',
        color: '#10b981', // green-500
        bgColor: '#ecfdf5',
        focusTitle: 'Pondasi Daya Tahan & Stabilitas Sendi',
        focusDescription: 'Fokus pada lari santai (Easy Run Zone 2) untuk membentuk kapiler darah baru dan menguatkan tendon melalui latihan beban rutin.'
      };
    } else if (weekNumber <= buildWeeks - 2) {
      return {
        phase: 'Build',
        name: 'Pengembangan Ambang Laktat (Threshold)',
        color: '#f59e0b', // amber-500
        bgColor: '#fffbeb',
        focusTitle: 'Kapasitas Laktat & Ketahanan Tempo',
        focusDescription: 'Meningkatkan ambang anaerobik (Lactate Threshold) dengan latihan Tempo konstan dan interval interval VO2 max terukur.'
      };
    } else {
      return {
        phase: 'Peak',
        name: 'Puncak Volume & Ketajaman Spesifik',
        color: '#ef4444', // red-500
        bgColor: '#fef2f2',
        focusTitle: 'Simulasi Lomba & Jarak Terjauh',
        focusDescription: 'Puncak jarak Long Run tertinggi, uji coba hidrasi & strategi nutrisi lomba, serta simulasi ritme lari target.'
      };
    }
  },

  /**
   * Weekly Mileage Progression Curve (Periodization)
   */
  getWeeklyMileageMultiplier(weekNumber, totalWeeks, taperWeeksCount) {
    const buildWeeks = totalWeeks - taperWeeksCount;
    if (weekNumber <= buildWeeks) {
      // Linear build from ~0.55 of peak up to 1.0 at peak
      const progress = (weekNumber - 1) / Math.max(1, buildWeeks - 1);
      return 0.55 + 0.45 * progress;
    } else {
      // Taper down
      const taperStep = weekNumber - buildWeeks; // 1, 2, or 3
      if (taperWeeksCount === 1) return 0.50;
      if (taperWeeksCount === 2) {
        return taperStep === 1 ? 0.70 : 0.45;
      }
      // 3 taper weeks (Marathon)
      if (taperStep === 1) return 0.75;
      if (taperStep === 2) return 0.60;
      return 0.40; // Race week
    }
  },

  /**
   * Generate Schedule for a single week (7 days: Senin - Minggu)
   */
  generateWeekSchedule(params) {
    const {
      weekNumber,
      totalWeeks,
      phase,
      phaseName,
      targetWeeklyMileage,
      longRunMileage,
      daysPerWeek,
      fitnessLevel,
      zones,
      targetDistance,
      targetTimeSeconds,
      isRecoveryWeek,
      isRaceWeek
    } = params;

    const schedule = [];
    const remainingMileage = Math.max(5, targetWeeklyMileage - longRunMileage);

    // Template distribution based on daysPerWeek
    // Days index: 0 = Senin, 1 = Selasa, 2 = Rabu, 3 = Kamis, 4 = Jumat, 5 = Sabtu, 6 = Minggu
    let daySlotTypes = [];

    if (daysPerWeek === 3) {
      // 3 running days + 1 strength day + 3 rest days
      daySlotTypes = [
        'REST',                                          // Senin
        phase === 'Base' ? 'TEMPO' : 'INTERVAL',         // Selasa (Quality 1)
        'REST',                                          // Rabu
        'EASY',                                          // Kamis
        'REST',                                          // Jumat
        'STRENGTH',                                      // Sabtu
        'LONGRUN'                                        // Minggu
      ];
    } else if (daysPerWeek === 4) {
      // 4 running days + 1 dedicated strength day
      daySlotTypes = [
        'REST',                                          // Senin
        'INTERVAL',                                      // Selasa (Speed/VO2max)
        'REST',                                          // Rabu
        'TEMPO',                                         // Kamis (Threshold)
        'STRENGTH',                                      // Jumat (Runner Strength)
        'EASY',                                          // Sabtu (Recovery / Aerobic)
        'LONGRUN'                                        // Minggu (Endurance)
      ];
    } else if (daysPerWeek === 5) {
      // 5 running days + 1 strength
      daySlotTypes = [
        'REST',                                          // Senin
        'INTERVAL',                                      // Selasa
        'EASY',                                          // Rabu (+ Short Strength)
        'TEMPO',                                         // Kamis
        'REST',                                          // Jumat
        'EASY',                                          // Sabtu
        'LONGRUN'                                        // Minggu
      ];
    } else {
      // 6 running days
      daySlotTypes = [
        'EASY',                                          // Senin (Recovery run)
        'INTERVAL',                                      // Selasa
        'EASY',                                          // Rabu
        'TEMPO',                                         // Kamis
        'REST',                                          // Jumat
        'EASY',                                          // Sabtu (Shakeout)
        'LONGRUN'                                        // Minggu
      ];
    }

    // Special handling for Race Week (Last Week)
    if (isRaceWeek) {
      daySlotTypes = [
        'REST',
        'EASY_SHAKEOUT', // Short run with 3 strides
        'REST',
        'EASY_SHAKEOUT', // 3km very easy shakeout
        'REST',
        'PRE_RACE_REST', // Rest or 15m walk
        'RACE_DAY'       // THE BIG RACE!
      ];
    }

    // Mileage allocation for the running slots
    const runDaysCount = daySlotTypes.filter(t => ['EASY', 'TEMPO', 'INTERVAL', 'EASY_SHAKEOUT'].includes(t)).length;
    const avgRunMileage = runDaysCount > 0 ? (remainingMileage / runDaysCount) : 5;

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayName = this.dayNames[dayIdx];
      const slotType = daySlotTypes[dayIdx];

      const workout = this.createDetailedWorkout({
        dayIdx,
        dayName,
        slotType,
        weekNumber,
        totalWeeks,
        phase,
        zones,
        targetDistance,
        targetTimeSeconds,
        longRunMileage,
        avgRunMileage,
        isRaceWeek,
        fitnessLevel
      });

      schedule.push(workout);
    }

    return schedule;
  },

  /**
   * Synthesize a Comprehensive Detailed Workout Menu
   */
  createDetailedWorkout(args) {
    const {
      dayIdx,
      dayName,
      slotType,
      weekNumber,
      totalWeeks,
      phase,
      zones,
      targetDistance,
      targetTimeSeconds,
      longRunMileage,
      avgRunMileage,
      isRaceWeek,
      fitnessLevel
    } = args;

    const p = zones.paces;

    // 1. REST DAY
    if (slotType === 'REST') {
      return {
        dayIndex: dayIdx,
        dayName,
        type: 'REST',
        typeLabel: 'Istirahat Penuh',
        typeColor: '#64748b', // slate-500
        typeBgColor: '#f1f5f9',
        title: 'Istirahat & Regenerasi Otot',
        shortSummary: 'Hari istirahat penuh untuk pemulihan glikogen dan perbaikan jaringan mikro otot.',
        distanceKm: 0,
        estimatedTimeMinutes: 0,
        targetPaceFormatted: '-',
        intensity: 'Zone 0 (Pemulihan)',
        rpe: '1 / 10',
        heartRateTarget: '< 60% HRmax',
        warmUp: {
          title: 'Aktivitas Ringan (Opsional)',
          duration: '10 - 15 menit',
          details: 'Jalan santai ringan atau peregangan statis lembut. Jangan lakukan olahraga intensitas sedang atau berat.'
        },
        mainSet: {
          title: 'Protokol Istirahat Optimal',
          details: [
            'Tidur cukup 7.5 - 9 jam untuk memaksimalkan sekresi Growth Hormone pemulihan otot.',
            'Hidrasi teratur: Minum minimal 2.5 - 3 liter air dengan sedikit elektrolit/garam.',
            'Nutrisi: Asupan protein berkualitas (telur, ayam, ikan, tahu/tempe) untuk rekonstruksi serat otot.',
            'Gunakan foam roller 10-15 menit pada area paha depan (quads), paha belakang (hamstring), dan betis.'
          ]
        },
        coolDown: null,
        coachNotes: 'Ingat filosofi atlet profesional: "Latihan merusak otot, istirahatlah yang membuatnya semakin kuat dan cepat!"'
      };
    }

    // 2. PRE RACE REST
    if (slotType === 'PRE_RACE_REST') {
      return {
        dayIndex: dayIdx,
        dayName,
        type: 'REST',
        typeLabel: 'Istirahat Pra-Lomba',
        typeColor: '#8b5cf6',
        typeBgColor: '#f3e8ff',
        title: 'Kesiapan Mental & Carbo-Loading',
        shortSummary: 'Istirahat total jelang hari perlombaan. Siapkan jersey, bib, sepatu, dan nutrisi.',
        distanceKm: 0,
        estimatedTimeMinutes: 0,
        targetPaceFormatted: '-',
        intensity: 'Zone 0',
        rpe: '1 / 10',
        warmUp: null,
        mainSet: {
          title: 'Checklist Pra-Lomba (H-1)',
          details: [
            'Siapkan Race Kit: BIB nomor dada sudah terpasang rapi di jersey lari.',
            'Sepatu & Kaos Kaki: Gunakan sepatu yang sudah teruji dalam latihan (jangan pakai sepatu baru saat race!).',
            'Nutrisi: Konsumsi makanan karbohidrat kompleks rendah serat (nasi, kentang, pisang). Hindari makanan pedas & asam.',
            'Energi Gel & Hidrasi: Siapkan gel energi dan botol minum/soft flask jika mandiri.',
            'Tidur Lebih Awal: Pasang alarm ganda 2.5 jam sebelum waktu start (gun time).'
          ]
        },
        coolDown: null,
        coachNotes: 'Fokus pikiran positif. Anda telah berlatih keras berminggu-minggu, besok adalah hari perayaan hasil kerja keras Anda!'
      };
    }

    // 3. RACE DAY (The Goal Race)
    if (slotType === 'RACE_DAY') {
      const raceTimeFormatted = PacingEngine.secondsToTimeString(targetTimeSeconds, targetDistance >= 21);
      return {
        dayIndex: dayIdx,
        dayName,
        type: 'RACE',
        typeLabel: 'HARI PERLOMBAAN (RACE DAY)',
        typeColor: '#dc2626', // red-600
        typeBgColor: '#fee2e2',
        title: `Lomba Target ${this.getDistanceName(targetDistance)} - Target: ${raceTimeFormatted}`,
        shortSummary: `Waktunya eksekusi rencana latihan! Target finish dalam waktu ${raceTimeFormatted} dengan pace rata-rata ${zones.targetPaceFormatted}.`,
        distanceKm: targetDistance,
        estimatedTimeMinutes: Math.round(targetTimeSeconds / 60),
        targetPaceFormatted: zones.targetPaceFormatted,
        intensity: 'Zone 4 - 5 (Race Effort)',
        rpe: '8 - 10 / 10',
        heartRateTarget: '85% - 95% HRmax',
        warmUp: {
          title: 'Pemanasan Pra-Lomba (30 Menit Sebelum Start)',
          duration: '15 - 20 menit',
          details: targetDistance >= 21
            ? 'Untuk HM/Marathon: Cukup 5-8 menit jogging sangat santai + dynamic drills ringan agar tidak menghabiskan cadangan glikogen.'
            : 'Untuk 5K/10K: 10 menit jogging Zone 2 + 5 menit dynamic drills + 3x 50m Strides di pace target untuk membangunkan neuromuscular.'
        },
        mainSet: {
          title: 'Strategi Eksekusi Lomba (Negative Split Pacing)',
          details: [
            `Km 0 - 20% Jarak: Tahan ego! Jangan terbawa euforia pelari lain di awal start. Lari 5-10 detik LEBIH LAMBAT dari pace target (${zones.targetPaceFormatted}).`,
            `Km 20% - 80% Jarak: Masuk ke ritme mantap (cruise mode) tepat di pace target ${zones.targetPaceFormatted}. Jaga pernapasan ritmik 2:2 dan rilekskan bahu.`,
            `Km 80% ke Finish: Jika tenaga masih tersisa, lakukan "Negative Split" dengan meningkatkan kecepatan secara bertahap menuju garis finish!`,
            `Strategi Hidrasi: Ambil air di setiap water station. Untuk HM/FM, konsumsi 1 gel energi setiap 40-45 menit latihan.`
          ]
        },
        coolDown: {
          title: 'Pendinginan & Perayaan',
          duration: '10 menit jalan santai',
          details: 'Jalan santai 10 menit, minum air elektrolit, segera konsumsi makanan kombinasi karbohidrat & protein dalam 30 menit pasca finish. Selamat atas pencapaian Anda!'
        },
        coachNotes: 'Kunci nomor satu lari cepat adalah disiplin pacing di kilometer awal!'
      };
    }

    // 4. EASY SHAKEOUT (Race Week)
    if (slotType === 'EASY_SHAKEOUT') {
      const dist = Math.min(4, Math.round(avgRunMileage * 0.5));
      const dur = Math.round((dist * p.easy.paceSecMid) / 60);
      return {
        dayIndex: dayIdx,
        dayName,
        type: 'EASY',
        typeLabel: 'Easy Shakeout Run',
        typeColor: '#10b981',
        typeBgColor: '#ecfdf5',
        title: `Shakeout Run ${dist} km + 3x Strides`,
        shortSummary: 'Lari santai untuk menjaga kaki tetap ringan dan fleksibel tanpa menimbulkan lelah.',
        distanceKm: dist,
        estimatedTimeMinutes: dur,
        targetPaceFormatted: p.easy.rangeFormatted,
        intensity: 'Zone 2 (Sangat Ringan)',
        rpe: '3 - 4 / 10',
        heartRateTarget: '65% - 72% HRmax',
        warmUp: {
          title: 'Pemanasan Singkat',
          duration: '5 menit',
          details: 'Dynamic stretching ringan: ankle rolls, leg swings, walking knee hugs.'
        },
        mainSet: {
          title: `Lari Santai ${dist} km`,
          details: [
            `Lari sejauh ${dist} km di Pace santai (${p.easy.rangeFormatted}). Rasakan kaki rileks.`,
            'Di akhir lari, lakukan 3x 60m Strides (akselerasi halus) dengan istirahat jalan penuh antar rep.'
          ]
        },
        coolDown: {
          title: 'Peregangan Lembut',
          duration: '5 menit',
          details: 'Peregangan statis ringan untuk betis dan paha. Hindari peregangan berlebihan.'
        },
        coachNotes: 'Tujuan hari ini murni psikologis dan menjaga aliran darah. Jangan berlari cepat!'
      };
    }

    // 5. STRENGTH TRAINING DAY
    if (slotType === 'STRENGTH') {
      const routine = StrengthLibrary.getRoutineForWeekAndDay(weekNumber, dayIdx);
      return {
        dayIndex: dayIdx,
        dayName,
        type: 'STRENGTH',
        typeLabel: 'Latihan Kekuatan Pelari',
        typeColor: '#eab308', // yellow-500
        typeBgColor: '#fefce8',
        title: routine.title,
        shortSummary: routine.subtitle,
        distanceKm: 0,
        estimatedTimeMinutes: routine.durationMinutes,
        targetPaceFormatted: 'N/A (Latihan Beban)',
        intensity: 'Intensitas Kekuatan Fungsional',
        rpe: '6 - 7 / 10',
        heartRateTarget: 'Zone 1 - 2 (Fokus Bentuk Gerakan)',
        warmUp: {
          title: 'Aktivasi Otot & Sendi',
          duration: '5 - 8 menit',
          details: 'Inchworm, Cat-Cow, Glute Bridge statis (tahan 30s), Ankle mobility drill, Hip circles.'
        },
        mainSet: {
          title: `Sirkuit Latihan Beban (${routine.exercises.length} Gerakan Utama)`,
          exercises: routine.exercises,
          details: routine.exercises.map(ex => `• ${ex.name} — ${ex.sets} x ${ex.reps} (Istirahat: ${ex.rest}). Target: ${ex.targetMuscles}. Tips: ${ex.coachingCue}`)
        },
        coolDown: {
          title: 'Peregangan Statis & Mobilitas',
          duration: '5 - 10 menit',
          details: 'Pigeon stretch (panggul luar), Couch stretch (paha depan/hip flexor), Downward dog untuk betis.'
        },
        coachNotes: 'Kekuatan otot adalah baju zirah pelari. Otot yang kuat menjaga form lari tetap efisien dan melindungi lutut dari cedera overuse.'
      };
    }

    // 6. INTERVAL TRAINING (VO2 MAX / SPEED WORK)
    if (slotType === 'INTERVAL') {
      let intervalStructure;
      if (weekNumber <= 3) {
        // Shorter intervals early in training
        const repCount = 8;
        const repDist = 400; // meters
        const repPace = p.interval.paceSec;
        const repTime = Math.round(repPace * 0.4);
        intervalStructure = {
          name: `${repCount} x 400m VO2 Max Intervals`,
          repCount,
          repDist: '400 meter',
          repPaceFormatted: PacingEngine.formatPace(repPace),
          repTargetTime: PacingEngine.secondsToTimeString(repTime),
          recovery: '90 detik jogging sangat lambat (recovery jog)',
          totalIntervalDist: (repCount * 0.4)
        };
      } else if (weekNumber <= 7) {
        // Medium intervals
        const repCount = 5;
        const repDist = 800; // meters
        const repPace = p.interval.paceSec;
        const repTime = Math.round(repPace * 0.8);
        intervalStructure = {
          name: `${repCount} x 800m Speed Repeats`,
          repCount,
          repDist: '800 meter',
          repPaceFormatted: PacingEngine.formatPace(repPace),
          repTargetTime: PacingEngine.secondsToTimeString(repTime),
          recovery: '2 menit jogging santai / jalan aktif',
          totalIntervalDist: (repCount * 0.8)
        };
      } else {
        // Peak intervals: 1000m or 1200m repeats
        const repCount = Math.min(5, Math.max(3, Math.round(targetDistance / 3)));
        const repDist = 1000;
        const repPace = p.interval.paceSec;
        const repTime = Math.round(repPace * 1.0);
        intervalStructure = {
          name: `${repCount} x 1.000m Lactate & VO2 Max Repeats`,
          repCount,
          repDist: '1.000 meter (1 km)',
          repPaceFormatted: PacingEngine.formatPace(repPace),
          repTargetTime: PacingEngine.secondsToTimeString(repTime),
          recovery: '2 menit 30 detik jog lambat',
          totalIntervalDist: (repCount * 1.0)
        };
      }

      const warmUpKm = 2.0;
      const coolDownKm = 1.5;
      const totalKm = Math.round((warmUpKm + intervalStructure.totalIntervalDist + coolDownKm) * 10) / 10;
      const totalEstimatedMinutes = Math.round(15 + (intervalStructure.repCount * 5) + 12);

      return {
        dayIndex: dayIdx,
        dayName,
        type: 'INTERVAL',
        typeLabel: 'Latihan Interval (Speed / VO2max)',
        typeColor: '#ef4444', // red-500
        typeBgColor: '#fee2e2',
        title: intervalStructure.name,
        shortSummary: `Latihan interval cepat di Pace ${intervalStructure.repPaceFormatted} untuk mendongkrak kapasitas paru-paru (VO2max) dan kecepatan langkah.`,
        distanceKm: totalKm,
        estimatedTimeMinutes: totalEstimatedMinutes,
        targetPaceFormatted: intervalStructure.repPaceFormatted,
        intensity: 'Zone 5 (Sangat Keras / Hard)',
        rpe: '8 - 9 / 10',
        heartRateTarget: '90% - 98% HRmax saat interval',
        warmUp: {
          title: 'Pemanasan Progresif Wajib (Warm-Up)',
          duration: '15 menit (~2.0 km)',
          details: `Lari santai 2.0 km di Pace Easy (${p.easy.rangeFormatted}) + 5 menit Dynamic Drills (High knees, Butt kicks, Leg swings, A-skips) + 3x 60m Strides untuk membuka ritme kecepatan sebelum menu utama.`
        },
        mainSet: {
          title: `Menu Utama: ${intervalStructure.name}`,
          details: [
            `Lakukan ${intervalStructure.repCount} repetisi berjarak ${intervalStructure.repDist}.`,
            `Target waktu per repetisi: Tepat ${intervalStructure.repTargetTime} (Pace: ${intervalStructure.repPaceFormatted}).`,
            `Istirahat antar repetisi: ${intervalStructure.recovery}. Jangan duduk atau berhenti total, tetap bergerak perlahan agar asam laktat terurai.`,
            `Cadence Target: 175 - 185 langkah per menit (spm). Fokus pada dorongan dari otot gluteus dan relaksasi bahu.`
          ]
        },
        coolDown: {
          title: 'Pendinginan (Cool-Down)',
          duration: '10 - 12 menit (~1.5 km)',
          details: `Lari sangat lambat 1.5 km di Pace Recovery (${PacingEngine.formatPace(p.easy.paceSecHigh)}) untuk menurunkan detak jantung secara bertahap + 10 menit peregangan statis menyeluruh.`
        },
        coachNotes: 'Kunci interval bukanlah rep pertama yang terlalu kencang, melainkan konsistensi waktu dari repetisi pertama hingga repetisi terakhir!'
      };
    }

    // 7. TEMPO / THRESHOLD RUN (LACTATE THRESHOLD)
    if (slotType === 'TEMPO') {
      // Tempo progression based on week
      let tempoDurationMin = 20;
      if (weekNumber >= 4 && weekNumber <= 7) tempoDurationMin = 25;
      if (weekNumber >= 8) tempoDurationMin = 30;

      const tempoPace = p.tempo.paceSecMid;
      const tempoDistKm = Math.round((tempoDurationMin * 60 / tempoPace) * 10) / 10;
      const warmUpKm = 1.5;
      const coolDownKm = 1.5;
      const totalKm = Math.round((warmUpKm + tempoDistKm + coolDownKm) * 10) / 10;
      const totalMinutes = Math.round(10 + tempoDurationMin + 10);

      return {
        dayIndex: dayIdx,
        dayName,
        type: 'TEMPO',
        typeLabel: 'Lari Tempo (Ambang Laktat)',
        typeColor: '#f59e0b', // amber-500
        typeBgColor: '#fef3c7',
        title: `Tempo Run ${tempoDurationMin} Menit Konstan @ Pace ${p.tempo.rangeFormatted}`,
        shortSummary: 'Berlari terus menerus pada ambang batas laktat untuk melatih tubuh menahan kecepatan lebih lama tanpa lelah.',
        distanceKm: totalKm,
        estimatedTimeMinutes: totalMinutes,
        targetPaceFormatted: p.tempo.rangeFormatted,
        intensity: 'Zone 4 (Comfortably Hard / Terkontrol Keras)',
        rpe: '7 - 8 / 10',
        heartRateTarget: '85% - 89% HRmax',
        warmUp: {
          title: 'Pemanasan',
          duration: '10 menit (~1.5 km)',
          details: `Jog santai 1.5 km di Pace Easy (${p.easy.rangeFormatted}) + dynamic stretching kaki & pinggul.`
        },
        mainSet: {
          title: `Menu Utama: ${tempoDurationMin} Menit Tempo Block`,
          details: [
            `Lari stabil terus menerus selama ${tempoDurationMin} menit (menempuh sekitar ~${tempoDistKm} km).`,
            `Pace Target: Wajib konsisten di ${p.tempo.rangeFormatted}.`,
            'Sensasi Usaha: "Comfortably hard" — Anda hanya bisa berbicara 1-2 patah kata, tetapi ritme masih terkontrol penuh.',
            'Fokus napas teratur dengan ritme 2 langkah tarik napas : 2 langkah hembuskan napas.'
          ]
        },
        coolDown: {
          title: 'Pendinginan',
          duration: '10 menit (~1.5 km)',
          details: `Jogging sangat santai 1.5 km untuk membuang akumulasi asam laktat + static stretches.`
        },
        coachNotes: 'Latihan Tempo adalah senjata rahasia pelari jarak jauh untuk menaikkan kecepatan rata-rata pada hari lomba!'
      };
    }

    // 8. LONG RUN (ENDURANCE BASE & PROGRESSION)
    if (slotType === 'LONGRUN') {
      const lrDist = Math.max(targetDistance * 0.7, longRunMileage);
      const roundedLrDist = Math.round(lrDist * 10) / 10;
      const lrPace = p.easy.paceSecMid + 10; // slightly conservative for long runs
      const totalMinutes = Math.round((roundedLrDist * lrPace) / 60);

      // Advanced progression cue in peak weeks
      const hasFastFinish = phase === 'Peak' || (phase === 'Build' && weekNumber % 2 === 0);
      const fastFinishKm = Math.min(4, Math.max(2, Math.round(roundedLrDist * 0.25)));

      return {
        dayIndex: dayIdx,
        dayName,
        type: 'LONGRUN',
        typeLabel: 'Lari Jarak Jauh (Long Run)',
        typeColor: '#2563eb', // blue-600
        typeBgColor: '#dbeafe',
        title: `Long Run ${roundedLrDist} km ${hasFastFinish ? '(Fast-Finish Race Pace)' : '(Steady Aerobic)'}`,
        shortSummary: `Lari jarak jauh sejauh ${roundedLrDist} km untuk menggembleng ketahanan fisik, pembakaran lemak, dan ketangguhan mental.`,
        distanceKm: roundedLrDist,
        estimatedTimeMinutes: totalMinutes,
        targetPaceFormatted: `${PacingEngine.secondsToTimeString(lrPace - 15)} - ${PacingEngine.secondsToTimeString(lrPace + 15)} /km`,
        intensity: 'Zone 2 ke Zone 3 (Aerobic Endurance)',
        rpe: '5 - 7 / 10',
        heartRateTarget: '70% - 82% HRmax',
        warmUp: {
          title: 'Pemanasan Lembut',
          duration: '5 - 10 menit',
          details: 'Dynamic stretches: leg swings, hip circles, walking high knees, lunges santai. Mulai lari dengan kilometer awal yang sangat lambat.'
        },
        mainSet: {
          title: `Rute Long Run ${roundedLrDist} km`,
          details: [
            hasFastFinish
              ? `Km 1 s/d Km ${Math.round(roundedLrDist - fastFinishKm)}: Lari santai stabil di Pace Easy (${p.easy.rangeFormatted}).`
              : `Lari konstan seluruh ${roundedLrDist} km di Pace Easy Aerobik (${p.easy.rangeFormatted}).`,
            hasFastFinish
              ? `Km terakhir (${fastFinishKm} km terakhir): Naikkan kecepatan hingga mencapai Target Race Pace (${zones.targetPaceFormatted}) untuk melatih kaki berlari kencang dalam kondisi lelah!`
              : 'Jaga detak jantung tetap berada di Zone 2 (bisa berbicara santai dengan kalimat penuh).',
            'Nutrisi & Hidrasi: Bawa botol minum/hydration vest. Minum 100-150 ml air atau cairan isotonik setiap 20-25 menit.',
            roundedLrDist >= 14 ? 'Konsumsi energi gel pertama pada menit ke-45 atau kilometer 8-10, lalu gel kedua di menit ke-90.' : 'Bawa bekal air minum dan permen energi jika diperlukan.'
          ]
        },
        coolDown: {
          title: 'Pendinginan & Pemulihan Pasca Long Run',
          duration: '15 menit',
          details: 'Jalan santai 5 menit + rendam kaki air dingin atau mandi air sejuk. Konsumsi karbohidrat + protein dalam 30 menit setelah selesai lari.'
        },
        coachNotes: 'Kunci Long Run adalah kesabaran. Jangan berlari terlalu kencang di awal, tujuan utama adalah "time on feet" (waktu kaki bergerak).'
      };
    }

    // 9. DEFAULT / EASY RUN (RECOVERY OR AEROBIC BASE)
    const easyDist = Math.max(4, Math.round(avgRunMileage * 10) / 10);
    const easyDurationMin = Math.round((easyDist * p.easy.paceSecMid) / 60);

    return {
      dayIndex: dayIdx,
      dayName,
      type: 'EASY',
      typeLabel: 'Easy / Aerobic Run',
      typeColor: '#10b981', // green-500
      typeBgColor: '#ecfdf5',
      title: `Easy Run ${easyDist} km + 4x Strides`,
      shortSummary: `Lari santai ${easyDist} km di Zona 2 untuk membangun kapiler darah dan mempercepat pemulihan tubuh.`,
      distanceKm: easyDist,
      estimatedTimeMinutes: easyDurationMin,
      targetPaceFormatted: p.easy.rangeFormatted,
      intensity: 'Zone 2 (Santai / Conversational)',
      rpe: '4 - 5 / 10',
      heartRateTarget: '65% - 75% HRmax',
      warmUp: {
        title: 'Pemanasan Singkat',
        duration: '5 menit',
        details: 'Dynamic stretches pergelangan kaki, paha, dan pinggul.'
      },
      mainSet: {
        title: `Lari Santai ${easyDist} km`,
        details: [
          `Lari sejauh ${easyDist} km dengan Pace Santai di kisaran ${p.easy.rangeFormatted}.`,
          'Pastikan Anda bisa berbicara dalam kalimat penuh tanpa terengah-engah (Conversational Pace). Jika napas memburu, perlambat kecepatan Anda.',
          'Di 500 meter terakhir, lakukan 4x 80m Strides (akselerasi halus dari 60% ke 90% kecepatan maksimal) dengan 45 detik jalan santai antar akselerasi untuk merangsang fleksibilitas kaki.'
        ]
      },
      coolDown: {
        title: 'Pendinginan & Stretching',
        duration: '8 menit',
        details: 'Peregangan statis paha depan, paha belakang, betis, dan pergelangan kaki.'
      },
      coachNotes: 'Jangan malu berlari pelan pada Easy Run! Pelari tercepat di dunia menghabiskan 80% volume latihannya di Zona Santai ini.'
    };
  }
};

if (typeof module !== 'undefined') {
  module.exports = TrainingProgramGenerator;
}
