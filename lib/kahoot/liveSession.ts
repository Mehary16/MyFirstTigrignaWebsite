import type { KahootQuestion } from './fidelBookQuestions';

export type KahootSessionStatus = 'lobby' | 'question' | 'reveal' | 'finished';

export type KahootLivePlayer = {
  id: string;
  nickname: string;
  score: number;
  user_id: string | null;
};

export type KahootLiveSession = {
  id: string;
  pin: string;
  title: string;
  status: KahootSessionStatus;
  questions: KahootQuestion[];
  question_index: number;
  question_ends_at: string | null;
  host_id: string;
};

export function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function scoreForAnswer(correct: boolean, questionEndsAt: string | null) {
  if (!correct) return 0;
  if (!questionEndsAt) return 800;
  const msLeft = new Date(questionEndsAt).getTime() - Date.now();
  const bonus = Math.max(0, Math.min(1000, Math.floor(msLeft / 15)));
  return 500 + bonus;
}

export const QUESTION_SECONDS = 20;
