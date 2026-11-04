/**
 * Garmin & Coros Training Center XML (.tcx) Workout Generator
 * Allows direct import of structured workouts into Garmin Connect and Coros
 * StrideCraft / PelariMandiri
 */

const TCXExport = {
  /**
   * Convert pace (seconds/km) to speed in meters per second (m/s)
   */
  paceToMps(paceSec) {
    if (!paceSec || paceSec <= 0) return 2.78; // default ~6:00/km
    return (1000 / paceSec);
  },

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  /**
   * Generate .tcx XML content for a workout
   */
  generateTCX(workout, zones) {
    const workoutName = workout.title ? workout.title.slice(0, 15) : 'Running Workout';
    let stepId = 1;
    let stepsXML = [];

    const easyPace = zones?.paces?.easy?.paceSecMid || 360; // 6:00/km
    const easySpeed = this.paceToMps(easyPace);

    // 1. Warm-Up Step
    if (workout.warmUp) {
      stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Pemanasan</Name>
        <Duration xsi:type="Distance_t">
          <Meters>1500.0</Meters>
        </Duration>
        <Intensity>Warmup</Intensity>
        <Target xsi:type="Speed_t">
          <SpeedZone xsi:type="CustomSpeedLowHigh_t">
            <LowInMetersPerSecond>${(easySpeed * 0.9).toFixed(2)}</LowInMetersPerSecond>
            <HighInMetersPerSecond>${(easySpeed * 1.1).toFixed(2)}</HighInMetersPerSecond>
          </SpeedZone>
        </Target>
      </Step>`);
    }

    // 2. Main Steps
    if (workout.type === 'INTERVAL') {
      const intervalPace = zones?.paces?.interval?.paceSec || 270;
      const intervalSpeed = this.paceToMps(intervalPace);
      const repCount = workout.title.includes('800m') ? 5 : (workout.title.includes('1.000m') ? 4 : 8);
      const repDistance = workout.title.includes('800m') ? 800 : (workout.title.includes('1.000m') ? 1000 : 400);

      for (let r = 1; r <= repCount; r++) {
        // Work rep
        stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Rep ${r} (${repDistance}m)</Name>
        <Duration xsi:type="Distance_t">
          <Meters>${repDistance}.0</Meters>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="Speed_t">
          <SpeedZone xsi:type="CustomSpeedLowHigh_t">
            <LowInMetersPerSecond>${(intervalSpeed * 0.95).toFixed(2)}</LowInMetersPerSecond>
            <HighInMetersPerSecond>${(intervalSpeed * 1.05).toFixed(2)}</HighInMetersPerSecond>
          </SpeedZone>
        </Target>
      </Step>`);

        // Rest rep
        stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Recovery Jog</Name>
        <Duration xsi:type="Time_t">
          <Seconds>90</Seconds>
        </Duration>
        <Intensity>Resting</Intensity>
        <Target xsi:type="None_t"/>
      </Step>`);
      }
    } else if (workout.type === 'TEMPO') {
      const tempoPace = zones?.paces?.tempo?.paceSecMid || 300;
      const tempoSpeed = this.paceToMps(tempoPace);
      const tempoDist = Math.max(3000, Math.round((workout.distanceKm - 3) * 1000));

      stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Tempo Block</Name>
        <Duration xsi:type="Distance_t">
          <Meters>${tempoDist}.0</Meters>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="Speed_t">
          <SpeedZone xsi:type="CustomSpeedLowHigh_t">
            <LowInMetersPerSecond>${(tempoSpeed * 0.96).toFixed(2)}</LowInMetersPerSecond>
            <HighInMetersPerSecond>${(tempoSpeed * 1.04).toFixed(2)}</HighInMetersPerSecond>
          </SpeedZone>
        </Target>
      </Step>`);
    } else if (workout.type === 'LONGRUN' || workout.type === 'EASY') {
      const runDist = Math.max(2000, Math.round(workout.distanceKm * 1000));
      stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Steady Run</Name>
        <Duration xsi:type="Distance_t">
          <Meters>${runDist}.0</Meters>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="Speed_t">
          <SpeedZone xsi:type="CustomSpeedLowHigh_t">
            <LowInMetersPerSecond>${(easySpeed * 0.92).toFixed(2)}</LowInMetersPerSecond>
            <HighInMetersPerSecond>${(easySpeed * 1.08).toFixed(2)}</HighInMetersPerSecond>
          </SpeedZone>
        </Target>
      </Step>`);
    }

    // 3. Cool-Down Step
    if (workout.coolDown) {
      stepsXML.push(`
      <Step xsi:type="Step_t">
        <StepId>${stepId++}</StepId>
        <Name>Pendinginan</Name>
        <Duration xsi:type="Distance_t">
          <Meters>1000.0</Meters>
        </Duration>
        <Intensity>Cooldown</Intensity>
        <Target xsi:type="None_t"/>
      </Step>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout SportName="Running">
      <Name>${this.escapeXML(workoutName)}</Name>
      ${stepsXML.join('\n')}
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;
  },

  /**
   * Download .tcx file to user device
   */
  downloadTCX(workout, zones) {
    const xml = this.generateTCX(workout, zones);
    const blob = new Blob([xml], { type: 'application/vnd.garmin.tcx+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const filename = `Workout_${workout.type}_${workout.dayName}_${workout.distanceKm}k.tcx`.replace(/[^a-zA-Z0-9._-]/g, '_');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

if (typeof module !== 'undefined') {
  module.exports = TCXExport;
}
