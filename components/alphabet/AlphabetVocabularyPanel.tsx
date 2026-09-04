'use client';

import { useMemo, useRef, useState } from 'react';
import { Mic, Plus, Square, Trash2, Volume2 } from 'lucide-react';
import {
  audioPathsForVocabularyWord,
  builtinExampleWordEntry,
  vocabularyAudioFilename,
  type AlphabetVocabularyWord,
  type DisplayVocabularyWord
} from '../../lib/alphabetVocabulary';
import { audioPathsForExampleWord, getFamilyAudioSlug, type AlphabetFamily } from '../../lib/tigrinyaAlphabetFamilies';
import { clearAlphabetAudioCache } from '../../lib/useAlphabetAudio';
import { useAlphabetVocabulary } from '../../lib/useAlphabetVocabulary';
import { cn } from '../../lib/cn';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

type AlphabetVocabularyPanelProps = {
  family: AlphabetFamily;
  showTeacherTools?: boolean;
  playingKey: string | null;
  onPlay: (key: string, word: string, transliteration: string, audioPaths: string[]) => void;
  onRecordingSaved?: () => void;
};

function extensionForMime(mime: string) {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'webm';
}

export default function AlphabetVocabularyPanel({
  family,
  showTeacherTools = false,
  playingKey,
  onPlay,
  onRecordingSaved
}: AlphabetVocabularyPanelProps) {
  const { words, ready, error, refresh } = useAlphabetVocabulary(family.id);
  const [newWord, setNewWord] = useState('');
  const [newTransliteration, setNewTransliteration] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const displayWords = useMemo((): DisplayVocabularyWord[] => {
    const builtin = builtinExampleWordEntry(family);
    return [builtin, ...words];
  }, [family, words]);

  const playWord = (entry: DisplayVocabularyWord) => {
    const isBuiltin = 'isBuiltin' in entry && entry.isBuiltin;
    const key = isBuiltin ? `${family.id}-word` : entry.id;
    const paths = isBuiltin
      ? audioPathsForExampleWord(family)
      : audioPathsForVocabularyWord(entry.audio_filename);
    onPlay(key, entry.word, entry.transliteration, paths);
  };

  const addWord = async () => {
    setFormMessage(null);
    setFormError(null);

    if (!newWord.trim()) {
      setFormError('Enter the Tigrinya word in Ge\'ez script.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/alphabet/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          word: newWord.trim(),
          transliteration: newTransliteration.trim(),
          meaning: newMeaning.trim()
        })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(payload.error ?? 'Could not add the word.');
        return;
      }

      setNewWord('');
      setNewTransliteration('');
      setNewMeaning('');
      setFormMessage('Word added. Record its pronunciation below.');
      await refresh();
    } catch {
      setFormError('Could not add the word. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const deleteWord = async (wordId: string) => {
    if (!window.confirm('Delete this word and its recording?')) return;

    const response = await fetch(`/api/alphabet/vocabulary?id=${encodeURIComponent(wordId)}`, {
      method: 'DELETE'
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setFormError(payload.error ?? 'Could not delete the word.');
      return;
    }

    onRecordingSaved?.();
    await refresh();
  };

  const startRecording = async (word: AlphabetVocabularyWord) => {
    setFormError(null);
    setRecordingWordId(word.id);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        await uploadWordRecording(word, blob, recorder.mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState('recording');
    } catch {
      setFormError('Microphone access was blocked.');
      setRecordingWordId(null);
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  const uploadWordRecording = async (word: AlphabetVocabularyWord, blob: Blob, mimeType: string) => {
    setRecordingState('uploading');
    const ext = extensionForMime(mimeType);
    const filename = vocabularyAudioFilename(family, word.id, ext);
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('filename', filename);

    try {
      const uploadResponse = await fetch('/api/alphabet/audio', { method: 'POST', body: formData });
      const uploadPayload = (await uploadResponse.json()) as { error?: string; publicPath?: string };

      if (!uploadResponse.ok) {
        setFormError(uploadPayload.error ?? 'Could not save the recording.');
        return;
      }

      clearAlphabetAudioCache(uploadPayload.publicPath);

      const patchResponse = await fetch('/api/alphabet/vocabulary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: word.id, audioFilename: filename })
      });
      const patchPayload = (await patchResponse.json()) as { error?: string };

      if (!patchResponse.ok) {
        setFormError(patchPayload.error ?? 'Recording saved but word was not updated.');
        return;
      }

      setFormMessage(`Saved pronunciation for ${word.word}.`);
      onRecordingSaved?.();
      await refresh();
    } catch {
      setFormError('Could not upload the recording.');
    } finally {
      setRecordingWordId(null);
      setRecordingState('idle');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Practice words</p>
        {!ready ? <span className="text-xs text-slate-500">Loading…</span> : null}
      </div>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : null}

      <ul className="space-y-2">
        {displayWords.map((entry) => {
          const key = 'isBuiltin' in entry && entry.isBuiltin ? `${family.id}-word` : entry.id;
          const isBuiltin = 'isBuiltin' in entry && entry.isBuiltin;
          const customWord = !isBuiltin ? entry : null;
          const hasRecording = isBuiltin
            ? false
            : Boolean(customWord?.audio_filename);
          const isRecordingThis = customWord && recordingWordId === customWord.id;

          return (
            <li key={key}>
              <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => playWord(entry)}
                  className="min-w-0 flex-1 text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg -m-1 p-1"
                  aria-label={`Play ${entry.word}, ${entry.transliteration}, ${entry.meaning}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {isBuiltin ? (
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Default example</p>
                      ) : null}
                      <p className="font-ethiopic text-xl text-slate-900">{entry.word}</p>
                      <p className="text-sm text-slate-600">
                        {entry.transliteration}
                        {entry.meaning ? ` · ${entry.meaning}` : null}
                      </p>
                    </div>
                    <Volume2
                      className={cn('mt-1 h-4 w-4 shrink-0 text-amber-800', playingKey === key && 'animate-pulse')}
                      aria-hidden
                    />
                  </div>
                </button>

                {showTeacherTools && customWord ? (
                  <div className="flex shrink-0 flex-col gap-1">
                    {isRecordingThis && recordingState === 'recording' ? (
                      <Button type="button" size="sm" variant="danger" onClick={stopRecording}>
                        <Square className="h-3.5 w-3.5" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={recordingState === 'uploading'}
                        onClick={() => startRecording(customWord)}
                        title={hasRecording ? 'Re-record pronunciation' : 'Record pronunciation'}
                      >
                        <Mic className="h-3.5 w-3.5" />
                        {hasRecording ? 'Re-record' : 'Record'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50"
                      onClick={() => deleteWord(customWord.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>

              {isRecordingThis && recordingState === 'recording' ? (
                <p className="mt-1 flex items-center gap-2 px-1 text-xs font-semibold text-red-700">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Say “{customWord.transliteration || customWord.word}” clearly, then click Stop.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {showTeacherTools ? (
        <div className="rounded-[1.75rem] border border-teal-200 bg-teal-50/60 p-4">
          <p className="text-sm font-semibold text-teal-950">Teacher: add more words</p>
          <p className="mt-1 text-xs text-teal-800">
            Add words for the {family.name} family (e.g. another word starting with {family.forms[0]?.char}), then record
            each pronunciation.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-teal-900">Tigrinya word</span>
              <input
                type="text"
                value={newWord}
                onChange={(event) => setNewWord(event.target.value)}
                placeholder="ከልቢ"
                className="font-ethiopic mt-1 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-teal-900">Transliteration</span>
              <input
                type="text"
                value={newTransliteration}
                onChange={(event) => setNewTransliteration(event.target.value)}
                placeholder="Kelbi"
                className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-teal-900">English meaning</span>
              <input
                type="text"
                value={newMeaning}
                onChange={(event) => setNewMeaning(event.target.value)}
                placeholder="Dog"
                className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <Button type="button" size="sm" className="mt-3" onClick={addWord} disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add word'}
          </Button>

          {formMessage ? (
            <Alert variant="success" className="mt-3">
              {formMessage}
            </Alert>
          ) : null}
          {formError ? (
            <Alert variant="error" className="mt-3">
              {formError}
            </Alert>
          ) : null}

          <p className="mt-3 text-[11px] text-teal-700">
            Recordings save as <code className="rounded bg-white/80 px-1">{getFamilyAudioSlug(family)}-v-…</code> in
            alphabet audio storage.
          </p>
        </div>
      ) : null}
    </div>
  );
}
