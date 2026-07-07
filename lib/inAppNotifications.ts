import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassGrade } from './classGrades';
import { buildNotificationLink } from './notificationLinks';
import { createAdminSupabaseClient } from './supabaseAdmin';

export type InAppNotificationType =
  | 'lesson'
  | 'assignment'
  | 'announcement'
  | 'submission'
  | 'live_class'
  | 'material';

export type InAppNotification = {
  id: string;
  recipient_id: string;
  type: InAppNotificationType;
  title: string;
  body: string | null;
  link_path: string;
  source_id: string | null;
  class_grade: string | null;
  read_at: string | null;
  created_at: string;
};

export type InAppNotificationResult = {
  configured: boolean;
  created: number;
  error?: string;
};

const STUDENT_TYPE_LABELS: Record<
  'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material',
  string
> = {
  lesson: 'New lesson',
  assignment: 'New homework',
  announcement: 'New announcement',
  live_class: 'New live class',
  material: 'New reading material'
};

const STUDENT_TYPE_PHRASES: Record<
  'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material',
  string
> = {
  lesson: 'lesson',
  assignment: 'homework',
  announcement: 'announcement',
  live_class: 'live class',
  material: 'reading material'
};

function isMissingNotificationsTable(message: string) {
  return message.includes('notifications') && (message.includes('does not exist') || message.includes('schema cache'));
}

function isMissingNotificationsFunction(message: string) {
  return message.includes('notify_students_in_grade') || message.includes('notify_teachers_of_submission');
}

function buildStudentNotificationCopy(payload: {
  type: 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';
  classGrade: ClassGrade;
  title: string;
  body?: string | null;
}) {
  const label = STUDENT_TYPE_LABELS[payload.type];
  return {
    title: `${label}: ${payload.title}`,
    body:
      payload.body?.trim() ||
      `Your teacher posted a new ${STUDENT_TYPE_PHRASES[payload.type]} for ${payload.classGrade}.`
  };
}

async function insertNotificationsWithAdmin(
  payload: {
    classGrade: ClassGrade;
    type: 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';
    title: string;
    body?: string | null;
    sourceId?: string | null;
  }
): Promise<InAppNotificationResult> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { configured: false, created: 0, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' };
  }

  const { data: students, error: studentsError } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'Student')
    .eq('class_grade', payload.classGrade)
    .or('is_active.eq.true,is_active.is.null');

  if (studentsError) {
    if (isMissingNotificationsTable(studentsError.message)) {
      return {
        configured: false,
        created: 0,
        error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
      };
    }
    return { configured: true, created: 0, error: studentsError.message };
  }

  if (!students?.length) {
    return {
      configured: true,
      created: 0,
      error: `No active students found in ${payload.classGrade}. Assign students to that grade first.`
    };
  }

  const copy = buildStudentNotificationCopy(payload);
  const linkPath = buildNotificationLink(payload.type, payload.sourceId);
  const rows = students.map((student) => ({
    recipient_id: student.id,
    type: payload.type,
    title: copy.title,
    body: copy.body,
    link_path: linkPath,
    source_id: payload.sourceId ?? null,
    class_grade: payload.classGrade
  }));

  const { error: insertError } = await admin.from('notifications').insert(rows);

  if (insertError) {
    if (isMissingNotificationsTable(insertError.message)) {
      return {
        configured: false,
        created: 0,
        error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
      };
    }
    return { configured: true, created: 0, error: insertError.message };
  }

  return { configured: true, created: rows.length };
}

async function insertNotificationsWithRpc(
  supabase: SupabaseClient,
  payload: {
    classGrade: ClassGrade;
    type: 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';
    title: string;
    body?: string | null;
    sourceId?: string | null;
  }
): Promise<InAppNotificationResult> {
  const copy = buildStudentNotificationCopy(payload);
  const linkPath = buildNotificationLink(payload.type, payload.sourceId);

  const { data, error } = await supabase.rpc('notify_students_in_grade', {
    p_class_grade: payload.classGrade,
    p_type: payload.type,
    p_title: copy.title,
    p_body: copy.body,
    p_link_path: linkPath,
    p_source_id: payload.sourceId ?? null
  });

  if (error) {
    if (isMissingNotificationsTable(error.message) || isMissingNotificationsFunction(error.message)) {
      return {
        configured: false,
        created: 0,
        error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
      };
    }
    return { configured: true, created: 0, error: error.message };
  }

  const created = typeof data === 'number' ? data : 0;
  if (!created) {
    return {
      configured: true,
      created: 0,
      error: `No active students found in ${payload.classGrade}. Assign students to that grade first.`
    };
  }

  return { configured: true, created };
}

export async function createStudentContentNotifications(
  supabase: SupabaseClient,
  payload: {
    classGrade: ClassGrade;
    type: 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';
    title: string;
    body?: string | null;
    sourceId?: string | null;
  }
): Promise<InAppNotificationResult> {
  const adminResult = await insertNotificationsWithAdmin(payload);
  if (adminResult.configured || adminResult.error?.includes('FIX_NOTIFICATIONS.sql')) {
    return adminResult;
  }

  return insertNotificationsWithRpc(supabase, payload);
}

export async function createTeacherSubmissionNotifications(
  supabase: SupabaseClient,
  payload: {
    submissionId: string;
    studentName: string;
    assignmentTitle?: string | null;
  }
): Promise<InAppNotificationResult> {
  const title = payload.assignmentTitle
    ? `New homework: ${payload.assignmentTitle}`
    : 'New homework submitted';
  const body = `${payload.studentName} submitted homework. Open the teacher dashboard to review it.`;

  const admin = createAdminSupabaseClient();
  if (admin) {
    const { data: teachers, error: teachersError } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'Teacher');

    if (teachersError) {
      if (isMissingNotificationsTable(teachersError.message)) {
        return {
          configured: false,
          created: 0,
          error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
        };
      }
      return { configured: true, created: 0, error: teachersError.message };
    }

    if (!teachers?.length) {
      return { configured: true, created: 0, error: 'No teacher accounts found.' };
    }

    const rows = teachers.map((teacher) => ({
      recipient_id: teacher.id,
      type: 'submission' as const,
      title,
      body,
      link_path: buildNotificationLink('submission', payload.submissionId),
      source_id: payload.submissionId
    }));

    const { error: insertError } = await admin.from('notifications').insert(rows);
    if (insertError) {
      if (isMissingNotificationsTable(insertError.message)) {
        return {
          configured: false,
          created: 0,
          error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
        };
      }
      return { configured: true, created: 0, error: insertError.message };
    }

    return { configured: true, created: rows.length };
  }

  const { data, error } = await supabase.rpc('notify_teachers_of_submission', {
    p_submission_id: payload.submissionId,
    p_title: title,
    p_body: body
  });

  if (error) {
    if (isMissingNotificationsTable(error.message) || isMissingNotificationsFunction(error.message)) {
      return {
        configured: false,
        created: 0,
        error: 'Run supabase/FIX_NOTIFICATIONS.sql in Supabase SQL Editor.'
      };
    }
    return { configured: true, created: 0, error: error.message };
  }

  return { configured: true, created: typeof data === 'number' ? data : 0 };
}

export async function fetchNotificationsForUser(supabase: SupabaseClient, userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, recipient_id, type, title, body, link_path, source_id, class_grade, read_at, created_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingNotificationsTable(error.message)) {
      return { data: [] as InAppNotification[], error: null, configured: false };
    }
    return { data: [] as InAppNotification[], error, configured: true };
  }

  return { data: (data ?? []) as InAppNotification[], error: null, configured: true };
}

export async function countUnreadNotifications(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);

  if (error) {
    if (isMissingNotificationsTable(error.message)) {
      return { count: 0, error: null, configured: false };
    }
    return { count: 0, error, configured: true };
  }

  return { count: count ?? 0, error: null, configured: true };
}

export function notificationTypeLabel(type: InAppNotificationType) {
  switch (type) {
    case 'lesson':
      return 'Lesson';
    case 'assignment':
      return 'Homework';
    case 'announcement':
      return 'Announcement';
    case 'submission':
      return 'Submission';
    case 'live_class':
      return 'Live class';
    case 'material':
      return 'Reading material';
    default:
      return 'Update';
  }
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
