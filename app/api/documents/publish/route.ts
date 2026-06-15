import { NextResponse } from 'next/server';
import { BUCKET_SETUP_MESSAGE, ensureLessonMaterialsBucket } from '../../../../lib/ensureStorageBucket';
import { isTeacherProfile, ensureTeacherProfileRole } from '../../../../lib/auth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { STORAGE_BUCKETS } from '../../../../lib/storageBuckets';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';
import { MAX_DOCUMENT_BYTES } from '../../../../lib/teacherMaterials';
import { formatUploadLimit } from '../../../../lib/uploadLimits';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to upload materials.' }, { status: 401 });
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'teacher@example.com';
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherProfile(profile, user.email, adminEmail)) {
    return NextResponse.json({ error: 'Only teachers can upload reading materials.' }, { status: 403 });
  }

  await ensureTeacherProfileRole(supabase, user.id, user.email, adminEmail, profile?.role);

  const formData = await request.formData();
  const title = String(formData.get('title') ?? '').trim();
  const externalLink = String(formData.get('externalLink') ?? '').trim();
  const file = formData.get('file');

  if (!title) {
    return NextResponse.json({ error: 'Document title is required.' }, { status: 400 });
  }

  if (!(file instanceof File) && !externalLink) {
    return NextResponse.json({ error: 'Upload a PDF or provide an external link.' }, { status: 400 });
  }

  let fileUrl = '';

  if (file instanceof File) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${formatUploadLimit(MAX_DOCUMENT_BYTES)}.` },
        { status: 400 }
      );
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 });
    }

    await ensureLessonMaterialsBucket();

    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.lessonMaterials)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/pdf'
      });

    if (uploadError) {
      const message = uploadError.message.includes('Bucket not found') ? BUCKET_SETUP_MESSAGE : uploadError.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKETS.lessonMaterials).getPublicUrl(uploadData.path);
    fileUrl = publicData.publicUrl;
  }

  const { error: insertError } = await supabase.from('documents').insert([
    {
      title,
      file_url: fileUrl || null,
      external_link: externalLink || null
    }
  ]);

  if (insertError) {
    return NextResponse.json({ error: formatDatabaseError(insertError.message) }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Document successfully uploaded.'
  });
}
