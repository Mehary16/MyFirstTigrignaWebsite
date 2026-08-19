'use client';

import { useCallback, useRef } from 'react';

const audioCache = new Map<string, HTMLAudioElement>();

function speakTransliteration(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ti-ET';
  utterance.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((voice) => voice.lang.startsWith('ti')) ??
    voices.find((voice) => voice.lang.startsWith('am')) ??
    voices.find((voice) => voice.lang.startsWith('en'));

  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export function useAlphabetAudio() {
  const playingRef = useRef<string | null>(null);

  const play = useCallback(async (transliteration: string, audioPath?: string) => {
    const key = audioPath ?? transliteration;
    playingRef.current = key;

    if (audioPath) {
      try {
        let audio = audioCache.get(audioPath);
        if (!audio) {
          audio = new Audio(audioPath);
          audioCache.set(audioPath, audio);
        }
        audio.currentTime = 0;
        await audio.play();
        if (playingRef.current === key) return;
      } catch {
        // Fall through to speech synthesis when MP3 is missing or blocked.
      }
    }

    if (playingRef.current === key) {
      speakTransliteration(transliteration);
    }
  }, []);

  return { play };
}
