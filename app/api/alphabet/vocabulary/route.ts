import { NextResponse } from 'next/server';
import { isAllowedVocabularyAudioFilename } from '../../../../lib/alphabetVocabulary';
import { isAllowedAlphabetAudioFilename } from '../../../../lib/alphabetAudioUpload';
import { isTeacherUser } from '../../../../lib/auth';
import { TIGRINYA_ALPHABET_FAMILIES } from '../../../../lib/tigrinyaAlphabetFamilies';
import { STORAGE_BUCKETS } from '../../../../lib/storageBuckets';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createAdminSupabaseClient } from '../../../../lib/supabaseAdmin';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

const FAMILY_IDS = new Set(TIGRINYA_ALPHABET_FAMILIES.map((family) => family.id));

function vocabularySetupMessage() {
  return 'Run supabase/FIX_ALPHABET_VOCABULARY.sql in the Supabase SQL Editor, then refresh and try again.';
}

function isMissingVocabularyTable(message: string) {
  return (
    message.includes('alphabet_vocabulary') &&
    (message.includes('does not exist') ||
      message.includes('Could not find the table') ||
      message.includes('schema cache'))
  );
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const familyId = new URL(request.url).searchParams.get('familyId')?.trim();
  if (!familyId || !FAMILY_IDS.has(familyId)) {
    return NextResponse.json({ error: 'A valid family id is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('alphabet_vocabulary')
    .select('id, family_id, word, transliteration, meaning, audio_filename, sort_order, created_at')
    .eq('family_id', familyId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingVocabularyTable(error.message)) {
      return NextResponse.json({
        error: vocabularySetupMessage(),
        words: []
      });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ words: data ?? [] });
}

type VocabularyBody = {
  familyId?: string;
  word?: string;
  transliteration?: string;
  meaning?: string;
  sortOrder?: number;
};

async function requireTeacher() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'You must be logged in.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!isTeacherUser(profile, user)) {
    return { error: NextResponse.json({ error: 'Only teachers can manage practice words.' }, { status: 403 }) };
  }

  return { supabase, db: createAdminSupabaseClient() ?? supabase, user };
}

export async function POST(request: Request) {
  const access = await requireTeacher();
  if ('error' in access && access.error) return access.error;

  const { supabase, user } = access;
  const body = (await request.json()) as VocabularyBody;
  const familyId = body.familyId?.trim();
  const word = body.word?.trim();
  const transliteration = body.transliteration?.trim() ?? '';
  const meaning = body.meaning?.trim() ?? '';

  if (!familyId || !FAMILY_IDS.has(familyId)) {
    return NextResponse.json({ error: 'A valid family id is required.' }, { status: 400 });
  }

  if (!word) {
    return NextResponse.json({ error: 'The Tigrinya word is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('alphabet_vocabulary')
    .insert({
      family_id: familyId,
      word,
      transliteration,
      meaning,
      sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
      created_by: user.id
    })
    .select('id, family_id, word, transliteration, meaning, audio_filename, sort_order, created_at')
    .single();

  if (error) {
    if (isMissingVocabularyTable(error.message)) {
      return NextResponse.json({ error: vocabularySetupMessage() }, { status: 500 });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ word: data });
}

export async function PATCH(request: Request) {
  const access = await requireTeacher();
  if ('error' in access && access.error) return access.error;

  const { db } = access;
  const body = (await request.json()) as VocabularyBody & { id?: string; audioFilename?: string | null };

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Word id is required.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.word !== undefined) {
    const word = body.word.trim();
    if (!word) return NextResponse.json({ error: 'Word cannot be empty.' }, { status: 400 });
    updates.word = word;
  }

  if (body.transliteration !== undefined) updates.transliteration = body.transliteration.trim();
  if (body.meaning !== undefined) updates.meaning = body.meaning.trim();
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (body.audioFilename !== undefined) {
    const filename = body.audioFilename?.trim().toLowerCase() ?? null;
    if (filename && !isAllowedVocabularyAudioFilename(filename) && !isAllowedAlphabetAudioFilename(filename)) {
      return NextResponse.json({ error: 'Invalid audio filename for this word.' }, { status: 400 });
    }
    updates.audio_filename = filename;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No changes were provided.' }, { status: 400 });
  }

  const { data, error } = await db
    .from('alphabet_vocabulary')
    .update(updates)
    .eq('id', id)
    .select('id, family_id, word, transliteration, meaning, audio_filename, sort_order, created_at')
    .maybeSingle();

  if (error) {
    if (isMissingVocabularyTable(error.message)) {
      return NextResponse.json({ error: vocabularySetupMessage() }, { status: 500 });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Word not found.' }, { status: 404 });
  }

  return NextResponse.json({ word: data });
}

export async function DELETE(request: Request) {
  const access = await requireTeacher();
  if ('error' in access && access.error) return access.error;

  const { db } = access;
  const id = new URL(request.url).searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Word id is required.' }, { status: 400 });
  }

  const { data: existing } = await db
    .from('alphabet_vocabulary')
    .select('audio_filename')
    .eq('id', id)
    .maybeSingle();

  const { error } = await db.from('alphabet_vocabulary').delete().eq('id', id);

  if (error) {
    if (isMissingVocabularyTable(error.message)) {
      return NextResponse.json({ error: vocabularySetupMessage() }, { status: 500 });
    }
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  const audioFilename = existing?.audio_filename;
  if (audioFilename) {
    await db.storage.from(STORAGE_BUCKETS.alphabetAudio).remove([audioFilename]);
  }

  return NextResponse.json({ success: true });
}
