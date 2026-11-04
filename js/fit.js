/**
 * Garmin FIT Binary Workout Generator
 * Generates native Garmin .FIT workout files that can be dropped into GARMIN/NewFiles
 * StrideCraft / PelariMandiri
 */

const FITWorkoutGenerator = {
  // Garmin base epoch: 1989-12-31 00:00:00 UTC
  GARMIN_EPOCH: Date.UTC(1989, 11, 31, 0, 0, 0) / 1000,

  crc16(bytes, start, end) {
    const table = [
      0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
      0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400
    ];
    let crc = 0;
    for (let i = start; i < end; i++) {
      let b = bytes[i];
      let tmp = table[crc & 0xF];
      crc = (crc >> 4) ^ tmp ^ table[b & 0xF];
      tmp = table[crc & 0xF];
      crc = (crc >> 4) ^ tmp ^ table[(b >> 4) & 0xF];
    }
    return crc;
  },

  /**
   * Convert pace (sec/km) to speed in millimeters per second (mm/s)
   */
  paceToMmPs(paceSec) {
    if (!paceSec || paceSec <= 0) return 2778; // 6:00/km -> 2.78 m/s = 2778 mm/s
    return Math.round((1000 / paceSec) * 1000);
  },

  generateFIT(workout, zones) {
    const steps = [];
    const easyPace = zones?.paces?.easy?.paceSecMid || 360;
    const easySpeed = this.paceToMmPs(easyPace);

    // 1. Warm-Up Step
    if (workout.warmUp) {
      steps.push({
        name: 'Warmup',
        durationType: 1, // Distance
        durationValue: 150000, // 1500m in cm (150,000 cm)
        targetType: 0, // Speed
        targetValueLow: Math.round(easySpeed * 0.9),
        targetValueHigh: Math.round(easySpeed * 1.1),
        intensity: 2 // Warmup
      });
    }

    // 2. Main Steps
    if (workout.type === 'INTERVAL') {
      const intervalPace = zones?.paces?.interval?.paceSec || 270;
      const intervalSpeed = this.paceToMmPs(intervalPace);
      const repCount = workout.title.includes('800m') ? 5 : (workout.title.includes('1.000m') ? 4 : 8);
      const repMeters = workout.title.includes('800m') ? 800 : (workout.title.includes('1.000m') ? 1000 : 400);

      for (let r = 1; r <= repCount; r++) {
        // Run rep
        steps.push({
          name: `Rep ${r} ${repMeters}m`,
          durationType: 1, // Distance
          durationValue: repMeters * 100, // cm
          targetType: 0, // Speed
          targetValueLow: Math.round(intervalSpeed * 0.95),
          targetValueHigh: Math.round(intervalSpeed * 1.05),
          intensity: 0 // Active
        });

        // Rest rep (90s jog)
        steps.push({
          name: 'Rest Jog',
          durationType: 0, // Time
          durationValue: 90000, // 90,000 ms
          targetType: 4, // Open / No target
          targetValueLow: 0,
          targetValueHigh: 0,
          intensity: 1 // Rest
        });
      }
    } else if (workout.type === 'TEMPO') {
      const tempoPace = zones?.paces?.tempo?.paceSecMid || 300;
      const tempoSpeed = this.paceToMmPs(tempoPace);
      const tempoMeters = Math.max(3000, Math.round((workout.distanceKm - 3) * 1000));

      steps.push({
        name: 'Tempo Block',
        durationType: 1, // Distance
        durationValue: tempoMeters * 100, // cm
        targetType: 0, // Speed
        targetValueLow: Math.round(tempoSpeed * 0.96),
        targetValueHigh: Math.round(tempoSpeed * 1.04),
        intensity: 0 // Active
      });
    } else {
      // Long run / Easy run
      const runMeters = Math.max(2000, Math.round(workout.distanceKm * 1000));
      steps.push({
        name: 'Steady Run',
        durationType: 1, // Distance
        durationValue: runMeters * 100, // cm
        targetType: 0, // Speed
        targetValueLow: Math.round(easySpeed * 0.92),
        targetValueHigh: Math.round(easySpeed * 1.08),
        intensity: 0 // Active
      });
    }

    // 3. Cool-Down Step
    if (workout.coolDown) {
      steps.push({
        name: 'Cooldown',
        durationType: 1, // Distance
        durationValue: 100000, // 1000m in cm
        targetType: 4, // Open
        targetValueLow: 0,
        targetValueHigh: 0,
        intensity: 3 // Cooldown
      });
    }

    // Binary Serialization Buffer
    const buffer = [];
    const pushByte = (b) => buffer.push(b & 0xFF);
    const pushUint16 = (val) => {
      buffer.push(val & 0xFF);
      buffer.push((val >> 8) & 0xFF);
    };
    const pushUint32 = (val) => {
      buffer.push(val & 0xFF);
      buffer.push((val >> 8) & 0xFF);
      buffer.push((val >> 16) & 0xFF);
      buffer.push((val >> 24) & 0xFF);
    };
    const pushString = (str, maxLen) => {
      for (let i = 0; i < maxLen; i++) {
        if (i < str.length) {
          buffer.push(str.charCodeAt(i) & 0xFF);
        } else {
          buffer.push(0);
        }
      }
    };

    const dataStartIdx = 14; // After 14-byte header

    // 1. Definition Message 0: File ID (Global 0)
    pushByte(0x40); // Local Msg 0 Definition
    pushByte(0); pushByte(0); // Reserved + Little Endian
    pushUint16(0); // Global Msg 0 (File ID)
    pushByte(4); // 4 Fields
    pushByte(0); pushByte(1); pushByte(0x00); // Field 0: type (enum 1 byte)
    pushByte(1); pushByte(2); pushByte(0x84); // Field 1: manufacturer (uint16)
    pushByte(2); pushByte(2); pushByte(0x84); // Field 2: product (uint16)
    pushByte(4); pushByte(4); pushByte(0x86); // Field 4: time_created (uint32)

    // Data Message 0: File ID
    pushByte(0x00); // Local Msg 0 Data
    pushByte(5); // Workout
    pushUint16(1); // Garmin
    pushUint16(0); // Product
    const nowGarmin = Math.floor(Date.now() / 1000) - this.GARMIN_EPOCH;
    pushUint32(nowGarmin);

    // 2. Definition Message 1: Workout (Global 26)
    pushByte(0x41); // Local Msg 1 Definition
    pushByte(0); pushByte(0);
    pushUint16(26); // Global Msg 26 (Workout)
    pushByte(4); // 4 Fields
    pushByte(4); pushByte(1); pushByte(0x00); // Field 4: sport (enum)
    pushByte(5); pushByte(4); pushByte(0x86); // Field 5: capabilities (uint32)
    pushByte(6); pushByte(2); pushByte(0x84); // Field 6: num_valid_steps (uint16)
    pushByte(8); pushByte(16); pushByte(0x07); // Field 8: wkt_name (string 16 bytes)

    // Data Message 1: Workout
    pushByte(0x01); // Local Msg 1 Data
    pushByte(1); // Running
    pushUint32(0x00000020); // Running capabilities
    pushUint16(steps.length);
    const cleanTitle = (workout.title || 'Workout').slice(0, 15);
    pushString(cleanTitle, 16);

    // 3. Definition Message 2: Workout Step (Global 27)
    pushByte(0x42); // Local Msg 2 Definition
    pushByte(0); pushByte(0);
    pushUint16(27); // Global Msg 27 (Workout Step)
    pushByte(9); // 9 Fields
    pushByte(254); pushByte(2); pushByte(0x84); // Field 254: message_index (uint16)
    pushByte(0); pushByte(16); pushByte(0x07); // Field 0: wkt_step_name (string 16 bytes)
    pushByte(1); pushByte(1); pushByte(0x00); // Field 1: duration_type (enum)
    pushByte(2); pushByte(4); pushByte(0x86); // Field 2: duration_value (uint32)
    pushByte(3); pushByte(1); pushByte(0x00); // Field 3: target_type (enum)
    pushByte(4); pushByte(4); pushByte(0x86); // Field 4: target_value (uint32)
    pushByte(5); pushByte(4); pushByte(0x86); // Field 5: custom_target_value_low (uint32)
    pushByte(6); pushByte(4); pushByte(0x86); // Field 6: custom_target_value_high (uint32)
    pushByte(7); pushByte(1); pushByte(0x00); // Field 7: intensity (enum)

    // Data Messages 2: Workout Steps
    steps.forEach((s, idx) => {
      pushByte(0x02); // Local Msg 2 Data
      pushUint16(idx); // message_index
      pushString(s.name.slice(0, 15), 16);
      pushByte(s.durationType);
      pushUint32(s.durationValue);
      pushByte(s.targetType);
      pushUint32(0); // target_value
      pushUint32(s.targetValueLow);
      pushUint32(s.targetValueHigh);
      pushByte(s.intensity);
    });

    const dataSize = buffer.length;

    // Build 14-byte Header at beginning
    const header = [];
    header.push(14); // Header size
    header.push(0x20); // Protocol version 2.0
    header.push(0x42); header.push(0x08); // Profile version 21.14
    // Data size (uint32 LE)
    header.push(dataSize & 0xFF);
    header.push((dataSize >> 8) & 0xFF);
    header.push((dataSize >> 16) & 0xFF);
    header.push((dataSize >> 24) & 0xFF);
    // .FIT signature
    header.push('.'.charCodeAt(0));
    header.push('F'.charCodeAt(0));
    header.push('I'.charCodeAt(0));
    header.push('T'.charCodeAt(0));
    // Header CRC (uint16 LE)
    const headerCrc = this.crc16(header, 0, 12);
    header.push(headerCrc & 0xFF);
    header.push((headerCrc >> 8) & 0xFF);

    // Combine Header + Data
    const fullBytes = new Uint8Array(14 + dataSize + 2);
    fullBytes.set(header, 0);
    fullBytes.set(buffer, 14);

    // File CRC at end
    const fileCrc = this.crc16(fullBytes, 0, 14 + dataSize);
    fullBytes[14 + dataSize] = fileCrc & 0xFF;
    fullBytes[14 + dataSize + 1] = (fileCrc >> 8) & 0xFF;

    return fullBytes;
  },

  /**
   * Download .FIT file directly
   */
  downloadFIT(workout, zones) {
    const bytes = this.generateFIT(workout, zones);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const filename = `Garmin_${workout.type}_${workout.distanceKm}k.fit`.replace(/[^a-zA-Z0-9._-]/g, '_');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

if (typeof module !== 'undefined') {
  module.exports = FITWorkoutGenerator;
}
