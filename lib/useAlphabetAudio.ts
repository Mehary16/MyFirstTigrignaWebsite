'use client';

import { useCallback, useRef } from 'react';

const audioCache = new Map<string, HTMLAudioElement>();
let voicesLoaded = false;

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
    // Last resort: spell transliteration slowly — still English, but less misleading than default voice.
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
};

export type AlphabetAudioResult = 'mp3' | 'ethiopic-voice' | 'english-fallback' | 'unavailable';

export function useAlphabetAudio() {
  const playingRef = useRef<string | null>(null);

  const play = useCallback(async (payload: AlphabetAudioPayload): Promise<AlphabetAudioResult> => {
    const key = payload.audioPath ?? `${payload.char}-${payload.transliteration}`;
    playingRef.current = key;

    if (payload.audioPath) {
      try {
        let audio = audioCache.get(payload.audioPath);
        if (!audio) {
          audio = new Audio(payload.audioPath);
          audioCache.set(payload.audioPath, audio);
        }
        audio.currentTime = 0;
        await audio.play();
        if (playingRef.current === key) return 'mp3';
      } catch {
        // Fall through when MP3 is missing or autoplay blocked.
      }
    }

    if (playingRef.current !== key) return 'unavailable';
    return speakFallback(payload.char, payload.transliteration);
  }, []);

  return { play };
}

/** True when no native MP3 folder is populated yet (client-side hint only). */
export const ALPHABET_AUDIO_NOTE =
  'Browser voices often read letters with an English accent. For correct Tigrinya pronunciation, add native-speaker MP3 files or connect a Tigrinya text-to-speech service.';
