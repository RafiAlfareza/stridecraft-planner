/**
 * Pacing & Running Physiology Calculations
 * StrideCraft / PelariMandiri
 */

const PacingEngine = {
  /**
   * Convert seconds to MM:SS or HH:MM:SS format
   */
  secondsToTimeString(totalSeconds, includeHours = false) {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '00:00';
    const totalSecs = Math.round(totalSeconds);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 0 || includeHours) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  },

  /**
   * Convert MM:SS or HH:MM:SS string to total seconds
   */
  timeStringToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0] * 60;
    }
    return 0;
  },

  /**
   * Calculate pace (seconds per km) from distance (km) and total time (seconds)
   */
  calculatePace(distanceKm, timeSeconds) {
    if (!distanceKm || distanceKm <= 0 || !timeSeconds || timeSeconds <= 0) return 0;
    return timeSeconds / distanceKm;
  },

  /**
   * Calculate total time (seconds) from distance (km) and pace (seconds per km)
   */
  calculateTime(distanceKm, paceSeconds) {
    if (!distanceKm || distanceKm <= 0 || !paceSeconds || paceSeconds <= 0) return 0;
    return distanceKm * paceSeconds;
  },

  /**
   * Convert pace (seconds per km) to speed (km/h)
   */
  paceToSpeedKmH(paceSeconds) {
    if (!paceSeconds || paceSeconds <= 0) return 0;
    return (3600 / paceSeconds).toFixed(1);
  },

  /**
   * Format pace in "MM:SS /km"
   */
  formatPace(paceSeconds) {
    if (!paceSeconds || isNaN(paceSeconds) || paceSeconds <= 0) return '-:-- /km';
    return `${this.secondsToTimeString(paceSeconds)} /km`;
  },

  /**
   * Estimate equivalent race times using Pete Riegel formula:
   * T2 = T1 * (D2 / D1)^1.06
   */
  predictTime(t1Sec, d1Km, d2Km) {
    if (!t1Sec || !d1Km || !d2Km) return 0;
    return t1Sec * Math.pow(d2Km / d1Km, 1.06);
  },

  /**
   * Calculate comprehensive training zones based on target race distance and target time.
   * Derived from Jack Daniels VDOT principles and modern sports science:
   * - Recovery / Easy (E-Pace)
   * - Marathon / Aerobic Steady (M-Pace)
   * - Threshold / Tempo (T-Pace)
   * - Interval (I-Pace, VO2max)
   * - Repetition (R-Pace, Speed/Neuromuscular)
   */
  calculateTrainingZones(targetDistanceKm, targetTimeSeconds) {
    const targetPace = this.calculatePace(targetDistanceKm, targetTimeSeconds);
    if (!targetPace || targetPace <= 0) return null;

    // Estimate 5k equivalent pace to anchor training paces properly
    const est5kTime = (targetDistanceKm === 5)
      ? targetTimeSeconds
      : this.predictTime(targetTimeSeconds, targetDistanceKm, 5.0);
    const pace5k = est5kTime / 5.0;

    // Estimate 10k equivalent pace
    const est10kTime = (targetDistanceKm === 10)
      ? targetTimeSeconds
      : this.predictTime(targetTimeSeconds, targetDistanceKm, 10.0);
    const pace10k = est10kTime / 10.0;

    // Estimate Half Marathon equivalent pace
    const estHmTime = (targetDistanceKm === 21.0975)
      ? targetTimeSeconds
      : this.predictTime(targetTimeSeconds, targetDistanceKm, 21.0975);
    const paceHm = estHmTime / 21.0975;

    // Derived Training Paces (in seconds/km)
    // 1. Easy / Recovery Pace (Zone 2)
    // 60 - 90s slower than 5k pace, or ~1.25x - 1.35x 5k pace
    const easyPaceLow = pace5k + 60;
    const easyPaceHigh = pace5k + 95;
    const easyPaceMid = Math.round((easyPaceLow + easyPaceHigh) / 2);

    // 2. Steady / Aerobic Endurance Pace
    const steadyPace = Math.round(pace5k + 40);

    // 3. Marathon Pace (M-Pace)
    const estMarathonTime = this.predictTime(targetTimeSeconds, targetDistanceKm, 42.195);
    const marathonPace = Math.round(estMarathonTime / 42.195);

    // 4. Threshold / Tempo Pace (T-Pace, Lactate Threshold, Zone 4)
    // Typically between 10k pace and HM pace (approx. 15-20s slower than 5K pace)
    const tempoPaceLow = Math.round(pace5k + 15);
    const tempoPaceHigh = Math.round(pace5k + 25);
    const tempoPaceMid = Math.round((tempoPaceLow + tempoPaceHigh) / 2);

    // 5. Interval Pace (I-Pace, VO2max, Zone 5)
    // Typically 3k-5k pace (approx. 5s faster to right at 5K pace)
    const intervalPace = Math.round(pace5k - 5);

    // 6. Repetition / Speed Pace (R-Pace)
    // 800m - 1500m pace, fast relaxed mechanics (approx 20-30s faster than 5k pace)
    const repetitionPace = Math.round(pace5k - 25);

    return {
      targetDistanceKm,
      targetTimeSeconds,
      targetPace,
      targetPaceFormatted: this.formatPace(targetPace),
      speedKmH: this.paceToSpeedKmH(targetPace),
      paces: {
        easy: {
          name: 'Easy / Recovery Run',
          code: 'E-Pace',
          color: '#10b981', // green-500
          bgColor: '#d1fae5',
          paceSecLow: easyPaceLow,
          paceSecHigh: easyPaceHigh,
          paceSecMid: easyPaceMid,
          rangeFormatted: `${this.secondsToTimeString(easyPaceLow)} - ${this.secondsToTimeString(easyPaceHigh)} /km`,
          hrRange: '65% - 75% HRmax (Zone 2)',
          rpe: '4 - 5 / 10',
          purpose: 'Membangun kapasitas aerobik kapiler, mitokondria, dan pemulihan tanpa stress berlebih.'
        },
        steady: {
          name: 'Aerobic Steady',
          code: 'S-Pace',
          color: '#06b6d4', // cyan-500
          bgColor: '#cffafe',
          paceSec: steadyPace,
          formatted: this.formatPace(steadyPace),
          hrRange: '75% - 82% HRmax (Zone 3)',
          rpe: '5 - 6 / 10',
          purpose: 'Meningkatkan efisiensi pemanfaatan glikogen dan daya tahan otot.'
        },
        marathon: {
          name: 'Marathon Pace',
          code: 'M-Pace',
          color: '#3b82f6', // blue-500
          bgColor: '#dbeafe',
          paceSec: marathonPace,
          formatted: this.formatPace(marathonPace),
          hrRange: '80% - 85% HRmax (Zone 3.5)',
          rpe: '6 - 7 / 10',
          purpose: 'Spesifik ritme lomba maraton, efisiensi bahan bakar lari jarak jauh.'
        },
        tempo: {
          name: 'Threshold / Tempo Run',
          code: 'T-Pace',
          color: '#f59e0b', // amber-500
          bgColor: '#fef3c7',
          paceSecLow: tempoPaceLow,
          paceSecHigh: tempoPaceHigh,
          paceSecMid: tempoPaceMid,
          rangeFormatted: `${this.secondsToTimeString(tempoPaceLow)} - ${this.secondsToTimeString(tempoPaceHigh)} /km`,
          hrRange: '85% - 89% HRmax (Zone 4)',
          rpe: '7 - 8 / 10',
          purpose: 'Meningkatkan ambang laktat (Lactate Threshold) agar bisa lari cepat lebih lama tanpa kelelahan asam laktat.'
        },
        interval: {
          name: 'VO2 Max Intervals',
          code: 'I-Pace',
          color: '#ef4444', // red-500
          bgColor: '#fee2e2',
          paceSec: intervalPace,
          formatted: this.formatPace(intervalPace),
          hrRange: '92% - 98% HRmax (Zone 5)',
          rpe: '8 - 9 / 10',
          purpose: 'Memaksimalkan penyerapan oksigen (VO2 Max) dan kecepatan kaki (leg turnover).'
        },
        repetition: {
          name: 'Repetition / Strides',
          code: 'R-Pace',
          color: '#8b5cf6', // purple-500
          bgColor: '#ede9fe',
          paceSec: repetitionPace,
          formatted: this.formatPace(repetitionPace),
          hrRange: '98% - 100% (Neuromuscular)',
          rpe: '9 - 10 / 10',
          purpose: 'Ekonomi lari, fleksibilitas mekanik, dan power sprint pendek tanpa penumpukan asam laktat berkepanjangan.'
        }
      },
      // Track distance splits for intervals
      splits: {
        split200m: Math.round(intervalPace * 0.2),
        split400m: Math.round(intervalPace * 0.4),
        split800m: Math.round(intervalPace * 0.8),
        split1000m: Math.round(intervalPace * 1.0),
        rep200m: Math.round(repetitionPace * 0.2),
        rep400m: Math.round(repetitionPace * 0.4),
      }
    };
  },

  /**
   * Generate Kilometer-by-Kilometer Splits for the Target Race
   */
  generateRaceSplits(distanceKm, targetTimeSeconds) {
    if (!distanceKm || distanceKm <= 0 || !targetTimeSeconds || targetTimeSeconds <= 0) return [];
    const paceSec = targetTimeSeconds / distanceKm;
    const splits = [];

    const fullKm = Math.floor(distanceKm);
    let cumulativeSec = 0;

    for (let km = 1; km <= fullKm; km++) {
      cumulativeSec += paceSec;
      splits.push({
        splitLabel: `Km ${km}`,
        kmMarker: km,
        splitTime: this.secondsToTimeString(paceSec),
        cumulativeTime: this.secondsToTimeString(cumulativeSec, cumulativeSec >= 3600),
        isMajorCheckpoint: (km % 5 === 0)
      });
    }

    // Add final fractional km if exists (e.g. 21.0975 -> 21.1 or 42.195 -> 42.2)
    const remainderKm = distanceKm - fullKm;
    if (remainderKm > 0.05) {
      const finalSec = remainderKm * paceSec;
      cumulativeSec += finalSec;
      splits.push({
        splitLabel: `Finish (${distanceKm.toFixed(2)} km)`,
        kmMarker: distanceKm,
        splitTime: this.secondsToTimeString(finalSec),
        cumulativeTime: this.secondsToTimeString(targetTimeSeconds, targetTimeSeconds >= 3600),
        isMajorCheckpoint: true
      });
    }

    return splits;
  }
};

if (typeof module !== 'undefined') {
  module.exports = PacingEngine;
}
