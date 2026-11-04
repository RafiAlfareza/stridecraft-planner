/**
 * Garmin Connect Workout JSON Generator
 * Generates official Garmin Connect JSON payload for 1-click import via Garmin Workout Importer extension
 * StrideCraft / PelariMandiri
 */

const GarminJSONExport = {
  paceToMps(paceSec) {
    if (!paceSec || paceSec <= 0) return 2.78;
    return 1000 / paceSec;
  },

  generateGarminWorkoutJSON(workout, zones) {
    const easyPace = zones?.paces?.easy?.paceSecMid || 360;
    const easySpeed = this.paceToMps(easyPace);

    let stepOrder = 1;
    const workoutSteps = [];

    // Warmup
    if (workout.warmUp) {
      workoutSteps.push({
        type: "WorkoutStep",
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 1, stepTypeKey: "warmup" },
        endCondition: { conditionTypeId: 3, conditionTypeKey: "distance" },
        endConditionValue: 1500, // 1.5 km
        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "speed.zone" },
        targetValueLow: parseFloat((easySpeed * 0.9).toFixed(2)),
        targetValueHigh: parseFloat((easySpeed * 1.1).toFixed(2))
      });
    }

    // Main
    if (workout.type === 'INTERVAL') {
      const intervalPace = zones?.paces?.interval?.paceSec || 270;
      const intervalSpeed = this.paceToMps(intervalPace);
      const repCount = workout.title.includes('800m') ? 5 : (workout.title.includes('1.000m') ? 4 : 8);
      const repMeters = workout.title.includes('800m') ? 800 : (workout.title.includes('1.000m') ? 1000 : 400);

      const repeatSteps = [
        {
          type: "WorkoutStep",
          stepOrder: 1,
          stepType: { stepTypeId: 3, stepTypeKey: "interval" },
          endCondition: { conditionTypeId: 3, conditionTypeKey: "distance" },
          endConditionValue: repMeters,
          targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "speed.zone" },
          targetValueLow: parseFloat((intervalSpeed * 0.95).toFixed(2)),
          targetValueHigh: parseFloat((intervalSpeed * 1.05).toFixed(2))
        },
        {
          type: "WorkoutStep",
          stepOrder: 2,
          stepType: { stepTypeId: 4, stepTypeKey: "recovery" },
          endCondition: { conditionTypeId: 2, conditionTypeKey: "time" },
          endConditionValue: 90, // 90 seconds
          targetType: { workoutTargetTypeId: 2, workoutTargetTypeKey: "no.target" }
        }
      ];

      workoutSteps.push({
        type: "WorkoutRepeatStep",
        stepOrder: stepOrder++,
        repeatType: { repeatTypeId: 1, repeatTypeKey: "repeat.until.steps.cmplt" },
        repeatValue: repCount,
        workoutSteps: repeatSteps
      });
    } else if (workout.type === 'TEMPO') {
      const tempoPace = zones?.paces?.tempo?.paceSecMid || 300;
      const tempoSpeed = this.paceToMps(tempoPace);
      const tempoMeters = Math.max(3000, Math.round((workout.distanceKm - 3) * 1000));

      workoutSteps.push({
        type: "WorkoutStep",
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 3, stepTypeKey: "interval" },
        endCondition: { conditionTypeId: 3, conditionTypeKey: "distance" },
        endConditionValue: tempoMeters,
        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "speed.zone" },
        targetValueLow: parseFloat((tempoSpeed * 0.96).toFixed(2)),
        targetValueHigh: parseFloat((tempoSpeed * 1.04).toFixed(2))
      });
    } else {
      const runMeters = Math.max(2000, Math.round(workout.distanceKm * 1000));
      workoutSteps.push({
        type: "WorkoutStep",
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 3, stepTypeKey: "interval" },
        endCondition: { conditionTypeId: 3, conditionTypeKey: "distance" },
        endConditionValue: runMeters,
        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "speed.zone" },
        targetValueLow: parseFloat((easySpeed * 0.92).toFixed(2)),
        targetValueHigh: parseFloat((easySpeed * 1.08).toFixed(2))
      });
    }

    // Cooldown
    if (workout.coolDown) {
      workoutSteps.push({
        type: "WorkoutStep",
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 2, stepTypeKey: "cooldown" },
        endCondition: { conditionTypeId: 3, conditionTypeKey: "distance" },
        endConditionValue: 1000,
        targetType: { workoutTargetTypeId: 2, workoutTargetTypeKey: "no.target" }
      });
    }

    return {
      workoutName: (workout.title || 'StrideCraft Workout').slice(0, 30),
      description: `Target Pace: ${workout.targetPaceFormatted} - StrideCraft PRO`,
      sportType: { sportTypeId: 1, sportTypeKey: "running" },
      subSportType: null,
      workoutSegments: [
        {
          segmentOrder: 1,
          sportType: { sportTypeId: 1, sportTypeKey: "running" },
          workoutSteps: workoutSteps
        }
      ]
    };
  },

  downloadJSON(workout, zones) {
    const jsonObj = this.generateGarminWorkoutJSON(workout, zones);
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const filename = `GarminConnect_${workout.type}_${workout.distanceKm}k.json`.replace(/[^a-zA-Z0-9._-]/g, '_');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

if (typeof module !== 'undefined') {
  module.exports = GarminJSONExport;
}
