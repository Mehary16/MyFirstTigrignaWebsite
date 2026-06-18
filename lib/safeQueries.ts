import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDatabaseError } from './supabaseErrors';
import type { MaterialRow } from './teacherMaterials';

type QueryError = { message: string } | null;

function isMissingColumnError(message: string, column: string) {
  return message.includes(column) || message.includes('schema cache');
}

export async function fetchDocumentsForDisplay(supabase: SupabaseClient) {
  const full = await supabase
    .from('documents')
    .select('id, title, file_url, external_link, material_category, file_name, created_at')
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { data: (full.data ?? []) as MaterialRow[], error: null as QueryError };
  }

  if (isMissingColumnError(full.error.message, 'file_name') || isMissingColumnError(full.error.message, 'material_category')) {
    const basic = await supabase
      .from('documents')
      .select('id, title, file_url, external_link, created_at')
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [] as MaterialRow[], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({
        ...row,
        material_category: 'document' as const,
        file_name: null
      })),
      error: null as QueryError
    };
  }

  return { data: [] as MaterialRow[], error: full.error };
}

export async function fetchStudentSubmissions(supabase: SupabaseClient, studentId: string) {
  const full = await supabase
    .from('submissions')
    .select('id, video_url, submission_type, file_name, notes, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { data: full.data ?? [], error: null as QueryError };
  }

  if (isMissingColumnError(full.error.message, 'submission_type') || isMissingColumnError(full.error.message, 'file_name')) {
    const basic = await supabase
      .from('submissions')
      .select('id, video_url, notes, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({
        ...row,
        submission_type: 'link',
        file_name: null
      })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchLessonsForDisplay(supabase: SupabaseClient) {
  const full = await supabase
    .from('lessons')
    .select('id, title, description, video_url, category, external_link, created_at')
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { data: full.data ?? [], error: null as QueryError };
  }

  if (
    isMissingColumnError(full.error.message, 'category') ||
    isMissingColumnError(full.error.message, 'external_link')
  ) {
    const basic = await supabase
      .from('lessons')
      .select('id, title, description, video_url, created_at')
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({
        ...row,
        category: null,
        external_link: null
      })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchStudentGrades(supabase: SupabaseClient, studentId: string) {
  const result = await supabase
    .from('grades')
    .select('id, title, grade, feedback, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!result.error) {
    return { data: result.data ?? [], error: null as QueryError };
  }

  if (isMissingColumnError(result.error.message, 'grades') || result.error.message.includes('does not exist')) {
    return { data: [], error: result.error };
  }

  return { data: [], error: result.error };
}

export function firstQueryError(errors: Array<QueryError | undefined>) {
  const hit = errors.find(Boolean);
  if (!hit) return null;
  const message = typeof hit.message === 'string' ? hit.message : 'An unexpected database error occurred.';
  return formatDatabaseError(message);
}
