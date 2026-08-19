import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { isAllowedAlphabetAudioFilename } from '../../../../lib/alphabetAudioUpload';
import { isTeacherUser } from '../../../../lib/auth';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function POST(request: Request) {
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
      { error: 'Invalid filename. Use names like ba.mp3, ba-0.webm, sa.mp3, etc.' },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length) {
    return NextResponse.json({ error: 'Recording was empty. Try again.' }, { status: 400 });
  }

  if (bytes.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Recording is too large (max 2 MB).' }, { status: 400 });
  }

  const directory = path.join(process.cwd(), 'public', 'alphabet');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);

  return NextResponse.json({
    success: true,
    filename,
    publicPath: `/alphabet/${filename}`
  });
}
