'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KahootQuestionPublic } from '../../lib/kahoot/publicQuestion';
import type { KahootLivePlayer, KahootSessionStatus } from '../../lib/kahoot/liveSession';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';

export type KahootPollState = {
  pin: string;
  title: string;
  status: KahootSessionStatus;
  questionIndex: number;
  questionCount: number;
  questionEndsAt: string | null;
  currentQuestion: KahootQuestionPublic | null;
  players: KahootLivePlayer[];
  answerCounts: number[];
  myChoiceIndex: number | null;
  isHost: boolean;
};

const FALLBACK_POLL_MS = 8000;

function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

export function useKahootPoll(sessionId: string, fallbackPollMs = FALLBACK_POLL_MS) {
  const [state, setState] = useState<KahootPollState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/kahoot/sessions/${sessionId}`, { cache: 'no-store' });
      const payload = (await response.json()) as {
        error?: string;
        session?: {
          pin: string;
          title: string;
          status: KahootSessionStatus;
          question_index: number;
          questionCount: number;
          question_ends_at: string | null;
        };
        currentQuestion?: KahootQuestionPublic | null;
        players?: KahootLivePlayer[];
        answerCounts?: number[];
        myChoiceIndex?: number | null;
        isHost?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not load game.');
      }

      if (!mounted.current || !payload.session) return;

      setState({
        pin: payload.session.pin,
        title: payload.session.title,
        status: payload.session.status,
        questionIndex: payload.session.question_index,
        questionCount: payload.session.questionCount,
        questionEndsAt: payload.session.question_ends_at,
        currentQuestion: payload.currentQuestion ?? null,
        players: payload.players ?? [],
        answerCounts: payload.answerCounts ?? [],
        myChoiceIndex: payload.myChoiceIndex ?? null,
        isHost: payload.isHost ?? false
      });
      setError(null);
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Could not load game.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    const scheduleRefresh = debounce(() => void refresh(), 120);

    let supabase: ReturnType<typeof createBrowserSupabaseClient> | null = null;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      supabase = null;
    }

    const channel = supabase
      ?.channel(`kahoot-live-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kahoot_live_sessions', filter: `id=eq.${sessionId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kahoot_live_players', filter: `session_id=eq.${sessionId}` },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kahoot_live_answers', filter: `session_id=eq.${sessionId}` },
        scheduleRefresh
      )
      .subscribe((status) => {
        if (!mounted.current) return;
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    const fallbackTimer = window.setInterval(() => void refresh(), fallbackPollMs);

    return () => {
      mounted.current = false;
      window.clearInterval(fallbackTimer);
      if (channel && supabase) {
        void supabase.removeChannel(channel);
      }
    };
  }, [sessionId, refresh, fallbackPollMs]);

  return { state, error, loading, refresh, realtimeConnected };
}

export function playerStorageKey(sessionId: string) {
  return `kahoot-player-${sessionId}`;
}
