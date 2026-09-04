import { NextResponse } from 'next/server';
import { isAllowedAlphabetAudioFilename } from '../../../../lib/alphabetAudioUpload';
import { isTeacherUser } from '../../../../lib/auth';
import { BUCKET_SETUP_MESSAGE, ensureAlphabetAudioBucket } from '../../../../lib/ensureStorageBucket';
import { STORAGE_BUCKETS } from '../../../../lib/storageBuckets';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

const EXTENSION_TO_CONTENT_TYPE: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  mp3: 'audio/mpeg'
};

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const supabase = admin ?? (await createServerSupabaseClient());

    const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.alphabetAudio).list('', { limit: 1000 });

    if (error) {
      return NextResponse.json({ files: [] });
    }

    const files = (data ?? [])
      .map((entry) => entry.name)
      .filter((name) => isAllowedAlphabetAudioFilename(name));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Alphabet audio list failed:', error);
    return NextResponse.json({ files: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in as a teacher to record alphabet audio.' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

    if (!isTeacherUser(profile, user)) {
      return NextResponse.json({ error: 'Only teachers can upload alphabet pronunciation clips.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const filenameRaw = formData.get('filename');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const filename = typeof filenameRaw === 'string' ? filenameRaw.trim().toLowerCase() : '';
    if (!isAllowedAlphabetAudioFilename(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename. Use names like ba.mp3, ba-0.webm, aem-word.mp3, ka-v-a1b2c3d4.webm, etc.' },
        { status: 400 }
      );
    }

    if (!file.size) {
      return NextResponse.json({ error: 'Recording was empty. Hold Stop a moment after speaking, then try again.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Recording is too large (max 2 MB).' }, { status: 400 });
    }

    await ensureAlphabetAudioBucket();

    const extension = filename.split('.').pop()?.toLowerCase() ?? 'webm';
    const contentType = file.type || EXTENSION_TO_CONTENT_TYPE[extension] || 'application/octet-stream';
    const admin = createAdminSupabaseClient();
    const storageClient = admin ?? supabase;

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from(STORAGE_BUCKETS.alphabetAudio)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (uploadError) {
      const isRlsError = uploadError.message.toLowerCase().includes('row-level security');
      const message = uploadError.message.includes('Bucket not found')
        ? BUCKET_SETUP_MESSAGE
        : isRlsError
          ? 'Storage permission denied. Run supabase/FIX_ALPHABET_AUDIO_STORAGE.sql in the Supabase SQL Editor, then try again.'
          : uploadError.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: publicData } = storageClient.storage.from(STORAGE_BUCKETS.alphabetAudio).getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      filename,
      publicPath: publicData.publicUrl
    });
  } catch (error) {
    console.error('Alphabet audio upload failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save the recording. Please try again.' },
      { status: 500 }
    );
  }
}
