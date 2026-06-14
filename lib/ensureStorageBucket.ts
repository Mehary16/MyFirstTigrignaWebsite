import { STORAGE_BUCKETS } from './storageBuckets';
import { createAdminSupabaseClient } from './supabaseAdmin';

export async function ensureStudentSubmissionsBucket() {
  const admin = createAdminSupabaseClient();
  if (!admin) return false;

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    console.error('Failed to list storage buckets:', listError.message);
    return false;
  }

  const exists = buckets?.some((bucket) => bucket.id === STORAGE_BUCKETS.studentSubmissions);
  if (exists) return true;

  const { error: createError } = await admin.storage.createBucket(STORAGE_BUCKETS.studentSubmissions, {
    public: true,
    fileSizeLimit: 52428800
  });

  if (createError) {
    console.error('Failed to create student-submissions bucket:', createError.message);
    return false;
  }

  return true;
}
