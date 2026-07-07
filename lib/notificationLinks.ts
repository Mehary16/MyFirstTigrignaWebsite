import type { InAppNotification, InAppNotificationType } from './inAppNotifications';

const GENERIC_LINK_PATHS = new Set(['/student/dashboard', '/teacher/dashboard', '/']);

export function buildNotificationLink(type: InAppNotificationType, sourceId?: string | null) {
  switch (type) {
    case 'lesson':
      return sourceId ? `/student/lessons/${sourceId}` : '/student/dashboard?focus=lessons';
    case 'assignment':
      return sourceId
        ? `/student/dashboard?focus=assignment&id=${sourceId}`
        : '/student/dashboard?focus=assignments';
    case 'announcement':
      return sourceId
        ? `/student/dashboard?focus=announcement&id=${sourceId}`
        : '/student/dashboard?focus=announcements';
    case 'live_class':
      return sourceId
        ? `/student/dashboard?focus=live-class&id=${sourceId}`
        : '/student/dashboard?focus=live-classes';
    case 'material':
      return sourceId
        ? `/student/dashboard?focus=material&id=${sourceId}`
        : '/student/dashboard?focus=materials';
    case 'submission':
      return sourceId
        ? `/teacher/dashboard?tab=homework&submission=${sourceId}`
        : '/teacher/dashboard?tab=homework';
    case 'grade':
      return sourceId
        ? `/student/dashboard?focus=grade&id=${sourceId}`
        : '/student/dashboard?focus=grades';
    default:
      return '/';
  }
}

export function resolveNotificationHref(notification: Pick<InAppNotification, 'type' | 'source_id' | 'link_path'>) {
  if (notification.link_path && !GENERIC_LINK_PATHS.has(notification.link_path)) {
    return notification.link_path;
  }

  return buildNotificationLink(notification.type, notification.source_id);
}

export function getScrollTargetId(searchParams: URLSearchParams) {
  const submissionId = searchParams.get('submission');
  if (submissionId) {
    return `submission-${submissionId}`;
  }

  const focus = searchParams.get('focus');
  const itemId = searchParams.get('id');

  if (focus && itemId) {
    const itemTargets: Record<string, string> = {
      assignment: `assignment-${itemId}`,
      announcement: `announcement-${itemId}`,
      'live-class': `live-class-${itemId}`,
      material: `material-${itemId}`,
      grade: `grade-${itemId}`
    };
    return itemTargets[focus] ?? null;
  }

  if (!focus) return null;

  const sectionTargets: Record<string, string> = {
    lessons: 'student-lessons',
    assignments: 'student-assignments',
    announcements: 'student-announcements',
    'live-classes': 'student-live-classes',
    materials: 'student-materials-documents',
    grades: 'student-grades'
  };

  return sectionTargets[focus] ?? null;
}

export function highlightScrollTarget(element: HTMLElement) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'transition-shadow');
  window.setTimeout(() => {
    element.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'transition-shadow');
  }, 2400);
}
