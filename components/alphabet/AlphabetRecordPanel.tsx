'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square, Upload, Volume2 } from 'lucide-react';
import { alphabetAudioPathsForTarget, findAlphabetRecordingUrl } from '../../lib/alphabetAudioUpload';
import { getFamilyAudioSlug, type AlphabetFamily } from '../../lib/tigrinyaAlphabetFamilies';
import { clearAlphabetAudioCache } from '../../lib/useAlphabetAudio';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

type AlphabetRecordPanelProps = {
  family: AlphabetFamily;
  formIndex: number;
  formChar: string;
  transliteration: string;
};

type RecordState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

function extensionForMime(mime: string) {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'webm';
}

export default function AlphabetRecordPanel({
  family,
  formIndex,
  formChar,
  transliteration
}: AlphabetRecordPanelProps) {
  const audioSlug = getFamilyAudioSlug(family);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecordState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [scope, setScope] = useState<'form' | 'family'>('form');
  const [existingRecording, setExistingRecording] = useState<string | null>(null);
  const [checkingRecording, setCheckingRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      previewAudioRef.current?.pause();
    };
  }, []);

  const targetFilename =
    scope === 'form' ? `${audioSlug ?? 'clip'}-${formIndex}` : `${audioSlug ?? 'clip'}`;

  const refreshExistingRecording = useCallback(async () => {
    setCheckingRecording(true);
    const found = await findAlphabetRecordingUrl(alphabetAudioPathsForTarget(audioSlug, scope, formIndex));
    setExistingRecording(found);
    setCheckingRecording(false);
    return found;
  }, [audioSlug, formIndex, scope]);

  useEffect(() => {
    setMessage(null);
    setState('idle');
    void refreshExistingRecording();
  }, [refreshExistingRecording]);

  const startRecording = async () => {
    setMessage(null);

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
        await uploadRecording(blob, recorder.mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState('recording');
    } catch {
      setState('error');
      setMessage('Microphone access was blocked. Allow the mic in your browser settings and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  const previewRecording = async () => {
    if (!existingRecording) return;

    previewAudioRef.current?.pause();
    const audio = new Audio(`${existingRecording}${existingRecording.includes('?') ? '&' : '?'}v=${Date.now()}`);
    previewAudioRef.current = audio;
    setPreviewing(true);

    try {
      await audio.play();
    } catch {
      setMessage('Could not play the saved recording. Try recording again.');
      setState('error');
    } finally {
      audio.onended = () => setPreviewing(false);
      audio.onerror = () => setPreviewing(false);
    }
  };

  const uploadRecording = async (blob: Blob, mimeType: string) => {
    setState('uploading');
    const replacingExisting = Boolean(existingRecording);
    const ext = extensionForMime(mimeType);
    const filename = `${targetFilename}.${ext}`;
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('filename', filename);

    try {
      const response = await fetch('/api/alphabet/audio', { method: 'POST', body: formData });
      let payload: { error?: string; publicPath?: string } = {};

      try {
        payload = (await response.json()) as { error?: string; publicPath?: string };
      } catch {
        payload = {};
      }

      if (!response.ok) {
        setState('error');
        setMessage(payload.error ?? `Upload failed (${response.status}). Please try again.`);
        return;
      }

      clearAlphabetAudioCache(payload.publicPath);
      const savedPath = payload.publicPath
        ? `${payload.publicPath}?v=${Date.now()}`
        : await refreshExistingRecording();
      if (savedPath) setExistingRecording(savedPath);

      setState('done');
      setMessage(
        replacingExisting
          ? `Updated ${filename}. Your new recording replaced the previous clip for ${formChar} (${transliteration}).`
          : `Saved ${filename}. Tap Preview or the speaker to hear your recording for ${formChar} (${transliteration}).`
      );
    } catch {
      setState('error');
      setMessage('Could not upload the recording. Check your connection and try again.');
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-violet-200 bg-violet-50/60 p-4">
      <p className="text-sm font-semibold text-violet-950">Teacher: record pronunciation</p>
      <p className="mt-1 text-xs text-violet-800">
        Say <strong>{transliteration}</strong> for <span className="font-ethiopic text-lg">{formChar}</span> — the browser
        will ask to use your microphone.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-900">
          <input
            type="radio"
            name="record-scope"
            checked={scope === 'form'}
            onChange={() => setScope('form')}
            className="h-3.5 w-3.5"
          />
          This letter only ({audioSlug}-{formIndex})
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-900">
          <input
            type="radio"
            name="record-scope"
            checked={scope === 'family'}
            onChange={() => setScope('family')}
            className="h-3.5 w-3.5"
          />
          Whole {family.name} family ({audioSlug})
        </label>
      </div>

      {checkingRecording ? (
        <p className="mt-3 text-xs text-violet-700">Checking for a saved recording…</p>
      ) : existingRecording ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
          <p className="text-xs font-semibold text-emerald-900">
            Recording saved for <code className="rounded bg-white/80 px-1">{targetFilename}</code>
          </p>
          <p className="mt-1 text-[11px] text-emerald-800">
            Record again anytime — the new clip replaces this one.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {state !== 'recording' ? (
          <>
            <Button type="button" size="sm" onClick={startRecording} disabled={state === 'uploading'}>
              {existingRecording ? <RotateCcw className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {state === 'uploading' ? 'Saving...' : existingRecording ? 'Re-record' : 'Start recording'}
            </Button>
            {existingRecording ? (
              <Button type="button" size="sm" variant="secondary" onClick={previewRecording} disabled={previewing}>
                <Volume2 className="h-4 w-4" />
                {previewing ? 'Playing...' : 'Preview saved'}
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="button" size="sm" variant="danger" onClick={stopRecording}>
            <Square className="h-4 w-4" />
            Stop &amp; save
          </Button>
        )}
      </div>

      {state === 'recording' ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Recording… say “{transliteration}” clearly, then click Stop &amp; save.
        </p>
      ) : null}

      {message ? (
        <Alert variant={state === 'error' ? 'error' : 'success'} className="mt-3">
          {message}
        </Alert>
      ) : null}

      <p className="mt-3 flex items-start gap-2 text-[11px] text-violet-700">
        <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Recording saves to Supabase storage as <code className="rounded bg-white/80 px-1">{targetFilename}.webm</code>
      </p>
    </div>
  );
}
