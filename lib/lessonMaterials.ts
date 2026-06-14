import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDatabaseError } from './supabaseErrors';
import { STORAGE_BUCKETS } from './storageBuckets';

export const MAX_LESSON_PDF_BYTES = 15 * 1024 * 1024;

export async function uploadLessonMaterialPdf(supabase: SupabaseClient, userId: string, file: File) {
  if (file.size > MAX_LESSON_PDF_BYTES) {
    throw new Error('PDF is too large. Maximum size is 15 MB.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new Error('Please upload a PDF file.');
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const filePath = `${userId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.lessonMaterials).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/pdf'
  });

  if (error) {
    const message = error.message.includes('Bucket not found')
      ? 'Storage bucket is missing. Run supabase/RUN_THIS_FIRST.sql in the Supabase SQL Editor.'
      : formatDatabaseError(error.message);
    throw new Error(message);
  }

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKETS.lessonMaterials).getPublicUrl(data.path);
  return publicData.publicUrl;
}
