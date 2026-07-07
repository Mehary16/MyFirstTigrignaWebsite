import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { ClassGrade } from './classGrades';
import { getAuthRedirectBaseUrl } from './siteUrl';

export type ContentNotificationType = 'lesson' | 'assignment' | 'announcement' | 'live_class' | 'material';

export type ContentNotificationPayload = {
  type: ContentNotificationType;
  classGrade: ClassGrade;
  title: string;
  description?: string | null;
  body?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
};

export type ContentNotificationResult = {
  configured: boolean;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

const TYPE_LABELS: Record<ContentNotificationType, string> = {
  lesson: 'New lesson',
  assignment: 'New homework',
  announcement: 'New announcement',
  live_class: 'New live class',
  material: 'New reading material'
};

const TYPE_PHRASES: Record<ContentNotificationType, string> = {
  lesson: 'lesson',
  assignment: 'homework',
  announcement: 'announcement',
  live_class: 'live class',
  material: 'reading material'
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || 'Tigrigna Learning Portal <onboarding@resend.dev>';
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatScheduledAt(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function buildEmailContent(payload: ContentNotificationPayload) {
  const label = TYPE_LABELS[payload.type];
  const phrase = TYPE_PHRASES[payload.type];
  const dashboardUrl = `${getAuthRedirectBaseUrl()}/student/dashboard`;
  const dueLine = payload.type === 'assignment' ? formatDueDate(payload.dueDate) : null;
  const scheduledLine = payload.type === 'live_class' ? formatScheduledAt(payload.scheduledAt) : null;
  const details =
    payload.type === 'announcement'
      ? payload.body
      : payload.type === 'live_class' || payload.type === 'material'
        ? payload.description
        : payload.description;

  const subject = `${label} for ${payload.classGrade}: ${payload.title}`;
  const textLines = [
    `Hello,`,
    ``,
    `Your teacher posted a new ${phrase} for ${payload.classGrade}.`,
    ``,
    `Title: ${payload.title}`,
    dueLine ? `Due date: ${dueLine}` : null,
    scheduledLine ? `Scheduled for: ${scheduledLine}` : null,
    details ? `` : null,
    details ? details : null,
    ``,
    `Sign in to view it: ${dashboardUrl}`,
    ``,
    `— Tigrigna Learning Portal`
  ].filter((line) => line !== null);

  const htmlDetails = details
    ? `<p style="margin: 16px 0; color: #334155; white-space: pre-wrap;">${escapeHtml(details)}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a; max-width: 560px;">
      <p>Hello,</p>
      <p>Your teacher posted a <strong>${escapeHtml(label.toLowerCase())}</strong> for <strong>${escapeHtml(payload.classGrade)}</strong>.</p>
      <p style="margin: 16px 0;"><strong>${escapeHtml(payload.title)}</strong></p>
      ${dueLine ? `<p style="margin: 0 0 16px; color: #334155;">Due date: ${escapeHtml(dueLine)}</p>` : ''}
      ${scheduledLine ? `<p style="margin: 0 0 16px; color: #334155;">Scheduled for: ${escapeHtml(scheduledLine)}</p>` : ''}
      ${htmlDetails}
      <p>
        <a href="${dashboardUrl}" style="display: inline-block; background: #047857; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 999px; font-weight: 600;">
          Open student dashboard
        </a>
      </p>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Tigrigna Learning Portal</p>
    </div>
  `;

  return { subject, text: textLines.join('\n'), html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function notifyStudentsOfNewContent(
  supabase: SupabaseClient,
  payload: ContentNotificationPayload
): Promise<ContentNotificationResult> {
  const resend = getResendClient();
  if (!resend) {
    return { configured: false, sent: 0, skipped: 0, failed: 0, errors: [] };
  }

  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_active')
    .eq('role', 'Student')
    .eq('class_grade', payload.classGrade);

  if (error) {
    return {
      configured: true,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [error.message]
    };
  }

  const recipients = (students ?? []).filter(
    (student) => student.is_active !== false && student.email?.trim()
  );

  const skipped = (students ?? []).length - recipients.length;
  if (!recipients.length) {
    return { configured: true, sent: 0, skipped, failed: 0, errors: [] };
  }

  const { subject, text, html } = buildEmailContent(payload);
  const from = getFromAddress();
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    recipients.map((student) =>
      resend.emails.send({
        from,
        to: student.email!.trim(),
        subject,
        text,
        html
      })
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && !result.value.error) {
      sent += 1;
      continue;
    }

    failed += 1;
    if (result.status === 'rejected') {
      errors.push(result.reason instanceof Error ? result.reason.message : 'Could not send email.');
    } else if (result.value.error) {
      errors.push(result.value.error.message);
    }
  }

  return { configured: true, sent, skipped, failed, errors };
}

export function formatNotificationStatus(result: ContentNotificationResult) {
  if (!result.configured) {
    return 'Content saved. Email notifications are not configured (add RESEND_API_KEY).';
  }

  const parts: string[] = [];
  if (result.sent) parts.push(`Email sent to ${result.sent} student${result.sent === 1 ? '' : 's'}`);
  if (result.skipped) parts.push(`${result.skipped} skipped (no email or inactive)`);
  if (result.failed) parts.push(`${result.failed} failed`);

  if (!parts.length) {
    return 'Content saved. No students with email addresses were found for this grade.';
  }

  return parts.join('. ') + '.';
}
