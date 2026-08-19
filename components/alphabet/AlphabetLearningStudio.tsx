'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import {
  formKey,
  markFormPracticed
} from '../../lib/alphabetProgress';
import {
  LABIALIZED_FORMS,
  TIGRINYA_ALPHABET_FAMILIES,
  audioPathForFamily,
  audioPathForForm,
  type AlphabetFamily,
  type AlphabetForm
} from '../../lib/tigrinyaAlphabetFamilies';
import { useAlphabetAudio } from '../../lib/useAlphabetAudio';
import { useAlphabetProgress } from '../../lib/useAlphabetProgress';
import { cn } from '../../lib/cn';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import AlphabetAudioNotice from './AlphabetAudioNotice';
import AlphabetProgressCard from './AlphabetProgressCard';
import AlphabetQuizMode from './AlphabetQuizMode';
import AlphabetTracePad from './AlphabetTracePad';

type ViewMode = 'learn' | 'quiz' | 'reference';

function FormButton({
  form,
  family,
  selected,
  mastered,
  onSelect,
  onPlay
}: {
  form: AlphabetForm;
  family: AlphabetFamily;
  selected: boolean;
  mastered: boolean;
  onSelect: () => void;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect();
        onPlay();
      }}
      className={cn(
        'group relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        selected
          ? 'border-brand-900 bg-brand-900 text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
      )}
      style={selected ? undefined : { borderColor: `${family.accent}33` }}
      aria-label={`${form.char}, sounds like ${form.transliteration}`}
      aria-pressed={selected}
    >
      {mastered ? (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />
      ) : null}
      <span className="font-ethiopic-display text-3xl leading-none sm:text-4xl">{form.char}</span>
      <span className={cn('text-[10px] font-semibold uppercase tracking-wide', selected ? 'text-amber-100' : 'text-slate-500')}>
        {form.transliteration}
      </span>
      <Volume2
        className={cn('h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100', selected && 'text-amber-200 opacity-100')}
        aria-hidden
      />
    </button>
  );
}

export default function AlphabetLearningStudio() {
  const { play } = useAlphabetAudio();
  const { progress, saveProgress, ready } = useAlphabetProgress();
  const [familyIndex, setFamilyIndex] = useState(0);
  const [formIndex, setFormIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('learn');
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [quizScopeFamily, setQuizScopeFamily] = useState(false);

  const family = TIGRINYA_ALPHABET_FAMILIES[familyIndex]!;
  const selectedForm = family.forms[formIndex]!;
  const selectedFormKey = formKey(family.id, formIndex);

  const progressLabel = useMemo(
    () => `${familyIndex + 1} / ${TIGRINYA_ALPHABET_FAMILIES.length}`,
    [familyIndex]
  );

  const isFormMastered = (familyId: string, index: number) =>
    (progress.quizCorrectByForm[formKey(familyId, index)] ?? 0) >= 2;

  const playForm = async (form: AlphabetForm, index: number, familyEntry: AlphabetFamily) => {
    const key = `${familyEntry.id}-${index}`;
    setPlayingKey(key);
    await play({
      char: form.char,
      transliteration: form.transliteration,
      audioPath: audioPathForForm(familyEntry, index) ?? audioPathForFamily(familyEntry)
    });
    setTimeout(() => setPlayingKey((current) => (current === key ? null : current)), 600);
  };

  const selectFamily = (index: number) => {
    setFamilyIndex(index);
    setFormIndex(0);
  };

  const markCurrentFormPracticed = () => {
    saveProgress((current) => markFormPracticed(current, selectedFormKey));
  };

  const goPrev = () => {
    if (formIndex > 0) {
      setFormIndex(formIndex - 1);
      return;
    }
    if (familyIndex > 0) {
      const prevFamily = TIGRINYA_ALPHABET_FAMILIES[familyIndex - 1]!;
      setFamilyIndex(familyIndex - 1);
      setFormIndex(prevFamily.forms.length - 1);
    }
  };

  const goNext = () => {
    if (formIndex < family.forms.length - 1) {
      setFormIndex(formIndex + 1);
      return;
    }
    if (familyIndex < TIGRINYA_ALPHABET_FAMILIES.length - 1) {
      setFamilyIndex(familyIndex + 1);
      setFormIndex(0);
    }
  };

  return (
    <div className="space-y-6">
      {ready ? <AlphabetProgressCard progress={progress} activeFamilyId={family.id} /> : null}

      <AlphabetAudioNotice />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'learn' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('learn')}
          >
            Learn &amp; trace
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'quiz' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('quiz')}
          >
            Quiz
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'reference' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('reference')}
          >
            Full chart
          </Button>
        </div>
        <Badge variant="brand">{progressLabel} families</Badge>
      </div>

      {viewMode === 'learn' ? (
        <>
          <div className="surface-panel overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex-1 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-eyebrow">ፊደል · {family.name}</p>
                    <p className="mt-2 font-ethiopic-display text-6xl leading-none sm:text-7xl" style={{ color: family.accent }}>
                      {selectedForm.char}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-800">{selectedForm.transliteration}</p>
                    {progress.practiced[selectedFormKey] ? (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">Traced · saved to your progress</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => playForm(selectedForm, formIndex, family)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
                    aria-label={`Play sound for ${selectedForm.char}`}
                  >
                    <Volume2 className={cn('h-6 w-6 text-brand-900', playingKey === `${family.id}-${formIndex}` && 'animate-pulse')} />
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Example word</p>
                  <p className="mt-1 font-ethiopic text-2xl text-slate-900">{family.exampleWord}</p>
                  <p className="text-sm text-slate-600">
                    {family.exampleTransliteration} · {family.exampleMeaning}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Tap any letter to hear it</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {family.forms.map((form, index) => (
                      <FormButton
                        key={`${family.id}-${form.char}`}
                        form={form}
                        family={family}
                        selected={formIndex === index}
                        mastered={isFormMastered(family.id, index)}
                        onSelect={() => setFormIndex(index)}
                        onPlay={() => playForm(form, index, family)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" size="sm" onClick={goPrev} disabled={familyIndex === 0 && formIndex === 0}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={goNext}
                    disabled={familyIndex === TIGRINYA_ALPHABET_FAMILIES.length - 1 && formIndex === family.forms.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="w-full lg:max-w-sm">
                <AlphabetTracePad
                  character={selectedForm.char}
                  transliteration={selectedForm.transliteration}
                  accent={family.accent}
                  onPracticed={markCurrentFormPracticed}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Pick a letter family</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11">
              {TIGRINYA_ALPHABET_FAMILIES.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    selectFamily(index);
                    play({
                      char: entry.forms[0]!.char,
                      transliteration: entry.forms[0]!.transliteration,
                      audioPath: audioPathForFamily(entry)
                    });
                  }}
                  className={cn(
                    'rounded-2xl border px-2 py-3 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    familyIndex === index
                      ? 'border-brand-900 bg-brand-900 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                  )}
                  aria-label={`${entry.name} family`}
                  aria-current={familyIndex === index}
                >
                  <span className="font-ethiopic-display block text-2xl leading-none">{entry.forms[0]?.char}</span>
                  <span className={cn('mt-1 block text-[10px] font-semibold', familyIndex === index ? 'text-amber-100' : 'text-slate-500')}>
                    {entry.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {viewMode === 'quiz' ? (
        <div className="space-y-4">
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={quizScopeFamily}
              onChange={(event) => setQuizScopeFamily(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-700/20"
            />
            Quiz only the current family ({family.name})
          </label>
          <AlphabetQuizMode
            progress={progress}
            onProgressChange={saveProgress}
            familyId={quizScopeFamily ? family.id : undefined}
          />
        </div>
      ) : null}

      {viewMode === 'reference' ? (
        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Family</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Example</th>
                {['1', '2', '3', '4', '5', '6', '7'].map((n) => (
                  <th key={n} className="px-2 py-3 text-center font-semibold text-slate-700">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TIGRINYA_ALPHABET_FAMILIES.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-800">{entry.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-ethiopic text-lg">{entry.exampleWord}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{entry.exampleMeaning}</span>
                  </td>
                  {entry.forms.map((form, index) => (
                    <td key={`${entry.id}-${form.char}`} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => playForm(form, index, entry)}
                        className="font-ethiopic inline-flex min-w-[2.5rem] flex-col items-center rounded-xl px-1 py-1 text-xl transition hover:bg-amber-50"
                        title={form.transliteration}
                      >
                        {form.char}
                        <span className="text-[9px] font-sans font-semibold uppercase text-slate-400">{form.transliteration}</span>
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-800" colSpan={2}>
                  Labialized (advanced)
                </td>
                {LABIALIZED_FORMS.map((form) => (
                  <td key={form.char} className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        play({
                          char: form.char,
                          transliteration: form.transliteration
                        })
                      }
                      className="font-ethiopic inline-flex min-w-[2.5rem] flex-col items-center rounded-xl px-1 py-1 text-xl transition hover:bg-amber-50"
                    >
                      {form.char}
                      <span className="text-[9px] font-sans font-semibold uppercase text-slate-400">{form.transliteration}</span>
                    </button>
                  </td>
                ))}
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Click any letter to hear its sound. Progress is saved on this device for signed-in students and guests separately.
        Add MP3 files under <code className="rounded bg-slate-100 px-1 py-0.5">public/alphabet/</code> for native-speaker
        audio.
      </p>
    </div>
  );
}
