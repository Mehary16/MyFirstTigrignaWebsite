import { NextResponse } from 'next/server';
import { ensureStudentSubmissionsBucket } from '../../../../lib/ensureStorageBucket';
import { STORAGE_BUCKETS } from '../../../../lib/storageBuckets';
import {
  SUBMISSION_MAX_BYTES,
  inferSubmissionTypeFromFile,
  type SubmissionType
} from '../../../../lib/submissionMedia';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to upload homework.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'Student' || profile.is_active === false) {
    return NextResponse.json({ error: 'Only active students can upload homework.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const submissionType = formData.get('submissionType') as SubmissionType | null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
  }

  if (!submissionType || submissionType === 'link') {
    return NextResponse.json({ error: 'Invalid submission type for file upload.' }, { status: 400 });
  }

  const detectedType = inferSubmissionTypeFromFile(file);
  if (detectedType !== submissionType) {
    return NextResponse.json({ error: 'File type does not match the selected submission type.' }, { status: 400 });
  }

  if (file.size > SUBMISSION_MAX_BYTES[submissionType]) {
    return NextResponse.json({ error: 'File is too large for this submission type.' }, { status: 400 });
  }

  await ensureStudentSubmissionsBucket();

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const filePath = `${user.id}/${Date.now()}-${safeName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.studentSubmissions)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });

  if (uploadError) {
    const message = uploadError.message.includes('Bucket not found')
      ? 'Storage is not set up yet. Ask your teacher to run supabase/SETUP.sql in the Supabase SQL Editor, or add SUPABASE_SERVICE_ROLE_KEY to enable auto-setup.'
      : uploadError.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKETS.studentSubmissions).getPublicUrl(uploadData.path);

  return NextResponse.json({
    mediaUrl: publicData.publicUrl,
    fileName: file.name
  });
}
