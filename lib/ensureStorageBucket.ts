import { STORAGE_BUCKETS } from './storageBuckets';
import { createAdminSupabaseClient } from './supabaseAdmin';

type BucketConfig = {
  id: string;
  fileSizeLimit: number;
};

async function ensureBucket({ id, fileSizeLimit }: BucketConfig) {
  const admin = createAdminSupabaseClient();
  if (!admin) return false;

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    console.error(`Failed to list storage buckets: ${listError.message}`);
    return false;
  }

  const exists = buckets?.some((bucket) => bucket.id === id);
  if (exists) return true;

  const { error: createError } = await admin.storage.createBucket(id, {
    public: true,
    fileSizeLimit
  });

  if (createError) {
    console.error(`Failed to create ${id} bucket: ${createError.message}`);
    return false;
  }

  return true;
}

export async function ensureStudentSubmissionsBucket() {
  return ensureBucket({
    id: STORAGE_BUCKETS.studentSubmissions,
    fileSizeLimit: 52428800
  });
}

export async function ensureLessonMaterialsBucket() {
  return ensureBucket({
    id: STORAGE_BUCKETS.lessonMaterials,
    fileSizeLimit: 15728640
  });
}

export async function ensureAllStorageBuckets() {
  const [studentBucket, lessonBucket] = await Promise.all([
    ensureStudentSubmissionsBucket(),
    ensureLessonMaterialsBucket()
  ]);

  return studentBucket && lessonBucket;
}

export const BUCKET_SETUP_MESSAGE =
  'Storage is not set up yet. Run supabase/migrations/003_parents_grades_storage.sql in the Supabase SQL Editor, or add SUPABASE_SERVICE_ROLE_KEY to .env.local for auto-setup.';
