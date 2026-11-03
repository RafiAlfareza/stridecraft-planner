/**
 * Runner-Specific Strength & Conditioning Workouts
 * StrideCraft / PelariMandiri
 */

const StrengthLibrary = {
  routines: {
    routineA: {
      id: 'strength-lower-knee',
      title: 'Kekuatan Kaki Bawah & Stabilitas Lutut',
      subtitle: 'Fokus pada kekuatan unilateral (satu kaki), pencegahan runner\'s knee & stabilitas panggul',
      durationMinutes: 40,
      equipment: 'Matras, Dumbbell / Beban Botol Air (Opsional)',
      exercises: [
        {
          name: 'Bulgarian Split Squat',
          sets: '3 set',
          reps: '8 - 10 rep per kaki',
          rest: '60 detik antar set',
          targetMuscles: 'Quadriceps, Gluteus Medius, Core',
          coachingCue: 'Letakkan kaki belakang di bangku/sofa. Turun perlahan dengan lutut depan membentuk 90 derajat. Jaga dada tetap tegak dan lutut depan stabil tidak goyang ke dalam (valgus collapse).'
        },
        {
          name: 'Single-Leg Romanian Deadlift (RDL)',
          sets: '3 set',
          reps: '10 rep per kaki',
          rest: '60 detik antar set',
          targetMuscles: 'Hamstring, Gluteus Maximus, Stabilitas Pergelangan Kaki',
          coachingCue: 'Tumpu satu kaki sedikit ditekuk. Dorong pinggul ke belakang dengan punggung lurus seperti engsel pintu. Rasakan tarikan di hamstring, bukan pinggang bawah.'
        },
        {
          name: 'Standing & Seated Calf Raises',
          sets: '4 set',
          reps: '15 - 20 rep (2 kaki lurus + 2 lutut ditekuk)',
          rest: '45 detik antar set',
          targetMuscles: 'Gastrocnemius & Soleus (Achilles Tendon Guard)',
          coachingCue: 'Lakukan di ujung anak tangga. Turunkan tumit ke bawah batas pijakan untuk rentang gerak penuh, lalu dorong naik ke ujung jari kaki secara terkontrol.'
        },
        {
          name: 'Single-Leg Glute Bridge',
          sets: '3 set',
          reps: '12 rep per kaki',
          rest: '45 detik antar set',
          targetMuscles: 'Gluteus Maximus, Hip Extension Power',
          coachingCue: 'Berbaring telentang, tekuk satu lutut dan angkat kaki lainnya ke udara. Dorong tumit ke lantai dan angkat panggul hingga lurus dengan paha. Tahan 1 detik di puncak.'
        },
        {
          name: 'Tibialis Anterior Raises (Angkat Jari Kaki ke Dinding)',
          sets: '3 set',
          reps: '20 rep',
          rest: '30 detik antar set',
          targetMuscles: 'Tibialis Anterior (Anti Shin Splints)',
          coachingCue: 'Sandarkan punggung ke dinding, tumit sekitar 30cm di depan dinding. Angkat jari kaki setinggi mungkin ke arah tulang kering, tahan 1 detik, lalu turunkan perlahan.'
        }
      ]
    },

    routineB: {
      id: 'strength-core-pelvic',
      title: 'Stabilitas Core & Anti-Rotasi Panggul',
      subtitle: 'Mempertahankan postur tegak saat lelah di km akhir dan mencegah energi lari bocor',
      durationMinutes: 30,
      equipment: 'Matras senam',
      exercises: [
        {
          name: 'Deadbug (Anti-Extension Core)',
          sets: '3 set',
          reps: '10 rep per sisi (Total 20 rep)',
          rest: '45 detik antar set',
          targetMuscles: 'Transversus Abdominis, Deep Core',
          coachingCue: 'Pastikan punggung bawah menempel rata di lantai (tidak melengkung). Turunkan tangan kanan dan kaki kiri bersamaan secara lambat dan terkendali.'
        },
        {
          name: 'Side Plank with Hip Abduction (Clamshell / Leg Raise)',
          sets: '3 set',
          reps: '30 - 40 detik per sisi',
          rest: '45 detik antar set',
          targetMuscles: 'Gluteus Medius, Obliques (Stabilitas Pelvis)',
          coachingCue: 'Plank samping bertumpu pada siku. Angkat panggul tinggi lurus dari bahu ke pergelangan kaki. Tambahkan angkat kaki atas perlahan untuk mengaktifkan gluteus samping.'
        },
        {
          name: 'Bird-Dog (Cross-Body Balance)',
          sets: '3 set',
          reps: '10 rep per sisi',
          rest: '45 detik antar set',
          targetMuscles: 'Erector Spinae, Glutes, Kontrol Rotasi Tulang Belakang',
          coachingCue: 'Posisi merangkak. Ulurkan tangan kanan ke depan dan kaki kiri ke belakang lurus sejajar lantai. Tahan 2 detik tanpa membuat panggul miring.'
        },
        {
          name: 'Pallof Press (atau Russian Twist Terkontrol)',
          sets: '3 set',
          reps: '12 rep per sisi',
          rest: '45 detik antar set',
          targetMuscles: 'Anti-Rotation Obliques & Torso Integrity',
          coachingCue: 'Gunakan resistance band atau tahan beban di depan dada. Dorong tangan lurus ke depan melawan gaya puntir tanpa membiarkan torso berputar.'
        },
        {
          name: 'Hollow Body Hold',
          sets: '3 set',
          reps: '20 - 30 detik tahan',
          rest: '60 detik antar set',
          targetMuscles: 'Anterior Core & Full Kinetic Chain',
          coachingCue: 'Bentuk tubuh melengkung seperti pisang. Punggung bawah rapat ke lantai, bahu dan kaki sedikit terangkat. Bernapas konstan.'
        }
      ]
    },

    routineC: {
      id: 'strength-power-plyo',
      title: 'Kekuatan Daya Ledak & Elastisitas Tendon (Plyometrics)',
      subtitle: 'Meningkatkan Running Economy (efisiensi langkah), kekakuan pegas tendon & cadence',
      durationMinutes: 35,
      equipment: 'Matras, Kotak/Anak Tangga rendah',
      exercises: [
        {
          name: 'Low Pogo Hops (Lompat Pegas Ujung Kaki)',
          sets: '3 set',
          reps: '20 - 30 lompatan cepat',
          rest: '60 detik antar set',
          targetMuscles: 'Achilles Tendon Stiffness & Rekoil Elastis',
          coachingCue: 'Lompat pendek dan cepat menggunakan pergelangan kaki dan ujung kaki tanpa menekuk lutut terlalu dalam. Waktu sentuh tanah sependek mungkin.'
        },
        {
          name: 'Explosive Step-Ups',
          sets: '3 set',
          reps: '8 rep per kaki',
          rest: '60 detik antar set',
          targetMuscles: 'Quadriceps, Gluteus, Daya Dorong Langkah',
          coachingCue: 'Pijak satu kaki ke anak tangga/box setinggi lutut. Dorong badan naik eksplosif dan angkat lutut lawan ke atas (drive high knee) seperti gerakan sprint.'
        },
        {
          name: 'Skater Hops (Lompatan Lateral Samping)',
          sets: '3 set',
          reps: '12 - 16 lompatan bergantian',
          rest: '60 detik antar set',
          targetMuscles: 'Stabilitas Bidang Frontal, Ankle Lateral, Glute Medius',
          coachingCue: 'Lompat ke samping mendarat di satu kaki dengan lutut lentur menyerap beban, lalu segera lompat ke sisi sebaliknya.'
        },
        {
          name: 'Push-Up to Downward Dog',
          sets: '3 set',
          reps: '10 - 12 rep',
          rest: '45 detik antar set',
          targetMuscles: 'Dada, Bahu, Hamstring/Calf Stretch Active',
          coachingCue: 'Lakukan push up dengan form solid, lalu dorong panggul ke atas membentuk huruf V terbalik untuk meregangkan betis dan rantai belakang.'
        },
        {
          name: 'Inverted Row / Resistance Band Pull-Apart',
          sets: '3 set',
          reps: '15 rep',
          rest: '45 detik antar set',
          targetMuscles: 'Rhomboids, Rear Deltoids (Postur Ayunan Tangan Lari)',
          coachingCue: 'Tarik band di depan dada hingga menyentuh dada atas sambil merapatkan tulang belikat. Menguatkan postur agar bahu tidak membungkuk saat lelah.'
        }
      ]
    },

    routineD: {
      id: 'mobility-recovery',
      title: 'Mobilitas Pinggul, Ankle & Pemulihan Aktif',
      subtitle: 'Mengurangi ketegangan otot setelah Long Run dan mengembalikan rentang gerak optimal',
      durationMinutes: 25,
      equipment: 'Matras, Foam Roller',
      exercises: [
        {
          name: '90-90 Hip Switch & Mobility',
          sets: '2 set',
          reps: '8 rotasi lambat per sisi',
          rest: '30 detik',
          targetMuscles: 'Internal & External Hip Rotation',
          coachingCue: 'Duduk dengan kedua kaki membentuk sudut 90 derajat. Putar lutut ke arah berlawanan secara perlahan tanpa mengangkat bokong berlebih.'
        },
        {
          name: 'World\'s Greatest Stretch (Lunge with Thoracic Reach)',
          sets: '2 set',
          reps: '5 rep per sisi (tahan 3 detik)',
          rest: '30 detik',
          targetMuscles: 'Hip Flexor, Hamstring, Thoracic Spine',
          coachingCue: 'Posisi lunge dalam, letakkan kedua telapak tangan di lantai sebelah kaki depan. Putar dada dan ulurkan satu tangan ke arah langit.'
        },
        {
          name: 'Wall Ankle Dorsiflexion Drill',
          sets: '3 set',
          reps: '12 dorongan lutut per kaki',
          rest: '20 detik',
          targetMuscles: 'Kapsul Sendi Ankle & Soleus Mobility',
          coachingCue: 'Jari kaki menghadap dinding jarak ~10cm. Dorong lutut menyentuh dinding tanpa membiarkan tumit terangkat dari lantai.'
        },
        {
          name: 'Foam Rolling / Self-Myofascial Release (IT-Band, Calves, Quads)',
          sets: '1 set',
          reps: '60 detik per kelompok otot',
          rest: 'Santai',
          targetMuscles: 'Fascia & Sirkulasi Darah Otot Lelah',
          coachingCue: 'Gulingkan foam roller secara perlahan. Saat menemukan area yang tegang (trigger point), tahan di titik tersebut selama 20-30 detik sambil bernapas dalam.'
        }
      ]
    }
  },

  getRoutineForWeekAndDay(weekNumber, sessionIndex = 0) {
    // Cycle routines smartly through the weeks
    const routinesList = [
      this.routines.routineA,
      this.routines.routineB,
      this.routines.routineC,
      this.routines.routineA,
      this.routines.routineB
    ];
    return routinesList[(weekNumber + sessionIndex) % routinesList.length];
  }
};

if (typeof module !== 'undefined') {
  module.exports = StrengthLibrary;
}
