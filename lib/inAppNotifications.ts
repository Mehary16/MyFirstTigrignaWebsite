import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassGrade } from './classGrades';

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

export async function createStudentContentNotifications(
  supabase: SupabaseClient,
  payload: {
    classGrade: ClassGrade;
    type: 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';
    title: string;
    body?: string | null;
    sourceId?: string | null;
  }
): Promise<{ created: number; configured: boolean }> {
  const label = STUDENT_TYPE_LABELS[payload.type];
  const notificationTitle = `${label}: ${payload.title}`;
  const notificationBody =
    payload.body?.trim() ||
    `Your teacher posted a new ${STUDENT_TYPE_PHRASES[payload.type]} for ${payload.classGrade}.`;

  const { data, error } = await supabase.rpc('notify_students_in_grade', {
    p_class_grade: payload.classGrade,
    p_type: payload.type,
    p_title: notificationTitle,
    p_body: notificationBody,
    p_link_path: '/student/dashboard',
    p_source_id: payload.sourceId ?? null
  });

  if (error) {
    if (isMissingNotificationsTable(error.message) || isMissingNotificationsFunction(error.message)) {
      return { created: 0, configured: false };
    }
    return { created: 0, configured: true };
  }

  return { created: typeof data === 'number' ? data : 0, configured: true };
}

export async function createTeacherSubmissionNotifications(
  supabase: SupabaseClient,
  payload: {
    submissionId: string;
    studentName: string;
    assignmentTitle?: string | null;
  }
): Promise<{ created: number; configured: boolean }> {
  const title = payload.assignmentTitle
    ? `New homework: ${payload.assignmentTitle}`
    : 'New homework submitted';
  const body = `${payload.studentName} submitted homework. Open the teacher dashboard to review it.`;

  const { data, error } = await supabase.rpc('notify_teachers_of_submission', {
    p_submission_id: payload.submissionId,
    p_title: title,
    p_body: body
  });

  if (error) {
    if (isMissingNotificationsTable(error.message) || isMissingNotificationsFunction(error.message)) {
      return { created: 0, configured: false };
    }
    return { created: 0, configured: true };
  }

  return { created: typeof data === 'number' ? data : 0, configured: true };
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
