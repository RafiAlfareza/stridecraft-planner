/**
 * Curated Popular Training Presets
 * StrideCraft / PelariMandiri
 */

const TrainingPresets = [
  {
    id: '5k-sub-25',
    title: '5K Sub-25 Menit',
    tagline: 'Benchmark Pelari Cepat',
    distanceKm: 5,
    distanceLabel: '5K',
    targetTime: '00:24:59',
    targetPace: '04:59',
    totalWeeks: 8,
    daysPerWeek: 4,
    level: 'intermediate',
    badge: 'Populer',
    badgeColor: 'bg-emerald-500',
    description: 'Program 8 minggu untuk menembus barrier 25 menit 5K dengan kombinasi interval 400m-800m dan tempo run terarah.'
  },
  {
    id: '5k-sub-30',
    title: '5K Sub-30 Menit (Beginner)',
    tagline: 'Langkah Awal Menuju Kecepatan',
    distanceKm: 5,
    distanceLabel: '5K',
    targetTime: '00:29:50',
    targetPace: '05:58',
    totalWeeks: 8,
    daysPerWeek: 3,
    level: 'beginner',
    badge: 'Pemula',
    badgeColor: 'bg-blue-500',
    description: 'Cocok untuk pelari pemula yang ingin menyelesaikan 5K dengan pace stabil di bawah 6 menit/km tanpa kehabisan napas.'
  },
  {
    id: '10k-sub-50',
    title: '10K Sub-50 Menit',
    tagline: 'Ketahanan Ambang Laktat',
    distanceKm: 10,
    distanceLabel: '10K',
    targetTime: '00:49:30',
    targetPace: '04:57',
    totalWeeks: 10,
    daysPerWeek: 4,
    level: 'intermediate',
    badge: 'Favorit',
    badgeColor: 'bg-amber-500',
    description: 'Target prestisius bagi pelari 10K. Melatih ambang laktat dengan tempo 25-30 menit dan interval 1000m yang solid.'
  },
  {
    id: '10k-sub-60',
    title: '10K Sub-60 Menit (1 Jam)',
    tagline: 'Menembus Batas 1 Jam',
    distanceKm: 10,
    distanceLabel: '10K',
    targetTime: '00:59:00',
    targetPace: '05:54',
    totalWeeks: 8,
    daysPerWeek: 3,
    level: 'beginner',
    badge: 'Populer',
    badgeColor: 'bg-sky-500',
    description: 'Membangun pondasi aerobik dan daya tahan untuk menyelesaikan 10K dalam waktu kurang dari 60 menit.'
  },
  {
    id: 'hm-sub-2',
    title: 'Half Marathon Sub-2 Jam',
    tagline: 'The Holy Grail of HM',
    distanceKm: 21.0975,
    distanceLabel: 'Half Marathon (21.1K)',
    targetTime: '01:59:00',
    targetPace: '05:38',
    totalWeeks: 12,
    daysPerWeek: 4,
    level: 'intermediate',
    badge: 'Sangat Populer',
    badgeColor: 'bg-purple-600',
    description: 'Program andalan 12 minggu untuk memecahkan rekor Sub-2 jam Half Marathon dengan Long Run progresif hingga 19-20 km.'
  },
  {
    id: 'hm-sub-145',
    title: 'Half Marathon Sub-1:45',
    tagline: 'Target Kompetitif',
    distanceKm: 21.0975,
    distanceLabel: 'Half Marathon (21.1K)',
    targetTime: '01:44:30',
    targetPace: '04:57',
    totalWeeks: 12,
    daysPerWeek: 5,
    level: 'advanced',
    badge: 'Lanjutan',
    badgeColor: 'bg-rose-500',
    description: 'Untuk pelari berpengalaman yang mengincar pace sub-5:00/km di jarak 21.1 km dengan volume mingguan tinggi.'
  },
  {
    id: 'fm-sub-4',
    title: 'Full Marathon Sub-4 Jam',
    tagline: 'Dream Benchmark 42.195K',
    distanceKm: 42.195,
    distanceLabel: 'Marathon (42.2K)',
    targetTime: '03:58:00',
    targetPace: '05:38',
    totalWeeks: 16,
    daysPerWeek: 4,
    level: 'intermediate',
    badge: 'Prestisius',
    badgeColor: 'bg-orange-600',
    description: 'Program komprehensif 16 minggu dengan periodisasi lengkap, puncak Long Run 32-34 km, latihan nutrisi, dan 3 minggu tapering.'
  },
  {
    id: 'fm-sub-330',
    title: 'Full Marathon Sub-3:30 (Boston Qualifier)',
    tagline: 'Elite Amateur Level',
    distanceKm: 42.195,
    distanceLabel: 'Marathon (42.2K)',
    targetTime: '03:28:00',
    targetPace: '04:55',
    totalWeeks: 16,
    daysPerWeek: 5,
    level: 'advanced',
    badge: 'BQ Standard',
    badgeColor: 'bg-red-600',
    description: 'Program intensif tingkat lanjutan dengan simulasi tempo marathon berkelanjutan dan volume mingguan hingga 75+ km.'
  }
];

if (typeof module !== 'undefined') {
  module.exports = TrainingPresets;
}
