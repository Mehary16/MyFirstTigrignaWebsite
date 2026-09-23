import type { SupabaseClient } from '@supabase/supabase-js';
import type { KahootQuestion } from './fidelBookQuestions';
import { createAdminSupabaseClient } from '../supabaseAdmin';

function parseQuestions(value: unknown): KahootQuestion[] {
  if (!Array.isArray(value)) return [];
  return value as KahootQuestion[];
}

/**
 * Loads the full question bank (includes correctIndex). Must never be sent to clients
 * without sanitizeQuestionForClient. Uses service role when available so student JWTs
 * cannot read kahoot_session_questions via the browser client.
 */
export async function loadSessionQuestions(
  sessionId: string,
  userSupabase?: SupabaseClient
): Promise<{ questions: KahootQuestion[]; error: string | null }> {
  const admin = createAdminSupabaseClient();

  if (admin) {
    const { data, error } = await admin
      .from('kahoot_session_questions')
      .select('questions')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!error && data) {
      return { questions: parseQuestions(data.questions), error: null };
    }

    if (error && !error.message.includes('Could not find the table')) {
      return { questions: [], error: error.message };
    }

    const legacy = await admin
      .from('kahoot_live_sessions')
      .select('questions')
      .eq('id', sessionId)
      .maybeSingle();

    if (legacy.data && legacy.data.questions != null) {
      return { questions: parseQuestions(legacy.data.questions), error: null };
    }

    if (error?.message.includes('Could not find the table')) {
      return {
        questions: [],
        error: 'Run supabase/FIX_KAHOOT_QUESTIONS_PRIVATE.sql in the Supabase SQL Editor.'
      };
    }
  }

  if (userSupabase) {
    const { data, error } = await userSupabase
      .from('kahoot_session_questions')
      .select('questions')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!error && data) {
      return { questions: parseQuestions(data.questions), error: null };
    }

    const legacy = await userSupabase
      .from('kahoot_live_sessions')
      .select('questions')
      .eq('id', sessionId)
      .maybeSingle();

    if (legacy.data && legacy.data.questions != null) {
      return { questions: parseQuestions(legacy.data.questions), error: null };
    }
  }

  return {
    questions: [],
    error: admin
      ? 'Quiz questions not found for this session.'
      : 'SUPABASE_SERVICE_ROLE_KEY is required on the server to run live quizzes securely.'
  };
}

export async function saveSessionQuestions(
  sessionId: string,
  questions: KahootQuestion[],
  supabase: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('kahoot_session_questions').insert({
    session_id: sessionId,
    questions
  });

  if (error) {
    if (error.message.includes('Could not find the table')) {
      const legacy = await supabase
        .from('kahoot_live_sessions')
        .update({ questions })
        .eq('id', sessionId);
      if (legacy.error) return { error: legacy.error.message };
      return { error: null };
    }
    return { error: error.message };
  }

  return { error: null };
}
