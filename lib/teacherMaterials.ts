import { formatUploadLimit, MAX_FREE_FILE_BYTES } from './uploadLimits';

export type MaterialCategory = 'document' | 'media';

export type MaterialRow = {
  id: string;
  title: string;
  file_url: string | null;
  external_link: string | null;
  material_category: MaterialCategory;
  file_name: string | null;
  created_at: string;
};
export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  document: 'Documents',
  media: 'Video / Audio'
};

export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.gif,.bmp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,text/plain,text/csv';

export const MEDIA_ACCEPT =
  'video/mp4,video/webm,video/quicktime,video/x-msvideo,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac,video/*,audio/*,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.aac';

/** Teacher document uploads — capped at Supabase Free plan limit */
export const MAX_DOCUMENT_BYTES = MAX_FREE_FILE_BYTES;

/** Teacher video/audio uploads — capped at Supabase Free plan limit */
export const MAX_MEDIA_BYTES = MAX_FREE_FILE_BYTES;

/** Supabase storage bucket limit for lesson-materials */
export const LESSON_MATERIALS_BUCKET_BYTES = MAX_FREE_FILE_BYTES;

const DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'rtf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'bmp'
]);

const MEDIA_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'm4a', 'aac']);

export { formatUploadLimit } from './uploadLimits';

export function getMaxUploadBytes(category: MaterialCategory) {  return category === 'document' ? MAX_DOCUMENT_BYTES : MAX_MEDIA_BYTES;
}

export function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export function inferMediaKind(file: File | null | undefined, fileUrl?: string | null, fileName?: string | null) {
  const name = file?.name ?? fileName ?? fileUrl ?? '';
  const type = file?.type ?? '';
  const extension = getFileExtension(name);

  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) {
    return 'audio' as const;
  }

  if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
    return 'video' as const;
  }

  return 'file' as const;
}

export function validateMaterialFile(file: File, category: MaterialCategory) {
  const extension = getFileExtension(file.name);
  const maxBytes = getMaxUploadBytes(category);
  const maxLabel = formatUploadLimit(maxBytes);

  if (file.size > maxBytes) {
    throw new Error(`File is too large. Maximum size is ${maxLabel}.`);
  }

  if (category === 'document') {
    const isDocument =
      file.type.startsWith('image/') ||
      file.type.startsWith('text/') ||
      DOCUMENT_EXTENSIONS.has(extension) ||
      file.type.includes('pdf') ||
      file.type.includes('word') ||
      file.type.includes('excel') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('powerpoint') ||
      file.type.includes('presentation');

    if (!isDocument) {
      throw new Error('Please upload a document file (PDF, Word, Excel, PowerPoint, image, or text file).');
    }
    return;
  }

  const isMedia =
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/') ||
    MEDIA_EXTENSIONS.has(extension);

  if (!isMedia) {
    throw new Error('Please upload a video or audio file (MP4, WebM, MOV, MP3, WAV, etc.).');
  }
}

export function getMaterialDownloadLabel(material: Pick<MaterialRow, 'material_category' | 'file_url' | 'file_name'>) {
  if (!material.file_url) return 'Open file';

  if (material.material_category === 'media') {
    return inferMediaKind(undefined, material.file_url, material.file_name) === 'audio' ? 'Play audio' : 'Play video';
  }

  return 'Download file';
}

export function normalizeMaterialCategory(value: string | null | undefined): MaterialCategory {
  return value === 'media' ? 'media' : 'document';
}
