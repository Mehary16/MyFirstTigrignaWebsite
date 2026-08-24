'use client';

import { useCallback, useRef } from 'react';

const audioCache = new Map<string, HTMLAudioElement>();
const cacheBustByPath = new Map<string, number>();
let voicesLoaded = false;

function normalizeAudioPath(path: string) {
  return path.split('?')[0] ?? path;
}

function resolvedAudioSrc(path: string) {
  const basePath = normalizeAudioPath(path);
  const cacheBust = cacheBustByPath.get(basePath);
  return cacheBust ? `${basePath}?v=${cacheBust}` : basePath;
}

function tryPlayPath(basePath: string) {
  const src = resolvedAudioSrc(basePath);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(result);
    };

    const timeout = window.setTimeout(() => finish(false), 3000);
    const cached = audioCache.get(basePath);

    if (cached) {
      cached.src = src;
      cached.currentTime = 0;
      cached
        .play()
        .then(() => finish(true))
        .catch(() => finish(false));
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';

    audio.oncanplaythrough = () => {
      audioCache.set(basePath, audio);
      audio
        .play()
        .then(() => finish(true))
        .catch(() => finish(false));
    };

    audio.onerror = () => finish(false);
    audio.src = src;
    audio.load();
  });
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);

  const existing = window.speechSynthesis.getVoices();
  if (existing.length) {
    voicesLoaded = true;
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const finish = () => {
      voicesLoaded = true;
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = finish;
    window.setTimeout(finish, 250);
  });
}

function pickEthiopicVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === 'ti-et') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ti')) ??
    voices.find((voice) => voice.lang.toLowerCase() === 'am-et') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('am')) ??
    null
  );
}

async function speakFallback(char: string, transliteration: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unavailable';

  const voices = await loadVoices();
  const ethiopicVoice = pickEthiopicVoice(voices);

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(char);
  utterance.lang = ethiopicVoice?.lang ?? 'am-ET';
  utterance.rate = 0.72;
  utterance.pitch = 1;

  if (ethiopicVoice) {
    utterance.voice = ethiopicVoice;
  } else {
    utterance.text = transliteration;
    utterance.lang = 'en-US';
    utterance.rate = 0.65;
  }

  window.speechSynthesis.speak(utterance);
  return ethiopicVoice ? 'ethiopic-voice' : 'english-fallback';
}

export type AlphabetAudioPayload = {
  char: string;
  transliteration: string;
  audioPath?: string;
  /** Extra paths to try when audioPath is missing (e.g. family fallback). */
  audioFallbackPaths?: string[];
};

export type AlphabetAudioResult = 'mp3' | 'ethiopic-voice' | 'english-fallback' | 'unavailable';

export function useAlphabetAudio() {
  const playingRef = useRef<string | null>(null);

  const play = useCallback(async (payload: AlphabetAudioPayload): Promise<AlphabetAudioResult> => {
    const paths = [payload.audioPath, ...(payload.audioFallbackPaths ?? [])].filter(
      (path): path is string => Boolean(path)
    );
    const key = paths[0] ?? `${payload.char}-${payload.transliteration}`;
    playingRef.current = key;

    for (const audioPath of paths) {
      if (playingRef.current !== key) return 'unavailable';
      const basePath = normalizeAudioPath(audioPath);
      const played = await tryPlayPath(basePath);
      if (played && playingRef.current === key) return 'mp3';
    }

    if (playingRef.current !== key) return 'unavailable';
    return speakFallback(payload.char, payload.transliteration);
  }, []);

  return { play };
}

export function clearAlphabetAudioCache(publicPath?: string) {
  if (publicPath) {
    const basePath = normalizeAudioPath(publicPath);
    audioCache.delete(basePath);
    cacheBustByPath.set(basePath, Date.now());
    return;
  }

  audioCache.clear();
  cacheBustByPath.clear();
}

export const ALPHABET_AUDIO_NOTE =
  'Browser voices often read letters with an English accent. For correct Tigrinya pronunciation, add native-speaker MP3 files or connect a Tigrinya text-to-speech service.';
