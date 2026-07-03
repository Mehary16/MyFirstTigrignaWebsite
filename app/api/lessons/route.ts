import { NextResponse } from 'next/server';
import { formatDatabaseError } from '../../../lib/supabaseErrors';
import { requireTeacherApi } from '../../../lib/lessonApiAuth';
import { revalidateLessonCaches } from '../../../lib/revalidateLessons';

type CreateLessonBody = {
  title?: string;
  description?: string;
  category?: string;
  level?: string | null;
  videoUrl?: string;
  externalLink?: string;
};

export async function POST(request: Request) {
  const auth = await requireTeacherApi();
  if ('error' in auth && auth.error) {
    return auth.error;
  }

  const { supabase } = auth;
  const body = (await request.json()) as CreateLessonBody;
  const title = body.title?.trim();
  const videoUrl = body.videoUrl?.trim();

  if (!title || !videoUrl) {
    return NextResponse.json({ error: 'Title and video URL are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title,
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      level: body.level?.trim() || null,
      video_url: videoUrl,
      external_link: body.externalLink?.trim() || null
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: formatDatabaseError(error?.message) }, { status: 500 });
  }

  revalidateLessonCaches(data.id);

  return NextResponse.json({ success: true, id: data.id });
}
