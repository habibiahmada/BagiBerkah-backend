/**
 * Hardcoded quiz templates as fallback when AI is unavailable
 */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questions: QuizQuestion[];
}

export const QUIZ_TEMPLATES: QuizTemplate[] = [
  {
    id: 'pengetahuan-umum-mudah',
    name: 'Pengetahuan Umum',
    description: 'Pertanyaan umum seputar kehidupan sehari-hari',
    difficulty: 'EASY',
    questions: [
      {
        question: 'Apa ibu kota Indonesia?',
        options: ['Bandung', 'Jakarta', 'Surabaya', 'Medan'],
        correctAnswer: 1,
        explanation: 'Jakarta adalah ibu kota Indonesia sejak kemerdekaan.',
      },
      {
        question: 'Berapa jumlah hari dalam satu minggu?',
        options: ['5 hari', '6 hari', '7 hari', '8 hari'],
        correctAnswer: 2,
        explanation: 'Satu minggu terdiri dari 7 hari.',
      },
      {
        question: 'Warna bendera Indonesia adalah?',
        options: ['Merah Putih', 'Merah Kuning', 'Biru Putih', 'Hijau Putih'],
        correctAnswer: 0,
        explanation: 'Bendera Indonesia berwarna Merah Putih.',
      },
      {
        question: 'Planet terdekat dengan Matahari adalah?',
        options: ['Venus', 'Bumi', 'Merkurius', 'Mars'],
        correctAnswer: 2,
        explanation: 'Merkurius adalah planet terdekat dengan Matahari.',
      },
      {
        question: 'Berapa jumlah provinsi di Indonesia?',
        options: ['34', '35', '36', '38'],
        correctAnswer: 3,
        explanation: 'Indonesia memiliki 38 provinsi.',
      },
    ],
  },
  {
    id: 'sejarah-indonesia-mudah',
    name: 'Sejarah Indonesia',
    description: 'Pertanyaan tentang sejarah kemerdekaan Indonesia',
    difficulty: 'EASY',
    questions: [
      {
        question: 'Kapan Indonesia merdeka?',
        options: ['17 Agustus 1945', '17 Agustus 1944', '1 Juni 1945', '20 Mei 1945'],
        correctAnswer: 0,
        explanation: 'Indonesia merdeka pada 17 Agustus 1945.',
      },
      {
        question: 'Siapa proklamator kemerdekaan Indonesia?',
        options: ['Soekarno dan Hatta', 'Soeharto', 'Habibie', 'Jokowi'],
        correctAnswer: 0,
        explanation: 'Soekarno dan Mohammad Hatta adalah proklamator kemerdekaan Indonesia.',
      },
      {
        question: 'Siapa presiden pertama Indonesia?',
        options: ['Soeharto', 'Soekarno', 'Habibie', 'Megawati'],
        correctAnswer: 1,
        explanation: 'Ir. Soekarno adalah presiden pertama Indonesia.',
      },
      {
        question: 'Pancasila memiliki berapa sila?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 2,
        explanation: 'Pancasila memiliki 5 sila sebagai dasar negara Indonesia.',
      },
      {
        question: 'Hari Pahlawan diperingati setiap tanggal?',
        options: ['10 November', '17 Agustus', '1 Juni', '20 Mei'],
        correctAnswer: 0,
        explanation: 'Hari Pahlawan diperingati setiap 10 November.',
      },
    ],
  },
  {
    id: 'agama-islam-mudah',
    name: 'Agama Islam',
    description: 'Pertanyaan dasar tentang Islam',
    difficulty: 'EASY',
    questions: [
      {
        question: 'Berapa jumlah rukun Islam?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 2,
        explanation: 'Rukun Islam ada 5: Syahadat, Sholat, Zakat, Puasa, dan Haji.',
      },
      {
        question: 'Kitab suci umat Islam adalah?',
        options: ['Injil', 'Taurat', 'Al-Quran', 'Zabur'],
        correctAnswer: 2,
        explanation: 'Al-Quran adalah kitab suci umat Islam.',
      },
      {
        question: 'Nabi terakhir dalam Islam adalah?',
        options: ['Nabi Isa', 'Nabi Musa', 'Nabi Ibrahim', 'Nabi Muhammad'],
        correctAnswer: 3,
        explanation: 'Nabi Muhammad SAW adalah nabi terakhir dalam Islam.',
      },
      {
        question: 'Bulan puasa umat Islam adalah?',
        options: ['Syawal', 'Ramadan', 'Muharram', 'Rajab'],
        correctAnswer: 1,
        explanation: 'Ramadan adalah bulan puasa bagi umat Islam.',
      },
      {
        question: 'Kiblat sholat umat Islam menghadap ke?',
        options: ['Masjid Nabawi', 'Kabah', 'Masjid Al-Aqsa', 'Masjid Istiqlal'],
        correctAnswer: 1,
        explanation: 'Kiblat sholat umat Islam menghadap ke Kabah di Mekah.',
      },
    ],
  },
  {
    id: 'matematika-mudah',
    name: 'Matematika Dasar',
    description: 'Soal matematika sederhana',
    difficulty: 'EASY',
    questions: [
      {
        question: '10 + 5 = ?',
        options: ['10', '15', '20', '25'],
        correctAnswer: 1,
        explanation: '10 ditambah 5 sama dengan 15.',
      },
      {
        question: '20 - 8 = ?',
        options: ['10', '11', '12', '13'],
        correctAnswer: 2,
        explanation: '20 dikurangi 8 sama dengan 12.',
      },
      {
        question: '5 x 6 = ?',
        options: ['25', '30', '35', '40'],
        correctAnswer: 1,
        explanation: '5 dikali 6 sama dengan 30.',
      },
      {
        question: '100 : 5 = ?',
        options: ['15', '20', '25', '30'],
        correctAnswer: 1,
        explanation: '100 dibagi 5 sama dengan 20.',
      },
      {
        question: 'Berapa hasil dari 7 + 3 x 2?',
        options: ['13', '20', '17', '16'],
        correctAnswer: 0,
        explanation: 'Perkalian dikerjakan terlebih dahulu: 3 x 2 = 6, lalu 7 + 6 = 13.',
      },
    ],
  },
  {
    id: 'sains-mudah',
    name: 'Sains & Alam',
    description: 'Pertanyaan tentang sains dan alam',
    difficulty: 'EASY',
    questions: [
      {
        question: 'Air mendidih pada suhu berapa derajat Celcius?',
        options: ['50°C', '75°C', '100°C', '150°C'],
        correctAnswer: 2,
        explanation: 'Air mendidih pada suhu 100 derajat Celcius.',
      },
      {
        question: 'Hewan yang bisa terbang adalah?',
        options: ['Kucing', 'Burung', 'Ikan', 'Sapi'],
        correctAnswer: 1,
        explanation: 'Burung adalah hewan yang bisa terbang.',
      },
      {
        question: 'Tumbuhan membuat makanan melalui proses?',
        options: ['Respirasi', 'Fotosintesis', 'Transpirasi', 'Evaporasi'],
        correctAnswer: 1,
        explanation: 'Tumbuhan membuat makanan melalui proses fotosintesis.',
      },
      {
        question: 'Berapa jumlah warna pelangi?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
        explanation: 'Pelangi memiliki 7 warna.',
      },
      {
        question: 'Planet terbesar di tata surya adalah?',
        options: ['Bumi', 'Mars', 'Jupiter', 'Saturnus'],
        correctAnswer: 2,
        explanation: 'Jupiter adalah planet terbesar di tata surya.',
      },
    ],
  },
];

/**
 * Get quiz template by ID
 */
export function getQuizTemplate(id: string): QuizTemplate | undefined {
  return QUIZ_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all quiz templates
 */
export function getAllQuizTemplates(): QuizTemplate[] {
  return QUIZ_TEMPLATES;
}

/**
 * Get quiz templates by difficulty
 */
export function getQuizTemplatesByDifficulty(
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
): QuizTemplate[] {
  return QUIZ_TEMPLATES.filter((t) => t.difficulty === difficulty);
}
