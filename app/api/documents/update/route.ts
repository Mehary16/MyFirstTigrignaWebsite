import { NextResponse } from 'next/server';
import { isTeacherUser } from '../../../../lib/auth';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!isTeacherUser(profile, user)) {
    return NextResponse.json({ error: 'Only teachers can edit materials.' }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string; title?: string; externalLink?: string | null };
  const id = body.id?.trim();
  const title = body.title?.trim();
  const externalLink = body.externalLink?.trim() || null;

  if (!id || !title) {
    return NextResponse.json({ error: 'Material id and title are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      title,
      external_link: externalLink
    })
    .eq('id', id)
    .select('id, title, file_url, external_link, material_category, file_name, created_at');

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  const material = data?.[0];
  if (!material) {
    return NextResponse.json(
      {
        error:
          'Could not save changes. Run supabase/FIX_DOCUMENTS_MANAGE.sql in the Supabase SQL Editor, then refresh and try again.'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, material });
}
