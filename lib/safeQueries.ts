import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassGrade } from './classGrades';
import { filterItemsByClassGrade } from './classGrades';
import { formatDatabaseError } from './supabaseErrors';
import type { MaterialRow } from './teacherMaterials';

type QueryError = { message: string } | null;

function isMissingTableError(message: string, table: string) {
  return message.includes(table) && (message.includes('does not exist') || message.includes('schema cache'));
}

function isMissingAssignmentsRelationshipError(message: string) {
  return message.includes('relationship') && message.includes('assignments');
}

function isMissingColumnError(message: string, column: string) {
  return message.includes(column) || message.includes('schema cache');
}

export async function fetchDocumentsForDisplay(supabase: SupabaseClient, classGrade?: ClassGrade | null) {
  const full = await supabase
    .from('documents')
    .select('id, title, file_url, external_link, material_category, file_name, class_grade, created_at')
    .order('created_at', { ascending: false });

  if (!full.error) {
    const rows = (full.data ?? []) as MaterialRow[];
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingColumnError(full.error.message, 'class_grade')) {
    const withoutGrade = await supabase
      .from('documents')
      .select('id, title, file_url, external_link, material_category, file_name, created_at')
      .order('created_at', { ascending: false });

    if (withoutGrade.error) {
      return { data: [] as MaterialRow[], error: withoutGrade.error };
    }

    const rows = (withoutGrade.data ?? []).map((row) => ({
      ...row,
      class_grade: null
    })) as MaterialRow[];

    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
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
    .select('id, video_url, submission_type, file_name, notes, assignment_id, teacher_feedback, feedback_at, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { data: full.data ?? [], error: null as QueryError };
  }

  if (
    isMissingColumnError(full.error.message, 'submission_type') ||
    isMissingColumnError(full.error.message, 'file_name') ||
    isMissingColumnError(full.error.message, 'assignment_id') ||
    isMissingColumnError(full.error.message, 'teacher_feedback')
  ) {
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
        file_name: null,
        assignment_id: null,
        teacher_feedback: null,
        feedback_at: null
      })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchLessonsForDisplay(supabase: SupabaseClient, classGrade?: ClassGrade | null) {
  const full = await supabase
    .from('lessons')
    .select('id, title, description, video_url, category, level, external_link, created_at')
    .order('created_at', { ascending: false });

  if (!full.error) {
    const rows = full.data ?? [];
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (
    isMissingColumnError(full.error.message, 'category') ||
    isMissingColumnError(full.error.message, 'external_link') ||
    isMissingColumnError(full.error.message, 'level')
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
        external_link: null,
        level: null
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

  if (isMissingTableError(result.error.message, 'grades')) {
    return { data: [], error: result.error };
  }

  return { data: [], error: result.error };
}

export async function fetchAssignments(supabase: SupabaseClient, classGrade?: ClassGrade | null) {
  const full = await supabase
    .from('assignments')
    .select('id, title, description, due_date, lesson_id, file_url, file_name, class_grade, created_at')
    .order('created_at', { ascending: false });

  if (!full.error) {
    const rows = full.data ?? [];
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingTableError(full.error.message, 'assignments')) {
    return { data: [], error: null as QueryError };
  }

  if (isMissingColumnError(full.error.message, 'class_grade')) {
    const basic = await supabase
      .from('assignments')
      .select('id, title, description, due_date, lesson_id, file_url, file_name, created_at')
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    const rows = (basic.data ?? []).map((row) => ({ ...row, class_grade: null }));
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingColumnError(full.error.message, 'file_url') || isMissingColumnError(full.error.message, 'file_name')) {
    const basic = await supabase
      .from('assignments')
      .select('id, title, description, due_date, lesson_id, created_at')
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({ ...row, file_url: null, file_name: null, class_grade: null })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchAnnouncements(supabase: SupabaseClient, classGrade?: ClassGrade | null) {
  const full = await supabase
    .from('announcements')
    .select('id, title, body, file_url, file_name, class_grade, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!full.error) {
    const rows = full.data ?? [];
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingTableError(full.error.message, 'announcements')) {
    return { data: [], error: null as QueryError };
  }

  if (isMissingColumnError(full.error.message, 'class_grade')) {
    const basic = await supabase
      .from('announcements')
      .select('id, title, body, file_url, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    const rows = (basic.data ?? []).map((row) => ({ ...row, class_grade: null }));
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingColumnError(full.error.message, 'file_url') || isMissingColumnError(full.error.message, 'file_name')) {
    const basic = await supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({ ...row, file_url: null, file_name: null, class_grade: null })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchLiveClasses(supabase: SupabaseClient, classGrade?: ClassGrade | null) {
  const full = await supabase
    .from('live_classes')
    .select('id, title, meeting_url, scheduled_at, duration_minutes, notes, class_grade, created_at')
    .order('scheduled_at', { ascending: true });

  if (!full.error) {
    const rows = full.data ?? [];
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  if (isMissingTableError(full.error.message, 'live_classes')) {
    return { data: [], error: null as QueryError };
  }

  if (isMissingColumnError(full.error.message, 'class_grade')) {
    const basic = await supabase
      .from('live_classes')
      .select('id, title, meeting_url, scheduled_at, duration_minutes, notes, created_at')
      .order('scheduled_at', { ascending: true });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    const rows = (basic.data ?? []).map((row) => ({ ...row, class_grade: null }));
    return {
      data: classGrade ? filterItemsByClassGrade(rows, classGrade) : rows,
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export async function fetchLessonViews(supabase: SupabaseClient, studentId: string) {
  const result = await supabase.from('lesson_views').select('lesson_id').eq('student_id', studentId);

  if (!result.error) {
    return { data: (result.data ?? []).map((row) => row.lesson_id), error: null as QueryError };
  }

  if (isMissingTableError(result.error.message, 'lesson_views')) {
    return { data: [], error: null as QueryError };
  }

  return { data: [], error: result.error };
}

export async function fetchChildSubmissionsForParent(supabase: SupabaseClient, studentId: string) {
  const full = await supabase
    .from('submissions')
    .select('id, video_url, submission_type, file_name, notes, teacher_feedback, feedback_at, created_at, assignment_id, assignments(title)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { data: full.data ?? [], error: null as QueryError };
  }

  if (
    isMissingColumnError(full.error.message, 'teacher_feedback') ||
    isMissingColumnError(full.error.message, 'assignment_id') ||
    isMissingAssignmentsRelationshipError(full.error.message)
  ) {
    const basic = await supabase
      .from('submissions')
      .select('id, video_url, submission_type, file_name, notes, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (basic.error) {
      return { data: [], error: basic.error };
    }

    return {
      data: (basic.data ?? []).map((row) => ({
        ...row,
        teacher_feedback: null,
        feedback_at: null,
        assignment_id: null,
        assignments: null
      })),
      error: null as QueryError
    };
  }

  return { data: [], error: full.error };
}

export function firstQueryError(errors: Array<QueryError | undefined>) {
  const hit = errors.find(Boolean);
  if (!hit) return null;
  const message = typeof hit.message === 'string' ? hit.message : 'An unexpected database error occurred.';
  return formatDatabaseError(message);
}
