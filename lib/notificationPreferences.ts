import type { UserRole } from './routes';

export type NotificationPreferenceKey =
  | 'lessons'
  | 'homework'
  | 'announcements'
  | 'live_classes'
  | 'materials'
  | 'grades'
  | 'submissions';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lessons: true,
  homework: true,
  announcements: true,
  live_classes: true,
  materials: true,
  grades: true,
  submissions: true
};

const PREFERENCE_KEYS = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES) as NotificationPreferenceKey[];

const IN_APP_TYPE_TO_PREFERENCE: Partial<Record<string, NotificationPreferenceKey>> = {
  lesson: 'lessons',
  assignment: 'homework',
  announcement: 'announcements',
  live_class: 'live_classes',
  material: 'materials',
  grade: 'grades',
  submission: 'submissions'
};

export function parseNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const source = raw as Record<string, unknown>;
  const parsed = { ...DEFAULT_NOTIFICATION_PREFERENCES };

  for (const key of PREFERENCE_KEYS) {
    if (typeof source[key] === 'boolean') {
      parsed[key] = source[key];
    }
  }

  return parsed;
}

export function preferencesForRole(role: UserRole): NotificationPreferenceKey[] {
  switch (role) {
    case 'Teacher':
      return ['submissions', 'announcements'];
    case 'Parent':
      return ['announcements', 'live_classes', 'grades', 'homework'];
    default:
      return ['lessons', 'homework', 'announcements', 'live_classes', 'materials', 'grades'];
  }
}

export function preferenceLabel(key: NotificationPreferenceKey): string {
  switch (key) {
    case 'lessons':
      return 'New lessons';
    case 'homework':
      return 'Homework assignments';
    case 'announcements':
      return 'Announcements';
    case 'live_classes':
      return 'Live class reminders';
    case 'materials':
      return 'Reading materials';
    case 'grades':
      return 'Grade updates';
    case 'submissions':
      return 'Student homework submissions';
    default:
      return key;
  }
}

export function isNotificationTypeEnabled(
  preferences: NotificationPreferences,
  type: string
): boolean {
  const key = IN_APP_TYPE_TO_PREFERENCE[type];
  if (!key) return true;
  return preferences[key];
}

export function readPreferencesFromUserMetadata(
  metadata: Record<string, unknown> | null | undefined
): NotificationPreferences {
  return parseNotificationPreferences(metadata?.notification_preferences);
}
