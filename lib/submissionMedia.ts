import type { SupabaseClient } from '@supabase/supabase-js';
import { readJsonResponse } from './readJsonResponse';
import { MAX_FREE_FILE_BYTES } from './uploadLimits';

export type SubmissionType = 'link' | 'video' | 'image' | 'document';

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  link: 'Video / media link',
  video: 'Short video clip',
  image: 'Image',
  document: 'Document'
};

export const SUBMISSION_ACCEPT: Record<Exclude<SubmissionType, 'link'>, string> = {
  video: 'video/mp4,video/webm,video/quicktime,video/*',
  image: 'image/jpeg,image/png,image/webp,image/gif,image/*',
  document: 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

export const SUBMISSION_MAX_BYTES: Record<Exclude<SubmissionType, 'link'>, number> = {
  video: MAX_FREE_FILE_BYTES,
  image: MAX_FREE_FILE_BYTES,
  document: MAX_FREE_FILE_BYTES
};

export const MAX_VIDEO_DURATION_SECONDS = 10 * 60;

export const VIDEO_TOO_LONG_MESSAGE = 'Your video is too big to upload. Maximum length is 10 minutes.';

export function inferSubmissionTypeFromFile(file: File): Exclude<SubmissionType, 'link'> {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSubmissionViewLabel(type: SubmissionType) {
  switch (type) {
    case 'image':
      return 'View image';
    case 'document':
      return 'View document';
    case 'video':
      return 'View video';
    default:
      return 'Open link';
  }
}

export function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read video file. Please try a different format.'));
    };

    video.src = objectUrl;
  });
}

export async function validateVideoDuration(file: File) {
  const duration = await getVideoDurationSeconds(file);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Could not read video length. Please try a different file.');
  }
  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error(VIDEO_TOO_LONG_MESSAGE);
  }
}

export async function uploadStudentSubmission(
  _supabase: SupabaseClient,
  _studentId: string,
  file: File,
  submissionType: Exclude<SubmissionType, 'link'>
) {
  const maxBytes = SUBMISSION_MAX_BYTES[submissionType];
  if (file.size > maxBytes) {
    throw new Error(`File is too large. Maximum size is ${formatFileSize(maxBytes)}.`);
  }

  if (submissionType === 'video') {
    await validateVideoDuration(file);
  }

  const body = new FormData();
  body.append('file', file);
  body.append('submissionType', submissionType);

  const response = await fetch('/api/submissions/upload', {
    method: 'POST',
    body
  });

  const payload = await readJsonResponse<{ mediaUrl?: string; fileName?: string; error?: string }>(response);

  if (!response.ok || !payload.mediaUrl) {
    throw new Error(payload.error ?? 'Upload failed.');
  }

  return {
    mediaUrl: payload.mediaUrl,
    fileName: payload.fileName ?? file.name
  };
}
