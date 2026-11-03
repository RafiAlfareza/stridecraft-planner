/**
 * iCalendar (.ics) Export Engine
 * Allows users to import their running plan into Apple Calendar, Google Calendar, Outlook
 * StrideCraft / PelariMandiri
 */

const CalendarExport = {
  /**
   * Format Date to iCalendar UTC string (YYYYMMDDTHHMMSSZ) or Local (YYYYMMDD)
   */
  formatDateToICS(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}${m}${d}`;
  },

  /**
   * Escape special characters for .ics format
   */
  escapeICS(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  },

  /**
   * Generate .ics file content from the program plan
   */
  generateICS(program, startDateInput) {
    let start = startDateInput ? new Date(startDateInput) : new Date();
    // Default to the next Monday if start is not already Monday
    const currentDay = start.getDay(); // 0 is Sunday, 1 is Monday
    const daysUntilMonday = (currentDay === 1) ? 0 : ((8 - currentDay) % 7 || 7);
    const planStartDate = new Date(start);
    planStartDate.setDate(start.getDate() + daysUntilMonday);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StrideCraft//Running Training Generator//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Program Latihan Lari - ' + program.metadata.targetDistanceName,
      'X-WR-TIMEZONE:Asia/Jakarta'
    ];

    program.weeks.forEach((week) => {
      week.schedule.forEach((workout) => {
        // Skip pure rest days to avoid calendar clutter, or user can toggle
        if (workout.type === 'REST' && workout.typeLabel.includes('Penuh')) {
          return;
        }

        // Calculate workout date
        const dayOffset = ((week.weekNumber - 1) * 7) + workout.dayIndex;
        const workoutDate = new Date(planStartDate);
        workoutDate.setDate(planStartDate.getDate() + dayOffset);

        const dateStr = this.formatDateToICS(workoutDate);

        // Build rich description
        let descParts = [
          `PROGRAM: Minggu ${week.weekNumber} (${week.phaseName})`,
          `FOKUS: ${workout.title}`,
          `JARAK: ${workout.distanceKm > 0 ? workout.distanceKm + ' km' : 'N/A'}`,
          `PACE TARGET: ${workout.targetPaceFormatted}`,
          `ESTIMASI DURASI: ${workout.estimatedTimeMinutes} menit`,
          `INTENSITAS: ${workout.intensity} (RPE ${workout.rpe})`,
          '',
          '--- DETAIL MENU LATIHAN ---'
        ];

        if (workout.warmUp) {
          descParts.push(`[PEMANASAN (${workout.warmUp.duration})]`);
          descParts.push(workout.warmUp.details);
          descParts.push('');
        }

        if (workout.mainSet) {
          descParts.push(`[MENU UTAMA: ${workout.mainSet.title}]`);
          if (workout.mainSet.details && Array.isArray(workout.mainSet.details)) {
            workout.mainSet.details.forEach(d => descParts.push(d));
          }
          descParts.push('');
        }

        if (workout.coolDown) {
          descParts.push(`[PENDINGINAN (${workout.coolDown.duration})]`);
          descParts.push(workout.coolDown.details);
          descParts.push('');
        }

        if (workout.coachNotes) {
          descParts.push(`[TIPS PELATIH]: ${workout.coachNotes}`);
        }

        const fullDescription = descParts.join('\n');
        const icon = workout.type === 'INTERVAL' ? '⚡' :
                     workout.type === 'TEMPO' ? '🔥' :
                     workout.type === 'LONGRUN' ? '🏃‍♂️' :
                     workout.type === 'STRENGTH' ? '🏋️' :
                     workout.type === 'RACE' ? '🏆' : '👟';

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:run-${week.weekNumber}-${workout.dayIndex}-${dateStr}@stridecraft.local`);
        icsContent.push(`DTSTAMP:${this.formatDateToICS(new Date())}T000000Z`);
        icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
        icsContent.push(`DTEND;VALUE=DATE:${dateStr}`);
        icsContent.push(`SUMMARY:${icon} M${week.weekNumber}: ${workout.typeLabel} - ${workout.title}`);
        icsContent.push(`DESCRIPTION:${this.escapeICS(fullDescription)}`);
        icsContent.push('STATUS:CONFIRMED');
        icsContent.push('END:VEVENT');
      });
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
  },

  /**
   * Trigger direct browser download of the .ics file
   */
  downloadICS(program, startDateInput) {
    const content = this.generateICS(program, startDateInput);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const filename = `Program_Latihan_${program.metadata.targetDistanceName.replace(/[^a-zA-Z0-9]/g, '_')}_${program.metadata.totalWeeks}Minggu.ics`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

if (typeof module !== 'undefined') {
  module.exports = CalendarExport;
}
