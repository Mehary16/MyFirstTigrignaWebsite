import { TIGRINYA_ALPHABET_FAMILIES, type AlphabetFamily } from './tigrinyaAlphabetFamilies';

export type AlphabetFormRef = {
  key: string;
  familyId: string;
  familyName: string;
  formIndex: number;
  char: string;
  transliteration: string;
  accent: string;
  audioSlug?: string;
};

export type AlphabetProgress = {
  practiced: Record<string, true>;
  quizCorrectByForm: Record<string, number>;
  quizSessionCorrect: number;
  quizSessionTotal: number;
  quizLifetimeCorrect: number;
  quizLifetimeTotal: number;
  updatedAt: string;
};

export const ALPHABET_PROGRESS_STORAGE_PREFIX = 'alphabet-progress';

export const EMPTY_ALPHABET_PROGRESS: AlphabetProgress = {
  practiced: {},
  quizCorrectByForm: {},
  quizSessionCorrect: 0,
  quizSessionTotal: 0,
  quizLifetimeCorrect: 0,
  quizLifetimeTotal: 0,
  updatedAt: new Date(0).toISOString()
};

export const MASTERED_QUIZ_THRESHOLD = 2;

export function formKey(familyId: string, formIndex: number) {
  return `${familyId}:${formIndex}`;
}

export function flattenAlphabetForms(): AlphabetFormRef[] {
  return TIGRINYA_ALPHABET_FAMILIES.flatMap((family) =>
    family.forms.map((form, formIndex) => ({
      key: formKey(family.id, formIndex),
      familyId: family.id,
      familyName: family.name,
      formIndex,
      char: form.char,
      transliteration: form.transliteration,
      accent: family.accent,
      audioSlug: family.audioSlug
    }))
  );
}

export function getFamilyById(familyId: string): AlphabetFamily | undefined {
  return TIGRINYA_ALPHABET_FAMILIES.find((family) => family.id === familyId);
}

export function progressStorageKey(userId?: string | null) {
  return `${ALPHABET_PROGRESS_STORAGE_PREFIX}:${userId ?? 'guest'}`;
}

export function readAlphabetProgress(userId?: string | null): AlphabetProgress {
  if (typeof window === 'undefined') return EMPTY_ALPHABET_PROGRESS;

  try {
    const raw = window.localStorage.getItem(progressStorageKey(userId));
    if (!raw) return { ...EMPTY_ALPHABET_PROGRESS, updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as Partial<AlphabetProgress>;
    return {
      ...EMPTY_ALPHABET_PROGRESS,
      ...parsed,
      practiced: parsed.practiced ?? {},
      quizCorrectByForm: parsed.quizCorrectByForm ?? {},
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return { ...EMPTY_ALPHABET_PROGRESS, updatedAt: new Date().toISOString() };
  }
}

export function writeAlphabetProgress(userId: string | null | undefined, progress: AlphabetProgress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    progressStorageKey(userId),
    JSON.stringify({ ...progress, updatedAt: new Date().toISOString() })
  );
}

export function markFormPracticed(progress: AlphabetProgress, key: string): AlphabetProgress {
  if (progress.practiced[key]) return progress;
  return {
    ...progress,
    practiced: { ...progress.practiced, [key]: true },
    updatedAt: new Date().toISOString()
  };
}

export function recordQuizAnswer(progress: AlphabetProgress, key: string, correct: boolean): AlphabetProgress {
  const next: AlphabetProgress = {
    ...progress,
    quizSessionTotal: progress.quizSessionTotal + 1,
    quizLifetimeTotal: progress.quizLifetimeTotal + 1,
    updatedAt: new Date().toISOString()
  };

  if (correct) {
    next.quizSessionCorrect += 1;
    next.quizLifetimeCorrect += 1;
    next.quizCorrectByForm = {
      ...progress.quizCorrectByForm,
      [key]: (progress.quizCorrectByForm[key] ?? 0) + 1
    };
  }

  return next;
}

export function resetQuizSession(progress: AlphabetProgress): AlphabetProgress {
  return {
    ...progress,
    quizSessionCorrect: 0,
    quizSessionTotal: 0,
    updatedAt: new Date().toISOString()
  };
}

export function countPracticedForms(progress: AlphabetProgress) {
  return Object.keys(progress.practiced).length;
}

export function countMasteredForms(progress: AlphabetProgress) {
  return Object.values(progress.quizCorrectByForm).filter((count) => count >= MASTERED_QUIZ_THRESHOLD).length;
}

export function countQuizKnownForms(progress: AlphabetProgress) {
  return Object.keys(progress.quizCorrectByForm).length;
}

export function familyProgressSummary(progress: AlphabetProgress, familyId: string) {
  const family = getFamilyById(familyId);
  if (!family) return { practiced: 0, mastered: 0, total: 0 };

  let practiced = 0;
  let mastered = 0;

  family.forms.forEach((_, index) => {
    const key = formKey(familyId, index);
    if (progress.practiced[key]) practiced += 1;
    if ((progress.quizCorrectByForm[key] ?? 0) >= MASTERED_QUIZ_THRESHOLD) mastered += 1;
  });

  return { practiced, mastered, total: family.forms.length };
}

export function pickQuizQuestion(options: { familyId?: string; excludeKeys?: string[] } = {}) {
  const pool = flattenAlphabetForms().filter((form) => {
    if (options.familyId && form.familyId !== options.familyId) return false;
    if (options.excludeKeys?.includes(form.key)) return false;
    return true;
  });

  if (!pool.length) return null;

  const correct = pool[Math.floor(Math.random() * pool.length)]!;
  const distractorPool = pool.filter((form) => form.key !== correct.key);
  const choices = [correct];

  while (choices.length < 4 && distractorPool.length > 0) {
    const index = Math.floor(Math.random() * distractorPool.length);
    const [picked] = distractorPool.splice(index, 1);
    if (picked) choices.push(picked);
  }

  while (choices.length < 4) {
    const fallback = flattenAlphabetForms().find((form) => !choices.some((choice) => choice.key === form.key));
    if (!fallback) break;
    choices.push(fallback);
  }

  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }

  return { correct, choices };
}
