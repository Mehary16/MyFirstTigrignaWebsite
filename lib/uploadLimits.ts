/** Supabase Free plan: max 50 MB per file (global storage setting). */
export const MAX_FREE_FILE_BYTES = 50 * 1024 * 1024;

export function formatUploadLimit(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
