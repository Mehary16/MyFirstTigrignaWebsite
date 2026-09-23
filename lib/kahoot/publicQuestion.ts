import type { KahootQuestion } from './fidelBookQuestions';

/** Question payload safe to send before reveal (no correct answer). */
export type KahootQuestionPublic = Omit<KahootQuestion, 'correctIndex'> & {
  correctIndex?: number;
};

export function sanitizeQuestionForClient(
  question: KahootQuestion,
  options: { revealAnswers: boolean }
): KahootQuestionPublic {
  if (options.revealAnswers) {
    return question;
  }
  const { correctIndex: _removed, ...rest } = question;
  return rest;
}
