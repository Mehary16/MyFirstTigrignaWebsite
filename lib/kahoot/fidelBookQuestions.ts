/**
 * Quiz questions aligned with Ministry of Education
 * "ቋንቋ ትግርኛ መጽሓፍ ፊደል ን 1ይ ክፍሊ" (Fidel / alphabet, part 1).
 * Generated from the same letter families used in this app.
 */

import { flattenAlphabetForms } from '../alphabetProgress';
import { TIGRINYA_ALPHABET_FAMILIES } from '../tigrinyaAlphabetFamilies';

export type KahootQuestionKind = 'sound_to_letter' | 'letter_to_sound' | 'word_meaning';

export type KahootQuestion = {
  id: string;
  kind: KahootQuestionKind;
  prompt: string;
  promptEthiopic?: string;
  audioChar?: string;
  audioTransliteration?: string;
  choices: string[];
  correctIndex: number;
  familyId?: string;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pickDistractors<T>(pool: T[], correct: T, count: number, key: (item: T) => string) {
  const options = [correct];
  const distractors = shuffle(pool.filter((item) => key(item) !== key(correct)));

  for (const item of distractors) {
    if (options.length >= count) break;
    if (!options.some((existing) => key(existing) === key(item))) {
      options.push(item);
    }
  }

  return shuffle(options);
}

export function buildFidelBookQuestionBank(options: { count?: number; familyId?: string } = {}): KahootQuestion[] {
  const count = Math.min(Math.max(options.count ?? 10, 5), 20);
  const forms = flattenAlphabetForms().filter((form) =>
    options.familyId ? form.familyId === options.familyId : true
  );
  const families = TIGRINYA_ALPHABET_FAMILIES.filter((family) =>
    options.familyId ? family.id === options.familyId : true
  );

  const candidates: KahootQuestion[] = [];

  for (const form of forms) {
    const letterChoices = pickDistractors(forms, form, 4, (item) => item.key).map((item) => item.char);
    candidates.push({
      id: `stl-${form.key}`,
      kind: 'sound_to_letter',
      prompt: `Which letter makes the sound “${form.transliteration}”?`,
      audioChar: form.char,
      audioTransliteration: form.transliteration,
      choices: letterChoices,
      correctIndex: letterChoices.indexOf(form.char),
      familyId: form.familyId
    });

    const soundChoices = pickDistractors(forms, form, 4, (item) => item.key).map((item) => item.transliteration);
    candidates.push({
      id: `lts-${form.key}`,
      kind: 'letter_to_sound',
      prompt: 'What sound does this letter make?',
      promptEthiopic: form.char,
      audioChar: form.char,
      audioTransliteration: form.transliteration,
      choices: soundChoices,
      correctIndex: soundChoices.indexOf(form.transliteration),
      familyId: form.familyId
    });
  }

  for (const family of families) {
    const meaningPool = families.map((entry) => entry.exampleMeaning).filter(Boolean);
    const meaningChoices = pickDistractors(meaningPool, family.exampleMeaning, 4, (item) => item);
    candidates.push({
      id: `wm-${family.id}`,
      kind: 'word_meaning',
      prompt: 'What does this word mean?',
      promptEthiopic: family.exampleWord,
      audioChar: family.exampleWord,
      audioTransliteration: family.exampleTransliteration,
      choices: meaningChoices,
      correctIndex: meaningChoices.indexOf(family.exampleMeaning),
      familyId: family.id
    });
  }

  const valid = candidates.filter((question) => question.correctIndex >= 0);
  return shuffle(valid).slice(0, count);
}

export const FIDEL_BOOK_SOURCE_LABEL =
  'ቋንቋ ትግርኛ መጽሓፍ ፊደል ን 1ይ ክፍሊ · Ministry of Education Eritrea (Fidel, Part 1)';
