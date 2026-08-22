import type { AlphabetProgress } from './alphabetProgress';

export type AlphabetActivityType = 'learn' | 'trace' | 'quiz_answer' | 'quiz_start';

export type AlphabetProgressRow = {
  user_id: string;
  practiced: Record<string, true>;
  quiz_correct_by_form: Record<string, number>;
  quiz_session_correct: number;
  quiz_session_total: number;
  quiz_lifetime_correct: number;
  quiz_lifetime_total: number;
  updated_at: string;
};

export type AlphabetActivityRow = {
  id: string;
  user_id: string;
  activity_type: AlphabetActivityType;
  form_key: string | null;
  family_id: string | null;
  correct: boolean | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null; class_grade: string | null } | null;
};

export function progressFromRow(row: AlphabetProgressRow | null | undefined): AlphabetProgress {
  if (!row) {
    return {
      practiced: {},
      quizCorrectByForm: {},
      quizSessionCorrect: 0,
      quizSessionTotal: 0,
      quizLifetimeCorrect: 0,
      quizLifetimeTotal: 0,
      updatedAt: new Date().toISOString()
    };
  }

  return {
    practiced: row.practiced ?? {},
    quizCorrectByForm: row.quiz_correct_by_form ?? {},
    quizSessionCorrect: row.quiz_session_correct ?? 0,
    quizSessionTotal: row.quiz_session_total ?? 0,
    quizLifetimeCorrect: row.quiz_lifetime_correct ?? 0,
    quizLifetimeTotal: row.quiz_lifetime_total ?? 0,
    updatedAt: row.updated_at ?? new Date().toISOString()
  };
}

export function progressToRow(userId: string, progress: AlphabetProgress): AlphabetProgressRow {
  return {
    user_id: userId,
    practiced: progress.practiced,
    quiz_correct_by_form: progress.quizCorrectByForm,
    quiz_session_correct: progress.quizSessionCorrect,
    quiz_session_total: progress.quizSessionTotal,
    quiz_lifetime_correct: progress.quizLifetimeCorrect,
    quiz_lifetime_total: progress.quizLifetimeTotal,
    updated_at: progress.updatedAt || new Date().toISOString()
  };
}

export function activityLabel(type: AlphabetActivityType) {
  switch (type) {
    case 'learn':
      return 'Studying alphabet';
    case 'trace':
      return 'Tracing letters';
    case 'quiz_answer':
      return 'Quiz answer';
    case 'quiz_start':
      return 'Started quiz';
    default:
      return type;
  }
}
