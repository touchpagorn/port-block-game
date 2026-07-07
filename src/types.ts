export interface QuestionOption {
  code: string;
  label: string;
  explanation: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  options: QuestionOption[];
  correctCode: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timeMs: number;
  createdAt: number;
}

export interface AnswerRecord {
  questionId: string;
  selectedCode: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface GameSession {
  playerName: string;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  startTime: number;
  score: number;
  isFinished: boolean;
}
