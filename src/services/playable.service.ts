import OpenAI from 'openai';
import { env } from '../config/env';
import logger from '../config/logger';

interface RecipientProfile {
  name: string;
  ageLevel: 'CHILD' | 'TEEN' | 'ADULT';
  status: 'SCHOOL' | 'COLLEGE' | 'WORKING' | 'NOT_WORKING';
  closeness: 'VERY_CLOSE' | 'CLOSE' | 'DISTANT';
}

interface PlayableRecommendation {
  playableType: 'DIRECT' | 'GAME' | 'QUIZ';
  gameType?: 'MEMORY_CARD' | 'SPIN_WHEEL' | 'SCRATCH_CARD' | 'BALLOON_POP' | 'TREASURE_HUNT';
  reasoning: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export class PlayableService {
  private openai: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Recommend playable type and game based on recipient profile
   */
  async recommendPlayable(recipient: RecipientProfile): Promise<PlayableRecommendation> {
    // Fallback if no OpenAI
    if (!this.openai) {
      return this.getFallbackRecommendation(recipient);
    }

    try {
      const prompt = this.buildRecommendationPrompt(recipient);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Anda adalah AI yang membantu menentukan jenis game/quiz yang cocok untuk penerima THR berdasarkan profil mereka.
            
Pilihan playableType:
- DIRECT: Langsung dapat tanpa game/quiz (untuk orang tua, orang sibuk)
- GAME: Main game dulu (untuk anak-anak, remaja, orang yang suka hiburan)
- QUIZ: Jawab quiz dulu (untuk pelajar, mahasiswa, orang yang suka tantangan)

Pilihan gameType (jika GAME):
- MEMORY_CARD: Cocokkan kartu (mudah, untuk semua usia)
- SCRATCH_CARD: Gores kartu (sangat mudah, cepat)
- SPIN_WHEEL: Putar roda (mudah, beruntung)
- BALLOON_POP: Pecahkan balon (mudah, fun)
- TREASURE_HUNT: Cari harta karun (sedang, butuh strategi)

Berikan rekomendasi dalam format JSON:
{
  "playableType": "GAME" | "QUIZ" | "DIRECT",
  "gameType": "MEMORY_CARD" | "SPIN_WHEEL" | "SCRATCH_CARD" | "BALLOON_POP" | "TREASURE_HUNT" (jika playableType = GAME),
  "reasoning": "Penjelasan singkat kenapa cocok"
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const recommendation = JSON.parse(response) as PlayableRecommendation;
      
      // Validate recommendation
      if (!this.isValidRecommendation(recommendation)) {
        logger.warn('Invalid AI recommendation, using fallback');
        return this.getFallbackRecommendation(recipient);
      }

      logger.info(`AI recommended ${recommendation.playableType} for ${recipient.name}`);
      return recommendation;
    } catch (error) {
      logger.error('Error getting AI recommendation:', error);
      return this.getFallbackRecommendation(recipient);
    }
  }

  /**
   * Generate quiz questions based on topic and difficulty
   */
  async generateQuiz(
    topic: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD',
    count: number = 5
  ): Promise<QuizQuestion[]> {
    // Fallback if no OpenAI
    if (!this.openai) {
      return this.getFallbackQuiz(topic, difficulty, count);
    }

    try {
      const prompt = this.buildQuizPrompt(topic, difficulty, count);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Anda adalah AI yang membuat soal quiz berkualitas tinggi dalam bahasa Indonesia.

Aturan:
- Setiap soal harus memiliki 4 pilihan jawaban
- Hanya 1 jawaban yang benar
- Soal harus jelas dan tidak ambigu
- Konten harus sesuai untuk semua usia
- Berikan penjelasan singkat untuk jawaban yang benar

Format JSON:
{
  "questions": [
    {
      "question": "Pertanyaan?",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctAnswer": 0,
      "explanation": "Penjelasan singkat"
    }
  ]
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response);
      const questions = result.questions as QuizQuestion[];

      // Validate questions
      if (!this.isValidQuiz(questions, count)) {
        logger.warn('Invalid AI quiz, using fallback');
        return this.getFallbackQuiz(topic, difficulty, count);
      }

      logger.info(`Generated ${questions.length} quiz questions for topic: ${topic}`);
      return questions;
    } catch (error) {
      logger.error('Error generating quiz:', error);
      return this.getFallbackQuiz(topic, difficulty, count);
    }
  }

  /**
   * Build prompt for playable recommendation
   */
  private buildRecommendationPrompt(recipient: RecipientProfile): string {
    const ageLabels = {
      CHILD: 'Anak-anak (0-12 tahun)',
      TEEN: 'Remaja (13-17 tahun)',
      ADULT: 'Dewasa (18+ tahun)',
    };

    const statusLabels = {
      SCHOOL: 'Sekolah',
      COLLEGE: 'Kuliah',
      WORKING: 'Bekerja',
      NOT_WORKING: 'Belum Bekerja',
    };

    const closenessLabels = {
      VERY_CLOSE: 'Sangat Dekat',
      CLOSE: 'Cukup Dekat',
      DISTANT: 'Jauh',
    };

    return `Profil Penerima THR:
- Nama: ${recipient.name}
- Usia: ${ageLabels[recipient.ageLevel]}
- Status: ${statusLabels[recipient.status]}
- Kedekatan: ${closenessLabels[recipient.closeness]}

Rekomendasikan playableType dan gameType (jika GAME) yang paling cocok untuk profil ini.`;
  }

  /**
   * Build prompt for quiz generation
   */
  private buildQuizPrompt(topic: string, difficulty: string, count: number): string {
    const difficultyDesc = {
      EASY: 'mudah (pengetahuan dasar)',
      MEDIUM: 'sedang (pengetahuan menengah)',
      HARD: 'sulit (pengetahuan mendalam)',
    };

    return `Buat ${count} soal quiz pilihan ganda tentang "${topic}" dengan tingkat kesulitan ${difficultyDesc[difficulty as keyof typeof difficultyDesc]}.

Pastikan:
- Soal dalam bahasa Indonesia yang baik
- Sesuai untuk audiens Indonesia
- Konten edukatif dan menarik
- Tidak mengandung konten sensitif`;
  }

  /**
   * Validate AI recommendation
   */
  private isValidRecommendation(rec: PlayableRecommendation): boolean {
    const validPlayableTypes = ['DIRECT', 'GAME', 'QUIZ'];
    const validGameTypes = ['MEMORY_CARD', 'SPIN_WHEEL', 'SCRATCH_CARD', 'BALLOON_POP', 'TREASURE_HUNT'];

    if (!validPlayableTypes.includes(rec.playableType)) {
      return false;
    }

    if (rec.playableType === 'GAME' && (!rec.gameType || !validGameTypes.includes(rec.gameType))) {
      return false;
    }

    if (!rec.reasoning || rec.reasoning.length < 10) {
      return false;
    }

    return true;
  }

  /**
   * Validate quiz questions
   */
  private isValidQuiz(questions: QuizQuestion[], expectedCount: number): boolean {
    if (!Array.isArray(questions) || questions.length !== expectedCount) {
      return false;
    }

    return questions.every((q) => {
      return (
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < 4 &&
        q.explanation
      );
    });
  }

  /**
   * Fallback recommendation based on simple rules
   */
  private getFallbackRecommendation(recipient: RecipientProfile): PlayableRecommendation {
    // Children and teens -> GAME
    if (recipient.ageLevel === 'CHILD' || recipient.ageLevel === 'TEEN') {
      const gameType = recipient.ageLevel === 'CHILD' ? 'BALLOON_POP' : 'MEMORY_CARD';
      return {
        playableType: 'GAME',
        gameType,
        reasoning: `${recipient.ageLevel === 'CHILD' ? 'Anak-anak' : 'Remaja'} biasanya suka game yang fun dan interaktif`,
      };
    }

    // Students -> QUIZ
    if (recipient.status === 'SCHOOL' || recipient.status === 'COLLEGE') {
      return {
        playableType: 'QUIZ',
        reasoning: 'Pelajar/mahasiswa cocok dengan tantangan quiz',
      };
    }

    // Working adults -> DIRECT (busy people)
    if (recipient.status === 'WORKING') {
      return {
        playableType: 'DIRECT',
        reasoning: 'Orang bekerja biasanya sibuk, lebih baik langsung',
      };
    }

    // Default -> GAME with simple game
    return {
      playableType: 'GAME',
      gameType: 'SCRATCH_CARD',
      reasoning: 'Game sederhana yang cepat dan menyenangkan',
    };
  }

  /**
   * Fallback quiz with generic questions
   */
  private getFallbackQuiz(topic: string, difficulty: string, count: number): QuizQuestion[] {
    // Return generic questions about the topic
    const questions: QuizQuestion[] = [];

    for (let i = 0; i < count; i++) {
      questions.push({
        question: `Pertanyaan ${i + 1} tentang ${topic}`,
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctAnswer: 0,
        explanation: 'Ini adalah soal contoh. Silakan gunakan OpenAI API untuk soal yang lebih baik.',
      });
    }

    return questions;
  }
}
