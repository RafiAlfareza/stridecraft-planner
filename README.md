# StrideCraft PRO — Generator Program Latihan Lari

**StrideCraft** adalah aplikasi web modern untuk membuat dan memetakan program latihan lari ilmiah berbasis parameter target individual:
1. **Jarak Target** (5K, 10K, Half Marathon 21.1K, Full Marathon 42.2K, atau Jarak Kustom)
2. **Waktu & Pace Target** (Sinkronisasi dua arah otomatis antara total waktu finish dan pace menit/detik per km)
3. **Durasi Program** (4, 8, 10, 12, 16, hingga 20 minggu)
4. **Frekuensi Mingguan** (3, 4, 5, atau 6 hari latihan per minggu)
5. **Level Pengalaman** (Pemula, Menengah, Lanjutan)

---

## 🌟 Fitur Utama

- **Sinkronisasi Otomatis Waktu & Pace (Bi-directional Calculation)**:
  - Masukkan target waktu finish (misal `00:49:30`), pace target otomatis terhitung (`04:57 /km`) beserta kecepatan rata-rata dalam km/jam.
  - Masukkan target pace (misal `05:30 /km`), total waktu finish otomatis terhitung presisi.

- **Periodisasi Ilmiah Terstruktur**:
  - **Fase 1: Base Building (Pondasi Aerobik)**: Memperbanyak pembentukan kapiler darah baru, efisiensi jantung, dan kekuatan neuromuskular melalui Easy Run dan Strength Training.
  - **Fase 2: Build (Ambang Laktat & Kapasitas)**: Memasukkan sesi Tempo konstan dan interval VO2max terukur untuk menaikkan Lactate Threshold.
  - **Fase 3: Peak (Puncak Volume & Ketajaman)**: Puncak jarak Long Run tertinggi dan simulasi race pace.
  - **Fase 4: Tapering & Kesiapan Lomba**: Penurunan volume bertahap (40-60%) menjaga kebugaran otot sambil mengisi penuh cadangan glikogen menjelang hari perlombaan.
  - **Recovery Weeks**: Setiap 4 minggu terdapat *Step-Back Week* terencana agar tubuh mengalami proses superkompensasi tanpa risiko cedera *overuse*.

- **Plotting Jenis Latihan Lengkap**:
  - 🟢 **Easy / Recovery Run**: Zona 2 santai untuk pemulihan dan pembentukan fondasi mitokondria.
  - 🟡 **Tempo Run**: Ambang laktat (*comfortably hard*) di Zona 4.
  - 🔴 **Interval Run**: VO2 Max (*speed work*) Zona 5 dengan repetisi 400m, 800m, atau 1000m dengan istirahat terukur.
  - 🔵 **Long Run**: Lari jarak jauh progresif untuk ketahanan mental, fisik, dan uji coba nutrisi gel.
  - 🟠 **Strength Training Pelari**: Rangkaian latihan fungsional khusus pelari (Bulgarian split squats, single-leg RDL, calf raises, core deadbug, side plank, hip mobility) untuk mencegah cedera *runner's knee* dan *shin splints*.
  - ⚪ **Rest Day / Shakeout**: Protokol istirahat, tidur, hidrasi, dan aktivasi neuromuscular pra-lomba.

- **Detail Menu Latihan Komprehensif (Modal Interaktif)**:
  Setiap sesi dilengkapi panduan mendalam:
  - **Pemanasan (Warm-Up)**: Durasi spesifik, jarak, dan latihan dinamis (*dynamic drills* seperti high knees, butt kicks, A-skips, dan akselerasi *strides*).
  - **Menu Utama (Main Set)**: Target split waktu per repetisi, target pace spesifik, durasi istirahat, target detak jantung, dan cadence ideal (175-180 spm).
  - **Pendinginan (Cool-Down)**: Jogging lambat pembuangan asam laktat dan peregangan statis menyeluruh.
  - **Tips Pelatih (Coach's Cues)**: Strategi hidrasi, jadwal konsumsi energi gel di km tertentu, dan tips pernapasan ritmik.

- **Grafik Visualisasi Periodisasi (Chart.js)**:
  - Grafik batang dan kurva jarak mingguan interaktif yang menunjukkan transisi fase latihan dari minggu ke-1 hingga minggu perlombaan.

- **Tabel Splits Kilometer Lomba**:
  - Rincian split waktu target untuk setiap kilometer dari Km 1 hingga garis finish.

- **Pelacak Progress Latihan & Penyimpanan Lokal (Local Storage)**:
  - Centang kotak latihan yang telah selesai; kemajuan tersimpan otomatis di browser dengan bar persentase dan efek perayaan (*confetti*).

- **Ekspor Praktis**:
  - **Ekspor Kalender (.ics)**: Unduh jadwal latihan lengkap ke Google Calendar, Apple Calendar, atau Outlook.
  - **Cetak / Simpan ke PDF**: Tampilan ramah cetak untuk dokumentasi fisik atau PDF.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bersifat **100% Client-Side** tanpa perlu instalasi Node.js atau dependensi server luar:

### Cara 1 (Paling Mudah):
Cukup klik dua kali file `index.html` atau jalankan di terminal macOS:
```bash
open index.html
```

### Cara 2 (Menjalankan Local Server):
Jalankan script `serve.sh`:
```bash
./serve.sh
```
Aplikasi akan otomatis membuka browser di alamat `http://localhost:8080`.

---

## 📁 Struktur Berkas

```
.
├── index.html          # Halaman antarmuka utama (Tailwind CSS, Lucide, Chart.js)
├── css/
│   └── styles.css      # Styling khusus, animasi, dan optimasi cetak (print/PDF)
├── js/
│   ├── pacing.js       # Kalkulator fisiologi lari, zona kecepatan, rumus VDOT & split km
│   ├── strength.js     # Modul latihan kekuatan & mobilitas khusus pelari
│   ├── generator.js    # Mesin periodisasi & plotting jadwal per minggu
│   ├── presets.js      # Koleksi preset populer (5K Sub-25, 10K Sub-50, HM Sub-2, dll.)
│   ├── calendar.js     # Generator file kalender iCalendar (.ics)
│   └── app.js          # Pengontrol aplikasi, state management, grafik & interaktivitas
├── serve.sh            # Skrip bash peluncur server lokal otomatis
└── README.md           # Dokumentasi lengkap
```

---

*Selamat berlatih dan capai Personal Best (PB) Anda dengan cerdas dan bebas cedera!* 🏃💨
